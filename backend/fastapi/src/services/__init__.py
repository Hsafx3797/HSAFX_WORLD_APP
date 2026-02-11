"""
Services — Compute-Only

FastAPI is a stateless compute service. Only ToolService remains (no DB).
All DB-backed services (users, coins, usage, billing, auth, subscriptions)
have been deprecated and moved to _*_DEPRECATED.py files.
Next.js tRPC owns all state management.
"""

from src.services.tools import ToolService

__all__ = [
    "ToolService",
]
