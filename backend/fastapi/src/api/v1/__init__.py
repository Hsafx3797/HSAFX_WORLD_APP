"""
API v1 Router

Per Backend Ownership Matrix:
  FastAPI = stateless compute only. No DB writes, no auth, no billing.
  Next.js = all state, auth, billing, catalog, user management.

Removed routers:
  /tools     — old per-tool-slug execution path (replaced by /execute/{engine})
  /jobs      — old Redis async job system (jobs managed by Next.js job-worker)
  /track     — migrated to engine #29 "tracking" (via /execute/tracking)
  admin, users, billing, categories, ads — violate ownership matrix
  auth, subscriptions, webhooks — removed in prior sessions
"""

from fastapi import APIRouter

router = APIRouter()
