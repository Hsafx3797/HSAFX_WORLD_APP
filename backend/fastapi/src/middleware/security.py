"""
Security middleware for FastAPI.

Adds security headers and Origin/CSRF validation to all responses.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from src.core.config import settings

# Safe HTTP methods that don't need Origin validation
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Allowed origins for CSRF validation
ALLOWED_ORIGINS: set[str] = {
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
    "https://hsafx.world",
    "https://www.hsafx.world",
    "https://admin.hsafx.world",
    "https://api.hsafx.world",
}

# Paths exempt from Origin validation (health checks, internal)
CSRF_EXEMPT_PATHS = {"/health", "/", "/openapi.json", "/docs", "/redoc"}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds standard security headers to every response and validates
    Origin header on state-changing requests (CSRF protection).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # ── CSRF: Validate Origin on state-changing methods ──
        if request.method not in SAFE_METHODS:
            path = request.url.path
            # Skip exempt paths and internal endpoints
            if not path.startswith("/internal/") and path not in CSRF_EXEMPT_PATHS:
                origin = request.headers.get("origin")
                referer = request.headers.get("referer")

                if origin:
                    if origin not in ALLOWED_ORIGINS:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Forbidden: invalid origin"},
                        )
                elif referer:
                    # Fallback: check Referer if Origin is missing
                    referer_origin = _extract_origin(referer)
                    if referer_origin and referer_origin not in ALLOWED_ORIGINS:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Forbidden: invalid referer"},
                        )
                # If neither Origin nor Referer, allow (could be server-to-server)
                # The AuthMiddleware handles authentication separately

        # ── Process request ──
        response = await call_next(request)

        # ── Security Headers ──
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"

        # HSTS only in production
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )

        return response


def _extract_origin(url: str) -> str | None:
    """Extract origin (scheme://host[:port]) from a URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        pass
    return None
