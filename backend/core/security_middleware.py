"""Security headers middleware."""

import logging
from typing import TYPE_CHECKING

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

from core.config import (
    CSP_POLICY,
    HSTS_MAX_AGE,
    PERMISSIONS_POLICY,
    SECURITY_HEADERS_ENABLED,
)

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    def __init__(self, app: ASGIApp) -> None:
        """
        Initialize security headers middleware.

        Args:
            app: ASGI application
        """
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: "Callable[[Request], Awaitable[Response]]"
    ) -> Response:
        """
        Add security headers to response.

        Args:
            request: FastAPI request object
            call_next: Next middleware/handler in chain

        Returns:
            Response with security headers added
        """
        response = await call_next(request)

        if not SECURITY_HEADERS_ENABLED:
            return response

        # X-Content-Type-Options: Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options: Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # X-XSS-Protection: Enable XSS filter (legacy, but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer-Policy: Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Strict-Transport-Security (HSTS): Force HTTPS
        if HSTS_MAX_AGE > 0:
            response.headers["Strict-Transport-Security"] = (
                f"max-age={HSTS_MAX_AGE}; includeSubDomains"
            )

        # Content-Security-Policy: Prevent XSS and injection attacks
        if CSP_POLICY:
            response.headers["Content-Security-Policy"] = CSP_POLICY

        # Permissions-Policy: Control browser features
        if PERMISSIONS_POLICY:
            response.headers["Permissions-Policy"] = PERMISSIONS_POLICY

        return response
