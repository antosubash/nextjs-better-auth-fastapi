"""Pydantic models for chat operations."""

from datetime import datetime
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Chat message model."""

    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "role": "user",
                "content": "Hello, how are you?",
            }
        }


class ChatRequest(BaseModel):
    """Request model for chat."""

    messages: list[ChatMessage] = Field(..., description="List of chat messages")
    model: str | None = Field(default=None, description="Model to use (optional)")
    stream: bool = Field(default=True, description="Whether to stream the response")
    conversation_id: UUID | None = Field(
        default=None, description="Conversation ID to save messages to"
    )
    system_prompt: str | None = Field(
        default=None, description="System prompt for the conversation"
    )
    temperature: float | None = Field(
        default=None, ge=0.0, le=2.0, description="Temperature for model (0.0-2.0)"
    )

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "messages": [
                    {"role": "user", "content": "Hello, how are you?"},
                ],
                "model": "qwen3:8b",
                "stream": True,
                "conversation_id": None,
                "system_prompt": None,
                "temperature": None,
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat streaming."""

    content: str = Field(..., description="Chat response content")
    model: str = Field(..., description="Model used for the response")
    done: bool = Field(..., description="Whether the response is complete")
    thinking: str | None = Field(
        default=None, description="Thinking/reasoning steps (for models that support it)"
    )

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "content": "Hello! I'm doing well, thank you for asking.",
                "model": "qwen3:8b",
                "done": False,
                "thinking": None,
            }
        }


class MessageResponse(BaseModel):
    """Response model for a chat message."""

    id: UUID = Field(..., description="Message ID")
    conversation_id: UUID = Field(..., description="Conversation ID")
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    model: str | None = Field(default=None, description="Model used for assistant messages")
    created_at: datetime = Field(..., description="Message creation timestamp")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "conversation_id": "123e4567-e89b-12d3-a456-426614174001",
                "role": "user",
                "content": "Hello, how are you?",
                "model": None,
                "created_at": "2025-01-21T12:00:00Z",
            }
        }


class ConversationResponse(BaseModel):
    """Response model for a chat conversation."""

    id: UUID = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID who owns the conversation")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    updated_at: datetime = Field(..., description="Conversation last update timestamp")
    messages: list[MessageResponse] | None = Field(
        default=None, description="List of messages in the conversation"
    )

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "user_id": "user123",
                "title": "My Conversation",
                "created_at": "2025-01-21T12:00:00Z",
                "updated_at": "2025-01-21T12:00:00Z",
                "messages": None,
            }
        }


class ConversationListResponse(BaseModel):
    """Response model for a list of conversations."""

    conversations: list[ConversationResponse] = Field(..., description="List of conversations")
    total: int = Field(..., description="Total number of conversations")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "conversations": [],
                "total": 0,
            }
        }


class CreateConversationRequest(BaseModel):
    """Request model for creating a conversation."""

    title: str = Field(..., min_length=1, max_length=255, description="Conversation title")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "title": "My New Conversation",
            }
        }


class UpdateConversationRequest(BaseModel):
    """Request model for updating a conversation."""

    title: str = Field(..., min_length=1, max_length=255, description="Conversation title")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "title": "Updated Conversation Title",
            }
        }
