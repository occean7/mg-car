import asyncio

import pytest
from fastapi import HTTPException

import object_storage


class FakeBody:
    def __init__(self, data):
        self.data = data

    def read(self):
        return self.data


class FakeS3:
    def __init__(self):
        self.objects = {}

    def put_object(self, **kwargs):
        self.objects[(kwargs["Bucket"], kwargs["Key"])] = {
            "Body": kwargs["Body"], "ContentType": kwargs["ContentType"]
        }

    def get_object(self, **kwargs):
        obj = self.objects[(kwargs["Bucket"], kwargs["Key"])]
        return {"Body": FakeBody(obj["Body"]), "ContentType": obj["ContentType"]}


@pytest.fixture(autouse=True)
def configured(monkeypatch):
    monkeypatch.setenv("STORAGE_BUCKET", "test-bucket")
    monkeypatch.setenv("STORAGE_ENDPOINT_URL", "https://account.r2.cloudflarestorage.com")
    monkeypatch.setenv("STORAGE_ACCESS_KEY_ID", "test-access")
    monkeypatch.setenv("STORAGE_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("STORAGE_REGION", "auto")
    monkeypatch.setattr(object_storage, "_client", FakeS3())


def test_put_and_get_round_trip():
    async def scenario():
        put = await object_storage.storage_request(
            "PUT", "mg-car/uploads/user/photo.jpg", b"jpeg-bytes"
        )
        assert put.json()["path"] == "mg-car/uploads/user/photo.jpg"
        got = await object_storage.storage_request("GET", put.json()["path"])
        assert got.content == b"jpeg-bytes"
        assert got.content_type == "image/jpeg"
    asyncio.run(scenario())


def test_rejects_path_traversal():
    async def scenario():
        with pytest.raises(HTTPException) as exc:
            await object_storage.storage_request("GET", "mg-car/../private.txt")
        assert exc.value.status_code == 400
    asyncio.run(scenario())


def test_storage_configuration_is_explicit(monkeypatch):
    monkeypatch.delenv("STORAGE_SECRET_ACCESS_KEY")
    assert not object_storage.storage_configured()
