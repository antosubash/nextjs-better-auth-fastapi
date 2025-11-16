# Backend Coding Standards

This document defines the coding standards for the FastAPI backend application. All code should adhere to these standards to ensure consistency, maintainability, and quality.

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [File Organization](#file-organization)
3. [Type Hints](#type-hints)
4. [Docstrings](#docstrings)
5. [Constants Usage](#constants-usage)
6. [Error Handling](#error-handling)
7. [Async/Await Patterns](#asyncawait-patterns)
8. [FastAPI Patterns](#fastapi-patterns)
9. [Database Patterns](#database-patterns)
10. [Logging](#logging)
11. [Code Style](#code-style)
12. [Import Organization](#import-organization)
13. [Code Complexity](#code-complexity)
14. [Testing](#testing)

## Naming Conventions

### Files and Directories

- **Python files**: Use snake_case (e.g., `task_service.py`, `user_router.py`, `auth_middleware.py`)
- **Directories**: Use snake_case (e.g., `routers/`, `services/`, `core/`)
- **Test files**: Use snake_case with `test_` prefix (e.g., `test_task_service.py`)

### Classes

- **Class names**: Use PascalCase (e.g., `TaskService`, `UserRouter`, `JWTAuthMiddleware`)

```python
# ✅ Good
class TaskService:
    """Service for task operations."""
    pass

# ❌ Bad
class task_service:
    """Service for task operations."""
    pass
```

### Functions and Methods

- **Function names**: Use snake_case (e.g., `create_task`, `get_user`, `verify_token`)
- **Private functions**: Prefix with `_` (e.g., `_validate_input`, `_format_response`)

```python
# ✅ Good
def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    pass

def _validate_input(data: dict) -> bool:
    """Validate input data."""
    pass

# ❌ Bad
def CreateTask(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    pass
```

### Constants

- **Constant names**: Use UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`, `JWKS_URL`)
- **Class constants**: Use UPPER_SNAKE_CASE within classes

```python
# ✅ Good
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
DEFAULT_TIMEOUT = 30

class Config:
    DATABASE_URL = "postgresql://..."
    MAX_RETRIES = 3

# ❌ Bad
maxFileSize = 5 * 1024 * 1024
default_timeout = 30
```

### Variables

- **Variable names**: Use snake_case (e.g., `user_id`, `task_data`, `is_valid`)
- **Boolean variables**: Prefix with `is`, `has`, `should`, or `can` (e.g., `is_valid`, `has_permission`, `should_retry`)

```python
# ✅ Good
user_id = "123"
task_data = TaskCreate(title="Task")
is_valid = True
has_permission = False

# ❌ Bad
userId = "123"
taskData = TaskCreate(title="Task")
valid = True
permission = False
```

## File Organization

### File Size Limit

- **Maximum file size**: 500 lines
- If a file exceeds 500 lines, split it into smaller, focused modules

### File Structure

Organize files in this order:

1. Module-level docstring
2. Imports (standard library → third-party → local)
3. Constants (if module-specific)
4. Type definitions
5. Classes and functions

```python
"""Module docstring describing the purpose of this module."""

import logging
from typing import Optional
from uuid import UUID

from fastapi import Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages
from core.database import get_session
from models.task import Task
from schemas.task import TaskCreate

logger = logging.getLogger(__name__)

# Module constants (if any)
MAX_RETRIES = 3

# Type definitions (if any)
TaskDict = dict[str, any]

# Classes and functions
class TaskService:
    """Service for task operations."""
    pass
```

### Directory Structure

```
backend/
├── core/                  # Core application modules
│   ├── app.py            # FastAPI application factory
│   ├── auth.py           # JWT and API key verification
│   ├── config.py         # Configuration constants
│   ├── constants.py      # Error messages and strings
│   ├── database.py       # Database connection
│   ├── middleware.py     # Auth, rate limiting, request ID
│   └── permissions.py    # Permission definitions
├── routers/              # API route handlers
│   ├── __init__.py
│   ├── tasks.py
│   └── jobs.py
├── services/             # Business logic services
│   ├── __init__.py
│   ├── task_service.py
│   └── job_service.py
├── schemas/              # Pydantic schemas
│   ├── __init__.py
│   ├── task.py
│   └── job.py
├── models/               # SQLAlchemy models
│   ├── __init__.py
│   ├── task.py
│   └── job.py
├── utils/                # Utility functions
│   ├── __init__.py
│   ├── sanitization.py
│   └── crypto.py
├── scripts/              # Utility scripts
│   ├── validate_standards.py
│   └── check_constants.py
├── tests/                # Test files
├── alembic/              # Database migrations
├── dependencies.py       # FastAPI dependencies
├── main.py               # Application entry point
└── pyproject.toml        # Python dependencies
```

## Type Hints

### Mandatory Type Hints

- **All function parameters** must have type hints
- **All return types** must be explicitly declared
- **Class attributes** should have type hints where possible

```python
# ✅ Good
def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    pass

async def get_user(user_id: str) -> User | None:
    """Get user by ID."""
    pass

# ❌ Bad
def create_task(task_data, user_id):
    """Create a new task."""
    pass

async def get_user(user_id):
    """Get user by ID."""
    pass
```

### Type Hint Syntax

- Use Python 3.12+ syntax where possible (e.g., `list[str]` instead of `List[str]`)
- Use `typing` module for complex types (Optional, Union, etc.)
- Use `|` for union types (Python 3.10+)

```python
# ✅ Good - Python 3.12+ syntax
def process_items(items: list[str]) -> dict[str, int]:
    """Process items."""
    pass

def get_value(key: str) -> str | None:
    """Get value by key."""
    pass

# ✅ Good - Using typing for complex cases
from typing import Optional, Union

def complex_function(data: Union[str, int, None]) -> Optional[dict]:
    """Complex function."""
    pass

# ❌ Bad - Old syntax
from typing import List, Dict, Optional

def process_items(items: List[str]) -> Dict[str, int]:
    """Process items."""
    pass
```

### Type Hints for Async Functions

- Always include return type hints for async functions
- Use `Awaitable` or `Coroutine` from typing if needed

```python
# ✅ Good
async def fetch_data(url: str) -> dict[str, any]:
    """Fetch data from URL."""
    pass

# ❌ Bad
async def fetch_data(url: str):
    """Fetch data from URL."""
    pass
```

## Docstrings

### Google-Style Docstrings

Use Google-style docstrings for all public functions, classes, and methods.

```python
# ✅ Good
def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """
    Create a new task.

    Args:
        task_data: Task creation data
        user_id: User ID from JWT token

    Returns:
        Created task

    Raises:
        AppException: If task creation fails
    """
    pass

# ❌ Bad
def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    pass
```

### Module-Level Docstrings

All modules must have a module-level docstring describing their purpose.

```python
"""Task service for CRUD operations."""

# Module code...
```

### Class Docstrings

All classes must have docstrings describing their purpose.

```python
# ✅ Good
class TaskService:
    """Service for task CRUD operations."""

    def __init__(self, session: AsyncSession):
        """
        Initialize task service.

        Args:
            session: Database session
        """
        self.session = session

# ❌ Bad
class TaskService:
    def __init__(self, session: AsyncSession):
        self.session = session
```

### Private Functions

Private functions (prefixed with `_`) should have docstrings if they are complex or non-obvious.

```python
# ✅ Good - Simple private function, docstring optional
def _format_date(date: datetime) -> str:
    """Format date to ISO string."""
    return date.isoformat()

# ✅ Good - Complex private function, docstring required
def _validate_and_sanitize_input(data: dict) -> dict:
    """
    Validate and sanitize input data.

    Performs multiple validation checks and sanitizes string fields.

    Args:
        data: Raw input data dictionary

    Returns:
        Validated and sanitized data dictionary

    Raises:
        ValueError: If validation fails
    """
    pass
```

## Constants Usage

### Mandatory Constants

**CRITICAL**: Never hardcode strings. Always use constants from:
- `core/config.py` - Configuration constants (environment variables, URLs, etc.)
- `core/constants.py` - Error messages, validation messages, and other string constants

```python
# ✅ Good
from core.config import BETTER_AUTH_URL, JWKS_URL
from core.constants import ErrorMessages, ValidationErrorMessages

raise AppException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail=ErrorMessages.TASK_NOT_FOUND
)

# ❌ Bad
raise AppException(
    status_code=404,
    detail="Task not found"
)
```

### Adding New Constants

When adding new constants:

1. **Configuration constants**: Add to `core/config.py`
   ```python
   # In core/config.py
   NEW_CONFIG_VALUE = os.getenv("NEW_CONFIG_VALUE", "default")
   ```

2. **Error messages**: Add to appropriate class in `core/constants.py`
   ```python
   # In core/constants.py
   class ErrorMessages:
       NEW_ERROR = "New error message"
   ```

3. **Group related constants** in classes
   ```python
   # ✅ Good
   class ErrorMessages:
       TASK_NOT_FOUND = "Task not found"
       TASK_CREATE_ERROR = "Failed to create task"
       TASK_UPDATE_ERROR = "Failed to update task"
   ```

### Exceptions

Constants are not required for:
- Test IDs and data attributes
- Technical identifiers (API endpoint paths, database field names)
- Internal variable names
- String literals used in type definitions or annotations

## Error Handling

### Custom Exceptions

Use custom exceptions from `core/exceptions.py`:

```python
# ✅ Good
from core.exceptions import AppException, AuthenticationError

if not user:
    raise AppException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorMessages.USER_NOT_FOUND
    )

# ❌ Bad
if not user:
    raise ValueError("User not found")
```

### Exception Chaining

Always use exception chaining with `from e`:

```python
# ✅ Good
try:
    result = await database.query(...)
except DatabaseError as e:
    logger.error(f"Database query failed: {e!s}", exc_info=True)
    raise AppException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=ErrorMessages.INTERNAL_SERVER_ERROR
    ) from e

# ❌ Bad
try:
    result = await database.query(...)
except DatabaseError as e:
    raise AppException(...)  # Loses original exception context
```

### Error Messages

Always use constants from `core/constants.py` for error messages:

```python
# ✅ Good
from core.constants import ErrorMessages

raise AppException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail=ErrorMessages.TASK_NOT_FOUND
)

# ❌ Bad
raise AppException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Task not found"
)
```

### Logging Before Raising

Log errors with context before raising exceptions:

```python
# ✅ Good
try:
    task = await self.get_task(task_id, user_id)
except Exception as e:
    logger.error(f"Failed to get task {task_id}: {e!s}", exc_info=True)
    raise AppException(...) from e

# ❌ Bad
try:
    task = await self.get_task(task_id, user_id)
except Exception as e:
    raise AppException(...) from e  # No logging
```

## Async/Await Patterns

### Async Database Operations

Use async/await for all database operations:

```python
# ✅ Good
async def get_task(task_id: UUID, user_id: str) -> Task:
    """Get task by ID."""
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await self.session.execute(statement)
    return result.scalar_one_or_none()

# ❌ Bad
def get_task(task_id: UUID, user_id: str) -> Task:
    """Get task by ID."""
    # Synchronous database operation
    return self.session.query(Task).filter_by(id=task_id).first()
```

### AsyncSession

Always use `AsyncSession` for database sessions:

```python
# ✅ Good
from sqlalchemy.ext.asyncio import AsyncSession

def get_task_service(session: AsyncSession = Depends(get_session)) -> TaskService:
    """Dependency to get task service."""
    return TaskService(session)

# ❌ Bad
from sqlalchemy.orm import Session

def get_task_service(session: Session = Depends(get_session)) -> TaskService:
    """Dependency to get task service."""
    return TaskService(session)
```

### Exception Handling in Async Functions

Proper exception handling in async functions:

```python
# ✅ Good
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    try:
        task = Task(...)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task
    except Exception as e:
        await self.session.rollback()
        logger.error(f"Failed to create task: {e!s}", exc_info=True)
        raise AppException(...) from e

# ❌ Bad
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    task = Task(...)
    self.session.add(task)
    await self.session.commit()  # No error handling
    return task
```

## FastAPI Patterns

### Dependency Injection

Use dependency injection for services:

```python
# ✅ Good
def get_task_service(session: AsyncSession = Depends(get_session)) -> TaskService:
    """Dependency to get task service instance."""
    return TaskService(session)

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    request: Request,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Create a new task."""
    user_id = request.state.user_id
    task = await task_service.create_task(task_data, user_id)
    return TaskResponse.model_validate(task)

# ❌ Bad
@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    request: Request,
) -> TaskResponse:
    """Create a new task."""
    session = get_session()  # Direct instantiation
    task_service = TaskService(session)
    # ...
```

### Pydantic Schemas

Use Pydantic schemas for request/response validation:

```python
# ✅ Good
from schemas.task import TaskCreate, TaskResponse

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    request: Request,
) -> TaskResponse:
    """Create a new task."""
    pass

# ❌ Bad
@router.post("/")
async def create_task(
    title: str,
    description: str | None = None,
    request: Request,
) -> dict:
    """Create a new task."""
    pass
```

### Status Codes and Response Models

Include proper status codes and response models:

```python
# ✅ Good
from fastapi import status

@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create task",
    description="Create a new task for the authenticated user.",
)
async def create_task(...) -> TaskResponse:
    """Create a new task."""
    pass

# ❌ Bad
@router.post("/")
async def create_task(...):
    """Create a new task."""
    pass
```

### Router Prefix and Tags

Use router prefix and tags for organization:

```python
# ✅ Good
router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/")
async def list_tasks(...):
    """List tasks."""
    pass

# ❌ Bad
router = APIRouter()

@router.get("/tasks")
async def list_tasks(...):
    """List tasks."""
    pass
```

## Database Patterns

### SQLAlchemy Async Patterns

Use SQLAlchemy async patterns:

```python
# ✅ Good
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_task(task_id: UUID, user_id: str) -> Task | None:
    """Get task by ID."""
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await self.session.execute(statement)
    return result.scalar_one_or_none()

# ❌ Bad
async def get_task(task_id: UUID, user_id: str) -> Task | None:
    """Get task by ID."""
    # Using old query API
    return await self.session.query(Task).filter_by(id=task_id).first()
```

### Transactions

Always use transactions (commit/rollback):

```python
# ✅ Good
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    try:
        task = Task(...)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task
    except Exception as e:
        await self.session.rollback()
        raise AppException(...) from e

# ❌ Bad
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    task = Task(...)
    self.session.add(task)
    await self.session.commit()  # No rollback on error
    return task
```

### Query Building

Use proper query building with select statements:

```python
# ✅ Good
from sqlalchemy import func, select
from sqlmodel import col

# Count query
count_statement = select(func.count()).select_from(Task).where(Task.user_id == user_id)
count_result = await self.session.execute(count_statement)
total = count_result.scalar() or 0

# Select query
statement = (
    select(Task)
    .where(Task.user_id == user_id)
    .order_by(col(Task.created_at).desc())
    .offset(offset)
    .limit(page_size)
)
result = await self.session.execute(statement)
tasks = result.scalars().all()

# ❌ Bad
# Using old query API
tasks = await self.session.query(Task).filter_by(user_id=user_id).all()
```

### Better Auth API Usage

**CRITICAL**: Never query auth/org/team/permission data directly. Always use Better Auth APIs:

```python
# ✅ Good - Use Better Auth API
import httpx
from core.config import BETTER_AUTH_URL

async def verify_user_permission(user_id: str, permission: str) -> bool:
    """Verify user permission via Better Auth API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BETTER_AUTH_URL}/api/auth/check-permission",
            headers={"Authorization": f"Bearer {token}"},
            params={"permission": permission}
        )
        return response.status_code == 200

# ❌ Bad - Direct database query
async def verify_user_permission(user_id: str, permission: str) -> bool:
    """Verify user permission."""
    # Direct database query - WRONG!
    user = await self.session.execute(
        select(User).where(User.id == user_id)
    )
    # ...
```

## Logging

### Module-Level Loggers

Use `logging.getLogger(__name__)` for module-level loggers:

```python
# ✅ Good
import logging

logger = logging.getLogger(__name__)

def some_function():
    logger.info("Function called")

# ❌ Bad
import logging

def some_function():
    logging.info("Function called")  # Not using module logger
```

### Log Levels

Use appropriate log levels:

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failures

```python
# ✅ Good
logger.debug(f"Processing task {task_id}")  # Detailed debug info
logger.info(f"Task created: {task_id}")  # General info
logger.warning(f"Rate limit approaching for user {user_id}")  # Warning
logger.error(f"Failed to create task: {e!s}", exc_info=True)  # Error with traceback

# ❌ Bad
logger.info(f"Processing task {task_id}")  # Should be DEBUG
logger.error(f"Task created: {task_id}")  # Should be INFO
```

### Context in Log Messages

Include context in log messages:

```python
# ✅ Good
logger.info(f"Task created: {task.id} by user {user_id}")
logger.error(f"Failed to get task {task_id}: {e!s}", exc_info=True)

# ❌ Bad
logger.info("Task created")
logger.error("Failed to get task")
```

### No Print Statements

Never use `print()` statements in production code:

```python
# ✅ Good
logger.debug("Debug message")
logger.info("Info message")

# ❌ Bad
print("Debug message")
print("Info message")
```

## Code Style

### Line Length

- **Maximum line length**: 100 characters (enforced by ruff)

```python
# ✅ Good - Line within 100 characters
def create_task(
    task_data: TaskCreate,
    user_id: str,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Create a new task."""
    pass

# ❌ Bad - Line exceeds 100 characters
def create_task(task_data: TaskCreate, user_id: str, task_service: TaskService = Depends(get_task_service)) -> TaskResponse:
    """Create a new task."""
    pass
```

### Indentation

- **Indentation**: 4 spaces (enforced by ruff)

```python
# ✅ Good
def function():
    if condition:
        do_something()

# ❌ Bad
def function():
  if condition:
    do_something()  # 2 spaces
```

### Quotes

- **String quotes**: Double quotes (enforced by ruff)

```python
# ✅ Good
message = "Hello, world!"
name = "John"

# ❌ Bad
message = 'Hello, world!'
name = 'John'
```

### Trailing Commas

Trailing commas required for multi-line structures:

```python
# ✅ Good
items = [
    "item1",
    "item2",
    "item3",  # Trailing comma
]

# ❌ Bad
items = [
    "item1",
    "item2",
    "item3"  # No trailing comma
]
```

## Import Organization

### Import Order

Organize imports in this order:

1. Standard library imports
2. Third-party imports
3. Local imports (from project)

```python
# ✅ Good
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.constants import ErrorMessages
from core.database import get_session
from models.task import Task
from schemas.task import TaskCreate

# ❌ Bad - Mixed order
from fastapi import Request
import logging
from core.constants import ErrorMessages
from datetime import datetime
```

### Import Grouping

Group related imports together with blank lines between groups:

```python
# ✅ Good
import logging
from datetime import datetime
from uuid import UUID

from fastapi import Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages
from core.database import get_session

# ❌ Bad - No grouping
import logging
from fastapi import Request
from core.constants import ErrorMessages
from datetime import datetime
```

### Absolute vs Relative Imports

Prefer absolute imports:

```python
# ✅ Good
from core.constants import ErrorMessages
from services.task_service import TaskService

# ❌ Bad
from ..core.constants import ErrorMessages
from .task_service import TaskService
```

## Code Complexity

### Principles

**Keep code simple and maintainable.** Complex code is harder to understand, test, and maintain. When code becomes too complex, refactor it into smaller, focused functions.

### Complexity Limits

#### Function Length

- **Maximum function length**: 50 lines (excluding docstrings and type hints)
- If a function exceeds 50 lines, split it into smaller functions
- Each function should have a single, clear responsibility

```python
# ✅ Good - Short, focused function
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    task = Task(
        title=task_data.title,
        description=task_data.description,
        user_id=user_id,
    )
    self.session.add(task)
    await self.session.commit()
    await self.session.refresh(task)
    return task

# ❌ Bad - Function too long
async def create_task_with_validation_and_notification(
    task_data: TaskCreate, user_id: str
) -> Task:
    """Create task with validation and notification."""
    # 100+ lines of validation, creation, notification, etc.
    pass
```

#### Cyclomatic Complexity

- **Maximum cyclomatic complexity**: 10 per function
- Cyclomatic complexity measures the number of independent paths through code
- Reduce complexity by extracting methods, using early returns, and simplifying conditionals

```python
# ✅ Good - Low complexity
async def get_task(task_id: UUID, user_id: str) -> Task | None:
    """Get task by ID."""
    if not task_id:
        return None
    
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id
    )
    result = await self.session.execute(statement)
    return result.scalar_one_or_none()

# ❌ Bad - High complexity (many nested conditions)
async def process_task(task_id: UUID, user_id: str) -> Task | None:
    """Process task with complex logic."""
    if task_id:
        if user_id:
            task = await self.get_task(task_id, user_id)
            if task:
                if task.status == "pending":
                    if task.priority == "high":
                        # ... many more nested conditions
                        pass
    return None
```

#### Nesting Depth

- **Maximum nesting depth**: 3 levels
- Deep nesting makes code hard to read and understand
- Use early returns, guard clauses, and extract methods to reduce nesting

```python
# ✅ Good - Early returns reduce nesting
async def update_task(
    task_id: UUID, task_data: TaskUpdate, user_id: str
) -> Task:
    """Update task."""
    task = await self.get_task(task_id, user_id)
    if not task:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorMessages.TASK_NOT_FOUND
        )
    
    if not task_data.model_dump(exclude_unset=True):
        return task
    
    for field, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    
    await self.session.commit()
    await self.session.refresh(task)
    return task

# ❌ Bad - Deep nesting
async def update_task(
    task_id: UUID, task_data: TaskUpdate, user_id: str
) -> Task:
    """Update task."""
    task = await self.get_task(task_id, user_id)
    if task:
        if task_data.model_dump(exclude_unset=True):
            for field, value in task_data.model_dump(exclude_unset=True).items():
                if field in ["title", "description", "status"]:
                    if value is not None:
                        setattr(task, field, value)
            await self.session.commit()
            await self.session.refresh(task)
            return task
    return None
```

#### Function Parameters

- **Maximum parameters**: 5 per function
- If a function needs more than 5 parameters, use a data class or Pydantic model
- Group related parameters into objects

```python
# ✅ Good - Using Pydantic model
async def create_task(task_data: TaskCreate, user_id: str) -> Task:
    """Create a new task."""
    pass

# ❌ Bad - Too many parameters
async def create_task(
    title: str,
    description: str | None,
    status: str,
    priority: str,
    due_date: datetime | None,
    tags: list[str],
    user_id: str,
) -> Task:
    """Create a new task."""
    pass
```

### Reducing Complexity

#### Extract Methods

Break complex functions into smaller, focused functions:

```python
# ✅ Good - Extracted methods
async def process_task_creation(
    task_data: TaskCreate, user_id: str
) -> Task:
    """Process task creation with validation and setup."""
    _validate_task_data(task_data)
    task = _create_task_entity(task_data, user_id)
    await _save_task(task)
    await _setup_task_notifications(task)
    return task

def _validate_task_data(task_data: TaskCreate) -> None:
    """Validate task data."""
    if not task_data.title:
        raise ValidationError(ValidationErrorMessages.TITLE_REQUIRED)

def _create_task_entity(task_data: TaskCreate, user_id: str) -> Task:
    """Create task entity."""
    return Task(
        title=task_data.title,
        description=task_data.description,
        user_id=user_id,
    )

async def _save_task(task: Task) -> None:
    """Save task to database."""
    self.session.add(task)
    await self.session.commit()
    await self.session.refresh(task)

async def _setup_task_notifications(task: Task) -> None:
    """Setup task notifications."""
    # Notification logic
    pass

# ❌ Bad - All logic in one function
async def process_task_creation(
    task_data: TaskCreate, user_id: str
) -> Task:
    """Process task creation."""
    # 100+ lines of validation, creation, saving, notifications, etc.
    pass
```

#### Use Early Returns

Use early returns to reduce nesting and improve readability:

```python
# ✅ Good - Early returns
async def get_task_with_permission(
    task_id: UUID, user_id: str, permission: str
) -> Task | None:
    """Get task if user has permission."""
    if not task_id:
        return None
    
    task = await self.get_task(task_id, user_id)
    if not task:
        return None
    
    if not await self._check_permission(user_id, permission):
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorMessages.PERMISSION_DENIED
        )
    
    return task

# ❌ Bad - Deep nesting
async def get_task_with_permission(
    task_id: UUID, user_id: str, permission: str
) -> Task | None:
    """Get task if user has permission."""
    if task_id:
        task = await self.get_task(task_id, user_id)
        if task:
            if await self._check_permission(user_id, permission):
                return task
            else:
                raise AppException(...)
    return None
```

#### Simplify Conditionals

Use helper functions and boolean logic to simplify conditionals:

```python
# ✅ Good - Simplified conditionals
def _is_valid_task_status(status: str) -> bool:
    """Check if task status is valid."""
    return status in ["pending", "in_progress", "completed", "cancelled"]

async def update_task_status(task_id: UUID, status: str) -> Task:
    """Update task status."""
    if not _is_valid_task_status(status):
        raise ValidationError(ValidationErrorMessages.INVALID_STATUS)
    
    task = await self.get_task(task_id)
    task.status = status
    await self.session.commit()
    return task

# ❌ Bad - Complex conditional
async def update_task_status(task_id: UUID, status: str) -> Task:
    """Update task status."""
    if (
        status == "pending"
        or status == "in_progress"
        or status == "completed"
        or status == "cancelled"
    ):
        task = await self.get_task(task_id)
        if task:
            task.status = status
            await self.session.commit()
            return task
    raise ValidationError(...)
```

#### Avoid Deep Nesting in Loops

Extract loop logic into separate functions:

```python
# ✅ Good - Extracted loop logic
async def process_tasks(tasks: list[Task]) -> list[Task]:
    """Process multiple tasks."""
    processed = []
    for task in tasks:
        processed_task = await _process_single_task(task)
        processed.append(processed_task)
    return processed

async def _process_single_task(task: Task) -> Task:
    """Process a single task."""
    if not task.is_valid():
        raise ValidationError(...)
    
    task.status = "processed"
    await self.session.commit()
    return task

# ❌ Bad - Complex nested loop logic
async def process_tasks(tasks: list[Task]) -> list[Task]:
    """Process multiple tasks."""
    processed = []
    for task in tasks:
        if task:
            if task.is_valid():
                if task.status == "pending":
                    task.status = "processed"
                    await self.session.commit()
                    processed.append(task)
                else:
                    logger.warning(f"Task {task.id} not pending")
            else:
                raise ValidationError(...)
    return processed
```

### Complexity Metrics

The following complexity metrics are enforced:

- **File size**: Maximum 500 lines (enforced by validation script)
- **Function length**: Maximum 50 lines (recommended, not strictly enforced)
- **Cyclomatic complexity**: Maximum 10 per function (recommended)
- **Nesting depth**: Maximum 3 levels (recommended)
- **Function parameters**: Maximum 5 per function (enforced by ruff PLR0913)

### When to Refactor

Refactor code when:

1. **Function exceeds 50 lines** - Split into smaller functions
2. **Cyclomatic complexity > 10** - Extract methods, use early returns
3. **Nesting depth > 3** - Use early returns, extract methods
4. **Function has > 5 parameters** - Use data classes or Pydantic models
5. **Code is hard to understand** - Simplify logic, add helper functions
6. **Code is hard to test** - Reduce dependencies, extract logic
7. **Code has duplicate logic** - Extract common functionality

### Tools

Complexity is checked using:

1. **Ruff**: Enforces some complexity rules (PLR0913, etc.)
2. **Validation scripts**: Check file size limits
3. **Code review**: Manual review for complexity issues

## Testing

### Test File Naming

- Test files should be named `test_*.py` or `*_test.py`
- Place test files in `tests/` directory

### Test Structure

- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test behavior, not implementation

```python
# ✅ Good
import pytest
from services.task_service import TaskService

@pytest.mark.asyncio
async def test_create_task_success(session: AsyncSession):
    """Test successful task creation."""
    # Arrange
    service = TaskService(session)
    task_data = TaskCreate(title="Test Task")
    user_id = "user123"

    # Act
    task = await service.create_task(task_data, user_id)

    # Assert
    assert task.id is not None
    assert task.title == "Test Task"
    assert task.user_id == user_id

# ❌ Bad
@pytest.mark.asyncio
async def test_task(session: AsyncSession):
    """Test task."""
    service = TaskService(session)
    task = await service.create_task(TaskCreate(title="Test"), "user123")
    assert task
```

## Enforcement

These standards are enforced through:

1. **Ruff**: Automatic linting and formatting
2. **Pre-commit hooks**: Automatic checks before commits
3. **Validation scripts**: Custom checks for standards not covered by ruff
4. **Code review**: Manual review for adherence to standards

Run the following commands to check your code:

```bash
# Format code
make format-backend
# or
cd backend && uv run ruff format .

# Lint code
make lint-backend
# or
cd backend && uv run ruff check .

# Check formatting and linting
make check-backend
# or
cd backend && uv run ruff check . && uv run ruff format --check .

# Run validation scripts
make validate-backend
# or
cd backend && uv run python scripts/validate_standards.py
```

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

