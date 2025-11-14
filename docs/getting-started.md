# Getting Started

This guide will help you set up and run the Next.js Better Auth FastAPI project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **pnpm** (Node.js package manager)
- **Python** 3.12+
- **uv** (Python package manager) - [Installation guide](https://github.com/astral-sh/uv)
- **PostgreSQL** (running locally or via Docker)
- **MinIO** (optional, for S3-compatible storage)

### Installing uv

```bash
# On macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nextjs-better-auth-fastapi
```

### 2. Install Dependencies

Install all dependencies for both frontend and backend:

```bash
make install
```

This command will:
- Install backend dependencies using `uv sync`
- Install frontend dependencies using `pnpm install`

### 3. Configure Environment Variables

1. Copy the example environment file:

```bash
cp env.example .env
```

2. Update the `.env` file with your configuration:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=change-me-in-production  # Use a secure secret in production
BETTER_AUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db

# Backend Configuration
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See [Configuration Reference](./configuration.md) for all available environment variables.

### 4. Set Up Database

**Note**: The project assumes PostgreSQL, MinIO, and other services are already running. Docker Compose is provided as an optional convenience but is not required for development.

#### Option A: Using Docker Compose (Optional)

The project includes a `docker-compose.yml` file for running PostgreSQL, MinIO, and pgWeb if you need to set up these services:

```bash
# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# Stop services
docker-compose down
```

#### Option B: Using Local PostgreSQL (Recommended)

Ensure PostgreSQL is running and create the database:

```bash
createdb better_auth_db
```

### 5. Run Database Migrations

Run migrations for both frontend and backend:

```bash
make migrate
```

Or run them separately:

```bash
# Backend migrations (Alembic)
make migrate-backend

# Frontend migrations (Drizzle)
make migrate-frontend
```

## Running the Project

### Run Both Servers

Start both the frontend and backend servers simultaneously:

```bash
make dev
```

This will start:
- **Backend**: FastAPI server on `http://localhost:8000`
- **Frontend**: Next.js server on `http://localhost:3000`

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

## Verify Installation

### 1. Check Backend Health

Visit `http://localhost:8000/health` in your browser or use curl:

```bash
curl http://localhost:8000/health
```

You should see a JSON response with status information.

### 2. Check Backend API Documentation

Visit `http://localhost:8000/docs` to see the interactive Swagger UI documentation.

### 3. Check Frontend

Visit `http://localhost:3000` in your browser. You should see the application homepage.

### 4. Test Authentication

1. Navigate to the signup page
2. Create a new account
3. Log in with your credentials
4. Verify you can access protected routes

## Available Make Commands

### Installation
- `make install` - Install dependencies for both backend and frontend

### Development
- `make backend` - Run the FastAPI backend server
- `make frontend` - Run the Next.js frontend server
- `make dev` - Run both backend and frontend in parallel

### Code Quality
- `make lint` - Lint both backend and frontend code
- `make format` - Format both backend and frontend code
- `make check` - Check both backend and frontend (lint + format)
- `make type-check` - Type check frontend TypeScript code

### Build
- `make build` - Build both backend and frontend
- `make build-backend` - Build backend (if applicable)
- `make build-frontend` - Build frontend Next.js app

### Database
- `make migrate` - Run database migrations for both frontend and backend
- `make migrate-backend` - Run backend database migrations (Alembic)
- `make migrate-frontend` - Run frontend database migrations (Drizzle)

### Cleanup
- `make clean` - Clean up generated files

## Project Structure

```
nextjs-better-auth-fastapi/
├── backend/                 # FastAPI backend
│   ├── core/               # Core application modules
│   ├── routers/            # API route handlers
│   ├── services/           # Business logic services
│   ├── schemas/            # Pydantic schemas
│   ├── models/             # SQLAlchemy models
│   ├── utils/              # Utility functions
│   ├── alembic/            # Database migrations
│   └── main.py             # Application entry point
├── nextjs/                  # Next.js frontend
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utilities and configuration
│   └── drizzle/            # Database migrations
├── docs/                    # Documentation
├── docker-compose.yml       # Docker Compose configuration
├── env.example              # Example environment variables
└── Makefile                 # Build automation
```

## Next Steps

- Read the [Architecture Overview](./architecture.md) to understand the system design
- Review the [Authentication Guide](./authentication.md) to understand the auth flow
- Check the [Development Guide](./development.md) for development best practices
- Explore the [API Reference](./api-reference.md) for available endpoints

## Troubleshooting

### Backend won't start

1. Check that PostgreSQL is running:
   ```bash
   psql -U postgres -c "SELECT version();"
   ```

2. Verify database connection string in `.env`:
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/better_auth_db
   ```

3. Check that migrations have been run:
   ```bash
   make migrate-backend
   ```

### Frontend won't start

1. Verify Node.js version:
   ```bash
   node --version  # Should be 18+
   ```

2. Clear node_modules and reinstall:
   ```bash
   cd nextjs
   rm -rf node_modules
   pnpm install
   ```

### Authentication not working

1. Verify `BETTER_AUTH_SECRET` is set in `.env`
2. Check that `BETTER_AUTH_URL` matches your frontend URL
3. Ensure backend `CORS_ORIGINS` includes your frontend URL
4. Check browser console and backend logs for errors

### Database connection errors

1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists:
   ```bash
   createdb better_auth_db
   ```
4. Run migrations:
   ```bash
   make migrate
   ```

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

