"""Job CRUD operations for APScheduler."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
import logging
from typing import Any

from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text

from core.config import (
    DB_SCHEMA,
    JOB_MISFIRE_GRACE_TIME_SECONDS,
    JOB_STORE_TABLE_NAME,
)
from core.job_persistence import verify_job_persistence
from core.jobs import get_scheduler

logger = logging.getLogger(__name__)


def add_scheduled_job(
    func_ref: str | Callable[..., Any],
    job_id: str,
    trigger: str | CronTrigger | IntervalTrigger,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    replace_existing: bool = True,
) -> str:
    """
    Add a scheduled job to the scheduler.

    Args:
        func_ref: Function reference (string "module:function_name" or callable)
        job_id: Unique job identifier
        trigger: Trigger type (cron string, CronTrigger, or IntervalTrigger)
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        replace_existing: Whether to replace existing job with same ID

    Returns:
        Job ID

    Raises:
        RuntimeError: If scheduler is not initialized or job persistence fails
        ValueError: If function reference cannot be determined
    """
    sched = get_scheduler()

    # Ensure scheduler is running for proper job persistence
    if not sched.running:
        logger.warning("Scheduler is not running. Starting scheduler to ensure job persistence...")
        sched.start()

    # Convert cron string to CronTrigger if needed
    if isinstance(trigger, str):
        trigger = CronTrigger.from_crontab(trigger)

    # Convert callable to string reference if needed
    if callable(func_ref):
        # Get module and function name from callable
        func_module = getattr(func_ref, "__module__", None)
        func_name = getattr(func_ref, "__name__", None)
        if func_module and func_name:
            func_ref = f"{func_module}:{func_name}"
        else:
            msg = "Cannot determine module and function name from callable"
            raise ValueError(msg)

    # Use serializable wrapper function with string reference
    # The wrapper will import and execute the function with logging
    wrapper_ref = "utils.job_wrapper:execute_job_with_logging"

    # Prepend job_id and func_ref to args so wrapper can access them
    wrapper_args = (job_id, func_ref) + (args or ())

    try:
        job = sched.add_job(
            func=wrapper_ref,
            trigger=trigger,
            id=job_id,
            args=wrapper_args,
            kwargs=kwargs or {},
            replace_existing=replace_existing,
        )
        logger.info(
            f"Scheduled job added: {job_id} (next_run_time: {job.next_run_time}, "
            f"scheduler_running: {sched.running})"
        )
    except Exception as e:
        error_msg = f"Failed to add scheduled job {job_id}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e

    # Verify job was persisted to the job store with retries
    verify_job_persistence(job_id)

    return job.id


def add_one_time_job(
    func_ref: str | Callable[..., Any],
    job_id: str,
    run_date: datetime | None = None,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    replace_existing: bool = True,
) -> str:
    """
    Add a one-time job to the scheduler.

    Args:
        func_ref: Function reference (string "module:function_name" or callable)
        job_id: Unique job identifier
        run_date: When to run the job (None for immediate execution)
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        replace_existing: Whether to replace existing job with same ID

    Returns:
        Job ID

    Raises:
        RuntimeError: If scheduler is not initialized or job persistence fails
        ValueError: If function reference cannot be determined
    """
    sched = get_scheduler()

    # Ensure scheduler is running for proper job persistence
    if not sched.running:
        logger.warning("Scheduler is not running. Starting scheduler to ensure job persistence...")
        sched.start()

    # Get current UTC time (timezone-aware)
    now_utc = datetime.now(UTC)

    # Determine run date - use provided date or current UTC time for immediate execution
    if run_date is None:
        # For immediate execution, add a small buffer (1 second) to ensure it's not immediately in the past
        run_date = now_utc + timedelta(seconds=1)
    else:
        # Ensure run_date is timezone-aware (convert naive datetime to UTC)
        if run_date.tzinfo is None:
            # Assume naive datetime is in UTC
            run_date = run_date.replace(tzinfo=UTC)
        elif run_date.tzinfo != UTC:
            # Convert to UTC if in different timezone
            run_date = run_date.astimezone(UTC)

        # Check if run_date is in the past
        if run_date < now_utc:
            time_diff = (now_utc - run_date).total_seconds()
            # If run_date is more than grace time in the past, log a warning
            if time_diff > JOB_MISFIRE_GRACE_TIME_SECONDS:
                logger.warning(
                    f"One-time job {job_id} scheduled for {run_date} is more than "
                    f"{JOB_MISFIRE_GRACE_TIME_SECONDS}s in the past. "
                    f"It may be removed if scheduler starts late."
                )
            else:
                logger.info(
                    f"One-time job {job_id} scheduled for {run_date} is in the past "
                    f"but within grace period. Will execute when scheduler processes it."
                )

    trigger = DateTrigger(run_date=run_date)

    # Convert callable to string reference if needed
    if callable(func_ref):
        # Get module and function name from callable
        func_module = getattr(func_ref, "__module__", None)
        func_name = getattr(func_ref, "__name__", None)
        if func_module and func_name:
            func_ref = f"{func_module}:{func_name}"
        else:
            msg = "Cannot determine module and function name from callable"
            raise ValueError(msg)

    # Use serializable wrapper function with string reference
    # The wrapper will import and execute the function with logging
    wrapper_ref = "utils.job_wrapper:execute_job_with_logging"

    # Prepend job_id and func_ref to args so wrapper can access them
    wrapper_args = (job_id, func_ref) + (args or ())

    try:
        job = sched.add_job(
            func=wrapper_ref,
            trigger=trigger,
            id=job_id,
            args=wrapper_args,
            kwargs=kwargs or {},
            replace_existing=replace_existing,
            misfire_grace_time=JOB_MISFIRE_GRACE_TIME_SECONDS,
        )
        logger.info(f"One-time job added: {job_id} (run_date: {run_date})")
    except Exception as e:
        error_msg = f"Failed to add one-time job {job_id}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e

    # Verify job was persisted to the job store with retries
    verify_job_persistence(job_id)

    return job.id


def add_interval_job(
    func_ref: str | Callable[..., Any],
    job_id: str,
    weeks: int = 0,
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    seconds: int = 0,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    replace_existing: bool = True,
) -> str:
    """
    Add an interval-based job to the scheduler.

    Args:
        func_ref: Function reference (string "module:function_name" or callable)
        job_id: Unique job identifier
        weeks: Number of weeks between runs
        days: Number of days between runs
        hours: Number of hours between runs
        minutes: Number of minutes between runs
        seconds: Number of seconds between runs
        start_date: When to start the job
        end_date: When to end the job
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        replace_existing: Whether to replace existing job with same ID

    Returns:
        Job ID

    Raises:
        RuntimeError: If scheduler is not initialized or job persistence fails
        ValueError: If function reference cannot be determined
    """
    sched = get_scheduler()

    # Ensure scheduler is running for proper job persistence
    if not sched.running:
        logger.warning("Scheduler is not running. Starting scheduler to ensure job persistence...")
        sched.start()

    trigger = IntervalTrigger(
        weeks=weeks,
        days=days,
        hours=hours,
        minutes=minutes,
        seconds=seconds,
        start_date=start_date,
        end_date=end_date,
    )

    # Convert callable to string reference if needed
    if callable(func_ref):
        # Get module and function name from callable
        func_module = getattr(func_ref, "__module__", None)
        func_name = getattr(func_ref, "__name__", None)
        if func_module and func_name:
            func_ref = f"{func_module}:{func_name}"
        else:
            msg = "Cannot determine module and function name from callable"
            raise ValueError(msg)

    # Use serializable wrapper function with string reference
    # The wrapper will import and execute the function with logging
    wrapper_ref = "utils.job_wrapper:execute_job_with_logging"

    # Prepend job_id and func_ref to args so wrapper can access them
    wrapper_args = (job_id, func_ref) + (args or ())

    try:
        job = sched.add_job(
            func=wrapper_ref,
            trigger=trigger,
            id=job_id,
            args=wrapper_args,
            kwargs=kwargs or {},
            replace_existing=replace_existing,
        )
        logger.info(f"Interval job added: {job_id}")
    except Exception as e:
        error_msg = f"Failed to add interval job {job_id}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e

    # Verify job was persisted to the job store with retries
    verify_job_persistence(job_id)

    return job.id


def get_job(job_id: str) -> Any:
    """
    Get a job by ID.

    Args:
        job_id: Job ID

    Returns:
        Job object or None if not found

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    return sched.get_job(job_id)


def list_jobs() -> list[Any]:
    """
    List all jobs from the scheduler.

    This function queries the scheduler's job store to get all jobs.
    It uses the scheduler's get_jobs() method which should return all
    jobs that are currently registered and active.

    Returns:
        List of job objects

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    jobs = sched.get_jobs()

    # Log all job IDs for debugging
    job_ids = [job.id for job in jobs]
    logger.debug(f"Retrieved {len(jobs)} jobs from scheduler: {job_ids}")

    return jobs


def list_all_jobs_from_store() -> list[dict[str, Any]]:
    """
    List all jobs directly from the job store database table.

    This function queries the APScheduler jobs table directly to get
    all jobs regardless of their state. This is useful for debugging
    and ensuring all jobs are visible.

    Returns:
        List of job dictionaries with raw job data

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()

    # Access the job store
    job_store = sched._jobstores.get("default")
    if not job_store:
        logger.error("Job store 'default' not found")
        return []

    # Query all jobs from the database table directly
    try:
        # Access the job store's engine
        # APScheduler's SQLAlchemyJobStore stores the engine
        engine = getattr(job_store, "engine", None)
        if not engine:
            logger.warning("Job store engine not accessible, cannot query database directly")
            return []

        with engine.connect() as conn:
            # Query the APScheduler jobs table directly
            # APScheduler stores jobs with columns: id, next_run_time, job_state
            query = text(
                f'SELECT id, next_run_time, job_state FROM "{DB_SCHEMA}"."{JOB_STORE_TABLE_NAME}"'
            )
            result = conn.execute(query)
            rows = result.fetchall()

            jobs = []
            for row in rows:
                jobs.append(
                    {
                        "id": row[0],
                        "next_run_time": row[1],
                        "job_state": row[2],
                    }
                )

            logger.debug(f"Found {len(jobs)} jobs in database table: {[j['id'] for j in jobs]}")
            return jobs
    except Exception as e:
        logger.warning(f"Failed to query job store directly: {e!s}", exc_info=True)
        return []


def remove_job(job_id: str) -> None:
    """
    Remove a job from the scheduler.

    Args:
        job_id: Job ID

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    sched.remove_job(job_id)
    logger.info(f"Job removed: {job_id}")


def pause_job(job_id: str) -> None:
    """
    Pause a job.

    Args:
        job_id: Job ID

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    sched.pause_job(job_id)
    logger.info(f"Job paused: {job_id}")


def resume_job(job_id: str) -> None:
    """
    Resume a paused job.

    Args:
        job_id: Job ID

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    sched.resume_job(job_id)
    logger.info(f"Job resumed: {job_id}")
