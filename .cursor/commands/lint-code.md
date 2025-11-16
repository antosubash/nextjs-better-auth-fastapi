Lint code for both frontend and backend without auto-fixing.

This command will:
1. Lint backend Python code with ruff (check only)
2. Lint frontend code with Biome (check only)

Execute the following commands:
- Backend: `cd backend && uv run ruff check .`
- Frontend: `cd nextjs && pnpm lint:biome`
