"""Task database model."""

import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from core.config import DB_SCHEMA


class TaskStatus(str, enum.Enum):
    """Task status enumeration."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(SQLModel, table=True):
    """Task database model."""

    __tablename__ = "tasks"
    __table_args__ = {"schema": DB_SCHEMA}

    id: UUID = Field(default_factory=uuid4, primary_key=True, description="Unique task identifier")
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: str | None = Field(default=None, max_length=5000, description="Task description")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Task status")
    user_id: str = Field(..., index=True, description="User ID who owns the task")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Task creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Task last update timestamp"
    )
