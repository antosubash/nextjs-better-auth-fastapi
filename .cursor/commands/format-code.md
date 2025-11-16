Format code for both frontend and backend without checking.

This command will:
1. Format backend Python code with ruff
2. Format frontend code with Biome

Execute the following commands:
- Backend: `cd backend && uv run ruff format .`
- Frontend: `cd nextjs && pnpm format`
