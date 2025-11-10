"""Application configuration from environment variables."""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Better Auth configuration
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000")
JWKS_URL = f"{BETTER_AUTH_URL}/api/auth/jwks"
JWT_ISSUER = BETTER_AUTH_URL
JWT_AUDIENCE = BETTER_AUTH_URL

# CORS configuration
CORS_ORIGINS: List[str] = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000"
).split(",")

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

