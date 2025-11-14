"""Pydantic models for storage operations."""

from typing import ClassVar

from pydantic import BaseModel, Field


class ProfilePictureUploadResponse(BaseModel):
    """Response model for profile picture upload."""

    url: str = Field(..., description="Public URL of the uploaded profile picture")
    message: str = Field(..., description="Success message")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {
                "url": "http://localhost:9000/better-auth-storage/profile-pictures/user123/1234567890.jpg",
                "message": "Profile picture uploaded successfully",
            }
        }


class ProfilePictureDeleteResponse(BaseModel):
    """Response model for profile picture deletion."""

    message: str = Field(..., description="Success message")

    class Config:
        json_schema_extra: ClassVar = {
            "example": {"message": "Profile picture deleted successfully"}
        }
