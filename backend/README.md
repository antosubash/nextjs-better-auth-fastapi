# FastAPI Backend

This is the FastAPI backend application with JWT authentication using Better Auth JWKS.

## Overview

The backend provides:
- RESTful API endpoints
- JWT token verification using JWKS
- API key authentication
- Protected routes with middleware
- Rate limiting
- Request ID tracking
- Background job scheduling
- File storage (MinIO/S3)

## Tech Stack

- **FastAPI** - Modern Python web framework
- **PyJWT** - JWT token verification
- **Cryptography** - Ed25519 public key handling
- **HTTPX** - Async HTTP client for JWKS fetching
- **SQLAlchemy** - Async PostgreSQL ORM
- **Alembic** - Database migrations
- **MinIO Client** - S3-compatible object storage
- **APScheduler** - Background job scheduling
- **uv** - Python package manager
- **Python 3.12+** - Runtime

## Database

The backend uses PostgreSQL via async SQLAlchemy. The database is shared with the frontend, but the backend manages its own schema/tables.

## Getting Started

### Prerequisites

- Python 3.12+
- uv (Python package manager)
- PostgreSQL running (shared with frontend)

### Installation

```bash
# Install dependencies
uv sync
```

### Environment Variables

Copy environment variables from the project root `.env` file. The backend automatically loads from the root `.env` file.

Key variables:
- `BETTER_AUTH_URL` - Better Auth base URL (default: http://localhost:3000)
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGINS` - Allowed CORS origins
- `LOG_LEVEL` - Logging level (default: INFO)
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)

See [Configuration Reference](../docs/configuration.md) for complete list.

### Database Migrations

Run migrations to set up the database schema:

```bash
cd backend
uv run alembic upgrade head
```

Or use the Make command from project root:

```bash
make migrate-backend
```

### Development

Start the development server:

```bash
cd backend
uv run fastapi dev main.py
```

Or use the Make command from project root:

```bash
make backend
```

The API will be available at `http://localhost:8000`.

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Project Structure

```
backend/
├── core/                  # Core application modules
│   ├── app.py            # FastAPI application factory
│   ├── auth.py           # JWT and API key verification
│   ├── config.py         # Configuration constants
│   ├── constants.py      # Error messages and strings
│   ├── database.py       # Database connection
│   ├── middleware.py     # Auth, rate limiting, request ID
│   └── permissions.py    # Permission definitions
├── routers/              # API route handlers
│   ├── example.py
│   ├── health.py
│   ├── jobs.py
│   └── tasks.py
├── services/             # Business logic services
├── schemas/              # Pydantic schemas
├── models/               # SQLAlchemy models
├── utils/                # Utility functions
├── alembic/              # Database migrations
├── dependencies.py       # FastAPI dependencies
├── main.py               # Application entry point
└── pyproject.toml        # Python dependencies
```

## Key Files

- `main.py` - Application entry point
- `core/app.py` - FastAPI application factory
- `core/auth.py` - JWT and API key verification logic
- `core/config.py` - Configuration constants
- `core/constants.py` - Error messages and string constants
- `core/middleware.py` - Authentication, rate limiting, request ID middleware
- `routers/` - API route handlers

## Code Conventions

### Constants

**CRITICAL**: Never hardcode strings. Always use constants:

```python
# ✅ Good
from core.config import BETTER_AUTH_URL, JWKS_URL
from core.constants import ErrorMessages

# ❌ Bad
url = "http://localhost:3000"
error_msg = "Something went wrong"
```

### Authentication

Access authentication data in route handlers:

```python
from fastapi import Request

@app.post("/protected-endpoint")
async def protected_route(request: Request):
    # Unified user ID (works for both JWT and API key)
    user_id = request.state.user_id
    
    # JWT token data (if JWT was used)
    token_data = getattr(request.state, "token_data", None)
    
    # API key data (if API key was used)
    api_key_data = getattr(request.state, "api_key_data", None)
    
    # Request ID for tracing
    request_id = request.state.request_id
    
    return {"user_id": user_id}
```

### Public Routes

Add route path to `PUBLIC_ROUTES` set in `core/config.py`:

```python
PUBLIC_ROUTES: set[str] = {
    "/",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
    "/new-public-endpoint",  # Add here
}
```

## Development Commands

```bash
# Development
uv run fastapi dev main.py    # Start development server
uv run uvicorn main:app --reload  # Alternative

# Code Quality
uv run ruff check .           # Lint code
uv run ruff format .          # Format code
uv run ruff check . && uv run ruff format --check .  # Check both

# Database
uv run alembic revision --autogenerate -m "description"  # Create migration
uv run alembic upgrade head   # Run migrations
uv run alembic downgrade -1   # Rollback migration
```

## Authentication

The backend supports two authentication methods:

1. **JWT Tokens**: Verified using JWKS from Better Auth
2. **API Keys**: Verified via Better Auth verification endpoint

Both methods can be used simultaneously. At least one valid authentication method is required for protected routes.

See [Authentication Guide](../docs/authentication.md) for details.

## Middleware Stack

1. **Request ID Middleware** - Adds unique request ID
2. **Rate Limiting Middleware** - Enforces rate limits
3. **JWT/API Key Auth Middleware** - Verifies authentication

## Related Documentation

- [Project README](../README.md) - Main project overview
- [Getting Started](../docs/getting-started.md) - Setup guide
- [Development Guide](../docs/development.md) - Development patterns
- [Authentication Guide](../docs/authentication.md) - Authentication details
- [API Reference](../docs/api-reference.md) - API endpoints

