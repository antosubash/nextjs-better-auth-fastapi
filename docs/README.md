# Documentation

Welcome to the Next.js Better Auth FastAPI documentation. This documentation provides comprehensive guides for understanding, developing, and deploying the application.

## Documentation Index

### Getting Started
- **[Getting Started Guide](./getting-started.md)** - Installation, setup, and first steps
- **[Configuration Reference](./configuration.md)** - Environment variables and configuration options

### Architecture & Design
- **[Architecture Overview](./architecture.md)** - System architecture, components, and design decisions
- **[Authentication Guide](./authentication.md)** - Authentication flow, JWT tokens, API keys, and security

### Development
- **[Development Guide](./development.md)** - Development workflow, code conventions, and best practices
- **[API Reference](./api-reference.md)** - Complete API endpoint documentation

### Operations
- **[Deployment Guide](./deployment.md)** - Production deployment instructions
- **[Database Migrations](./Migration.md)** - Database migration commands

## Quick Links

- [Project README](../README.md) - Main project overview
- [AGENTS.md](../AGENTS.md) - AI agent guidelines and conventions
- [Makefile](../Makefile) - Available make commands

## Project Overview

This is a full-stack authentication system combining:
- **Frontend**: Next.js 16 with Better Auth for authentication
- **Backend**: FastAPI with JWT token verification using JWKS (JSON Web Key Set)
- **Authentication**: JWT tokens signed with Ed25519, verified using public keys from Better Auth JWKS endpoint
- **Multiple Authentication Methods**: Supports JWT tokens, API keys, and Passkeys (WebAuthn)

## Key Features

- ✅ User registration and login
- ✅ JWT-based authentication with Ed25519 signatures
- ✅ API key authentication support
- ✅ Passkey (WebAuthn) authentication support
- ✅ Secure token verification using JWKS (cached with configurable TTL)
- ✅ JWT/API key validation middleware for automatic authentication
- ✅ Protected API endpoints (all routes protected by default)
- ✅ Public route exclusion (health checks, docs, etc.)
- ✅ Rate limiting middleware (configurable per IP)
- ✅ Request ID tracking for all requests
- ✅ Comprehensive logging for authentication events
- ✅ CORS configuration
- ✅ PostgreSQL database with async support
- ✅ MinIO/S3-compatible object storage
- ✅ Database migrations (Drizzle for frontend, Alembic for backend)
- ✅ Type-safe frontend and backend
- ✅ Modern UI with Tailwind CSS
- ✅ Profile picture upload and management
- ✅ Session management (view and revoke sessions)
- ✅ Organization and team management
- ✅ Role-based access control (RBAC)

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- Better Auth
- Drizzle ORM
- PostgreSQL (shared with backend, via Drizzle ORM)
- Tailwind CSS
- TypeScript

### Backend
- FastAPI
- PyJWT
- Cryptography (Ed25519)
- HTTPX (async HTTP client)
- SQLAlchemy (async PostgreSQL)
- Alembic (database migrations)
- MinIO client (S3-compatible storage)
- uv (package manager)
- Python 3.12+

## Getting Help

If you encounter issues or have questions:
1. Check the relevant documentation section
2. Review the [Development Guide](./development.md) for common patterns
3. Check the [Configuration Reference](./configuration.md) for environment variables
4. Review the [Authentication Guide](./authentication.md) for auth-related questions

