"""Persistent image storage; keys stay on the server."""
import asyncio
import os

import httpx
from fastapi import HTTPException

_key = None
_lock = asyncio.Lock()


def storage_url():
    return os.environ["INTEGRATION_PROXY_URL"].rstrip("/") + "/objstore/api/v1/storage"


async def init_storage(force=False):
    global _key
    async with _lock:
        if _key and not force:
            return _key
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{storage_url()}/init", json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]}
            )
            response.raise_for_status()
            _key = response.json()["storage_key"]
        return _key


async def storage_request(method, path, data=None):
    try:
        key = await init_storage()
        async with httpx.AsyncClient(timeout=90) as client:
            for attempt in range(2):
                response = await client.request(
                    method, f"{storage_url()}/objects/{path}", content=data,
                    headers={"X-Storage-Key": key, "Content-Type": "image/jpeg"},
                )
                if response.status_code == 404 and attempt == 0:
                    key = await init_storage(force=True)
                    continue
                if response.status_code == 503 and attempt == 0:
                    await asyncio.sleep(0.5)
                    continue
                if response.status_code == 439:
                    raise HTTPException(503, "O armazenamento atingiu o limite. Não foi possível enviar a foto.")
                response.raise_for_status()
                return response
    except (httpx.HTTPError, KeyError, ValueError):
        raise HTTPException(503, "Armazenamento de fotos indisponível. Tente novamente em instantes.")