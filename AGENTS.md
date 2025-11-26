# AGENTS.md

## Commands

**Build/Lint:**
- `make build` - Build both frontend & backend
- `make lint` - Lint both (Biome for frontend, ruff for backend)
- `make check` - Lint + format check without modifying files
- `make type-check` - TypeScript type checking (frontend)

**Testing:**
- Frontend: `cd nextjs && pnpm test` (or `pnpm test path/to/test.test.ts`)
- Backend: `cd backend && uv run pytest` (or `uv run pytest path/to/test.py`)

**Development:**
- `make dev` - Run both servers
- `make backend` - FastAPI on :8000
- `make frontend` - Next.js on :3000

## Code Style Guidelines

**CRITICAL Rules:**
1. **NEVER hardcode strings** - Use constants from `nextjs/lib/constants.ts` or `backend/core/constants.py`
2. **Better Auth API First** - Always use Better Auth APIs for auth/org/team/permission operations, NEVER direct database queries
3. **File size limit** - Keep files under 500 lines, split large files

**Frontend (Next.js):**
- Components: PascalCase, files: kebab-case
- Use Biome for formatting/linting
- Import order: React, third-party, @/ imports, local
- TypeScript strict mode, proper types for all props/returns

**Backend (FastAPI):**
- Classes: PascalCase, functions/files: snake_case
- Use ruff for formatting/linting
- Type hints required for all functions
- Async/await for I/O operations
- Proper error handling with custom exceptions

**Imports:**
- Frontend: Group imports (React, third-party, @/, relative)
- Backend: Standard library, third-party, local imports

**Error Handling:**
- Use constants for error messages
- Log errors with context
- Frontend: Error boundaries, user-friendly messages
- Backend: Custom exceptions, proper HTTP status codes

**Key Files:**
- Frontend constants: `nextjs/lib/constants.ts`
- Backend config: `backend/core/config.py`
- Backend constants: `backend/core/constants.py`
- Auth config: `nextjs/lib/auth.ts`