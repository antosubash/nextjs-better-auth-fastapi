"""Storage service for MinIO operations."""

import asyncio
from datetime import UTC, datetime
from io import BytesIO
import logging
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from core.config import (
    BACKEND_API_URL,
    FRONTEND_URL,
    MINIO_ACCESS_KEY,
    MINIO_BUCKET_NAME,
    MINIO_ENDPOINT,
    MINIO_PUBLIC_URL,
    MINIO_REGION,
    MINIO_SECRET_KEY,
    MINIO_USE_SSL,
    PROFILE_PICTURE_ALLOWED_TYPES,
    PROFILE_PICTURE_MAX_SIZE,
)
from core.constants import ErrorMessages
from core.exceptions import FileOperationError

logger = logging.getLogger(__name__)


class StorageService:
    """Service for MinIO storage operations."""

    def __init__(self) -> None:
        """Initialize MinIO client."""
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_USE_SSL,
            region=MINIO_REGION,
        )
        self.bucket_name = MINIO_BUCKET_NAME
        self.public_url = MINIO_PUBLIC_URL
        self.backend_api_url = BACKEND_API_URL
        self.frontend_url = FRONTEND_URL

    async def ensure_bucket_exists(self) -> None:
        """
        Ensure the bucket exists, create if it doesn't.

        Raises:
            FileOperationError: If bucket creation fails
        """
        try:
            found = await asyncio.to_thread(self.client.bucket_exists, self.bucket_name)
            if not found:
                await asyncio.to_thread(
                    self.client.make_bucket, self.bucket_name, location=MINIO_REGION
                )
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket already exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to ensure bucket exists: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_BUCKET_ERROR) from e
        except Exception as e:
            logger.error(f"Unexpected error ensuring bucket exists: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_BUCKET_ERROR) from e

    def _validate_file(self, _file_content: bytes, content_type: str, file_size: int) -> None:
        """
        Validate uploaded file.

        Args:
            _file_content: File content bytes (unused, reserved for future validation)
            content_type: MIME type of the file
            file_size: Size of the file in bytes

        Raises:
            FileOperationError: If validation fails
        """
        # Check file size
        if file_size > PROFILE_PICTURE_MAX_SIZE:
            raise FileOperationError(ErrorMessages.STORAGE_FILE_TOO_LARGE)

        # Check file type
        normalized_types = [t.strip().lower() for t in PROFILE_PICTURE_ALLOWED_TYPES]
        if content_type.lower() not in normalized_types:
            raise FileOperationError(ErrorMessages.STORAGE_INVALID_FILE_TYPE)

    def _generate_file_path(self, user_id: str, filename: str) -> str:
        """
        Generate unique file path for profile picture.

        Args:
            user_id: User ID
            filename: Original filename

        Returns:
            File path in MinIO
        """
        timestamp = int(datetime.now(tz=UTC).timestamp() * 1000)
        ext = Path(filename).suffix.lower() or ".jpg"
        return f"profile-pictures/{user_id}/{timestamp}{ext}"

    def _get_backend_url(self, file_path: str) -> str:
        """
        Generate frontend proxy URL for a file.

        The URL goes through the Next.js proxy which handles authentication
        via cookies, allowing images to be displayed in <img> tags.

        Args:
            file_path: File path in MinIO

        Returns:
            Frontend proxy URL
        """
        # Use frontend proxy URL so images can be accessed with cookie-based auth
        return f"{self.frontend_url}/api/proxy/storage/profile-picture/{file_path}"

    async def upload_profile_picture(
        self, user_id: str, file_content: bytes, filename: str, content_type: str
    ) -> str:
        """
        Upload profile picture to MinIO.

        Args:
            user_id: User ID
            file_content: File content bytes
            filename: Original filename
            content_type: MIME type of the file

        Returns:
            Public URL of the uploaded file

        Raises:
            FileOperationError: If upload fails
        """
        try:
            file_size = len(file_content)
            self._validate_file(file_content, content_type, file_size)

            file_path = self._generate_file_path(user_id, filename)

            # Upload to MinIO
            await asyncio.to_thread(
                self.client.put_object,
                self.bucket_name,
                file_path,
                BytesIO(file_content),
                length=file_size,
                content_type=content_type,
            )
        except FileOperationError:
            raise
        except S3Error as e:
            logger.error(f"Failed to upload profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_UPLOAD_ERROR) from e
        except Exception as e:
            logger.error(f"Unexpected error uploading profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_UPLOAD_ERROR) from e
        else:
            backend_url = self._get_backend_url(file_path)
            logger.info(f"Uploaded profile picture for user {user_id}: {file_path}")
            return backend_url

    async def get_profile_picture(self, file_path: str) -> tuple[bytes, str]:
        """
        Get profile picture from MinIO.

        Args:
            file_path: File path in MinIO

        Returns:
            Tuple of (file content, content type)

        Raises:
            FileOperationError: If retrieval fails
        """
        try:
            response = await asyncio.to_thread(self.client.get_object, self.bucket_name, file_path)
            try:
                content = response.read()
                content_type = response.headers.get("Content-Type", "image/jpeg")
                return content, content_type
            finally:
                response.close()
                response.release_conn()
        except S3Error as e:
            logger.error(f"Failed to get profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_GET_ERROR) from e
        except Exception as e:
            logger.error(f"Unexpected error getting profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_GET_ERROR) from e

    async def delete_profile_picture(self, image_url: str) -> None:
        """
        Delete profile picture from MinIO.

        Args:
            image_url: Frontend proxy URL or backend API URL of the image to delete

        Raises:
            FileOperationError: If deletion fails
        """
        try:
            # Extract file path from URL
            # URL format can be either frontend proxy URL or direct backend URL
            file_path = None

            # Try frontend proxy URL first
            frontend_prefix = f"{self.frontend_url}/api/proxy/storage/profile-picture/"
            if image_url.startswith(frontend_prefix):
                file_path = image_url.replace(frontend_prefix, "")
            else:
                # Try backend URL
                backend_prefix = f"{self.backend_api_url}/storage/profile-picture/"
                if image_url.startswith(backend_prefix):
                    file_path = image_url.replace(backend_prefix, "")

            if not file_path or not file_path.startswith("profile-pictures/"):
                logger.warning(f"Invalid image URL format for deletion: {image_url}")
                return

            # Delete from MinIO
            await asyncio.to_thread(self.client.remove_object, self.bucket_name, file_path)
            logger.info(f"Deleted profile picture: {file_path}")
        except S3Error as e:
            logger.error(f"Failed to delete profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_DELETE_ERROR) from e
        except Exception as e:
            logger.error(f"Unexpected error deleting profile picture: {e!s}", exc_info=True)
            raise FileOperationError(ErrorMessages.STORAGE_DELETE_ERROR) from e
