import io
import uuid
import warnings
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from object_storage import storage_request

register_heif_opener()
MAX_PHOTOS = 12
MAX_BYTES = 10 * 1024 * 1024
MEDIA_PREFIX = "/api/media/"


class UploadedPhoto(BaseModel):
    id: str
    url: str
    filename: str
    width: int
    height: int


def prepare_image(data):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                if source.format not in {"JPEG", "PNG", "WEBP", "HEIF"}:
                    raise HTTPException(415, "Envie fotos JPG, PNG, WEBP ou HEIC.")
                if source.width * source.height > 40_000_000:
                    raise HTTPException(413, "A foto tem resolução muito alta. Limite: 40 megapixels.")
                source.load()
                image = ImageOps.exif_transpose(source)
                image.thumbnail((1920, 1920))
                if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
                    rgba = image.convert("RGBA")
                    image = Image.new("RGB", rgba.size, "white")
                    image.paste(rgba, mask=rgba.getchannel("A"))
                else:
                    image = image.convert("RGB")
                out = io.BytesIO()
                image.save(out, format="JPEG", quality=88, optimize=True)
                return out.getvalue(), image.width, image.height
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(415, "Arquivo inválido. Selecione uma foto JPG, PNG, WEBP ou HEIC.")


def media_ids(images):
    return [image[len(MEDIA_PREFIX):] for image in images if image.startswith(MEDIA_PREFIX)]


async def validate_photos(db, images, user_id, vehicle_id=None):
    if len(images) > MAX_PHOTOS or len(set(images)) != len(images):
        raise HTTPException(422, "Selecione até 12 fotos diferentes por veículo.")
    for image in images:
        if image.startswith(MEDIA_PREFIX):
            record = await db.vehicle_photos.find_one(
                {"id": image[len(MEDIA_PREFIX):], "is_deleted": False, "uploaded_by": user_id}, {"_id": 0}
            )
            if not record or record.get("vehicle_id") not in (None, vehicle_id):
                raise HTTPException(422, "Uma das fotos não está disponível. Envie a foto novamente.")
        elif not image.startswith(("https://", "http://")):
            raise HTTPException(422, "Endereço de foto inválido.")


async def sync_photos(db, vehicle_id, images):
    ids = media_ids(images)
    await db.vehicle_photos.update_many(
        {"vehicle_id": vehicle_id, "id": {"$nin": ids}}, {"$set": {"is_deleted": True}}
    )
    await db.vehicle_photos.update_many(
        {"id": {"$in": ids}, "is_deleted": False}, {"$set": {"vehicle_id": vehicle_id}}
    )


def create_photo_router(db, get_current_user):
    router = APIRouter(prefix="/api/media", tags=["Fotos"])

    @router.post("", response_model=UploadedPhoto)
    async def upload_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
        try:
            data = await file.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES:
                raise HTTPException(413, "Cada foto deve ter no máximo 10 MB.")
            image, width, height = await run_in_threadpool(prepare_image, data)
        finally:
            await file.close()
        photo_id = str(uuid.uuid4())
        path = f"mg-car/uploads/{user['id']}/{photo_id}.jpg"
        result = await storage_request("PUT", path, image)
        filename = (file.filename or "foto")[:255]
        await db.vehicle_photos.insert_one({
            "id": photo_id, "storage_path": result.json()["path"], "original_filename": filename,
            "uploaded_by": user["id"], "vehicle_id": None, "is_deleted": False,
            "content_type": "image/jpeg", "size": len(image), "width": width, "height": height,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return UploadedPhoto(id=photo_id, url=f"{MEDIA_PREFIX}{photo_id}", filename=filename, width=width, height=height)

    @router.get("/{photo_id}")
    async def get_photo(photo_id: str, request: Request):
        record = await db.vehicle_photos.find_one({"id": photo_id, "is_deleted": False}, {"_id": 0})
        if not record:
            raise HTTPException(404, "Foto não encontrada")
        if not record.get("vehicle_id"):
            user = await get_current_user(request)
            if record["uploaded_by"] != user["id"]:
                raise HTTPException(404, "Foto não encontrada")
        result = await storage_request("GET", record["storage_path"])
        return Response(result.content, media_type="image/jpeg", headers={
            "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff",
        })

    @router.delete("/{photo_id}")
    async def discard_photo(photo_id: str, user: dict = Depends(get_current_user)):
        record = await db.vehicle_photos.find_one({"id": photo_id, "uploaded_by": user["id"]}, {"_id": 0})
        if not record:
            raise HTTPException(404, "Foto não encontrada")
        if record.get("vehicle_id"):
            raise HTTPException(409, "Remova a foto editando o veículo.")
        await db.vehicle_photos.update_one({"id": photo_id}, {"$set": {"is_deleted": True}})
        return {"message": "Foto removida"}

    return router