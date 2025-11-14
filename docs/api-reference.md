# API Reference

Complete reference documentation for all API endpoints in the Next.js Better Auth FastAPI application.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: Configure via `NEXT_PUBLIC_API_URL`

## Authentication

All protected endpoints require authentication via one of the following methods:

### JWT Token

Include JWT token in the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

### API Key

Include API key in the `X-API-Key` header:

```http
X-API-Key: <api-key>
```

### Combined

Both methods can be used simultaneously:

```http
Authorization: Bearer <jwt-token>
X-API-Key: <api-key>
```

## Public Endpoints

These endpoints don't require authentication.

### Health Check

Check the health status of the API.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "message": "Service is healthy",
  "dependencies": {
    "better_auth": "ok",
    "jwks": "ok"
  }
}
```

**Note**: The health endpoint checks Better Auth connectivity. If dependencies are unavailable, status will be `"unhealthy"` with HTTP 503.

**Example:**

```bash
curl http://localhost:8000/health
```

### API Documentation

- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`
- **OpenAPI Schema**: `GET /openapi.json`

## Protected Endpoints

All endpoints below require authentication unless otherwise specified.

### Root Endpoint

Get a welcome message.

**Endpoint:** `GET /`

**Authentication:** Not required (public route)

**Response:**

```json
{
  "message": "Hello, World!"
}
```

**Example:**

```bash
curl http://localhost:8000/
```

### Create Data (Example Endpoint)

Create data with optional file upload. This is an example endpoint for demonstration purposes.

**Endpoint:** `POST /getdata`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Example",
  "description": "Example description"
}
```

**Response:**

```json
{
  "message": "Data created successfully",
  "data": {
    "id": 1,
    "name": "Example",
    "description": "Example description"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/getdata \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Example", "description": "Example description"}'
```

### Tasks

#### List Tasks

Get a list of all tasks.

**Endpoint:** `GET /tasks`

**Authentication:** Required

**Query Parameters:**

- `skip` (optional): Number of tasks to skip (default: 0)
- `limit` (optional): Maximum number of tasks to return (default: 100)

**Response:**

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Task 1",
      "description": "Description 1",
      "completed": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/tasks?skip=0&limit=10"
```

#### Get Task

Get a specific task by ID.

**Endpoint:** `GET /tasks/{task_id}`

**Authentication:** Required

**Path Parameters:**

- `task_id`: Task ID

**Response:**

```json
{
  "id": 1,
  "title": "Task 1",
  "description": "Description 1",
  "completed": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/tasks/1
```

#### Create Task

Create a new task.

**Endpoint:** `POST /tasks`

**Authentication:** Required

**Request Body:**

```json
{
  "title": "New Task",
  "description": "Task description",
  "completed": false
}
```

**Response:**

```json
{
  "id": 1,
  "title": "New Task",
  "description": "Task description",
  "completed": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Task", "description": "Task description"}'
```

#### Update Task

Update an existing task.

**Endpoint:** `PUT /tasks/{task_id}`

**Authentication:** Required

**Path Parameters:**

- `task_id`: Task ID

**Request Body:**

```json
{
  "title": "Updated Task",
  "description": "Updated description",
  "completed": true
}
```

**Response:**

```json
{
  "id": 1,
  "title": "Updated Task",
  "description": "Updated description",
  "completed": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:00Z"
}
```

**Example:**

```bash
curl -X PUT http://localhost:8000/tasks/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Task", "completed": true}'
```

#### Delete Task

Delete a task.

**Endpoint:** `DELETE /tasks/{task_id}`

**Authentication:** Required

**Path Parameters:**

- `task_id`: Task ID

**Response:**

```json
{
  "message": "Task deleted successfully"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8000/tasks/1 \
  -H "Authorization: Bearer <token>"
```

### Jobs

#### List Jobs

Get a list of all jobs.

**Endpoint:** `GET /jobs`

**Authentication:** Required

**Query Parameters:**

- `skip` (optional): Number of jobs to skip (default: 0)
- `limit` (optional): Maximum number of jobs to return (default: 100)

**Response:**

```json
{
  "jobs": [
    {
      "id": "job_123",
      "name": "Example Job",
      "job_type": "interval",
      "status": "running",
      "next_run_time": "2024-01-01T01:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/jobs?skip=0&limit=10"
```

#### Get Job

Get a specific job by ID.

**Endpoint:** `GET /jobs/{job_id}`

**Authentication:** Required

**Path Parameters:**

- `job_id`: Job ID

**Response:**

```json
{
  "id": "job_123",
  "name": "Example Job",
  "job_type": "interval",
  "status": "running",
  "next_run_time": "2024-01-01T01:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/jobs/job_123
```

#### Create Job

Create a new background job.

**Endpoint:** `POST /jobs`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Example Job",
  "job_type": "interval",
  "interval_seconds": 60,
  "func": "tasks.background_task",
  "args": [],
  "kwargs": {}
}
```

**Job Types:**

- `date`: Run once at a specific time
- `interval`: Run at regular intervals
- `cron`: Run on a cron schedule

**Response:**

```json
{
  "id": "job_123",
  "name": "Example Job",
  "job_type": "interval",
  "status": "pending",
  "next_run_time": "2024-01-01T01:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Job",
    "job_type": "interval",
    "interval_seconds": 60,
    "func": "tasks.background_task"
  }'
```

#### Update Job

Update an existing job.

**Endpoint:** `PUT /jobs/{job_id}`

**Authentication:** Required

**Path Parameters:**

- `job_id`: Job ID

**Request Body:**

```json
{
  "name": "Updated Job",
  "enabled": false
}
```

**Response:**

```json
{
  "id": "job_123",
  "name": "Updated Job",
  "job_type": "interval",
  "status": "paused",
  "next_run_time": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Example:**

```bash
curl -X PUT http://localhost:8000/jobs/job_123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Job", "enabled": false}'
```

#### Delete Job

Delete a job.

**Endpoint:** `DELETE /jobs/{job_id}`

**Authentication:** Required

**Path Parameters:**

- `job_id`: Job ID

**Response:**

```json
{
  "message": "Job deleted successfully"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:8000/jobs/job_123 \
  -H "Authorization: Bearer <token>"
```

#### Get Job History

Get execution history for a job.

**Endpoint:** `GET /jobs/{job_id}/history`

**Authentication:** Required

**Path Parameters:**

- `job_id`: Job ID

**Query Parameters:**

- `skip` (optional): Number of history entries to skip (default: 0)
- `limit` (optional): Maximum number of entries to return (default: 100)

**Response:**

```json
{
  "history": [
    {
      "id": 1,
      "job_id": "job_123",
      "status": "success",
      "started_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:00:05Z",
      "duration_seconds": 5.0
    }
  ],
  "total": 1
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/jobs/job_123/history?skip=0&limit=10"
```

## Error Responses

All endpoints may return error responses in the following format:

### 400 Bad Request

```json
{
  "detail": "Validation error message",
  "request_id": "abc123..."
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication failed: Invalid token",
  "request_id": "abc123..."
}
```

### 403 Forbidden

```json
{
  "detail": "Insufficient permissions",
  "request_id": "abc123..."
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found",
  "request_id": "abc123..."
}
```

### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded",
  "request_id": "abc123..."
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error",
  "request_id": "abc123..."
}
```

## Response Headers

All responses include the following headers:

- `X-Request-ID`: Unique request identifier for tracing
- `Content-Type`: `application/json`

## Rate Limiting

API requests are rate-limited per IP address:

- **Default Limit**: 60 requests per minute
- **Configurable**: Set via `RATE_LIMIT_REQUESTS_PER_MINUTE`
- **Public Routes**: Excluded from rate limiting

When rate limit is exceeded, a `429 Too Many Requests` response is returned.

## Pagination

List endpoints support pagination via query parameters:

- `skip`: Number of items to skip
- `limit`: Maximum number of items to return

**Example:**

```bash
# Get first 10 items
GET /tasks?skip=0&limit=10

# Get next 10 items
GET /tasks?skip=10&limit=10
```

## Interactive Documentation

The API includes interactive documentation:

- **Swagger UI**: Visit `http://localhost:8000/docs`
- **ReDoc**: Visit `http://localhost:8000/redoc`

These interfaces allow you to:
- Browse all endpoints
- View request/response schemas
- Test endpoints directly
- View authentication requirements

## Related Documentation

- [Authentication Guide](./authentication.md) - Authentication details
- [Architecture Overview](./architecture.md) - System architecture
- [Development Guide](./development.md) - Development patterns

