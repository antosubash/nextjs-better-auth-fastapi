Start both backend and frontend development servers in parallel.

This command will:
1. Start FastAPI backend server on port 8000
2. Start Next.js frontend server on port 3000

Execute: `make dev`

Or run separately:
- Backend only: `make backend` or `cd backend && uv run fastapi dev main.py`
- Frontend only: `make frontend` or `cd nextjs && pnpm dev`
