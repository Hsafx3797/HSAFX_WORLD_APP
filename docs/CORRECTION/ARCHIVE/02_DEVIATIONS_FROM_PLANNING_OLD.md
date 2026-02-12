# HSAFX World App — Deviations from Planning

> **Date:** February 11, 2026
> **Source of Truth:** Codebase audit vs `docs/PLANNING/` specifications
> **Format:** Each deviation listed with Planning spec → Actual implementation → Impact assessment

---

## Table of Contents

1. [Architecture Deviations](#1-architecture-deviations)
2. [Technology Stack Deviations](#2-technology-stack-deviations)
3. [Authentication Deviations](#3-authentication-deviations)
4. [Database Schema Deviations](#4-database-schema-deviations)
5. [API Contract Deviations](#5-api-contract-deviations)
6. [Billing System Deviations](#6-billing-system-deviations)
7. [Tool Implementation Deviations](#7-tool-implementation-deviations)
8. [Admin Panel Deviations](#8-admin-panel-deviations)
9. [Infrastructure Deviations](#9-infrastructure-deviations)
10. [Security Model Deviations](#10-security-model-deviations)
11. [Build Order Deviations](#11-build-order-deviations)
12. [Impact Summary](#12-impact-summary)

---

## 1. Architecture Deviations

### DEV-001: Admin Panel Backend Architecture
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | Admin panel uses **shared Next.js backend** — Admin calls `app.hsafx.com/api` (same backend as user app). Single API layer serves both. |
| **Actual** | Admin app (`apps/admin`) has **its own API routes** (`/api/admin/*`). Separate Better-Auth instance, separate API handlers. |
| **Impact** | 🟡 **Medium** — Diverges from "single shared backend" but is actually better for security isolation. Admin routes are not exposed on the user-facing domain. Acceptable improvement. |

### DEV-002: Background Job Engine
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | Background jobs via **Inngest** for workflow orchestration. |
| **Actual** | `asyncJobs` table has `inngestJobId` field, but actual job execution uses custom `job-manager.ts` + `job-worker.ts`. Inngest is referenced but not the primary implementation. |
| **Impact** | 🟡 **Medium** — Custom job management works but loses Inngest's retry/replay/fan-out capabilities. May need to decide: commit to Inngest or replace schema references. |

### DEV-003: Search Engine
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | **Meilisearch** for tool search and full-text search. |
| **Actual** | No Meilisearch integration found. Tool search appears to be client-side filtering or basic DB queries. |
| **Impact** | 🟡 **Medium** — Tool search works for 446 tools without a dedicated engine, but won't scale if tool count grows or if semantic search is needed. |

### DEV-004: Object Storage
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | **Cloudflare R2** for temporary file uploads. |
| **Actual** | `fileUploads` table has `storageKey` and `storageUrl` columns suggesting R2, but no Cloudflare R2 SDK or client found. FastAPI uses local temp file handling. |
| **Impact** | 🟡 **Medium** — Local file handling works for dev but doesn't scale for production. R2 integration needed before deploy. |

---

## 2. Technology Stack Deviations

### DEV-005: Rust WASM Coverage
| | Detail |
|---|---|
| **Planning** (`11_TECHNOLOGY_STACK.md`) | **ALL 191 text tools** run as Rust → WASM in browser. Single Rust crate with all text operations. |
| **Actual** | WASM module has ~19 exported functions (12 modules). Many text tools use **TypeScript fallback** (`packages/tools/src/text/index.ts`) rather than pure WASM. `wasm-fallback.ts` exists explicitly. |
| **Impact** | 🟡 **Medium** — Functionality works via TypeScript. WASM is available but doesn't cover all 191 tools yet. Performance is acceptable since text tools are fast in JS too. |

### DEV-006: Native Binaries in FastAPI
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | FastAPI uses FFmpeg, **libvips**, **Poppler**, **Tesseract**, **LibreOffice** for file processing. |
| **Actual** | Docker image installs FFmpeg, libvips, Poppler, Tesseract, wkhtmltopdf. LibreOffice is **NOT installed** in Docker image. |
| **Impact** | 🟡 **Medium** — DOCX → PDF and other Office format conversions may not work without LibreOffice. Partial file conversion capability. |

### DEV-007: CSS Framework Version
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md`) | **Tailwind CSS v4** with `@theme inline` contract. |
| **Actual** | Both apps use `postcss.config.js` with `@tailwindcss/postcss`. Tailwind v4 is in use but the exact `@theme inline` pattern vs standard CSS integration needs verification. |
| **Impact** | 🟢 **Low** — Tailwind v4 is used as planned. Minor implementation detail difference. |

### DEV-008: State Management
| | Detail |
|---|---|
| **Planning** (`72_STATE_MANAGEMENT_SPEC.md`) | **React Context + Zustand** for client state. |
| **Actual** | Zustand stores exist (`tool-store.ts`, `ui-store.ts`, `user-store.ts`). React Context used via providers. |
| **Impact** | 🟢 **Low** — Matches planning. No deviation. |

---

## 3. Authentication Deviations

### DEV-009: 2FA/TOTP — MISSING
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`, `26_ADMIN_PANEL_SPECIFICATION.md`) | **2FA mandatory for all admin users.** TOTP required for destructive operations (delete user, adjust coins, etc.). |
| **Actual** | **No 2FA/TOTP implementation exists.** No `two-factor` plugin, no TOTP generation, no QR code flow. Admin `TotpModal` component exists in UI but has no backend. |
| **Impact** | 🔴 **HIGH** — Admin panel security severely weakened without 2FA. Planning explicitly requires it for: delete users, adjust coins, change plans, system configuration. Must implement before production. |

### DEV-010: OAuth Provider Set
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`) | OAuth: **Google, GitHub** (primary). Meta/Facebook mentioned as optional. |
| **Actual** | OAuth: **Google, GitHub, Facebook** — all three enabled. |
| **Impact** | 🟢 **Low** — Positive deviation. More providers than planned. |

### DEV-011: Session Configuration
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`) | User session: **7-day** expiry, 30-day absolute max. Admin session: **24-hour** expiry. Redis-backed. Cookie: `__hsafx_session`. |
| **Actual** | Admin session: 24hr max age, 1hr update age, 2min cookie cache. User session configuration not explicitly verified to match 7-day spec. |
| **Impact** | 🟡 **Medium** — Admin matches. User session settings should be verified against spec. |

### DEV-012: Impersonation System
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md` Section 8) | Admin can **impersonate users** with: scoped permissions, 1-hour time limit, audit trail, visual indicator. |
| **Actual** | No impersonation implementation found in codebase. |
| **Impact** | 🟡 **Medium** — Nice-to-have for support workflows. Not critical for launch but was explicitly specified. |

---

## 4. Database Schema Deviations

### DEV-013: Extra Tables Added
| | Detail |
|---|---|
| **Planning** (`13_DATABASE_SCHEMA.md`) | ~25-30 tables in original schema. |
| **Actual** | **44 tables** — extras include: `favorites`, `notifications`, `fileUploads`, `asyncJobs`, `emailTemplates`, `emailLogs`, `toolVersions`, `toolExecutions`, `toolCategories`, `adRewardTransactions`, `userAdDailyCaps`, `refreshTokens`, `featureFlags`. |
| **Impact** | 🟢 **Low** — Positive deviation. More comprehensive schema than planned. All additions serve valid purposes. |

### DEV-014: Naming Conventions
| | Detail |
|---|---|
| **Planning** (`13_DATABASE_SCHEMA.md`) | `snake_case` table names: `user_preferences`, `coin_transactions`, `user_coin_wallets`. |
| **Actual** | Drizzle uses **camelCase** in TypeScript (`userPreferences`, `coinTransactions`, `userCoinWallets`) that maps to snake_case in PostgreSQL. |
| **Impact** | 🟢 **Low** — Standard Drizzle ORM pattern. Database columns are snake_case as planned. TypeScript is camelCase for ergonomics. |

### DEV-015: `social_auths` Table Naming
| | Detail |
|---|---|
| **Planning** (`13_DATABASE_SCHEMA.md`) | Table: `social_auths`. |
| **Actual** | Table: `oauthConnections`. |
| **Impact** | 🟢 **Low** — Same functionality, different name. Better name actually (more descriptive). |

---

## 5. API Contract Deviations

### DEV-016: tRPC Router Structure
| | Detail |
|---|---|
| **Planning** (`14_API_CONTRACTS.md`) | tRPC routers: `user.*`, `tool.*`, `billing.*`, `admin.*`. |
| **Actual** | tRPC routers: `user`, `tools`, `billing`, `admin`, `ads` (extra). |
| **Impact** | 🟢 **Low** — Matches planning plus an `ads` router for ad reward system. Good addition. |

### DEV-017: OpenAPI/Swagger Documentation
| | Detail |
|---|---|
| **Planning** (`14_API_CONTRACTS.md`) | Auto-generated **OpenAPI spec** for public REST API. |
| **Actual** | `/api-docs` page exists but unclear if it's auto-generated from code or manually maintained. |
| **Impact** | 🟡 **Medium** — API documentation should be verified as auto-generated and kept in sync. |

### DEV-018: gRPC Support
| | Detail |
|---|---|
| **Planning** (`11_TECHNOLOGY_STACK.md`) | **gRPC (optional)** for enterprise B2B access. |
| **Actual** | No gRPC implementation. REST API only. |
| **Impact** | 🟢 **Low** — Was explicitly marked "optional" in planning. REST is sufficient for MVP. |

---

## 6. Billing System Deviations

### DEV-019: Billing Provider Responsibilities
| | Detail |
|---|---|
| **Planning** (`20_BILLING_SYSTEM.md`) | **Polar** = Merchant of Record for subscriptions. **Stripe** = coin-pack one-time payments. |
| **Actual** | Polar for subscriptions + Stripe for coins. Matches planning. No deviation. |
| **Impact** | 🟢 **Low** — Matches exactly. |

### DEV-020: BA Weight Enforcement
| | Detail |
|---|---|
| **Planning** (`20_BILLING_SYSTEM.md`) | Each tool class has specific BA weights (0.1 for calculators, 0.2 for text, 1.0 for media). `toolCoinCosts` table stores per-tool overrides. |
| **Actual** | `toolCoinCosts` table exists with BA weight column. Coin service exists. Whether BA weight logic is fully wired through tool execution → coin deduction needs verification. |
| **Impact** | 🟡 **Medium** — Schema supports it. End-to-end flow needs integration testing. |

### DEV-021: Ad Reward System
| | Detail |
|---|---|
| **Planning** (`20_BILLING_SYSTEM.md` Section 8) | Users watch ads → earn 10 coins/ad, 5 ads/day max, 30-second minimum view, fraud detection. |
| **Actual** | `adRewardTransactions` and `userAdDailyCaps` tables exist. `ad-reward-service.ts` exists. Ad validation status and fraud detection columns present. |
| **Impact** | 🟢 **Low** — Infrastructure is complete. Ad provider integration (actual ad display) needs wiring. |

---

## 7. Tool Implementation Deviations

### DEV-022: Tool Logic Coverage Gap
| | Detail |
|---|---|
| **Planning** (`44_IMPLEMENTATION_ROADMAP.md`) | All 446 tools must have working execution logic with 3 test vectors each = 1,338 tests. |
| **Actual** | 454 tools are **registered in metadata** but actual execution logic is concentrated in ~40+ implementation files. Many tools share common logic (e.g., all 55 case converters use one function with parameters). Not all 446 have individual test vectors. |
| **Impact** | 🟡 **Medium** — Tools that share logic work, but the 3-test-vectors-per-tool standard from planning is not met. Current tests (2,631) cover more than the 1,338 target but through broader integration tests, not per-tool. |

### DEV-023: Tool Execution Router Pattern
| | Detail |
|---|---|
| **Planning** (`73_TOOL_EXECUTION_ROUTER.md`) | Explicit routing: WASM tools → browser, sync tools → Node.js, async tools → FastAPI. Three-tier dispatch. |
| **Actual** | `apps/web/src/lib/tools/registry.ts` + `executor.ts` + `wasm-loader.ts` handle routing. FastAPI `executor.py` handles backend dispatch. |
| **Impact** | 🟢 **Low** — Routing pattern is implemented. May not match the exact tri-tier specification perfectly but serves the same purpose. |

### DEV-024: Monaco Editor Integration
| | Detail |
|---|---|
| **Planning** (`61_MONACO_EDITOR_SPEC.md`) | Monaco Editor for: 106 code editor tools. Dual editors, diff viewer, AST viewer. |
| **Actual** | `code-editor-tool.tsx` exists. `use-code-editor.ts` hook exists. Whether full Monaco with diff viewer and AST viewer is implemented needs deeper verification. |
| **Impact** | 🟡 **Medium** — Basic code editor exists. Advanced Monaco features (AST viewer, multi-lang support for all 106 tools) may be incomplete. |

---

## 8. Admin Panel Deviations

### DEV-025: Real-Time Updates
| | Detail |
|---|---|
| **Planning** (`26_ADMIN_PANEL_SPECIFICATION.md` Section 12) | **Real-time WebSocket updates** for: error logs, job queue, user activity, revenue tickers. |
| **Actual** | No WebSocket implementation found. Admin panel appears to use standard HTTP polling or manual refresh. |
| **Impact** | 🟡 **Medium** — Admin can still function without real-time. Nice-to-have for monitoring. Polling is acceptable for MVP. |

### DEV-026: Admin Roles Depth
| | Detail |
|---|---|
| **Planning** (`26_ADMIN_PANEL_SPECIFICATION.md` Section 3) | 6 admin roles: Super Admin, Admin, Support, Developer, Analyst, Billing — each with specific permission matrices. |
| **Actual** | `roles` table supports custom roles. RBAC components exist. Whether all 6 planned roles are seeded with correct permission matrices needs verification. |
| **Impact** | 🟡 **Medium** — RBAC infrastructure is complete. Role seeding/configuration may be incomplete. |

### DEV-027: IP Whitelist for Admin
| | Detail |
|---|---|
| **Planning** (`26_ADMIN_PANEL_SPECIFICATION.md` Section 2) | Optional IP whitelist for admin access. |
| **Actual** | Not found in middleware or auth configuration. |
| **Impact** | 🟢 **Low** — Was marked "optional, configurable" in planning. Can be added at deployment level (Vercel, Cloudflare). |

---

## 9. Infrastructure Deviations

### DEV-028: Kubernetes — NOT IMPLEMENTED
| | Detail |
|---|---|
| **Planning** (`49_DEPLOYMENT_GUIDE.md`) | K8s manifests for production deployment. |
| **Actual** | `infra/k8s/` directory exists but is **empty**. |
| **Impact** | 🔴 **HIGH** — No production deployment strategy. Need either K8s or alternative (Vercel + Railway/Fly.io) before launch. |

### DEV-029: CI/CD Pipeline — NOT IMPLEMENTED
| | Detail |
|---|---|
| **Planning** (`50_DEFINITION_OF_DONE.md`) | Automated pipelines: lint, test, build, deploy on every PR/merge. |
| **Actual** | No `.github/workflows/` directory. No CI/CD configuration of any kind. |
| **Impact** | 🔴 **HIGH** — No automated quality gates. Every merge is manual and untested. Must implement before team collaboration. |

### DEV-030: Git Repository — NO COMMITS
| | Detail |
|---|---|
| **Planning** (`44_IMPLEMENTATION_ROADMAP.md` Section 14) | "Tag git commit" at each phase checkpoint. |
| **Actual** | Zero git commits in repository. No version history. |
| **Impact** | 🔴 **HIGH** — No version control history. No rollback capability. No phase checkpoints. Critical to commit immediately. |

### DEV-031: Monitoring & Alerting
| | Detail |
|---|---|
| **Planning** (`10_SYSTEM_ARCHITECTURE.md` Section 10) | Observability: Sentry (errors), Upstash Analytics, custom metrics dashboard. |
| **Actual** | Sentry SDK installed (`@sentry/nextjs` v10.38.0) in both apps. `monitoring.ts` file in admin. No custom metrics pipeline. |
| **Impact** | 🟡 **Medium** — Sentry basics in place. Full observability pipeline (Grafana/Datadog equivalent) not built. |

---

## 10. Security Model Deviations

### DEV-032: CSRF Protection
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`) | CSRF via SameSite=Lax cookies + Origin/Referer header validation on state-changing endpoints. |
| **Actual** | SameSite cookies are set by Better-Auth. Origin/Referer validation needs verification in middleware. |
| **Impact** | 🟡 **Medium** — Likely protected by SameSite alone for same-origin requests, but spec requires explicit header checks. |

### DEV-033: Security Headers
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`) | HSTS, CSP, X-Content-Type-Options, X-Frame-Options headers on all responses. |
| **Actual** | Next.js provides some default headers. Whether explicit security headers are configured in `next.config.js` needs verification. |
| **Impact** | 🟡 **Medium** — Important for hardening. Should verify and add missing headers. |

### DEV-034: PII Redaction in Logs
| | Detail |
|---|---|
| **Planning** (`15_SECURITY_MODEL.md`) | "Zero PII in logs" — structured logging with PII redaction. |
| **Actual** | No structured logging library configured. Console.log likely used (ESLint has 134 warnings, some may be console usage). |
| **Impact** | 🟡 **Medium** — Should add structured logger (pino/winston) with PII filter before production. |

---

## 11. Build Order Deviations

### DEV-035: Phase Ordering
| | Detail |
|---|---|
| **Planning** (`44_IMPLEMENTATION_ROADMAP.md`) | Strict sequence: Phase 1 (Tools) → Phase 2 (DB+Auth) → Phase 3 (Admin) → Phase 4 (User UI) → Phase 5 (Finalize). No phase starts until previous passes acceptance. |
| **Actual** | All phases appear to have been built **simultaneously** or interleaved. UI, auth, billing, admin, tools were developed together. No phase boundary testing was done. |
| **Impact** | 🟡 **Medium** — The "tools-first" approach was not followed. However, the codebase compiles and 2,631 tests pass, suggesting integration worked despite parallel development. The intended benefit of isolation was lost. |

### DEV-036: Human Testing Checkpoints
| | Detail |
|---|---|
| **Planning** (`44_IMPLEMENTATION_ROADMAP.md`) | "Human tester confirms" at each phase boundary. Every 50 tools manually tested. |
| **Actual** | No evidence of systematic human testing. No phase completion reports (until now). |
| **Impact** | 🟡 **Medium** — Quality is being ensured through automated tests (2,631 passing) rather than manual verification. Both approaches are valid but planning specified manual. |

---

## 12. Impact Summary

### Critical Deviations (🔴 MUST FIX)

| ID | Description | Risk |
|----|-------------|------|
| DEV-009 | **2FA/TOTP missing** for admin panel | Security — admin operations unprotected |
| DEV-028 | **Kubernetes empty** — no production deploy | Cannot deploy to production |
| DEV-029 | **CI/CD missing** — no automated quality gates | Manual-only testing, no PR validation |
| DEV-030 | **Zero git commits** — no version history | No rollback, no history, no collaboration |

### Medium Deviations (🟡 SHOULD ADDRESS)

| ID | Description | Risk |
|----|-------------|------|
| DEV-001 | Admin has own API routes (actually better) | Architecture doc should be updated |
| DEV-002 | Inngest partially replaced by custom jobs | Unclear job retry/replay capability |
| DEV-003 | No Meilisearch | Tool search limited to basic filtering |
| DEV-004 | No R2 integration | File handling local-only in dev |
| DEV-005 | WASM covers ~19 of 191 text tools | Performance acceptable with JS fallback |
| DEV-011 | Session config needs verification | May not match 7-day/30-day spec |
| DEV-012 | No impersonation system | Support workflows limited |
| DEV-017 | OpenAPI auto-generation unclear | API docs may drift from code |
| DEV-020 | BA weight flow needs e2e verification | Billing accuracy at risk |
| DEV-022 | Not all 446 tools have 3 test vectors | Testing standard not met per spec |
| DEV-024 | Monaco advanced features unclear | Code editor may be basic |
| DEV-025 | No WebSocket for admin real-time | Monitoring requires manual refresh |
| DEV-026 | Role seeding may be incomplete | RBAC may not match 6-role spec |
| DEV-031 | Observability pipeline incomplete | Alerting limited to Sentry |
| DEV-032 | CSRF Origin/Referer check needed | Security hardening |
| DEV-033 | Security headers not verified | Browser hardening |
| DEV-034 | No structured logging with PII filter | Compliance risk |
| DEV-035 | Phase order not followed | Integration risks absorbed |

### Low/Positive Deviations (🟢 OK)

| ID | Description | Verdict |
|----|-------------|---------|
| DEV-006 | LibreOffice not in Docker | Add when needed for Office formats |
| DEV-007 | Tailwind v4 minor detail | No real deviation |
| DEV-008 | State management matches | No deviation |
| DEV-010 | Extra OAuth (Facebook) | Positive — more options |
| DEV-013 | Extra DB tables | Positive — more comprehensive |
| DEV-014 | CamelCase TypeScript / snake_case DB | Standard Drizzle pattern |
| DEV-015 | `oauthConnections` vs `social_auths` | Better naming |
| DEV-016 | Extra `ads` tRPC router | Positive addition |
| DEV-018 | No gRPC | Was optional in planning |
| DEV-019 | Billing providers match | No deviation |
| DEV-021 | Ad reward infrastructure complete | Schema matches spec |
| DEV-023 | Tool routing implemented | Minor pattern difference |
| DEV-027 | No IP whitelist | Optional per spec, add at deploy |

---

*Total: 36 deviations identified — 4 Critical, 18 Medium, 14 Low/Positive.*
