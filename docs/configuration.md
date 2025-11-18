# Configuration Reference

Complete reference for all configuration options and environment variables in the Next.js Better Auth FastAPI application.

## Environment Variables

All environment variables are configured in a single `.env` file at the project root. Both the frontend and backend automatically load from this file.

### Better Auth Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BETTER_AUTH_URL` | Base URL for Better Auth service | `http://localhost:3000` | Yes |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth (use secure value in production) | `change-me-in-production` | Yes |

**Example:**

```bash
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secure-secret-key-here
```

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string (async format). This is the source of truth for database connection. | `postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db` | Yes |
| `DB_SCHEMA` | Database schema name for backend | `api` | No |
| `DB_POOL_SIZE` | Connection pool size | `5` | No |
| `DB_MAX_OVERFLOW` | Maximum pool overflow | `10` | No |
| `DB_POOL_TIMEOUT` | Pool timeout in seconds | `30` | No |
| `DB_POOL_RECYCLE` | Connection recycle time in seconds | `3600` | No |

**Note:** `DATABASE_URL` is the primary configuration. For docker-compose, `POSTGRES_*` variables use hardcoded defaults matching the `DATABASE_URL` default and can be overridden if needed.

**Example:**

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db
DB_SCHEMA=api
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
```

### Backend Configuration

#### Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` | No |
| `LOG_FORMAT_JSON` | Use JSON logging format | `false` | No |

**Example:**

```bash
LOG_LEVEL=INFO
LOG_FORMAT_JSON=false
```

#### CORS

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000` | Yes |

**Example:**

```bash
CORS_ORIGINS=http://localhost:3000,https://example.com
```

#### HTTP Client

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HTTP_CLIENT_TIMEOUT` | HTTP client timeout in seconds | `5.0` | No |

**Example:**

```bash
HTTP_CLIENT_TIMEOUT=5.0
```

#### File Operations

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OUTPUT_FILE_PATH` | Path for output file operations | `output_file.txt` | No |

**Example:**

```bash
OUTPUT_FILE_PATH=output_file.txt
```

#### JWKS Cache

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWKS_CACHE_TTL_SECONDS` | JWKS cache TTL in seconds | `3600` | No |

**Example:**

```bash
JWKS_CACHE_TTL_SECONDS=3600
```

#### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` | No |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Maximum requests per IP per minute | `60` | No |

### Security Headers Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECURITY_HEADERS_ENABLED` | Enable/disable security headers middleware (backend) | `true` | No |
| `HSTS_MAX_AGE` | HSTS max age in seconds (1 year = 31536000) | `31536000` | No |
| `CSP_POLICY` | Content Security Policy string | See default in env.example | No |
| `PERMISSIONS_POLICY` | Permissions Policy string | See default in env.example | No |
| `NEXT_PUBLIC_SECURITY_HEADERS_ENABLED` | Enable/disable security headers (frontend) | `true` | No |
| `NEXT_PUBLIC_HSTS_MAX_AGE` | HSTS max age in seconds for frontend | `31536000` | No |
| `NEXT_PUBLIC_CSP_POLICY` | Content Security Policy for frontend | See default in env.example | No |
| `NEXT_PUBLIC_PERMISSIONS_POLICY` | Permissions Policy for frontend | See default in env.example | No |

### Logging Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` | No |
| `LOG_FORMAT_JSON` | Use JSON logging format | `false` | No |
| `NEXT_PUBLIC_LOG_LEVEL` | Log level for frontend (client-side) | `info` | No |

**Example:**

```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### Frontend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` | Yes |

**Example:**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### MinIO/S3 Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MINIO_ENDPOINT` | MinIO endpoint | `localhost:9000` | No |
| `MINIO_ROOT_USER` | MinIO server root user (for docker-compose) | `minioadmin` | No |
| `MINIO_ROOT_PASSWORD` | MinIO server root password (for docker-compose) | `minioadmin` | No |
| `MINIO_ACCESS_KEY` | MinIO access key (for S3 API access) | `minioadmin` | No |
| `MINIO_SECRET_KEY` | MinIO secret key (for S3 API access) | `minioadmin` | No |
| `MINIO_USE_SSL` | Use SSL for MinIO | `false` | No |
| `MINIO_BUCKET_NAME` | MinIO bucket name | `better-auth-storage` | No |
| `MINIO_REGION` | MinIO region | `us-east-1` | No |
| `MINIO_API_PORT` | MinIO API port | `9000` | No |
| `MINIO_CONSOLE_PORT` | MinIO console port | `9001` | No |

**Note:** `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` are the initial admin credentials for the MinIO server (used in docker-compose). `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` are the S3 API credentials used by the backend application. They can be the same or different depending on your setup.

**Example:**

```bash
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=better-auth-storage
MINIO_REGION=us-east-1
```

### Job Scheduler Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JOB_STORE_TABLE_NAME` | Job store table name | `apscheduler_jobs` | No |
| `JOB_EXECUTOR_MAX_WORKERS` | Maximum worker threads | `10` | No |
| `JOB_MISFIRE_GRACE_TIME_SECONDS` | Misfire grace time in seconds | `3600` | No |
| `JOB_PERSISTENCE_VERIFY_MAX_RETRIES` | Max retries for job persistence verification | `5` | No |
| `JOB_PERSISTENCE_VERIFY_RETRY_DELAY_SECONDS` | Retry delay for job persistence verification | `0.2` | No |
| `LOG_RETRY_MAX_ATTEMPTS` | Max retries for log retrieval | `3` | No |
| `LOG_RETRY_DELAY_SECONDS` | Retry delay for log retrieval | `0.1` | No |

**Note:** `JOB_STORE_URL` is auto-generated from `DATABASE_URL` (converted to sync format). APScheduler requires a synchronous database connection (postgresql:// not postgresql+asyncpg://).

**Example:**

```bash
JOB_STORE_TABLE_NAME=apscheduler_jobs
JOB_EXECUTOR_MAX_WORKERS=10
JOB_MISFIRE_GRACE_TIME_SECONDS=3600
```

### Docker Compose Configuration

These variables are used by Docker Compose for PostgreSQL, MinIO, and pgWeb:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | PostgreSQL username (defaults match `DATABASE_URL`) | `postgres` | No |
| `POSTGRES_PASSWORD` | PostgreSQL password (defaults match `DATABASE_URL`) | `postgres` | No |
| `POSTGRES_DB` | PostgreSQL database name (defaults match `DATABASE_URL`) | `better_auth_db` | No |
| `POSTGRES_PORT` | PostgreSQL port | `5432` | No |
| `PGWEB_PORT` | pgWeb port | `8081` | No |
<<<<<<< HEAD
| `MINIO_ROOT_USER` | MinIO server root user | `minioadmin` | No |
| `MINIO_ROOT_PASSWORD` | MinIO server root password | `minioadmin` | No |
| `MINIO_API_PORT` | MinIO API port | `9000` | No |
| `MINIO_CONSOLE_PORT` | MinIO console port | `9001` | No |

**Note:** Docker Compose uses hardcoded defaults that match the `DATABASE_URL` default. These can be overridden via environment variables if needed. MinIO root credentials (`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`) are separate from S3 API credentials (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`).

## Configuration Files

### Backend Configuration

Configuration is loaded from environment variables in `backend/core/config.py`:

```python
# Better Auth configuration
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000")
JWKS_URL = f"{BETTER_AUTH_URL}/api/auth/jwks"
BETTER_AUTH_VERIFY_API_KEY_URL = f"{BETTER_AUTH_URL}/api/auth/verify-api-key"

# Public routes (no authentication required)
PUBLIC_ROUTES: set[str] = {"/", "/docs", "/openapi.json", "/redoc", "/health"}
```

### Frontend Configuration

Constants are defined in `nextjs/lib/constants.ts`:

```typescript
export const BETTER_AUTH_CONFIG = {
  BASE_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
} as const;
```

## Environment-Specific Configuration

### Development

```bash
# .env.development
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db
LOG_LEVEL=DEBUG
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### Production

```bash
# .env.production
BETTER_AUTH_URL=https://auth.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql+asyncpg://user:password@db.example.com:5432/better_auth_db
LOG_LEVEL=INFO
LOG_FORMAT_JSON=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
CORS_ORIGINS=https://example.com
BETTER_AUTH_SECRET=your-secure-production-secret
```

## Security Considerations

### Secrets Management

1. **Never commit secrets** to version control
2. **Use strong secrets** in production (generate with `openssl rand -hex 32`)
3. **Rotate secrets** regularly
4. **Use secret management** services in production (AWS Secrets Manager, HashiCorp Vault, etc.)

### Production Checklist

- [ ] Change `BETTER_AUTH_SECRET` to a secure value
- [ ] Use HTTPS for all URLs
- [ ] Configure proper CORS origins
- [ ] Set appropriate rate limits
- [ ] Enable JSON logging for log aggregation
- [ ] Configure security headers (CSP, HSTS, etc.)
- [ ] Review and customize Content Security Policy
- [ ] Set appropriate HSTS max age
- [ ] Configure Permissions Policy based on your needs
- [ ] Use production database credentials
- [ ] Configure proper database connection pooling
- [ ] Set up monitoring and alerting
- [ ] Review and update all default values

## Configuration Validation

### Backend

Configuration is validated on application startup. Check logs for any configuration errors.

### Frontend

Next.js validates environment variables at build time. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Troubleshooting

### Configuration Not Loading

1. **Check file location**: Ensure `.env` is in the project root
2. **Check file format**: Ensure no spaces around `=`
3. **Restart servers**: Configuration is loaded on startup
4. **Check logs**: Look for configuration errors in logs

### Environment Variables Not Available

1. **Frontend**: Ensure variables are prefixed with `NEXT_PUBLIC_` if needed in browser
2. **Backend**: Check that variables are loaded from `.env` file
3. **Docker**: Ensure variables are passed to containers

### Database Connection Issues

1. **Check connection string format**: Must use `postgresql+asyncpg://` for async
2. **Verify credentials**: Ensure username, password, and database name are correct
3. **Check network**: Ensure database is accessible from application
4. **Check pool settings**: Adjust pool size if needed

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Development Guide](./development.md) - Development workflow
- [Deployment Guide](./deployment.md) - Production deployment

