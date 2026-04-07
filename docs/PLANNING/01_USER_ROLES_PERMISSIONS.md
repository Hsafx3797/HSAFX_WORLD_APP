# 01 — User Roles & Permissions

**Status:** ✅ APPROVED — Decisions Frozen

> **Plans** control what users CAN DO (features/limits). **Roles** control what admins CAN MANAGE (operations). Two separate systems, never overlap.

## Implementation Status

- ✅ DB schema: `roles`, `userRoles`, `rolePermissions`, `permissions` in `packages/db/src/schema/auth.ts`
- ✅ CASL ability definitions: `packages/shared/src/permissions/ability.ts` (UI-only; backend re-validates)
- ❌ No runtime RBAC enforcement middleware yet

---

## Plan-Based Access

Plans: `Guest < Free < Pro < Advance` (higher inherits lower). Feature flags + resource limits defined in `00_PRODUCT_REQUIREMENTS.md`.

Plan state **derived** from `trial_ends_at`, `current_period_end`, `canceled_at` → states: `trialing`, `active`, `active_canceling`, `past_due`, `expired`.

Downgrade: features restricted immediately, counters reset, coins retained, API keys deactivated.

---

## Admin RBAC Roles

| Role            | Level | Max | MFA | Can Assign                   |
| --------------- | ----- | --- | --- | ---------------------------- |
| super_admin     | 100   | 2   | ✅  | Any                          |
| admin           | 80    | 5   | ✅  | All except super_admin/admin |
| support_manager | 60    | 10  | —   | support_agent only           |
| support_agent   | 40    | 50  | —   | None                         |
| content_manager | 40    | 10  | —   | None                         |
| analyst         | 20    | 20  | —   | None                         |
| auditor         | 20    | 5   | ✅  | None                         |

Multiple roles allowed (unioned/additive, no deny). Cannot assign at/above own level. Cannot de-escalate self.

## Permission Catalog

Format: `{resource}.{action}`. Categories: `users.*`, `subscriptions.*`, `payments.*`, `coins.*`, `tools.*`, `plans.*`, `system.*`, `roles.*`, `audit.*`, `analytics.*`, `api.*`.

## Enforcement Flow

```
Request → Gateway (rate limit) → Auth → Permission Check (Plan or RBAC) → Limit Check → Handler
```

| Request Type | Auth       | Plan     | RBAC | Limits |
| ------------ | ---------- | -------- | ---- | ------ |
| Guest tool   | ❌         | ✅ guest | ❌   | ✅     |
| Authed tool  | ✅         | ✅       | ❌   | ✅     |
| Admin ops    | ✅ session | ❌       | ✅   | ❌     |
| B2B API      | ✅ key     | ✅       | ❌   | ✅     |

**Critical:** Admin API = session auth only (never API keys). Unknown permissions fail closed.

## Audit Logging

Auth events: 90d. Admin/system: 2yr. Billing/permissions: 7yr.
Actor types: `user`, `admin`, `system`, `webhook`, `support_impersonation`. Logged: who + what + old/new values + request context.
