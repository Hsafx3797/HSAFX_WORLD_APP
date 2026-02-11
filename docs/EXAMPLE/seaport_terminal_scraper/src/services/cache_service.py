"""
Cache Service - In-memory TTL cache for vessel and container data
"""
import os
import time
from typing import Optional, List, Tuple

# In-memory caches with TTL
_vessel_cache: dict[str, tuple[float, list]] = {}
_container_cache: dict[tuple[str, str], tuple[float, list]] = {}


def get_cache_ttl_seconds() -> int:
    """Get cache TTL from environment or default to 300 seconds"""
    try:
        return int(os.getenv("CACHE_TTL", "300"))
    except Exception:
        return 300


def get_vessel_by_key(key: str) -> Optional[list]:
    """
    Get vessel data from cache by key
    Returns None if not found or expired
    """
    now = time.time()
    ent = _vessel_cache.get(key)
    if not ent:
        return None
    exp, data = ent
    if exp <= now:
        _vessel_cache.pop(key, None)
        return None
    return data


def put_vessel_by_key(key: str, data: list) -> None:
    """Put vessel data in cache with TTL"""
    exp = time.time() + get_cache_ttl_seconds()
    _vessel_cache[key] = (exp, data)


def get_vessel(name: str) -> Optional[list]:
    """Get vessel data by vessel name (case-insensitive)"""
    return get_vessel_by_key(name.strip().lower())


def put_vessel(name: str, data: list) -> None:
    """Put vessel data by vessel name (case-insensitive)"""
    put_vessel_by_key(name.strip().lower(), data)


def get_container(terminal: str, container_no: str) -> Optional[list]:
    """
    Get container data from cache
    Returns None if not found or expired
    """
    now = time.time()
    key = (terminal.strip().upper(), container_no.strip().upper())
    ent = _container_cache.get(key)
    if not ent:
        return None
    exp, data = ent
    if exp <= now:
        _container_cache.pop(key, None)
        return None
    return data


def put_container(terminal: str, container_no: str, data: list) -> None:
    """Put container data in cache with TTL"""
    exp = time.time() + get_cache_ttl_seconds()
    key = (terminal.strip().upper(), container_no.strip().upper())
    _container_cache[key] = (exp, data)


def clear_vessel_cache(vessel_name: Optional[str] = None, terminal: Optional[str] = None) -> int:
    """
    Clear vessel cache
    If vessel_name provided, clear specific vessel
    If terminal provided, clear vessels for that terminal
    Returns number of entries cleared
    """
    if not vessel_name and not terminal:
        count = len(_vessel_cache)
        _vessel_cache.clear()
        return count
    
    if vessel_name:
        key = vessel_name.strip().lower()
        if terminal:
            key = f"{terminal.upper()}:{key}"
        if key in _vessel_cache:
            del _vessel_cache[key]
            return 1
        return 0
    
    # Clear by terminal prefix
    if terminal:
        prefix = f"{terminal.upper()}:"
        keys_to_delete = [k for k in _vessel_cache.keys() if isinstance(k, str) and k.startswith(prefix)]
        for k in keys_to_delete:
            del _vessel_cache[k]
        return len(keys_to_delete)
    
    return 0


def clear_container_cache(container_no: Optional[str] = None, terminal: Optional[str] = None) -> int:
    """
    Clear container cache
    If container_no provided, clear specific container
    If terminal provided, clear containers for that terminal
    Returns number of entries cleared
    """
    if not container_no and not terminal:
        count = len(_container_cache)
        _container_cache.clear()
        return count
    
    if container_no and terminal:
        key = (terminal.strip().upper(), container_no.strip().upper())
        if key in _container_cache:
            del _container_cache[key]
            return 1
        return 0
    
    if container_no:
        # Clear container across all terminals
        container_upper = container_no.strip().upper()
        keys_to_delete = [k for k in _container_cache.keys() if k[1] == container_upper]
        for k in keys_to_delete:
            del _container_cache[k]
        return len(keys_to_delete)
    
    if terminal:
        # Clear all containers for terminal
        terminal_upper = terminal.strip().upper()
        keys_to_delete = [k for k in _container_cache.keys() if k[0] == terminal_upper]
        for k in keys_to_delete:
            del _container_cache[k]
        return len(keys_to_delete)
    
    return 0


def clear_all_cache() -> Tuple[int, int]:
    """
    Clear all caches
    Returns (vessel_count, container_count)
    """
    vessel_count = len(_vessel_cache)
    container_count = len(_container_cache)
    _vessel_cache.clear()
    _container_cache.clear()
    return vessel_count, container_count


def get_cache_stats() -> dict:
    """Get cache statistics"""
    return {
        "vessel_cache_size": len(_vessel_cache),
        "container_cache_size": len(_container_cache),
        "ttl_seconds": get_cache_ttl_seconds(),
    }
