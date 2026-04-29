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

ALLOWED_MATERIAL_TYPES = {
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.py', '.js', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'
}

MAX_MATERIAL_SIZE_MB = 50
MAX_MATERIAL_SIZE_BYTES = MAX_MATERIAL_SIZE_MB * 1024 * 1024


class StorageClient:

    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE if hasattr(settings, 'MINIO_SECURE') else False
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
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

        bucket = bucket_name or self.bucket_name

        try:
            file_data.seek(0, 2)
            file_size = file_data.tell()
            file_data.seek(0)


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

        file_data = io.BytesIO(data)
        return self.upload_file(file_data, object_name, content_type, bucket_name)

    def download_file(
        self,
        object_name: str,
        bucket_name: Optional[str] = None
    ) -> bytes:

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
        bucket = bucket_name or self.bucket_name

        try:
            url = self.client.presigned_get_object(bucket, object_name, expires=expires)

            public_endpoint = getattr(settings, 'MINIO_PUBLIC_ENDPOINT', None) or os.getenv('MINIO_PUBLIC_ENDPOINT', None)
            if public_endpoint:
                from urllib.parse import urlparse, urlunparse
                parsed = urlparse(url)
                public_parsed = urlparse(public_endpoint)

                new_url = urlunparse((
                    public_parsed.scheme or parsed.scheme,
                    public_parsed.netloc or parsed.netloc,
                    parsed.path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment
                ))
                logger.info(f"Generated presigned URL for {bucket}/{object_name}: replaced {parsed.netloc} with {public_parsed.netloc}")
                return new_url
            else:
                if 'minio:9000' in url or 'minio:' in url:
                    logger.warning(f"No MINIO_PUBLIC_ENDPOINT set, but URL contains internal hostname. Replacing with localhost:9000")
                    url = url.replace('minio:9000', 'localhost:9000').replace('http://minio:', 'http://localhost:')

            logger.info(f"Generated presigned URL for {bucket}/{object_name}: {url[:80]}...")
            return url

        except S3Error as e:
            logger.error(f"Failed to generate presigned URL for {object_name}: {e}")
            raise

    def list_files(
        self,
        prefix: Optional[str] = None,
        bucket_name: Optional[str] = None
    ) -> list:

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
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_MATERIAL_TYPES:
        allowed_types_str = ', '.join(sorted(ALLOWED_MATERIAL_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed types: {allowed_types_str}"
        )

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

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


storage_client = StorageClient()

