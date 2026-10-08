"""Account-scoped attempts remain stable behind load balancers."""
import hashlib
import math
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from pymongo import ReturnDocument


async def reserve_login_attempt(db, email):
    identifier = hashlib.sha256(email.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=15)
    # Reserve atomically: parallel requests cannot all pass the fifth attempt.
    attempt = await db.login_limits.find_one_and_update(
        {"_id": identifier},
        [
            {"$set": {"count": {"$cond": [
                {"$lte": [{"$ifNull": ["$expires_at", now]}, now]},
                1, {"$min": [{"$add": ["$count", 1]}, 6]},
            ]}}},
            {"$set": {"expires_at": {"$cond": [
                {"$in": ["$count", [1, 5]]}, expires, "$expires_at",
            ]}}},
        ],
        upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0},
    )
    if attempt["count"] > 5:
        remaining = max(1, math.ceil((attempt["expires_at"].replace(tzinfo=timezone.utc) - now).total_seconds()))
        raise HTTPException(429, "Muitas tentativas. Aguarde 15 minutos para tentar novamente.", headers={"Retry-After": str(remaining)})
    return identifier