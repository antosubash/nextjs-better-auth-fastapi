# Development Guide

This guide covers development workflows, code conventions, and best practices for the Next.js Better Auth FastAPI project.

## Development Workflow

### Setting Up Development Environment

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd nextjs-better-auth-fastapi
   make install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Run Migrations**
   ```bash
   make migrate
   ```

4. **Start Development Servers**
   ```bash
   make dev
   ```

### Code Quality

#### Linting and Formatting

**Frontend (Next.js):**

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

**Backend (FastAPI):**

```bash
# Lint
cd backend && uv run ruff check .

# Format
cd backend && uv run ruff format .

# Check (lint + format check)
cd backend && uv run ruff check . && uv run ruff format --check .
```

**Using Make Commands:**

```bash
make lint          # Lint both
make format        # Format both
make check         # Check both
make type-check    # Type check frontend
```

#### Pre-commit Checks

Always run linting and formatting before committing:

```bash
make check
make type-check
```

## Code Conventions

### Constants and Configuration

**CRITICAL**: Never hardcode strings. Always use constants from:

- **Frontend**: `nextjs/lib/constants.ts` - Contains all UI strings, labels, placeholders, error messages
- **Backend**: `backend/core/config.py` - Contains environment-based configuration constants
- **Backend**: `backend/core/constants.py` - Contains error messages and other hardcoded strings

**Frontend Example:**

```typescript
// ✅ Good
import { AUTH_LABELS } from "@/lib/constants";
<button>{AUTH_LABELS.LOGIN}</button>

// ❌ Bad
<button>Log in</button>
```

**Backend Example:**

```python
# ✅ Good
from core.config import BETTER_AUTH_URL, JWKS_URL
from core.constants import ErrorMessages

# ❌ Bad
url = "http://localhost:3000"
error_msg = "Something went wrong"
```

### Better Auth API Usage

**CRITICAL**: Always use Better Auth APIs for authentication, organization, team, and permission operations. **NEVER query the database directly** for these operations.

**Frontend:**

```typescript
// ✅ Good - Use Better Auth APIs
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers });
const organizations = await auth.api.listOrganizations({ headers });
const teams = await auth.api.listTeams({ headers, query: { organizationId } });

// ❌ Bad - Direct database access
import { db } from "@/lib/database";
const user = await db.select().from(users).where(eq(users.id, userId));
```

**Backend:**

```python
# ✅ Good - Use Better Auth verification endpoint
from core.auth import verify_api_key
api_key_data = await verify_api_key(api_key)

# ❌ Bad - Direct database queries for auth data
from models import ApiKey
api_key = await session.query(ApiKey).filter_by(key=api_key).first()
```

### File Organization

- **Keep files under 500 lines** - Split large files into smaller, focused modules
- **Simple over complex** - Prioritize straightforward implementations
- **Type safety** - Use TypeScript types and Python type hints

### Frontend Patterns

#### Component Structure

```typescript
// Components in nextjs/components/
export const MyComponent = () => {
  return <div>Content</div>;
};
```

#### API Routes

```typescript
// API routes in nextjs/app/api/
export async function GET(request: Request) {
  // Handler logic
}
```

#### Database Access

- Schema defined in `nextjs/auth-schema.ts`
- Connection in `nextjs/lib/database.ts`
- Migrations in `nextjs/drizzle/`
- **IMPORTANT**: Do NOT query the database directly for auth, organization, team, or permission data. Always use Better Auth APIs.

### Backend Patterns

#### Configuration

```python
# ✅ Good
from core.config import BETTER_AUTH_URL, JWKS_URL
from core.constants import ErrorMessages

# ❌ Bad
url = "http://localhost:3000"
error_msg = "Something went wrong"
```

#### JWT Verification

```python
from fastapi import Request

@app.post("/protected-endpoint")
async def protected_route(request: Request):
    # Access unified user ID (works for both JWT and API key auth)
    user_id = request.state.user_id
    
    # Or access specific auth data if needed
    token_data = getattr(request.state, "token_data", None)
    api_key_data = getattr(request.state, "api_key_data", None)
    
    # Your logic here
    return {"user_id": user_id}
```

#### Public Routes

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

#### Adding New Endpoints

1. Create router in `backend/routers/`
2. Include router in `backend/core/app.py`
3. Add route handlers with proper authentication

**Example:**

```python
# backend/routers/my_router.py
from fastapi import APIRouter, Request

router = APIRouter(prefix="/my-endpoint", tags=["my"])

@router.get("/")
async def my_endpoint(request: Request):
    user_id = request.state.user_id
    return {"user_id": user_id}

# backend/core/app.py
from routers import my_router

app.include_router(my_router.router)
```

## Database Migrations

### Frontend (Drizzle ORM)

Migrations are located in `nextjs/drizzle/`:

```bash
# Generate migration
cd nextjs && pnpm drizzle-kit generate

# Run migration
cd nextjs && pnpm drizzle-kit migrate

# Or use make command
make migrate-frontend
```

### Backend (Alembic)

Migrations are located in `backend/alembic/versions/`:

```bash
# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Run migrations
cd backend && uv run alembic upgrade head

# Or use make command
make migrate-backend
```

### Migration Best Practices

1. **Always review auto-generated migrations** before applying
2. **Test migrations** on a development database first
3. **Create rollback migrations** for destructive changes
4. **Document migration purpose** in migration message

## Adding New Features

### Adding a New Protected Endpoint

**Backend:**

1. Create router in `backend/routers/`
2. Add route handler with authentication
3. Include router in `backend/core/app.py`
4. Add Pydantic schemas in `backend/schemas/`
5. Add service logic in `backend/services/` (if needed)

**Example:**

```python
# backend/routers/example.py
from fastapi import APIRouter, Request
from schemas.example import ExampleCreate, ExampleResponse
from services.example_service import ExampleService

router = APIRouter(prefix="/example", tags=["example"])

@router.post("/", response_model=ExampleResponse)
async def create_example(
    data: ExampleCreate,
    request: Request,
    service: ExampleService = Depends(get_example_service)
):
    user_id = request.state.user_id
    return await service.create(data, user_id)
```

### Adding a Public Endpoint

1. Create router and route handler
2. Add route path to `PUBLIC_ROUTES` in `backend/core/config.py`

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

## Testing

### Running Tests

**Frontend:**

```bash
cd nextjs && pnpm test
```

**Backend:**

```bash
cd backend && uv run pytest
```

### Writing Tests

**Frontend:**

```typescript
// Use Next.js testing utilities
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

**Backend:**

```python
# Use FastAPI test client
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
```

## Debugging

### Frontend Debugging

1. **Browser DevTools**: Use React DevTools and browser console
2. **Next.js Debugging**: Use `console.log` and Next.js error pages
3. **Type Checking**: Run `make type-check` to catch type errors

### Backend Debugging

1. **Logging**: Check application logs for errors
2. **Request ID**: Use request ID from response headers to trace requests
3. **Interactive Docs**: Use Swagger UI at `/docs` to test endpoints
4. **Python Debugger**: Use `pdb` or IDE debugger

### Common Issues

#### Authentication Not Working

1. Check `BETTER_AUTH_SECRET` is set
2. Verify `BETTER_AUTH_URL` matches frontend URL
3. Check CORS configuration
4. Review authentication logs

#### Database Connection Errors

1. Verify PostgreSQL is running
2. Check database credentials
3. Ensure migrations are run
4. Check connection pool settings

#### Import Errors

1. Check Python/Node.js paths
2. Verify dependencies are installed
3. Check for circular imports
4. Restart development servers

## Git Workflow

### Commit Messages

Use conventional commits format:

```
fix: resolve JWT verification issue
docs: update API documentation
refactor: simplify authentication middleware
```

**Guidelines:**
- Use present tense ("fix" not "fixed")
- Reduce usage of "feat" prefix
- Be descriptive but concise

### Branch Strategy

1. Create feature branch from `main`
2. Make changes and test
3. Run linting and formatting
4. Create pull request
5. Merge after review

## Performance Considerations

### Frontend

- Use Next.js Image component for images
- Implement code splitting
- Optimize bundle size
- Use React.memo for expensive components

### Backend

- Use async/await for I/O operations
- Implement connection pooling
- Cache JWKS appropriately
- Use database indexes
- Monitor query performance

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate input** - Use Pydantic schemas and TypeScript types
3. **Use constants** - Never hardcode sensitive values
4. **Follow authentication patterns** - Use Better Auth APIs
5. **Review dependencies** - Keep dependencies updated
6. **Use HTTPS in production** - Never use HTTP for sensitive data

## Related Documentation

- [Getting Started](./getting-started.md) - Setup and installation
- [Architecture Overview](./architecture.md) - System architecture
- [Authentication Guide](./authentication.md) - Authentication details
- [API Reference](./api-reference.md) - API endpoints
- [Configuration Reference](./configuration.md) - Configuration options

