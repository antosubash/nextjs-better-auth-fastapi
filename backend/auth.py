from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from jose.utils import base64url_decode
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
import httpx
from typing import Optional
from config import JWKS_URL, JWT_ISSUER, JWT_AUDIENCE

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


def get_public_key_from_jwks(jwks: dict, kid: str) -> Ed25519PublicKey:
    """Extract public key from JWKS for a given key ID."""
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
        # Decode token header to get the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing key ID (kid)"
            )
        
        # Fetch JWKS, refresh if kid is not in cache
        force_refresh = _jwks_cache is not None and kid not in _cached_kids
        jwks = await get_jwks(force_refresh=force_refresh)
        
        # Get the public key for this kid
        public_key = get_public_key_from_jwks(jwks, kid)
        
        # Serialize public key in PEM format for jose
        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Verify and decode the token
        # python-jose supports Ed25519 when cryptography is installed
        payload = jwt.decode(
            token,
            public_key_pem,
            algorithms=["EdDSA"],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={"verify_signature": True, "verify_iss": True, "verify_aud": True}
        )
        
        return payload
    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification error: {str(e)}"
        )

