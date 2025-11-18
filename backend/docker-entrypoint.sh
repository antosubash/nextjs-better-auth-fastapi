#!/bin/bash
set -e

echo "Running backend database migrations..."
set +e  # Temporarily disable exit on error for migration check
uv run python scripts/migrate.py
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "Backend migrations completed successfully"
else
    echo "Warning: Backend migrations exited with code $MIGRATION_EXIT_CODE"
    echo "This may be normal if migrations were already applied"
    echo "Continuing with application startup..."
fi

echo "Starting FastAPI application..."
exec "$@"

