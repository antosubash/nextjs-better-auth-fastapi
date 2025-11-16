"""Middleware for JWT and API key authentication and request tracing."""

import logging
from typing import TYPE_CHECKING
import uuid

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

from core.auth import verify_api_key, verify_token_string
from core.config import PUBLIC_ROUTES
from core.constants import ErrorMessages

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to all requests."""

    async def dispatch(
        self, request: Request, call_next: "Callable[[Request], Awaitable[Response]]"
    ) -> Response:
        """Add request ID to request state and logs."""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Add request ID to logger context
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args: object, **kwargs: object) -> logging.LogRecord:
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
    """Middleware to validate JWT tokens and API keys for protected routes."""

    def __init__(self, app: ASGIApp, excluded_paths: set[str] | None = None) -> None:
        """
        Initialize JWT and API key auth middleware.

        Args:
            app: ASGI application
            excluded_paths: Set of paths to exclude from authentication validation
        """
        super().__init__(app)
        self.excluded_paths = excluded_paths or PUBLIC_ROUTES

    async def _validate_api_key(
        self, request: Request, api_key: str, method: str, path: str, client_ip: str
    ) -> Response | None:
        """Validate API key and store in request state. Returns error response if validation fails."""
        request_id = getattr(request.state, "request_id", "unknown")
        http_client = getattr(request.app.state, "http_client", None)

        logger.debug(f"Found API key in X-API-Key header for {method} {path} from {client_ip}")
        try:
            api_key_data = await verify_api_key(api_key, http_client=http_client)
            request.state.api_key_data = api_key_data

            user_id = api_key_data.get("user_id", "unknown")
            logger.info(
                f"API key validated successfully for {method} {path} from {client_ip}. "
                f"User ID: {user_id}, Key ID: {api_key_data.get('key_id', 'unknown')}"
            )
        except Exception as e:
            error_detail = (
                str(e) if hasattr(e, "detail") else ErrorMessages.API_KEY_VERIFICATION_FAILED
            )
            status_code = (
                e.status_code if hasattr(e, "status_code") else status.HTTP_401_UNAUTHORIZED
            )

            logger.warning(
                f"API key validation failed for {method} {path} from {client_ip}: "
                f"{status_code} - {error_detail}"
            )
            return JSONResponse(
                status_code=status_code,
                content={"detail": error_detail, "request_id": request_id},
            )
        else:
            return None

    async def _validate_jwt_token(
        self, request: Request, token: str, method: str, path: str, client_ip: str
    ) -> Response | None:
        """Validate JWT token and store in request state. Returns error response if validation fails."""
        request_id = getattr(request.state, "request_id", "unknown")
        http_client = getattr(request.app.state, "http_client", None)

        logger.debug(
            f"Found JWT token in Authorization header for {method} {path} from {client_ip}"
        )
        try:
            token_payload = await verify_token_string(token, http_client=http_client)
            request.state.token_data = token_payload

            user_id = token_payload.get("sub") or token_payload.get("id", "unknown")
            logger.info(
                f"JWT token validated successfully for {method} {path} from {client_ip}. "
                f"User ID: {user_id}"
            )
        except Exception as e:
            error_detail = (
                str(e) if hasattr(e, "detail") else ErrorMessages.AUTH_TOKEN_VERIFICATION_FAILED
            )
            status_code = (
                e.status_code if hasattr(e, "status_code") else status.HTTP_401_UNAUTHORIZED
            )

            logger.warning(
                f"JWT validation failed for {method} {path} from {client_ip}: "
                f"{status_code} - {error_detail}"
            )
            return JSONResponse(
                status_code=status_code,
                content={"detail": error_detail, "request_id": request_id},
            )
        else:
            return None

    def _extract_user_id(self, request: Request) -> str | None:
        """Extract user ID from authenticated request state."""
        if hasattr(request.state, "api_key_data"):
            return request.state.api_key_data.get("user_id")
        if hasattr(request.state, "token_data"):
            token_data = request.state.token_data
            return token_data.get("sub") or token_data.get("id")
        return None

    def _check_authentication_status(self, request: Request) -> tuple[bool, bool]:
        """Check if API key or JWT authentication succeeded."""
        has_api_key = hasattr(request.state, "api_key_data")
        has_jwt = hasattr(request.state, "token_data")
        return has_api_key, has_jwt

    def _build_auth_methods_list(self, has_api_key: bool, has_jwt: bool) -> list[str]:
        """Build list of authentication methods used."""
        auth_methods = []
        if has_api_key:
            auth_methods.append("API Key")
        if has_jwt:
            auth_methods.append("JWT")
        return auth_methods

    async def dispatch(
        self, request: Request, call_next: "Callable[[Request], Awaitable[Response]]"
    ) -> Response:
        """
        Validate JWT token or API key for protected routes.

        Supports both authentication methods:
        - API Key: X-API-Key header
        - JWT Token: Authorization: Bearer <token> header

        Both can be present simultaneously. If neither is present and route is protected,
        returns 401 Unauthorized.
        """
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")

        logger.info(f"Auth middleware: {method} {path} from {client_ip}")

        if method == "OPTIONS":
            logger.debug(f"OPTIONS request for {path} - allowing CORS preflight")
            return await call_next(request)

        if path in self.excluded_paths:
            logger.debug(f"Route {path} is excluded from authentication validation")
            return await call_next(request)

        # Check for API key first (X-API-Key header)
        api_key = request.headers.get("X-API-Key")
        if api_key:
            api_key = api_key.strip()
            if api_key:
                error_response = await self._validate_api_key(
                    request, api_key, method, path, client_ip
                )
                if error_response:
                    return error_response

        # Check for JWT token (Authorization: Bearer header)
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "").strip()
            if token:
                error_response = await self._validate_jwt_token(
                    request, token, method, path, client_ip
                )
                if error_response:
                    return error_response

        # Check if at least one authentication method succeeded
        has_api_key, has_jwt = self._check_authentication_status(request)

        if not has_api_key and not has_jwt:
            logger.warning(
                f"No valid authentication found for {method} {path} from {client_ip}. "
                f"Missing both API key and JWT token."
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": ErrorMessages.AUTH_HEADER_MISSING, "request_id": request_id},
            )

        # Extract and store unified user_id
        user_id = self._extract_user_id(request)
        if user_id:
            request.state.user_id = str(user_id)
        else:
            logger.error(
                f"User ID not found in authentication data for {method} {path} from {client_ip}"
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": ErrorMessages.USER_ID_NOT_FOUND, "request_id": request_id},
            )

        # Continue with the request
        auth_methods = self._build_auth_methods_list(has_api_key, has_jwt)

        logger.debug(
            f"Request proceeding to handler for {method} {path} "
            f"(authenticated via: {', '.join(auth_methods)}, user_id: {user_id})",
            extra={"request_id": request_id},
        )
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""

    def __init__(self, app: ASGIApp, requests_per_minute: int = 60, enabled: bool = True) -> None:
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

    async def dispatch(
        self, request: Request, call_next: "Callable[[Request], Awaitable[Response]]"
    ) -> Response:
        """Apply rate limiting to requests."""
        if not self.enabled:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")
        path = request.url.path

        # Skip rate limiting for public routes
        if path in PUBLIC_ROUTES:
            return await call_next(request)

        import time  # noqa: PLC0415

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
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                    "request_id": request_id,
                },
            )

        # Record request
        self._request_counts[client_ip].append(current_time)

        return await call_next(request)
