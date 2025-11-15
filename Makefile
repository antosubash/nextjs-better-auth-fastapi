.PHONY: help install backend frontend dev clean lint lint-backend lint-frontend format format-backend format-frontend check check-backend check-frontend type-check build build-backend build-frontend docker-build docker-build-backend docker-build-frontend migrate migrate-backend migrate-frontend seed

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
	@echo "  make build-backend   - Build backend (sync deps and verify app)"
	@echo "  make build-frontend  - Build frontend Next.js app"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build         - Build Docker images for both backend and frontend"
	@echo "  make docker-build-backend - Build Docker image for backend"
	@echo "  make docker-build-frontend - Build Docker image for frontend"
	@echo ""
	@echo "Database:"
	@echo "  make migrate         - Run database migrations for both frontend and backend"
	@echo "  make migrate-backend - Run backend database migrations (Alembic)"
	@echo "  make migrate-frontend - Run frontend database migrations (Drizzle)"
	@echo "  make seed            - Seed database with initial data"
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

# Seed database with initial data
seed:
	@echo "Seeding database with initial data..."
	cd nextjs && pnpm seed

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

# Build backend
build-backend:
	@echo "Building backend..."
	@echo "Syncing dependencies..."
	cd backend && uv sync
	@echo "Verifying application can be imported..."
	cd backend && uv run python -c "from main import app; print('✓ Application imported successfully')"
	@echo "Backend build complete!"

# Build frontend
build-frontend:
	@echo "Building frontend..."
	cd nextjs && pnpm build

# Build both backend and frontend
build: build-backend build-frontend
	@echo "Build complete!"

# Build Docker image for backend
docker-build-backend:
	@echo "Building Docker image for backend..."
	docker build -t nextjs-better-auth-backend:latest -f backend/Dockerfile backend/
	@echo "Backend Docker image built successfully!"

# Build Docker image for frontend
docker-build-frontend:
	@echo "Building Docker image for frontend..."
	@if [ -f .env ]; then \
		set -a && . ./.env && set +a && \
		DOCKER_BUILDKIT=1 docker build \
			--secret id=DATABASE_URL,env=DATABASE_URL \
			--secret id=BETTER_AUTH_SECRET,env=BETTER_AUTH_SECRET \
			--build-arg BETTER_AUTH_URL="$${BETTER_AUTH_URL:-http://localhost:3000}" \
			--build-arg NEXT_PUBLIC_API_URL="$${NEXT_PUBLIC_API_URL:-http://localhost:8000}" \
			-t nextjs-better-auth-frontend:latest \
			-f nextjs/Dockerfile nextjs/; \
	else \
		echo "Warning: .env file not found. Using default values. Build may fail if DATABASE_URL is required."; \
		export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_auth_db" && \
		export BETTER_AUTH_SECRET="change-me-in-production" && \
		DOCKER_BUILDKIT=1 docker build \
			--secret id=DATABASE_URL,env=DATABASE_URL \
			--secret id=BETTER_AUTH_SECRET,env=BETTER_AUTH_SECRET \
			--build-arg BETTER_AUTH_URL="http://localhost:3000" \
			--build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" \
			-t nextjs-better-auth-frontend:latest \
			-f nextjs/Dockerfile nextjs/; \
	fi
	@echo "Frontend Docker image built successfully!"

# Build Docker images for both backend and frontend
docker-build: docker-build-backend docker-build-frontend
	@echo "Docker build complete!"

