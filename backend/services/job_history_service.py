"""Service for managing job history records."""

import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.job_history import JobHistory, JobHistoryStatus
from schemas.job import JobHistoryResponse
from utils.job_utils import detect_trigger_type

logger = logging.getLogger(__name__)


class JobHistoryService:
    """Service for job history management operations."""

    async def save_job_history(
        self,
        session: AsyncSession,
        job: Any,
        status: JobHistoryStatus,
        user_id: str | None = None,
        error_message: str | None = None,
        logs: str | None = None,
        trigger_type: str | None = None,
    ) -> None:
        """
        Save job history record.

        Args:
            session: Database session
            job: APScheduler job object or MinimalJob
            status: Job history status
            user_id: User ID who performed the action
            error_message: Error message if job failed
            logs: Job execution logs
            trigger_type: Trigger type (cron, interval, once)
        """
        try:
            # Validate status is provided
            if status is None:
                logger.error(f"Cannot save job history for {job.id}: status is None")
                return

            # Validate job object has required attributes
            if not hasattr(job, "id"):
                logger.error("Job object missing 'id' attribute")
                return

            # Extract function name from func_ref
            func_ref_str = str(job.func_ref)
            function_name = func_ref_str.split(":")[-1] if ":" in func_ref_str else func_ref_str

            # Determine trigger type from trigger string if not provided
            if not trigger_type:
                trigger_type = detect_trigger_type(job.trigger)

            # Convert args and kwargs to dict format
            args_dict = None
            kwargs_dict = None
            if hasattr(job, "args") and job.args:
                args_dict = {"args": list(job.args)}
            if hasattr(job, "kwargs") and job.kwargs:
                kwargs_dict = job.kwargs

            # Normalize logs: convert empty string to None for consistency
            normalized_logs = logs if logs else None

            # Validate error_message is set for FAILED status
            if status == JobHistoryStatus.FAILED and not error_message:
                logger.warning(f"Job {job.id} marked as FAILED but no error_message provided")

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
                logs=normalized_logs,
                user_id=user_id,
            )
            session.add(history)
            logger.debug(
                f"Job history saved: {job.id} - {status.value} "
                f"(logs: {'present' if normalized_logs else 'none'})"
            )
        except Exception as e:
            # Don't fail the main operation if history saving fails
            logger.error(
                f"Failed to save job history for {getattr(job, 'id', 'unknown')}: {e!s}",
                exc_info=True,
            )

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
                    logs=record.logs,
                    user_id=record.user_id,
                    created_at=record.created_at,
                )
                for record in history_records
            ]

        except Exception as e:
            logger.error(f"Failed to list job history: {e!s}", exc_info=True)
            raise
        else:
            return history_responses, total
