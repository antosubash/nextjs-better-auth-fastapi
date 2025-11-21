"""Pydantic models for chat operations."""

from typing import ClassVar

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

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "messages": [
                    {"role": "user", "content": "Hello, how are you?"},
                ],
                "model": "qwen3:8b",
                "stream": True,
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat streaming."""

    content: str = Field(..., description="Chat response content")
    model: str = Field(..., description="Model used for the response")
    done: bool = Field(..., description="Whether the response is complete")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "content": "Hello! I'm doing well, thank you for asking.",
                "model": "qwen3:8b",
                "done": False,
            }
        }
