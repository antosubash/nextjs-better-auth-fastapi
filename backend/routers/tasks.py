"""Task API routes."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.exceptions import AppException
from models.task import TaskStatus
from schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
)
from services.task_service import TaskService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_task_service(session: AsyncSession = Depends(get_session)) -> TaskService:
    """
    Dependency to get task service instance.

    Args:
        session: Database session

    Returns:
        TaskService instance
    """
    return TaskService(session)


def get_user_id(request: Request) -> str:
    """
    Extract user ID from JWT token in request state.

    Args:
        request: FastAPI request object

    Returns:
        User ID from token

    Raises:
        AppException: If user ID not found in token
    """
    token_data = getattr(request.state, "token_data", None)
    if not token_data:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token"
        )

    # Try both 'sub' and 'id' fields (JWT standard vs Better Auth)
    user_id = token_data.get("sub") or token_data.get("id")
    if not user_id:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token"
        )

    return str(user_id)


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create task",
    description="Create a new task for the authenticated user.",
)
async def create_task(
    task_data: TaskCreate,
    _request: Request,
    task_service: TaskService = Depends(get_task_service),
    user_id: str = Depends(get_user_id),
) -> TaskResponse:
    """
    Create a new task.

    Args:
        task_data: Task creation data
        request: FastAPI request object
        task_service: Task service dependency
        user_id: User ID from JWT token

    Returns:
        Created task
    """
    task = await task_service.create_task(task_data, user_id)
    return TaskResponse.model_validate(task)


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="List tasks",
    description="List tasks for the authenticated user with pagination.",
)
async def list_tasks(
    _request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status_filter: TaskStatus | None = Query(None, description="Filter by status"),
    task_service: TaskService = Depends(get_task_service),
    user_id: str = Depends(get_user_id),
) -> TaskListResponse:
    """
    List tasks with pagination.

    Args:
        request: FastAPI request object
        page: Page number
        page_size: Items per page
        status_filter: Optional status filter
        task_service: Task service dependency
        user_id: User ID from JWT token

    Returns:
        Paginated task list
    """
    tasks, total = await task_service.list_tasks(
        user_id=user_id, page=page, page_size=page_size, status_filter=status_filter
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return TaskListResponse(
        items=[TaskResponse.model_validate(task) for task in tasks],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task",
    description="Get a specific task by ID.",
)
async def get_task(
    task_id: UUID,
    _request: Request,
    task_service: TaskService = Depends(get_task_service),
    user_id: str = Depends(get_user_id),
) -> TaskResponse:
    """
    Get a task by ID.

    Args:
        task_id: Task ID
        request: FastAPI request object
        task_service: Task service dependency
        user_id: User ID from JWT token

    Returns:
        Task data
    """
    task = await task_service.get_task(task_id, user_id)
    return TaskResponse.model_validate(task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Update an existing task.",
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    _request: Request,
    task_service: TaskService = Depends(get_task_service),
    user_id: str = Depends(get_user_id),
) -> TaskResponse:
    """
    Update a task.

    Args:
        task_id: Task ID
        task_data: Task update data
        request: FastAPI request object
        task_service: Task service dependency
        user_id: User ID from JWT token

    Returns:
        Updated task
    """
    task = await task_service.update_task(task_id, task_data, user_id)
    return TaskResponse.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
    description="Delete a task.",
)
async def delete_task(
    task_id: UUID,
    _request: Request,
    task_service: TaskService = Depends(get_task_service),
    user_id: str = Depends(get_user_id),
) -> None:
    """
    Delete a task.

    Args:
        task_id: Task ID
        request: FastAPI request object
        task_service: Task service dependency
        user_id: User ID from JWT token
    """
    await task_service.delete_task(task_id, user_id)
