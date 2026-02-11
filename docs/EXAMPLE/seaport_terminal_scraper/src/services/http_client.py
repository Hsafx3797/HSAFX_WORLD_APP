"""
HTTP Client Service - Shared HTTP client with retry, rate limiting, and metrics
"""
import os
import asyncio
import json as _json
from typing import Optional, List
import httpx
from aiolimiter import AsyncLimiter
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from prometheus_client import Counter, Histogram

from src.core.utils import req_timeout, default_upstream_headers

# Prometheus metrics
UPSTREAM_REQUESTS = Counter(
    "ff_upstream_requests_total",
    "Upstream HTTP requests",
    ["provider", "op", "method", "status"],
)
UPSTREAM_LATENCY = Histogram(
    "ff_upstream_request_latency_seconds",
    "Upstream request latency",
    ["provider", "op", "method"],
)

# Provider-scoped rate limiters and semaphores
_UPSTREAM_LIMITERS: dict[str, AsyncLimiter] = {}
_UPSTREAM_SEMAPHORES: dict[str, asyncio.Semaphore] = {}

# Retry configuration
_SCRAPER_MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", "3"))
_SCRAPER_RETRY_MIN = float(os.getenv("SCRAPER_RETRY_MIN", "1"))
_SCRAPER_RETRY_MAX = float(os.getenv("SCRAPER_RETRY_MAX", "8"))


def get_provider_rps(provider: str) -> int:
    """Get requests per second limit for provider"""
    p = (provider or "GENERIC").upper()
    return int(os.getenv(f"{p}_RPS", os.getenv("UPSTREAM_RPS", "5")))


def get_provider_concurrency(provider: str) -> int:
    """Get max concurrent requests for provider"""
    p = (provider or "GENERIC").upper()
    return int(os.getenv(f"{p}_CONCURRENCY", os.getenv("UPSTREAM_CONCURRENCY", "5")))


def get_upstream_controls(provider: str) -> tuple[AsyncLimiter, asyncio.Semaphore]:
    """
    Get or create rate limiter and semaphore for provider
    Returns (limiter, semaphore)
    """
    p = (provider or "GENERIC").upper()
    lim = _UPSTREAM_LIMITERS.get(p)
    sem = _UPSTREAM_SEMAPHORES.get(p)
    
    if lim is None:
        lim = AsyncLimiter(get_provider_rps(p), time_period=1)
        _UPSTREAM_LIMITERS[p] = lim
    
    if sem is None:
        sem = asyncio.Semaphore(get_provider_concurrency(p))
        _UPSTREAM_SEMAPHORES[p] = sem
    
    return lim, sem


@retry(
    stop=stop_after_attempt(_SCRAPER_MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=_SCRAPER_RETRY_MIN, max=_SCRAPER_RETRY_MAX),
    retry=retry_if_exception_type((httpx.HTTPError, asyncio.TimeoutError)),
    reraise=True,
)
async def fetch_json_list(
    url: str,
    payload: dict,
    prefer: str = "POST",
    provider: str = "GENERIC",
    op: str = "generic"
) -> list:
    """
    Fetch JSON list from URL with retry, rate limiting, and method fallback
    
    Args:
        url: Target URL
        payload: Request payload (used as params for GET, data for POST)
        prefer: Preferred method ("POST" or "GET")
        provider: Provider name for rate limiting (e.g., "QICT", "KICT")
        op: Operation name for metrics (e.g., "vessel", "container")
    
    Returns:
        List parsed from JSON response
    
    Raises:
        httpx.HTTPError: On HTTP errors after retries
        asyncio.TimeoutError: On timeout after retries
    """
    methods = [prefer, "GET" if prefer == "POST" else "POST"]
    limiter, semaphore = get_upstream_controls(provider)
    last_exc = None
    
    async with httpx.AsyncClient(timeout=req_timeout(), headers=default_upstream_headers()) as client:
        for method in methods:
            try:
                async with limiter:
                    async with semaphore:
                        import time
                        start = time.perf_counter()
                        
                        if method == "POST":
                            r = await client.post(url, data=payload)
                        else:
                            r = await client.get(url, params=payload)
                        
                        elapsed = time.perf_counter() - start
                        status = r.status_code
                        
                        # Record metrics
                        UPSTREAM_REQUESTS.labels(
                            provider=provider,
                            op=op,
                            method=method,
                            status=str(status)
                        ).inc()
                        UPSTREAM_LATENCY.labels(
                            provider=provider,
                            op=op,
                            method=method
                        ).observe(elapsed)
                        
                        r.raise_for_status()
                        
                        # Parse JSON response
                        data = r.json()
                        if isinstance(data, str):
                            try:
                                data = _json.loads(data)
                            except Exception:
                                data = []
                        
                        if not isinstance(data, list):
                            return []
                        
                        return data
                        
            except Exception as e:
                last_exc = e
                # Try next method if available
                if method == methods[-1]:
                    # Last method failed, re-raise
                    raise
                continue
    
    # Should not reach here due to raise above
    if last_exc:
        raise last_exc
    return []
