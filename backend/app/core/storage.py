"""
EduCode Backend - MinIO Storage Helper

Wrapper for MinIO/S3 client for file storage operations.
"""

import logging
import io
import os
from typing import Optional, BinaryIO
from datetime import timedelta

from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

# File validation constants for lesson materials
ALLOWED_MATERIAL_TYPES = {
    # Documents
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
    # Images
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    # Videos
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
    # Archives
    '.zip', '.rar', '.7z', '.tar', '.gz',
    # Code files
    '.py', '.js', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'
}

MAX_MATERIAL_SIZE_MB = 50  # Maximum file size in megabytes
MAX_MATERIAL_SIZE_BYTES = MAX_MATERIAL_SIZE_MB * 1024 * 1024


class StorageClient:
    """
    MinIO/S3 storage client wrapper.

    Provides simplified interface for file uploads, downloads, and management.
    """

    def __init__(self):
        """Initialize MinIO client with settings from environment."""
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE if hasattr(settings, 'MINIO_SECURE') else False
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the default bucket exists, create if it doesn't."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
            else:
                logger.info(f"MinIO bucket exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to check/create bucket: {e}")
            raise

    def upload_file(
        self,
        file_data: BinaryIO,
        object_name: str,
        content_type: str = "application/octet-stream",
        bucket_name: Optional[str] = None
    ) -> str:
        """
        Upload a file to MinIO.

        Args:
            file_data: File-like object or bytes
            object_name: Name/path for the object in storage
            content_type: MIME type of the file
            bucket_name: Optional bucket name (defaults to default bucket)

        Returns:
            The object name/path in storage

        Raises:
            S3Error: If upload fails
        """
        bucket = bucket_name or self.bucket_name

        try:
            # Get file size
            file_data.seek(0, 2)  # Seek to end
            file_size = file_data.tell()
            file_data.seek(0)  # Reset to beginning

            # Upload file
            self.client.put_object(
                bucket,
                object_name,
                file_data,
                file_size,
                content_type=content_type
            )

            logger.info(f"Uploaded file to {bucket}/{object_name}")
            return object_name

        except S3Error as e:
            logger.error(f"Failed to upload file {object_name}: {e}")
            raise

    def upload_bytes(
        self,
        data: bytes,
        object_name: str,
        content_type: str = "application/octet-stream",
        bucket_name: Optional[str] = None
    ) -> str:
        """
        Upload bytes data to MinIO.

        Args:
            data: Bytes to upload
            object_name: Name/path for the object in storage
            content_type: MIME type
            bucket_name: Optional bucket name

        Returns:
            The object name/path in storage
        """
        file_data = io.BytesIO(data)
        return self.upload_file(file_data, object_name, content_type, bucket_name)

    def download_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bytes:
        """
        Download a file from MinIO.

        Args:
            object_name: Name/path of the object in storage
            bucket_name: Optional bucket name

        Returns:
            File data as bytes

        Raises:
            S3Error: If download fails
        """
        bucket = bucket_name or self.bucket_name

        try:
            response = self.client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()

            logger.info(f"Downloaded file from {bucket}/{object_name}")
            return data

        except S3Error as e:
            logger.error(f"Failed to download file {object_name}: {e}")
            raise

    def delete_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Delete a file from MinIO.

        Args:
            object_name: Name/path of the object to delete
            bucket_name: Optional bucket name

        Returns:
            True if successful

        Raises:
            S3Error: If deletion fails
        """
        bucket = bucket_name or self.bucket_name

        try:
            self.client.remove_object(bucket, object_name)
            logger.info(f"Deleted file {bucket}/{object_name}")
            return True

        except S3Error as e:
            logger.error(f"Failed to delete file {object_name}: {e}")
            raise

    def file_exists(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bool:
        """
        Check if a file exists in MinIO.

        Args:
            object_name: Name/path of the object
            bucket_name: Optional bucket name

        Returns:
            True if file exists, False otherwise
        """
        bucket = bucket_name or self.bucket_name

        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error:
            return False

    def get_presigned_url(
        self,
        object_name: str,
        expires: timedelta = timedelta(hours=1),
        bucket_name: Optional[str] = None
    ) -> str:
        """
        Generate a presigned URL for temporary file access.

        Args:
            object_name: Name/path of the object
            expires: URL expiration time
            bucket_name: Optional bucket name

        Returns:
            Presigned URL string

        Raises:
            S3Error: If URL generation fails
        """
        bucket = bucket_name or self.bucket_name

        try:
            url = self.client.presigned_get_object(bucket, object_name, expires=expires)
            logger.info(f"Generated presigned URL for {bucket}/{object_name}")
            return url

        except S3Error as e:
            logger.error(f"Failed to generate presigned URL for {object_name}: {e}")
            raise

    def list_files(
        self,
        prefix: Optional[str] = None,
        bucket_name: Optional[str] = None
    ) -> list:
        """
        List files in a bucket with optional prefix filter.

        Args:
            prefix: Optional prefix to filter objects
            bucket_name: Optional bucket name

        Returns:
            List of object names
        """
        bucket = bucket_name or self.bucket_name

        try:
            objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]

        except S3Error as e:
            logger.error(f"Failed to list files in {bucket}: {e}")
            raise

    def get_file_info(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> dict:
        """
        Get metadata about a file.

        Args:
            object_name: Name/path of the object
            bucket_name: Optional bucket name

        Returns:
            Dictionary with file metadata

        Raises:
            S3Error: If file doesn't exist
        """
        bucket = bucket_name or self.bucket_name

        try:
            stat = self.client.stat_object(bucket, object_name)
            return {
                "size": stat.size,
                "etag": stat.etag,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "metadata": stat.metadata
            }

        except S3Error as e:
            logger.error(f"Failed to get file info for {object_name}: {e}")
            raise


def validate_material_file(file: UploadFile) -> None:
    """
    Validate uploaded lesson material file.

    Checks file type and size according to allowed constraints.

    Args:
        file: The uploaded file to validate

    Raises:
        HTTPException: If file validation fails (400)
    """
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_MATERIAL_TYPES:
        allowed_types_str = ', '.join(sorted(ALLOWED_MATERIAL_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed types: {allowed_types_str}"
        )

    # Check file size
    # Read file to check size (FastAPI UploadFile doesn't have size attribute)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_MATERIAL_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size ({MAX_MATERIAL_SIZE_MB} MB)"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    logger.info(f"Validated file: {file.filename} ({file_size / 1024:.2f} KB)")


# Global storage client instance
storage_client = StorageClient()
