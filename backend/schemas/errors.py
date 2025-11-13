"""Pydantic models for error responses."""

from typing import ClassVar

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response model."""

    detail: str = Field(..., description="Error message")
    request_id: str | None = Field(None, description="Request ID for tracing")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"detail": "Error message here", "request_id": "abc123"}
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response model."""

    detail: list = Field(..., description="List of validation errors")
    request_id: str | None = Field(None, description="Request ID for tracing")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "detail": [
                    {
                        "loc": ["body", "content"],
                        "msg": "field required",
                        "type": "value_error.missing",
                    }
                ],
                "request_id": "abc123",
            }
        }
