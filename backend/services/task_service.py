"""Task service for CRUD operations."""

from datetime import UTC, datetime
import logging
from uuid import UUID

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from core.constants import ErrorMessages
from core.exceptions import AppException
from models.task import Task, TaskStatus
from schemas.task import TaskCreate, TaskUpdate

logger = logging.getLogger(__name__)


class TaskService:
    """Service for task CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """
        Initialize task service.

        Args:
            session: Database session
        """
        self.session = session

    async def create_task(self, task_data: TaskCreate, user_id: str) -> Task:
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
        try:
            task = Task(
                title=task_data.title,
                description=task_data.description,
                status=task_data.status or TaskStatus.PENDING,
                user_id=user_id,
            )

            self.session.add(task)
            await self.session.commit()
            await self.session.refresh(task)

            logger.info(f"Task created: {task.id} by user {user_id}")
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to create task: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.TASK_CREATE_ERROR,
            ) from e
        else:
            return task

    async def get_task(self, task_id: UUID, user_id: str) -> Task:
        """
        Get a task by ID.

        Args:
            task_id: Task ID
            user_id: User ID from JWT token

        Returns:
            Task if found

        Raises:
            AppException: If task not found or access denied
        """
        try:
            statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
            result = await self.session.execute(statement)
            task = result.scalar_one_or_none()

            if not task:
                raise AppException(
                    status_code=status.HTTP_404_NOT_FOUND, detail=ErrorMessages.TASK_NOT_FOUND
                )
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to get task {task_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e
        else:
            return task

    async def list_tasks(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 10,
        status_filter: TaskStatus | None = None,
    ) -> tuple[list[Task], int]:
        """
        List tasks with pagination.

        Args:
            user_id: User ID from JWT token
            page: Page number (1-indexed)
            page_size: Number of items per page
            status_filter: Optional status filter

        Returns:
            Tuple of (tasks list, total count)
        """
        try:
            # Build query
            where_clauses = [Task.user_id == user_id]
            if status_filter:
                # The model is configured with native_enum=False, so SQLAlchemy will
                # automatically handle the enum-to-string conversion for VARCHAR columns
                logger.debug(f"Filtering tasks by status: {status_filter}")
                where_clauses.append(Task.status == status_filter)

            # Count total
            count_statement = select(func.count()).select_from(Task).where(*where_clauses)
            count_result = await self.session.execute(count_statement)
            total = count_result.scalar() or 0

            # Get paginated results
            offset = (page - 1) * page_size
            statement = (
                select(Task)
                .where(*where_clauses)
                .order_by(col(Task.created_at).desc())
                .offset(offset)
                .limit(page_size)
            )
            result = await self.session.execute(statement)
            tasks = result.scalars().all()

        except Exception as e:
            logger.error(f"Failed to list tasks: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e
        else:
            return list(tasks), total

    async def update_task(self, task_id: UUID, task_data: TaskUpdate, user_id: str) -> Task:
        """
        Update an existing task.

        Args:
            task_id: Task ID
            task_data: Task update data
            user_id: User ID from JWT token

        Returns:
            Updated task

        Raises:
            AppException: If task not found or update fails
        """
        try:
            task = await self.get_task(task_id, user_id)

            # Update fields if provided
            update_data = task_data.model_dump(exclude_unset=True)
            if update_data:
                for field, value in update_data.items():
                    setattr(task, field, value)
                # Use naive datetime to match TIMESTAMP WITHOUT TIME ZONE column
                task.updated_at = datetime.now(UTC).replace(tzinfo=None)

                await self.session.commit()
                await self.session.refresh(task)

                logger.info(f"Task updated: {task_id} by user {user_id}")
        except AppException:
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to update task {task_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.TASK_UPDATE_ERROR,
            ) from e
        else:
            return task

    async def delete_task(self, task_id: UUID, user_id: str) -> None:
        """
        Delete a task.

        Args:
            task_id: Task ID
            user_id: User ID from JWT token

        Raises:
            AppException: If task not found or deletion fails
        """
        try:
            task = await self.get_task(task_id, user_id)

            await self.session.delete(task)
            await self.session.commit()

            logger.info(f"Task deleted: {task_id} by user {user_id}")
        except AppException:
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(f"Failed to delete task {task_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.TASK_DELETE_ERROR,
            ) from e
