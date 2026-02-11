"""
HTTP Connection Pool Manager
Provides persistent HTTP clients for terminal scrapers to improve performance
WITHOUT modifying scraper logic
"""

import os
from typing import Dict, Optional
import httpx
from contextvars import ContextVar

# Global connection pool: terminal name -> persistent AsyncClient
_TERMINAL_CLIENTS: Dict[str, httpx.AsyncClient] = {}
_POOL_INITIALIZED = False

# Connection pool configuration (optimized for performance)
DEFAULT_MAX_KEEPALIVE = 50  # Increased from 20 for better connection reuse
DEFAULT_MAX_CONNECTIONS = 100  # Increased from 50 for higher concurrency
DEFAULT_KEEPALIVE_EXPIRY = 30.0  # seconds


def get_pool_config(terminal: str) -> dict:
    """Get connection pool configuration for a terminal"""
    terminal_upper = terminal.upper()
    
    return {
        "max_keepalive_connections": int(os.getenv(
            f"{terminal_upper}_MAX_KEEPALIVE",
            os.getenv("SCRAPER_MAX_KEEPALIVE", str(DEFAULT_MAX_KEEPALIVE))
        )),
        "max_connections": int(os.getenv(
            f"{terminal_upper}_MAX_CONNECTIONS",
            os.getenv("SCRAPER_MAX_CONNECTIONS", str(DEFAULT_MAX_CONNECTIONS))
        )),
        "keepalive_expiry": float(os.getenv(
            f"{terminal_upper}_KEEPALIVE_EXPIRY",
            os.getenv("SCRAPER_KEEPALIVE_EXPIRY", str(DEFAULT_KEEPALIVE_EXPIRY))
        )),
    }


def create_client_for_terminal(
    terminal: str,
    timeout: httpx.Timeout,
    headers: dict,
    verify: Optional[bool | str] = True,
    http2: bool = True  # Enable HTTP/2 by default
) -> httpx.AsyncClient:
    """
    Create a persistent AsyncClient for a terminal with optimized connection pooling
    
    Args:
        terminal: Terminal name (e.g., "QICT", "KICT")
        timeout: Timeout configuration
        headers: Default headers
        verify: SSL verification (bool or path to CA bundle)
        http2: Enable HTTP/2 support
        
    Returns:
        Configured AsyncClient with connection pooling
    """
    pool_config = get_pool_config(terminal)
    
    limits = httpx.Limits(
        max_keepalive_connections=pool_config["max_keepalive_connections"],
        max_connections=pool_config["max_connections"],
        keepalive_expiry=pool_config["keepalive_expiry"],
    )
    
    return httpx.AsyncClient(
        timeout=timeout,
        headers=headers,
        verify=verify,
        limits=limits,
        http2=http2,
        follow_redirects=True,
    )


async def get_terminal_client(
    terminal: str,
    timeout: httpx.Timeout,
    headers: dict,
    verify: Optional[bool | str] = True,
    http2: bool = True  # Enable HTTP/2 by default for 15-30% performance gain
) -> httpx.AsyncClient:
    """
    Get or create a persistent client for a terminal
    
    This function returns a cached client if available, creating one if needed.
    The client persists across requests to reuse connections.
    
    Args:
        terminal: Terminal name (e.g., "QICT")
        timeout: Timeout configuration
        headers: Default headers
        verify: SSL verification
        http2: Enable HTTP/2
        
    Returns:
        Persistent AsyncClient for the terminal
    """
    terminal_key = terminal.upper()
    
    if terminal_key not in _TERMINAL_CLIENTS:
        _TERMINAL_CLIENTS[terminal_key] = create_client_for_terminal(
            terminal=terminal_key,
            timeout=timeout,
            headers=headers,
            verify=verify,
            http2=http2
        )
    
    return _TERMINAL_CLIENTS[terminal_key]


async def close_terminal_client(terminal: str) -> None:
    """Close and remove a terminal's client from the pool"""
    terminal_key = terminal.upper()
    if terminal_key in _TERMINAL_CLIENTS:
        client = _TERMINAL_CLIENTS.pop(terminal_key)
        await client.aclose()


async def close_all_clients() -> None:
    """Close all clients in the pool (call on app shutdown)"""
    for terminal_key, client in list(_TERMINAL_CLIENTS.items()):
        try:
            await client.aclose()
        except Exception:
            pass  # Ignore errors during shutdown
    _TERMINAL_CLIENTS.clear()


def get_pool_stats() -> dict:
    """Get connection pool statistics"""
    return {
        "active_terminals": list(_TERMINAL_CLIENTS.keys()),
        "pool_size": len(_TERMINAL_CLIENTS),
        "terminals": {
            terminal: {
                "is_closed": client.is_closed,
            }
            for terminal, client in _TERMINAL_CLIENTS.items()
        }
    }


# Context manager for temporary clients (when pool is not desired)
class TemporaryClient:
    """Context manager for one-off HTTP clients that don't use the pool"""
    
    def __init__(self, timeout: httpx.Timeout, headers: dict, verify: bool = True):
        self.timeout = timeout
        self.headers = headers
        self.verify = verify
        self.client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self) -> httpx.AsyncClient:
        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers=self.headers,
            verify=self.verify
        )
        return self.client
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
