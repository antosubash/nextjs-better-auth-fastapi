"""Event handlers for job execution events."""

import asyncio
import logging
import traceback
from typing import Any

from apscheduler.events import JobExecutionEvent
from sqlalchemy import select, text

from core.config import DB_SCHEMA
from core.constants import JobTriggerTypes
from core.database import AsyncSessionLocal
from core.job_operations import get_job, list_all_jobs_from_store, remove_job
from models.job_history import JobHistory, JobHistoryStatus
from services.job_history_service import JobHistoryParams, JobHistoryService
from utils.job_log_storage import clear_job_logs, get_logs_with_retry
from utils.job_utils import MinimalJob, MinimalJobParams, detect_trigger_type

logger = logging.getLogger(__name__)

# Store background tasks to prevent garbage collection
_background_tasks: set[asyncio.Task[Any]] = set()


def _run_async(coro: Any) -> None:
    """
    Run an async coroutine in a new event loop.

    Args:
        coro: Coroutine to run
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is already running, schedule the coroutine (fire-and-forget)
            # Store reference to prevent garbage collection
            task = asyncio.create_task(coro)
            _background_tasks.add(task)
            task.add_done_callback(_background_tasks.discard)
        else:
            loop.run_until_complete(coro)
    except RuntimeError:
        # No event loop running, create a new one
        asyncio.run(coro)


async def _get_job_or_minimal(job_id: str) -> Any:
    """
    Get job from scheduler or create minimal job from history.

    Args:
        job_id: Job ID

    Returns:
        Job object or MinimalJob
    """
    job = get_job(job_id)

    # If job not found (e.g., one-time jobs removed before execution),
    # retrieve job info from the most recent job history record
    if not job:
        # Try to get job info from most recent history record
        async with AsyncSessionLocal() as temp_session:
            try:
                await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                stmt = (
                    select(JobHistory)
                    .where(JobHistory.job_id == job_id)
                    .order_by(JobHistory.created_at.desc())
                    .limit(1)
                )
                result = await temp_session.execute(stmt)
                history_record = result.scalar_one_or_none()
                job = MinimalJob(job_id, params=MinimalJobParams(history_record=history_record))
                if history_record:
                    logger.debug(
                        f"Using job info from history for {job_id} (job removed from scheduler)"
                    )
                else:
                    logger.warning(f"No history found for {job_id}, using minimal job object")
            except Exception as e:
                logger.warning(
                    f"Could not retrieve job history for {job_id}: {e!s}, using minimal job object"
                )
                job = MinimalJob(job_id, params=MinimalJobParams(history_record=None))

    return job


async def _get_trigger_type(job: Any, job_id: str) -> str:
    """
    Get trigger type from job or history.

    Args:
        job: Job object
        job_id: Job ID

    Returns:
        Trigger type string
    """
    # Determine trigger type from job
    if hasattr(job, "trigger"):
        return detect_trigger_type(job.trigger)

    # If trigger_type not determined, try to get from history
    async with AsyncSessionLocal() as temp_session:
        try:
            await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
            stmt = (
                select(JobHistory)
                .where(JobHistory.job_id == job_id)
                .order_by(JobHistory.created_at.desc())
                .limit(1)
            )
            result = await temp_session.execute(stmt)
            history_record = result.scalar_one_or_none()
            if history_record and history_record.trigger_type:
                return history_record.trigger_type
        except Exception:
            pass  # Ignore errors, use default

    # Default to "once" if still not determined
    return JobTriggerTypes.ONCE


async def _remove_one_time_job(job_id: str) -> None:
    """
    Remove one-time job from scheduler after completion/failure.

    Args:
        job_id: Job ID
    """
    try:
        # Check if job still exists in scheduler
        existing_job = get_job(job_id)
        if existing_job:
            remove_job(job_id)
            logger.debug(f"Removed one-time job {job_id} from scheduler after completion")
        else:
            # Also check database store and remove if present
            all_jobs = list_all_jobs_from_store()
            job_ids_in_store = {job_data["id"] for job_data in all_jobs}
            if job_id in job_ids_in_store:
                # Try to remove from scheduler (may already be removed)
                try:
                    remove_job(job_id)
                    logger.debug(f"Removed one-time job {job_id} from store after completion")
                except Exception:
                    # Job may have already been removed, which is fine
                    logger.debug(f"One-time job {job_id} already removed from scheduler")
    except Exception as e:
        logger.warning(
            f"Could not remove one-time job {job_id} after completion: {e!s}",
            exc_info=True,
        )


async def _job_executed_listener_async(event: JobExecutionEvent) -> None:
    """
    Async listener for job execution completion.

    Args:
        event: Job execution event
    """
    try:
        job = await _get_job_or_minimal(event.job_id)

        # Get logs with retry logic
        logs = await get_logs_with_retry(event.job_id)
        if logs is None:
            logger.warning(
                f"Logs not available for completed job {event.job_id}, saving history without logs"
            )

        # Determine trigger type
        trigger_type = await _get_trigger_type(job, event.job_id)

        # Save job history
        async with AsyncSessionLocal() as session:
            try:
                # Ensure search_path is set for this session
                await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                history_service = JobHistoryService()
                await history_service.save_job_history(
                    session=session,
                    job=job,
                    status=JobHistoryStatus.COMPLETED,
                    params=JobHistoryParams(logs=logs, trigger_type=trigger_type),
                )
                await session.commit()

                # Clean up logs after successful save
                if logs is not None:
                    clear_job_logs(event.job_id)
            except Exception as e:
                logger.error(
                    f"Failed to save job history for {event.job_id}: {e!s}",
                    exc_info=True,
                )
                await session.rollback()

        # Remove one-time jobs from scheduler after completion
        if trigger_type == JobTriggerTypes.ONCE:
            await _remove_one_time_job(event.job_id)
    except Exception as e:
        logger.error(
            f"Error in job_executed_listener for {event.job_id}: {e!s}",
            exc_info=True,
        )


def job_executed_listener(event: JobExecutionEvent) -> None:
    """
    Synchronous listener wrapper for job execution completion.

    Args:
        event: Job execution event
    """
    _run_async(_job_executed_listener_async(event))


async def _job_error_listener_async(event: JobExecutionEvent) -> None:
    """
    Listener for job execution errors.

    Args:
        event: Job execution event
    """
    try:
        job = await _get_job_or_minimal(event.job_id)

        # Get logs with retry logic
        logs = await get_logs_with_retry(event.job_id)
        if logs is None:
            logger.warning(
                f"Logs not available for failed job {event.job_id}, saving history without logs"
            )

        # Extract error message
        error_message = None
        if event.exception:
            error_message = (
                f"{type(event.exception).__name__}: {event.exception!s}\n{traceback.format_exc()}"
            )

        # Determine trigger type
        trigger_type = await _get_trigger_type(job, event.job_id)

        # Save job history
        async with AsyncSessionLocal() as session:
            try:
                # Ensure search_path is set for this session
                await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                history_service = JobHistoryService()
                await history_service.save_job_history(
                    session=session,
                    job=job,
                    status=JobHistoryStatus.FAILED,
                    params=JobHistoryParams(
                        error_message=error_message, logs=logs, trigger_type=trigger_type
                    ),
                )
                await session.commit()

                # Clean up logs after successful save
                if logs is not None:
                    clear_job_logs(event.job_id)
            except Exception as e:
                logger.error(
                    f"Failed to save job history for {event.job_id}: {e!s}",
                    exc_info=True,
                )
                await session.rollback()

        # Remove one-time jobs from scheduler after failure
        if trigger_type == JobTriggerTypes.ONCE:
            await _remove_one_time_job(event.job_id)
    except Exception as e:
        logger.error(
            f"Error in job_error_listener for {event.job_id}: {e!s}",
            exc_info=True,
        )


def job_error_listener(event: JobExecutionEvent) -> None:
    """
    Synchronous listener wrapper for job execution errors.

    Args:
        event: Job execution event
    """
    _run_async(_job_error_listener_async(event))
