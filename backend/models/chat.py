"""Chat database models."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlmodel import Field, SQLModel

from core.config import DB_SCHEMA


class ChatConversation(SQLModel, table=True):
    """Chat conversation database model."""

    __tablename__ = "chat_conversations"
    __table_args__ = {"schema": DB_SCHEMA}

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, description="Unique conversation identifier"
    )
    user_id: str = Field(..., index=True, description="User ID who owns the conversation")
    title: str = Field(..., min_length=1, max_length=255, description="Conversation title")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(TIMESTAMP(timezone=True), server_default="now()"),
        description="Conversation creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(TIMESTAMP(timezone=True), server_default="now()"),
        description="Conversation last update timestamp",
    )


class ChatMessage(SQLModel, table=True):
    """Chat message database model."""

    __tablename__ = "chat_messages"
    __table_args__ = {"schema": DB_SCHEMA}

    id: UUID = Field(
        default_factory=uuid4, primary_key=True, description="Unique message identifier"
    )
    conversation_id: UUID = Field(
        ...,
        foreign_key=f"{DB_SCHEMA}.chat_conversations.id",
        index=True,
        description="Conversation ID",
    )
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    model: str | None = Field(default=None, description="Model used for assistant messages")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(TIMESTAMP(timezone=True), server_default="now()"),
        description="Message creation timestamp",
    )
