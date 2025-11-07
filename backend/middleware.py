from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging
from typing import Set
from auth import verify_token_string

logger = logging.getLogger(__name__)

# Routes that don't require JWT authentication
PUBLIC_ROUTES: Set[str] = {"/", "/docs", "/openapi.json", "/redoc"}


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to validate JWT tokens for protected routes."""

    def __init__(self, app: ASGIApp, excluded_paths: Set[str] = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or PUBLIC_ROUTES

    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        logger.info(f"JWT middleware: {method} {path} from {client_ip}")
        
        # Check if the route should be excluded from JWT validation
        if path in self.excluded_paths:
            logger.debug(f"Route {path} is excluded from JWT validation")
            return await call_next(request)

        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            logger.warning(f"Authorization header missing for {method} {path} from {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authorization header missing"},
            )

        # Check if it's a Bearer token
        if not authorization.startswith("Bearer "):
            logger.warning(
                f"Invalid authorization scheme for {method} {path} from {client_ip}. "
                f"Received: {authorization[:20]}..."
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid authorization scheme. Expected 'Bearer'"},
            )

        # Extract the token
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            logger.warning(f"Token missing in Authorization header for {method} {path} from {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token missing"},
            )

        # Verify the token
        logger.debug(f"Validating JWT token for {method} {path} from {client_ip}")
        try:
            token_payload = await verify_token_string(token)
            # Store token payload in request state for use in route handlers
            request.state.token_data = token_payload
            
            user_id = token_payload.get("sub") or token_payload.get("id", "unknown")
            logger.info(
                f"JWT token validated successfully for {method} {path} from {client_ip}. "
                f"User ID: {user_id}"
            )
        except HTTPException as e:
            logger.warning(
                f"JWT validation failed for {method} {path} from {client_ip}: "
                f"{e.status_code} - {e.detail}"
            )
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail},
            )
        except Exception as e:
            logger.error(
                f"Unexpected error in JWT middleware for {method} {path} from {client_ip}: {str(e)}",
                exc_info=True
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token verification failed"},
            )

        # Continue with the request
        logger.debug(f"Request proceeding to handler for {method} {path}")
        return await call_next(request)

