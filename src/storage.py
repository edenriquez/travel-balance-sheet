"""S3-compatible (MinIO) storage for receipt/evidence images."""

import asyncio
import json
import logging
import time
import uuid
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

from src.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
EXTENSION_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@lru_cache(maxsize=1)
def _get_s3_client():
    protocol = "https" if settings.MINIO_USE_SSL else "http"
    return boto3.client(
        "s3",
        endpoint_url=f"{protocol}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        region_name="us-east-1",
    )


def _ensure_bucket_sync(max_retries: int = 5, base_delay: float = 1.0) -> None:
    client = _get_s3_client()
    bucket = settings.MINIO_BUCKET
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)

    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket}/*",
            }
        ],
    }
    for attempt in range(max_retries):
        try:
            client.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))
            return
        except ClientError as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning("MinIO not ready (attempt %d/%d), retrying in %.1fs: %s", attempt + 1, max_retries, delay, e)
            time.sleep(delay)


async def ensure_bucket() -> None:
    await asyncio.to_thread(_ensure_bucket_sync)


def _upload_sync(file_bytes: bytes, content_type: str, trip_id: str) -> str:
    ext = EXTENSION_MAP[content_type]
    object_key = f"movements/{trip_id}/{uuid.uuid4()}.{ext}"
    client = _get_s3_client()
    client.put_object(
        Bucket=settings.MINIO_BUCKET,
        Key=object_key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return object_key


async def upload_evidence(file_bytes: bytes, content_type: str, trip_id: str) -> str:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Tipo de archivo no permitido: {content_type}")
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("El archivo excede el tamaño máximo de 10 MB")
    return await asyncio.to_thread(_upload_sync, file_bytes, content_type, trip_id)


def get_evidence_url(object_key: str) -> str:
    protocol = "https" if settings.MINIO_USE_SSL else "http"
    return f"{protocol}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_key}"
