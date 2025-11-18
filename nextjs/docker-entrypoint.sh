#!/bin/bash
set -e

echo "Running frontend database migrations..."

# Run Better Auth migrations first
echo "Running Better Auth migrations..."
if npx @better-auth/cli migrate; then
    echo "Better Auth migrations completed successfully"
else
    echo "Warning: Better Auth migrations failed or were skipped (this may be normal if already migrated)"
fi

# Run Drizzle migrations
echo "Running Drizzle migrations..."
pnpm drizzle-kit migrate

echo "Starting Next.js application..."
exec "$@"

