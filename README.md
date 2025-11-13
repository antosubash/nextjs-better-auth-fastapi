# Next.js Better Auth FastAPI

A full-stack authentication system combining Next.js with Better Auth for the frontend and FastAPI for the backend, featuring JWT token verification using JWKS (JSON Web Key Set).

## Overview

This project demonstrates a secure authentication architecture where:
- **Frontend (Next.js)**: Uses Better Auth for user authentication, signup, and login
- **Backend (FastAPI)**: Verifies JWT tokens issued by Better Auth using JWKS for secure API access
- **Authentication Flow**: JWT tokens are signed with Ed25519 and verified using public keys fetched from the Better Auth JWKS endpoint

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **Better Auth** - Authentication library with JWT support
- **Drizzle ORM** - TypeScript ORM for database operations
- **SQLite** - Database (via better-sqlite3)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **FastAPI** - Modern Python web framework
- **PyJWT** - JWT token verification
- **Cryptography** - Ed25519 public key handling
- **HTTPX** - Async HTTP client for JWKS fetching
- **Python 3.12+** - Runtime

## Features

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Secure token verification using JWKS
- ✅ JWT validation middleware for automatic token verification
- ✅ Protected API endpoints (all routes protected by default)
- ✅ Public route exclusion (health checks, docs, etc.)
- ✅ Comprehensive logging for authentication events
- ✅ CORS configuration
- ✅ Type-safe frontend and backend
- ✅ Modern UI with Tailwind CSS

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Python** 3.12+
- **uv** (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nextjs-better-auth-fastapi
```

2. Install all dependencies:
```bash
make install
```

This will install:
- Backend dependencies using `uv sync`
- Frontend dependencies using `pnpm install`

## Configuration

### Frontend Environment Variables

Create a `.env.local` file in the `nextjs` directory:

```env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
BETTER_AUTH_URL=http://localhost:3000
LOG_LEVEL=INFO
```

### Docker Compose Setup (PostgreSQL, MinIO, and pgWeb)

The project includes a `docker-compose.yml` file for running PostgreSQL, MinIO, and pgWeb services.

1. **Copy the example environment file:**
   ```bash
   cp env.example .env
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

4. **Access pgWeb (PostgreSQL UI with automatic authentication):**
   - URL: http://localhost:8081
   - **No login required** - automatically connected using environment variables
   - Credentials are pre-configured from your `.env` file

5. **Access MinIO Console:**
   - URL: http://localhost:9001
   - Default credentials: `minioadmin` / `minioadmin`

6. **Stop the services:**
   ```bash
   docker-compose down
   ```

7. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

The `env.example` file contains all necessary environment variables for PostgreSQL, MinIO, and pgWeb configuration. Update the `.env` file with your preferred values before starting the services.

## Running the Project

### Run Both Servers

Start both the frontend and backend servers simultaneously:

```bash
make dev
```

### Run Servers Separately

**Backend only:**
```bash
make backend
```
The FastAPI server will run on `http://localhost:8000`

**Frontend only:**
```bash
make frontend
```
The Next.js server will run on `http://localhost:3000`

### Available Make Commands

- `make install` - Install dependencies for both backend and frontend
- `make backend` - Run the FastAPI backend server
- `make frontend` - Run the Next.js frontend server
- `make dev` - Run both backend and frontend in parallel
- `make clean` - Clean up generated files

## Project Structure

```
nextjs-better-auth-fastapi/
├── backend/                 # FastAPI backend
│   ├── auth.py             # JWT verification logic
│   ├── config.py           # Configuration constants
│   ├── main.py             # FastAPI application
│   ├── middleware.py       # JWT validation middleware
│   └── pyproject.toml      # Python dependencies
├── nextjs/                  # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Better Auth endpoints
│   │   │   └── proxy/      # API proxy routes
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── user-profile.tsx
│   ├── lib/                # Utilities and configuration
│   │   ├── auth.ts         # Better Auth configuration
│   │   ├── auth-schema.ts  # Database schema
│   │   ├── constants.ts    # Application constants
│   │   └── database.ts     # Database connection
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker Compose for PostgreSQL and MinIO
├── env.example             # Example environment variables
└── Makefile                # Build automation
```

## API Endpoints

### Backend (FastAPI)

**Public Endpoints** (no authentication required):
- `GET /` - Health check endpoint
- `GET /docs` - API documentation (Swagger UI)
- `GET /openapi.json` - OpenAPI schema
- `GET /redoc` - Alternative API documentation

**Protected Endpoints** (JWT authentication required):
- `POST /getdata` - Protected endpoint that requires JWT authentication

All other endpoints are protected by default via the JWT validation middleware.

### Frontend (Next.js)

- `/api/auth/*` - Better Auth endpoints (handled automatically)
- `/api/proxy/*` - Proxy routes to backend API

## Authentication Flow

1. **User Registration/Login**: User signs up or logs in through the Next.js frontend
2. **Token Issuance**: Better Auth issues a JWT token signed with Ed25519
3. **Token Storage**: Token is stored in cookies and available for API requests
4. **API Request**: Frontend sends requests to FastAPI backend with JWT token in Authorization header
5. **JWT Middleware Validation**: The `JWTAuthMiddleware` intercepts all requests:
   - Checks if the route is in the public routes list (excluded from authentication)
   - Extracts the JWT token from the `Authorization: Bearer <token>` header
   - Validates the token using the verification logic
   - Stores the validated token payload in `request.state.token_data` for route handlers
6. **Token Verification Process**:
   - Fetches JWKS from Better Auth endpoint (with caching)
   - Extracts the public key based on token's `kid` (key ID)
   - Verifies token signature using Ed25519 public key
   - Validates issuer and audience claims
7. **Protected Access**: If verification succeeds, the request proceeds to the route handler with token data available in `request.state.token_data`

### Accessing Token Data in Routes

In your FastAPI route handlers, you can access the validated token payload:

```python
from fastapi import Request

@app.post("/protected-endpoint")
async def protected_route(request: Request):
    token_data = request.state.token_data
    user_id = token_data.get("sub") or token_data.get("id")
    # Use token_data as needed
    return {"user_id": user_id}
```

### Logging

The middleware provides comprehensive logging:
- **INFO**: Request entry and successful token validation
- **WARNING**: Authentication failures (missing headers, invalid tokens)
- **ERROR**: Unexpected errors during token verification
- **DEBUG**: Detailed flow information

All logs include HTTP method, path, and client IP for traceability.

## Development

### Linting and Formatting

The project follows code quality standards. After making changes:

**Frontend:**
```bash
cd nextjs
pnpm lint
```

**Backend:**
```bash
cd backend
# Use your preferred Python formatter (black, ruff, etc.)
```

### Database Migrations

Database migrations are handled by Drizzle ORM. Migrations are located in `nextjs/drizzle/`.

## License

See [LICENSE](LICENSE) file for details.
