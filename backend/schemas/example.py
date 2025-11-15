"""Pydantic models for example routes."""

from typing import ClassVar

from pydantic import BaseModel, Field, field_validator

from core.constants import ValidationErrorMessages
from utils.sanitization import sanitize_string


class TypePayload(BaseModel):
    """Request payload model for data submission."""

    content: str = Field(
        ..., min_length=1, max_length=10000, description="Content to be written to file"
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate and sanitize content."""
        try:
            return sanitize_string(v, max_length=10000, min_length=1)
        except ValueError as e:
            if "at least" in str(e) or "at most" in str(e):
                raise ValueError(str(e)) from e
            raise ValueError(ValidationErrorMessages.CONTENT_CANNOT_BE_EMPTY) from e

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"content": "This is example content to be written"}
        }


class DataResponse(BaseModel):
    """Response model for data submission."""

    content: str = Field(..., description="The content that was written")
    message: str = Field(..., description="Success message")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "content": "This is example content to be written",
                "message": "Data written successfully",
            }
        }


class HelloResponse(BaseModel):
    """Response model for hello endpoint."""

    message: str = Field(..., description="Greeting message")

    class Config:
        json_schema_extra: ClassVar = {"example": {"message": "Hello World! FastAPI is working."}}
