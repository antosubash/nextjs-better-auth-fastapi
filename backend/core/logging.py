"""Logging configuration for the application."""

import logging
import sys

from core.config import LOG_FORMAT_JSON, LOG_LEVEL


def setup_logging(json_format: bool | None = None) -> None:
    """
    Configure logging for the application.

    Args:
        json_format: If True, use JSON format. If None, use config value.
    """
    if json_format is None:
        json_format = LOG_FORMAT_JSON

    level = getattr(logging, LOG_LEVEL, logging.INFO)

    if json_format:
        import json  # noqa: PLC0415
        from datetime import datetime  # noqa: PLC0415

        class JSONFormatter(logging.Formatter):
            """JSON formatter for structured logging."""

            def format(self, record: logging.LogRecord) -> str:
                log_data = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                }

                # Add exception info if present
                if record.exc_info:
                    log_data["exception"] = self.formatException(record.exc_info)

                # Add extra fields
                if hasattr(record, "request_id"):
                    log_data["request_id"] = record.request_id

                return json.dumps(log_data)

        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]

    # Force override any existing configuration
    logging.basicConfig(
        level=level,
        handlers=[handler],
        force=True,
    )
