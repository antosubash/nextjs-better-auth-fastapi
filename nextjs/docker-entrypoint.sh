#!/bin/bash
set -e

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


