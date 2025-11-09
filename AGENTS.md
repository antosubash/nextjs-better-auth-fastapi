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
- **Database**: SQLite via Drizzle ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend (FastAPI)
- **Location**: `backend/` directory
- **Framework**: FastAPI
- **JWT Verification**: PyJWT with Ed25519 support
- **Middleware**: JWT validation middleware (all routes protected by default)
- **Language**: Python 3.12+

## Code Conventions

### Constants and Configuration

**CRITICAL**: Never hardcode strings. Always use constants from:
- **Frontend**: `nextjs/lib/constants.ts` - Contains all UI strings, labels, placeholders, error messages, and configuration constants
- **Backend**: `backend/config.py` - Contains environment-based configuration constants

### Better Auth API Usage

**CRITICAL**: Always use Better Auth APIs for authentication, organization, team, and permission operations. **NEVER query the database directly** for these operations.

- **Frontend**: Use Better Auth client methods (e.g., `auth.api.signUpEmail()`, `auth.api.listOrganizations()`, `auth.api.listTeams()`)
- **Backend**: Make HTTP requests to Better Auth API endpoints (e.g., `/api/auth/*`)

### File Organization

- **Keep files under 500 lines** - Split large files into smaller, focused modules
- **Simple over complex** - Prioritize straightforward implementations
- **Type safety** - Use TypeScript types and Python type hints

### Frontend Patterns

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
   from config import BETTER_AUTH_URL, JWKS_URL
   
   # ❌ Bad
   url = "http://localhost:3000"
   ```

2. **JWT Verification**:
   - Use `auth.verify_token_string()` for manual verification
   - Use `JWTAuthMiddleware` for automatic route protection
   - Token data available in `request.state.token_data`

3. **Public Routes**:
   - Defined in `backend/middleware.py` in `PUBLIC_ROUTES` set
   - Health checks, docs, and OpenAPI endpoints are public by default

## Key Files

### Frontend
- `nextjs/lib/auth.ts` - Better Auth configuration
- `nextjs/lib/constants.ts` - All UI strings and constants
- `nextjs/auth-schema.ts` - Database schema definitions
- `nextjs/lib/database.ts` - Database connection
- `nextjs/app/api/auth/` - Better Auth API routes
- `nextjs/app/api/proxy/` - Proxy routes to backend

### Backend
- `backend/main.py` - FastAPI application entry point
- `backend/auth.py` - JWT verification logic
- `backend/middleware.py` - JWT validation middleware
- `backend/config.py` - Configuration constants

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
Use your preferred Python formatter (black, ruff, etc.)

### Environment Variables

**Frontend** (`.env.local` in `nextjs/`):
- `BETTER_AUTH_SECRET` - Secret key for Better Auth
- `BETTER_AUTH_URL` - Base URL (default: http://localhost:3000)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

**Backend** (`.env` in `backend/`):
- `BETTER_AUTH_URL` - Better Auth base URL (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (default: INFO)

## Authentication Flow

1. User registers/logs in via Next.js frontend
2. Better Auth issues JWT token (Ed25519 signed)
3. Token stored in cookies
4. Frontend sends requests with `Authorization: Bearer <token>` header
5. Backend middleware validates token:
   - Fetches JWKS from Better Auth (cached)
   - Extracts public key by `kid` (key ID)
   - Verifies signature and claims
6. Validated token payload available in `request.state.token_data`

## Common Tasks

### Adding a New Protected Endpoint

**Backend:**
```python
from fastapi import Request

@app.post("/new-endpoint")
async def new_endpoint(request: Request):
    token_data = request.state.token_data
    user_id = token_data.get("sub") or token_data.get("id")
    # Your logic here
    return {"user_id": user_id}
```

### Adding a Public Endpoint

**Backend:**
Add route path to `PUBLIC_ROUTES` set in `backend/middleware.py`:
```python
PUBLIC_ROUTES = {
    "/",
    "/docs",
    "/openapi.json",
    "/redoc",
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
Add to `backend/config.py`:
```python
NEW_CONFIG_VALUE = os.getenv("NEW_CONFIG_VALUE", "default")
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

- Frontend uses Drizzle ORM migrations
- Run migrations when schema changes
- Migrations in `nextjs/drizzle/`

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
- Public keys fetched from JWKS endpoint (cached)
- All backend routes protected by default
- CORS configured for frontend origin only
- Token validation includes issuer and audience checks

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
- Python 3.12+

## Project Structure Reference

```
nextjs-better-auth-fastapi/
├── backend/                 # FastAPI backend
│   ├── auth.py             # JWT verification logic
│   ├── config.py           # Configuration constants
│   ├── main.py             # FastAPI application
│   ├── middleware.py       # JWT validation middleware
│   └── pyproject.toml      # Python dependencies
├── nextjs/                  # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and configuration
│   │   ├── auth.ts         # Better Auth configuration
│   │   ├── constants.ts    # All constants (IMPORTANT)
│   │   └── database.ts     # Database connection
│   └── package.json        # Node.js dependencies
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

- Are all strings using constants from `constants.ts` or `config.py`?
- **Am I using Better Auth APIs instead of direct database queries for auth/org/team/permission operations?**
- Is the implementation simple and straightforward?
- Are files kept under 500 lines?
- Have I linted and formatted the code?
- Are new endpoints properly protected or added to public routes?
- Is the commit message following conventional commits?

