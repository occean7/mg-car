import io
import os
import uuid
import hashlib
from pathlib import Path

import pytest
import requests
from PIL import Image
from dotenv import dotenv_values
from pymongo import MongoClient


# Module: auth + media + vehicles integration on public preview URL
def _base_url():
    env_url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if env_url:
        return env_url.rstrip("/")
    env_file = Path("/app/frontend/.env")
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                value = line.split("=", 1)[1].strip()
                if value:
                    return value.rstrip("/")
    pytest.skip("REACT_APP_BACKEND_URL is required for integration tests")


BASE_URL = _base_url()
_backend_env = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
ADMIN_EMAIL = _backend_env["ADMIN_EMAIL"]
ADMIN_PASSWORD = _backend_env["ADMIN_PASSWORD"]
_mongo_client = MongoClient(_backend_env["MONGO_URL"])
_mongo_db = _mongo_client[_backend_env["DB_NAME"]]


@pytest.fixture
def auth_session():
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    yield session
    session.post(f"{BASE_URL}/api/auth/logout", timeout=30)
    session.close()


@pytest.fixture
def anon_session():
    session = requests.Session()
    yield session
    session.close()


@pytest.fixture
def created_vehicle_ids(auth_session):
    ids = []
    yield ids
    _cleanup(auth_session, ids)


def _img_bytes(fmt: str = "PNG", size=(640, 480), color=(60, 120, 200)):
    buffer = io.BytesIO()
    image = Image.new("RGB", size, color=color)
    image.save(buffer, format=fmt)
    return buffer.getvalue()


def _upload(session: requests.Session, filename: str, content: bytes, content_type: str):
    return session.post(
        f"{BASE_URL}/api/media",
        files={"file": (filename, content, content_type)},
        timeout=90,
    )


def _create_vehicle(session: requests.Session, created_vehicle_ids, images):
    payload = {
        "brand": "TEST_PHOTOS",
        "model": f"Flow {uuid.uuid4().hex[:6]}",
        "year": "2025",
        "price": 100000,
        "km": 1234,
        "transmission": "Manual",
        "fuel": "Flex",
        "color": "Preto",
        "description": "Teste integração fotos",
        "images": images,
        "image_url": images[0] if images else "",
        "featured": False,
        "status": "disponivel",
    }
    response = session.post(f"{BASE_URL}/api/vehicles", json=payload, timeout=30)
    assert response.status_code == 200, response.text
    body = response.json()
    created_vehicle_ids.append(body["id"])
    return body


def _cleanup(session: requests.Session, created_vehicle_ids):
    for vehicle_id in created_vehicle_ids:
        session.delete(f"{BASE_URL}/api/vehicles/{vehicle_id}", timeout=30)


# Feature: auth cookie + protected route behavior
def test_auth_login_sets_cookie_and_me(auth_session):
    me = auth_session.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


def test_protected_endpoints_reject_without_login(anon_session):
    manage = anon_session.get(f"{BASE_URL}/api/vehicles/manage", timeout=30)
    assert manage.status_code == 401
    upload = _upload(anon_session, "anon.png", _img_bytes("PNG"), "image/png")
    assert upload.status_code == 401


def test_lockout_after_5_failed_attempts_random_identity(anon_session):
    email = f"no_user_{uuid.uuid4().hex[:8]}@example.com"
    ident = hashlib.sha256(email.encode("utf-8")).hexdigest()
    try:
        for _ in range(5):
            r = anon_session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "wrong-password"},
                timeout=30,
            )
            assert r.status_code == 401
        blocked = anon_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "wrong-password"},
            timeout=30,
        )
        assert blocked.status_code == 429
    finally:
        _mongo_db.login_limits.delete_one({"_id": ident})


# Feature: media upload/validation and access rules
@pytest.mark.parametrize(
    "filename,content,content_type",
    [
        pytest.param("a.jpg", _img_bytes("JPEG"), "image/jpeg", id="jpeg"),
        pytest.param("a.png", _img_bytes("PNG"), "image/png", id="png"),
        pytest.param("a.webp", _img_bytes("WEBP"), "image/webp", id="webp"),
    ],
)
def test_upload_valid_formats_returns_metadata_and_private_before_attach(auth_session, anon_session, filename, content, content_type):
    response = _upload(auth_session, filename, content, content_type)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["url"].startswith("/api/media/")
    assert isinstance(body["width"], int) and body["width"] > 0
    assert isinstance(body["height"], int) and body["height"] > 0

    unauth_get = anon_session.get(f"{BASE_URL}{body['url']}", timeout=30)
    assert unauth_get.status_code == 401

    auth_get = auth_session.get(f"{BASE_URL}{body['url']}", timeout=30)
    assert auth_get.status_code == 200
    assert auth_get.headers["content-type"].startswith("image/jpeg")
    assert auth_get.content[:2] == b"\xff\xd8"

    delete_resp = auth_session.delete(f"{BASE_URL}{body['url']}", timeout=30)
    assert delete_resp.status_code == 200


@pytest.mark.parametrize(
    "filename,content,content_type,expected_status",
    [
        ("bad.txt", b"not an image", "text/plain", 415),
        ("bad.svg", b"<svg xmlns='http://www.w3.org/2000/svg'></svg>", "image/svg+xml", 415),
        ("bad.gif", b"GIF89a123456", "image/gif", 415),
    ],
)
def test_upload_rejects_invalid_types(auth_session, filename, content, content_type, expected_status):
    response = _upload(auth_session, filename, content, content_type)
    assert response.status_code == expected_status


def test_upload_rejects_file_over_10mb(auth_session):
    huge = b"x" * ((10 * 1024 * 1024) + 2)
    response = _upload(auth_session, "huge.jpg", huge, "image/jpeg")
    assert response.status_code == 413
    assert "10 MB" in response.text


def test_get_nonexistent_media_returns_404(auth_session):
    response = auth_session.get(f"{BASE_URL}/api/media/{uuid.uuid4().hex}", timeout=30)
    assert response.status_code == 404


# Feature: vehicle image rules + public access after attach + soft-delete behavior
def test_create_vehicle_rejects_duplicate_images(auth_session):
    upload = _upload(auth_session, "dup.png", _img_bytes("PNG"), "image/png")
    assert upload.status_code == 200
    url = upload.json()["url"]

    payload = {
        "brand": "TEST_PHOTOS",
        "model": "Dup",
        "year": "2024",
        "price": 90000,
        "km": 0,
        "transmission": "Manual",
        "fuel": "Flex",
        "color": "Branco",
        "description": "dup",
        "images": [url, url],
        "image_url": url,
        "featured": False,
        "status": "disponivel",
    }
    create = auth_session.post(f"{BASE_URL}/api/vehicles", json=payload, timeout=30)
    assert create.status_code == 422

    auth_session.delete(f"{BASE_URL}{url}", timeout=30)


def test_vehicle_photo_full_flow_public_after_attach_and_404_after_delete(auth_session, anon_session, created_vehicle_ids):
    up1 = _upload(auth_session, "v1.png", _img_bytes("PNG"), "image/png")
    up2 = _upload(auth_session, "v2.jpg", _img_bytes("JPEG", color=(200, 80, 70)), "image/jpeg")
    assert up1.status_code == 200
    assert up2.status_code == 200
    img1 = up1.json()["url"]
    img2 = up2.json()["url"]

    created = _create_vehicle(auth_session, created_vehicle_ids, [img1, img2])
    assert created["image_url"] == img1
    assert created["images"] == [img1, img2]

    public = anon_session.get(f"{BASE_URL}{img1}", timeout=30)
    assert public.status_code == 200
    assert public.headers["content-type"].startswith("image/jpeg")

    removed = auth_session.delete(f"{BASE_URL}/api/vehicles/{created['id']}", timeout=30)
    assert removed.status_code == 200

    deleted_photo = anon_session.get(f"{BASE_URL}{img1}", timeout=30)
    assert deleted_photo.status_code == 404


def test_update_vehicle_cover_reorder_and_removed_photo_404(auth_session, anon_session, created_vehicle_ids):
    up1 = _upload(auth_session, "u1.png", _img_bytes("PNG"), "image/png")
    up2 = _upload(auth_session, "u2.png", _img_bytes("PNG", color=(50, 140, 50)), "image/png")
    up3 = _upload(auth_session, "u3.jpg", _img_bytes("JPEG", color=(20, 20, 200)), "image/jpeg")
    assert up1.status_code == 200 and up2.status_code == 200 and up3.status_code == 200
    img1 = up1.json()["url"]
    img2 = up2.json()["url"]
    img3 = up3.json()["url"]

    created = _create_vehicle(auth_session, created_vehicle_ids, [img1, img2])
    vid = created["id"]

    updated = auth_session.put(
        f"{BASE_URL}/api/vehicles/{vid}",
        json={"images": [img2, img3]},
        timeout=30,
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["images"][0] == img2
    assert body["image_url"] == img2

    old_photo = anon_session.get(f"{BASE_URL}{img1}", timeout=30)
    assert old_photo.status_code == 404
    kept_photo = anon_session.get(f"{BASE_URL}{img2}", timeout=30)
    assert kept_photo.status_code == 200

    _cleanup(auth_session, created_vehicle_ids)
    created_vehicle_ids.clear()


def test_create_vehicle_accepts_legacy_external_image_url(auth_session, created_vehicle_ids):
    legacy = "https://example.com/legacy-photo.jpg"
    created = _create_vehicle(auth_session, created_vehicle_ids, [legacy])
    assert created["images"][0] == legacy
    assert created["image_url"] == legacy
    _cleanup(auth_session, created_vehicle_ids)
    created_vehicle_ids.clear()


def test_create_vehicle_rejects_more_than_12_images(auth_session):
    images = [f"https://example.com/{i}.jpg" for i in range(13)]
    payload = {
        "brand": "TEST_PHOTOS",
        "model": "TooMany",
        "year": "2026",
        "price": 120000,
        "km": 10,
        "transmission": "Manual",
        "fuel": "Flex",
        "color": "Cinza",
        "description": "many",
        "images": images,
        "image_url": images[0],
        "featured": False,
        "status": "disponivel",
    }
    response = auth_session.post(f"{BASE_URL}/api/vehicles", json=payload, timeout=30)
    assert response.status_code in (422, 400)