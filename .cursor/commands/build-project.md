Build both frontend and backend projects.

This command will:
1. Build backend (sync dependencies and verify app can be imported)
2. Build frontend Next.js application for production

Execute: `make build`

Or run separately:
- Backend: `make build-backend` or `cd backend && uv sync && uv run python -c "from main import app"`
- Frontend: `make build-frontend` or `cd nextjs && pnpm build`
