"""
API v1 Router

Per Backend Ownership Matrix (22_BACKEND_OWNERSHIP_MATRIX.md):
  FastAPI = stateless compute only. No DB writes, no auth, no billing.
  Next.js = all state, auth, billing, catalog, user management.

Active routers:
  /tools     — tool execution + validation (compute)
  /jobs      — async job orchestration (Redis)

Removed routers:
  /track     — migrated to engine #29 "tracking" (via /execute/tracking)

Deprecated routers (moved to _*_DEPRECATED.py):
  admin, users, billing, categories, ads — all violate ownership matrix
  auth, subscriptions, webhooks — removed in prior sessions
"""

from fastapi import APIRouter

from src.api.v1.jobs import router as jobs_router
from src.api.v1.tools import router as tools_router

router = APIRouter()

router.include_router(tools_router, prefix="/tools", tags=["Tools"])
router.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
