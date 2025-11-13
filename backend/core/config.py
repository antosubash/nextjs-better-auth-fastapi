"""Application configuration from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()

# Better Auth configuration
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000")
JWKS_URL = f"{BETTER_AUTH_URL}/api/auth/jwks"
BETTER_AUTH_VERIFY_API_KEY_URL = f"{BETTER_AUTH_URL}/api/auth/verify-api-key"
JWT_ISSUER = BETTER_AUTH_URL
JWT_AUDIENCE = BETTER_AUTH_URL

# CORS configuration
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# File operations configuration
OUTPUT_FILE_PATH = os.getenv("OUTPUT_FILE_PATH", "output_file.txt")

# HTTP client configuration
HTTP_CLIENT_TIMEOUT = float(os.getenv("HTTP_CLIENT_TIMEOUT", "5.0"))

# JWKS cache configuration
JWKS_CACHE_TTL_SECONDS = int(os.getenv("JWKS_CACHE_TTL_SECONDS", "3600"))  # 1 hour default

# Rate limiting configuration
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT_JSON = os.getenv("LOG_FORMAT_JSON", "false").lower() == "true"

# Public routes that don't require JWT authentication
PUBLIC_ROUTES: set[str] = {"/", "/docs", "/openapi.json", "/redoc", "/health"}

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db"
)
# Synchronous database URL for Alembic migrations
DATABASE_URL_SYNC = DATABASE_URL.replace("+asyncpg", "")

# Database schema configuration
DB_SCHEMA = os.getenv("DB_SCHEMA", "api")

# Database connection pool settings
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))

# MinIO/S3 configuration
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_USE_SSL = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "better-auth-storage")
MINIO_REGION = os.getenv("MINIO_REGION", "us-east-1")

# Job scheduler configuration
# Use sync database URL (without +asyncpg) for APScheduler job store
JOB_STORE_URL = os.getenv("JOB_STORE_URL", DATABASE_URL_SYNC)
JOB_STORE_TABLE_NAME = os.getenv("JOB_STORE_TABLE_NAME", "apscheduler_jobs")
JOB_EXECUTOR_MAX_WORKERS = int(os.getenv("JOB_EXECUTOR_MAX_WORKERS", "10"))
# Misfire grace time in seconds - how long after a missed run time a job can still be executed
# Default: 1 hour (3600 seconds) to handle cases where scheduler is down temporarily
JOB_MISFIRE_GRACE_TIME_SECONDS = int(os.getenv("JOB_MISFIRE_GRACE_TIME_SECONDS", "3600"))
