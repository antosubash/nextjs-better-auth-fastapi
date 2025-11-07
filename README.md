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
- ✅ Protected API endpoints
- ✅ CORS configuration
- ✅ Type-safe frontend and backend
- ✅ Modern UI with Tailwind CSS

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Python** 3.12+
- **uv** (Python package manager)
- **PostgreSQL**, **MinIO**, and **Redis** (assumed to be running on your system)

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
└── Makefile                # Build automation
```

## API Endpoints

### Backend (FastAPI)

- `GET /` - Health check endpoint
- `POST /getdata` - Protected endpoint that requires JWT authentication

### Frontend (Next.js)

- `/api/auth/*` - Better Auth endpoints (handled automatically)
- `/api/proxy/*` - Proxy routes to backend API

## Authentication Flow

1. **User Registration/Login**: User signs up or logs in through the Next.js frontend
2. **Token Issuance**: Better Auth issues a JWT token signed with Ed25519
3. **Token Storage**: Token is stored in cookies and available for API requests
4. **API Request**: Frontend sends requests to FastAPI backend with JWT token in Authorization header
5. **Token Verification**: FastAPI backend:
   - Fetches JWKS from Better Auth endpoint
   - Extracts the public key based on token's `kid` (key ID)
   - Verifies token signature using Ed25519 public key
   - Validates issuer and audience claims
6. **Protected Access**: If verification succeeds, the request is processed

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
