"""JWT token verification using JWKS from Better Auth."""

import jwt
from jwt.exceptions import InvalidTokenError, DecodeError
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
import httpx
import logging
from typing import Optional
from datetime import datetime, timedelta
from core.config import JWKS_URL, JWT_ISSUER, JWT_AUDIENCE, JWKS_CACHE_TTL_SECONDS
from core.constants import ErrorMessages
from core.exceptions import AuthenticationError, JWKSError
from utils.crypto import base64url_decode

logger = logging.getLogger(__name__)

# Cache for JWKS with expiration
_jwks_cache: Optional[dict] = None
_cached_kids: set = set()
_cache_expires_at: Optional[datetime] = None


def _is_cache_valid() -> bool:
    """Check if JWKS cache is still valid."""
    if _jwks_cache is None or _cache_expires_at is None:
        return False
    return datetime.utcnow() < _cache_expires_at


async def get_jwks(
    force_refresh: bool = False,
    http_client: Optional[httpx.AsyncClient] = None
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
    global _jwks_cache, _cached_kids, _cache_expires_at
    
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
        _cache_expires_at = datetime.utcnow() + timedelta(seconds=JWKS_CACHE_TTL_SECONDS)
        
        logger.info(f"JWKS cache updated. Expires at {_cache_expires_at}")
        return _jwks_cache
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching JWKS: {str(e)}", exc_info=True)
        raise JWKSError(f"{ErrorMessages.JWKS_FETCH_FAILED}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error fetching JWKS: {str(e)}", exc_info=True)
        raise JWKSError(f"{ErrorMessages.JWKS_FETCH_FAILED}: {str(e)}")


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
        if key.get("kid") == kid:
            if key.get("kty") == "OKP" and key.get("crv") == "Ed25519":
                # Decode the public key from base64url
                x = base64url_decode(key["x"])
                public_key = Ed25519PublicKey.from_public_bytes(x)
                return public_key
    
    error_msg = ErrorMessages.JWKS_KEY_NOT_FOUND.format(kid=kid)
    raise ValueError(error_msg)


async def verify_token_string(
    token: str,
    http_client: Optional[httpx.AsyncClient] = None
) -> dict:
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
            logger.warning(f"Failed to decode token payload for inspection: {str(e)}")
        
        # Fetch JWKS, refresh if kid is not in cache or cache expired
        force_refresh = (
            not _is_cache_valid() or
            (_jwks_cache is not None and kid not in _cached_kids)
        )
        
        if force_refresh:
            logger.info(f"Refreshing JWKS cache - {'expired' if not _is_cache_valid() else f'kid {kid} not found'}")
        
        jwks = await get_jwks(force_refresh=force_refresh, http_client=http_client)
        logger.info(f"JWKS fetched successfully, {len(jwks.get('keys', []))} keys available")
        
        # Get the Ed25519 public key for this kid
        try:
            public_key = get_public_key_from_jwks(jwks, kid)
            logger.info(f"Ed25519 public key extracted successfully for kid: {kid}")
        except ValueError as e:
            logger.error(f"Failed to extract public key: {str(e)}")
            raise AuthenticationError(str(e))
        
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
        return payload
    except AuthenticationError:
        raise
    except JWKSError:
        raise
    except (InvalidTokenError, DecodeError) as e:
        logger.error(f"JWT verification error: {str(e)}", exc_info=True)
        raise AuthenticationError(f"{ErrorMessages.AUTH_TOKEN_INVALID}: {str(e)}")
    except ValueError as e:
        logger.error(f"Value error during token verification: {str(e)}", exc_info=True)
        raise AuthenticationError(f"{ErrorMessages.AUTH_TOKEN_VERIFICATION_FAILED}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}", exc_info=True)
        raise AuthenticationError(f"{ErrorMessages.AUTH_TOKEN_VERIFICATION_ERROR}: {str(e)}")

