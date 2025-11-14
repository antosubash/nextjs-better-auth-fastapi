"""Custom exception classes for the application."""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base exception class for application-specific errors."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: dict | None = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class AuthenticationError(AppException):
    """Exception raised for authentication errors."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )


class JWKSError(AppException):
    """Exception raised for JWKS-related errors."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )


class FileOperationError(AppException):
    """Exception raised for file operation errors."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )
