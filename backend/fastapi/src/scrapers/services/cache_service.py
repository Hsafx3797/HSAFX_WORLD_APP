"""
Cache Service - Redis-backed TTL cache for vessel and container data

Tool 446 - Seaport Terminal Container Activity Tracker
Default TTL: 300 seconds (5 minutes)
Falls back to in-memory cache if Redis is unavailable.
"""

from __future__ import annotations

import json
import os
import time
from typing import Optional, Tuple

import structlog

from src.core.redis import get_redis

logger = structlog.get_logger()

# In-memory fallback caches (used only when Redis is unavailable)
_vessel_fallback: dict[str, tuple[float, list]] = {}
_container_fallback: dict[str, tuple[float, list]] = {}

_KEY_PREFIX = "scraper:cache"


def get_cache_ttl_seconds() -> int:
    """Get cache TTL from environment or default to 300 seconds"""
    try:
        return int(os.getenv("CACHE_TTL", "300"))
    except Exception:
        return 300


def _vessel_key(name: str) -> str:
    return f"{_KEY_PREFIX}:vessel:{name.strip().lower()}"


def _container_key(terminal: str, container_no: str) -> str:
    return f"{_KEY_PREFIX}:container:{terminal.strip().upper()}:{container_no.strip().upper()}"


# ── Vessel cache ────────────────────────────────────────────────


async def get_vessel_by_key(key: str) -> Optional[list]:
    """Get vessel data from Redis by raw key. Returns None if not found or expired."""
    redis_key = f"{_KEY_PREFIX}:vessel:{key}"
    try:
        client = await get_redis()
        raw = await client.get(redis_key)
        if raw is not None:
            return json.loads(raw)
    except Exception:
        # Fallback to in-memory
        ent = _vessel_fallback.get(key)
        if ent and ent[0] > time.time():
            return ent[1]
        _vessel_fallback.pop(key, None)
    return None


async def put_vessel_by_key(key: str, data: list) -> None:
    """Put vessel data in cache with TTL"""
    redis_key = f"{_KEY_PREFIX}:vessel:{key}"
    ttl = get_cache_ttl_seconds()
    try:
        client = await get_redis()
        await client.set(redis_key, json.dumps(data), ex=ttl)
    except Exception:
        _vessel_fallback[key] = (time.time() + ttl, data)


async def get_vessel(name: str) -> Optional[list]:
    """Get vessel data by vessel name (case-insensitive)"""
    return await get_vessel_by_key(name.strip().lower())


async def put_vessel(name: str, data: list) -> None:
    """Put vessel data by vessel name (case-insensitive)"""
    await put_vessel_by_key(name.strip().lower(), data)


# ── Container cache ─────────────────────────────────────────────


async def get_container(terminal: str, container_no: str) -> Optional[list]:
    """Get container data from cache. Returns None if not found or expired."""
    redis_key = _container_key(terminal, container_no)
    fallback_key = f"{terminal.strip().upper()}:{container_no.strip().upper()}"
    try:
        client = await get_redis()
        raw = await client.get(redis_key)
        if raw is not None:
            return json.loads(raw)
    except Exception:
        ent = _container_fallback.get(fallback_key)
        if ent and ent[0] > time.time():
            return ent[1]
        _container_fallback.pop(fallback_key, None)
    return None


async def put_container(terminal: str, container_no: str, data: list) -> None:
    """Put container data in cache with TTL"""
    redis_key = _container_key(terminal, container_no)
    fallback_key = f"{terminal.strip().upper()}:{container_no.strip().upper()}"
    ttl = get_cache_ttl_seconds()
    try:
        client = await get_redis()
        await client.set(redis_key, json.dumps(data), ex=ttl)
    except Exception:
        _container_fallback[fallback_key] = (time.time() + ttl, data)


# ── Clear operations ────────────────────────────────────────────


async def clear_vessel_cache(vessel_name: Optional[str] = None, terminal: Optional[str] = None) -> int:
    """
    Clear vessel cache entries from Redis.
    If vessel_name provided, clear specific vessel.
    If terminal provided, clear vessels matching terminal prefix.
    Returns number of entries cleared.
    """
    try:
        client = await get_redis()

        if not vessel_name and not terminal:
            keys = []
            async for k in client.scan_iter(match=f"{_KEY_PREFIX}:vessel:*"):
                keys.append(k)
            if keys:
                await client.delete(*keys)
            _vessel_fallback.clear()
            return len(keys)

        if vessel_name:
            key = vessel_name.strip().lower()
            if terminal:
                key = f"{terminal.upper()}:{key}"
            redis_key = f"{_KEY_PREFIX}:vessel:{key}"
            deleted = await client.delete(redis_key)
            _vessel_fallback.pop(key, None)
            return deleted

        if terminal:
            prefix = f"{_KEY_PREFIX}:vessel:{terminal.upper()}:"
            keys = []
            async for k in client.scan_iter(match=f"{prefix}*"):
                keys.append(k)
            if keys:
                await client.delete(*keys)
            # Clear matching fallback entries
            fb_prefix = f"{terminal.upper()}:"
            fb_keys = [k for k in _vessel_fallback if k.startswith(fb_prefix)]
            for k in fb_keys:
                del _vessel_fallback[k]
            return len(keys)
    except Exception:
        logger.warning("Redis unavailable for clear_vessel_cache, clearing fallback only")
        if not vessel_name and not terminal:
            count = len(_vessel_fallback)
            _vessel_fallback.clear()
            return count
        return 0

    return 0


async def clear_container_cache(container_no: Optional[str] = None, terminal: Optional[str] = None) -> int:
    """
    Clear container cache entries from Redis.
    Returns number of entries cleared.
    """
    try:
        client = await get_redis()

        if not container_no and not terminal:
            keys = []
            async for k in client.scan_iter(match=f"{_KEY_PREFIX}:container:*"):
                keys.append(k)
            if keys:
                await client.delete(*keys)
            _container_fallback.clear()
            return len(keys)

        if container_no and terminal:
            redis_key = _container_key(terminal, container_no)
            deleted = await client.delete(redis_key)
            fb_key = f"{terminal.strip().upper()}:{container_no.strip().upper()}"
            _container_fallback.pop(fb_key, None)
            return deleted

        if container_no:
            container_upper = container_no.strip().upper()
            keys = []
            async for k in client.scan_iter(match=f"{_KEY_PREFIX}:container:*:{container_upper}"):
                keys.append(k)
            if keys:
                await client.delete(*keys)
            fb_keys = [k for k in _container_fallback if k.endswith(f":{container_upper}")]
            for k in fb_keys:
                del _container_fallback[k]
            return len(keys)

        if terminal:
            terminal_upper = terminal.strip().upper()
            keys = []
            async for k in client.scan_iter(match=f"{_KEY_PREFIX}:container:{terminal_upper}:*"):
                keys.append(k)
            if keys:
                await client.delete(*keys)
            fb_keys = [k for k in _container_fallback if k.startswith(f"{terminal_upper}:")]
            for k in fb_keys:
                del _container_fallback[k]
            return len(keys)
    except Exception:
        logger.warning("Redis unavailable for clear_container_cache, clearing fallback only")
        if not container_no and not terminal:
            count = len(_container_fallback)
            _container_fallback.clear()
            return count
        return 0

    return 0


async def clear_all_cache() -> Tuple[int, int]:
    """Clear all caches. Returns (vessel_count, container_count)."""
    v = await clear_vessel_cache()
    c = await clear_container_cache()
    return v, c


async def get_cache_stats() -> dict:
    """Get cache statistics"""
    vessel_count = 0
    container_count = 0
    try:
        client = await get_redis()
        async for _ in client.scan_iter(match=f"{_KEY_PREFIX}:vessel:*"):
            vessel_count += 1
        async for _ in client.scan_iter(match=f"{_KEY_PREFIX}:container:*"):
            container_count += 1
    except Exception:
        vessel_count = len(_vessel_fallback)
        container_count = len(_container_fallback)

    return {
        "vessel_cache_size": vessel_count,
        "container_cache_size": container_count,
        "ttl_seconds": get_cache_ttl_seconds(),
        "backend": "redis",
    }
