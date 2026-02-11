"""FastAPI Dependencies - Auth, Rate Limiting"""
import os
from fastapi import Request, HTTPException


def get_rate_limit(name: str, default: str) -> str:
    """Get rate limit from environment"""
    return os.getenv(name, default)


def require_api_key(request: Request) -> None:
    """
    Require API key authentication
    Checks X-API-Key header or Authorization Bearer token
    """
    allowed = os.getenv("API_KEYS", "").strip()
    if not allowed:
        return
    
    keys = {k.strip() for k in allowed.split(",") if k.strip()}
    if not keys:
        return
    
    h = request.headers.get("x-api-key") or request.headers.get("authorization", "")
    token = None
    
    if h:
        if h.lower().startswith("bearer "):
            token = h[7:].strip()
        else:
            token = h.strip()
    
    if not token or token not in keys:
        raise HTTPException(status_code=401, detail="Unauthorized")


def require_admin_key(request: Request) -> None:
    """
    Require admin API key
    Falls back to regular API key if admin keys not configured
    """
    admin = os.getenv("ADMIN_API_KEYS", "").strip()
    if admin:
        os.environ.setdefault("API_KEYS", admin)
    require_api_key(request)
