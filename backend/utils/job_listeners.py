"""APScheduler event listeners setup."""

import logging
from typing import Any

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED

from utils.job_event_handlers import job_error_listener, job_executed_listener

logger = logging.getLogger(__name__)


def setup_job_listeners(scheduler: Any) -> None:
    """
    Setup event listeners for job execution.

    Args:
        scheduler: APScheduler instance
    """
    scheduler.add_listener(job_executed_listener, EVENT_JOB_EXECUTED)
    scheduler.add_listener(job_error_listener, EVENT_JOB_ERROR)
    logger.info("Job execution listeners configured")
