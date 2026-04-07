"""
Redis Connection Management
"""

from __future__ import annotations

from typing import Optional

import redis.asyncio as redis
import structlog

from src.core.config import settings

logger = structlog.get_logger()

_redis_client: Optional[redis.Redis] = None


async def init_redis() -> None:
    """Initialize Redis connection"""
    global _redis_client

    redacted_url = (
        settings.final_redis_url.replace(settings.final_redis_url.split(":")[2].split("@")[0], "***")
        if "@" in settings.final_redis_url
        else settings.final_redis_url
    )
    logger.info("Initializing Redis connection", url=redacted_url)

    _redis_client = redis.from_url(
        settings.final_redis_url,
        encoding="utf-8",
        decode_responses=True,
    )

    # Test connection
    await _redis_client.ping()

    logger.info("Redis connection established")


async def close_redis() -> None:
    """Close Redis connection"""
    global _redis_client

    if _redis_client:
        logger.info("Closing Redis connection")
        await _redis_client.close()
        _redis_client = None


async def get_redis() -> redis.Redis:
    """Get Redis client dependency"""
    if _redis_client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis_client


class RedisCache:
    """Redis cache utility class"""

    def __init__(self, prefix: str | None = None):
        if prefix is not None:
            self.prefix = prefix
        else:
            # Environment-aware prefix: "dev" or "prod"
            env = "dev" if settings.DEBUG else "prod"
            self.prefix = env

    def _key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Optional[str]:
        """Get a value from cache"""
        client = await get_redis()
        return await client.get(self._key(key))

    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None,
    ) -> None:
        """Set a value in cache"""
        client = await get_redis()
        await client.set(self._key(key), value, ex=ttl or settings.REDIS_CACHE_TTL)

    async def delete(self, key: str) -> None:
        """Delete a value from cache"""
        client = await get_redis()
        await client.delete(self._key(key))

    async def exists(self, key: str) -> bool:
        """Check if a key exists"""
        client = await get_redis()
        return await client.exists(self._key(key)) > 0

    async def incr(self, key: str, amount: int = 1) -> int:
        """Increment a counter"""
        client = await get_redis()
        return await client.incrby(self._key(key), amount)

    async def expire(self, key: str, ttl: int) -> None:
        """Set expiration on a key"""
        client = await get_redis()
        await client.expire(self._key(key), ttl)

    # ── Sorted Sets ──────────────────────────────────────────────

    async def zadd(self, key: str, mapping: dict[str, float]) -> int:
        """Add members to sorted set with scores"""
        client = await get_redis()
        prefixed = {m: s for m, s in mapping.items()}
        return await client.zadd(self._key(key), prefixed)

    async def zrank(self, key: str, member: str) -> int | None:
        """Get rank of member in sorted set (0-based)"""
        client = await get_redis()
        return await client.zrank(self._key(key), member)

    async def zrem(self, key: str, *members: str) -> int:
        """Remove members from sorted set"""
        client = await get_redis()
        return await client.zrem(self._key(key), *members)

    # ── Sets ─────────────────────────────────────────────────────

    async def sadd(self, key: str, *members: str) -> int:
        """Add members to a set"""
        client = await get_redis()
        return await client.sadd(self._key(key), *members)

    async def smembers(self, key: str) -> set[str]:
        """Get all members of a set"""
        client = await get_redis()
        return await client.smembers(self._key(key))

    # ── Lists ────────────────────────────────────────────────────

    async def lpush(self, key: str, *values: str) -> int:
        """Push values to the head of a list"""
        client = await get_redis()
        return await client.lpush(self._key(key), *values)


# Default cache instance
cache = RedisCache()
