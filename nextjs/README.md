# Next.js Frontend

This is the Next.js 16 frontend application with Better Auth integration.

## Overview

The frontend provides:
- User authentication (signup, login) via Better Auth
- Organization and team management
- API key management
- JWT token generation
- Proxy routes to backend API

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Better Auth** - Authentication library
- **Drizzle ORM** - TypeScript ORM for database operations
- **PostgreSQL** - Database (shared with backend)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Database

The frontend uses PostgreSQL (shared with the backend) via Drizzle ORM. Better Auth is configured to use the same PostgreSQL database.

**Important**: The frontend and backend share the same database but manage different schemas/tables.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL running (shared with backend)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Copy environment variables from the project root `.env` file. The frontend automatically loads from the root `.env` file.

Key variables:
- `BETTER_AUTH_SECRET` - Secret key for Better Auth
- `BETTER_AUTH_URL` - Base URL (default: http://localhost:3000)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

### Database Migrations

Run migrations to set up the database schema:

```bash
# Better Auth migrations
npx @better-auth/cli migrate

# Drizzle migrations (if you've made custom schema changes)
npx drizzle-kit generate
npx drizzle-kit migrate
```

Or use the Make command from project root:

```bash
make migrate-frontend
```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Build

Build for production:

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Project Structure

```
nextjs/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Better Auth endpoints
│   │   └── proxy/         # Proxy routes to backend
│   └── page.tsx           # Pages
├── components/            # React components
├── lib/                   # Utilities and configuration
│   ├── auth.ts           # Better Auth configuration
│   ├── constants.ts      # All constants (IMPORTANT)
│   └── database.ts       # Database connection
├── drizzle/              # Database migrations
├── auth-schema.ts        # Database schema definitions
└── package.json          # Dependencies
```

## Key Files

- `lib/auth.ts` - Better Auth configuration
- `lib/constants.ts` - All UI strings and constants (never hardcode strings)
- `lib/database.ts` - Database connection
- `auth-schema.ts` - Database schema definitions
- `app/api/auth/` - Better Auth API routes

## Code Conventions

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) for comprehensive coding standards.

### Quick Reference

**Constants**: Never hardcode strings. Always use constants from `lib/constants.ts`:

```typescript
// ✅ Good
import { AUTH_LABELS } from "@/lib/constants";
<button>{AUTH_LABELS.LOGIN}</button>

// ❌ Bad
<button>Log in</button>
```

**Better Auth APIs**: Always use Better Auth APIs for authentication, organization, team, and permission operations. Never query the database directly:

```typescript
// ✅ Good - Use Better Auth APIs
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers });
const organizations = await auth.api.listOrganizations({ headers });

// ❌ Bad - Direct database access
import { db } from "@/lib/database";
const user = await db.select().from(users).where(eq(users.id, userId));
```

### Coding Standards Enforcement

Coding standards are automatically enforced through:

- **Biome**: Linting and formatting (runs on `pnpm lint` and `pnpm format`)
- **Validation Script**: Custom checks for file size, naming conventions, hardcoded strings, etc. (runs automatically with `pnpm lint`)
- **TypeScript**: Type checking (runs on `pnpm type-check`)

Run `pnpm lint` to check for all standards violations.

## Development Commands

```bash
# Development
pnpm dev              # Start development server

# Code Quality
pnpm lint             # Lint code
pnpm format           # Format code
pnpm check            # Check code (lint + format)
pnpm type-check       # Type check TypeScript

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Database
npx drizzle-kit generate  # Generate migration
npx drizzle-kit migrate   # Run migrations
```

## Related Documentation

- [Project README](../README.md) - Main project overview
- [Getting Started](../docs/getting-started.md) - Setup guide
- [Development Guide](../docs/development.md) - Development patterns
- [Authentication Guide](../docs/authentication.md) - Authentication details
