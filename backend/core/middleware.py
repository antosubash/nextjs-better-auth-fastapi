"""Middleware for JWT authentication and request tracing."""

import uuid
import logging
from typing import Set
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from core.auth import verify_token_string
from core.constants import ErrorMessages
from core.config import PUBLIC_ROUTES

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to all requests."""
    
    async def dispatch(self, request: Request, call_next):
        """Add request ID to request state and logs."""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add request ID to logger context
        old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record
        
        logging.setLogRecordFactory(record_factory)
        
        try:
            response = await call_next(request)
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            # Restore original factory
            logging.setLogRecordFactory(old_factory)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to validate JWT tokens for protected routes."""
    
    def __init__(self, app: ASGIApp, excluded_paths: Set[str] = None):
        """
        Initialize JWT auth middleware.
        
        Args:
            app: ASGI application
            excluded_paths: Set of paths to exclude from JWT validation
        """
        super().__init__(app)
        self.excluded_paths = excluded_paths or PUBLIC_ROUTES
    
    async def dispatch(self, request: Request, call_next):
        """Validate JWT token for protected routes."""
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")
        
        logger.info(
            f"JWT middleware: {method} {path} from {client_ip}",
            extra={"request_id": request_id}
        )
        
        # Check if the route should be excluded from JWT validation
        if path in self.excluded_paths:
            logger.debug(
                f"Route {path} is excluded from JWT validation",
                extra={"request_id": request_id}
            )
            return await call_next(request)
        
        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            logger.warning(
                f"Authorization header missing for {method} {path} from {client_ip}",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": ErrorMessages.AUTH_HEADER_MISSING,
                    "request_id": request_id
                },
            )
        
        # Check if it's a Bearer token
        if not authorization.startswith("Bearer "):
            logger.warning(
                f"Invalid authorization scheme for {method} {path} from {client_ip}. "
                f"Received: {authorization[:20]}...",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": ErrorMessages.AUTH_INVALID_SCHEME,
                    "request_id": request_id
                },
            )
        
        # Extract the token
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            logger.warning(
                f"Token missing in Authorization header for {method} {path} from {client_ip}",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": ErrorMessages.AUTH_TOKEN_MISSING,
                    "request_id": request_id
                },
            )
        
        # Verify the token
        logger.debug(
            f"Validating JWT token for {method} {path} from {client_ip}",
            extra={"request_id": request_id}
        )
        try:
            # Get HTTP client from app state if available
            http_client = getattr(request.app.state, "http_client", None)
            token_payload = await verify_token_string(token, http_client=http_client)
            
            # Store token payload in request state for use in route handlers
            request.state.token_data = token_payload
            
            user_id = token_payload.get("sub") or token_payload.get("id", "unknown")
            logger.info(
                f"JWT token validated successfully for {method} {path} from {client_ip}. "
                f"User ID: {user_id}",
                extra={"request_id": request_id}
            )
        except Exception as e:
            error_detail = str(e) if hasattr(e, "detail") else ErrorMessages.AUTH_TOKEN_VERIFICATION_FAILED
            status_code = e.status_code if hasattr(e, "status_code") else status.HTTP_401_UNAUTHORIZED
            
            logger.warning(
                f"JWT validation failed for {method} {path} from {client_ip}: "
                f"{status_code} - {error_detail}",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=status_code,
                content={
                    "detail": error_detail,
                    "request_id": request_id
                },
            )
        
        # Continue with the request
        logger.debug(
            f"Request proceeding to handler for {method} {path}",
            extra={"request_id": request_id}
        )
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""
    
    def __init__(
        self,
        app: ASGIApp,
        requests_per_minute: int = 60,
        enabled: bool = True
    ):
        """
        Initialize rate limit middleware.
        
        Args:
            app: ASGI application
            requests_per_minute: Maximum requests per minute per IP
            enabled: Whether rate limiting is enabled
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.enabled = enabled
        self._request_counts: dict[str, list[float]] = {}
    
    async def dispatch(self, request: Request, call_next):
        """Apply rate limiting to requests."""
        if not self.enabled:
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")
        path = request.url.path
        
        # Skip rate limiting for public routes
        if path in PUBLIC_ROUTES:
            return await call_next(request)
        
        import time
        current_time = time.time()
        minute_ago = current_time - 60
        
        # Clean old entries
        if client_ip in self._request_counts:
            self._request_counts[client_ip] = [
                t for t in self._request_counts[client_ip] if t > minute_ago
            ]
        else:
            self._request_counts[client_ip] = []
        
        # Check rate limit
        if len(self._request_counts[client_ip]) >= self.requests_per_minute:
            logger.warning(
                f"Rate limit exceeded for {client_ip} on {path}",
                extra={"request_id": request_id}
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                    "request_id": request_id
                },
            )
        
        # Record request
        self._request_counts[client_ip].append(current_time)
        
        return await call_next(request)

