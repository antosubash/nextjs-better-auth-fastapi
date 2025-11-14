.PHONY: help install backend frontend dev clean lint lint-backend lint-frontend format format-backend format-frontend check check-backend check-frontend type-check build build-backend build-frontend migrate migrate-backend migrate-frontend

# Default target
help:
	@echo "Available targets:"
	@echo ""
	@echo "Installation:"
	@echo "  make install         - Install dependencies for both backend and frontend"
	@echo ""
	@echo "Development:"
	@echo "  make backend         - Run the FastAPI backend server"
	@echo "  make frontend        - Run the Next.js frontend server"
	@echo "  make dev             - Run both backend and frontend in parallel"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint            - Lint both backend and frontend code"
	@echo "  make lint-backend     - Lint backend code with ruff"
	@echo "  make lint-frontend    - Lint frontend code with Biome"
	@echo "  make format          - Format both backend and frontend code"
	@echo "  make format-backend  - Format backend code with ruff"
	@echo "  make format-frontend - Format frontend code with Biome"
	@echo "  make check           - Check both backend and frontend (lint + format)"
	@echo "  make check-backend   - Check backend code (lint + format check)"
	@echo "  make check-frontend  - Check frontend code with Biome"
	@echo "  make type-check      - Type check frontend TypeScript code"
	@echo ""
	@echo "Build:"
	@echo "  make build           - Build both backend and frontend"
	@echo "  make build-backend   - Build backend (if applicable)"
	@echo "  make build-frontend  - Build frontend Next.js app"
	@echo ""
	@echo "Database:"
	@echo "  make migrate         - Run database migrations for both frontend and backend"
	@echo "  make migrate-backend - Run backend database migrations (Alembic)"
	@echo "  make migrate-frontend - Run frontend database migrations (Drizzle)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean           - Clean up generated files"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && uv sync
	@echo "Installing frontend dependencies..."
	cd nextjs && pnpm install

# Run backend server
backend:
	@echo "Starting FastAPI backend server..."
	cd backend && uv run fastapi dev main.py

# Run frontend server
frontend:
	@echo "Starting Next.js frontend server..."
	cd nextjs && pnpm dev

# Run both servers in parallel
dev:
	@echo "Starting both backend and frontend servers..."
	@make -j2 backend frontend

# Run backend database migrations
migrate-backend:
	@echo "Running backend database migrations..."
	cd backend && uv run alembic upgrade head

# Run frontend database migrations
migrate-frontend:
	@echo "Running frontend database migrations..."
	cd nextjs && pnpm drizzle-kit migrate

# Run both backend and frontend migrations
migrate: migrate-backend migrate-frontend
	@echo "Database migrations complete!"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	cd backend && rm -rf __pycache__ *.pyc output_file.txt
	cd nextjs && rm -rf .next node_modules/.cache

# Lint backend code
lint-backend:
	@echo "Linting backend code..."
	cd backend && uv run ruff check .

# Lint frontend code
lint-frontend:
	@echo "Linting frontend code..."
	cd nextjs && pnpm lint:biome

# Lint both backend and frontend
lint: lint-backend lint-frontend
	@echo "Linting complete!"

# Format backend code
format-backend:
	@echo "Formatting backend code..."
	cd backend && uv run ruff format .

# Format frontend code
format-frontend:
	@echo "Formatting frontend code..."
	cd nextjs && pnpm format

# Format both backend and frontend
format: format-backend format-frontend
	@echo "Formatting complete!"

# Check backend code (lint + format check)
check-backend:
	@echo "Checking backend code..."
	cd backend && uv run ruff check . && uv run ruff format --check .

# Check frontend code with Biome
check-frontend:
	@echo "Checking frontend code..."
	cd nextjs && pnpm check

# Check both backend and frontend
check: check-backend check-frontend
	@echo "All checks complete!"

# Type check frontend TypeScript
type-check:
	@echo "Type checking frontend code..."
	cd nextjs && pnpm type-check

# Build backend (placeholder - add build steps if needed)
build-backend:
	@echo "Building backend..."
	@echo "No build step configured for backend"

# Build frontend
build-frontend:
	@echo "Building frontend..."
	cd nextjs && pnpm build

# Build both backend and frontend
build: build-backend build-frontend
	@echo "Build complete!"

