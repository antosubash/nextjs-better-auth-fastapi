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
    Get stored logs for a job execution.

    Args:
        job_id: Job ID

    Returns:
        Log content or None
    """
    return _job_logs.pop(job_id, None)


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
        if not job:
            return

        # Get logs if available
        logs = get_job_logs(event.job_id)

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
                )
                await session.commit()
            except Exception as e:
                logger.error(
                    f"Failed to save job history for {event.job_id}: {e!s}",
                    exc_info=True,
                )
                await session.rollback()
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
        if not job:
            return

        # Get logs if available
        logs = get_job_logs(event.job_id)

        # Extract error message
        error_message = None
        if event.exception:
            error_message = f"{type(event.exception).__name__}: {event.exception!s}\n{traceback.format_exc()}"

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
                )
                await session.commit()
            except Exception as e:
                logger.error(
                    f"Failed to save job history for {event.job_id}: {e!s}",
                    exc_info=True,
                )
                await session.rollback()
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
