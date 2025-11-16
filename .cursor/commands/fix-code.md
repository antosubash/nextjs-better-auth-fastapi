Auto-fix linting and formatting issues for both frontend and backend.

This command will:
1. Format backend Python code with ruff
2. Auto-fix frontend linting and formatting issues with Biome

Execute the following commands:
- Backend: `cd backend && uv run ruff format . && uv run ruff check --fix .`
- Frontend: `cd nextjs && pnpm check:fix`
