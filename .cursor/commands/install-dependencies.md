Install all dependencies for both frontend and backend.

This command will:
1. Install backend Python dependencies using uv
2. Install frontend Node.js dependencies using pnpm

Execute: `make install`

Or run separately:
- Backend: `cd backend && uv sync`
- Frontend: `cd nextjs && pnpm install`
