"""APScheduler event listeners for capturing job execution logs and errors."""

import asyncio
import io
import logging
import traceback
from contextlib import redirect_stderr, redirect_stdout
from typing import Any

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED, JobExecutionEvent
from sqlalchemy import text

from core.config import DB_SCHEMA
from core.database import AsyncSessionLocal
from models.job_history import JobHistoryStatus

# Retry settings for log retrieval
LOG_RETRY_MAX_ATTEMPTS = 3
LOG_RETRY_DELAY_SECONDS = 0.1

logger = logging.getLogger(__name__)

# Store logs for each job execution
_job_logs: dict[str, str] = {}

# Store background tasks to prevent garbage collection
_background_tasks: set[asyncio.Task[Any]] = set()


class LogCapture:
    """Context manager to capture stdout and stderr."""

    def __init__(self) -> None:
        """Initialize log capture."""
        self.stdout_buffer = io.StringIO()
        self.stderr_buffer = io.StringIO()
        self.log_buffer = io.StringIO()

    def __enter__(self) -> "LogCapture":
        """Enter context manager."""
        # Capture stdout and stderr
        self.stdout_context = redirect_stdout(self.stdout_buffer)
        self.stderr_context = redirect_stderr(self.stderr_buffer)
        self.stdout_context.__enter__()
        self.stderr_context.__enter__()

        # Also capture logging output
        self.log_handler = logging.StreamHandler(self.log_buffer)
        self.log_handler.setLevel(logging.DEBUG)
        root_logger = logging.getLogger()
        root_logger.addHandler(self.log_handler)

        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Exit context manager."""
        self.stdout_context.__exit__(None, None, None)
        self.stderr_context.__exit__(None, None, None)
        root_logger = logging.getLogger()
        root_logger.removeHandler(self.log_handler)

    def get_logs(self) -> str:
        """
        Get captured logs.

        Returns:
            Combined logs from stdout, stderr, and logging
        """
        logs = []
        stdout_content = self.stdout_buffer.getvalue()
        stderr_content = self.stderr_buffer.getvalue()
        log_content = self.log_buffer.getvalue()

        if stdout_content:
            logs.append(f"STDOUT:\n{stdout_content}")
        if stderr_content:
            logs.append(f"STDERR:\n{stderr_content}")
        if log_content:
            logs.append(f"LOGS:\n{log_content}")

        return "\n\n".join(logs) if logs else ""


def store_job_logs(job_id: str, logs: str) -> None:
    """
    Store logs for a job execution.

    Args:
        job_id: Job ID
        logs: Log content
    """
    _job_logs[job_id] = logs


def get_job_logs(job_id: str) -> str | None:
    """
    Get stored logs for a job execution without removing them.

    Args:
        job_id: Job ID

    Returns:
        Log content or None
    """
    return _job_logs.get(job_id)


def clear_job_logs(job_id: str) -> None:
    """
    Remove logs for a job execution after successful save.

    Args:
        job_id: Job ID
    """
    _job_logs.pop(job_id, None)


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


async def _get_logs_with_retry(job_id: str) -> str | None:
    """
    Get job logs with retry logic to handle timing issues.

    Args:
        job_id: Job ID

    Returns:
        Log content or None if not found after retries
    """
    logs = get_job_logs(job_id)
    if logs is not None:
        return logs

    # Retry with small delay if logs are not immediately available
    for attempt in range(LOG_RETRY_MAX_ATTEMPTS):
        await asyncio.sleep(LOG_RETRY_DELAY_SECONDS)
        logs = get_job_logs(job_id)
        if logs is not None:
            logger.debug(f"Retrieved logs for job {job_id} after {attempt + 1} retry attempts")
            return logs

    logger.warning(f"Logs not found for job {job_id} after {LOG_RETRY_MAX_ATTEMPTS} retry attempts")
    return None


async def _job_executed_listener_async(event: JobExecutionEvent) -> None:
    """
    Async listener for job execution completion.

    Args:
        event: Job execution event
    """
    try:
        from core.jobs import get_job  # noqa: PLC0415
        from services.job_service import JobService  # noqa: PLC0415

        job = get_job(event.job_id)

        # If job not found (e.g., one-time jobs removed before execution),
        # retrieve job info from the most recent job history record
        if not job:
            # Create a minimal job object with info from job history
            class MinimalJob:
                def __init__(self, job_id: str, history_record: Any | None = None):
                    self.id = job_id
                    if history_record:
                        self.func_ref = history_record.func_ref
                        self.args = (
                            history_record.args.get("args", ()) if history_record.args else ()
                        )
                        self.kwargs = history_record.kwargs or {}
                        self.trigger = history_record.trigger
                        self.next_run_time = None
                    else:
                        # Fallback if no history found
                        self.func_ref = f"unknown:{job_id}"
                        self.args = ()
                        self.kwargs = {}
                        self.trigger = "date[one-time]"
                        self.next_run_time = None

            # Try to get job info from most recent history record
            from sqlalchemy import select  # noqa: PLC0415

            from models.job_history import JobHistory  # noqa: PLC0415

            async with AsyncSessionLocal() as temp_session:
                try:
                    await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                    stmt = (
                        select(JobHistory)
                        .where(JobHistory.job_id == event.job_id)
                        .order_by(JobHistory.created_at.desc())
                        .limit(1)
                    )
                    result = await temp_session.execute(stmt)
                    history_record = result.scalar_one_or_none()
                    job = MinimalJob(event.job_id, history_record)
                    if history_record:
                        logger.debug(
                            f"Using job info from history for {event.job_id} (job removed from scheduler)"
                        )
                    else:
                        logger.warning(
                            f"No history found for {event.job_id}, using minimal job object"
                        )
                except Exception as e:
                    logger.warning(
                        f"Could not retrieve job history for {event.job_id}: {e!s}, using minimal job object"
                    )
                    job = MinimalJob(event.job_id, None)

        # Get logs with retry logic
        logs = await _get_logs_with_retry(event.job_id)
        if logs is None:
            logger.warning(
                f"Logs not available for completed job {event.job_id}, saving history without logs"
            )

        # Determine trigger type from job or history
        trigger_type = None
        if hasattr(job, "trigger"):
            trigger_str = str(job.trigger).lower()
            if "cron" in trigger_str:
                trigger_type = "cron"
            elif "interval" in trigger_str:
                trigger_type = "interval"
            elif "date" in trigger_str:
                trigger_type = "once"
        # If trigger_type not determined, try to get from history
        if not trigger_type:
            from sqlalchemy import select  # noqa: PLC0415

            from models.job_history import JobHistory  # noqa: PLC0415

            async with AsyncSessionLocal() as temp_session:
                try:
                    await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                    stmt = (
                        select(JobHistory)
                        .where(JobHistory.job_id == event.job_id)
                        .order_by(JobHistory.created_at.desc())
                        .limit(1)
                    )
                    result = await temp_session.execute(stmt)
                    history_record = result.scalar_one_or_none()
                    if history_record and history_record.trigger_type:
                        trigger_type = history_record.trigger_type
                except Exception:
                    pass  # Ignore errors, use default

        # Default to "once" if still not determined
        if not trigger_type:
            trigger_type = "once"

        # Save job history
        async with AsyncSessionLocal() as session:
            try:
                # Ensure search_path is set for this session
                await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                job_service = JobService()
                await job_service._save_job_history(
                    session=session,
                    job=job,
                    status=JobHistoryStatus.COMPLETED,
                    logs=logs,
                    trigger_type=trigger_type,
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
        if trigger_type == "once":
            try:
                from core.jobs import get_job, remove_job  # noqa: PLC0415

                # Check if job still exists in scheduler
                existing_job = get_job(event.job_id)
                if existing_job:
                    remove_job(event.job_id)
                    logger.debug(
                        f"Removed one-time job {event.job_id} from scheduler after completion"
                    )
                else:
                    # Also check database store and remove if present
                    from core.jobs import list_all_jobs_from_store  # noqa: PLC0415

                    all_jobs = list_all_jobs_from_store()
                    job_ids_in_store = {job_data["id"] for job_data in all_jobs}
                    if event.job_id in job_ids_in_store:
                        # Try to remove from scheduler (may already be removed)
                        try:
                            remove_job(event.job_id)
                            logger.debug(
                                f"Removed one-time job {event.job_id} from store after completion"
                            )
                        except Exception:
                            # Job may have already been removed, which is fine
                            logger.debug(
                                f"One-time job {event.job_id} already removed from scheduler"
                            )
            except Exception as e:
                logger.warning(
                    f"Could not remove one-time job {event.job_id} after completion: {e!s}",
                    exc_info=True,
                )
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
        from core.jobs import get_job  # noqa: PLC0415
        from services.job_service import JobService  # noqa: PLC0415

        job = get_job(event.job_id)

        # If job not found (e.g., one-time jobs removed before execution),
        # retrieve job info from the most recent job history record
        if not job:
            # Create a minimal job object with info from job history
            class MinimalJob:
                def __init__(self, job_id: str, history_record: Any | None = None):
                    self.id = job_id
                    if history_record:
                        self.func_ref = history_record.func_ref
                        self.args = (
                            history_record.args.get("args", ()) if history_record.args else ()
                        )
                        self.kwargs = history_record.kwargs or {}
                        self.trigger = history_record.trigger
                        self.next_run_time = None
                    else:
                        # Fallback if no history found
                        self.func_ref = f"unknown:{job_id}"
                        self.args = ()
                        self.kwargs = {}
                        self.trigger = "date[one-time]"
                        self.next_run_time = None

            # Try to get job info from most recent history record
            from sqlalchemy import select  # noqa: PLC0415

            from models.job_history import JobHistory  # noqa: PLC0415

            async with AsyncSessionLocal() as temp_session:
                try:
                    await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                    stmt = (
                        select(JobHistory)
                        .where(JobHistory.job_id == event.job_id)
                        .order_by(JobHistory.created_at.desc())
                        .limit(1)
                    )
                    result = await temp_session.execute(stmt)
                    history_record = result.scalar_one_or_none()
                    job = MinimalJob(event.job_id, history_record)
                    if history_record:
                        logger.debug(
                            f"Using job info from history for {event.job_id} (job removed from scheduler)"
                        )
                    else:
                        logger.warning(
                            f"No history found for {event.job_id}, using minimal job object"
                        )
                except Exception as e:
                    logger.warning(
                        f"Could not retrieve job history for {event.job_id}: {e!s}, using minimal job object"
                    )
                    job = MinimalJob(event.job_id, None)

        # Get logs with retry logic
        logs = await _get_logs_with_retry(event.job_id)
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

        # Determine trigger type from job or history
        trigger_type = None
        if hasattr(job, "trigger"):
            trigger_str = str(job.trigger).lower()
            if "cron" in trigger_str:
                trigger_type = "cron"
            elif "interval" in trigger_str:
                trigger_type = "interval"
            elif "date" in trigger_str:
                trigger_type = "once"
        # If trigger_type not determined, try to get from history
        if not trigger_type:
            from sqlalchemy import select  # noqa: PLC0415

            from models.job_history import JobHistory  # noqa: PLC0415

            async with AsyncSessionLocal() as temp_session:
                try:
                    await temp_session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                    stmt = (
                        select(JobHistory)
                        .where(JobHistory.job_id == event.job_id)
                        .order_by(JobHistory.created_at.desc())
                        .limit(1)
                    )
                    result = await temp_session.execute(stmt)
                    history_record = result.scalar_one_or_none()
                    if history_record and history_record.trigger_type:
                        trigger_type = history_record.trigger_type
                except Exception:
                    pass  # Ignore errors, use default

        # Default to "once" if still not determined
        if not trigger_type:
            trigger_type = "once"

        # Save job history
        async with AsyncSessionLocal() as session:
            try:
                # Ensure search_path is set for this session
                await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                job_service = JobService()
                await job_service._save_job_history(
                    session=session,
                    job=job,
                    status=JobHistoryStatus.FAILED,
                    error_message=error_message,
                    logs=logs,
                    trigger_type=trigger_type,
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
        if trigger_type == "once":
            try:
                from core.jobs import get_job, remove_job  # noqa: PLC0415

                # Check if job still exists in scheduler
                existing_job = get_job(event.job_id)
                if existing_job:
                    remove_job(event.job_id)
                    logger.debug(
                        f"Removed one-time job {event.job_id} from scheduler after failure"
                    )
                else:
                    # Also check database store and remove if present
                    from core.jobs import list_all_jobs_from_store  # noqa: PLC0415

                    all_jobs = list_all_jobs_from_store()
                    job_ids_in_store = {job_data["id"] for job_data in all_jobs}
                    if event.job_id in job_ids_in_store:
                        # Try to remove from scheduler (may already be removed)
                        try:
                            remove_job(event.job_id)
                            logger.debug(
                                f"Removed one-time job {event.job_id} from store after failure"
                            )
                        except Exception:
                            # Job may have already been removed, which is fine
                            logger.debug(
                                f"One-time job {event.job_id} already removed from scheduler"
                            )
            except Exception as e:
                logger.warning(
                    f"Could not remove one-time job {event.job_id} after failure: {e!s}",
                    exc_info=True,
                )
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


def setup_job_listeners(scheduler: Any) -> None:
    """
    Setup event listeners for job execution.

    Args:
        scheduler: APScheduler instance
    """
    scheduler.add_listener(job_executed_listener, EVENT_JOB_EXECUTED)
    scheduler.add_listener(job_error_listener, EVENT_JOB_ERROR)
    logger.info("Job execution listeners configured")
