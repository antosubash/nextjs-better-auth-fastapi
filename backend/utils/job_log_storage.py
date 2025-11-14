"""Job log storage and retrieval utilities."""

import asyncio
import logging

from core.config import LOG_RETRY_DELAY_SECONDS, LOG_RETRY_MAX_ATTEMPTS

logger = logging.getLogger(__name__)

# Store logs for each job execution
_job_logs: dict[str, str] = {}


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


async def get_logs_with_retry(job_id: str) -> str | None:
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
