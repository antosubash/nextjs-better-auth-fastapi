"""Job wrapper utility to capture logs and errors."""

import asyncio
from collections.abc import Callable
from functools import partial
import importlib
import logging
from typing import Any

from sqlalchemy import text

from core.config import DB_SCHEMA
from core.constants import JobTriggerTypes
from core.database import AsyncSessionLocal
from models.job_history import JobHistoryStatus
from services.job_history_service import JobHistoryService
from utils.job_log_storage import store_job_logs
from utils.job_utils import LogCapture

logger = logging.getLogger(__name__)


def create_job_wrapper(
    job_id: str,
    original_func: Callable[..., Any],
) -> Callable[..., Any]:
    """
    Create a wrapped job function that captures logs and stores them for listeners.

    Args:
        job_id: Job ID
        original_func: Original job function to wrap

    Returns:
        Wrapped function
    """
    # Check if original function is async
    is_async = asyncio.iscoroutinefunction(original_func)

    if is_async:

        async def wrapped_func(*args: Any, **kwargs: Any) -> Any:
            """
            Wrapped async job function that captures logs and errors.

            Args:
                *args: Positional arguments
                **kwargs: Keyword arguments

            Returns:
                Function result
            """
            # Capture logs
            with LogCapture() as log_capture:
                try:
                    # Execute the original function
                    result = await original_func(*args, **kwargs)
                except Exception as e:
                    logger.error(f"Job {job_id} failed: {e!s}", exc_info=True)
                    raise
                finally:
                    # Always capture and store logs (even if empty)
                    logs = log_capture.get_logs()
                    store_job_logs(job_id, logs)

            return result

    else:

        async def wrapped_func(*args: Any, **kwargs: Any) -> Any:
            """
            Wrapped sync job function that captures logs and errors.

            Args:
                *args: Positional arguments
                **kwargs: Keyword arguments

            Returns:
                Function result
            """
            # Capture logs
            with LogCapture() as log_capture:
                try:
                    # Execute the original sync function in executor
                    loop = asyncio.get_event_loop()
                    # Use functools.partial to properly capture args/kwargs
                    result = await loop.run_in_executor(
                        None, partial(original_func, *args, **kwargs)
                    )
                except Exception as e:
                    logger.error(f"Job {job_id} failed: {e!s}", exc_info=True)
                    raise
                finally:
                    # Always capture and store logs (even if empty)
                    logs = log_capture.get_logs()
                    store_job_logs(job_id, logs)

            return result

    # Preserve function metadata
    wrapped_func.__name__ = original_func.__name__
    wrapped_func.__doc__ = original_func.__doc__
    wrapped_func.__module__ = original_func.__module__

    return wrapped_func


def _import_job_function(func_ref: str) -> Callable[..., Any]:
    """Import job function from module or registry."""
    if ":" in func_ref:
        module_path, func_name = func_ref.rsplit(":", 1)
        module = importlib.import_module(module_path)
        original_func = getattr(module, func_name)
    else:
        # Try to get from registered functions
        from utils.job_registry import get_job_function  # noqa: PLC0415

        original_func = get_job_function(func_ref)

    if not callable(original_func):
        msg = f"Function reference {func_ref} is not callable"
        raise TypeError(msg)

    return original_func


async def _verify_job_in_store(job_id: str) -> None:
    """Verify job exists in job store before execution."""
    try:
        from core.job_operations import get_job, list_all_jobs_from_store  # noqa: PLC0415

        job = get_job(job_id)

        if not job:
            # Check if job exists in database store directly
            all_jobs = list_all_jobs_from_store()
            job_ids_in_store = {job_data["id"] for job_data in all_jobs}

            if job_id not in job_ids_in_store:
                # Check job history to see if this is a one-time job
                # One-time jobs are expected to be removed from store before execution
                from sqlalchemy import select  # noqa: PLC0415

                from models.job_history import JobHistory  # noqa: PLC0415

                async with AsyncSessionLocal() as session:
                    try:
                        await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                        stmt = (
                            select(JobHistory)
                            .where(JobHistory.job_id == job_id)
                            .order_by(JobHistory.created_at.desc())
                            .limit(1)
                        )
                        result = await session.execute(stmt)
                        history_record = result.scalar_one_or_none()

                        if history_record and history_record.trigger_type == JobTriggerTypes.ONCE:
                            # One-time jobs are removed from store before execution - this is normal
                            logger.debug(
                                f"Job {job_id} is a one-time job removed from store before execution "
                                f"(normal APScheduler behavior)"
                            )
                        else:
                            # For recurring jobs (cron/interval), they should remain in store
                            logger.warning(
                                f"Job {job_id} not found in job store before execution. "
                                f"This may indicate a persistence issue for long-running tasks."
                            )
                    except Exception as e:
                        logger.debug(
                            f"Could not check job history for {job_id}: {e!s}. "
                            f"Assuming normal behavior."
                        )
            else:
                logger.debug(
                    f"Job {job_id} found in job store but not in scheduler "
                    f"(may have been removed but still in store)"
                )
        else:
            logger.debug(f"Job {job_id} verified in job store before execution")
    except Exception as e:
        logger.warning(
            f"Could not verify job {job_id} in store before execution: {e!s}",
            exc_info=True,
        )


async def _mark_job_running(
    job_id: str, func_ref: str, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> None:
    """Mark job as RUNNING in history."""
    try:
        from core.job_operations import get_job  # noqa: PLC0415
        from services.job_history_service import JobHistoryParams  # noqa: PLC0415

        job = get_job(job_id)

        # If job not found (e.g., one-time jobs removed before execution),
        # create a minimal job-like object from available info
        if not job:
            from utils.job_utils import MinimalJob, MinimalJobParams  # noqa: PLC0415

            job = MinimalJob(
                job_id=job_id,
                params=MinimalJobParams(
                    func_ref=func_ref,
                    args=args,
                    kwargs=kwargs,
                    trigger="date[one-time]",
                ),
            )
            logger.debug(f"Using minimal job object for {job_id} (job removed from scheduler)")

        async with AsyncSessionLocal() as session:
            try:
                await session.execute(text(f'SET search_path TO "{DB_SCHEMA}"'))
                history_service = JobHistoryService()
                await history_service.save_job_history(
                    session=session,
                    job=job,
                    status=JobHistoryStatus.RUNNING,
                    params=JobHistoryParams(trigger_type=JobTriggerTypes.ONCE),
                )
                await session.commit()
                logger.debug(f"Job {job_id} marked as RUNNING")
            except Exception as e:
                logger.error(
                    f"Failed to mark job {job_id} as RUNNING: {e!s}",
                    exc_info=True,
                )
                await session.rollback()
    except Exception as e:
        logger.error(
            f"Error marking job {job_id} as RUNNING: {e!s}",
            exc_info=True,
        )


def _run_async_task(coro: Any) -> None:
    """Run async task in background if event loop is running."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            task = asyncio.create_task(coro)
            # Store reference to prevent garbage collection
            _ = task
        else:
            asyncio.run(coro)
    except Exception as e:
        logger.warning(f"Could not run async task: {e!s}")


async def execute_job_with_logging(
    job_id: str,
    func_ref: str,
    *args: Any,
    **kwargs: Any,
) -> Any:
    """
    Async serializable wrapper function that executes a job function with logging.

    This function can be serialized by APScheduler because it's a top-level function.
    It imports and executes the original function, capturing logs in the process.

    Args:
        job_id: Job ID
        func_ref: Function reference in format "module:function_name" or registered name
        *args: Positional arguments for the function
        **kwargs: Keyword arguments for the function

    Returns:
        Function result

    Raises:
        ImportError: If function cannot be imported
        AttributeError: If function not found in module
    """
    original_func = _import_job_function(func_ref)
    is_async = asyncio.iscoroutinefunction(original_func)

    # Verify job is in store before execution (fire and forget for long-running tasks)
    _run_async_task(_verify_job_in_store(job_id))

    # Mark as running (fire and forget)
    _run_async_task(_mark_job_running(job_id, func_ref, args, kwargs))

    # Capture logs and execute job
    with LogCapture() as log_capture:
        try:
            if is_async:
                result = await original_func(*args, **kwargs)
            else:
                # For sync functions, run in executor
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, partial(original_func, *args, **kwargs))
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e!s}", exc_info=True)
            raise
        finally:
            # Always capture and store logs (even if empty)
            logs = log_capture.get_logs()
            store_job_logs(job_id, logs)

    return result
