Below is the **repository structure specification** for HSAFX WORLD.

This file is the **source of truth for repo layout decisions**.

It is derived from the locked planning set (especially [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md)).
If this document conflicts with system architecture, system architecture wins.

---

## ✅ Current Workspace (As-Is Today)

This workspace currently contains **documentation only**:

```
docs/
	00-41_*.md (24 planning & specification files)
	13_DATABASE_SCHEMA.dbml
	.env
```

The **target structure below** is what we will implement when code scaffolding begins.

---

## ✅ Core Principle (Non-negotiable)

**One backend → Multiple frontends**

* Backend = **authority**
* Admin App = **control plane**
* User App = **execution plane**

---

## 🗂️ ROOT (Monorepo – correct choice)

```
.github/
docs/                 → Planning + product documentation
backend/              → Authoritative Next.js backend + FastAPI stateless compute runtime + native orchestration
apps/                 → Frontend apps (User SaaS + Admin Panel)
packages/             → Shared frontend packages (UI, schemas, permissions)
infra/                → Docker, CI, deploy
```

---

## 🐍 backend/ (Services + Next.js Backend)

```
backend/
├── api/                        # Next.js API routes (ALL database writes)
│   ├── auth/                   # DB: users, sessions, oauth_accounts
│   ├── users/                  # DB: users, user_profiles
│   ├── permissions/            # DB: permissions, role_permissions
│   ├── subscriptions/          # DB: subscriptions, subscription_plans
│   ├── limits/                 # DB: plan_limits, usage_counters
│   ├── billing/                # DB: payments, invoices, coin_transactions
│   ├── audit_logs/             # DB: audit_logs
│   ├── tools/                  # DB: billable_action_logs
│   ├── admin/                  # Admin-only endpoints (DB writes)
│   └── internal/               # Service-to-service API (for FastAPI)
│
├── fastapi/                    # FastAPI compute runtime (stateless)
│   ├── services/
│   │   ├── text_transform/     # NO DB writes
│   │   ├── image_converter/    # NO DB writes
│   │   ├── video_processor/    # NO DB writes
│   │   ├── document_converter/ # NO DB writes
│   │   └── calculator/         # NO DB writes
│   ├── utils/
│   │   └── nextjs_client.py    # Calls Next.js internal API for metadata
│   └── main.py
│
├── rust/                       # Shared Rust crates (WASM + native)
│
└── shared/
    ├── schemas/
    ├── errors/
    ├── security/
    └── config/
```

**Architecture: Model A (Next.js-Only Database Writes)**

- **Next.js** owns ALL database writes (auth, users, subscriptions, billing, usage tracking)
- **FastAPI** is stateless compute-only (tool execution, no database access)
- **Service Authentication**: FastAPI → Next.js via `X-Service-Key` header
- **Job Flow**: User → Next.js (validate + pre-authorize) → FastAPI (execute) → Next.js (log + deduct coins)

**Reference**: See [BACKEND_OWNERSHIP_MATRIX.md](./BACKEND_OWNERSHIP_MATRIX.md) for complete ownership matrix and decision rationale.

**Environment Variables**:
- **Next.js**: Has `DATABASE_URL`, runs all migrations
- **FastAPI**: NO `DATABASE_URL`, uses `NEXT_JS_API_BASE_URL` + `NEXT_JS_API_KEY`

---

## 🌐 Frontend (Split Apps – THIS IS KEY)

```
apps/
├── web/              → User-facing SaaS
├── admin/            → Internal Admin Panel
```

**Shared Backend**: Both apps talk to the **same Next.js API** (shared business logic).

---

## 🧑‍💻 apps/web (User SaaS)

```
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── (tools)/            → GROUP 1–5 tools
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── billing/
│   │
│   ├── components/
│   │   ├── tools/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── hooks/
│   ├── stores/
│   ├── lib/
│   │   ├── api/                → tRPC clients
│   │   ├── wasm/
│   │   └── permissions/
│   │
│   └── server/
│       ├── tool-execution/
│       └── limits/
```

---

## 🛠️ apps/admin (Admin Control Panel)

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── users/
│   │   ├── plans/
│   │   ├── permissions/
│   │   ├── tools/
│   │   ├── themes/
│   │   ├── audit-logs/
│   │   └── system/
│   │
│   ├── components/
│   │   ├── tables/
│   │   ├── charts/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── admin-api/
│   │   └── access-control/
│   │
│   └── server/
│       ├── admin-actions/
│       └── system-jobs/
```

**Admin app has:**

* Feature toggles
* Tool enable/disable
* Rate limits
* Pricing rules
* Role policies
* Theme control
* Audit logs

---

## 📦 packages/ (Shared Frontend Brain)

```
packages/
├── ui/               → shared shadcn components
├── schemas/          → zod schemas
├── permissions/      → CASL rules
├── tool-definitions/ → metadata for GROUP 1–5
├── theme/             → theme intent types + derivation helpers + presets registry
└── config/
```

---

## 🧠 How UI GROUPS Fit (Important)

**Tools NEVER live directly in Admin**

* Admin → manages **tool metadata**
* Web → renders **tool UIs**

```
packages/tool-definitions/
├── group-1/
├── group-2/
├── group-3/
├── group-4/
└── group-5/
```

Each tool has:

* UI schema
* permission key
* execution target (WASM / API / Worker)

---

## 🔒 “Source of Truth” Rules

- Product + architecture decisions live in `docs/planning/*`.
- DB schema source of truth is `docs/DATABASE_SCHEMA.dbml` (see planning/04 for the written spec).
- Theme system spec is `docs/THEME_SYSTEM.md`; preset CSS catalog is `docs/THEME_PRESETS.md`.

---

## 🔑 Final Rule Summary

✔ One backend
✔ Two frontend apps
✔ Shared packages
✔ Admin = configuration
✔ App = execution
✔ Tools are **data-driven**, not hardcoded