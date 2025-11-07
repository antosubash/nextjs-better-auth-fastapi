from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import InvalidTokenError, DecodeError
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
import httpx
import logging
from typing import Optional
from config import JWKS_URL, JWT_ISSUER, JWT_AUDIENCE

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Cache for JWKS
_jwks_cache: Optional[dict] = None
_cached_kids: set = set()


async def get_jwks(force_refresh: bool = False) -> dict:
    """Fetch JWKS from better-auth endpoint with caching."""
    global _jwks_cache, _cached_kids
    
    if _jwks_cache is not None and not force_refresh:
        return _jwks_cache
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL, timeout=5.0)
            response.raise_for_status()
            jwks_data = response.json()
            _jwks_cache = jwks_data
            # Cache the key IDs for quick lookup
            _cached_kids = {key.get("kid") for key in jwks_data.get("keys", []) if key.get("kid")}
            return _jwks_cache
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch JWKS: {str(e)}"
        )


def base64url_decode(data: str) -> bytes:
    """Decode base64url string to bytes."""
    # Add padding if needed
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    # Replace URL-safe characters
    data = data.replace("-", "+").replace("_", "/")
    return base64.b64decode(data)


def get_public_key_from_jwks(jwks: dict, kid: str) -> Ed25519PublicKey:
    """Extract and construct Ed25519 public key from JWKS for a given key ID."""
    keys = jwks.get("keys", [])
    
    for key in keys:
        if key.get("kid") == kid:
            if key.get("kty") == "OKP" and key.get("crv") == "Ed25519":
                # Decode the public key from base64url
                x = base64url_decode(key["x"])
                public_key = Ed25519PublicKey.from_public_bytes(x)
                return public_key
    
    raise ValueError(f"Key with kid '{kid}' not found in JWKS")


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify JWT token using JWKS from better-auth."""
    token = credentials.credentials
    
    try:
        # Decode token header to get the key ID (kid) - PyJWT way
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        alg = unverified_header.get("alg")
        
        logger.info(f"Token header - kid: {kid}, alg: {alg}")
        
        if not kid:
            logger.error("Token missing key ID (kid)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID (kid)"
            )
        
        # Decode token without verification to check issuer/audience
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_issuer = unverified_payload.get("iss")
            token_audience = unverified_payload.get("aud")
            logger.info(f"Token payload - iss: {token_issuer}, aud: {token_audience}")
            logger.info(f"Expected - iss: {JWT_ISSUER}, aud: {JWT_AUDIENCE}")
        except Exception as e:
            logger.warning(f"Failed to decode token payload for inspection: {str(e)}")
        
        # Fetch JWKS, refresh if kid is not in cache
        force_refresh = _jwks_cache is not None and kid not in _cached_kids
        if force_refresh:
            logger.info(f"Refreshing JWKS cache - kid {kid} not found in cached keys")
        jwks = await get_jwks(force_refresh=force_refresh)
        logger.info(f"JWKS fetched successfully, {len(jwks.get('keys', []))} keys available")
        
        # Get the Ed25519 public key for this kid
        try:
            public_key = get_public_key_from_jwks(jwks, kid)
            logger.info(f"Ed25519 public key extracted successfully for kid: {kid}")
        except ValueError as e:
            logger.error(f"Failed to extract public key: {str(e)}")
            raise
        
        # PyJWT supports Ed25519 keys directly from cryptography
        logger.info("Attempting to verify token with EdDSA algorithm using PyJWT")
        
        # PyJWT accepts cryptography key objects directly
        # PyJWT API: decode(token, key, algorithms, issuer, audience, options)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["EdDSA"],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
        )
        
        logger.info("Token verified successfully")
        return payload
    except HTTPException:
        raise
    except (InvalidTokenError, DecodeError) as e:
        logger.error(f"JWT verification error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Value error during token verification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {str(e)}"
        )

