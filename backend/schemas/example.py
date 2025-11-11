"""Pydantic models for example routes."""

from pydantic import BaseModel, Field, field_validator


class TypePayload(BaseModel):
    """Request payload model for data submission."""
    
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Content to be written to file"
    )
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content is not empty after stripping."""
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "This is example content to be written"
            }
        }


class DataResponse(BaseModel):
    """Response model for data submission."""
    
    content: str = Field(..., description="The content that was written")
    message: str = Field(..., description="Success message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "This is example content to be written",
                "message": "Data written successfully"
            }
        }


class HelloResponse(BaseModel):
    """Response model for hello endpoint."""
    
    message: str = Field(..., description="Greeting message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello World! FastAPI is working."
            }
        }

