"""Job history database model."""

import enum
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlmodel import Field, SQLModel

from core.config import DB_SCHEMA


class JobHistoryStatus(str, enum.Enum):
    """Job history status enumeration."""

    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    REMOVED = "removed"
    PAUSED = "paused"
    RESUMED = "resumed"
    MISFIRED = "misfired"


class JobHistory(SQLModel, table=True):
    """Job history database model."""

    __tablename__ = "job_history"
    __table_args__ = {"schema": DB_SCHEMA}

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, description="Unique history record identifier"
    )
    job_id: str = Field(..., index=True, max_length=255, description="Job identifier")
    function: str = Field(..., max_length=500, description="Job function name")
    func_ref: str = Field(..., max_length=500, description="Function reference")
    trigger: str = Field(..., max_length=500, description="Trigger description")
    trigger_type: str = Field(..., max_length=50, description="Trigger type (cron, interval, once)")
    status: JobHistoryStatus = Field(
        default=JobHistoryStatus.CREATED,
        sa_column=Column(SQLEnum(JobHistoryStatus, native_enum=False, length=20)),
        description="Job status",
    )
    args: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON), description="Job arguments"
    )
    kwargs: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON), description="Job keyword arguments"
    )
    next_run_time: datetime | None = Field(
        default=None,
        sa_column=Column(TIMESTAMP(timezone=True)),
        description="Next scheduled run time when status changed",
    )
    error_message: str | None = Field(
        default=None, sa_column=Column(Text), description="Error message if job failed"
    )
    logs: str | None = Field(default=None, sa_column=Column(Text), description="Job execution logs")
    user_id: str | None = Field(
        default=None, index=True, description="User ID who performed the action"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(TIMESTAMP(timezone=True), server_default="now()"),
        description="History record creation timestamp",
    )
