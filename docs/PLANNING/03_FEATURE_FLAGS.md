# 03 — Feature Flags

**Status:** ✅ APPROVED — Design Locked | ⚠️ PARTIALLY BUILT

## Implementation Status

- ✅ DB table: `featureFlags` in `packages/db/src/schema/misc.ts` (types: toggle/kill_switch/experiment/rollout, rollout %, target users/roles)
- ❌ No runtime SDK (FlagClient/FlagService not implemented)
- ❌ No Redis caching, admin UI, abuse auto-triggers, or experiment assignment

---

## Flag Categories

| Category      | Prefix    | Purpose                                                 |
| ------------- | --------- | ------------------------------------------------------- |
| Plan Gates    | `plan.*`  | Derived from subscription, overridable via admin        |
| Tool Flags    | `tool.*`  | enabled/beta/deprecated/hidden/maintenance per tool     |
| Kill Switches | `kill.*`  | Emergency shutoffs (services, payments, auth)           |
| Experiments   | `exp.*`   | A/B tests with % rollout                                |
| Abuse Flags   | `abuse.*` | Per-user restrictions (rate limit, feature ban, freeze) |
| Maintenance   | `maint.*` | Planned degradation (DB readonly, degraded mode)        |

## Resolution Precedence

1. Kill switches (ALWAYS win) → 2. Abuse flags → 3. User override → 4. Plan override → 5. Global override → 6. % Rollout → 7. Default

**Invariant:** Kill switches bypass all. Abuse flags override plan entitlements. Plan overrides can only EXPAND, never restrict.

## Key Kill Switches (planned)

`kill.service.fastapi` (media down), `kill.service.r2` (uploads down), `kill.payment.stripe` (coin purchase down), `kill.payment.polar` (subs down), `kill.auth.oauth_google`, `kill.feature.api` (503), `kill.feature.coins`.

## Tool Access Resolution

`tool.enabled?` → `tool.maintenance?` (503+ETA) → `tool.beta?` (check beta_plans) → `tool.deprecated?` (warn+allow) → plan gate → access granted.

## Storage (planned)

PostgreSQL → Redis (hot cache: 5s kill switches, 60s flags, 5min experiments) → Application (per-request).

## Abuse Auto-Triggers (planned)

Rate limit 5x → 1hr ban. 10x → 24hr + review. Suspicious uploads → 24hr. Chargeback → disable coins. API abuse → 24hr. ToS → freeze.
24hr cooldown between same flag on same user.

## Flag Lifecycle

States: Draft → Active → Deprecated → Archived (never hard-deleted).
Review periods: experiments 30d, tools 90d, kill switches 7d, abuse 7d, maintenance 1d.
