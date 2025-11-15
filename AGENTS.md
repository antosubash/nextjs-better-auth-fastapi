# AGENTS.md

This document provides context and guidelines for AI agents working with this codebase.

## Project Overview

This is a full-stack authentication system combining:
- **Frontend**: Next.js 16 with Better Auth for authentication
- **Backend**: FastAPI with JWT token verification using JWKS (JSON Web Key Set)
- **Authentication**: JWT tokens signed with Ed25519, verified using public keys from Better Auth JWKS endpoint

## Architecture

### Frontend (Next.js)
- **Location**: `nextjs/` directory
- **Framework**: Next.js 16 with App Router
- **Auth Library**: Better Auth with JWT plugin
- **Database**: PostgreSQL via Drizzle ORM (shared with backend)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend (FastAPI)
- **Location**: `backend/` directory
- **Framework**: FastAPI
- **JWT Verification**: PyJWT with Ed25519 support
- **API Key Authentication**: Support for API key authentication via Better Auth
- **Middleware**: JWT/API key validation middleware, rate limiting, request ID tracking
- **Database**: PostgreSQL (via asyncpg)
- **Migrations**: Alembic
- **Package Manager**: uv
- **Storage**: MinIO/S3 support for file storage
- **Language**: Python 3.12+

## Code Conventions

### Constants and Configuration

**CRITICAL**: Never hardcode strings. Always use constants from:
- **Frontend**: `nextjs/lib/constants.ts` - Contains all UI strings, labels, placeholders, error messages, and configuration constants
- **Backend**: `backend/core/config.py` - Contains environment-based configuration constants
- **Backend**: `backend/core/constants.py` - Contains error messages and other hardcoded strings

### Better Auth API Usage

**CRITICAL**: Always use Better Auth APIs for authentication, organization, team, and permission operations. **NEVER query the database directly** for these operations.

- **Frontend**: Use Better Auth client methods (e.g., `auth.api.signUpEmail()`, `auth.api.listOrganizations()`, `auth.api.listTeams()`)
- **Backend**: Make HTTP requests to Better Auth API endpoints (e.g., `/api/auth/*`)

### File Organization

- **Keep files under 500 lines** - Split large files into smaller, focused modules
- **Simple over complex** - Prioritize straightforward implementations
- **Type safety** - Use TypeScript types and Python type hints

### Frontend Patterns

**See [nextjs/CODING_STANDARDS.md](nextjs/CODING_STANDARDS.md) for comprehensive frontend coding standards.**

1. **Constants Usage**:
   ```typescript
   // ✅ Good
   import { AUTH_LABELS } from "@/lib/constants";
   <button>{AUTH_LABELS.LOGIN}</button>

   // ❌ Bad
   <button>Log in</button>
   ```

2. **Component Structure**:
   - Components in `nextjs/components/`
   - API routes in `nextjs/app/api/`
   - Utilities in `nextjs/lib/`

3. **Database**:
   - Schema defined in `nextjs/auth-schema.ts`
   - Connection in `nextjs/lib/database.ts`
   - Migrations in `nextjs/drizzle/`
   - **IMPORTANT**: Do NOT query the database directly for auth, organization, team, or permission data. Always use Better Auth APIs.

4. **Better Auth Client Usage**:
   ```typescript
   // ✅ Good - Use Better Auth APIs
   import { auth } from "@/lib/auth";
   const session = await auth.api.getSession({ headers });
   const organizations = await auth.api.listOrganizations({ headers });
   const teams = await auth.api.listTeams({ headers, query: { organizationId } });
   
   // ❌ Bad - Direct database queries
   import { db } from "@/lib/database";
   const user = await db.select().from(users).where(eq(users.id, userId));
   ```

### Backend Patterns

1. **Configuration**:
   ```python
   # ✅ Good
   from core.config import BETTER_AUTH_URL, JWKS_URL
   from core.constants import ErrorMessages
   
   # ❌ Bad
   url = "http://localhost:3000"
   error_msg = "Something went wrong"
   ```

2. **JWT Verification**:
   - Use `core.auth.verify_token_string()` for manual verification
   - Use `core.auth.verify_api_key()` for API key verification
   - Use `JWTAuthMiddleware` for automatic route protection
   - Token data available in `request.state.token_data`
   - API key data available in `request.state.api_key_data`
   - Unified user ID available in `request.state.user_id`

3. **Public Routes**:
   - Defined in `backend/core/config.py` in `PUBLIC_ROUTES` set
   - Health checks, docs, and OpenAPI endpoints are public by default

4. **Authentication Methods**:
   - Supports both JWT tokens (`Authorization: Bearer <token>`) and API keys (`X-API-Key` header)
   - Both methods can be used simultaneously
   - At least one valid authentication method required for protected routes

## Key Files

### Frontend
- `nextjs/lib/auth.ts` - Better Auth configuration
- `nextjs/lib/constants.ts` - All UI strings and constants
- `nextjs/lib/utils/logger.ts` - Logging utility for client and server
- `nextjs/lib/utils/sanitization.ts` - Input sanitization utilities
- `nextjs/auth-schema.ts` - Database schema definitions
- `nextjs/lib/database.ts` - Database connection
- `nextjs/app/api/auth/` - Better Auth API routes
- `nextjs/app/api/proxy/` - Proxy routes to backend

### Backend
- `backend/main.py` - FastAPI application entry point
- `backend/core/app.py` - FastAPI application factory (`create_app()`)
- `backend/core/auth.py` - JWT and API key verification logic
- `backend/core/middleware.py` - JWT/API key validation middleware, rate limiting, request ID
- `backend/core/security_middleware.py` - Security headers middleware
- `backend/core/config.py` - Configuration constants from environment variables
- `backend/core/constants.py` - Error messages, validation errors, and other string constants
- `backend/utils/sanitization.py` - Input sanitization utilities
- `backend/core/database.py` - Database connection and initialization
- `backend/core/exceptions.py` - Custom exception classes
- `backend/core/logging.py` - Logging configuration
- `backend/core/permissions.py` - Permission definitions
- `backend/routers/` - API route handlers
- `backend/services/` - Business logic services
- `backend/schemas/` - Pydantic schemas for request/response validation
- `backend/models/` - SQLAlchemy database models
- `backend/utils/` - Utility functions
- `backend/dependencies.py` - FastAPI dependencies (HTTP client, etc.)
- `backend/alembic/` - Database migrations

## Development Workflow

### Running the Project

```bash
# Install dependencies
make install

# Run both servers
make dev

# Run separately
make backend   # FastAPI on :8000
make frontend  # Next.js on :3000
```

### Code Quality

**After making changes, always:**
1. Lint and format modified files
2. Check for TypeScript/Python errors
3. Ensure constants are used instead of hardcoded strings

**Frontend linting:**
```bash
cd nextjs && pnpm lint
```

**Backend formatting:**
```bash
cd backend && uv run ruff format .
```

**Backend linting:**
```bash
cd backend && uv run ruff check .
```

### Environment Variables

All environment variables for both frontend and backend are configured in a single `.env` file at the project root. Both applications automatically load from this file.

**Frontend Variables:**
- `BETTER_AUTH_SECRET` - Secret key for Better Auth
- `BETTER_AUTH_URL` - Base URL (default: http://localhost:3000)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `DATABASE_URL` - PostgreSQL connection string (shared with backend)

**Backend Variables:**
- `BETTER_AUTH_URL` - Better Auth base URL (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (default: INFO)
- `LOG_FORMAT_JSON` - Use JSON logging format (default: false)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (default: http://localhost:3000)
- `DATABASE_URL` - PostgreSQL connection string (default: postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db)
- `DB_SCHEMA` - Database schema name (default: api)
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Rate limit per IP (default: 60)
- `JWKS_CACHE_TTL_SECONDS` - JWKS cache TTL in seconds (default: 3600)
- `MINIO_ENDPOINT` - MinIO endpoint (default: localhost:9000)
- `MINIO_ACCESS_KEY` - MinIO access key (default: minioadmin)
- `MINIO_SECRET_KEY` - MinIO secret key (default: minioadmin)
- `MINIO_BUCKET_NAME` - MinIO bucket name (default: better-auth-storage)

See `env.example` in the project root for a complete list of all environment variables.

## Authentication Flow

1. User registers/logs in via Next.js frontend
2. Better Auth issues JWT token (Ed25519 signed)
3. Token stored in cookies
4. Frontend sends requests with either:
   - `Authorization: Bearer <token>` header (JWT token)
   - `X-API-Key: <api-key>` header (API key)
   - Both headers can be present simultaneously
5. Backend middleware validates authentication:
   - **For JWT tokens**:
     - Fetches JWKS from Better Auth (cached with TTL)
     - Extracts public key by `kid` (key ID)
     - Verifies signature and claims (issuer, audience)
     - Stores payload in `request.state.token_data`
   - **For API keys**:
     - Verifies API key via Better Auth `/api/auth/verify-api-key` endpoint
     - Stores API key data in `request.state.api_key_data`
6. Unified user ID extracted and stored in `request.state.user_id`
7. Request proceeds if at least one authentication method is valid

## Common Tasks

### Adding a New Protected Endpoint

**Backend:**
```python
from fastapi import Request

@app.post("/new-endpoint")
async def new_endpoint(request: Request):
    # Access unified user ID (works for both JWT and API key auth)
    user_id = request.state.user_id
    
    # Or access specific auth data if needed
    token_data = getattr(request.state, "token_data", None)
    api_key_data = getattr(request.state, "api_key_data", None)
    
    # Your logic here
    return {"user_id": user_id}
```

**Note**: Endpoints should be added in `backend/routers/` directory and included in `backend/core/app.py`.

### Adding a Public Endpoint

**Backend:**
Add route path to `PUBLIC_ROUTES` set in `backend/core/config.py`:
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

### Adding UI Strings

**Frontend:**
Add to appropriate constant object in `nextjs/lib/constants.ts`:
```typescript
export const NEW_FEATURE = {
  TITLE: "New Feature",
  DESCRIPTION: "Feature description",
} as const;
```

### Adding Configuration

**Backend:**
Add to `backend/core/config.py`:
```python
NEW_CONFIG_VALUE = os.getenv("NEW_CONFIG_VALUE", "default")
```

For error messages and other constants, add to `backend/core/constants.py`:
```python
class ErrorMessages:
    NEW_ERROR = "New error message"
```

## Important Patterns

### Better Auth API First

**CRITICAL RULE**: Always use Better Auth APIs for all authentication, organization, team, and permission operations. Never bypass Better Auth by querying the database directly.

**Why this matters:**
- Better Auth enforces business logic and validation
- Permission checks are handled automatically
- Data consistency is maintained
- Security policies are enforced
- Future Better Auth updates won't break your code

**Frontend Examples:**
```typescript
// ✅ Correct - Using Better Auth client
const session = await auth.api.getSession({ headers });
const orgs = await auth.api.listOrganizations({ headers });
const members = await auth.api.listMembers({ headers, query: { organizationId } });

// ❌ Wrong - Direct database access
const user = await db.select().from(users).where(eq(users.id, userId));
```

### Error Handling

- Use appropriate HTTP status codes
- Provide clear error messages (from constants)
- Log errors with context

### Logging

- Backend uses Python `logging` module
- Log levels: DEBUG, INFO, WARNING, ERROR
- Include HTTP method, path, and client IP in logs

### Database Migrations

- **Frontend**: Uses Drizzle ORM migrations
  - Migrations in `nextjs/drizzle/`
  - Run migrations when schema changes
- **Backend**: Uses Alembic migrations
  - Migrations in `backend/alembic/versions/`
  - Run migrations: `cd backend && uv run alembic upgrade head`
  - Create new migration: `cd backend && uv run alembic revision --autogenerate -m "description"`

### Commit Messages

- Use conventional commits format
- Reduce usage of "feat" prefix
- Examples: `fix: resolve JWT verification issue`, `docs: update API documentation`

## Testing Considerations

- Backend: FastAPI test client for API testing
- Frontend: Next.js testing utilities
- Authentication: Test with valid/invalid JWT tokens
- JWKS: Test JWKS fetching and caching

## Security Notes

- JWT tokens use Ed25519 signature algorithm
- Public keys fetched from JWKS endpoint (cached with configurable TTL)
- All backend routes protected by default
- CORS configured for frontend origin(s) only
- Token validation includes issuer and audience checks
- API key authentication supported via Better Auth verification endpoint
- Rate limiting middleware (configurable per IP)
- Request ID tracking for all requests
- Both JWT and API key authentication can be used simultaneously
- **Security Headers**: Both backend and frontend include security headers middleware (CSP, HSTS, X-Frame-Options, etc.)
- **Input Sanitization**: Input validation and sanitization utilities for both backend and frontend
- **Error Handling**: Consistent error handling with proper logging (no console statements in production code)

## Dependencies

### Frontend
- Next.js 16
- Better Auth
- Drizzle ORM
- Tailwind CSS
- TypeScript

### Backend
- FastAPI
- PyJWT
- Cryptography (Ed25519)
- HTTPX (async HTTP client)
- SQLAlchemy (async PostgreSQL)
- Alembic (database migrations)
- MinIO client (S3-compatible storage)
- uv (package manager)
- Python 3.12+

## Project Structure Reference

```
nextjs-better-auth-fastapi/
├── backend/                 # FastAPI backend
│   ├── core/               # Core application modules
│   │   ├── app.py          # FastAPI application factory
│   │   ├── auth.py         # JWT and API key verification logic
│   │   ├── config.py       # Configuration constants
│   │   ├── constants.py    # Error messages and string constants
│   │   ├── database.py     # Database connection
│   │   ├── exceptions.py  # Custom exceptions
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

## When Making Changes

1. **Check constants first** - Is there an existing constant for this string?
2. **Better Auth APIs** - Am I using Better Auth APIs instead of direct database queries?
3. **File size** - Will this change make a file > 500 lines? Split if needed.
4. **Type safety** - Add proper types/type hints
5. **Lint/format** - Always run linting and formatting after changes
6. **Public routes** - If adding a public endpoint, update middleware
7. **Environment variables** - Document new env vars in README

## Questions to Consider

- Are all strings using constants from `constants.ts` or `core/config.py`/`core/constants.py`?
- **Am I using Better Auth APIs instead of direct database queries for auth/org/team/permission operations?**
- Is the implementation simple and straightforward?
- Are files kept under 500 lines?
- Have I linted and formatted the code?
- Are new endpoints properly protected or added to public routes?
- Are new routers included in `core/app.py`?
- Is the commit message following conventional commits?
- For backend: Are database models, schemas, and services properly separated?
- For backend: Are migrations created when database schema changes?

