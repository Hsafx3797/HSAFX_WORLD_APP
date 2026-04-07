# 26 — Admin Panel Specification (Compacted)

> Separate Next.js app providing full platform management with RBAC, monitoring, and audit trails.

---

## Architecture

- **App:** `apps/admin` — Next.js 15, deployed to Vercel at `admin.hsafx.com`
- **Backend:** Shared with `apps/web` via API routes + `@hsafx/db`
- **Auth:** Better-Auth, email/password only (no OAuth), 24h session expiry, separate Redis namespace `admin:session:<id>`
- **2FA:** Required for all admins (TOTP-based). Re-verification for destructive operations.
- **IP Whitelist:** Optional, configurable via `ADMIN_IP_WHITELIST` env var.

**✅ Built** — Dashboard, users, subscriptions, tools, billing, audit log, impersonation, RBAC, admin API client, reusable DataTable/UI components all implemented.

---

## RBAC Roles

| Role        | Access                                                           |
| ----------- | ---------------------------------------------------------------- |
| Super Admin | All permissions                                                  |
| Admin       | Users + subscriptions + tools + system config + audit            |
| Support     | Users (view/edit) + subscriptions (view/manage) + billing (view) |
| Developer   | Tools + system config + logs + audit                             |
| Analyst     | View-only: analytics, reports, billing export                    |
| Billing     | Subscriptions (view) + billing (view/export)                     |

**✅ Built** — `packages/shared/src/permissions/admin-rbac.ts`, `requireAdminRole()` middleware.

### Destructive Operations (Require 2FA)

Delete user, ban user permanently, issue refund, manual coin adjustment, delete admin, change admin roles.

---

## Admin Pages (Built)

### Dashboard (`/dashboard`)

Real-time metrics: active users, executions, revenue, error rate. Active alerts panel. Charts (area, bar, pie via recharts). Top tools, recent errors.
**✅ Built** — `apps/admin/src/app/(admin)/dashboard/page.tsx`, hooks: `useDashboardMetrics`, `useDashboardAnalytics`, `useTopTools`, `useRecentErrors`, `useAlerts`.

### Users (`/users`)

Search/filter/sort/export. View/edit profile, ban/unban, delete (2FA), reset password, force logout, manual coin adjustment (2FA), view activity log.
**✅ Built** — `apps/admin/src/app/(admin)/users/page.tsx`

### Subscriptions (`/subscriptions`)

Search/filter/sort/export. Upgrade/downgrade, cancel (immediate or end-of-period), pause (1-3 months), resume, issue refund (2FA).
**✅ Built** — `apps/admin/src/app/(admin)/subscriptions/page.tsx`

### Tools (`/tools`)

Search/filter/sort. Edit metadata, enable/disable, force execution mode (browser/server/auto), tool analytics (usage, error rate, performance).
**✅ Built** — `apps/admin/src/app/(admin)/tools/page.tsx`

### Billing & Transactions

Coin transaction log (search/filter/export). Manual coin adjustment (2FA). Payment webhook logs (view/retry). Revenue/refund/reconciliation reports.
**✅ Built** — Admin API routes.

### Audit Log

View all admin actions with admin email, role, action, target, IP, user agent, timestamp. Searchable/filterable/exportable.
**✅ Built** — `apps/admin/src/app/api/admin/audit/route.ts` (real Drizzle ORM implementation).

### Impersonation

See doc 23. API: `apps/admin/src/app/api/admin/impersonate/route.ts`. UI wiring ❌ TODO (G16).

---

## System Configuration (Admin-Configurable)

| Setting               | What                                       | Status               |
| --------------------- | ------------------------------------------ | -------------------- |
| Feature flags         | Toggle features on/off                     | ✅ Built             |
| Rate limits           | Global, per-plan, per-API-key              | ✅ Built             |
| Anonymous user limits | Per-tool-class daily limits                | ✅ Built             |
| Plan editor           | Limits, permissions, theme access, pricing | ✅ Built             |
| Email templates       | Edit, preview, send test                   | ⚠️ Partial           |
| Ad reward settings    | Coins per ad, daily caps                   | ❌ Ad system removed |

---

## Audit Event Types

**User:** `user.create`, `user.edit`, `user.ban`, `user.unban`, `user.delete`
**Subscription:** `subscription.upgrade`, `subscription.downgrade`, `subscription.cancel`, `subscription.pause`, `subscription.resume`, `subscription.refund`
**Billing:** `coin.adjust`, `payment.refund`
**Tool:** `tool.enable`, `tool.disable`, `tool.edit`, `tool.exec_mode`
**System:** `config.feature_flag`, `config.rate_limit`, `config.email_template`
**Admin:** `admin.create`, `admin.role_change`, `admin.delete`

---

## Real-Time Updates

WebSocket connection to `/api/admin/ws` → subscribes to Redis Pub/Sub channels (`admin:errors`, `admin:alerts`, `admin:metrics`, `admin:jobs`, `admin:webhooks`). Dashboard auto-updates every 5 seconds for metrics, instant for errors/alerts.

---

## UI Components (Built)

Reusable component library in `apps/admin/src/components/ui/`: `DataTable` (sorting, pagination, actions), `StatCard`, `Card`, `Badge`, `Button`, `Input`, `Select`, `Modal`, `ConfirmModal`, `TotpModal`, `FormGroup`, `StatusBadge`, `PlanBadge`, `Toggle`, `Textarea`.
