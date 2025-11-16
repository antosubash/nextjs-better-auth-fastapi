Run linting, formatting, and type checking for both frontend and backend.

This command will:
1. Lint and format backend code with ruff
2. Lint and format frontend code with Biome
3. Type check frontend TypeScript code

Execute the following commands:
- Backend: `cd backend && uv run ruff check . && uv run ruff format .`
- Frontend: `cd nextjs && pnpm check && pnpm type-check`