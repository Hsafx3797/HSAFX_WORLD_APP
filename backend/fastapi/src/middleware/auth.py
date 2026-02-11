"""
Authentication Middleware — Compute-Only FastAPI

FastAPI is a stateless compute service. Per the Backend Ownership Matrix:
  - No database access for auth
  - No session cookie validation
  - Internal requests authenticated via X-Internal-Secret header
  - Public tool endpoints require no auth
  - Job/tracking endpoints are protected by the internal secret

For session-based auth, Next.js handles it in the tRPC layer BEFORE
dispatching compute requests to FastAPI.
"""

from typing import Callable, Optional

import structlog
from fastapi import HTTPException, Request, Response
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import settings

logger = structlog.get_logger()


class SessionUser(BaseModel):
    """User data passed from Next.js via trusted headers"""
    id: str
    email: str
    tier: str = "free"
    role: str = "user"


def _parse_internal_headers(request: Request) -> Optional[SessionUser]:
    """
    Trust internal service-to-service calls from Next.js.
    Requires X-Internal-Secret header matching the configured secret.
    User info is passed via X-User-Id, X-User-Email, X-User-Tier, X-User-Role.
    """
    secret = request.headers.get("X-Internal-Secret")
    if not secret or secret != settings.INTERNAL_SECRET:
        return None

    user_id = request.headers.get("X-User-Id")
    user_email = request.headers.get("X-User-Email")
    if not user_id:
        return None

    return SessionUser(
        id=user_id,
        email=user_email or "",
        tier=request.headers.get("X-User-Tier", "free"),
        role=request.headers.get("X-User-Role", "user"),
    )


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware for compute-only FastAPI:
    1. Parses X-Internal-Secret for service-to-service trust
    2. All /api/v1/* endpoints are publicly accessible (compute-only)
    3. /internal/* endpoints are protected by internal secret (handled in route)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Initialize user as None
        request.state.user = None

        # Parse internal headers if present
        user = _parse_internal_headers(request)
        if user:
            request.state.user = user
            logger.debug("Internal request authenticated", user_id=user.id)

        return await call_next(request)


async def get_current_user(request: Request) -> Optional[SessionUser]:
    """FastAPI dependency: returns user from request.state, or None."""
    return getattr(request.state, "user", None)


async def require_admin(request: Request) -> SessionUser:
    """FastAPI dependency: requires authenticated admin user."""
    user = getattr(request.state, "user", None)
    if not user or user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_super_admin(request: Request) -> SessionUser:
    """FastAPI dependency: requires authenticated super_admin user."""
    user = getattr(request.state, "user", None)
    if not user or user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user
