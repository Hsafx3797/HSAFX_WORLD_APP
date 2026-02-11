# HSAFX World App — Remaining Work & Fixes

> **Date:** February 11, 2026
> **Source:** Codebase audit vs `docs/PLANNING/` specifications
> **Format:** Grouped by priority, each with planning reference, current state, and estimated effort

---

## Table of Contents

1. [Critical Blockers (Must Complete Before Production)](#1-critical-blockers)
2. [High-Priority Gaps (Should Complete Before Beta)](#2-high-priority-gaps)
3. [Medium-Priority Gaps (Complete Before GA)](#3-medium-priority-gaps)
4. [Low-Priority / Nice-to-Have (Post-Launch)](#4-low-priority--nice-to-have)
5. [Effort Summary](#5-effort-summary)

---

## 1. Critical Blockers

These items are **missing** from the codebase and **required** by the planning documents before any production deployment.

### REM-001: Git Repository — Initial Commit
- **Reference:** `44_IMPLEMENTATION_ROADMAP.md` Section 14
- **Current State:** Zero commits. Entire codebase is uncommitted.
- **Required:**
  - [ ] Initialize git repository
  - [ ] Create `.gitignore` (node_modules, .next, target, dist, .env*, etc.)
  - [ ] Initial commit with entire codebase
  - [ ] Create `main` and `develop` branches
  - [ ] Tag as `v0.1.0-alpha`
  - [ ] Push to GitHub remote
- **Effort:** 1 hour
- **Risk if skipped:** No version history, no rollback, no collaboration

### REM-002: CI/CD Pipeline
- **Reference:** `50_DEFINITION_OF_DONE.md`, `44_IMPLEMENTATION_ROADMAP.md`
- **Current State:** No `.github/workflows/` directory. No automation at all.
- **Required:**
  - [ ] Create `ci.yml`: lint → typecheck → test → build on every PR
  - [ ] Create `deploy-staging.yml`: auto-deploy to staging on merge to `develop`
  - [ ] Create `deploy-production.yml`: manual trigger or tag-based deploy to prod
  - [ ] Add status badges to `README.md`
  - [ ] Configure branch protection rules on `main`
- **Effort:** 8-12 hours
- **Risk if skipped:** No quality gates, manual-only validation

### REM-003: 2FA/TOTP for Admin Panel
- **Reference:** `15_SECURITY_MODEL.md`, `26_ADMIN_PANEL_SPECIFICATION.md`
- **Current State:** Auth exists. `TotpModal` UI component exists (shell only). No backend 2FA.
- **Required:**
  - [ ] Install `better-auth/plugins/two-factor` plugin
  - [ ] Add TOTP generation endpoint (QR code + backup codes)
  - [ ] Add TOTP verification endpoint
  - [ ] Wire `TotpModal` to backend
  - [ ] Enforce 2FA for destructive admin operations (delete user, adjust coins, change plans)
  - [ ] Add 2FA setup flow to admin onboarding
  - [ ] Store TOTP secrets encrypted in database
- **Effort:** 16-24 hours
- **Risk if skipped:** Admin panel completely unprotected for destructive operations

### REM-004: Production Deployment Infrastructure
- **Reference:** `49_DEPLOYMENT_GUIDE.md`
- **Current State:** Docker Compose for local dev works. `infra/k8s/` is empty.
- **Required (Choose ONE path):**
  - **Option A — Kubernetes:**
    - [ ] Create K8s namespace and service accounts
    - [ ] Write Deployment manifests for: web, admin, fastapi
    - [ ] Write Service and Ingress manifests
    - [ ] Write ConfigMap and Secret manifests
    - [ ] Create HPA (Horizontal Pod Autoscaler) config
    - [ ] Set up Helm chart or Kustomize overlays (staging/prod)
    - [ ] Write PDB (Pod Disruption Budget)
    - [ ] Configure cert-manager for TLS
    - Effort: 40-60 hours
  - **Option B — Managed Platform (Simpler):**
    - [ ] Deploy `apps/web` + `apps/admin` to **Vercel**
    - [ ] Deploy `backend/fastapi` to **Railway** or **Fly.io**
    - [ ] Configure environment variables
    - [ ] Set up custom domains and TLS
    - [ ] Configure health checks and auto-restarts
    - Effort: 8-16 hours
- **Risk if skipped:** No way to serve the application to users

---

## 2. High-Priority Gaps

Required for beta-quality product per planning specifications.

### REM-005: Security Headers Hardening
- **Reference:** `15_SECURITY_MODEL.md`
- **Current State:** Default Next.js headers only.
- **Required:**
  - [ ] Add `headers()` function to both `next.config.js` files
  - [ ] Implement: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
  - [ ] Test CSP doesn't break tool execution (inline scripts, eval, WASM)
  - [ ] Add FastAPI `CORSMiddleware` headers review
- **Effort:** 4-6 hours

### REM-006: Structured Logging with PII Redaction
- **Reference:** `15_SECURITY_MODEL.md` ("Zero PII in logs")
- **Current State:** Console.log used throughout. No structured logger.
- **Required:**
  - [ ] Install `pino` or `winston`
  - [ ] Create shared logger in `@hsafx/shared`
  - [ ] Add PII redaction rules (email, phone, session tokens, IPs)
  - [ ] Replace `console.log/warn/error` calls with structured logger
  - [ ] Configure JSON output for production, pretty-print for dev
  - [ ] Set log levels per environment
- **Effort:** 8-12 hours

### REM-007: Cloudflare R2 File Storage
- **Reference:** `10_SYSTEM_ARCHITECTURE.md`
- **Current State:** `fileUploads` table has `storageKey`/`storageUrl` columns. No R2 SDK.
- **Required:**
  - [ ] Create Cloudflare R2 bucket (or S3-compatible alternative)
  - [ ] Install `@aws-sdk/client-s3` (R2 is S3-compatible)
  - [ ] Implement upload/download service in `@hsafx/shared`
  - [ ] Wire FastAPI to upload processed files to R2
  - [ ] Configure presigned URLs for client download
  - [ ] Set retention/TTL policies (planning: 24h for temp files)
  - [ ] Add cleanup cron job for expired uploads
- **Effort:** 12-16 hours

### REM-008: Full WASM Text Tool Coverage
- **Reference:** `11_TECHNOLOGY_STACK.md`
- **Current State:** ~19 WASM exports. TypeScript fallback handles the rest.
- **Required:**
  - [ ] Audit which of 191 text tools genuinely benefit from WASM (CPU-intensive: regex, encoding, hashing, diff)
  - [ ] Implement ~30-40 additional Rust functions for compute-heavy tools
  - [ ] Ensure `wasm-fallback.ts` cleanly handles tools that stay in TypeScript
  - [ ] Benchmark WASM vs JS for borderline tools
- **Effort:** 40-60 hours (can be deferred — JS fallback works)

### REM-009: Tool Execution End-to-End Testing
- **Reference:** `44_IMPLEMENTATION_ROADMAP.md`, `50_DEFINITION_OF_DONE.md`
- **Current State:** 2,631 automated tests passing. Not all 446 tools have individual test coverage. Many share generic tests.
- **Required:**
  - [ ] Create test matrix: map each of 446 tool IDs to its test file(s)
  - [ ] Identify tools with no dedicated test
  - [ ] Write at least 3 test vectors per untested tool
  - [ ] Add E2E tests for: tool UI → execute → get result → display output
  - [ ] Add error-case tests: invalid input, rate limit exceeded, insufficient coins
- **Effort:** 40-60 hours

### REM-010: Coin Deduction E2E Verification
- **Reference:** `20_BILLING_SYSTEM.md`, `21_BILLING_LOGIC.md`
- **Current State:** `coinService`, `toolCoinCosts` table, BA weight fields all exist. Whether the actual flow (user clicks Execute → check balance → deduct coins → log transaction → return result) is wired end-to-end is unverified.
- **Required:**
  - [ ] Write integration test: create user → grant coins → execute paid tool → verify balance decreased by correct BA weight
  - [ ] Test all tier modifiers: free tier (1.0x), pro tier (0.8x), enterprise (0.5x)
  - [ ] Test insufficient balance rejection
  - [ ] Test free tool execution (0 cost, no deduction)
  - [ ] Test concurrent executions (race condition on balance check)
- **Effort:** 12-16 hours

---

## 3. Medium-Priority Gaps

Should be addressed before General Availability.

### REM-011: Meilisearch Integration
- **Reference:** `10_SYSTEM_ARCHITECTURE.md`
- **Current State:** No Meilisearch client or configuration.
- **Required:**
  - [ ] Set up Meilisearch instance (Docker or Meilisearch Cloud)
  - [ ] Index all 446 tools (name, description, category, tags)
  - [ ] Create search API endpoint using tRPC
  - [ ] Replace client-side tool filtering with Meilisearch queries
  - [ ] Add typo tolerance, faceted filtering by category
- **Effort:** 16-20 hours

### REM-012: Inngest / Background Job Finalization
- **Reference:** `10_SYSTEM_ARCHITECTURE.md`
- **Current State:** Schema references `inngestJobId`. Custom `job-manager.ts` exists. Mixed state.
- **Required (Choose ONE):**
  - **Option A — Commit to Inngest:**
    - [ ] Install `inngest` SDK
    - [ ] Migrate job-manager logic to Inngest functions
    - [ ] Set up Inngest Dev Server for local testing
    - [ ] Wire `asyncJobs` table to Inngest events
  - **Option B — Remove Inngest, keep custom:**
    - [ ] Remove `inngestJobId` from schema
    - [ ] Document custom job-manager retry/replay capabilities
    - [ ] Add dead-letter queue for failed jobs
- **Effort:** 12-20 hours

### REM-013: Admin Real-Time WebSocket
- **Reference:** `26_ADMIN_PANEL_SPECIFICATION.md` Section 12
- **Current State:** No WebSocket implementation.
- **Required:**
  - [ ] Set up WebSocket server (or use SSE for simpler approach)
  - [ ] Implement real-time streams for: error logs, active users, revenue tickers
  - [ ] Add WebSocket authentication (reuse session token)
  - [ ] Add reconnection logic on client
- **Effort:** 16-24 hours

### REM-014: Admin Role Seeding & Permission Matrix
- **Reference:** `26_ADMIN_PANEL_SPECIFICATION.md` Section 3
- **Current State:** RBAC infrastructure exists. 6 specific roles not seeded.
- **Required:**
  - [ ] Create seed script for 6 roles: Super Admin, Admin, Support, Developer, Analyst, Billing
  - [ ] Define permission matrix per role (which pages, which actions)
  - [ ] Wire permissions to admin sidebar and API route guards
  - [ ] Create admin role management UI page
- **Effort:** 8-12 hours

### REM-015: Monaco Editor Advanced Features
- **Reference:** `61_MONACO_EDITOR_SPEC.md`
- **Current State:** Basic code editor exists.
- **Required:**
  - [ ] Implement dual editor (input/output side-by-side)
  - [ ] Add diff viewer for code comparison tools
  - [ ] Configure language support for all 106 code editor tool types
  - [ ] Add minimap, search/replace, keyboard shortcuts
  - [ ] Add code folding and bracket matching
- **Effort:** 20-30 hours

### REM-016: User Impersonation for Admin
- **Reference:** `15_SECURITY_MODEL.md` Section 8
- **Current State:** Not implemented.
- **Required:**
  - [ ] Create impersonation endpoint (admin only, 2FA required)
  - [ ] Issue scoped session token (read-only, 1-hour limit)
  - [ ] Add visual banner on user app when impersonated
  - [ ] Log all impersonation actions to audit trail
  - [ ] Add "end impersonation" button
- **Effort:** 12-16 hours

### REM-017: Email Template System
- **Reference:** `26_ADMIN_PANEL_SPECIFICATION.md`
- **Current State:** `emailTemplates` and `emailLogs` tables exist. Email sending implementation unclear.
- **Required:**
  - [ ] Integrate email provider (Resend, SendGrid, or SES)
  - [ ] Create template engine (React Email or MJML)
  - [ ] Wire: welcome email, password reset, coin purchase receipt, plan change
  - [ ] Admin page to manage email templates
  - [ ] Track delivery status in `emailLogs`
- **Effort:** 16-24 hours

### REM-018: CSRF Origin/Referer Validation
- **Reference:** `15_SECURITY_MODEL.md`
- **Current State:** SameSite cookies provide partial protection. No explicit header checks.
- **Required:**
  - [ ] Add middleware to validate `Origin` and `Referer` headers on all POST/PUT/DELETE
  - [ ] Whitelist known origins (`app.hsafx.com`, `admin.hsafx.com`)
  - [ ] Reject requests with mismatched or missing origin headers
- **Effort:** 2-4 hours

### REM-019: Session Configuration Alignment
- **Reference:** `15_SECURITY_MODEL.md`
- **Current State:** Admin session configured (24hr). User session settings unverified.
- **Required:**
  - [ ] Verify user session: 7-day rolling, 30-day absolute max
  - [ ] Verify cookie name: `__hsafx_session`
  - [ ] Verify session storage: Redis-backed
  - [ ] Add session revocation API (logout all devices)
- **Effort:** 2-4 hours

---

## 4. Low-Priority / Nice-to-Have

Can be completed post-launch as enhancements.

### REM-020: gRPC Enterprise API
- **Reference:** `11_TECHNOLOGY_STACK.md` (marked "optional")
- **Required:**
  - [ ] Define `.proto` files for tool execution
  - [ ] Implement gRPC server alongside REST
  - [ ] Add API key authentication for B2B
- **Effort:** 30-40 hours

### REM-021: LibreOffice in Docker
- **Reference:** `11_TECHNOLOGY_STACK.md`
- **Required:**
  - [ ] Add LibreOffice to FastAPI Docker image
  - [ ] Wire DOCX/PPTX → PDF conversion tools
- **Effort:** 4-6 hours

### REM-022: Full Observability Pipeline
- **Reference:** `10_SYSTEM_ARCHITECTURE.md`
- **Required:**
  - [ ] Add metrics collection (Prometheus/Datadog)
  - [ ] Create Grafana dashboards for: API latency, tool execution time, error rates
  - [ ] Configure alerting rules
- **Effort:** 20-30 hours

### REM-023: IP Whitelist for Admin
- **Reference:** `26_ADMIN_PANEL_SPECIFICATION.md` (marked "optional")
- **Required:**
  - [ ] Add admin middleware for IP checking
  - [ ] Create admin UI to manage whitelist
  - [ ] Or: configure at CDN/proxy level (Cloudflare Access)
- **Effort:** 4-8 hours

### REM-024: Load Testing
- **Reference:** `50_DEFINITION_OF_DONE.md`
- **Required:**
  - [ ] Set up k6 or Locust
  - [ ] Write load test scenarios: 100 concurrent tool executions, 500 concurrent users browsing
  - [ ] Run tests, identify bottlenecks, optimize
  - [ ] Document results and capacity planning
- **Effort:** 16-24 hours

### REM-025: Security Audit
- **Reference:** `50_DEFINITION_OF_DONE.md`
- **Required:**
  - [ ] Run OWASP ZAP scan against staging
  - [ ] Run `npm audit` and fix critical vulnerabilities
  - [ ] Run Snyk or similar dependency scanner
  - [ ] Penetration test admin authentication flow
  - [ ] Document and fix all findings
- **Effort:** 16-24 hours

### REM-026: Mobile Responsiveness Testing
- **Reference:** `50_DEFINITION_OF_DONE.md`
- **Required:**
  - [ ] Test all tool pages on mobile viewports (320px, 375px, 414px)
  - [ ] Test admin panel on tablet (768px, 1024px)
  - [ ] Fix any layout breaks, touch targets, overflow issues
  - [ ] Test touch interactions with file upload tools
- **Effort:** 12-20 hours

### REM-027: Browser Compatibility Testing
- **Reference:** `50_DEFINITION_OF_DONE.md`
- **Required:**
  - [ ] Test on Chrome, Firefox, Safari, Edge
  - [ ] Test WASM functionality across browsers
  - [ ] Test Monaco Editor across browsers
  - [ ] Fix any polyfill or compatibility issues
- **Effort:** 8-12 hours

### REM-028: OpenAPI Auto-Generation
- **Reference:** `14_API_CONTRACTS.md`
- **Required:**
  - [ ] Set up auto-generated OpenAPI spec from tRPC routes
  - [ ] Deploy Swagger UI at `/api-docs`
  - [ ] Ensure spec stays in sync with code changes
- **Effort:** 4-8 hours

### REM-029: Database Backup Automation
- **Reference:** `50_DEFINITION_OF_DONE.md`
- **Required:**
  - [ ] Configure automated Neon/PostgreSQL backups
  - [ ] Set backup schedule (daily at minimum)
  - [ ] Test backup restoration procedure
  - [ ] Document disaster recovery runbook
- **Effort:** 4-8 hours

---

## 5. Effort Summary

| Priority | Items | Estimated Hours |
|----------|-------|----------------|
| **🔴 Critical Blockers** | 4 items | 69-103 hours (Option B) or 97-157 hours (Option A) |
| **🟠 High Priority** | 6 items | 116-170 hours |
| **🟡 Medium Priority** | 9 items | 90-134 hours |
| **🟢 Low Priority** | 10 items | 119-180 hours |
| **TOTAL** | **29 items** | **394-587 hours** |

### With Option B (Managed Platform) for deployment:
- **Minimum to Production:** 69-103 hours (Critical only)
- **Beta-Ready:** 185-273 hours (Critical + High)
- **GA-Ready:** 275-407 hours (Critical + High + Medium)
- **Feature-Complete:** 394-587 hours (Everything)

### Time Estimates at 40hr/week:
- Critical blockers: **2-3 weeks**
- Through beta: **5-7 weeks**
- Through GA: **7-10 weeks**
- Feature-complete: **10-15 weeks**

---

*29 remaining items identified. 4 are must-fix production blockers. See `04_STEPS_TO_COMPLETE.md` for the recommended execution plan.*
