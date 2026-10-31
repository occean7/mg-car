"""S3-compatible object storage adapter for vehicle photos.

Configured for Cloudflare R2, but works with any S3-compatible service.
No Emergent proxy or Emergent API key is required.
"""
from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from functools import partial
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool

_client: Any | None = None
_client_lock = asyncio.Lock()


@dataclass
class StorageResult:
    """Small response object preserving the old adapter's call contract."""
    content: bytes = b""
    path: str = ""
    content_type: str = "image/jpeg"

    def json(self) -> dict[str, str]:
        return {"path": self.path}


def storage_configured() -> bool:
    return all(os.environ.get(name, "").strip() for name in (
        "STORAGE_BUCKET", "STORAGE_ENDPOINT_URL",
        "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY",
    ))


def _make_client():
    if not storage_configured():
        raise RuntimeError(
            "Armazenamento não configurado: defina STORAGE_BUCKET, "
            "STORAGE_ENDPOINT_URL, STORAGE_ACCESS_KEY_ID e STORAGE_SECRET_ACCESS_KEY."
        )
    return boto3.client(
        "s3",
        endpoint_url=os.environ["STORAGE_ENDPOINT_URL"].rstrip("/"),
        aws_access_key_id=os.environ["STORAGE_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["STORAGE_SECRET_ACCESS_KEY"],
        region_name=os.environ.get("STORAGE_REGION", "auto"),
        config=Config(
            signature_version="s3v4",
            connect_timeout=10,
            read_timeout=60,
            retries={"max_attempts": 3, "mode": "standard"},
            s3={"addressing_style": "path"},
        ),
    )


async def init_storage(force: bool = False):
    """Initialize lazily; no network request or credential needed at import time."""
    global _client
    async with _client_lock:
        if _client is not None and not force:
            return _client
        try:
            _client = _make_client()
        except RuntimeError:
            _client = None
            raise
        return _client


async def storage_request(method: str, path: str, data: bytes | None = None) -> StorageResult:
    """Upload or read an object. Paths are internal keys, never public URLs."""
    normalized = path.strip().lstrip("/")
    if not normalized or ".." in normalized.split("/") or "\\" in normalized:
        raise HTTPException(400, "Caminho de armazenamento inválido.")
    try:
        client = await init_storage()
        bucket = os.environ["STORAGE_BUCKET"]
        if method.upper() == "PUT":
            await run_in_threadpool(partial(
                client.put_object, Bucket=bucket, Key=normalized, Body=data or b"",
                ContentType="image/jpeg",
                CacheControl="public, max-age=31536000, immutable",
            ))
            return StorageResult(path=normalized)
        if method.upper() == "GET":
            response = await run_in_threadpool(partial(
                client.get_object, Bucket=bucket, Key=normalized
            ))
            body = await run_in_threadpool(response["Body"].read)
            return StorageResult(
                content=body, path=normalized,
                content_type=response.get("ContentType", "image/jpeg"),
            )
        raise HTTPException(405, "Operação de armazenamento não permitida.")
    except HTTPException:
        raise
    except (ClientError, BotoCoreError, NoCredentialsError, RuntimeError, KeyError, OSError) as exc:
        import logging
        logging.getLogger(__name__).error(
            "Falha no armazenamento S3 (%s)", type(exc).__name__
        )
        raise HTTPException(
            503,
            "Armazenamento de fotos indisponível. Confira as variáveis do serviço e tente novamente.",
        ) from exc
