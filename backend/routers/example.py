"""Example API routes."""

from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import logging
from schemas.example import TypePayload, DataResponse, HelloResponse
from schemas.errors import ErrorResponse
from services.file_service import FileService
from core.constants import ApiMessages, SuccessMessages, ErrorMessages

logger = logging.getLogger(__name__)

router = APIRouter(tags=["example"])


def get_file_service() -> FileService:
    """Dependency to get file service instance."""
    return FileService()


@router.get(
    "/",
    response_model=HelloResponse,
    summary="Hello World",
    description="Simple hello world endpoint to verify the API is working.",
    responses={
        200: {
            "description": "Successful response",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Hello World! FastAPI is working."
                    }
                }
            }
        }
    }
)
def read_root() -> HelloResponse:
    """
    Get hello world message.
    
    Returns:
        HelloResponse with greeting message
    """
    return HelloResponse(message=ApiMessages.HELLO_WORLD)


@router.post(
    "/getdata",
    response_model=DataResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Write data to file",
    description="Write content to the output file with timestamp.",
    responses={
        201: {
            "description": "Data written successfully",
            "content": {
                "application/json": {
                    "example": {
                        "content": "This is example content to be written",
                        "message": "Data written successfully"
                    }
                }
            }
        },
        400: {
            "description": "Validation error",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
async def create_data(
    payload: TypePayload,
    request: Request,
    file_service: FileService = Depends(get_file_service)
) -> DataResponse:
    """
    Write data to file.
    
    Args:
        payload: Content to write
        request: FastAPI request object
        file_service: File service dependency
        
    Returns:
        DataResponse with written content and success message
        
    Raises:
        HTTPException: If file operation fails
    """
    request_id = getattr(request.state, "request_id", None)
    token_data = getattr(request.state, "token_data", None)
    
    try:
        message = await file_service.write_data(payload.content)
        logger.info(f"Data written successfully: {payload.content}")
        logger.info(f"Token data: {token_data}")
        return DataResponse(content=payload.content, message=message)
    except Exception as e:
        logger.error(
            f"Failed to write data: {str(e)}",
            exc_info=True
        )
        error_detail = str(e) if hasattr(e, "detail") else ErrorMessages.FILE_WRITE_ERROR
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )

