"""Job wrapper utility to capture logs and errors."""

import asyncio
import io
import logging
from collections.abc import Callable
from contextlib import redirect_stderr, redirect_stdout
from functools import partial
from typing import Any

from utils.job_listeners import store_job_logs

logger = logging.getLogger(__name__)


class LogCapture:
    """Context manager to capture stdout and stderr."""

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
