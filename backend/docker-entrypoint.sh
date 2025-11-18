#!/bin/bash
set -e

echo "Running backend database migrations..."
uv run alembic upgrade head

echo "Starting FastAPI application..."
exec "$@"

