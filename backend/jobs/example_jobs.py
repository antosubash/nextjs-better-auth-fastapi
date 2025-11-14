"""Example job implementations."""

import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


async def cleanup_old_data() -> None:
    """
    Example scheduled job: Cleanup old data.

    This is a scheduled job that runs periodically (e.g., daily)
    to clean up old data from the database.
    """
    logger.info("Starting cleanup_old_data job")
    try:
        # Simulate cleanup work
        await asyncio.sleep(1)
        logger.info("Cleanup completed successfully")
    except Exception as e:
        logger.error(f"Cleanup job failed: {e!s}", exc_info=True)
        raise


async def send_notification_email(user_id: str, message: str) -> None:
    """
    Example one-time job: Send notification email.

    This is a one-time async task that can be triggered immediately
    or scheduled for a specific time.

    Args:
        user_id: User ID to send email to
        message: Email message content
    """
    logger.info(f"Starting send_notification_email job for user {user_id}")
    try:
        # Simulate email sending
        await asyncio.sleep(0.5)
        logger.info(f"Email sent to user {user_id}: {message}")
    except Exception as e:
        logger.error(f"Email job failed: {e!s}", exc_info=True)
        raise


async def process_large_dataset(dataset_id: str, batch_size: int = 1000) -> None:
    """
    Example long-running job: Process large dataset.

    This is a long-running task that processes data in batches.
    It demonstrates how to handle long-running operations.

    Args:
        dataset_id: Dataset identifier
        batch_size: Number of items to process per batch
    """
    logger.info(
        f"Starting process_large_dataset job for dataset {dataset_id} with batch_size {batch_size}"
    )
    try:
        # Simulate processing multiple batches
        total_batches = 10
        for batch_num in range(1, total_batches + 1):
            logger.info(
                f"Processing batch {batch_num}/{total_batches} for dataset {dataset_id} (batch_size={batch_size})"
            )
            # Simulate batch processing
            await asyncio.sleep(2)
            logger.info(f"Batch {batch_num} completed")

        logger.info(f"Dataset {dataset_id} processing completed successfully")
    except Exception as e:
        logger.error(f"Dataset processing job failed: {e!s}", exc_info=True)
        raise


async def generate_report(report_type: str, start_date: datetime, end_date: datetime) -> None:
    """
    Example scheduled job: Generate report.

    This demonstrates a job that takes complex parameters.

    Args:
        report_type: Type of report to generate
        start_date: Report start date
        end_date: Report end date
    """
    logger.info(f"Starting generate_report job: {report_type} from {start_date} to {end_date}")
    try:
        # Simulate report generation
        await asyncio.sleep(3)
        logger.info(f"Report {report_type} generated successfully")
    except Exception as e:
        logger.error(f"Report generation job failed: {e!s}", exc_info=True)
        raise


async def health_check() -> None:
    """
    Example interval job: Health check.

    This runs periodically to check system health.
    """
    logger.info("Running health check")
    try:
        # Simulate health check
        await asyncio.sleep(0.1)
        logger.info("Health check passed")
    except Exception as e:
        logger.error(f"Health check failed: {e!s}", exc_info=True)
        raise
