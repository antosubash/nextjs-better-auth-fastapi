"""Input sanitization utilities."""

import re
from urllib.parse import urlparse

from core.constants import ValidationErrorMessages


def sanitize_string(value: str, max_length: int | None = None, min_length: int = 0) -> str:
    """
    Sanitize a string by stripping whitespace and validating length.

    Args:
        value: String to sanitize
        max_length: Maximum allowed length (None for no limit)
        min_length: Minimum required length

    Returns:
        Sanitized string

    Raises:
        TypeError: If value is not a string
        ValueError: If string is empty after stripping or doesn't meet length requirements
    """
    if not isinstance(value, str):
        raise TypeError(ValidationErrorMessages.VALUE_MUST_BE_STRING)

    sanitized = value.strip()

    if len(sanitized) < min_length:
        raise ValueError(ValidationErrorMessages.STRING_TOO_SHORT.format(min_length=min_length))

    if max_length is not None and len(sanitized) > max_length:
        raise ValueError(ValidationErrorMessages.STRING_TOO_LONG.format(max_length=max_length))

    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing dangerous characters.

    Args:
        filename: Filename to sanitize

    Returns:
        Sanitized filename

    Raises:
        TypeError: If filename is not a string
        ValueError: If filename is empty after sanitization
    """
    if not isinstance(filename, str):
        raise TypeError(ValidationErrorMessages.FILENAME_MUST_BE_STRING)

    # Remove path separators and other dangerous characters
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", filename)
    sanitized = sanitized.strip()

    if not sanitized:
        raise ValueError(ValidationErrorMessages.FILENAME_CANNOT_BE_EMPTY)

    # Limit length
    if len(sanitized) > 255:
        sanitized = sanitized[:255]

    return sanitized


def sanitize_url(url: str, allowed_schemes: list[str] | None = None) -> str:
    """
    Validate and sanitize a URL.

    Args:
        url: URL to sanitize
        allowed_schemes: List of allowed URL schemes (default: ['http', 'https'])

    Returns:
        Sanitized URL

    Raises:
        TypeError: If URL is not a string
        ValueError: If URL is invalid or uses a disallowed scheme
    """
    if not isinstance(url, str):
        raise TypeError(ValidationErrorMessages.URL_MUST_BE_STRING)

    sanitized = url.strip()

    if not sanitized:
        raise ValueError(ValidationErrorMessages.URL_CANNOT_BE_EMPTY)

    try:
        parsed = urlparse(sanitized)
    except Exception as e:
        raise ValueError(ValidationErrorMessages.URL_INVALID_FORMAT.format(error=str(e))) from e

    if not parsed.scheme:
        raise ValueError(ValidationErrorMessages.URL_MISSING_SCHEME)

    if allowed_schemes is None:
        allowed_schemes = ["http", "https"]

    if parsed.scheme.lower() not in [s.lower() for s in allowed_schemes]:
        raise ValueError(
            ValidationErrorMessages.URL_INVALID_SCHEME.format(schemes=", ".join(allowed_schemes))
        )

    return sanitized


def sanitize_html(html: str, allowed_tags: list[str] | None = None) -> str:
    """
    Basic HTML sanitization by removing HTML tags.

    Args:
        html: HTML string to sanitize
        allowed_tags: List of allowed HTML tags (None means strip all tags)

    Returns:
        Sanitized string with HTML tags removed

    Note:
        This is a basic implementation. For production use, consider using
        a library like bleach for more comprehensive HTML sanitization.

    Raises:
        TypeError: If HTML is not a string
    """
    if not isinstance(html, str):
        raise TypeError(ValidationErrorMessages.HTML_MUST_BE_STRING)

    if allowed_tags is None:
        # Remove all HTML tags
        sanitized = re.sub(r"<[^>]+>", "", html)
    else:
        # Remove all tags except allowed ones
        # This is a simplified implementation
        pattern = "|".join(allowed_tags)
        sanitized = re.sub(rf"<(?!\/?(?:{pattern})\b)[^>]+>", "", html, flags=re.IGNORECASE)

    return sanitized.strip()
