"""Job service for job management operations."""

import importlib
import logging
from collections.abc import Callable
from typing import Any

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages
from core.exceptions import AppException
from core.jobs import (
    add_interval_job,
    add_one_time_job,
    add_scheduled_job,
    get_job,
    list_jobs,
    pause_job,
    remove_job,
    resume_job,
)
from models.job_history import JobHistory, JobHistoryStatus
from schemas.job import (
    JobCreate,
    JobHistoryResponse,
    JobResponse,
)

logger = logging.getLogger(__name__)

# Registry of available job functions
_job_functions: dict[str, Callable[..., Any]] = {}


def register_job_function(name: str, func: Callable[..., Any]) -> None:
    """
    Register a job function.

    Args:
        name: Function name identifier
        func: Function to register
    """
    _job_functions[name] = func
    logger.debug(f"Registered job function: {name}")


def get_job_function(name: str) -> Callable[..., Any]:
    """
    Get a registered job function by name.

    Args:
        name: Function name identifier

    Returns:
        Registered function

    Raises:
        AppException: If function not found
    """
    # Try direct lookup first
    if name in _job_functions:
        return _job_functions[name]

    # Try importing from module path (e.g., "jobs.example_jobs:function_name")
    if ":" in name:
        module_path, func_name = name.rsplit(":", 1)
        try:
            module = importlib.import_module(module_path)
            func = getattr(module, func_name)
            if callable(func):
                return func
        except (ImportError, AttributeError) as e:
            logger.exception("Failed to import job function %s", name)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessages.JOB_FUNCTION_NOT_FOUND,
            ) from e

    raise AppException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=ErrorMessages.JOB_FUNCTION_NOT_FOUND,
    )


class JobService:
    """Service for job management operations."""

    async def _save_job_history(
        self,
        session: AsyncSession,
        job: Any,
        status: JobHistoryStatus,
        user_id: str | None = None,
        error_message: str | None = None,
        trigger_type: str | None = None,
    ) -> None:
        """
        Save job history record.

        Args:
            session: Database session
            job: APScheduler job object
            status: Job history status
            user_id: User ID who performed the action
            error_message: Error message if job failed
            trigger_type: Trigger type (cron, interval, once)
        """
        try:
            # Extract function name from func_ref
            func_ref_str = str(job.func_ref)
            function_name = func_ref_str.split(":")[-1] if ":" in func_ref_str else func_ref_str

            # Determine trigger type from trigger string if not provided
            if not trigger_type:
                trigger_str = str(job.trigger).lower()
                if "cron" in trigger_str:
                    trigger_type = "cron"
                elif "interval" in trigger_str:
                    trigger_type = "interval"
                elif "date" in trigger_str:
                    trigger_type = "once"
                else:
                    trigger_type = "unknown"

            # Convert args and kwargs to dict format
            args_dict = None
            kwargs_dict = None
            if hasattr(job, "args") and job.args:
                args_dict = {"args": list(job.args)}
            if hasattr(job, "kwargs") and job.kwargs:
                kwargs_dict = job.kwargs

            history = JobHistory(
                job_id=job.id,
                function=function_name,
                func_ref=func_ref_str,
                trigger=str(job.trigger),
                trigger_type=trigger_type,
                status=status,
                args=args_dict,
                kwargs=kwargs_dict,
                next_run_time=job.next_run_time,
                error_message=error_message,
                user_id=user_id,
            )
            session.add(history)
            logger.debug(f"Job history saved: {job.id} - {status}")
        except Exception as e:
            # Don't fail the main operation if history saving fails
            logger.error(f"Failed to save job history: {e!s}", exc_info=True)

    async def create_job(
        self, job_data: JobCreate, session: AsyncSession, user_id: str | None = None
    ) -> JobResponse:
        """
        Create a new job.

        Args:
            job_data: Job creation data

        Returns:
            Created job

        Raises:
            AppException: If job creation fails
        """
        try:
            # Get the function
            func = get_job_function(job_data.function)

            # Convert args and kwargs
            args_tuple = tuple(job_data.args) if job_data.args else ()
            kwargs_dict = job_data.kwargs or {}

            # Create job based on trigger type
            if job_data.trigger_type == "cron":
                if not job_data.cron_expression:
                    raise AppException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=ErrorMessages.JOB_INVALID_SCHEDULE,
                    )
                add_scheduled_job(
                    func=func,
                    job_id=job_data.job_id,
                    trigger=job_data.cron_expression,
                    args=args_tuple,
                    kwargs=kwargs_dict,
                    replace_existing=job_data.replace_existing,
                )
            elif job_data.trigger_type == "interval":
                add_interval_job(
                    func=func,
                    job_id=job_data.job_id,
                    weeks=job_data.weeks,
                    days=job_data.days,
                    hours=job_data.hours,
                    minutes=job_data.minutes,
                    seconds=job_data.seconds,
                    start_date=job_data.start_date,
                    end_date=job_data.end_date,
                    args=args_tuple,
                    kwargs=kwargs_dict,
                    replace_existing=job_data.replace_existing,
                )
            elif job_data.trigger_type == "once":
                add_one_time_job(
                    func=func,
                    job_id=job_data.job_id,
                    run_date=job_data.run_date,
                    args=args_tuple,
                    kwargs=kwargs_dict,
                    replace_existing=job_data.replace_existing,
                )
            else:
                raise AppException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=ErrorMessages.JOB_INVALID_SCHEDULE,
                )

            # Get the created job
            job = get_job(job_data.job_id)
            if not job:
                raise AppException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=ErrorMessages.JOB_CREATE_ERROR,
                )

            logger.info(f"Job created: {job_data.job_id}")

            # Save history
            await self._save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.CREATED,
                user_id=user_id,
                trigger_type=job_data.trigger_type,
            )
            await session.commit()

            return self._job_to_response(job)

        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to create job: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.JOB_CREATE_ERROR,
            ) from e

    def get_job_by_id(self, job_id: str) -> JobResponse:
        """
        Get a job by ID.

        Args:
            job_id: Job ID

        Returns:
            Job data

        Raises:
            AppException: If job not found
        """
        try:
            job = get_job(job_id)
            if not job:
                raise AppException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=ErrorMessages.JOB_NOT_FOUND,
                )
            return self._job_to_response(job)
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to get job {job_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e

    def list_all_jobs(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[JobResponse], int]:
        """
        List all jobs with pagination.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (jobs list, total count)
        """
        try:
            all_jobs = list_jobs()
            total = len(all_jobs)

            # Paginate
            offset = (page - 1) * page_size
            paginated_jobs = all_jobs[offset : offset + page_size]

            job_responses = [self._job_to_response(job) for job in paginated_jobs]
        except Exception as e:
            logger.error(f"Failed to list jobs: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e
        else:
            return job_responses, total

    async def delete_job(
        self, job_id: str, session: AsyncSession, user_id: str | None = None
    ) -> None:
        """
        Delete a job.

        Args:
            job_id: Job ID
            session: Database session
            user_id: User ID who performed the action

        Raises:
            AppException: If job not found or deletion fails
        """
        try:
            job = get_job(job_id)
            if not job:
                raise AppException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=ErrorMessages.JOB_NOT_FOUND,
                )

            # Save history before removing
            await self._save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.REMOVED,
                user_id=user_id,
            )
            await session.commit()

            remove_job(job_id)
            logger.info(f"Job deleted: {job_id}")
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete job {job_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.JOB_DELETE_ERROR,
            ) from e

    async def pause_job_by_id(
        self, job_id: str, session: AsyncSession, user_id: str | None = None
    ) -> None:
        """
        Pause a job.

        Args:
            job_id: Job ID
            session: Database session
            user_id: User ID who performed the action

        Raises:
            AppException: If job not found
        """
        try:
            job = get_job(job_id)
            if not job:
                raise AppException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=ErrorMessages.JOB_NOT_FOUND,
                )
            pause_job(job_id)

            # Save history
            await self._save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.PAUSED,
                user_id=user_id,
            )
            await session.commit()

            logger.info(f"Job paused: {job_id}")
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to pause job {job_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e

    async def resume_job_by_id(
        self, job_id: str, session: AsyncSession, user_id: str | None = None
    ) -> None:
        """
        Resume a paused job.

        Args:
            job_id: Job ID
            session: Database session
            user_id: User ID who performed the action

        Raises:
            AppException: If job not found
        """
        try:
            job = get_job(job_id)
            if not job:
                raise AppException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=ErrorMessages.JOB_NOT_FOUND,
                )
            resume_job(job_id)

            # Save history
            await self._save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.RESUMED,
                user_id=user_id,
            )
            await session.commit()

            logger.info(f"Job resumed: {job_id}")
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Failed to resume job {job_id}: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e

    async def list_job_history(
        self,
        session: AsyncSession,
        job_id: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[JobHistoryResponse], int]:
        """
        List job history with pagination.

        Args:
            session: Database session
            job_id: Optional job ID to filter by
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (history list, total count)
        """
        try:
            query = select(JobHistory)

            if job_id:
                query = query.where(JobHistory.job_id == job_id)

            # Order by created_at descending (newest first)
            query = query.order_by(JobHistory.created_at.desc())

            # Get total count
            count_query = select(func.count(JobHistory.id))
            if job_id:
                count_query = count_query.where(JobHistory.job_id == job_id)
            total_result = await session.execute(count_query)
            total = total_result.scalar() or 0

            # Paginate
            offset = (page - 1) * page_size
            query = query.offset(offset).limit(page_size)

            result = await session.execute(query)
            history_records = result.scalars().all()

            history_responses = [
                JobHistoryResponse(
                    id=str(record.id),
                    job_id=record.job_id,
                    function=record.function,
                    func_ref=record.func_ref,
                    trigger=record.trigger,
                    trigger_type=record.trigger_type,
                    status=record.status.value,
                    args=record.args,
                    kwargs=record.kwargs,
                    next_run_time=record.next_run_time,
                    error_message=record.error_message,
                    user_id=record.user_id,
                    created_at=record.created_at,
                )
                for record in history_records
            ]

        except Exception as e:
            logger.error(f"Failed to list job history: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e
        else:
            return history_responses, total

    def _job_to_response(self, job: Any) -> JobResponse:
        """
        Convert APScheduler job object to JobResponse.

        Args:
            job: APScheduler job object

        Returns:
            JobResponse
        """
        # Note: APScheduler doesn't expose paused state directly.
        # A job is considered paused if it exists but has no next_run_time.
        # This is a heuristic and may not be 100% accurate.
        is_paused = job.next_run_time is None and not job.pending

        return JobResponse(
            id=job.id,
            name=job.name,
            func_ref=str(job.func_ref),
            trigger=str(job.trigger),
            next_run_time=job.next_run_time,
            pending=job.pending,
            paused=is_paused,
        )
