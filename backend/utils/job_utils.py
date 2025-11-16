"""Common utilities for job execution and management."""

from contextlib import redirect_stderr, redirect_stdout
from dataclasses import dataclass
import io
import logging
from typing import Any

from core.constants import JobTriggerTypes


class LogCapture:
    """Context manager to capture stdout, stderr, and logging output."""

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


@dataclass
class MinimalJobParams:
    """Minimal job parameters container."""

    func_ref: str | None = None
    args: tuple[Any, ...] | None = None
    kwargs: dict[str, Any] | None = None
    trigger: str | None = None
    next_run_time: Any | None = None
    history_record: Any | None = None


class MinimalJob:
    """
    Minimal job object for cases where the actual job is not available.

    Used when jobs are removed from scheduler before execution (e.g., one-time jobs)
    or when retrieving job info from history records.
    """

    def __init__(
        self,
        job_id: str,
        params: MinimalJobParams | None = None,
    ) -> None:
        """
        Initialize minimal job object.

        Args:
            job_id: Job ID
            params: Minimal job parameters container
        """
        if params is None:
            params = MinimalJobParams()

        self.id = job_id
        self.next_run_time = params.next_run_time

        if params.history_record:
            # Extract from history record if available
            self.func_ref = params.history_record.func_ref
            self.args = (
                params.history_record.args.get("args", ()) if params.history_record.args else ()
            )
            self.kwargs = params.history_record.kwargs or {}
            self.trigger = params.history_record.trigger
        else:
            # Use provided values or defaults
            self.func_ref = params.func_ref or f"unknown:{job_id}"
            self.args = params.args or ()
            self.kwargs = params.kwargs or {}
            self.trigger = params.trigger or "date[one-time]"


def detect_trigger_type(trigger: Any) -> str:
    """
    Detect trigger type from a trigger object or string.

    Args:
        trigger: Trigger object or string representation

    Returns:
        Trigger type string: "cron", "interval", or "once"
    """
    trigger_str = str(trigger).lower()

    if "cron" in trigger_str:
        return JobTriggerTypes.CRON
    if "interval" in trigger_str:
        return JobTriggerTypes.INTERVAL
    if "date" in trigger_str:
        return JobTriggerTypes.ONCE

    # Default to "once" if cannot be determined
    return JobTriggerTypes.ONCE
