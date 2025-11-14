# Next.js Better Auth FastAPI

> **Note**: This is a vibe coded app.

A full-stack authentication system combining Next.js with Better Auth for the frontend and FastAPI for the backend, featuring JWT token verification using JWKS (JSON Web Key Set).

## Overview

This project demonstrates a secure authentication architecture where:
- **Frontend (Next.js)**: Uses Better Auth for user authentication, signup, and login
- **Backend (FastAPI)**: Verifies JWT tokens and API keys issued by Better Auth using JWKS for secure API access
- **Authentication Flow**: JWT tokens are signed with Ed25519 and verified using public keys fetched from the Better Auth JWKS endpoint
- **Dual Authentication**: Supports both JWT tokens and API keys for flexible authentication

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **Better Auth** - Authentication library with JWT support
- **Drizzle ORM** - TypeScript ORM for database operations
- **SQLite** - Database (via better-sqlite3)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **FastAPI** - Modern Python web framework
- **PyJWT** - JWT token verification
- **Cryptography** - Ed25519 public key handling
- **HTTPX** - Async HTTP client for JWKS fetching and API key verification
- **SQLAlchemy** - Async PostgreSQL ORM
- **Alembic** - Database migrations
- **MinIO Client** - S3-compatible object storage
- **uv** - Python package manager
- **Python 3.12+** - Runtime

## Features

- ✅ User registration and login
- ✅ JWT-based authentication with Ed25519 signatures
- ✅ API key authentication support
- ✅ Secure token verification using JWKS (cached with configurable TTL)
- ✅ JWT/API key validation middleware for automatic authentication
- ✅ Protected API endpoints (all routes protected by default)
- ✅ Public route exclusion (health checks, docs, etc.)
- ✅ Rate limiting middleware (configurable per IP)
- ✅ Request ID tracking for all requests
- ✅ Comprehensive logging for authentication events
- ✅ CORS configuration
- ✅ PostgreSQL database with async support
- ✅ MinIO/S3-compatible object storage
- ✅ Database migrations (Drizzle for frontend, Alembic for backend)
- ✅ Type-safe frontend and backend
- ✅ Modern UI with Tailwind CSS

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Python** 3.12+
- **uv** (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nextjs-better-auth-fastapi
```

2. Install all dependencies:
```bash
make install
```

This will install:
- Backend dependencies using `uv sync`
- Frontend dependencies using `pnpm install`

## Configuration

### Frontend Environment Variables

Create a `.env.local` file in the `nextjs` directory:

```env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT_JSON=false

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db
DB_SCHEMA=api
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# JWKS Cache Configuration
JWKS_CACHE_TTL_SECONDS=3600

# MinIO/S3 Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=better-auth-storage
MINIO_USE_SSL=false
MINIO_REGION=us-east-1

# HTTP Client Configuration
HTTP_CLIENT_TIMEOUT=5.0
```

### Docker Compose Setup (PostgreSQL, MinIO, and pgWeb)

The project includes a `docker-compose.yml` file for running PostgreSQL, MinIO, and pgWeb services.

1. **Copy the example environment file:**
   ```bash
   cp env.example .env
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

4. **Access pgWeb (PostgreSQL UI with automatic authentication):**
   - URL: http://localhost:8081
   - **No login required** - automatically connected using environment variables
   - Credentials are pre-configured from your `.env` file

5. **Access MinIO Console:**
   - URL: http://localhost:9001
   - Default credentials: `minioadmin` / `minioadmin`

6. **Stop the services:**
   ```bash
   docker-compose down
   ```

7. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

The `env.example` file contains all necessary environment variables for PostgreSQL, MinIO, and pgWeb configuration. Update the `.env` file with your preferred values before starting the services.

## Running the Project

### Run Both Servers

Start both the frontend and backend servers simultaneously:

```bash
make dev
```

### Run Servers Separately

**Backend only:**
```bash
make backend
```
The FastAPI server will run on `http://localhost:8000`

**Frontend only:**
```bash
make frontend
```
The Next.js server will run on `http://localhost:3000`

### Available Make Commands

**Installation:**
- `make install` - Install dependencies for both backend and frontend

**Development:**
- `make backend` - Run the FastAPI backend server
- `make frontend` - Run the Next.js frontend server
- `make dev` - Run both backend and frontend in parallel

**Code Quality:**
- `make lint` - Lint both backend and frontend code
- `make lint-backend` - Lint backend code with ruff
- `make lint-frontend` - Lint frontend code with Biome
- `make format` - Format both backend and frontend code
- `make format-backend` - Format backend code with ruff
- `make format-frontend` - Format frontend code with Biome
- `make check` - Check both backend and frontend (lint + format)
- `make check-backend` - Check backend code (lint + format check)
- `make check-frontend` - Check frontend code with Biome
- `make type-check` - Type check frontend TypeScript code

**Build:**
- `make build` - Build both backend and frontend
- `make build-backend` - Build backend (if applicable)
- `make build-frontend` - Build frontend Next.js app

**Database:**
- `make migrate` - Run database migrations (Alembic)

**Cleanup:**
- `make clean` - Clean up generated files

## Project Structure

```
nextjs-better-auth-fastapi/
├── backend/                 # FastAPI backend
│   ├── core/               # Core application modules
│   │   ├── app.py          # FastAPI application factory
│   │   ├── auth.py         # JWT and API key verification logic
│   │   ├── config.py       # Configuration constants
│   │   ├── constants.py    # Error messages and string constants
│   │   ├── database.py     # Database connection
│   │   ├── exceptions.py   # Custom exceptions
│   │   ├── logging.py      # Logging configuration
│   │   ├── middleware.py  # JWT/API key auth, rate limiting, request ID
│   │   └── permissions.py  # Permission definitions
│   ├── routers/            # API route handlers
│   │   ├── example.py
│   │   ├── health.py
│   │   └── tasks.py
│   ├── services/           # Business logic services
│   ├── schemas/            # Pydantic schemas
│   ├── models/             # SQLAlchemy models
│   ├── utils/              # Utility functions
│   ├── alembic/            # Database migrations
│   ├── dependencies.py     # FastAPI dependencies
│   ├── main.py             # Application entry point
│   └── pyproject.toml      # Python dependencies
├── nextjs/                  # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Better Auth endpoints
│   │   │   └── proxy/      # Proxy routes to backend
│   │   └── page.tsx        # Pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and configuration
│   │   ├── auth.ts         # Better Auth configuration
│   │   ├── constants.ts    # All constants (IMPORTANT)
│   │   └── database.ts     # Database connection
│   ├── drizzle/            # Database migrations
│   ├── auth-schema.ts      # Database schema definitions
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker Compose for PostgreSQL, MinIO, pgWeb
├── env.example             # Example environment variables
└── Makefile                # Build automation
```

## API Endpoints

### Backend (FastAPI)

**Public Endpoints** (no authentication required):
- `GET /` - Health check endpoint
- `GET /docs` - API documentation (Swagger UI)
- `GET /openapi.json` - OpenAPI schema
- `GET /redoc` - Alternative API documentation

**Protected Endpoints** (JWT token or API key authentication required):
- `POST /getdata` - Protected endpoint that requires authentication
- `GET /tasks` - List tasks (requires authentication)
- `POST /tasks` - Create task (requires authentication)
- Additional endpoints defined in `backend/routers/`

All other endpoints are protected by default via the JWT/API key validation middleware.

**Authentication Methods:**
- **JWT Token**: Send `Authorization: Bearer <token>` header
- **API Key**: Send `X-API-Key: <api-key>` header
- Both methods can be used simultaneously

### Frontend (Next.js)

- `/api/auth/*` - Better Auth endpoints (handled automatically)
- `/api/proxy/*` - Proxy routes to backend API

## Authentication Flow

1. **User Registration/Login**: User signs up or logs in through the Next.js frontend
2. **Token Issuance**: Better Auth issues a JWT token signed with Ed25519
3. **Token Storage**: Token is stored in cookies and available for API requests
4. **API Request**: Frontend sends requests to FastAPI backend with either:
   - JWT token in `Authorization: Bearer <token>` header
   - API key in `X-API-Key: <api-key>` header
   - Both headers can be present simultaneously
5. **Middleware Validation**: The `JWTAuthMiddleware` intercepts all requests:
   - Adds request ID via `RequestIDMiddleware` (first middleware)
   - Applies rate limiting via `RateLimitMiddleware` (if enabled)
   - Checks if the route is in the public routes list (excluded from authentication)
   - Validates authentication:
     - **For API Keys**: Verifies via Better Auth `/api/auth/verify-api-key` endpoint
     - **For JWT Tokens**: Validates using JWKS verification
   - Stores validated auth data in request state
6. **JWT Token Verification Process**:
   - Fetches JWKS from Better Auth endpoint (cached with configurable TTL)
   - Extracts the public key based on token's `kid` (key ID)
   - Verifies token signature using Ed25519 public key
   - Validates issuer and audience claims
   - Stores payload in `request.state.token_data`
7. **API Key Verification Process**:
   - Sends API key to Better Auth verification endpoint
   - Receives API key metadata (user_id, key_id, permissions, etc.)
   - Stores data in `request.state.api_key_data`
8. **Unified User ID**: Extracted from either token or API key and stored in `request.state.user_id`
9. **Protected Access**: If at least one authentication method succeeds, the request proceeds to the route handler

### Accessing Authentication Data in Routes

In your FastAPI route handlers, you can access the validated authentication data:

```python
from fastapi import Request

@app.post("/protected-endpoint")
async def protected_route(request: Request):
    # Access unified user ID (works for both JWT and API key auth)
    user_id = request.state.user_id
    
    # Or access specific auth data if needed
    token_data = getattr(request.state, "token_data", None)
    api_key_data = getattr(request.state, "api_key_data", None)
    
    # Access request ID for tracing
    request_id = request.state.request_id
    
    # Your logic here
    return {"user_id": user_id, "request_id": request_id}
```

### Logging

The middleware provides comprehensive logging:
- **INFO**: Request entry, successful authentication, rate limiting status
- **WARNING**: Authentication failures (missing headers, invalid tokens/keys), rate limit exceeded
- **ERROR**: Unexpected errors during token/key verification
- **DEBUG**: Detailed flow information

All logs include HTTP method, path, client IP, and request ID for traceability.

### Rate Limiting

Rate limiting is enabled by default and can be configured via environment variables:
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting (default: `true`)
- `RATE_LIMIT_REQUESTS_PER_MINUTE`: Maximum requests per IP per minute (default: `60`)

Public routes (health checks, docs, etc.) are excluded from rate limiting.

### Request ID Tracking

All requests receive a unique request ID that is:
- Added to request state (`request.state.request_id`)
- Included in response headers (`X-Request-ID`)
- Included in all log messages for traceability

## Development

### Linting and Formatting

The project follows code quality standards. After making changes:

**Frontend:**
```bash
# Lint
cd nextjs && pnpm lint

# Format
cd nextjs && pnpm format

# Check (lint + format check)
cd nextjs && pnpm check

# Type check
cd nextjs && pnpm type-check
```

**Backend:**
```bash
# Lint
cd backend && uv run ruff check .

# Format
cd backend && uv run ruff format .

# Check (lint + format check)
cd backend && uv run ruff check . && uv run ruff format --check .
```

Or use the Make commands:
```bash
make lint          # Lint both
make format        # Format both
make check         # Check both
make type-check    # Type check frontend
```

### Database Migrations

**Frontend (Drizzle ORM):**
- Migrations are located in `nextjs/drizzle/`
- Run migrations when schema changes in `nextjs/auth-schema.ts`

**Backend (Alembic):**
- Migrations are located in `backend/alembic/versions/`
- Run migrations: `make migrate` or `cd backend && uv run alembic upgrade head`
- Create new migration: `cd backend && uv run alembic revision --autogenerate -m "description"`

## Security Features

- **JWT Tokens**: Ed25519 signature algorithm for secure token signing
- **JWKS Verification**: Public keys fetched from Better Auth JWKS endpoint (cached with configurable TTL)
- **API Key Support**: Secure API key authentication via Better Auth verification endpoint
- **Route Protection**: All backend routes protected by default (except public routes)
- **CORS**: Configured for frontend origin(s) only
- **Token Validation**: Includes issuer and audience checks
- **Rate Limiting**: Configurable per-IP rate limiting to prevent abuse
- **Request Tracking**: Unique request IDs for all requests for traceability
- **Dual Authentication**: Supports both JWT tokens and API keys simultaneously

## Important Notes

- **Never hardcode strings**: Always use constants from `nextjs/lib/constants.ts` (frontend) or `backend/core/config.py`/`backend/core/constants.py` (backend)
- **Better Auth APIs First**: Always use Better Auth APIs for authentication, organization, team, and permission operations. Never query the database directly for these operations.
- **File Size**: Keep files under 500 lines - split large files into smaller, focused modules
- **Database**: Frontend uses SQLite (via Better Auth), backend uses PostgreSQL
- **Docker Services**: PostgreSQL, MinIO, and pgWeb can be run via Docker Compose, but assume they're already running when developing

## License

See [LICENSE](LICENSE) file for details.
