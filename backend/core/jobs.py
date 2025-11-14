"""Job scheduler initialization and management using APScheduler."""

import logging
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger

from core.config import (
    DB_SCHEMA,
    JOB_MISFIRE_GRACE_TIME_SECONDS,
    JOB_STORE_TABLE_NAME,
    JOB_STORE_URL,
)
from utils.job_wrapper import create_job_wrapper

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """
    Get or create the global scheduler instance.

    Returns:
        AsyncIOScheduler instance

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    if scheduler is None:
        error_msg = "Scheduler not initialized. Call init_scheduler() first."
        raise RuntimeError(error_msg)
    return scheduler


def init_scheduler() -> AsyncIOScheduler:
    """
    Initialize the APScheduler with PostgreSQL job store.

    Returns:
        Initialized AsyncIOScheduler instance
    """
    global scheduler  # noqa: PLW0603

    if scheduler is not None:
        logger.warning("Scheduler already initialized")
        return scheduler

    # Configure job store using SQLAlchemy with PostgreSQL
    job_store = SQLAlchemyJobStore(
        url=JOB_STORE_URL,
        tablename=JOB_STORE_TABLE_NAME,
        tableschema=DB_SCHEMA,
    )

    # Configure executor for async jobs
    # AsyncIOExecutor doesn't use max_workers - it uses the event loop directly
    executor = AsyncIOExecutor()

    # Create scheduler
    scheduler = AsyncIOScheduler(
        jobstores={"default": job_store},
        executors={"default": executor},
        job_defaults={
            "coalesce": True,
            "max_instances": 3,
            "misfire_grace_time": JOB_MISFIRE_GRACE_TIME_SECONDS,
        },
        timezone="UTC",
    )

    logger.info("Job scheduler initialized with PostgreSQL job store")

    # Setup job execution listeners for capturing logs and errors
    from utils.job_listeners import setup_job_listeners  # noqa: PLC0415

    setup_job_listeners(scheduler)

    return scheduler


async def start_scheduler() -> None:
    """
    Start the scheduler.

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    if not sched.running:
        sched.start()
        logger.info("Job scheduler started")
    else:
        logger.warning("Scheduler is already running")


async def shutdown_scheduler() -> None:
    """
    Shutdown the scheduler gracefully.

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    if sched.running:
        sched.shutdown(wait=True)
        logger.info("Job scheduler shut down")
    else:
        logger.warning("Scheduler is not running")


def add_scheduled_job(
    func: Callable[..., Any],
    job_id: str,
    trigger: str | CronTrigger | IntervalTrigger,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    replace_existing: bool = True,
) -> str:
    """
    Add a scheduled job to the scheduler.

    Args:
        func: Function to execute
        job_id: Unique job identifier
        trigger: Trigger type (cron string, CronTrigger, or IntervalTrigger)
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        replace_existing: Whether to replace existing job with same ID

    Returns:
        Job ID

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()

    # Convert cron string to CronTrigger if needed
    if isinstance(trigger, str):
        trigger = CronTrigger.from_crontab(trigger)

    # Wrap the function to capture logs
    wrapped_func = create_job_wrapper(job_id, func)

    job = sched.add_job(
        func=wrapped_func,
        trigger=trigger,
        id=job_id,
        args=args or (),
        kwargs=kwargs or {},
        replace_existing=replace_existing,
    )

    logger.info(f"Scheduled job added: {job_id}")
    return job.id


def add_one_time_job(
    func: Callable[..., Any],
    job_id: str,
    run_date: datetime | None = None,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    replace_existing: bool = True,
) -> str:
    """
    Add a one-time job to the scheduler.

    Args:
        func: Function to execute
        job_id: Unique job identifier
        run_date: When to run the job (None for immediate execution)
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        replace_existing: Whether to replace existing job with same ID

    Returns:
        Job ID

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()

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

    # Wrap the function to capture logs
    wrapped_func = create_job_wrapper(job_id, func)

    job = sched.add_job(
        func=wrapped_func,
        trigger=trigger,
        id=job_id,
        args=args or (),
        kwargs=kwargs or {},
        replace_existing=replace_existing,
        misfire_grace_time=JOB_MISFIRE_GRACE_TIME_SECONDS,
    )

    logger.info(f"One-time job added: {job_id} (run_date: {run_date})")
    return job.id


def add_interval_job(
    func: Callable[..., Any],
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
        func: Function to execute
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
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()

    trigger = IntervalTrigger(
        weeks=weeks,
        days=days,
        hours=hours,
        minutes=minutes,
        seconds=seconds,
        start_date=start_date,
        end_date=end_date,
    )

    # Wrap the function to capture logs
    wrapped_func = create_job_wrapper(job_id, func)

    job = sched.add_job(
        func=wrapped_func,
        trigger=trigger,
        id=job_id,
        args=args or (),
        kwargs=kwargs or {},
        replace_existing=replace_existing,
    )

    logger.info(f"Interval job added: {job_id}")
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
    List all jobs.

    Returns:
        List of job objects

    Raises:
        RuntimeError: If scheduler is not initialized
    """
    sched = get_scheduler()
    return sched.get_jobs()


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
