# Database Migrations

This guide covers database migration procedures for both frontend and backend.

## Overview

The project uses two migration systems:
- **Frontend**: Drizzle ORM migrations (for Better Auth schema)
- **Backend**: Alembic migrations (for backend API schema)

Both systems use the same PostgreSQL database but manage different schemas/tables.

## Frontend Migrations (Drizzle ORM)

The frontend uses Drizzle ORM to manage Better Auth database schema.

### Generate Migration

After modifying the schema in `nextjs/auth-schema.ts`, generate a migration:

```bash
cd nextjs
npx drizzle-kit generate
```

This creates migration files in `nextjs/drizzle/` directory.

### Run Migrations

Apply migrations to the database:

```bash
cd nextjs
npx drizzle-kit migrate
```

### Using Make Commands

```bash
# Generate migration
cd nextjs && npx drizzle-kit generate

# Run migration
make migrate-frontend
```

### Better Auth Migrations

Better Auth also provides its own migration command:

```bash
cd nextjs
npx @better-auth/cli migrate
```

**Note**: Run Better Auth migrations first, then Drizzle migrations if you've made custom schema changes.

## Backend Migrations (Alembic)

The backend uses Alembic to manage API database schema.

### Create Migration

After modifying SQLAlchemy models in `backend/models/`, create a migration:

```bash
cd backend
uv run alembic revision --autogenerate -m "description of changes"
```

This creates a migration file in `backend/alembic/versions/`.

### Review Migration

**IMPORTANT**: Always review auto-generated migrations before applying them. Alembic may not detect all changes correctly.

### Run Migrations

Apply migrations to the database:

```bash
cd backend
uv run alembic upgrade head
```

### Rollback Migration

Rollback to a previous migration:

```bash
cd backend
uv run alembic downgrade -1  # Rollback one migration
uv run alembic downgrade <revision_id>  # Rollback to specific revision
```

### Using Make Commands

```bash
# Run migrations
make migrate-backend
```

## Running All Migrations

To run both frontend and backend migrations:

```bash
make migrate
```

This runs:
1. Backend migrations (Alembic)
2. Frontend migrations (Drizzle)

## Migration Best Practices

1. **Always review auto-generated migrations** before applying
2. **Test migrations on development database** first
3. **Create descriptive migration messages** explaining the changes
4. **Backup database** before running migrations in production
5. **Run migrations in order**: Better Auth → Drizzle → Alembic
6. **Document breaking changes** in migration messages
7. **Test rollback procedures** before deploying to production

## Troubleshooting

### Migration Conflicts

If migrations conflict:
1. Check migration order
2. Review migration files for conflicts
3. Manually resolve conflicts in migration files
4. Test on development database

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check database is running and accessible
3. Verify database credentials
4. Check network connectivity

### Schema Mismatches

1. Review current database schema
2. Compare with migration files
3. Check for manual schema changes
4. Consider creating a new migration to sync

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Development Guide](./development.md) - Development workflow
- [Configuration Reference](./configuration.md) - Environment variables
