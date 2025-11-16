Validate backend code quality (lint and format check without modifying files).

This command will:
1. Check backend code with ruff (linting)
2. Check formatting without modifying files

Execute: `cd backend && uv run ruff check . && uv run ruff format --check .`

This is useful for CI/CD or pre-commit checks.
