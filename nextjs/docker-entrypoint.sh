#!/bin/bash
set -e

# Check if database reset is enabled
if [ "${RESET_DB_ON_STARTUP:-false}" = "true" ]; then
    echo "RESET_DB_ON_STARTUP is enabled. Resetting database..."
    set +e  # Temporarily disable exit on error for reset check
    pnpm tsx scripts/reset-db.ts
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

echo "Running frontend database migrations..."

# Skip Better Auth migrations - not needed when using Drizzle adapter
# Better Auth migrations are only for the built-in Kysely adapter
echo "Skipping Better Auth migrations (using Drizzle adapter)"

# Run Drizzle migrations using programmatic approach
# Note: This uses the migrate() function from drizzle-orm which is more reliable
# for runtime migrations in Docker containers than the drizzle-kit CLI
echo "Running Drizzle migrations..."
set +e  # Temporarily disable exit on error for migration check
pnpm tsx scripts/migrate.ts
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "Drizzle migrations completed successfully"
    
    # Run seed script after successful migrations if reset was enabled
    if [ "${RESET_DB_ON_STARTUP:-false}" = "true" ]; then
        echo "Running database seed script..."
        set +e  # Temporarily disable exit on error for seed check
        pnpm seed
        SEED_EXIT_CODE=$?
        set -e  # Re-enable exit on error

        if [ $SEED_EXIT_CODE -eq 0 ]; then
            echo "Database seeding completed successfully"
        else
            echo "Warning: Database seeding exited with code $SEED_EXIT_CODE"
            echo "Continuing with application startup..."
        fi
    fi
else
    echo "Warning: Drizzle migrations exited with code $MIGRATION_EXIT_CODE"
    echo "This may be normal if migrations were already applied or tables already exist"
    echo "Continuing with application startup..."
fi

# Run database seeding
echo "Running database seeding..."
set +e  # Temporarily disable exit on error for seeding check
pnpm seed
SEED_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $SEED_EXIT_CODE -eq 0 ]; then
    echo "Database seeding completed successfully"
else
    echo "Warning: Database seeding exited with code $SEED_EXIT_CODE"
    echo "This may be normal if data was already seeded"
    echo "Continuing with application startup..."
fi

echo "Starting Next.js application..."
exec "$@"


