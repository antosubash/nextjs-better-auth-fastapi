"""Job persistence verification utilities."""

import logging
import time

from core.config import (
    JOB_PERSISTENCE_VERIFY_MAX_RETRIES,
    JOB_PERSISTENCE_VERIFY_RETRY_DELAY_SECONDS,
)
from core.jobs import get_scheduler

logger = logging.getLogger(__name__)


def verify_job_persistence(
    job_id: str, max_retries: int = JOB_PERSISTENCE_VERIFY_MAX_RETRIES
) -> None:
    """
    Verify that a job was persisted to the job store with retries.

    Args:
        job_id: Job ID to verify
        max_retries: Maximum number of retry attempts

    Raises:
        RuntimeError: If job was not found in job store after retries
    """
    sched = get_scheduler()

    # Check if scheduler is running - jobs won't be persisted if scheduler isn't running
    if not sched.running:
        error_msg = (
            f"Job {job_id} cannot be verified: scheduler is not running. "
            f"Jobs may not be persisted to the job store."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    for attempt in range(max_retries):
        try:
            persisted_job = sched.get_job(job_id)
            if persisted_job:
                logger.debug(
                    f"Job {job_id} verified in job store "
                    f"(next_run_time: {persisted_job.next_run_time}, attempt: {attempt + 1})"
                )
                return
            else:
                logger.debug(
                    f"Job {job_id} not found in job store (attempt {attempt + 1}/{max_retries})"
                )
        except Exception as e:
            logger.warning(
                f"Error verifying job {job_id} persistence (attempt {attempt + 1}): {e!s}",
                exc_info=True,
            )

        # Wait before retrying (except on last attempt)
        if attempt < max_retries - 1:
            time.sleep(JOB_PERSISTENCE_VERIFY_RETRY_DELAY_SECONDS)

    # If we get here, job was not found after all retries
    # Try to verify directly from database store (important for long-running tasks)
    try:
        # Import here to avoid circular import with job_operations
        from core.job_operations import list_all_jobs_from_store  # noqa: PLC0415

        db_jobs = list_all_jobs_from_store()
        db_job_ids = {job_data["id"] for job_data in db_jobs}
        if job_id in db_job_ids:
            logger.info(
                f"Job {job_id} found in database store but not in scheduler. "
                f"This is acceptable for long-running tasks that may be executing."
            )
            return  # Job exists in store, verification successful
    except Exception as e:
        logger.warning(
            f"Could not verify job {job_id} in database store: {e!s}",
            exc_info=True,
        )

    # Try to get all jobs to see what's actually in the store
    try:
        all_jobs = sched.get_jobs()
        all_job_ids = [j.id for j in all_jobs]
        logger.error(
            f"Job {job_id} not found after {max_retries} attempts. "
            f"Current jobs in store: {all_job_ids}. "
            f"Scheduler running: {sched.running}"
        )
    except Exception:
        logger.exception("Could not list jobs for debugging")

    error_msg = (
        f"Job {job_id} was added but not found in job store after {max_retries} attempts. "
        f"Scheduler running: {sched.running}"
    )
    logger.error(error_msg)
    raise RuntimeError(error_msg)
