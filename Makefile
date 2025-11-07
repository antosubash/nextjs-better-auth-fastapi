.PHONY: help install backend frontend dev clean

# Default target
help:
	@echo "Available targets:"
	@echo "  make install    - Install dependencies for both backend and frontend"
	@echo "  make backend    - Run the FastAPI backend server"
	@echo "  make frontend   - Run the Next.js frontend server"
	@echo "  make dev        - Run both backend and frontend in parallel"
	@echo "  make clean      - Clean up generated files"

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

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	cd backend && rm -rf __pycache__ *.pyc output_file.txt
	cd nextjs && rm -rf .next node_modules/.cache

