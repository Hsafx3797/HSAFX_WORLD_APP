# 13 — Database Schema

> Compacted. Original 1374 lines. The actual source of truth is `packages/db/src/schema/` (Drizzle ORM).
> See `13_DATABASE_SCHEMA.dbml` for the table inventory.

---

## Technology

| Aspect       | Choice                                                                             |
| ------------ | ---------------------------------------------------------------------------------- |
| Database     | PostgreSQL (Neon, serverless)                                                           |
| ORM          | Drizzle ORM                                                                            |
| Driver       | `@neondatabase/serverless` (HTTP-based for edge)                                       |
| Schema files | `packages/db/src/schema/{users,auth,billing,b2b,tools,misc,config,audit,relations}.ts` |

## Schema Invariants (Critical Rules)

| #   | Rule                                  | Enforcement                                                             |
| --- | ------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Wallet balance derived from ledger    | App code cannot UPDATE balance directly; derive from `coinTransactions` |
| 2   | Soft-delete for auditable entities    | `deleted_at IS NULL` filter on unique indexes                           |
| 3   | UUIDs for all primary keys            | Avoids sequential ID enumeration                                        |
| 4   | Timestamps are UTC                    | `timestamp` without timezone                                            |
| 5   | Money stored in cents (bigint)        | Avoids floating-point precision issues                                  |
| 6   | Ledger tables INSERT-only             | No UPDATE/DELETE on `coinTransactions`, `auditLogs`                     |
| 7   | Foreign keys cascade on user deletion | Automatic cleanup                                                       |
| 8   | Unique constraints are partial        | `WHERE deleted_at IS NULL` for soft-delete awareness                    |

## Naming Conventions

| Type       | Convention         | Example                      |
| ---------- | ------------------ | ---------------------------- |
| Tables     | snake_case, plural | `users`, `coin_transactions` |
| Columns    | snake_case         | `user_id`, `created_at`      |
| PKs        | `id` (UUID)        | `gen_random_uuid()`          |
| FKs        | `{entity}_id`      | `user_id`, `plan_id`         |
| Timestamps | `*_at` suffix      | `created_at`, `deleted_at`   |
| Booleans   | `is_*` prefix      | `is_active`, `is_default`    |

## Domain Groups (6 schema files, ~50 tables)

| Domain        | Schema File  | Key Tables                                                                           |
| ------------- | ------------ | ------------------------------------------------------------------------------------ |
| Users         | `users.ts`   | users, userPreferences, userSettings                                                 |
| Auth/RBAC     | `auth.ts`    | roles, userRoles, rolePermissions, permissionsCatalog                                |
| Billing/Coins | `billing.ts` | plans, subscriptions, payments, coinTransactions, userCoinWallets, processedWebhooks |
| Tools/Usage   | `tools.ts`   | tools, toolCategories, usageCounters, toolExecutions, apiKeys, anonymousUsage        |
| Misc          | `misc.ts`    | asyncJobs, fileUploads, featureFlags, emailProviderConfig, adminSettings             |
| Config        | `config.ts`  | streakTiers, referralConfig, rateLimitConfig                                         |
| Audit         | `audit.ts`   | auditLogs, webhookLogs                                                               |
| B2B Billing   | `b2b.ts`     | b2bPlans, b2bSubscriptions, b2bSuites, b2bPlanQuotas, b2bSuiteCategories, b2bToolSuiteOverrides, b2bUsage |

## Key Enums (in Drizzle)

- `subscriptionStatus`: active, trialing, past_due, canceled, expired, paused
- `b2bSubscriptionStatus`: active, canceled, past_due, suspended
- `coinTransactionType`: purchase, bonus, spend, refund, admin_adjust, expiration
- `paymentStatus`: pending, paid, failed, refunded
- `invoiceStatus`: draft, open, partially_paid, paid, void, uncollectible
- `auditAction`: create, update, delete, grant, revoke, login, logout, payment, refund
- `flagType`: toggle, kill_switch, experiment, rollout
- `jobStatus`: pending, processing, completed, failed, cancelled

## Critical Indexes

- `u_users_email_active` — Partial unique on email WHERE deleted_at IS NULL
- `u_subscriptions_user_active` — One active sub per user WHERE deleted_at IS NULL
- `u_usage_counters_user_resource_period` — Composite unique (user, resource, period)
- `idx_coin_transactions_user` + `idx_coin_transactions_created` — Ledger queries
- `tools.search_vector` — Full-text search with GIN index
- `u_b2b_subscriptions_user_active` — One active B2B sub per user WHERE status='active'
- `u_b2b_plan_quotas_plan_suite` — Unique (planId, suiteId)
- `u_b2b_usage_user_suite_period` — Unique (userId, suiteId, periodStart)

## Migration Strategy

- Drizzle Kit for migrations (`packages/db/drizzle/`)
- Forward-only migrations in production
- Neon branch databases for testing schema changes
