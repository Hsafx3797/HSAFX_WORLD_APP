"""
Rate Limiting Middleware
"""

from typing import Callable

import structlog
from fastapi import Request, Response
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import settings
from src.core.redis import get_redis

logger = structlog.get_logger()


def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key based on user or IP"""
    # If authenticated, use user ID
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"

    # Otherwise use IP address
    return f"ip:{get_remote_address(request)}"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/"]:
            return await call_next(request)

        # Get rate limit based on user tier
        user = getattr(request.state, "user", None)
        if user:
            tier = getattr(user, "tier", "free")
            if tier == "advance":
                limit = settings.RATE_LIMIT_ADVANCE
            elif tier == "pro":
                limit = settings.RATE_LIMIT_PRO
            else:
                limit = settings.RATE_LIMIT_FREE
        else:
            limit = settings.RATE_LIMIT_FREE

        # Check rate limit BEFORE processing request
        try:
            redis = await get_redis()
            key = get_rate_limit_key(request)
            env_prefix = "dev" if settings.DEBUG else "prod"
            rate_key = f"{env_prefix}:ratelimit:{key}:minute"

            current = await redis.incr(rate_key)
            if current == 1:
                await redis.expire(rate_key, 60)

            if current > limit:
                logger.warning("Rate limit exceeded", key=key, current=current, limit=limit)
                ttl = await redis.ttl(rate_key)
                return Response(
                    content='{"error": "Rate limit exceeded"}',
                    status_code=429,
                    media_type="application/json",
                    headers={
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(ttl),
                        "Retry-After": str(ttl),
                    },
                )

            # Only process request after rate limit passes
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current))
            response.headers["X-RateLimit-Reset"] = str(await redis.ttl(rate_key))

            return response

        except Exception as e:
            # If Redis is down, allow the request through
            logger.error("Rate limiting error", error=str(e))
            return await call_next(request)
