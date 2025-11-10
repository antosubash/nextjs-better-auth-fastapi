"""Pydantic models for error responses."""

from pydantic import BaseModel, Field
from typing import Optional


class ErrorResponse(BaseModel):
    """Standard error response model."""
    
    detail: str = Field(..., description="Error message")
    request_id: Optional[str] = Field(None, description="Request ID for tracing")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Error message here",
                "request_id": "abc123"
            }
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response model."""
    
    detail: list = Field(..., description="List of validation errors")
    request_id: Optional[str] = Field(None, description="Request ID for tracing")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": [
                    {
                        "loc": ["body", "content"],
                        "msg": "field required",
                        "type": "value_error.missing"
                    }
                ],
                "request_id": "abc123"
            }
        }

