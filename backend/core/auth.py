"""JWT token verification using JWKS from Better Auth."""

from datetime import UTC, datetime, timedelta
import logging
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
import httpx
import jwt
from jwt.exceptions import DecodeError, InvalidTokenError

from core.config import (
    BETTER_AUTH_VERIFY_API_KEY_URL,
    JWKS_CACHE_TTL_SECONDS,
    JWKS_URL,
    JWT_AUDIENCE,
    JWT_ISSUER,
)
from core.constants import ErrorMessages
from core.exceptions import AuthenticationError, JWKSError
from utils.crypto import base64url_decode

logger = logging.getLogger(__name__)

# Cache for JWKS with expiration
_jwks_cache: dict | None = None
_cached_kids: set = set()
_cache_expires_at: datetime | None = None


def _is_cache_valid() -> bool:
    """Check if JWKS cache is still valid."""
    if _jwks_cache is None or _cache_expires_at is None:
        return False
    return datetime.now(tz=UTC) < _cache_expires_at


async def get_jwks(
    force_refresh: bool = False, http_client: httpx.AsyncClient | None = None
) -> dict:
    """
    Fetch JWKS from better-auth endpoint with caching and TTL.

    Args:
        force_refresh: Force refresh of cache
        http_client: Optional HTTP client to use

    Returns:
        JWKS data dictionary

    Raises:
        JWKSError: If JWKS fetch fails
    """
    global _jwks_cache, _cached_kids, _cache_expires_at  # noqa: PLW0603

    # Check cache validity
    if not force_refresh and _is_cache_valid():
        return _jwks_cache

    try:
        # Use provided client or create temporary one
        if http_client is None:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(JWKS_URL)
                response.raise_for_status()
                jwks_data = response.json()
        else:
            response = await http_client.get(JWKS_URL)
            response.raise_for_status()
            jwks_data = response.json()

        # Update cache
        _jwks_cache = jwks_data
        _cached_kids = {key.get("kid") for key in jwks_data.get("keys", []) if key.get("kid")}
        _cache_expires_at = datetime.now(tz=UTC) + timedelta(seconds=JWKS_CACHE_TTL_SECONDS)

        logger.info(f"JWKS cache updated. Expires at {_cache_expires_at}")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching JWKS: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.JWKS_FETCH_FAILED}: {e!s}"
        raise JWKSError(error_msg) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching JWKS: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.JWKS_FETCH_FAILED}: {e!s}"
        raise JWKSError(error_msg) from e
    else:
        return _jwks_cache


def get_public_key_from_jwks(jwks: dict, kid: str) -> Ed25519PublicKey:
    """
    Extract and construct Ed25519 public key from JWKS for a given key ID.

    Args:
        jwks: JWKS data dictionary
        kid: Key ID to look up

    Returns:
        Ed25519PublicKey instance

    Raises:
        ValueError: If key not found
    """
    keys = jwks.get("keys", [])

    for key in keys:
        if key.get("kid") == kid and key.get("kty") == "OKP" and key.get("crv") == "Ed25519":
            # Decode the public key from base64url
            x = base64url_decode(key["x"])
            return Ed25519PublicKey.from_public_bytes(x)

    error_msg = ErrorMessages.JWKS_KEY_NOT_FOUND.format(kid=kid)
    raise ValueError(error_msg)


async def verify_token_string(token: str, http_client: httpx.AsyncClient | None = None) -> dict:
    """
    Verify JWT token string using JWKS from better-auth.

    Args:
        token: JWT token string
        http_client: Optional HTTP client to use

    Returns:
        Decoded token payload

    Raises:
        AuthenticationError: If token verification fails
        JWKSError: If JWKS fetch fails
    """
    try:
        # Decode token header to get the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        alg = unverified_header.get("alg")

        logger.info(f"Token header - kid: {kid}, alg: {alg}")

        if not kid:
            logger.error("Token missing key ID (kid)")
            raise AuthenticationError(ErrorMessages.AUTH_TOKEN_MISSING_KID)

        # Decode token without verification to check issuer/audience
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_issuer = unverified_payload.get("iss")
            token_audience = unverified_payload.get("aud")
            logger.info(f"Token payload - iss: {token_issuer}, aud: {token_audience}")
            logger.info(f"Expected - iss: {JWT_ISSUER}, aud: {JWT_AUDIENCE}")
        except Exception as e:
            logger.warning(f"Failed to decode token payload for inspection: {e!s}")

        # Fetch JWKS, refresh if kid is not in cache or cache expired
        force_refresh = not _is_cache_valid() or (
            _jwks_cache is not None and kid not in _cached_kids
        )

        if force_refresh:
            logger.info(
                f"Refreshing JWKS cache - {'expired' if not _is_cache_valid() else f'kid {kid} not found'}"
            )

        jwks = await get_jwks(force_refresh=force_refresh, http_client=http_client)
        logger.info(f"JWKS fetched successfully, {len(jwks.get('keys', []))} keys available")

        # Get the Ed25519 public key for this kid
        try:
            public_key = get_public_key_from_jwks(jwks, kid)
            logger.info(f"Ed25519 public key extracted successfully for kid: {kid}")
        except ValueError as e:
            logger.exception("Failed to extract public key")
            raise AuthenticationError(str(e)) from e

        # Verify token with PyJWT
        logger.info("Attempting to verify token with EdDSA algorithm using PyJWT")

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["EdDSA"],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
        )

        logger.info("Token verified successfully")
    except AuthenticationError:
        raise
    except JWKSError:
        raise
    except (InvalidTokenError, DecodeError) as e:
        logger.error(f"JWT verification error: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.AUTH_TOKEN_INVALID}: {e!s}"
        raise AuthenticationError(error_msg) from e
    except ValueError as e:
        logger.error(f"Value error during token verification: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.AUTH_TOKEN_VERIFICATION_FAILED}: {e!s}"
        raise AuthenticationError(error_msg) from e
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.AUTH_TOKEN_VERIFICATION_ERROR}: {e!s}"
        raise AuthenticationError(error_msg) from e
    else:
        return payload


async def verify_api_key(
    api_key: str,
    required_permissions: dict[str, list[str]] | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    """
    Verify API key using Better Auth's verify endpoint.

    Args:
        api_key: API key string to verify
        required_permissions: Optional dict of required permissions to check
                             Format: {resource: [action1, action2, ...]}
        http_client: Optional HTTP client to use

    Returns:
        Dictionary containing API key data:
        - user_id: User ID associated with the API key
        - key_id: API key ID
        - permissions: API key permissions (dict format)
        - metadata: API key metadata
        - Other fields from Better Auth response

    Raises:
        AuthenticationError: If API key verification fails or permissions are insufficient
    """
    if not api_key:
        logger.error("API key is empty")
        raise AuthenticationError(ErrorMessages.API_KEY_MISSING)

    try:
        # Prepare request body
        request_body: dict[str, Any] = {"key": api_key}
        if required_permissions:
            request_body["permissions"] = required_permissions
            logger.info(f"Verifying API key with required permissions: {required_permissions}")
        else:
            logger.info("Verifying API key without permission checks")

        # Make request to Better Auth verify endpoint
        if http_client is None:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    BETTER_AUTH_VERIFY_API_KEY_URL,
                    json=request_body,
                    headers={"Content-Type": "application/json"},
                )
        else:
            response = await http_client.post(
                BETTER_AUTH_VERIFY_API_KEY_URL,
                json=request_body,
                headers={"Content-Type": "application/json"},
            )

        # Check response status
        if response.status_code == 401:
            logger.warning("API key verification failed: Unauthorized")
            raise AuthenticationError(ErrorMessages.API_KEY_INVALID)
        if response.status_code == 403:
            logger.warning("API key verification failed: Insufficient permissions")
            raise AuthenticationError(ErrorMessages.API_KEY_INSUFFICIENT_PERMISSIONS)

        response.raise_for_status()

        # Parse response
        try:
            response_data = response.json()
        except Exception as e:
            logger.exception("Failed to parse API key verification response")
            error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_FAILED}: Invalid response format"
            raise AuthenticationError(error_msg) from e

        # Check if verification was successful
        if not response_data.get("valid", False):
            error_info = response_data.get("error")
            if error_info:
                error_message = error_info.get("message", ErrorMessages.API_KEY_INVALID)
                logger.warning(f"API key verification failed: {error_message}")
                raise AuthenticationError(error_message)
            logger.warning("API key verification failed: Invalid key")
            raise AuthenticationError(ErrorMessages.API_KEY_INVALID)

        # Extract key data from response
        key_data = response_data.get("key", {})
        if not key_data:
            logger.error("API key verification response missing key data")
            error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_FAILED}: Missing key data"
            raise AuthenticationError(error_msg)

        # Build structured response
        api_key_data: dict[str, Any] = {
            "user_id": key_data.get("userId") or key_data.get("user_id"),
            "key_id": key_data.get("id") or key_data.get("keyId"),
            "permissions": key_data.get("permissions", {}),
            "metadata": key_data.get("metadata", {}),
            "name": key_data.get("name"),
            "prefix": key_data.get("prefix"),
            "enabled": key_data.get("enabled", True),
        }

        # Ensure user_id is present
        if not api_key_data["user_id"]:
            logger.error("API key verification response missing user_id")
            error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_FAILED}: Missing user_id"
            raise AuthenticationError(error_msg)

        logger.info(
            f"API key verified successfully. User ID: {api_key_data['user_id']}, "
            f"Key ID: {api_key_data['key_id']}"
        )

    except AuthenticationError:
        raise
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error verifying API key: {e.response.status_code} - {e!s}", exc_info=True
        )
        if e.response.status_code == 401:
            raise AuthenticationError(ErrorMessages.API_KEY_INVALID) from e
        if e.response.status_code == 403:
            raise AuthenticationError(ErrorMessages.API_KEY_INSUFFICIENT_PERMISSIONS) from e
        error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_FAILED}: HTTP {e.response.status_code}"
        raise AuthenticationError(error_msg) from e
    except httpx.HTTPError as e:
        logger.error(f"HTTP error verifying API key: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_FAILED}: {e!s}"
        raise AuthenticationError(error_msg) from e
    except Exception as e:
        logger.error(f"Unexpected error verifying API key: {e!s}", exc_info=True)
        error_msg = f"{ErrorMessages.API_KEY_VERIFICATION_ERROR}: {e!s}"
        raise AuthenticationError(error_msg) from e
    else:
        return api_key_data
