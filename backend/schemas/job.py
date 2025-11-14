"""Pydantic models for job operations."""

from datetime import datetime
from typing import Any, ClassVar

from pydantic import BaseModel, Field, field_validator


class JobTriggerType(str):
    """Job trigger type enumeration."""

    CRON = "cron"
    INTERVAL = "interval"
    ONCE = "once"


class JobCreate(BaseModel):
    """Request model for creating a job."""

    job_id: str = Field(..., min_length=1, max_length=255, description="Unique job identifier")
    function: str = Field(..., min_length=1, description="Job function name (must be registered)")
    trigger_type: str = Field(..., description="Trigger type: cron, interval, or once")
    # Cron trigger fields
    cron_expression: str | None = Field(
        default=None, description="Cron expression (e.g., '0 0 * * *' for daily at midnight)"
    )
    # Interval trigger fields
    weeks: int = Field(default=0, ge=0, description="Number of weeks between runs")
    days: int = Field(default=0, ge=0, description="Number of days between runs")
    hours: int = Field(default=0, ge=0, description="Number of hours between runs")
    minutes: int = Field(default=0, ge=0, description="Number of minutes between runs")
    seconds: int = Field(default=0, ge=0, description="Number of seconds between runs")
    # One-time trigger fields
    run_date: datetime | None = Field(
        default=None, description="When to run the job (for one-time jobs, None = immediate)"
    )
    # Common fields
    start_date: datetime | None = Field(default=None, description="When to start the job")
    end_date: datetime | None = Field(default=None, description="When to end the job")
    args: list[Any] = Field(
        default_factory=list, description="Positional arguments for the function"
    )
    kwargs: dict[str, Any] = Field(
        default_factory=dict, description="Keyword arguments for the function"
    )
    replace_existing: bool = Field(default=True, description="Replace existing job with same ID")

    @field_validator("trigger_type")
    @classmethod
    def validate_trigger_type(cls, v: str) -> str:
        """Validate trigger type."""
        valid_types = ["cron", "interval", "once"]
        if v.lower() not in valid_types:
            error_msg = f"Trigger type must be one of: {', '.join(valid_types)}"
            raise ValueError(error_msg)
        return v.lower()

    @field_validator("cron_expression")
    @classmethod
    def validate_cron(cls, v: str | None, info: Any) -> str | None:
        """Validate cron expression is provided when trigger_type is cron."""
        if info.data.get("trigger_type") == "cron" and not v:
            error_msg = "Cron expression is required when trigger_type is 'cron'"
            raise ValueError(error_msg)
        return v

    @field_validator("job_id")
    @classmethod
    def validate_job_id(cls, v: str) -> str:
        """Validate job ID is not empty after stripping."""
        if not v.strip():
            error_msg = "Job ID cannot be empty"
            raise ValueError(error_msg)
        return v.strip()

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "job_id": "daily_cleanup",
                "function": "cleanup_old_data",
                "trigger_type": "cron",
                "cron_expression": "0 0 * * *",
                "args": [],
                "kwargs": {},
            }
        }


class JobResponse(BaseModel):
    """Response model for job data."""

    id: str = Field(..., description="Unique job identifier")
    name: str | None = Field(None, description="Job name")
    func_ref: str = Field(..., description="Function reference")
    trigger: str = Field(..., description="Trigger description")
    next_run_time: datetime | None = Field(None, description="Next scheduled run time")
    pending: bool = Field(..., description="Whether job is pending execution")
    paused: bool = Field(..., description="Whether job is paused")

    class Config:
        from_attributes = True
        json_schema_extra: ClassVar = {
            "example": {
                "id": "daily_cleanup",
                "name": "cleanup_old_data",
                "func_ref": "jobs.example_jobs:cleanup_old_data",
                "trigger": "cron[hour='0', minute='0']",
                "next_run_time": "2024-01-02T00:00:00Z",
                "pending": True,
                "paused": False,
            }
        }


class JobListResponse(BaseModel):
    """Response model for paginated job list."""

    items: list[JobResponse] = Field(..., description="List of jobs")
    total: int = Field(..., description="Total number of jobs")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"items": [], "total": 0, "page": 1, "page_size": 10, "total_pages": 0}
        }


class JobHistoryResponse(BaseModel):
    """Response model for job history data."""

    id: str = Field(..., description="Unique history record identifier")
    job_id: str = Field(..., description="Job identifier")
    function: str = Field(..., description="Job function name")
    func_ref: str = Field(..., description="Function reference")
    trigger: str = Field(..., description="Trigger description")
    trigger_type: str = Field(..., description="Trigger type (cron, interval, once)")
    status: str = Field(..., description="Job status")
    args: dict[str, Any] | None = Field(None, description="Job arguments")
    kwargs: dict[str, Any] | None = Field(None, description="Job keyword arguments")
    next_run_time: datetime | None = Field(None, description="Next scheduled run time")
    error_message: str | None = Field(None, description="Error message if job failed")
    logs: str | None = Field(None, description="Job execution logs")
    user_id: str | None = Field(None, description="User ID who performed the action")
    created_at: datetime = Field(..., description="History record creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra: ClassVar = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "job_id": "daily_cleanup",
                "function": "cleanup_old_data",
                "func_ref": "jobs.example_jobs:cleanup_old_data",
                "trigger": "cron[hour='0', minute='0']",
                "trigger_type": "cron",
                "status": "removed",
                "args": None,
                "kwargs": None,
                "next_run_time": "2024-01-02T00:00:00Z",
                "error_message": None,
                "logs": None,
                "user_id": "user123",
                "created_at": "2024-01-02T10:00:00Z",
            }
        }


class JobHistoryListResponse(BaseModel):
    """Response model for paginated job history list."""

    items: list[JobHistoryResponse] = Field(..., description="List of job history records")
    total: int = Field(..., description="Total number of history records")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"items": [], "total": 0, "page": 1, "page_size": 10, "total_pages": 0}
        }
