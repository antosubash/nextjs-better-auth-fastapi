#!/bin/bash
set -e

# Check if database reset is enabled
if [ "${RESET_DB_ON_STARTUP:-false}" = "true" ]; then
    echo "RESET_DB_ON_STARTUP is enabled. Resetting database..."
    set +e  # Temporarily disable exit on error for reset check
    uv run python scripts/reset_db.py
    RESET_EXIT_CODE=$?
    set -e  # Re-enable exit on error

    if [ $RESET_EXIT_CODE -eq 0 ]; then
        echo "Database reset completed successfully"
    else
        echo "Warning: Database reset exited with code $RESET_EXIT_CODE"
        echo "Continuing with migrations..."
    fi
else
    echo "RESET_DB_ON_STARTUP is not enabled. Skipping database reset."
fi

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

