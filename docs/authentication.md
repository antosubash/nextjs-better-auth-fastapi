# Authentication Guide

This guide explains how authentication works in the Next.js Better Auth FastAPI application, including JWT tokens, API keys, and the authentication flow.

## Overview

The application supports two authentication methods:

1. **JWT Tokens** - Signed with Ed25519, verified using JWKS
2. **API Keys** - Verified via Better Auth verification endpoint

Both methods can be used simultaneously, and at least one valid authentication method is required for protected routes.

## Authentication Methods

### JWT Token Authentication

JWT tokens are issued by Better Auth when users log in or sign up. Tokens are signed with Ed25519 and verified using public keys from the Better Auth JWKS endpoint.

#### Token Structure

JWT tokens consist of three parts:
- **Header**: Contains algorithm (`EdDSA`) and key ID (`kid`)
- **Payload**: Contains user information, issuer, audience, expiration
- **Signature**: Ed25519 signature

#### Using JWT Tokens

Include the JWT token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

**Example:**

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:8000/tasks
```

**Note**: JWT tokens are signed with Ed25519 (EdDSA algorithm). The token format is: `header.payload.signature`

#### Token Verification Process

1. **Extract Token**: Middleware extracts token from `Authorization` header
2. **Decode Header**: Extract `kid` (key ID) from token header
3. **Fetch JWKS**: Get public keys from Better Auth JWKS endpoint (cached)
4. **Get Public Key**: Extract Ed25519 public key for the `kid`
5. **Verify Signature**: Verify token signature using public key
6. **Validate Claims**: Check issuer, audience, and expiration
7. **Store Data**: Store token payload in `request.state.token_data`

#### JWKS Caching

JWKS (JSON Web Key Set) is cached to improve performance:
- **Default TTL**: 3600 seconds (1 hour)
- **Configurable**: Set via `JWKS_CACHE_TTL_SECONDS` environment variable
- **Auto-refresh**: Cache refreshes when:
  - Cache expires
  - Token `kid` not found in cached keys

### API Key Authentication

API keys are managed by Better Auth and verified via the verification endpoint.

#### Using API Keys

Include the API key in the `X-API-Key` header:

```http
X-API-Key: <your-api-key>
```

**Example:**

```bash
curl -H "X-API-Key: ba_1234567890abcdef..." \
  http://localhost:8000/tasks
```

#### API Key Verification Process

1. **Extract Key**: Middleware extracts API key from `X-API-Key` header
2. **Verify Key**: Send key to Better Auth `/api/auth/verify-api-key` endpoint
3. **Check Permissions**: Verify key has required permissions (if specified)
4. **Store Data**: Store API key data in `request.state.api_key_data`

#### API Key Data Structure

After verification, API key data includes:
- `user_id`: User ID associated with the key
- `key_id`: API key ID
- `permissions`: Key permissions (dict format)
- `metadata`: Additional metadata
- `name`: Key name
- `prefix`: Key prefix
- `enabled`: Whether key is enabled

### Combined Authentication

Both authentication methods can be used simultaneously:

```http
Authorization: Bearer <jwt-token>
X-API-Key: <api-key>
```

The middleware will:
1. Try to verify JWT token
2. Try to verify API key
3. Proceed if at least one method succeeds
4. Store data from both methods if both succeed

## Authentication Flow

### User Registration/Login Flow

```
┌──────────┐                    ┌──────────────┐
│  Client  │                    │ Better Auth  │
└────┬─────┘                    └──────┬───────┘
     │                                 │
     │  1. POST /api/auth/sign-up      │
     │     { email, password, name }   │
     ├────────────────────────────────>│
     │                                 │
     │  2. JWT Token (Ed25519)         │
     │     + Session Cookie            │
     │<────────────────────────────────┤
     │                                 │
     │  3. Store token in cookie       │
     │                                 │
```

### API Request Flow

```
┌──────────┐                    ┌──────────────┐
│  Client  │                    │   Backend    │
└────┬─────┘                    └──────┬───────┘
     │                                 │
     │  1. API Request                 │
     │     + JWT Token / API Key       │
     ├────────────────────────────────>│
     │                                 │
     │                                 │  2. Verify Auth
     │                                 ├──────────────┐
     │                                 │              │
     │                                 │<─────────────┤
     │                                 │  3. Auth Data│
     │                                 │              │
     │  4. API Response                │              │
     │<────────────────────────────────┤              │
     │                                 │              │
     └─────────────────────────────────┴──────────────┘
```

## Accessing Authentication Data

### In Backend Routes

Access authentication data in FastAPI route handlers:

```python
from fastapi import Request

@app.post("/protected-endpoint")
async def protected_route(request: Request):
    # Unified user ID (works for both JWT and API key)
    user_id = request.state.user_id
    
    # JWT token data (if JWT was used)
    token_data = getattr(request.state, "token_data", None)
    if token_data:
        user_email = token_data.get("email")
        user_role = token_data.get("role")
    
    # API key data (if API key was used)
    api_key_data = getattr(request.state, "api_key_data", None)
    if api_key_data:
        key_id = api_key_data.get("key_id")
        permissions = api_key_data.get("permissions")
    
    # Request ID for tracing
    request_id = request.state.request_id
    
    return {
        "user_id": user_id,
        "request_id": request_id
    }
```

### In Frontend

Use Better Auth client to access session and user data:

```typescript
import { auth } from "@/lib/auth";

// Get session
const session = await auth.api.getSession({ headers });

// Get user
const user = session?.user;

// Make authenticated requests
const response = await fetch("/api/proxy/tasks", {
  headers: {
    "Authorization": `Bearer ${session?.token}`,
  },
});
```

## Public Routes

Some routes don't require authentication. These are defined in `backend/core/config.py`:

```python
PUBLIC_ROUTES: set[str] = {
    "/",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/health",
}
```

To add a new public route, add it to this set.

## Protected Routes

All routes are protected by default. The `JWTAuthMiddleware` automatically:
- Checks if route is in `PUBLIC_ROUTES`
- Verifies authentication for non-public routes
- Rejects requests without valid authentication

## Error Handling

### Authentication Errors

The middleware returns appropriate HTTP status codes:

- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (for API keys)

### Error Response Format

```json
{
  "detail": "Authentication failed: Invalid token",
  "request_id": "abc123..."
}
```

## Security Best Practices

### JWT Tokens

1. **Token Storage**
   - Store tokens securely (HTTP-only cookies recommended)
   - Never expose tokens in URLs or logs
   - Use HTTPS in production

2. **Token Expiration**
   - Tokens have expiration times
   - Refresh tokens when expired
   - Implement token revocation

3. **JWKS Security**
   - Verify JWKS endpoint authenticity
   - Use HTTPS for JWKS requests
   - Cache JWKS appropriately

### API Keys

1. **Key Management**
   - Rotate keys regularly
   - Use different keys for different environments
   - Revoke compromised keys immediately

2. **Key Storage**
   - Store keys securely
   - Never commit keys to version control
   - Use environment variables or secret management

3. **Permissions**
   - Use least privilege principle
   - Grant only necessary permissions
   - Review permissions regularly

## Configuration

### Environment Variables

Key authentication-related environment variables:

```bash
# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=change-me-in-production

# JWKS Cache Configuration
JWKS_CACHE_TTL_SECONDS=3600

# Rate Limiting (affects authenticated requests)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

See [Configuration Reference](./configuration.md) for complete list.

## Troubleshooting

### Token Verification Fails

1. **Check Token Format**
   - Ensure token is properly formatted
   - Verify `Authorization: Bearer <token>` header format

2. **Check JWKS Endpoint**
   - Verify `BETTER_AUTH_URL` is correct
   - Check JWKS endpoint is accessible: `{BETTER_AUTH_URL}/api/auth/jwks`

3. **Check Token Claims**
   - Verify issuer matches `BETTER_AUTH_URL`
   - Verify audience matches `BETTER_AUTH_URL`
   - Check token hasn't expired

### API Key Verification Fails

1. **Check Key Format**
   - Ensure key is properly formatted
   - Verify `X-API-Key: <key>` header format

2. **Check Better Auth**
   - Verify Better Auth is running
   - Check verification endpoint: `{BETTER_AUTH_URL}/api/auth/verify-api-key`

3. **Check Key Status**
   - Verify key is enabled
   - Check key hasn't been revoked
   - Verify key has required permissions

### CORS Issues

1. **Check CORS Configuration**
   - Verify `CORS_ORIGINS` includes frontend URL
   - Check CORS middleware is configured correctly

2. **Check Headers**
   - Verify `Authorization` header is allowed
   - Check `X-API-Key` header is allowed

## Advanced Topics

### Custom Permission Checks

For API keys, you can check specific permissions:

```python
from core.auth import verify_api_key

# Verify API key with required permissions
api_key_data = await verify_api_key(
    api_key="ba_...",
    required_permissions={
        "tasks": ["read", "write"],
        "users": ["read"],
    }
)
```

### Token Refresh

Implement token refresh in the frontend:

```typescript
// Refresh token when expired
const refreshSession = async () => {
  const response = await auth.api.refreshSession({ headers });
  return response;
};
```

### Key Rotation

Rotate API keys periodically:

1. Generate new key
2. Update applications to use new key
3. Revoke old key after migration

## Related Documentation

- [Architecture Overview](./architecture.md) - System architecture
- [API Reference](./api-reference.md) - API endpoints
- [Configuration Reference](./configuration.md) - Configuration options
- [Development Guide](./development.md) - Development patterns

