# HSAFX World App — Steps to Complete Full Project

> **Date:** February 11, 2026
> **Purpose:** Actionable execution plan to bring the codebase to parity with all `docs/PLANNING/` specifications
> **Format:** Sprint-based plan with exact tasks, dependencies, and verification criteria

---

## Table of Contents

1. [Strategy Overview](#strategy-overview)
2. [Sprint 0 — Foundation (Week 1)](#sprint-0--foundation-week-1)
3. [Sprint 1 — Security Hardening (Weeks 2-3)](#sprint-1--security-hardening-weeks-2-3)
4. [Sprint 2 — Infrastructure & Deploy (Week 3-4)](#sprint-2--infrastructure--deploy-weeks-3-4)
5. [Sprint 3 — Integration Verification (Weeks 4-5)](#sprint-3--integration-verification-weeks-4-5)
6. [Sprint 4 — Search & Storage (Weeks 5-6)](#sprint-4--search--storage-weeks-5-6)
7. [Sprint 5 — Admin Polish (Weeks 6-7)](#sprint-5--admin-polish-weeks-6-7)
8. [Sprint 6 — Testing & QA (Weeks 7-9)](#sprint-6--testing--qa-weeks-7-9)
9. [Sprint 7 — Production Hardening (Weeks 9-10)](#sprint-7--production-hardening-weeks-9-10)
10. [Post-Launch Backlog](#post-launch-backlog)
11. [Decision Points](#decision-points)
12. [Definition of Done per Sprint](#definition-of-done-per-sprint)

---

## Strategy Overview

### Current State (as of audit)
- ✅ 454 tools registered with metadata
- ✅ 44 database tables implemented
- ✅ Auth (email + 3 OAuth) working
- ✅ Admin panel (14 pages + RBAC)
- ✅ Web app (30 routes, 24 pages)
- ✅ Billing (Stripe + Polar) integrated
- ✅ Theme system (100% complete)
- ✅ 2,631 tests passing
- ✅ Both Next.js apps build clean
- ✅ FastAPI starts clean
- ✅ Docker Compose works for local dev

### What's Missing
- 🔴 Zero git commits (no version history)
- 🔴 No CI/CD pipeline
- 🔴 No 2FA for admin
- 🔴 No production deployment
- 🟡 Various security hardening items
- 🟡 Integration gaps (R2, Meilisearch, job queue)

### Approach
**Fix the foundation first, then layer on features.** The order below reflects dependencies — each sprint builds on the previous one.

---

## Sprint 0 — Foundation (Week 1)

**Goal:** Establish version control and basic CI. Everything else depends on this.

### Tasks

#### S0-1: Git Repository Setup (Day 1, ~2 hours)
```
1. Create comprehensive .gitignore
2. git init
3. git add -A
4. git commit -m "feat: initial commit — HSAFX World App v0.1.0-alpha"
5. Create GitHub repository (private)
6. git remote add origin <url>
7. git push -u origin main
8. Create 'develop' branch from main
9. git tag v0.1.0-alpha
```

**Verification:** `git log --oneline` shows initial commit. GitHub repo shows all files.

#### S0-2: Branch Protection (Day 1, ~30 min)
```
1. Protect 'main' branch: require PR, require CI pass, no force push
2. Protect 'develop' branch: require CI pass
3. Set default branch to 'develop'
```

#### S0-3: CI Pipeline (Days 2-3, ~10 hours)
```
1. Create .github/workflows/ci.yml:
   - Trigger: PR to main/develop + push to develop
   - Jobs:
     a. lint (pnpm lint — ESLint + Ruff)
     b. typecheck (pnpm typecheck — tsc --noEmit)
     c. test-ts (pnpm test — Vitest)
     d. test-py (cd backend/fastapi && pytest)
     e. build-web (pnpm --filter web build)
     f. build-admin (pnpm --filter admin build)
   - Cache: pnpm store, .next cache, pip cache
   - Matrix: Node 22.x

2. Create .github/workflows/deploy-staging.yml:
   - Trigger: push to develop
   - Deploy to staging environment
   
3. Add README badges: CI status, test count, license
```

**Verification:** Push a test PR → all 6 jobs pass green.

#### S0-4: Environment Variable Documentation (Day 3, ~2 hours)
```
1. Create .env.example with all required vars (no values)
2. Document each variable in SETUP.md
3. Verify .env* is in .gitignore
4. Create .env.test for CI (test-safe values)
```

**Sprint 0 Exit Criteria:**
- [ ] Repository on GitHub with all code committed
- [ ] CI pipeline runs on every PR (lint + test + build)
- [ ] Main branch is protected
- [ ] `.env.example` documents all required variables

---

## Sprint 1 — Security Hardening (Weeks 2-3)

**Goal:** Close all security gaps identified in the audit.

### Tasks

#### S1-1: 2FA/TOTP for Admin (Days 1-4, ~20 hours)
```
1. Add better-auth two-factor plugin to admin auth config
2. Create TOTP enrollment endpoint:
   - Generate secret
   - Return QR code URI
   - Return backup codes (10x)
3. Create TOTP verification endpoint
4. Wire TotpModal component to real backend
5. Add 2FA enforcement middleware for destructive operations:
   - DELETE /api/admin/users/:id
   - POST /api/admin/coins/adjust
   - PUT /api/admin/plans/:id
   - PUT /api/admin/system/config
6. Create admin onboarding flow: first login → setup 2FA
7. Store secrets encrypted (AES-256-GCM)
8. Write tests: enrollment, verification, backup code usage, enforcement
```

**Verification:** Cannot delete a user without entering TOTP code.

#### S1-2: Security Headers (Day 5, ~4 hours)
```
1. Add to apps/web/next.config.js headers():
   - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   - Content-Security-Policy: (allow WASM, Monaco, inline styles for Tailwind)
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=()
2. Same for apps/admin/next.config.js
3. Add security headers to FastAPI middleware
4. Test: tool execution still works with CSP (WASM, eval, blob URLs)
```

**Verification:** `curl -I` shows all headers. Tools still execute.

#### S1-3: CSRF Hardening (Day 5, ~2 hours)
```
1. Add middleware to validate Origin header on POST/PUT/DELETE
2. Whitelist: app.hsafx.com, admin.hsafx.com, localhost:3000/3001
3. Reject requests with missing/mismatched Origin
4. Add test for CSRF protection
```

#### S1-4: Structured Logging (Days 6-7, ~8 hours)
```
1. Install pino in @hsafx/shared
2. Create logger factory with PII redaction:
   - Redact: email → e***@***.com
   - Redact: session tokens → [REDACTED]
   - Redact: IP addresses in production
3. Replace console.log/warn/error across codebase
4. Configure: JSON in production, pretty in development
5. Add request-id to all log entries
```

#### S1-5: Session Configuration Audit (Day 7, ~2 hours)
```
1. Verify/set user session: maxAge=7d, updateAge=1d, absoluteMax=30d
2. Verify cookie name: __hsafx_session
3. Verify admin session: maxAge=24h, updateAge=1h
4. Add session revocation endpoint: POST /api/auth/revoke-all
5. Write test: session expires after configured time
```

**Sprint 1 Exit Criteria:**
- [ ] 2FA works end-to-end for admin operations
- [ ] Security headers pass `securityheaders.com` scan (A+ rating)
- [ ] CSRF protection active on state-changing routes
- [ ] All logging uses structured logger with PII redaction
- [ ] Session configuration matches planning spec

---

## Sprint 2 — Infrastructure & Deploy (Weeks 3-4)

**Goal:** Get the application running in a staging environment.

### Tasks

#### S2-1: Staging Environment Setup (Days 1-3, ~12 hours)

**Recommended Path: Managed Platform (Option B from remaining work)**

```
Web + Admin → Vercel:
1. Connect GitHub repo to Vercel
2. Configure apps/web as project 1 (Root: apps/web)
3. Configure apps/admin as project 2 (Root: apps/admin)
4. Set environment variables (DB URL, Redis URL, etc.)
5. Configure custom domains: staging.hsafx.com, admin-staging.hsafx.com
6. Set up preview deployments for PRs

FastAPI → Railway (or Fly.io):
1. Create Railway project
2. Configure Dockerfile build from backend/fastapi/
3. Set environment variables
4. Configure health check: /health
5. Set custom domain: api-staging.hsafx.com
6. Configure auto-deploy from develop branch
```

#### S2-2: Database Provisioning (Day 2, ~4 hours)
```
1. Create Neon project for staging
2. Run Drizzle migrations: npx drizzle-kit push
3. Seed initial data: admin user, tool catalog, plans, roles
4. Create Neon project for production (empty, for later)
5. Document connection strings and rotation procedure
```

#### S2-3: Redis Provisioning (Day 2, ~2 hours)
```
1. Create Upstash Redis instance for staging
2. Configure rate limiting parameters
3. Configure session storage
4. Test rate limiting works: 3 requests → 4th rejected
```

#### S2-4: Deploy Pipeline (Days 3-4, ~6 hours)
```
1. Update deploy-staging.yml:
   - Vercel CLI deploy for web + admin
   - Railway CLI deploy for FastAPI
2. Create deploy-production.yml:
   - Trigger on tag push (v*.*.*)
   - Deploy to production instances
3. Add smoke tests post-deploy:
   - Health check endpoints
   - Login flow
   - One tool execution
```

**Sprint 2 Exit Criteria:**
- [ ] Staging environment accessible at staging.hsafx.com
- [ ] Admin panel at admin-staging.hsafx.com
- [ ] FastAPI at api-staging.hsafx.com
- [ ] Auto-deploy from develop branch works
- [ ] Health checks passing

---

## Sprint 3 — Integration Verification (Weeks 4-5)

**Goal:** Verify all major flows work end-to-end in staging.

### Tasks

#### S3-1: Auth Flow E2E (Day 1, ~4 hours)
```
1. Test email signup → email verification → login → session
2. Test Google OAuth → callback → session → profile
3. Test GitHub OAuth → callback → session → profile
4. Test Facebook OAuth → callback → session → profile
5. Test logout → session destroyed
6. Test admin login → 2FA → admin dashboard
```

#### S3-2: Billing Flow E2E (Days 2-3, ~8 hours)
```
1. Test Stripe coin purchase: select pack → checkout → webhook → coins credited
2. Test Polar subscription: choose plan → checkout → webhook → plan activated
3. Test coin deduction: execute paid tool → balance decreased correctly
4. Test BA weight modifiers per tier: free (1.0x), pro (0.8x)
5. Test insufficient balance: tool execution rejected with friendly message
6. Test ad reward: watch ad → 10 coins → daily cap at 5 ads
```

#### S3-3: Tool Execution E2E (Days 3-5, ~12 hours)
```
1. Test 1 tool from each category (minimum):
   - Text: case converter
   - Data: JSON formatter
   - Media: image resizer (FastAPI)
   - Code: formatting
   - Conversion: unit converter
   - Calculator: percentage calculator
2. Test WASM tool execution path
3. Test TypeScript fallback path
4. Test FastAPI tool execution path
5. Verify result display and copy/download
```

#### S3-4: Admin Operations E2E (Days 5-6, ~8 hours)
```
1. Test user management: search → view → edit
2. Test coin adjustment: select user → adjust → verify audit trail
3. Test analytics dashboard: verify charts render with real data
4. Test tool management: toggle tool status
5. Test billing management: view transactions, subscriptions
```

**Sprint 3 Exit Criteria:**
- [ ] All auth providers work in staging
- [ ] Complete coin purchase → tool execution flow works
- [ ] At least 6 representative tools execute correctly
- [ ] Admin panel operations work with 2FA

---

## Sprint 4 — Search & Storage (Weeks 5-6)

**Goal:** Implement Meilisearch and R2 — the two service integrations missing from planning.

### Tasks

#### S4-1: Meilisearch Setup (Days 1-3, ~12 hours)
```
1. Deploy Meilisearch (Docker on Railway or Meilisearch Cloud)
2. Create tool search index with schema:
   { id, name, slug, category, subcategory, description, tags, executionCount }
3. Write index sync script: read tool metadata → push to Meilisearch
4. Create tRPC endpoint: tools.search → Meilisearch query → results
5. Wire search UI to Meilisearch (replace client-side filtering)
6. Add filters: category, subcategory, execution type
7. Configure typo tolerance and ranking rules
```

#### S4-2: Cloudflare R2 Setup (Days 3-5, ~10 hours)
```
1. Create R2 bucket: hsafx-uploads-staging
2. Install @aws-sdk/client-s3 in @hsafx/shared
3. Create storage service:
   - upload(file, key) → presigned URL
   - download(key) → presigned URL
   - delete(key)
   - listExpired(olderThan: 24h)
4. Wire FastAPI: processed files → R2 upload → return URL
5. Wire web app: download button → presigned R2 URL
6. Create cleanup cron: delete files older than 24h
7. Update fileUploads table flow: INSERT on upload, UPDATE on download
```

#### S4-3: Background Job Finalization (Days 5-6, ~8 hours)
```
Decision: Commit to Inngest OR finalize custom job manager.

If Inngest:
1. Install inngest client
2. Migrate 3 key job types to Inngest functions
3. Set up Inngest Dev Server

If Custom:
1. Remove inngestJobId from schema
2. Add retry logic (3 attempts, exponential backoff)
3. Add dead-letter queue table for failed jobs
4. Add job status monitoring endpoint for admin
```

**Sprint 4 Exit Criteria:**
- [ ] Tool search returns results from Meilisearch
- [ ] File-producing tools store output in R2
- [ ] Temp files cleaned up after 24 hours
- [ ] Background job system has clear retry/failure strategy

---

## Sprint 5 — Admin Polish (Weeks 6-7)

**Goal:** Complete all admin panel features specified in planning.

### Tasks

#### S5-1: Admin Role Seeding (Day 1, ~4 hours)
```
1. Create seed script with 6 roles:
   - Super Admin: full access
   - Admin: everything except system config
   - Support: read users, view tickets, adjust coins (small amounts)
   - Developer: tools management, API access, logs
   - Analyst: read-only analytics, reports, exports
   - Billing: billing management, refunds, plan changes
2. Create permission matrix table (role × resource × action)
3. Run seed in staging
```

#### S5-2: Email System (Days 2-4, ~12 hours)
```
1. Choose provider: Resend (recommended — simple API, React Email support)
2. Install @react-email/components
3. Create email templates: welcome, password-reset, coin-receipt, plan-change
4. Wire trigger points: on signup, on forgot-password, on purchase, on plan change
5. Store send log in emailLogs table
6. Admin page: view sent emails, resend failed, edit templates
```

#### S5-3: WebSocket / SSE for Admin (Days 4-6, ~12 hours)
```
1. Implement Server-Sent Events (SSE) endpoint: /api/admin/stream
   (SSE is simpler than WebSocket for one-way data flow)
2. Stream events: new errors, active user count, revenue updates
3. Client: EventSource connection with auto-reconnect
4. Admin dashboard: live-updating cards for active users, errors, revenue
5. Add authentication to SSE endpoint (session token in URL param)
```

#### S5-4: Impersonation System (Days 6-7, ~8 hours)
```
1. Create endpoint: POST /api/admin/impersonate/:userId
2. Require 2FA verification
3. Issue scoped session: read-only, 1-hour TTL
4. Set impersonation header/cookie for web app detection
5. Web app: show orange banner "Viewing as [user]" + end button
6. Log: impersonation start, actions taken, impersonation end
```

**Sprint 5 Exit Criteria:**
- [ ] All 6 admin roles seeded with correct permissions
- [ ] Email sending works for key transactional events
- [ ] Admin dashboard has live-updating metrics
- [ ] Admin can impersonate users with audit trail

---

## Sprint 6 — Testing & QA (Weeks 7-9)

**Goal:** Comprehensive testing to meet planning's quality bar.

### Tasks

#### S6-1: E2E Test Suite with Playwright (Days 1-4, ~16 hours)
```
1. Install Playwright
2. Write E2E flows:
   - Signup → verify email → login → dashboard
   - Search tool → execute → view result → copy
   - Purchase coins via Stripe (test mode)
   - Admin login → 2FA → manage user
   - Tool execution with insufficient coins (error handling)
3. Run E2E tests in CI
```

#### S6-2: Tool Coverage Expansion (Days 4-8, ~20 hours)
```
1. Map all 446 tool IDs to existing tests
2. Identify untested tools
3. Write at least 1 test per untested tool
4. Focus on: error inputs, edge cases, encoding
5. Target: every tool ID has at least 1 passing test
```

#### S6-3: Browser Compatibility (Day 9, ~4 hours)
```
1. Test critical flows on: Chrome, Firefox, Safari, Edge
2. Verify WASM loading in each browser
3. Fix any compatibility issues
4. Document supported browser matrix
```

#### S6-4: Mobile Responsiveness (Days 9-10, ~6 hours)
```
1. Test tool pages on: 320px, 375px, 414px widths
2. Test admin on: 768px, 1024px widths
3. Fix overflow, touch target, layout issues
4. Test file upload on mobile
```

#### S6-5: Security Scan (Day 10, ~4 hours)
```
1. Run npm audit --production → fix critical/high
2. Run OWASP ZAP baseline scan against staging
3. Manual: test for IDOR, XSS in tool inputs, auth bypass
4. Document and fix findings
```

**Sprint 6 Exit Criteria:**
- [ ] E2E test suite runs in CI (Playwright)
- [ ] 90%+ of 446 tools have automated tests
- [ ] No critical/high npm audit findings
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Mobile layout has no critical breaks

---

## Sprint 7 — Production Hardening (Weeks 9-10)

**Goal:** Final preparations for production launch.

### Tasks

#### S7-1: Production Environment (Days 1-2, ~8 hours)
```
1. Create production Neon database
2. Create production Upstash Redis
3. Create production R2 bucket
4. Create production Meilisearch
5. Configure production Vercel projects
6. Configure production Railway
7. Set all production environment variables
8. Run database migrations + seed data
```

#### S7-2: Domain & TLS (Day 2, ~2 hours)
```
1. Configure DNS: app.hsafx.com → Vercel
2. Configure DNS: admin.hsafx.com → Vercel
3. Configure DNS: api.hsafx.com → Railway/Fly
4. Verify TLS certificates (auto via providers)
5. Set up HSTS preload list submission
```

#### S7-3: Backup & Recovery (Day 3, ~4 hours)
```
1. Enable Neon automated backups (point-in-time recovery)
2. Set backup schedule: continuous (Neon default)
3. Document recovery procedure in runbook
4. Test: restore from backup, verify data integrity
```

#### S7-4: Load Testing (Days 3-4, ~8 hours)
```
1. Install k6
2. Write scenarios:
   - 100 concurrent tool executions
   - 500 concurrent page loads
   - Rate limiting verification at scale
3. Run against staging
4. Identify and fix bottlenecks
5. Document capacity limits
```

#### S7-5: Launch Checklist (Day 5, ~4 hours)
```
1. ✅ All CI checks pass on main
2. ✅ E2E tests pass on staging
3. ✅ Security scan clean
4. ✅ Load test results acceptable
5. ✅ Backup/recovery tested
6. ✅ Monitoring configured (Sentry alerts)
7. ✅ DNS propagated
8. ✅ SSL certificates valid
9. ✅ Environment variables set
10. ✅ Feature flags configured for gradual rollout
11. Tag v1.0.0
12. Deploy production
13. Smoke test production
14. Announce launch
```

**Sprint 7 Exit Criteria:**
- [ ] Production environment running and accessible
- [ ] Backups configured and tested
- [ ] Load test results documented
- [ ] Launch checklist all-green
- [ ] v1.0.0 tagged and deployed

---

## Post-Launch Backlog

Items to work on after initial production launch:

| Priority | Item                                          | Effort |
|----------|-----------------------------------------------|--------|
| P1       | WASM coverage expansion (50+ more text tools) | 40-60h |
| P2       | Full observability pipeline (Grafana/Datadog) | 20-30h |
| P3       | gRPC enterprise API                           | 30-40h |
| P4       | LibreOffice in Docker for Office formats      | 4-6h   |
| P5       | OpenAPI auto-generation                       | 4-8h   |
| P6       | Advanced Monaco features (diff, AST)          | 20-30h |
| P7       | IP whitelist for admin                        | 4-8h   |

---

## Decision Points

These decisions should be made before starting the relevant sprint:

| Decision                | Options                           | Deadline        | Recommendation                                                      |
|-------------------------|-----------------------------------|-----------------|---------------------------------------------------------------------|
| **Deployment platform** | A: Kubernetes / B: Vercel+Railway | Before Sprint 2 | **B** — faster, cheaper for initial launch                          |
| **Background jobs**     | A: Inngest / B: Custom            | Before Sprint 4 | **A** if complex workflows needed; **B** if current jobs are simple |
| **Email provider**      | Resend / SendGrid / SES           | Before Sprint 5 | **Resend** — simplest, React Email support                          |
| **Search engine**       | Meilisearch / Algolia / Typesense | Before Sprint 4 | **Meilisearch** — matches planning, self-hostable                   |
| **Admin real-time**     | WebSocket / SSE                   | Before Sprint 5 | **SSE** — simpler, sufficient for one-way data                      |

---

## Definition of Done per Sprint

Each sprint is considered complete when:

1. All tasks have passing tests
2. CI pipeline is green
3. Changes deployed to staging
4. No regression in existing functionality
5. Documentation updated if architecture changed
6. PR reviewed and merged to develop

### Phase Completion Milestones

| Milestone             | After Sprint | Meaning                             |
|-----------------------|--------------|-------------------------------------|
| **Alpha**             | Sprint 0     | Code in version control, CI running |
| **Closed Beta**       | Sprint 3     | Core flows work E2E in staging      |
| **Open Beta**         | Sprint 5     | All features implemented            |
| **Release Candidate** | Sprint 6     | Testing complete, quality verified  |
| **v1.0.0**            | Sprint 7     | Production launch                   |

---

## Quick Reference: Sprint Calendar

```
Week 1:    Sprint 0 — Git + CI              [FOUNDATION]
Week 2-3:  Sprint 1 — Security              [HARDENING]
Week 3-4:  Sprint 2 — Deploy                [INFRASTRUCTURE]
Week 4-5:  Sprint 3 — Integration E2E       [VERIFICATION]
Week 5-6:  Sprint 4 — Search + Storage      [SERVICES]
Week 6-7:  Sprint 5 — Admin Polish          [FEATURES]
Week 7-9:  Sprint 6 — Testing + QA          [QUALITY]
Week 9-10: Sprint 7 — Production            [LAUNCH]
```

**Total: ~10 weeks to production-ready v1.0.0**

---

*This plan assumes one full-time developer. With 2+ developers, sprints 1-2 and 4-5 can be parallelized, reducing timeline to ~7 weeks.*
