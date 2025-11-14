# Deployment Guide

This guide covers deploying the Next.js Better Auth FastAPI application to production environments.

## Prerequisites

Before deploying, ensure you have:

- Production database (PostgreSQL)
- Production storage (MinIO/S3 or compatible)
- Domain names configured
- SSL certificates (for HTTPS)
- Environment variables configured
- Secrets management system

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Strong secrets generated and stored securely
- [ ] Database migrations tested and ready
- [ ] CORS origins configured correctly
- [ ] Rate limiting configured appropriately
- [ ] Logging configured for production
- [ ] Monitoring and alerting set up
- [ ] Backup strategy in place
- [ ] SSL certificates obtained
- [ ] Domain names configured

## Environment Variables

### Required Production Variables

```bash
# Better Auth
BETTER_AUTH_URL=https://auth.yourdomain.com
BETTER_AUTH_SECRET=<generate-secure-secret>

# Database
DATABASE_URL=postgresql+asyncpg://user:password@db.yourdomain.com:5432/better_auth_db

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=INFO
LOG_FORMAT_JSON=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### Generating Secure Secrets

Generate a secure secret for `BETTER_AUTH_SECRET`:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE better_auth_db;

# Create user (optional, for better security)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE better_auth_db TO app_user;
```

### 2. Run Migrations

```bash
# Backend migrations
cd backend
uv run alembic upgrade head

# Frontend migrations (if needed)
cd nextjs
pnpm drizzle-kit migrate
```

### 3. Verify Database

```bash
# Check connection
psql -U app_user -d better_auth_db -c "SELECT version();"
```

## Frontend Deployment

### Next.js Build

Build the Next.js application:

```bash
cd nextjs
pnpm build
```

This creates an optimized production build in the `.next` directory.

### Deployment Options

#### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Import your repository to Vercel
   - Configure build settings

2. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure `NEXT_PUBLIC_API_URL` points to your backend

3. **Deploy**
   - Vercel automatically deploys on push to main branch
   - Or deploy manually from dashboard

#### Option 2: Docker

Create a Dockerfile for Next.js:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY nextjs/package.json nextjs/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t nextjs-app -f Dockerfile.nextjs .
docker run -p 3000:3000 --env-file .env nextjs-app
```

#### Option 3: Traditional Server

1. **Build Application**
   ```bash
   cd nextjs
   pnpm build
   ```

2. **Start Production Server**
   ```bash
   pnpm start
   ```

3. **Use Process Manager** (PM2, systemd, etc.)
   ```bash
   pm2 start pnpm --name "nextjs-app" -- start
   ```

## Backend Deployment

### FastAPI Build

The backend doesn't require a build step, but ensure dependencies are installed:

```bash
cd backend
uv sync --frozen
```

### Deployment Options

#### Option 1: Docker

Create a Dockerfile for FastAPI:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t fastapi-app -f Dockerfile.backend .
docker run -p 8000:8000 --env-file .env fastapi-app
```

#### Option 2: Traditional Server

1. **Install Dependencies**
   ```bash
   cd backend
   uv sync --frozen
   ```

2. **Run with Uvicorn**
   ```bash
   uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Use Process Manager** (PM2, systemd, etc.)
   ```bash
   pm2 start "uv run uvicorn main:app --host 0.0.0.0 --port 8000" --name "fastapi-app"
   ```

#### Option 3: Cloud Platforms

**AWS (Elastic Beanstalk, ECS, Lambda)**
- Use Docker containers or serverless functions
- Configure environment variables
- Set up load balancing

**Google Cloud (Cloud Run, App Engine)**
- Deploy containers or use App Engine
- Configure environment variables
- Set up auto-scaling

**Azure (App Service, Container Instances)**
- Deploy containers or use App Service
- Configure application settings
- Set up scaling

## Reverse Proxy Setup

### Nginx Configuration

Example Nginx configuration for both frontend and backend:

```nginx
# Frontend (Next.js)
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend (FastAPI)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS Configuration

Use Let's Encrypt for free SSL certificates:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## Monitoring and Logging

### Application Logs

Configure logging for production:

```bash
LOG_LEVEL=INFO
LOG_FORMAT_JSON=true
```

### Log Aggregation

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** (Grafana Loki)
- **CloudWatch** (AWS)
- **Cloud Logging** (Google Cloud)
- **Application Insights** (Azure)

### Monitoring

Set up monitoring for:
- Application health
- Database performance
- API response times
- Error rates
- Rate limiting metrics

Tools:
- **Prometheus** + **Grafana**
- **Datadog**
- **New Relic**
- **Sentry** (error tracking)

## Security Hardening

### 1. Secrets Management

- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Never commit secrets to version control
- Rotate secrets regularly

### 2. Network Security

- Use HTTPS for all traffic
- Configure firewall rules
- Use VPN for database access
- Implement DDoS protection

### 3. Application Security

- Keep dependencies updated
- Enable rate limiting
- Configure CORS properly
- Use secure headers
- Implement input validation

### 4. Database Security

- Use strong passwords
- Limit database access
- Enable SSL for database connections
- Regular backups
- Monitor database access

## Scaling

### Horizontal Scaling

1. **Load Balancing**
   - Use load balancer (Nginx, HAProxy, cloud load balancer)
   - Distribute traffic across multiple instances

2. **Stateless Design**
   - Application is stateless
   - Use shared database
   - Use external storage (S3/MinIO)

3. **Auto-scaling**
   - Configure auto-scaling based on metrics
   - Scale up during high traffic
   - Scale down during low traffic

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Use connection pooling
- Cache frequently accessed data

## Backup and Recovery

### Database Backups

```bash
# Create backup
pg_dump -U postgres better_auth_db > backup.sql

# Restore backup
psql -U postgres better_auth_db < backup.sql
```

### Automated Backups

- Schedule regular backups
- Store backups in secure location
- Test restore procedures
- Keep multiple backup copies

## Health Checks

### Application Health

Monitor health endpoints:
- Frontend: `https://yourdomain.com/api/health`
- Backend: `https://api.yourdomain.com/health`

### Database Health

Monitor database:
- Connection pool status
- Query performance
- Disk usage
- Replication lag (if applicable)

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   - Check environment variables
   - Verify database connection
   - Check logs for errors

2. **Database Connection Errors**
   - Verify database is running
   - Check connection string
   - Verify network connectivity
   - Check firewall rules

3. **Authentication Issues**
   - Verify `BETTER_AUTH_SECRET` is set
   - Check `BETTER_AUTH_URL` is correct
   - Verify CORS configuration
   - Check JWKS endpoint accessibility

4. **Performance Issues**
   - Check database query performance
   - Review connection pool settings
   - Monitor resource usage
   - Check for memory leaks

## Rollback Procedure

1. **Identify Issue**
   - Check logs and monitoring
   - Identify problematic deployment

2. **Rollback Code**
   - Revert to previous version
   - Or deploy hotfix

3. **Rollback Database** (if needed)
   - Restore from backup
   - Or run rollback migrations

4. **Verify**
   - Test application functionality
   - Monitor for issues
   - Check logs

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Configuration Reference](./configuration.md) - Configuration options
- [Architecture Overview](./architecture.md) - System architecture
- [Development Guide](./development.md) - Development patterns

