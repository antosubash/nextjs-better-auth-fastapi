"""Job service for job management operations."""

import logging
from typing import Any

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import ErrorMessages, JobTriggerTypes
from core.exceptions import AppException
from core.job_operations import (
    IntervalParams,
    JobFunctionArgs,
)
from core.jobs import (
    add_interval_job,
    add_one_time_job,
    add_scheduled_job,
    get_job,
    list_all_jobs_from_store,
    list_jobs,
    pause_job,
    remove_job,
    resume_job,
)
from models.job_history import JobHistoryStatus
from schemas.job import JobCreate, JobHistoryResponse, JobResponse
from services.job_history_service import JobHistoryParams, JobHistoryService

logger = logging.getLogger(__name__)


class JobService:
    """Service for job management operations."""

    def __init__(self) -> None:
        """Initialize job service with history service."""
        self._history_service = JobHistoryService()

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
            # Get function reference - use the provided function name directly
            # If it's already a module:function format, use it; otherwise it's a registered name
            func_ref = job_data.function

            # Convert args and kwargs
            args_tuple = tuple(job_data.args) if job_data.args else ()
            kwargs_dict = job_data.kwargs or {}

            # Create job based on trigger type
            if job_data.trigger_type == JobTriggerTypes.CRON:
                if not job_data.cron_expression:
                    raise AppException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=ErrorMessages.JOB_INVALID_SCHEDULE,
                    )
                add_scheduled_job(
                    func_ref=func_ref,
                    job_id=job_data.job_id,
                    trigger=job_data.cron_expression,
                    function_args=JobFunctionArgs(args=args_tuple, kwargs=kwargs_dict),
                    replace_existing=job_data.replace_existing,
                )
            elif job_data.trigger_type == JobTriggerTypes.INTERVAL:
                add_interval_job(
                    func_ref=func_ref,
                    job_id=job_data.job_id,
                    interval_params=IntervalParams(
                        weeks=job_data.weeks,
                        days=job_data.days,
                        hours=job_data.hours,
                        minutes=job_data.minutes,
                        seconds=job_data.seconds,
                        start_date=job_data.start_date,
                        end_date=job_data.end_date,
                    ),
                    function_args=JobFunctionArgs(args=args_tuple, kwargs=kwargs_dict),
                    replace_existing=job_data.replace_existing,
                )
            elif job_data.trigger_type == JobTriggerTypes.ONCE:
                add_one_time_job(
                    func_ref=func_ref,
                    job_id=job_data.job_id,
                    run_date=job_data.run_date,
                    function_args=JobFunctionArgs(args=args_tuple, kwargs=kwargs_dict),
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
            await self._history_service.save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.CREATED,
                params=JobHistoryParams(user_id=user_id, trigger_type=job_data.trigger_type),
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

        This method retrieves jobs from APScheduler's get_jobs() method.
        If jobs seem to be missing, it also queries the database directly
        to ensure all jobs are visible.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (jobs list, total count)
        """
        try:
            # Get jobs from APScheduler
            all_jobs = list_jobs()
            scheduler_job_ids = {job.id for job in all_jobs}

            # Also query the database directly to see if there are more jobs
            db_jobs = list_all_jobs_from_store()
            db_job_ids = {job["id"] for job in db_jobs}

            # Log comparison for debugging
            if db_job_ids != scheduler_job_ids:
                missing_in_scheduler = db_job_ids - scheduler_job_ids
                if missing_in_scheduler:
                    logger.warning(
                        f"Found {len(missing_in_scheduler)} jobs in database "
                        f"but not in scheduler: {missing_in_scheduler}"
                    )
                    # Try to get these jobs individually - they might be paused or in error state
                    for job_id in missing_in_scheduler:
                        try:
                            job = get_job(job_id)
                            if job:
                                all_jobs.append(job)
                                logger.info(f"Retrieved missing job {job_id} directly")
                        except Exception as e:
                            logger.debug(f"Could not retrieve job {job_id}: {e!s}")

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
            await self._history_service.save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.REMOVED,
                params=JobHistoryParams(user_id=user_id),
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
            await self._history_service.save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.PAUSED,
                params=JobHistoryParams(user_id=user_id),
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
            await self._history_service.save_job_history(
                session=session,
                job=job,
                status=JobHistoryStatus.RESUMED,
                params=JobHistoryParams(user_id=user_id),
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

        Raises:
            AppException: If listing fails
        """
        try:
            return await self._history_service.list_job_history(
                session=session, job_id=job_id, page=page, page_size=page_size
            )
        except Exception as e:
            logger.error(f"Failed to list job history: {e!s}", exc_info=True)
            raise AppException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorMessages.INTERNAL_SERVER_ERROR,
            ) from e

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
