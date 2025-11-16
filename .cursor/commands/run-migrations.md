Run database migrations for both frontend (Drizzle) and backend (Alembic).

This command will:
1. Run backend Alembic migrations
2. Run frontend Drizzle migrations

Execute the following commands:
- Backend: `cd backend && uv run alembic upgrade head`
- Frontend: `cd nextjs && pnpm drizzle-kit migrate`
