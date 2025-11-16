"""Storage service for MinIO operations."""

import asyncio
from datetime import UTC, datetime
from io import BytesIO
import json
import logging
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from core.config import (
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
                # Set bucket policy for public read access to profile pictures
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket_name}/profile-pictures/*"],
                        }
                    ],
                }

                await asyncio.to_thread(
                    self.client.set_bucket_policy, self.bucket_name, json.dumps(policy)
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

    def _get_public_url(self, file_path: str) -> str:
        """
        Generate public URL for a file.

        Args:
            file_path: File path in MinIO

        Returns:
            Public URL
        """
        return f"{self.public_url}/{file_path}"

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
            public_url = self._get_public_url(file_path)
            logger.info(f"Uploaded profile picture for user {user_id}: {file_path}")
            return public_url

    async def delete_profile_picture(self, image_url: str) -> None:
        """
        Delete profile picture from MinIO.

        Args:
            image_url: Public URL of the image to delete

        Raises:
            FileOperationError: If deletion fails
        """
        try:
            # Extract file path from URL
            if not image_url.startswith(self.public_url):
                logger.warning(f"Image URL does not match public URL: {image_url}")
                return

            file_path = image_url.replace(f"{self.public_url}/", "")
            if not file_path.startswith("profile-pictures/"):
                logger.warning(f"Invalid file path for deletion: {file_path}")
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
