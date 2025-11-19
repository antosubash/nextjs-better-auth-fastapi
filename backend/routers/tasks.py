"""Task API routes."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
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


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create task",
    description="Create a new task for the authenticated user.",
)
async def create_task(
    task_data: TaskCreate,
    request: Request,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """
    Create a new task.

    Args:
        task_data: Task creation data
        request: FastAPI request object
        task_service: Task service dependency

    Returns:
        Created task
    """
    user_id = request.state.user_id
    task = await task_service.create_task(task_data, user_id)
    return TaskResponse.model_validate(task)


# Register route without trailing slash to handle /tasks (not just /tasks/)
router.add_api_route(
    "",
    create_task,
    methods=["POST"],
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="List tasks",
    description="List tasks for the authenticated user with pagination.",
)
async def list_tasks(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status_filter: TaskStatus | None = Query(None, description="Filter by status"),
    task_service: TaskService = Depends(get_task_service),
) -> TaskListResponse:
    """
    List tasks with pagination.

    Args:
        request: FastAPI request object
        page: Page number
        page_size: Items per page
        status_filter: Optional status filter
        task_service: Task service dependency

    Returns:
        Paginated task list
    """
    user_id = request.state.user_id
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


# Register route without trailing slash to handle /tasks (not just /tasks/)
router.add_api_route(
    "",
    list_tasks,
    methods=["GET"],
    response_model=TaskListResponse,
    include_in_schema=False,
)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task",
    description="Get a specific task by ID.",
)
async def get_task(
    task_id: UUID,
    request: Request,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """
    Get a task by ID.

    Args:
        task_id: Task ID
        request: FastAPI request object
        task_service: Task service dependency

    Returns:
        Task data
    """
    user_id = request.state.user_id
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
    request: Request,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """
    Update a task.

    Args:
        task_id: Task ID
        task_data: Task update data
        request: FastAPI request object
        task_service: Task service dependency

    Returns:
        Updated task
    """
    user_id = request.state.user_id
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
    request: Request,
    task_service: TaskService = Depends(get_task_service),
) -> None:
    """
    Delete a task.

    Args:
        task_id: Task ID
        request: FastAPI request object
        task_service: Task service dependency
    """
    user_id = request.state.user_id
    await task_service.delete_task(task_id, user_id)
