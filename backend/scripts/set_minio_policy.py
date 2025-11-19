"""Script to remove MinIO bucket policy for profile pictures.

This script removes any public read access policy from the MinIO bucket,
ensuring profile pictures are only accessible through the backend API with authentication.
"""

import asyncio
import json
from pathlib import Path
import sys

from minio.error import S3Error

# Add backend directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from services.storage_service import StorageService  # noqa: E402


async def remove_minio_policy() -> None:
    """Remove MinIO bucket policy to make profile pictures private."""
    print("🔄 Removing MinIO bucket policy for profile pictures...")

    try:
        storage_service = StorageService()

        # Check if bucket exists
        bucket_exists = await asyncio.to_thread(
            storage_service.client.bucket_exists, storage_service.bucket_name
        )

        if not bucket_exists:
            print(f"❌ Bucket '{storage_service.bucket_name}' does not exist.")
            print("   Please create the bucket first or run the application to auto-create it.")
            sys.exit(1)

        # Remove the bucket policy (set empty policy)
        empty_policy = {"Version": "2012-10-17", "Statement": []}
        await asyncio.to_thread(
            storage_service.client.set_bucket_policy,
            storage_service.bucket_name,
            json.dumps(empty_policy),
        )

        print(
            f"✅ Successfully removed profile picture policy for bucket: {storage_service.bucket_name}"
        )
        print("   Profile pictures are now private and only accessible through the backend API.")
        print(
            f"   Access via: {storage_service.backend_api_url}/storage/profile-picture/{{file_path}}"
        )
        sys.exit(0)

    except S3Error as error:
        print(f"❌ Failed to remove MinIO policy: {error}")
        sys.exit(1)
    except Exception as error:
        print(f"❌ Unexpected error: {error}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(remove_minio_policy())
