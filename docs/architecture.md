# Architecture Overview

This document provides a comprehensive overview of the system architecture, components, and design decisions.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (App Router)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Pages &    │  │   Better     │  │  Drizzle  │  │   │
│  │  │  Components  │  │    Auth      │  │    ORM    │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (JWT/API Key)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    FastAPI                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │  Middleware  │  │   Routers    │  │ Services  │  │   │
│  │  │  (Auth,      │  │  (API        │  │ (Business │  │   │
│  │  │   Rate       │  │   Endpoints) │  │  Logic)   │  │   │
│  │  │   Limit)     │  └──────────────┘  └───────────┘  │   │
│  │  └──────────────┘                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    MinIO     │  │ Better Auth  │
│  Database    │  │  (S3 Storage)│  │   (JWKS)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Overview

### Frontend (Next.js)

#### Core Components

1. **Next.js App Router**
   - File-based routing
   - Server and client components
   - API routes for Better Auth integration

2. **Better Auth**
   - Authentication library
   - JWT token generation
   - Session management
   - User registration and login
   - Organization and team management
   - API key management

3. **Drizzle ORM**
   - Type-safe database queries
   - Schema definitions
   - Migrations

4. **Database (PostgreSQL via Drizzle ORM)**
   - Shared PostgreSQL database with backend
   - User data storage
   - Session management
   - Organization and team data

#### Key Directories

- `app/` - Next.js app directory with pages and API routes
- `components/` - React components
- `lib/` - Utilities, configuration, and constants
- `drizzle/` - Database migrations

### Backend (FastAPI)

#### Core Components

1. **FastAPI Application**
   - RESTful API endpoints
   - Automatic OpenAPI documentation
   - Async request handling

2. **Authentication Middleware**
   - JWT token verification using JWKS
   - API key verification
   - Request authentication state management

3. **Rate Limiting Middleware**
   - Per-IP rate limiting
   - Configurable limits
   - Public route exclusion

4. **Request ID Middleware**
   - Unique request tracking
   - Log correlation
   - Response headers

5. **Database (PostgreSQL)**
   - Async SQLAlchemy ORM
   - Alembic migrations
   - Connection pooling

6. **MinIO/S3 Storage**
   - Object storage
   - File operations
   - S3-compatible API

7. **Job Scheduler**
   - Background job processing
   - Scheduled tasks
   - Job persistence

#### Key Directories

- `core/` - Core application modules (auth, config, middleware, etc.)
- `routers/` - API route handlers
- `services/` - Business logic services
- `schemas/` - Pydantic request/response schemas
- `models/` - SQLAlchemy database models
- `utils/` - Utility functions
- `alembic/` - Database migrations

## Authentication Architecture

### JWT Token Flow

```
┌──────────┐                    ┌──────────────┐
│  Client  │                    │ Better Auth  │
└────┬─────┘                    └──────┬───────┘
     │                                 │
     │  1. Login/Signup                │
     ├────────────────────────────────>│
     │                                 │
     │  2. JWT Token (Ed25519)         │
     │<────────────────────────────────┤
     │                                 │
     │  3. API Request + JWT           │
     ├────────────────────────────────>│
     │                                 │
     │                                 │  4. Fetch JWKS
     │                                 ├──────────────┐
     │                                 │              │
     │                                 │<─────────────┤
     │                                 │  5. JWKS     │
     │                                 │              │
     │  6. Verify Token                │              │
     │<────────────────────────────────┤              │
     │                                 │              │
     │  7. API Response                │              │
     │<────────────────────────────────┤              │
     │                                 │              │
     └─────────────────────────────────┴──────────────┘
```

### API Key Flow

```
┌──────────┐                    ┌──────────────┐
│  Client  │                    │ Better Auth  │
└────┬─────┘                    └──────┬───────┘
     │                                 │
     │  1. API Request + API Key       │
     ├────────────────────────────────>│
     │                                 │
     │                                 │  2. Verify API Key
     │                                 ├──────────────┐
     │                                 │              │
     │                                 │<─────────────┤
     │                                 │  3. Key Data │
     │                                 │              │
     │  4. API Response                │              │
     │<────────────────────────────────┤              │
     │                                 │              │
     └─────────────────────────────────┴──────────────┘
```

### Middleware Stack

The backend uses a layered middleware approach:

```
Request
   │
   ▼
┌─────────────────────┐
│ Request ID          │  Add unique request ID
│ Middleware          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Rate Limiting       │  Check rate limits
│ Middleware          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ JWT/API Key Auth    │  Verify authentication
│ Middleware          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Route Handler       │  Process request
└──────────┬──────────┘
           │
           ▼
Response
```

## Data Flow

### Request Processing

1. **Request Reception**
   - FastAPI receives HTTP request
   - Request ID middleware adds unique ID
   - Request state initialized

2. **Rate Limiting**
   - Check IP-based rate limits
   - Reject if limit exceeded
   - Continue if within limits

3. **Authentication**
   - Extract JWT token or API key from headers
   - Verify authentication method
   - Store auth data in request state

4. **Route Handling**
   - Match request to route handler
   - Execute business logic
   - Return response

5. **Response**
   - Format response
   - Add response headers (including request ID)
   - Return to client

### Database Access

1. **Connection Pooling**
   - Async connection pool management
   - Configurable pool size and overflow
   - Automatic connection recycling

2. **Query Execution**
   - Async SQLAlchemy queries
   - Transaction management
   - Error handling

3. **Migrations**
   - Alembic for schema changes
   - Version control
   - Rollback support

## Security Architecture

### Authentication Security

1. **JWT Tokens**
   - Ed25519 signature algorithm
   - Public key verification via JWKS
   - Issuer and audience validation
   - Token expiration

2. **API Keys**
   - Verification via Better Auth
   - Permission-based access control
   - Key revocation support

3. **JWKS Caching**
   - Configurable TTL
   - Automatic refresh on key rotation
   - Fallback to fresh fetch

### Network Security

1. **CORS**
   - Configurable allowed origins
   - Credential support
   - Preflight handling

2. **Rate Limiting**
   - Per-IP limits
   - Configurable thresholds
   - Public route exclusion

3. **Request Tracking**
   - Unique request IDs
   - Log correlation
   - Audit trail

## Design Patterns

### Dependency Injection

FastAPI uses dependency injection for:
- Database sessions
- HTTP clients
- Service instances
- Configuration

### Service Layer Pattern

Business logic is separated into service classes:
- `TaskService` - Task management
- `JobService` - Job scheduling
- `FileService` - File operations

### Repository Pattern

Database access is abstracted through:
- SQLAlchemy models
- Service layer
- Async session management

### Middleware Pattern

Cross-cutting concerns handled via middleware:
- Authentication
- Rate limiting
- Request tracking
- Error handling

## Scalability Considerations

### Horizontal Scaling

- Stateless backend design
- Shared database
- External authentication service (Better Auth)
- External storage (MinIO/S3)

### Performance Optimization

- Async request handling
- Connection pooling
- JWKS caching
- Rate limiting

### Monitoring

- Request ID tracking
- Comprehensive logging
- Error tracking
- Performance metrics

## Technology Choices

### Why FastAPI?

- High performance (async support)
- Automatic API documentation
- Type safety with Pydantic
- Modern Python features

### Why Better Auth?

- Comprehensive authentication features
- JWT support with JWKS
- Organization and team management
- API key support
- Active development

### Why Ed25519?

- Strong security
- Fast verification
- Small key sizes
- Modern standard

### Why PostgreSQL?

- Robust and reliable
- Rich feature set
- Excellent async support
- Production-ready

## Future Considerations

- Microservices architecture
- Message queue integration
- Caching layer (Redis)
- CDN for static assets
- Load balancing
- Container orchestration

