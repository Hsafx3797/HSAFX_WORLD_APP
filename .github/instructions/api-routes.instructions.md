---
applyTo: 'apps/web/src/app/api/**'
description: 'API route authoring rules for the HSAFX B2B API surface.'
---

# API Route Authoring Rules

## Execution Flow (Every Engine Route)

Every request to `POST /api/v1/engine/{name}` must follow this exact chain — no shortcuts:

```
authenticateApiKey()
  → requireScope('tools:execute')
  → checkB2bQuota()
  → resolve engine runtime (rust | node | python)
  → engine.execute(input, options)
  → incrementB2bUsage()
  → 202 + jobId
```

## Graph-Verified Route Architecture (Community 0 — 192 nodes)

Community 0 is the largest community in the graph (cohesion 0.01 — broadly connected). It contains: `EngineExecuteRequest`, `EngineExecuteResponse`, `EngineInfo`, `execute_engine()`, `JobCompleteCallback`, `list_engines()`, `_process_engine_and_callback()` — these are the core B2B API types. Do not add new execution entry points outside this pattern.

## Rate Limiting (Community 18 — cohesion 0.17)

Rate limiting uses Redis-backed limiters. Four types exist:
- `checkApiKeyRateLimit()` — per API key, used on engine routes
- `checkAuthRateLimit()` — per auth attempt
- `checkIpRateLimit()` — per IP fallback
- `checkUserRateLimit()` — per authenticated user

Every new API route must use the appropriate rate limiter. Get the Redis client via `getEdgeRedis()`.

## Auth Security (Community 20 — cohesion 0.19)

Login-related routes use brute-force protection:
- `checkLoginAttempt()` → `recordFailedLogin()` → `lockoutKey()`
- `resetLoginFailures()` after successful login
- `hashEmail()` before storing in Redis keys (PII protection)
- `captureException()` for unexpected auth errors

New auth endpoints must call `checkLoginAttempt()` before attempting credential verification.

## Billing Integration (Community 11 — cohesion 0.06)

Billing webhook routes call:
- `findB2bPlan()` / `findB2cPlan()` — plan lookup
- `handleCheckoutCompleted()`, `handleOrderPaid()`, `handleRefundCreated()`, `handleSubscriptionCanceled()`, `handleSubscriptionCreated()` — Polar event handlers

Webhook routes require signature verification. Do not process Polar webhooks without verifying the `dispatch()` signature first.

## Job System (Community 0 overlap)

Engine execution returns `202 + jobId` immediately (async). The job system:
- `createBatchJob()` / `getBatchJobStatus()` / `getUserBatchJobs()` (Community 57, cohesion 0.53) — batch jobs
- Job completion calls `JobCompleteCallback` which POSTs back to the originating service

Do not make engine execution routes synchronous — the job worker handles actual execution.

## Internal Communication (Community 23 — cohesion 0.14)

Next.js ↔ FastAPI internal calls use:
- Route: `/internal/execute` on FastAPI
- Auth: `X-Internal-Secret` header (not the public API key)
- Pattern: `_execute_native_tool()` → `_process_and_callback()` → POST result back to Next.js

Do not expose `/internal/` routes publicly. The `X-Internal-Secret` header must be validated by `AuthMiddleware` in FastAPI before processing.

## What Has Been Deleted (Do Not Re-add)

- `/api/v1/text/**`, `/api/v1/data/**`, `/api/v1/generate/**`, `/api/v1/validate/**`, `/api/v1/calculate/**`, `/api/v1/convert/**` — category routes are gone
- `/api/v1/engine/execute` (POST without name) — old generic route, gone
- `/api/v1/engine/list` — replaced by `/api/v1/engines`
- `category-route-handler.ts` — deleted
- `/tools/**` routes — all 4 legacy tool routes are deleted

## Active Routes (B2B Only)

```
POST /api/v1/engine/{name}          ← Execute engine, returns 202 + jobId
GET  /api/v1/engines                ← List 30 engines + schemas
GET  /api/v1/engine/{name}/schema   ← Schema for one engine
```

No B2C coin billing for engine routes. B2B quota enforcement only via `checkB2bQuota()` and `incrementB2bUsage()`.
