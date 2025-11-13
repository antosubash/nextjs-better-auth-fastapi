"""FastAPI application factory."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from core.config import (
    CORS_ORIGINS,
    RATE_LIMIT_ENABLED,
    RATE_LIMIT_REQUESTS_PER_MINUTE,
)
from core.logging import setup_logging
from core.middleware import (
    RequestIDMiddleware,
    JWTAuthMiddleware,
    RateLimitMiddleware,
)
from core.exceptions import AppException
from core.constants import ErrorMessages
from routers import example, health
from dependencies import get_http_client, close_http_client

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    # Setup logging
    setup_logging()
    
    # Create FastAPI app
    app = FastAPI(
        title="Better Auth FastAPI Backend",
        description="Backend API with JWT authentication using Better Auth",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    
    # Add request ID middleware (first, so all requests get IDs)
    app.add_middleware(RequestIDMiddleware)
    
    # Add rate limiting middleware
    if RATE_LIMIT_ENABLED:
        app.add_middleware(
            RateLimitMiddleware,
            requests_per_minute=RATE_LIMIT_REQUESTS_PER_MINUTE,
            enabled=True,
        )
        logger.info(f"Rate limiting enabled: {RATE_LIMIT_REQUESTS_PER_MINUTE} requests/minute")
    
    # Add JWT authentication middleware
    app.add_middleware(JWTAuthMiddleware)
    
    # Include routers
    app.include_router(example.router)
    app.include_router(health.router)
    
    # Store HTTP client in app state
    @app.on_event("startup")
    async def startup_event():
        """Initialize shared HTTP client on startup."""
        http_client = await get_http_client()
        app.state.http_client = http_client
        logger.info("Application startup complete")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Close shared HTTP client on shutdown."""
        await close_http_client()
        logger.info("Application shutdown complete")
    
    # Global exception handlers
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle application-specific exceptions."""
        request_id = getattr(request.state, "request_id", None)
        logger.error(
            f"Application exception: {exc.detail}",
            exc_info=True
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "request_id": request_id
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions."""
        request_id = getattr(request.state, "request_id", None)
        logger.error(
            f"Unexpected error: {str(exc)}",
            exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": ErrorMessages.INTERNAL_SERVER_ERROR,
                "request_id": request_id
            }
        )
    
    logger.info("FastAPI application created successfully")
    return app

