"""Storage API routes."""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from core.constants import ErrorMessages, SuccessMessages
from schemas.storage import ProfilePictureDeleteResponse, ProfilePictureUploadResponse
from services.storage_service import StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storage", tags=["storage"])


def get_storage_service() -> StorageService:
    """
    Dependency to get storage service instance.

    Returns:
        StorageService instance
    """
    return StorageService()


@router.post(
    "/profile-picture",
    response_model=ProfilePictureUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload profile picture",
    description="Upload a profile picture for the authenticated user.",
)
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(..., description="Profile picture file"),
    storage_service: StorageService = Depends(get_storage_service),
) -> ProfilePictureUploadResponse:
    """
    Upload a profile picture.

    Args:
        request: FastAPI request object
        file: Uploaded file
        storage_service: Storage service dependency

    Returns:
        Upload response with public URL

    Raises:
        HTTPException: If upload fails
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=ErrorMessages.USER_ID_NOT_FOUND
        )

    try:
        # Read file content
        file_content = await file.read()
        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=ErrorMessages.STORAGE_FILE_REQUIRED
            )

        # Get content type
        content_type = file.content_type or "application/octet-stream"

        # Upload to MinIO
        public_url = await storage_service.upload_profile_picture(
            user_id=user_id,
            file_content=file_content,
            filename=file.filename or "profile.jpg",
            content_type=content_type,
        )

        logger.info(f"Profile picture uploaded for user {user_id}: {public_url}")
        return ProfilePictureUploadResponse(
            url=public_url, message=SuccessMessages.PROFILE_PICTURE_UPLOADED
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload profile picture: {e!s}", exc_info=True)
        error_detail = str(e) if hasattr(e, "detail") else ErrorMessages.STORAGE_UPLOAD_ERROR
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_detail
        ) from e


@router.delete(
    "/profile-picture",
    response_model=ProfilePictureDeleteResponse,
    summary="Delete profile picture",
    description="Delete the profile picture for the authenticated user.",
)
async def delete_profile_picture(
    request: Request,
    image_url: str = Form(..., description="URL of the profile picture to delete"),
    storage_service: StorageService = Depends(get_storage_service),
) -> ProfilePictureDeleteResponse:
    """
    Delete a profile picture.

    Args:
        request: FastAPI request object
        image_url: URL of the profile picture to delete
        storage_service: Storage service dependency

    Returns:
        Delete response

    Raises:
        HTTPException: If deletion fails
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=ErrorMessages.USER_ID_NOT_FOUND
        )

    try:
        await storage_service.delete_profile_picture(image_url)
        logger.info(f"Profile picture deleted for user {user_id}: {image_url}")
        return ProfilePictureDeleteResponse(message=SuccessMessages.PROFILE_PICTURE_DELETED)
    except Exception as e:
        logger.error(f"Failed to delete profile picture: {e!s}", exc_info=True)
        error_detail = str(e) if hasattr(e, "detail") else ErrorMessages.STORAGE_DELETE_ERROR
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_detail
        ) from e
