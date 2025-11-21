"""FastAPI application factory."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import (
    CORS_ORIGINS,
    RATE_LIMIT_ENABLED,
    RATE_LIMIT_REQUESTS_PER_MINUTE,
)
from core.constants import ErrorMessages
from core.database import close_db, init_db
from core.exceptions import AppException
from core.jobs import init_scheduler, shutdown_scheduler, start_scheduler
from core.logging import setup_logging
from core.middleware import (
    JWTAuthMiddleware,
    RateLimitMiddleware,
    RequestIDMiddleware,
)
from core.security_middleware import SecurityHeadersMiddleware
from dependencies import close_http_client, get_http_client
from routers import chat, example, health, jobs, storage, tasks
from services.storage_service import StorageService

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
    # Disable automatic redirect_slashes to prevent 307 redirects that can cause
    # clients to drop Authorization headers behind reverse proxies
    app = FastAPI(
        title="Better Auth FastAPI Backend",
        description="Backend API with JWT authentication using Better Auth",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        redirect_slashes=False,
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

    # Add security headers middleware (early in the stack)
    app.add_middleware(SecurityHeadersMiddleware)

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
    app.include_router(tasks.router)
    app.include_router(jobs.router)
    app.include_router(storage.router)
    app.include_router(chat.router)

    # Store HTTP client in app state
    @app.on_event("startup")
    async def startup_event() -> None:
        """Initialize shared HTTP client, database, job scheduler, and storage on startup."""
        http_client = await get_http_client()
        app.state.http_client = http_client
        await init_db()
        # Initialize and start job scheduler
        init_scheduler()
        await start_scheduler()
        # Initialize MinIO bucket
        storage_service = StorageService()
        await storage_service.ensure_bucket_exists()
        logger.info("Application startup complete")

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        """Close shared HTTP client, database connections, and job scheduler on shutdown."""
        await shutdown_scheduler()
        await close_http_client()
        await close_db()
        logger.info("Application shutdown complete")

    # Global exception handlers
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """Handle application-specific exceptions."""
        request_id = getattr(request.state, "request_id", None)
        logger.error(f"Application exception: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=exc.status_code, content={"detail": exc.detail, "request_id": request_id}
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle unexpected exceptions."""
        request_id = getattr(request.state, "request_id", None)
        logger.error(f"Unexpected error: {exc!s}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": ErrorMessages.INTERNAL_SERVER_ERROR, "request_id": request_id},
        )

    logger.info("FastAPI application created successfully")
    return app
