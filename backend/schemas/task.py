"""Pydantic models for task operations."""

from datetime import datetime
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from core.constants import ValidationErrorMessages
from models.task import TaskStatus
from utils.sanitization import sanitize_string


class TaskCreate(BaseModel):
    """Request model for creating a task."""

    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: str | None = Field(default=None, max_length=5000, description="Task description")
    status: TaskStatus | None = Field(default=TaskStatus.PENDING, description="Task status")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and sanitize title."""
        try:
            return sanitize_string(v, max_length=255, min_length=1)
        except ValueError as e:
            if "at least" in str(e) or "at most" in str(e):
                raise ValueError(str(e)) from e
            raise ValueError(ValidationErrorMessages.TITLE_CANNOT_BE_EMPTY) from e

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "title": "Complete project documentation",
                "description": "Write comprehensive documentation for the project",
                "status": "pending",
            }
        }


class TaskUpdate(BaseModel):
    """Request model for updating a task."""

    title: str | None = Field(default=None, min_length=1, max_length=255, description="Task title")
    description: str | None = Field(default=None, max_length=5000, description="Task description")
    status: TaskStatus | None = Field(default=None, description="Task status")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        """Validate and sanitize title if provided."""
        if v is None:
            return None
        try:
            return sanitize_string(v, max_length=255, min_length=1)
        except ValueError as e:
            if "at least" in str(e) or "at most" in str(e):
                raise ValueError(str(e)) from e
            raise ValueError(ValidationErrorMessages.TITLE_CANNOT_BE_EMPTY) from e

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "title": "Updated task title",
                "description": "Updated description",
                "status": "in_progress",
            }
        }


class TaskResponse(BaseModel):
    """Response model for task data."""

    id: UUID = Field(..., description="Unique task identifier")
    title: str = Field(..., description="Task title")
    description: str | None = Field(None, description="Task description")
    status: TaskStatus = Field(..., description="Task status")
    user_id: str = Field(..., description="User ID who owns the task")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Task last update timestamp")

    class Config:
        from_attributes = True
        json_schema_extra: ClassVar = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Complete project documentation",
                "description": "Write comprehensive documentation for the project",
                "status": "pending",
                "user_id": "user123",
                "created_at": "2024-01-01T12:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z",
            }
        }


class TaskListResponse(BaseModel):
    """Response model for paginated task list."""

    items: list[TaskResponse] = Field(..., description="List of tasks")
    total: int = Field(..., description="Total number of tasks")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"items": [], "total": 0, "page": 1, "page_size": 10, "total_pages": 0}
        }
