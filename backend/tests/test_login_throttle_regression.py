import hashlib
import os
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient


# Module: auth throttle + cookie/cors/index regression tests on public preview URL
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
    pytest.fail("REACT_APP_BACKEND_URL is required for integration tests")


BASE_URL = _base_url()
_backend_env = dotenv_values("/app/backend/.env")
ADMIN_EMAIL = _backend_env["ADMIN_EMAIL"].strip().lower()
ADMIN_PASSWORD = _backend_env["ADMIN_PASSWORD"]
MONGO_URL = _backend_env["MONGO_URL"]
DB_NAME = _backend_env["DB_NAME"]


@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture()
def http_session():
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    yield session
    session.close()


@pytest.fixture()
def random_identity(mongo_db):
    email = f"test_lock_{uuid.uuid4().hex[:10]}@example.com"
    ident = hashlib.sha256(email.encode("utf-8")).hexdigest()
    yield email, ident
    mongo_db.login_limits.delete_one({"_id": ident})


def _login(session: requests.Session, email: str, password: str, extra_headers=None):
    headers = extra_headers or {}
    return session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        headers=headers,
        timeout=30,
    )


# Feature: lockout key must be normalized by email regardless of spaces/case/connections
def test_lockout_uses_normalized_email_across_sessions_and_variants(http_session, mongo_db, random_identity):
    raw_email, ident = random_identity
    variants = [
        f"  {raw_email.upper()}  ",
        raw_email,
        raw_email.upper(),
        f" {raw_email} ",
        raw_email.capitalize(),
    ]

    sessions = [requests.Session(), requests.Session()]
    try:
        for idx, variant in enumerate(variants):
            res = _login(
                sessions[idx % 2],
                variant,
                "wrong-password",
                extra_headers={"X-Forwarded-For": f"203.0.113.{10 + idx}"},
            )
            assert res.status_code == 401

        blocked = _login(
            http_session,
            f" {raw_email.upper()} ",
            "wrong-password",
            extra_headers={"X-Forwarded-For": "198.51.100.99"},
        )
        assert blocked.status_code == 429
        assert "Retry-After" in blocked.headers
        retry_after = int(blocked.headers["Retry-After"])
        assert retry_after > 0

        doc = mongo_db.login_limits.find_one({"_id": ident})
        assert doc is not None
        assert doc["count"] == 6
    finally:
        for sess in sessions:
            sess.close()


# Feature: reserve_login_attempt must be atomic for concurrent requests
def test_lockout_atomicity_under_concurrency(random_identity):
    raw_email, _ = random_identity

    def worker(i):
        with requests.Session() as s:
            response = _login(
                s,
                raw_email,
                "wrong-password",
                extra_headers={"X-Forwarded-For": f"192.0.2.{i}"},
            )
            return response.status_code

    statuses = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(worker, i) for i in range(8)]
        for fut in as_completed(futures):
            statuses.append(fut.result())

    assert all(code in (401, 429) for code in statuses)
    assert statuses.count(401) <= 5
    assert statuses.count(429) >= 1


# Feature: expired window should reset attempts without waiting on TTL removal execution
def test_lockout_window_expiration_releases_new_attempts(http_session, mongo_db, random_identity):
    raw_email, ident = random_identity
    mongo_db.login_limits.update_one(
        {"_id": ident},
        {"$set": {"count": 6, "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)}},
        upsert=True,
    )

    res = _login(http_session, raw_email, "wrong-password")
    assert res.status_code == 401
    doc = mongo_db.login_limits.find_one({"_id": ident})
    assert doc is not None
    assert doc["count"] == 1


# Feature: successful admin login clears lockout count and sets auth cookie flags
def test_successful_login_clears_counter_and_sets_httponly_cookie(http_session, mongo_db):
    ident = hashlib.sha256(ADMIN_EMAIL.encode("utf-8")).hexdigest()
    mongo_db.login_limits.delete_one({"_id": ident})

    bad = _login(http_session, ADMIN_EMAIL, "wrong-password")
    assert bad.status_code == 401

    ok = _login(http_session, ADMIN_EMAIL, ADMIN_PASSWORD)
    assert ok.status_code == 200
    cookie_header = ok.headers.get("set-cookie", "")
    assert "access_token=" in cookie_header
    assert "HttpOnly" in cookie_header

    me = http_session.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me.status_code == 200
    assert me.json()["email"] == ADMIN_EMAIL

    doc = mongo_db.login_limits.find_one({"_id": ident})
    assert doc is None

    http_session.post(f"{BASE_URL}/api/auth/logout", timeout=30)


# Feature: auth seed/hash and CORS/TTL index checks
def test_admin_hash_is_bcrypt_2b(mongo_db):
    admin = mongo_db.users.find_one({"email": ADMIN_EMAIL})
    assert admin is not None
    password_hash = admin["password_hash"]
    assert isinstance(password_hash, str)
    assert password_hash.startswith("$2b$")
    assert bcrypt.checkpw(ADMIN_PASSWORD.encode("utf-8"), password_hash.encode("utf-8"))


def test_cors_preflight_allows_credentials_with_explicit_origin(http_session):
    preflight = http_session.options(
        f"{BASE_URL}/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=30,
    )
    assert preflight.status_code in (200, 204)
    assert preflight.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert preflight.headers.get("access-control-allow-credentials") == "true"


def test_login_limits_ttl_index_exists(mongo_db):
    indexes = list(mongo_db.login_limits.list_indexes())
    ttl = [idx for idx in indexes if idx.get("key") == {"expires_at": 1}]
    assert ttl, "TTL index on login_limits.expires_at not found"
    assert ttl[0].get("expireAfterSeconds") == 0
