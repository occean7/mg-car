from dotenv import load_dotenv
load_dotenv()

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.cors import CORSMiddleware
from vehicle_photos import create_photo_router, validate_photos, sync_photos
from object_storage import init_storage
from login_throttle import reserve_login_attempt

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 12


@app.get("/", tags=["Saúde"])
async def health_check():
    return {"status": "ok", "service": "MG CAR API"}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    user = await db.users.find_one({"_id": payload["sub"]}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    user["id"] = str(user.pop("_id"))
    return user


class LoginRequest(BaseModel):
    email: str
    password: str


class VehicleBase(BaseModel):
    brand: str
    model: str
    year: str
    price: int
    km: int = 0
    transmission: str = "Manual"
    fuel: str = "Flex"
    color: str = ""
    description: str = ""
    image_url: str = ""
    images: List[str] = Field(default_factory=list, max_length=12)
    featured: bool = False
    status: str = "disponivel"


class Vehicle(VehicleBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    price: Optional[int] = None
    km: Optional[int] = None
    transmission: Optional[str] = None
    fuel: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = Field(default=None, max_length=12)
    featured: Optional[bool] = None
    status: Optional[str] = None


def serialize_vehicle(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "images" not in doc:
        doc["images"] = [doc["image_url"]] if doc.get("image_url") else []
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


@api_router.get("/")
async def root():
    return {"message": "MG CAR Veículos API"}


@api_router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.strip().lower()
    ident = await reserve_login_attempt(db, email)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    await db.login_limits.delete_one({"_id": ident})
    token = create_access_token(user["_id"], email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TTL_MIN * 60,
        path="/",
    )
    return {"id": user["_id"], "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Sessão encerrada"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.get("/vehicles", response_model=List[Vehicle])
async def list_vehicles():
    docs = await db.vehicles.find({"status": {"$ne": "vendido"}}).sort([("featured", -1), ("created_at", -1)]).to_list(500)
    return [serialize_vehicle(d) for d in docs]


@api_router.get("/vehicles/manage", response_model=List[Vehicle])
async def list_vehicles_admin(user: dict = Depends(get_current_user)):
    docs = await db.vehicles.find({}).sort([("created_at", -1)]).to_list(500)
    return [serialize_vehicle(d) for d in docs]


@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(payload: VehicleBase, user: dict = Depends(get_current_user)):
    vehicle = Vehicle(**payload.model_dump())
    vehicle.images = payload.images or ([payload.image_url] if payload.image_url else [])
    await validate_photos(db, vehicle.images, user["id"])
    vehicle.image_url = vehicle.images[0] if vehicle.images else ""
    doc = vehicle.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["_id"] = doc.pop("id")
    await db.vehicles.insert_one(doc)
    await sync_photos(db, vehicle.id, vehicle.images)
    return vehicle


@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, payload: VehicleUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    if "images" in update or "image_url" in update:
        if not await db.vehicles.find_one({"_id": vehicle_id}, {"_id": 1}):
            raise HTTPException(404, "Veículo não encontrado")
        images = update.get("images", [update["image_url"]] if update.get("image_url") else [])
        await validate_photos(db, images, user["id"], vehicle_id)
        update["images"] = images
        update["image_url"] = images[0] if images else ""
    result = await db.vehicles.update_one({"_id": vehicle_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    if "images" in update:
        await sync_photos(db, vehicle_id, update["images"])
    doc = await db.vehicles.find_one({"_id": vehicle_id})
    return serialize_vehicle(doc)


@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user: dict = Depends(get_current_user)):
    result = await db.vehicles.delete_one({"_id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    await db.vehicle_photos.update_many({"vehicle_id": vehicle_id}, {"$set": {"is_deleted": True}})
    return {"message": "Veículo removido"}


app.include_router(api_router)
app.include_router(create_photo_router(db, get_current_user))

origins = [o for o in [os.environ.get("FRONTEND_URL"), "http://localhost:3000"] if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD must be configured")

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "_id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "MG CAR Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin MG CAR criado: %s", admin_email)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.login_limits.create_index("expires_at", expireAfterSeconds=0)
    await db.vehicles.create_index([("featured", -1), ("created_at", -1)])
    await db.vehicle_photos.create_index("id", unique=True)
    await db.vehicle_photos.create_index("vehicle_id")
    await seed_admin()
    try:
        await init_storage()
    except KeyError as exc:
        missing_setting = exc.args[0] if exc.args and isinstance(exc.args[0], str) else "configuração obrigatória"
        logger.warning("Armazenamento indisponível: configuração %s ausente; nova tentativa no próximo envio.", missing_setting)
    except Exception:
        logger.warning("Armazenamento indisponível na inicialização; nova tentativa no próximo envio.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
