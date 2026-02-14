# HSAFX World App — Comprehensive Codebase Review

> **Audit Date:** June 2025  
> **Scope:** Full monorepo — 8 packages, 2 apps, 2 backend services, infrastructure  
> **Files Analyzed:** 200+ source files across TypeScript, Python, Rust, Docker, Kubernetes

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Critical Issues (P0)](#3-critical-issues-p0)
4. [High-Priority Issues (P1)](#4-high-priority-issues-p1)
5. [Medium-Priority Issues (P2)](#5-medium-priority-issues-p2)
6. [Low-Priority Issues (P3)](#6-low-priority-issues-p3)
7. [Package-by-Package Analysis](#7-package-by-package-analysis)
   - 7.1 [packages/shared](#71-packagesshared)
   - 7.2 [packages/api](#72-packagesapi)
   - 7.3 [packages/db](#73-packagesdb)
   - 7.4 [packages/schemas](#74-packagesschemas)
   - 7.5 [packages/theme](#75-packagestheme)
   - 7.6 [packages/tool-definitions](#76-packagestool-definitions)
   - 7.7 [packages/tools](#77-packagestools)
   - 7.8 [packages/ui](#78-packagesui)
8. [Application Analysis](#8-application-analysis)
   - 8.1 [apps/web](#81-appsweb)
   - 8.2 [apps/admin](#82-appsadmin)
9. [Backend Services Analysis](#9-backend-services-analysis)
   - 9.1 [backend/fastapi](#91-backendfastapi)
   - 9.2 [backend/rust](#92-backendrust)
10. [Infrastructure Analysis](#10-infrastructure-analysis)
    - 10.1 [Docker](#101-docker)
    - 10.2 [Kubernetes](#102-kubernetes)
    - 10.3 [Scripts](#103-scripts)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Test Coverage Assessment](#12-test-coverage-assessment)
13. [Security Audit Summary](#13-security-audit-summary)
14. [Performance Recommendations](#14-performance-recommendations)
15. [Recommended Action Plan](#15-recommended-action-plan)

---

## 1. Executive Summary

HSAFX World App is an ambitious, well-structured monorepo delivering 446+ professional tools as a SaaS platform. The architecture demonstrates strong engineering decisions: Turborepo for orchestration, shared packages for code reuse, a dual-billing system (Stripe + Polar), RBAC with CASL, and a multi-runtime backend (Node.js + Python + Rust WASM).

**However, the audit identified 18 critical (P0) issues, 22 high-priority (P1) issues, and 40+ medium/low issues that must be addressed before production readiness.**

### Key Findings

| Category     | P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low) |
| ------------ | :-----------: | :-------: | :---------: | :------: |
| Security     |      10       |     8     |      6      |    3     |
| Bugs         |       6       |     9     |     12      |    8     |
| Performance  |       1       |     3     |      5      |    4     |
| Architecture |       1       |     2     |      4      |    6     |
| **Totals**   |    **18**     |  **22**   |   **27**    |  **21**  |

### Top 5 Most Urgent Issues

1. **Missing auth checks on ALL admin API routes** — Any authenticated user can manage users, tools, feature flags, and view the dashboard
2. **Coin reservation lifecycle broken** — Reservations are never confirmed/released on job completion, causing permanent coin loss for users
3. **FFmpeg command injection** — User-supplied options interpolated into shell commands without validation
4. **Fake PDF redaction** — Tool adds annotation but doesn't actually remove sensitive text
5. **Deterministic password generator** — Rust WASM `generate_password` produces the same output for the same length every time

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Monorepo Root                     │
│  pnpm workspaces · Turborepo · Vitest · TypeScript   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐   ┌────────┐  │
│  │ apps/web│  │apps/    │  │backend/ │   │backend/│  │
│  │ Next.js │  │admin    │  │fastapi  │   │rust    │  │
│  │ 15.3    │  │Next.js  │  │Python   │   │WASM    │  │
│  │ React 19│  │15.3     │  │3.12     │   │module  │  │
│  └────┬────┘  └────┬────┘  └────┬────┘   └───┬────┘  │
│       │            │            │            │       │
│  ┌────┴────────────┴────────────┴────────────┴────┐  │
│  │              Shared Packages                   │  │
│  │ @hsafx/shared · @hsafx/api · @hsafx/db         │  │
│  │ @hsafx/schemas · @hsafx/theme · @hsafx/ui      │  │
│  │ @hsafx/tool-definitions · @hsafx/tools         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              Infrastructure                    │  │
│  │ Docker · Kubernetes · Nginx · CI/CD scripts    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Technology Stack:**

- **Frontend:** Next.js 15.3, React 19, Tailwind CSS 4, tRPC, Zustand
- **Auth:** better-auth with 2FA (TOTP), OAuth (Google/GitHub/Discord), RBAC (CASL)
- **Database:** Neon serverless PostgreSQL via Drizzle ORM (55 tables, ~20 enums)
- **Billing:** Stripe (coin packs) + Polar (subscriptions), coin wallet with reservation pattern
- **Backend:** FastAPI (media processing, scrapers) + Rust WASM (text tools)
- **Infra:** Docker (3 Dockerfiles), Kubernetes (kustomize), Railway, Nginx

**Architecture Strengths:**

- Clean package separation with well-defined boundaries
- Turborepo pipeline correctly orders build/lint/test tasks
- Shared billing constants prevent billing logic drift
- Theme system with tier-based access control is well-designed
- Scraper system has excellent connection pooling and parallel fetching

---

## 3. Critical Issues (P0)

### P0-01: Missing Authentication on Admin API Routes

- **Location:** `apps/admin/src/app/api/admin/{users,tools,dashboard/metrics,audit,feature-flags}/route.ts`
- **Impact:** Any user with a valid session cookie (not just admins) can list/modify/delete users, toggle feature flags, view revenue metrics, and read audit logs
- **Fix:** Add session validation + role check at the top of every route handler:
  ```typescript
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const adminRole = await getAdminRole(session.user.id);
  if (!adminRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  ```
- **Effort:** Low — extract into a shared `requireAdmin()` utility

### P0-02: Coin Reservation Lifecycle Broken

- **Location:** `apps/web/src/app/api/v1/tools/[toolKey]/execute/route.ts`, `apps/web/src/app/api/webhooks/job-complete/route.ts`
- **Impact:** When a tool execution job completes, `confirmReservation()` is never called. Coins are permanently locked in "reserved" state. Users lose coins on every paid tool use.
- **Fix:** In `job-complete/route.ts`, after successful execution call `confirmReservation(reservationId)`. On failure, call `releaseReservation(reservationId)`. Pass `reservationId` through the job metadata.

### P0-03: FFmpeg Command Injection

- **Location:** `backend/fastapi/src/tools/audio_converter.py`, `backend/fastapi/src/tools/video_converter.py`
- **Impact:** User-controlled options (`trim_start`, `trim_end`, `speed`) are interpolated into FFmpeg command arguments via f-strings. Attacker can inject arbitrary FFmpeg flags or shell arguments.
- **Fix:** Validate all numeric parameters with strict type checking before passing to FFmpeg. Use `shlex.quote()` for string params. Whitelist allowed values.

### P0-04: Fake PDF Redaction

- **Location:** `backend/fastapi/src/tools/pdf_handler.py` → `_handle_pdf_redact`
- **Impact:** The redaction tool adds a text annotation "[Redacted: N pattern(s)]" but does **not** remove or obscure the actual text. Users believing their data is redacted will distribute unredacted documents.
- **Fix:** Use `pypdf` page content stream manipulation or `pymupdf` to actually remove/cover matching text. Alternatively, mark the tool as "annotation only" in its description.

### P0-05: Deterministic Password Generator (Rust WASM)

- **Location:** `backend/rust/text-tools/src/generators.rs` → `generate_password`
- **Impact:** Uses `DefaultHasher` with deterministic seeds `(i, length, "pwd")`. Produces the **same password every time** for the same length. Users relying on this for security get predictable passwords.
- **Fix:** Replace with `getrandom` crate (WASM-compatible) for cryptographic randomness:
  ```rust
  use getrandom::getrandom;
  let mut buf = vec![0u8; length];
  getrandom(&mut buf).unwrap();
  ```

### P0-06: Rate Limiter Processes Before Enforcing

- **Location:** `backend/fastapi/src/middleware/rate_limit.py`
- **Impact:** Calls `await call_next(request)` _before_ checking the rate limit quota. Every request fully executes regardless of rate status — then a 429 is returned post-computation. Provides zero protection against resource exhaustion.
- **Fix:** Check the rate limit _before_ calling `call_next`.

### P0-07: Hardcoded Production Secrets

- **Location:** `backend/fastapi/src/core/config.py`
- **Impact:** Default values `SECRET_KEY = "change-me-in-production"`, `INTERNAL_SECRET = "internal-secret-change-me"`, `QICT_USER_ID = "Test"`, `QICT_PASSWORD = "Test"`. If env vars are unset, the app silently runs with publicly known credentials.
- **Fix:** Remove default values. Fail-fast on startup if not set:
  ```python
  SECRET_KEY: str  # No default — pydantic will raise on missing
  ```

### P0-08: Stripe Webhook Missing Payments Row

- **Location:** `apps/web/src/app/api/webhooks/stripe/route.ts`
- **Impact:** `checkout.session.completed` handler creates a coin transaction but never inserts a row into the `payments` table. The refund handler (`charge.refunded`) looks up `payments` to find the transaction — always returns null. **Refunds silently fail.**
- **Fix:** Insert a `payments` row in the checkout handler with `stripePaymentIntentId`, `amount`, `status: 'succeeded'`.

### P0-09: Index Name Collision Blocks Migrations

- **Location:** `packages/db/src/schema/auth.ts`
- **Impact:** Both `activity_logs` and `audit_logs` tables define indexes named `al_user_id_idx` and `al_created_at_idx`. PostgreSQL index names are database-global — the second `CREATE INDEX` will fail, blocking all subsequent migrations.
- **Fix:** Rename to `activity_logs_user_id_idx`/`audit_logs_user_id_idx` etc.

### P0-10: `new Function()` Code Injection

- **Location:** `packages/tools/src/calculators/expression.ts` → `evaluateSimpleExpression`
- **Impact:** Despite regex validation, uses `new Function('return ' + expr)` to evaluate expressions. Sufficiently crafted input can escape the regex and execute arbitrary JavaScript.
- **Fix:** Replace with the already-implemented `evaluateExpression()` Shunting-Yard parser in the same file, which is safe.

### P0-11: OAuth Secrets Stored in Plaintext

- **Location:** `packages/db/src/schema/auth.ts`
- **Impact:** `account.accessToken`, `account.refreshToken`, 2FA `secret`, `backupCodes`, email `apiKey`, `smtpPassword` — all stored as plaintext in the database. A database breach exposes all OAuth tokens and 2FA seeds.
- **Fix:** Encrypt at rest using AES-256-GCM with a key derived from `AUTH_SECRET`. Decrypt on read.

### P0-12: SQL Injection via `sortBy` Parameter

- **Location:** `packages/schemas/src/api.ts` → `PaginationQuerySchema`
- **Impact:** `sortBy: z.string().optional()` allows arbitrary strings. If any consumer interpolates this into an `ORDER BY` clause without parameterization, it's a SQL injection vector.
- **Fix:** Restrict to an enum of allowed column names:
  ```typescript
  sortBy: z.enum(['createdAt', 'name', 'updatedAt', 'email']).optional();
  ```

### P0-13: ZIP Slip Vulnerability

- **Location:** `backend/fastapi/src/tools/archive_handler.py`
- **Impact:** ZIP extraction doesn't validate filenames against path traversal (e.g., `../../etc/passwd`). An attacker could overwrite arbitrary files on the server.
- **Fix:** Validate each entry's resolved path stays within the extraction directory:
  ```python
  for info in zip_ref.infolist():
      target = os.path.realpath(os.path.join(extract_dir, info.filename))
      if not target.startswith(os.path.realpath(extract_dir)):
          raise ValueError(f"Path traversal detected: {info.filename}")
  ```

### P0-14: Backup Script Produces Unrestorable Backups

- **Location:** `infra/scripts/pg_backup.sh`
- **Impact:** Uses `pg_dump --format=custom | gzip`. Custom format already compresses internally. The double-compressed file cannot be read by `pg_restore`.
- **Fix:** Either use `--format=plain | gzip` (SQL dump, compressed) or `--format=custom` without piping to gzip.

### P0-15: Docker Build References Nonexistent Package

- **Location:** `infra/docker/Dockerfile.web`, `infra/docker/Dockerfile.admin`
- **Impact:** Both copy `packages/config/package.json` in the dependency stage. No `packages/config/` directory exists. **Docker build will fail.**
- **Fix:** Remove the `COPY packages/config/package.json` line from both Dockerfiles.

### P0-16: `NEXT_PUBLIC_FASTAPI_URL` Set to Internal Docker Hostname

- **Location:** `infra/docker/docker-compose.prod.yml`
- **Impact:** `NEXT_PUBLIC_FASTAPI_URL=http://fastapi:8000` is baked into the client-side JS bundle at build time. The internal Docker hostname `fastapi` is unreachable from browsers. All client-side API calls to FastAPI will fail in production.
- **Fix:** Set to the public URL: `NEXT_PUBLIC_FASTAPI_URL=https://api.yourdomain.com`

### P0-17: K8s Staging Overlay Breaks Service Routing

- **Location:** `infra/k8s/overlays/staging/kustomization.yaml`
- **Impact:** `namePrefix: staging-` renames deployments but services still match on `app.kubernetes.io/name: web`. The prefixed pod labels won't match service selectors — no traffic reaches the pods.
- **Fix:** Use `commonLabels` in kustomize to coordinate label/selector changes, or use namespace isolation instead of name prefixing.

### P0-18: `users.passwordHash` is `notNull` — Blocks OAuth-Only Registration

- **Location:** `packages/db/src/schema/auth.ts`
- **Impact:** Users registering via Google/GitHub/Discord OAuth have no password. The `notNull` constraint on `passwordHash` will cause OAuth registration to fail with a database error.
- **Fix:** Remove the `notNull` constraint from `passwordHash`, or set a sentinel value for OAuth users.

---

## 4. High-Priority Issues (P1)

### P1-01: Session Invalidation Bug in `changePassword`

- **Location:** `packages/api/src/routers/user.ts`
- **Impact:** Deletes ALL sessions including the current one. User is immediately logged out after changing password with no way to stay signed in.
- **Fix:** Exclude the current session from deletion using `session.id`.

### P1-02: Tool Execution Refund Uses Wrong ID

- **Location:** `apps/web/src/server/tool-execution/index.ts`
- **Impact:** Calls `releaseReservation(transactionId)` but `transactionId` is the deduction ID, not the reservation ID. Refund on failure never actually releases the reserved coins.
- **Fix:** Pass and use the actual `reservationId` returned from `reserveCoins()`.

### P1-03: TOTP Secrets Stored in Plaintext

- **Location:** `apps/admin/src/app/api/admin/2fa/route.ts`
- **Impact:** Admin TOTP secrets stored unencrypted in the database. A DB breach allows 2FA bypass.
- **Fix:** Encrypt with `AUTH_SECRET` using AES-256-GCM before storage.

### P1-04: No Rate Limiting on 2FA Verify

- **Location:** `apps/admin/src/app/api/admin/2fa/route.ts`
- **Impact:** No limit on verification attempts. With `window: 1`, only 3 codes are valid at any time. An attacker can brute-force all 1M possible 6-digit codes.
- **Fix:** Add per-user rate limiting: max 5 attempts per minute.

### P1-05: Impersonation Guard is Dead Code

- **Location:** `apps/admin/src/app/api/admin/impersonate/route.ts`
- **Impact:** `getImpersonationGuard()` is defined but never exported or used. During impersonation, all API routes remain fully accessible (destructive actions like deleting users, modifying billing).
- **Fix:** Export and integrate into route middleware.

### P1-06: Hash Algorithm Not Whitelisted

- **Location:** `backend/fastapi/src/tools/file_handler.py`
- **Impact:** User-specified hash algorithm passed directly to `hashlib.new()`. Could access internal/experimental algorithms or cause DoS with expensive algorithms.
- **Fix:** Whitelist: `ALLOWED_ALGORITHMS = {'md5', 'sha1', 'sha256', 'sha512'}`.

### P1-07: SSL Verification Disabled by Default (KICT Scraper)

- **Location:** `backend/fastapi/src/scrapers/terminals/pakistan/kict.py`
- **Impact:** `KICT_SSL_VERIFY` defaults to `"false"`. Production requests to KICT API have no TLS certificate verification — vulnerable to MITM attacks.
- **Fix:** Default to `True`. Only disable for specific known certificate issues.

### P1-08: Timing-Unsafe HMAC Comparison

- **Location:** `apps/admin/src/middleware.ts`
- **Impact:** Uses `sig !== expectedSig` (string comparison) for 2FA cookie HMAC verification — vulnerable to timing attacks allowing cookie forgery.
- **Fix:** Use `crypto.subtle.verify()` or implement constant-time comparison.

### P1-09: Polar Webhook Hardcodes Subscription Period

- **Location:** `apps/web/src/app/api/webhooks/polar/route.ts`
- **Impact:** Hardcodes `periodEnd` to `new Date() + 30 days` instead of reading from the Polar event data. Monthly/annual periods will be incorrect.
- **Fix:** Read `currentPeriodEnd` from `event.data`.

### P1-10: `canUseToolByCategory()` Ignores Category

- **Location:** `packages/shared/src/permissions/abilities.ts`
- **Impact:** Always returns true if user can use _any_ tool, regardless of category. Category-based access control is effectively disabled.
- **Fix:** Pass the category to the CASL check: `ability.can('use', subject('Tool', { category }))`.

### P1-11: `sanitizeForLogging()` Doesn't Recurse into Arrays

- **Location:** `packages/shared/src/logging/sanitizer.ts`
- **Impact:** PII in nested arrays passes through unmasked. Sensitive data leaks into log aggregators.
- **Fix:** Add array recursion to the sanitizer.

### P1-12: `generateRandomString()` Uses `Math.random()`

- **Location:** `packages/shared/src/billing/service.ts`
- **Impact:** Used for referral codes, transaction IDs, and other identifiers. `Math.random()` is not cryptographically secure and produces predictable sequences.
- **Fix:** Use `crypto.getRandomValues()` or `crypto.randomUUID()`.

### P1-13: Email Template XSS

- **Location:** `apps/web/src/lib/email.ts`
- **Impact:** User-supplied values (name, URL) are interpolated directly into HTML email templates without escaping. A user with a name like `<script>alert(1)</script>` would inject HTML into emails sent to other users.
- **Fix:** HTML-encode all interpolated values.

### P1-14: Race Condition on Redis Rate Limit (API v1 Auth)

- **Location:** `apps/web/src/server/api-v1-auth.ts`
- **Impact:** `INCR` and `EXPIRE` are not atomic. Under concurrent requests, the expire can be set before the increment, or the key can expire between the two operations.
- **Fix:** Use a Lua script or `MULTI/EXEC` for atomic incr+expire.

### P1-15: Double Coin Release Possible

- **Location:** `apps/web/src/server/coin-service.ts`
- **Impact:** `releaseReservation()` has no idempotency guard. If called twice with the same reservation ID (e.g., due to retry logic), coins are released twice.
- **Fix:** Check the reservation status before releasing. Use `UPDATE ... WHERE status = 'reserved'` to make it atomic.

### P1-16: Modulo Bias in API Key Generation

- **Location:** `apps/web/src/server/api-keys.ts`
- **Impact:** `randomBytes[i]! % chars.length` with `chars.length = 62`. `256 % 62 = 8`, so the first 8 characters have slightly higher probability. Reduces entropy of API keys.
- **Fix:** Use rejection sampling or `crypto.randomInt()`.

### P1-17: `wkhtmltopdf` in Production Image

- **Location:** `infra/docker/Dockerfile.fastapi`
- **Impact:** `wkhtmltopdf` includes a full WebKit rendering engine. Crafted HTML input can trigger SSRF (reading internal URLs) or local file access. Also, `gcc`/`g++` left in the image increases attack surface.
- **Fix:** Sandbox `wkhtmltopdf` execution or replace with `weasyprint`. Remove build tools in a multi-stage build.

### P1-18: `date_trunc` Parameterized Interval in Admin Router

- **Location:** `packages/api/src/routers/admin.ts`
- **Impact:** Parameterized keyword for `date_trunc()` will fail at runtime — PostgreSQL doesn't accept parameters for interval keywords.
- **Fix:** Whitelist the interval value and interpolate safely, or use a CASE expression.

### P1-19: N+1 Queries in Admin Routes

- **Location:** `apps/admin/src/app/api/admin/{users,tools,audit}/route.ts`
- **Impact:** Users route: 3 queries per user (150 extra queries for 50 users/page). Tools route: 4 queries per tool. Audit route: 1 query per log entry for role lookup.
- **Fix:** Use JOINs, subqueries, or batch loading.

### P1-20: Nginx Weak Cipher Configuration

- **Location:** `infra/docker/nginx.conf`
- **Impact:** `ssl_ciphers HIGH:!aNULL:!MD5` is too broad and may include weak ciphers. Missing `Content-Security-Policy` header. Deprecated `X-XSS-Protection` header included.
- **Fix:** Use Mozilla's intermediate cipher recommendations. Add CSP header. Remove X-XSS-Protection.

### P1-21: Kubernetes Deployments Use `:latest` Tag

- **Location:** `infra/k8s/base/{web,admin,fastapi}-deployment.yaml`
- **Impact:** `:latest` is mutable — rolling updates may pull unexpected versions. No reproducibility.
- **Fix:** Pin to immutable SHA digests or semver tags.

### P1-22: `activity_logs.metadata` Declared as `text` but Typed as `Record`

- **Location:** `packages/db/src/schema/auth.ts`
- **Impact:** Drizzle types say `Record<string, unknown>` but the column is `text`. Inserting objects will call `.toString()` producing `[object Object]`. Reads will return strings, not objects.
- **Fix:** Change column type to `jsonb`.

---

## 5. Medium-Priority Issues (P2)

| #   | Issue                                                              | Location                                       | Fix                                |
| --- | ------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------- |
| 1   | `TransactionType` enum duplicated with missing values in constants | `packages/shared/src/billing/`                 | Single source of truth             |
| 2   | User search input parameter ignored in list endpoint               | `packages/api/src/routers/user.ts`             | Wire `search` input to query       |
| 3   | N+1 in `getPlans` (2 queries per plan)                             | `packages/api/src/routers/billing.ts`          | Use JOIN                           |
| 4   | `getUserPlan` has no caching — DB query on every gated call        | `packages/api/src/routers/get-user-plan.ts`    | Add 5-minute cache                 |
| 5   | `tool-execution.ts` is a stub that throws                          | `packages/api/src/routers/tool-execution.ts`   | Implement or remove                |
| 6   | Multiple routers use `@/` alias dynamic imports from packages      | `packages/api/src/routers/`                    | Use package imports                |
| 7   | `daily_pro_trials.toolId` is `text` not `uuid`                     | `packages/db/src/schema/tools.ts`              | Change to `uuid`                   |
| 8   | `usage_counters` unique index missing `resourceId`                 | `packages/db/src/schema/tools.ts`              | Add to unique constraint           |
| 9   | `referrals.referralCode` not unique                                | `packages/db/src/schema/billing.ts`            | Add unique constraint              |
| 10  | `subscriptions.billingCycle` text but enum exists                  | `packages/db/src/schema/billing.ts`            | Use the enum                       |
| 11  | Seed script has no transaction wrapping                            | `packages/db/src/seed.ts`                      | Wrap in `db.transaction()`         |
| 12  | `file_uploads` table has zero indexes                              | `packages/db/src/schema/tools.ts`              | Add userId, createdAt indexes      |
| 13  | `tool_coin_costs` missing unique constraint on `toolId`            | `packages/db/src/schema/billing.ts`            | Add unique index                   |
| 14  | 10+ missing relations in `relations.ts`                            | `packages/db/src/schema/relations.ts`          | Add missing relations              |
| 15  | Middleware trusts `x-forwarded-for` unconditionally                | `apps/web/src/middleware.ts`                   | Only trust behind known proxy      |
| 16  | 2FA false-failure counting in auth                                 | `apps/web/src/server/auth.ts`                  | Fix counting logic                 |
| 17  | `forgotPassword` aliased to wrong method                           | `apps/web/src/lib/auth-client.ts`              | Fix alias                          |
| 18  | In-memory monitoring counters useless in serverless                | `apps/web/src/lib/monitoring.ts`               | Use Redis counters                 |
| 19  | Image batch filter uses `Color` instead of `Contrast`              | `backend/fastapi/src/tools/image_converter.py` | Fix enhancer class                 |
| 20  | Video 180° rotation uses wrong FFmpeg filter                       | `backend/fastapi/src/tools/video_converter.py` | Fix transpose values               |
| 21  | Islamic inheritance calc has heir filtering bug                    | `backend/fastapi/src/tools/python_tools.py`    | Fix `_get_fixed_share`             |
| 22  | Whisper model reloaded on every call                               | `backend/fastapi/src/tools/python_tools.py`    | Cache as singleton                 |
| 23  | `snake_case("helloWorld")` fails — no camelCase detection          | `backend/rust/text-tools/src/case.rs`          | Add boundary detection             |
| 24  | `truncate_text` panics on multi-byte UTF-8                         | `backend/rust/text-tools/src/generators.rs`    | Use `char_indices()`               |
| 25  | Dialog/dropdown/select/tabs missing WCAG compliance                | `packages/ui/src/components/`                  | Add focus trap, keyboard nav, ARIA |
| 26  | `button.tsx` `asChild` prop silently ignored                       | `packages/ui/src/components/button.tsx`        | Implement Slot pattern             |
| 27  | Session refetched on every navigation in `use-rbac.tsx`            | `apps/admin/src/components/rbac/`              | Remove `pathname` from deps        |

---

## 6. Low-Priority Issues (P3)

| #   | Issue                                                          | Location                                                   |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `canceled`/`cancelled` inconsistent spelling                   | `apps/admin/src/lib/types.ts`                              |
| 2   | React Query imported but SWR is used                           | `apps/admin/src/components/providers.tsx`                  |
| 3   | `getRolePermissions('super_admin')` returns duplicates         | `apps/admin/src/lib/permissions.ts`                        |
| 4   | SSE reconnect timeout not cleaned on unmount                   | `apps/admin/src/hooks/use-admin-stream.ts`                 |
| 5   | `startMetricsCollector()` called at module top level           | `apps/admin/src/app/api/admin/stream/route.ts`             |
| 6   | Duplicate URL encoding implementations in Rust                 | `backend/rust/text-tools/src/encoding.rs`                  |
| 7   | `get_available_tools()` lists only 19 of 100+ functions        | `backend/rust/text-tools/src/lib.rs`                       |
| 8   | Deterministic "random" in `studly_case`, `shuffle_lines`       | `backend/rust/text-tools/src/case_extended.rs`             |
| 9   | In-memory scraper cache not shared across workers              | `backend/fastapi/src/scrapers/services/cache_service.py`   |
| 10  | Connection pool TOCTOU race                                    | `backend/fastapi/src/scrapers/core/connection_pool.py`     |
| 11  | `CONTAINER_PATTERN` regex duplicated                           | `backend/fastapi/src/scrapers/core/utils.py` + `models.py` |
| 12  | Dead PDF code in `document_converter.py`                       | `backend/fastapi/src/tools/document_converter.py`          |
| 13  | Tool helper functions use O(n) linear search on 446+ items     | `packages/tool-definitions/src/index.ts`                   |
| 14  | `deriveColors` throws on invalid color — crashes React         | `packages/theme/src/color.ts`                              |
| 15  | Negative `radiusSm` when `roundness=0`                         | `packages/theme/src/derive.ts`                             |
| 16  | Two conflicting default theme intents                          | `packages/theme/src/`                                      |
| 17  | `canPerformAction` defaults to `allowed: true` for unknowns    | `packages/theme/src/access.ts`                             |
| 18  | `ensureContrast` does 40+ color conversions in a loop          | `packages/theme/src/color.ts`                              |
| 19  | `export2FA` in admin uses POST for status check                | `apps/admin/src/lib/api.ts`                                |
| 20  | Admin export functions don't check `res.ok`                    | `apps/admin/src/lib/api.ts`                                |
| 21  | `PythonToolExecutor` uses `execute()` vs `convert()` interface | `backend/fastapi/src/tools/executor.py`                    |

---

## 7. Package-by-Package Analysis

### 7.1 `packages/shared`

**Purpose:** Shared kernel — billing engine, permissions (CASL), feature flags, pub/sub, rewards, errors, environment config, S3 storage, structured logging, execution engine.

**File Inventory (40+ files):**

| Directory      | Files                                                                 | Purpose                                           |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `billing/`     | `constants.ts`, `types.ts`, `service.ts`, `coin-packs.ts`, `plans.ts` | Billing logic, plan definitions, coin pack config |
| `permissions/` | `abilities.ts`, `roles.ts`, `types.ts`                                | CASL ability builder, role hierarchy, RBAC types  |
| `execution/`   | `types.ts`, `engine.ts`, `service.ts`                                 | Tool execution lifecycle, job queue interface     |
| `flags/`       | `types.ts`, `service.ts`, `defaults.ts`                               | Feature flag system with environment overrides    |
| `pubsub/`      | `index.ts`                                                            | In-process event bus for SSE relay                |
| `rewards/`     | `types.ts`, `engine.ts`, `streaks.ts`                                 | Gamification — streaks, rewards, XP               |
| `errors/`      | `types.ts`, `codes.ts`                                                | Typed error hierarchy                             |
| `env/`         | `index.ts`, `validation.ts`                                           | Environment variable validation                   |
| `storage/`     | `s3.ts`                                                               | S3-compatible file storage                        |
| `logging/`     | `logger.ts`, `sanitizer.ts`                                           | Structured logger with PII sanitization           |

**Key Functionality:**

- **Billing Engine:** 7 subscription tiers (free → lifetime), 6 coin packs ($4.99–$99.99), tool cost calculation with tier discounts, reservation pattern for transactional coin spending
- **CASL Permissions:** Dynamic ability builder from user role/tier/custom rules. Supports tool-level, category-level, and feature-level permissions
- **Feature Flags:** Boot-time flag resolution with default values, environment overrides, hot-reload support via pub/sub
- **Execution Engine:** Job lifecycle management — pending → running → completed/failed, with progress tracking and timeout handling

**Critical Issues:** See P0-10, P0-12, P1-10, P1-11, P1-12, P2-01

**Test Coverage:** `billing/` has tests for plans and coin-packs. **No tests for:** flags/service, pubsub, rewards, storage, logger, execution/service, permissions/ability. ~30% coverage estimate.

---

### 7.2 `packages/api`

**Purpose:** tRPC API layer — typed RPC procedures for user management, billing, tools, admin, and rewards.

**File Inventory (13 files):**

| File                        | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `index.ts`                  | Root router composition                                        |
| `trpc.ts`                   | tRPC init, context, middleware (auth, rate limit, plan gating) |
| `routers/user.ts`           | Profile CRUD, password change, 2FA, session management         |
| `routers/billing.ts`        | Plans, invoices, Stripe checkout, coin balance                 |
| `routers/tools.ts`          | Tool discovery, execution trigger, usage history               |
| `routers/admin.ts`          | Admin analytics, user management, system config                |
| `routers/rewards.ts`        | Streaks, achievements, leaderboard                             |
| `routers/get-user-plan.ts`  | Plan resolution logic (shared by gated procedures)             |
| `routers/tool-execution.ts` | Stub — throws "not implemented"                                |
| `middleware/auth.ts`        | Session validation middleware                                  |
| `middleware/rate-limit.ts`  | Per-user rate limiting                                         |
| `middleware/plan-gate.ts`   | Tier-based access control                                      |
| `utils/pagination.ts`       | Cursor and offset pagination helpers                           |

**Key Functionality:**

- **Auth Middleware:** Validates better-auth session, attaches user+session to context
- **Plan Gating:** Resolves user's active plan, checks tool-level permissions before execution
- **Admin Router:** Aggregated analytics with time-series (`date_trunc`), user CRUD, tool management

**Critical Issues:** See P1-01, P1-18, P1-19, P2-02–P2-06

---

### 7.3 `packages/db`

**Purpose:** Database schema (Drizzle ORM), client configuration, migrations, and seed data for 55 PostgreSQL tables.

**Schema Overview (55 tables, ~20 enums):**

| Domain           | Tables                                                                                                                                                                     | Key Elements                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Auth**         | `users`, `sessions`, `accounts`, `verifications`, `activity_logs`, `audit_logs`, `twoFactor`, `twoFactorBackup`                                                            | better-auth compatible, multi-provider OAuth, 2FA TOTP |
| **Billing**      | `subscriptions`, `coin_transactions`, `coin_wallet`, `payments`, `invoices`, `referrals`, `referral_rewards`, `coin_packs_config`, `plan_features`, `plan_limits`          | Stripe + Polar dual billing, coin reservation pattern  |
| **Tools**        | `tools`, `tool_categories`, `tool_executions`, `tool_favorites`, `tool_ratings`, `tool_coin_costs`, `usage_counters`, `daily_pro_trials`, `execution_jobs`, `file_uploads` | Tool registry, execution tracking, usage metering      |
| **System**       | `feature_flags`, `system_config`, `email_templates`, `notifications`, `api_keys`, `api_key_usage`, `announcements`, `feedback`                                             | Feature flags, notifications, B2B API keys             |
| **Gamification** | `streaks`, `achievements`, `user_achievements`, `rewards`, `streak_tiers`, `streak_milestones`                                                                             | Daily streaks, achievements, reward system             |

**Key Functionality:**

- **Neon HTTP Client:** Serverless-optimized PostgreSQL connection (no persistent connection pool)
- **Drizzle ORM:** Full schema with relations, custom types, enums
- **Seed Script:** Creates default plans, tiers, feature flags, sample tools, and admin user

**Critical Issues:** See P0-09, P0-11, P0-18, P1-22, P2-07–P2-14

---

### 7.4 `packages/schemas`

**Purpose:** Zod validation schemas shared between frontend and API. 5 files covering API, billing, tools, auth, and common patterns.

**Key Schemas:**

- `PaginationQuerySchema` — offset/limit/sort with SQL injection risk in `sortBy` (P0-12)
- `ToolExecutionRequestSchema` — tool key + arbitrary inputs (`z.record(z.unknown())`)
- `BillingSchemas` — checkout, plan selection, coin purchase with float currency (should be integer cents)
- `SlugParamSchema` — no regex validation on slugs

**Critical Issues:** See P0-12

---

### 7.5 `packages/theme`

**Purpose:** Dynamic theme system with OKLCH color derivation, 35 presets, tier-based access control, and CSS variable generation.

**Key Functionality:**

- **Color Derivation:** `deriveColors()` generates 50+ semantic tokens from a single hue/saturation intent
- **OKLCH Pipeline:** High-quality perceptual color manipulation with contrast enforcement
- **Tier Access:** Presets locked behind subscription tiers (free: 5 presets, pro: 20, business: 35)

**Issues:** See P3-14 through P3-18. Performance concern with `ensureContrast` loop.

---

### 7.6 `packages/tool-definitions`

**Purpose:** Central metadata registry for 446+ tools across 7 categories. Built with `tsup`.

**Category Breakdown:**

- **Calculators:** Financial, health, math, unit conversion, web analytics
- **Converters:** Data format, unit, encoding, document
- **Data Tools:** JSON, CSV, XML, YAML manipulation
- **Generators:** Password, UUID, lorem ipsum, QR codes, color palettes
- **Media Tools:** Image, audio, video processing (delegates to FastAPI)
- **Specialized:** Scrapers, Islamic finance, legal tools
- **Text Tools:** Case conversion, formatting, encoding, hashing (delegates to Rust WASM)

**Issues:** All helper functions (`getToolById`, `searchTools`) use O(n) linear search. With 446+ tools, consider indexing by ID/slug into a Map.

---

### 7.7 `packages/tools`

**Purpose:** Client-side tool execution engines. Pure TypeScript implementations for calculators, converters, formatters, generators, encoders, validators, and text tools.

**Key Modules:**

- **Expression Evaluator:** Shunting-Yard algorithm for safe math expression parsing (safe version exists alongside the unsafe `new Function()` version)
- **Financial Calculators:** Interest, loan, mortgage, investment, retirement, ROI, break-even, tip (14 functions)
- **Health Calculators:** BMI, BMR, body fat %, calorie needs, water intake
- **Islamic Finance:** Zakat, inheritance distribution (Faraid)
- **Converters:** Temperature, length, weight, area, volume, speed, data size, time, pressure, energy, and 20+ more
- **Generators:** Password, UUID, lorem ipsum, color palette, hash, QR code
- **Text Tools:** Client-side implementations that complement the Rust WASM tools

**Critical Issues:** See P0-10 (`new Function()` in `evaluateSimpleExpression`)

---

### 7.8 `packages/ui`

**Purpose:** Shared React component library built on Tailwind CSS 4, CVA, and custom implementations (no Radix for most components).

**Component Inventory (17 components):**

| Component       | Accessibility | Issues                                                                              |
| --------------- | :-----------: | ----------------------------------------------------------------------------------- |
| `Alert`         |      ✅       | None                                                                                |
| `Badge`         |      ✅       | Minor: `info`=`default` styling                                                     |
| `Button`        |      ⚠️       | `asChild` prop ignored; missing `aria-busy`                                         |
| `Card`          |      ✅       | None                                                                                |
| `Checkbox`      |      ✅       | Radix-based, proper accessibility                                                   |
| `Dialog`        |      ❌       | No focus trap, no `role="dialog"`, no keyboard support on trigger                   |
| `DropdownMenu`  |      ❌       | No keyboard nav, no `role="menu"`, ref forwarding broken                            |
| `Input`         |      ⚠️       | Missing `aria-describedby` for errors                                               |
| `Label`         |      ✅       | None                                                                                |
| `Progress`      |      ✅       | Good ARIA on linear variant                                                         |
| `Select`        |      ❌       | Has `role="combobox"` but missing `role="listbox"`/`role="option"`, no keyboard nav |
| `Skeleton`      |      ✅       | None                                                                                |
| `Switch`        |      ⚠️       | Missing `role="switch"`                                                             |
| `Tabs`          |      ⚠️       | Has `role="tablist"` but no keyboard nav, `tabIndex` not managed                    |
| `Textarea`      |      ⚠️       | Missing `aria-describedby` for errors                                               |
| `ThemeProvider` |      ✅       | Complex but well-designed; hydration flash concern                                  |
| `Tooltip`       |      ⚠️       | Missing `aria-describedby`                                                          |

**Critical Issues:** Dialog, DropdownMenu, and Select have WCAG 2.1 violations that would fail accessibility audits. See P2-25.

---

## 8. Application Analysis

### 8.1 `apps/web`

**Purpose:** Main user-facing Next.js 15.3 application. Tool discovery, execution, billing, auth, and user dashboard.

**Architecture:**

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (webhooks, v1 REST, health)
│   ├── (auth)/       # Login, register, forgot-password
│   ├── (dashboard)/  # User dashboard, tools, billing
│   └── (marketing)/  # Landing, pricing, about
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Client utilities (auth-client, trpc, zustand stores)
├── server/           # Server-only code
│   ├── auth.ts           # better-auth config
│   ├── coin-service.ts   # Coin wallet operations
│   ├── api-keys.ts       # B2B API key management
│   ├── api-v1-auth.ts    # REST API authentication
│   ├── login-security.ts # Brute-force protection
│   ├── email.ts          # Email templates
│   ├── monitoring.ts     # Sentry + metrics
│   └── tool-execution/   # Job queue + execution engine
└── middleware.ts     # Auth + rate limiting
```

**Key Functionality:**

- **Tool Execution Flow:** User request → coin reservation → job creation → FastAPI/WASM execution → job completion → coin confirmation
- **Billing Flow:** Plan selection → Stripe/Polar checkout → webhook → subscription activation → tier upgrade
- **Auth Flow:** Email/password or OAuth → session creation → 2FA check → progressive brute-force protection

**Critical Issues:** See P0-02, P0-08, P1-02, P1-13–P1-16, P2-15–P2-18

**Cross-Cutting Bug — Coin Reservation Lifecycle:**
The coin reservation system has a fundamental lifecycle gap spanning 3 files:

1. `execute/route.ts` calls `reserveCoins()` but if `createJob()` throws, the reservation leaks
2. `job-complete/route.ts` never calls `confirmReservation()` or `releaseReservation()`
3. `stale-job-cleanup/route.ts` releases stale jobs but doesn't release their reservations

**Impact:** Every paid tool execution permanently locks coins. Over time, all user coins become trapped in "reserved" state.

---

### 8.2 `apps/admin`

**Purpose:** Internal admin panel for managing users, tools, billing, feature flags, and system monitoring.

**Architecture:**

```
src/
├── app/
│   ├── api/admin/       # Admin REST API routes
│   │   ├── session/     # Auth session management
│   │   ├── users/       # User CRUD + enrichment
│   │   ├── tools/       # Tool management + stats
│   │   ├── dashboard/   # Metrics + analytics
│   │   ├── impersonate/ # User impersonation (audit-trailed)
│   │   ├── 2fa/         # Admin TOTP management
│   │   ├── audit/       # Audit log viewer
│   │   ├── feature-flags/ # Flag management
│   │   └── stream/      # SSE real-time events
│   └── (admin)/         # Admin UI pages
├── components/
│   ├── providers.tsx    # React Query + RBAC + Toast
│   └── rbac/            # Permission guards
├── hooks/               # Admin-specific hooks
└── lib/
    ├── auth.ts          # BetterAuth server config
    ├── api.ts           # ~80 fetch functions
    ├── hooks.ts         # ~40 SWR hooks
    ├── permissions.ts   # RBAC logic
    ├── types.ts         # Admin type definitions
    └── monitoring.ts    # Sentry + event bus
```

**Key Functionality:**

- **RBAC System:** 4 roles (viewer, analyst, manager, super_admin) with 20 permissions across 7 domains
- **Real-time Monitoring:** SSE stream for live metrics, errors, webhooks, and alerts
- **Impersonation:** Super-admin can impersonate users with full audit trail and 2FA requirement
- **Dashboard:** 13 parallel DB queries for real-time KPIs with trend calculation

**Critical Issue:** See P0-01 — all admin API routes lack authentication. This is the single highest-priority fix in the codebase.

---

## 9. Backend Services Analysis

### 9.1 `backend/fastapi`

**Purpose:** Stateless compute service for media processing (image/audio/video/PDF), document conversion, web scraping, and Python-based tool execution.

**Architecture:**

```
src/
├── main.py              # FastAPI app with middleware stack
├── core/
│   └── config.py        # Settings (Pydantic BaseSettings)
├── middleware/
│   ├── security.py      # Security headers
│   ├── rate_limit.py    # Rate limiting (broken — P0-06)
│   └── error_tracking.py # Sentry integration
├── api/
│   ├── routes.py        # Tool execution endpoint
│   ├── internal.py      # Internal health/status
│   └── health.py        # Public health check
├── tools/
│   ├── executor.py      # Tool router/dispatcher
│   ├── image_converter.py   # Pillow-based image processing
│   ├── audio_converter.py   # FFmpeg audio processing
│   ├── video_converter.py   # FFmpeg video processing
│   ├── pdf_handler.py       # pypdf PDF manipulation
│   ├── archive_handler.py   # ZIP/TAR handling
│   ├── file_handler.py      # Generic file ops
│   ├── document_converter.py # Legacy PDF (dead code)
│   └── python_tools.py      # Islamic calc, whisper, misc
└── scrapers/
    ├── core/                # Connection pool, utils, models
    ├── terminals/pakistan/   # QICT, KICT, KGTL, SAPT scrapers
    └── services/            # Cache, bulk tracking, validation
```

**Tool Categories (121+ tools):**

- **Image:** Resize, crop, rotate, filters, watermark, format conversion, batch processing
- **Audio:** Convert, trim, merge, speed change, normalize, metadata extraction
- **Video:** Convert, trim, rotate, speed, thumbnail extraction, GIF creation
- **PDF:** Merge, split, compress, rotate, encrypt/decrypt, redact (broken), N-up, watermark
- **Archive:** Create/extract ZIP/TAR/GZ
- **Document:** HTML-to-PDF, Markdown-to-PDF
- **Specialized:** Islamic inheritance (Faraid), speech-to-text (Whisper)

**Scraper System:**

- 4 Pakistani seaport terminal scrapers (QICT, KICT, KGTL, SAPT)
- Shared connection pool with HTTP/2 support
- In-memory TTL cache (should be Redis)
- Bulk container tracking with semaphore-limited concurrency
- Robust date parser handling 17+ formats

**Critical Issues:** See P0-03, P0-04, P0-06, P0-07, P0-13, P1-06, P1-07

---

### 9.2 `backend/rust`

**Purpose:** High-performance text processing WASM module compiled via `wasm-bindgen`. Runs client-side in the browser for instant text transformations.

**Module Inventory (12 modules, 100+ exported functions):**

| Module                 | Functions | Description                                          |
| ---------------------- | :-------: | ---------------------------------------------------- |
| `case.rs`              |     8     | Standard case conversions                            |
| `case_extended.rs`     |    13     | Exotic case conversions (spongebob, leet, studly)    |
| `counter.rs`           |     5     | Text statistics (words, chars, lines, density)       |
| `encoding.rs`          |     8     | Base64, hex, URL encode/decode                       |
| `encoding_extended.rs` |    20     | ROT13, Caesar, Morse, NATO, Pig Latin, binary, octal |
| `format.rs`            |     9     | Trim, line numbers, reverse, sort, dedup, wrap       |
| `generators.rs`        |    15     | Slug, lorem ipsum, password, regex, diff, align      |
| `hash.rs`              |     4     | MD5, SHA-256, SHA-512, UUID v4                       |
| `manipulation.rs`      |    20     | Extract emails/URLs, remove chars, shuffle, scramble |
| `unicode.rs`           |    14     | Unicode art (mirror, upside-down, fullwidth, zalgo)  |
| `wrapper.rs`           |    30+    | Wrap in quotes/brackets/HTML/markdown/comments       |
| `lib.rs`               |     2     | Init, tool listing                                   |

**Build Configuration:**

- Compiled to `cdylib` (dynamic library for WASM)
- LTO enabled for size optimization
- Post-build `wasm-opt -Oz` for further compression

**Critical Issues:** See P0-05. Also P2-23, P2-24.

---

## 10. Infrastructure Analysis

### 10.1 Docker

**Files:** `docker-compose.yml` (dev), `docker-compose.prod.yml`, `Dockerfile.web`, `Dockerfile.admin`, `Dockerfile.fastapi`, `nginx.conf`

**Development Compose:**

- PostgreSQL 16 + Redis 7 + FastAPI with hot-reload
- Source-mounted volumes with read-only flag
- Health checks on all services

**Production Compose:**

- All services + Nginx reverse proxy
- Named volumes for data persistence
- Network isolation between services

**Critical Issues:** See P0-15, P0-16, P1-17, P1-20

---

### 10.2 Kubernetes

**Files:** Base manifests (namespace, deployments, services) + overlays (staging, production)

**Architecture:**

- Kustomize-based with base + staging/production overlays
- 2 replicas for web/admin, 2 for FastAPI
- Liveness/readiness probes on all services
- Resource requests/limits defined
- cert-manager for TLS via Let's Encrypt
- Nginx ingress controller

**Critical Issues:** See P0-17 (staging overlay breaks selectors), P1-21 (`:latest` tags)

**Missing:**

- `PodDisruptionBudget` for zero-downtime deployments
- `NetworkPolicy` to restrict pod-to-pod communication
- `HorizontalPodAutoscaler` for load-based scaling
- Secrets management (referenced `hsafx-secrets` never defined)

---

### 10.3 Scripts

| Script                         | Purpose                          | Issues                                                               |
| ------------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| `setup.ps1` / `setup.sh`       | Full project bootstrap           | Minor: references root-level pkg scripts that may not exist          |
| `create-test-api-key.ts`       | Generate test B2B API key        | No production guard — creates `admin:*` key                          |
| `db-setup.ps1` / `db-setup.sh` | Run migrations + seed            | Uses `drizzle push` (schema push) not `migrate` — dangerous for prod |
| `pg_backup.sh`                 | Automated PostgreSQL backup      | Double-compression produces unrestorable backups (P0-14)             |
| `audit-tool-coverage.ts`       | Static analysis of tool coverage | Fragile regex-based detection                                        |
| `zap-scan.ps1`                 | OWASP ZAP security scanning      | Well-structured, good practice                                       |

---

## 11. Cross-Cutting Concerns

### 11.1 Billing Consistency

The coin Transaction type system has inconsistencies:

- `packages/shared/src/billing/types.ts` defines: `purchase`, `usage`, `refund`, `reward`, `referral`, `bonus`, `grant`, `deduction`, `reservation`, `release`, `confirmation`
- `packages/shared/src/billing/constants.ts` defines: `purchase`, `usage`, `refund`, `bonus`, `grant`, `deduction`, `reservation`, `release`, `confirmation` — missing `reward` and `referral`
- `apps/web/src/app/api/v1/coins/route.ts` uses `grant` which isn't in the constants `VALID_TYPES`

**Recommendation:** Single source of truth in `types.ts`, delete the constants duplicate.

### 11.2 Error Handling Pattern

Error handling is inconsistent across the codebase:

- `packages/api` uses tRPC errors with proper codes
- `apps/web` API routes use manual `NextResponse.json({ error })` with inconsistent status codes
- `apps/admin` API routes have no standardized error shape
- `backend/fastapi` uses `HTTPException` with varying detail formats

**Recommendation:** Define a shared error schema and use it everywhere.

### 11.3 Authentication Flow

Multiple auth implementations coexist:

- `better-auth` for user sessions (apps/web, apps/admin)
- Custom API key auth for B2B (apps/web/api/v1)
- Internal secret header for FastAPI ↔ Next.js communication
- HMAC-signed cookies for admin 2FA

**Risk:** The admin 2FA cookie uses timing-unsafe comparison (P1-08) while the impersonation cookie correctly uses `timingSafeEqual` — inconsistent security posture.

### 11.4 Database Access Patterns

- `packages/api` uses Drizzle ORM queries (type-safe)
- `apps/admin` API routes mix Drizzle queries with raw SQL
- `apps/admin/lib/metrics-collector.ts` uses hardcoded table names
- `packages/db` seed uses Drizzle but no transaction

**Recommendation:** Standardize on Drizzle queries; avoid raw SQL unless for performance-critical analytics.

---

## 12. Test Coverage Assessment

| Package/App        | Test Files |         Tested Modules         |                        Untested Modules                         | Est. Coverage |
| ------------------ | :--------: | :----------------------------: | :-------------------------------------------------------------: | :-----------: |
| `packages/shared`  |     ~8     | billing (plans, packs), errors | flags, pubsub, rewards, storage, logger, execution, permissions |     ~30%      |
| `packages/api`     |     ~3     |  auth middleware, pagination   |             All routers, plan-gate, tool-execution              |     ~15%      |
| `packages/db`      |     ~2     |    Schema validation, seed     |             Migrations, relations, complex queries              |     ~10%      |
| `packages/schemas` |     ~2     |          API schemas           |                  Tool schemas, billing schemas                  |     ~40%      |
| `packages/theme`   |     ~3     |   Color derivation, presets    |                Access control, derive, provider                 |     ~35%      |
| `packages/tools`   |     ~5     |   Expression eval, financial   |          All other calculators, converters, generators          |     ~15%      |
| `packages/ui`      |     0      |               —                |                         All components                          |      0%       |
| `apps/web`         |     ~4     |     Auth flow, middleware      |          All API routes, coin service, tool execution           |      ~5%      |
| `apps/admin`       |  ~1 (e2e)  |           Login flow           |                   All API routes, RBAC, hooks                   |      ~2%      |
| `backend/fastapi`  |     ~6     |    Health, auth middleware     |           All tool handlers, scrapers, rate limiting            |     ~15%      |
| `backend/rust`     |   inline   |    Case conversion (basic)     |                        All other modules                        |     ~10%      |

**Overall estimated coverage: ~15%**

**Priority testing recommendations:**

1. Admin API routes — currently have zero auth, adding tests would catch this
2. Coin service — reservation lifecycle is broken, tests would expose the gap
3. Webhook handlers — Stripe/Polar webhook logic has multiple bugs
4. RBAC/permissions — `canUseToolByCategory()` bug shows CASL abilities are untested
5. UI components — accessibility violations would be caught by `jest-axe` or `@testing-library/jest-dom`

---

## 13. Security Audit Summary

### OWASP Top 10 Mapping

| OWASP Category                     | Status  | Findings                                                                                                         |
| ---------------------------------- | :-----: | ---------------------------------------------------------------------------------------------------------------- |
| **A01: Broken Access Control**     | ❌ FAIL | Admin routes have no auth (P0-01); impersonation guard unused (P1-05)                                            |
| **A02: Cryptographic Failures**    | ❌ FAIL | OAuth tokens in plaintext (P0-11); TOTP secrets unencrypted (P1-03); `Math.random()` for security values (P1-12) |
| **A03: Injection**                 | ❌ FAIL | FFmpeg injection (P0-03); `new Function()` (P0-10); SQL injection via `sortBy` (P0-12); ZIP slip (P0-13)         |
| **A04: Insecure Design**           | ⚠️ WARN | Fake PDF redaction (P0-04); deterministic passwords (P0-05); coin lifecycle gap (P0-02)                          |
| **A05: Security Misconfiguration** | ⚠️ WARN | Hardcoded secrets (P0-07); SSL disabled (P1-07); weak ciphers (P1-20)                                            |
| **A06: Vulnerable Components**     | ⚠️ WARN | `wkhtmltopdf` security risk (P1-17); deprecated PyPDF2 in dead code                                              |
| **A07: Auth Failures**             | ⚠️ WARN | No 2FA rate limit (P1-04); timing-unsafe HMAC (P1-08); session invalidation bug (P1-01)                          |
| **A08: Data Integrity**            | ⚠️ WARN | Rate limiter bypass (P0-06); backup corruption (P0-14)                                                           |
| **A09: Logging Failures**          | ⚠️ WARN | PII leak via unsanitized arrays (P1-11); error stacks in SSE events                                              |
| **A10: SSRF**                      | ⚠️ WARN | `wkhtmltopdf` can fetch internal URLs; scraper URLs not validated                                                |

### Recommendations

1. Implement a security middleware layer for all admin routes
2. Encrypt all secrets at rest (OAuth tokens, TOTP, API keys)
3. Audit all user-input-to-command pathways (FFmpeg, hashlib, etc.)
4. Add rate limiting to all authentication endpoints
5. Replace `wkhtmltopdf` with a sandboxed alternative
6. Run `npm audit` / `pip audit` in CI

---

## 14. Performance Recommendations

### Database

1. **Fix N+1 queries** in admin routes — users (3 per row), tools (4 per row), audit (1 per row). Use JOINs.
2. **Add missing indexes:** `file_uploads` (userId, createdAt), `tool_coin_costs` (toolId), `api_key_usage` (apiKeyId, createdAt)
3. **Cache `getUserPlan()`** — called on every plan-gated procedure. Add 5-minute TTL cache.
4. **Partition high-volume tables** (`tool_executions`, `coin_transactions`, `activity_logs`) by month.

### Application

1. **Cache Whisper model** — loaded on every speech-to-text call. Use module-level singleton.
2. **Batch scraper downloads** — `_download_multi` in archive/file handlers downloads sequentially. Use `asyncio.gather`.
3. **Index tool registry** — `getToolById()`, `searchTools()` use O(n) linear scan on 446+ items. Build a `Map<id, tool>`.
4. **Deduplicate session checks** — `use-rbac.tsx` refetches on every navigation. Remove `pathname` dependency.
5. **Remove unused React Query** — admin uses SWR, not React Query. Remove `@tanstack/react-query`.

### Infrastructure

1. **Replace in-memory scraper cache with Redis** — already in the stack, enables cross-worker sharing.
2. **Add `.dockerignore`** — prevent `.git`, `node_modules`, etc. from being sent to Docker daemon.
3. **Multi-stage FastAPI Dockerfile** — remove `gcc`/`g++` from final image (~200MB savings).
4. **Add HPA to Kubernetes** — no auto-scaling currently defined.

---

## 15. Recommended Action Plan

### Sprint 1 — Security (Immediate, ~3-5 days)

| Task                                                                     | Priority | Effort |
| ------------------------------------------------------------------------ | :------: | :----: |
| Add auth middleware to all admin API routes                              |  P0-01   |  Low   |
| Fix coin reservation lifecycle (confirm on complete, release on failure) |  P0-02   | Medium |
| Validate FFmpeg parameters (whitelist, type-check)                       |  P0-03   | Medium |
| Implement actual PDF redaction or update tool description                |  P0-04   | Medium |
| Replace `DefaultHasher` with `getrandom` in Rust                         |  P0-05   |  Low   |
| Fix rate limiter to check before processing                              |  P0-06   |  Low   |
| Remove default secrets, fail-fast on missing env vars                    |  P0-07   |  Low   |
| Insert payments row in Stripe webhook                                    |  P0-08   |  Low   |
| Fix index name collisions in auth schema                                 |  P0-09   |  Low   |
| Remove `new Function()`, use Shunting-Yard parser                        |  P0-10   |  Low   |
| Encrypt OAuth tokens and 2FA secrets at rest                             |  P0-11   | Medium |
| Restrict `sortBy` to enum of allowed columns                             |  P0-12   |  Low   |
| Add ZIP path traversal validation                                        |  P0-13   |  Low   |

### Sprint 2 — Reliability (~3-5 days)

| Task                                                | Priority | Effort |
| --------------------------------------------------- | :------: | :----: |
| Fix `pg_backup.sh` double-compression               |  P0-14   |  Low   |
| Remove `packages/config` reference from Dockerfiles |  P0-15   |  Low   |
| Fix `NEXT_PUBLIC_FASTAPI_URL` for production        |  P0-16   |  Low   |
| Fix K8s staging overlay selectors                   |  P0-17   |  Low   |
| Make `users.passwordHash` nullable for OAuth        |  P0-18   |  Low   |
| Fix session invalidation (exclude current session)  |  P1-01   |  Low   |
| Fix tool execution refund ID                        |  P1-02   |  Low   |
| Add 2FA rate limiting                               |  P1-04   |  Low   |
| Export and integrate impersonation guard            |  P1-05   | Medium |
| Fix `date_trunc` interval parameterization          |  P1-18   |  Low   |

### Sprint 3 — Performance & Quality (~5-7 days)

| Task                                     | Priority | Effort |
| ---------------------------------------- | :------: | :----: |
| Fix N+1 queries in admin routes          |  P1-19   | Medium |
| Update nginx cipher config, add CSP      |  P1-20   |  Low   |
| Pin K8s image tags                       |  P1-21   |  Low   |
| Fix `activity_logs.metadata` column type |  P1-22   |  Low   |
| Cache Whisper model as singleton         |    P2    |  Low   |
| Add missing DB indexes                   |    P2    |  Low   |
| Cache `getUserPlan()` result             |    P2    | Medium |
| Index tool registry into Map             |    P3    |  Low   |

### Sprint 4 — Accessibility & Testing (~5-7 days)

| Task                                         | Priority | Effort |
| -------------------------------------------- | :------: | :----: |
| Add focus trap + keyboard nav to Dialog      |  P2-25   | Medium |
| Add ARIA roles to DropdownMenu, Select, Tabs |  P2-25   | Medium |
| Implement `asChild` Slot pattern in Button   |  P2-26   |  Low   |
| Add tests for admin API routes (auth + RBAC) |    —     | Medium |
| Add tests for coin reservation lifecycle     |    —     | Medium |
| Add tests for webhook handlers               |    —     | Medium |
| Add `jest-axe` tests for UI components       |    —     | Medium |

---

## Appendix A: File Count by Area

| Area                        | Source Files | Test Files | Config Files |
| --------------------------- | :----------: | :--------: | :----------: |
| `packages/shared`           |     40+      |     ~8     |      3       |
| `packages/api`              |      13      |     ~3     |      2       |
| `packages/db`               |      14      |     ~2     |      3       |
| `packages/schemas`          |      5       |     ~2     |      2       |
| `packages/theme`            |      6       |     ~3     |      2       |
| `packages/tool-definitions` |     ~10      |     0      |      3       |
| `packages/tools`            |     ~50      |     ~5     |      3       |
| `packages/ui`               |      17      |     0      |      2       |
| `apps/web`                  |     ~60      |     ~4     |      7       |
| `apps/admin`                |     ~40      |     ~1     |      7       |
| `backend/fastapi`           |     ~30      |     ~6     |      3       |
| `backend/rust`              |      12      |   inline   |      2       |
| `infra`                     |      —       |     —      |     ~15      |
| **Totals**                  |   **~300**   |  **~34**   |   **~54**    |

## Appendix B: Dependency Audit Checklist

Run these commands periodically:

```bash
# Node.js dependencies
pnpm audit --audit-level moderate

# Python dependencies
pip audit -r backend/fastapi/requirements.txt

# Rust dependencies
cargo audit --file backend/rust/Cargo.lock

# Docker image scanning
docker scout cves hsafx/web:latest
docker scout cves hsafx/fastapi:latest
```

## Appendix C: Recommended CI Additions

```yaml
# Add to CI pipeline
- name: Security Audit
  run: pnpm audit --audit-level high

- name: Lint (ESLint + Biome)
  run: pnpm lint

- name: Type Check
  run: pnpm typecheck

- name: Unit Tests
  run: pnpm test --coverage

- name: Accessibility Tests
  run: pnpm test:a11y

- name: OWASP ZAP Scan
  run: pwsh infra/scripts/zap-scan.ps1

- name: Container Scan
  run: docker scout cves --exit-code --only-severity critical,high
```

---

_End of Review — Generated by automated code audit across 200+ source files._
