"""Job scheduler initialization and management using APScheduler."""

import logging

from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from core.config import (
    DB_SCHEMA,
    JOB_MISFIRE_GRACE_TIME_SECONDS,
    JOB_STORE_TABLE_NAME,
    JOB_STORE_URL,
)

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
    # Pass engine_options to ensure the schema search_path is set correctly
    # This ensures the job store's internal engine uses the correct schema
    job_store = SQLAlchemyJobStore(
        url=JOB_STORE_URL,
        tablename=JOB_STORE_TABLE_NAME,
        tableschema=DB_SCHEMA,
        engine_options={
            "connect_args": {"options": f"-csearch_path={DB_SCHEMA}"},
        },
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

    logger.info(
        f"Job scheduler initialized with PostgreSQL job store "
        f"(schema: {DB_SCHEMA}, table: {JOB_STORE_TABLE_NAME})"
    )

    # Setup job execution listeners for capturing logs and errors
    from utils.job_listeners import setup_job_listeners  # noqa: PLC0415

    setup_job_listeners(scheduler)

    return scheduler


# Re-export job operations for backward compatibility
from core.job_operations import (  # noqa: E402, F401
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

        # Verify job store is accessible by checking if we can list jobs
        try:
            job_count = len(sched.get_jobs())
            logger.info(f"Job scheduler started successfully. Current job count: {job_count}")
        except Exception as e:
            logger.warning(f"Could not verify job store after startup: {e!s}")
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
