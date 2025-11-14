"""Job function registry for managing available job functions."""

import importlib
import logging
from collections.abc import Callable
from typing import Any

from fastapi import status

from core.constants import ErrorMessages
from core.exceptions import AppException

logger = logging.getLogger(__name__)

# Registry of available job functions
_job_functions: dict[str, Callable[..., Any]] = {}


def register_job_function(name: str, func: Callable[..., Any]) -> None:
    """
    Register a job function.

    Args:
        name: Function name identifier
        func: Function to register
    """
    _job_functions[name] = func
    logger.debug(f"Registered job function: {name}")


def get_job_function(name: str) -> Callable[..., Any]:
    """
    Get a registered job function by name.

    Args:
        name: Function name identifier

    Returns:
        Registered function

    Raises:
        AppException: If function not found
    """
    # Try direct lookup first
    if name in _job_functions:
        return _job_functions[name]

    # Try importing from module path (e.g., "jobs.example_jobs:function_name")
    if ":" in name:
        module_path, func_name = name.rsplit(":", 1)
        try:
            module = importlib.import_module(module_path)
            func = getattr(module, func_name)
            if callable(func):
                return func
        except (ImportError, AttributeError) as e:
            logger.exception("Failed to import job function %s", name)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessages.JOB_FUNCTION_NOT_FOUND,
            ) from e

    raise AppException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=ErrorMessages.JOB_FUNCTION_NOT_FOUND,
    )
