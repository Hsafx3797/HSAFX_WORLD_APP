# 04 — Database Schema

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — Schema v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `00_PRODUCT_REQUIREMENTS`, `01_USER_ROLES_PERMISSIONS`, and `21_BILLING_LOGIC`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Schema Invariants](#2-schema-invariants)
3. [Domain Groupings](#3-domain-groupings)
4. [Core User Management](#4-core-user-management)
5. [Authentication & Sessions](#5-authentication--sessions)
6. [Subscription & Billing](#6-subscription--billing)
7. [Coin System (Ledger)](#7-coin-system-ledger)
8. [Plan Features & Limits](#8-plan-features--limits)
9. [Admin RBAC](#9-admin-rbac)
10. [Usage Tracking](#10-usage-tracking)
11. [Anonymous Usage (Abuse Prevention)](#11-anonymous-usage-abuse-prevention)
12. [Tools & API Configuration](#12-tools--api-configuration)
13. [Audit Logging](#13-audit-logging)
14. [Email System](#14-email-system)
15. [Entity Relationship Diagram](#15-entity-relationship-diagram)
16. [Index Strategy](#16-index-strategy)
17. [Migration Strategy](#17-migration-strategy)
18. [Drizzle ORM Considerations](#18-drizzle-orm-considerations)

---

## 1. Overview

### 1.1 Database Technology

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Database** | PostgreSQL (Neon) | Edge-compatible, serverless, strong ACID guarantees |
| **ORM** | Drizzle ORM | Type-safe, edge-compatible, minimal abstraction |
| **Connection** | `@neondatabase/serverless` | HTTP-based driver for edge functions |
| **Schema Format** | DBML (source of truth) → Drizzle (runtime) | Human-readable design, type-safe execution |

### 1.2 Schema Scope

This document covers:
- All persistent data stored in PostgreSQL
- Logical relationships between entities
- Index strategy for query performance
- Soft-delete patterns and retention rules

**Not covered here:**
- Redis key schemas → See [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md#7-caching-strategy)
- R2 object storage → See [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md#6-external-service-integration)

### 1.3 Naming Conventions

| Entity Type | Convention | Example |
|-------------|------------|---------|
| Tables | `snake_case`, plural | `users`, `coin_transactions` |
| Columns | `snake_case` | `user_id`, `created_at` |
| Primary keys | `id` (UUID) | `id uuid pk` |
| Foreign keys | `{entity}_id` | `user_id`, `plan_id` |
| Timestamps | `*_at` suffix | `created_at`, `deleted_at` |
| Booleans | `is_*` prefix | `is_active`, `is_default` |
| Enums | `snake_case` | `subscription_status`, `coin_txn_type` |

---

## 2. Schema Invariants

> **These rules must be enforced at the database level wherever possible.**

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Wallet balance is derived from ledger** | Trigger or reconciliation job; app code cannot UPDATE balance directly |
| 2 | **Soft-delete for auditable entities** | `deleted_at IS NULL` filter on unique indexes |
| 3 | **UUIDs for all primary keys** | Avoids sequential ID enumeration attacks |
| 4 | **Timestamps are UTC** | `timestamp` without timezone, application handles conversion |
| 5 | **Money stored in cents (bigint)** | Avoids floating-point precision issues |
| 6 | **Ledger tables are INSERT-only** | No UPDATE or DELETE on `coin_transactions`, `audit_logs` |
| 7 | **Foreign keys cascade on user deletion** | User data cleanup is automatic |
| 8 | **Unique constraints are partial (soft-delete aware)** | `WHERE deleted_at IS NULL` |

---

## 3. Domain Groupings

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA DOMAINS                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│   USER IDENTITY     │  │   BILLING & COINS   │  │   ACCESS CONTROL     │
├─────────────────────┤  ├─────────────────────┤  ├──────────────────────┤
│ • users             │  │ • subscription_plans│  │ • roles              │
│ • sessions          │  │ • subscriptions     │  │ • permissions_catalog│
│ • social_auths      │  │ • payments          │  │ • permission_groups  │
│ • password_reset_   │  │ • invoices          │  │ • role_permissions   │
│   tokens            │  │ • invoice_payments  │  │ • user_roles         │
│ • email_verif_      │  │ • payment_methods   │  │ • user_permission_   │
│   tokens            │  │ • user_coin_wallets │  │   overrides          │
│ • user_preferences  │  │ • coin_transactions │  └──────────────────────┘
│ • user_settings     │  │ • coin_packs        │
└─────────────────────┘  │ • coin_purchase_    │  ┌─────────────────────┐
                         │   payments          │  │   PLAN FEATURES     │
┌─────────────────────┐  │ • tool_coin_costs   │  ├─────────────────────┤
│   TOOLS & API       │  │ • plan_coin_rules   │  │ • plan_features     │
├─────────────────────┤  │ • usage_coin_       │  │ • plan_limits       │
│ • tools             │  │   fallbacks         │  │ • plan_metadata     │
│ • api_rate_limits   │  └─────────────────────┘  │ • plan_upgrade_rules│
│ • anonymous_usage   │                           │ • plan_audit_logs   │
│ • api_request_logs  │  ┌─────────────────────┐  └─────────────────────┘
└─────────────────────┘  │   AUDIT & LOGGING   │
                         ├─────────────────────┤  ┌─────────────────────┐
┌─────────────────────┐  │ • audit_logs        │  │   EMAIL SYSTEM      │
│   USAGE TRACKING    │  │ • permission_audit_ │  ├─────────────────────┤
├─────────────────────┤  │   logs              │  │ • email_provider_   │
│ • usage_counters    │  │ • plan_audit_logs   │  │   config            │
└─────────────────────┘  └─────────────────────┘  │ • email_usage_      │
                                                  │   tracking          │
                                                  │ • admin_settings    │
                                                  └─────────────────────┘
```

---

## 4. Core User Management

### 4.1 Users Table

The `users` table is the central identity table. All other user data references this.

```sql
Table users {
  id uuid [pk, default: gen_random_uuid()]
  email text [not null]                     -- Unique among active (see index)
  username text                             -- Unique among active (see index)
  password_hash text [not null]             -- bcrypt hashed
  full_name text
  avatar_url text
  phone_number text
  is_active boolean [not null, default: true]
  is_email_verified boolean [not null, default: false]
  last_login timestamp
  created_at timestamp [not null, default: now()]
  updated_at timestamp [not null, default: now()]
  deleted_at timestamp                      -- Soft delete
  
  indexes {
    email [unique, where: deleted_at IS NULL]     -- Allows re-registration after deletion
    username [unique, where: deleted_at IS NULL]  -- Allows username reuse after deletion
  }
}
```

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| No `role` column | Roles managed via `user_roles` join table for flexible RBAC |
| Soft delete | Account recovery, audit trail, legal compliance |
| Separate `is_active` | Allows disabling without deletion |
| `password_hash` always required | Even OAuth users get a placeholder or random hash |

### 4.2 User Preferences & Settings

Separated into two tables for different concerns:

| Table | Purpose | Update Frequency |
|-------|---------|------------------|
| `user_preferences` | UI/UX choices (theme, language) | User-initiated |
| `user_settings` | Communication preferences | User-initiated |

```sql
-- One-to-one relationship with users
Table user_preferences {
  id uuid [pk]
  user_id uuid [not null, unique, ref: > users.id]
  theme text [default: 'system']        -- light, dark, system
  language text [default: 'en']
  timezone text [default: 'UTC']
  preferences jsonb [default: '{}']     -- Extensible
}

Table user_settings {
  id uuid [pk]
  user_id uuid [not null, unique, ref: > users.id]
  email_notifications boolean [default: true]
  push_notifications boolean [default: false]
  marketing_emails boolean [default: false]
  settings jsonb [default: '{}']        -- Extensible
}
```

---

## 5. Authentication & Sessions

### 5.1 Session Management

> **⚠️ Invariant:** Sessions are stored in Redis for fast access (see Architecture doc).  
> This table is for **session metadata persistence**, not the session token itself.

```sql
Table sessions {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  refresh_token_hash text [not null]      -- SHA256 hash of refresh token (never store plaintext)
  expires_at timestamp [not null]
  created_at timestamp [not null, default: now()]
  ip_address text
  user_agent text
  
  indexes {
    (user_id, refresh_token_hash) [unique]  -- One refresh token per user-session
  }
}
```

> **⚠️ Security Invariant: Token Storage**  
> - `refresh_token_hash` stores SHA256 hash, **never plaintext**
> - Application hashes token before lookup: `WHERE refresh_token_hash = SHA256(token)`
> - This prevents token theft if DB is compromised

### 5.2 OAuth / Social Authentication

```sql
Table social_auths {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  provider text [not null]                -- google, github, etc.
  provider_id text [not null]             -- Unique ID from provider
  access_token text                       -- Consider encrypting
  refresh_token text                      -- Consider encrypting
  expires_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (provider, provider_id) [unique]      -- One account per provider
  }
}
```

> **⚠️ Security Note:**  
> OAuth tokens (`access_token`, `refresh_token`) are sensitive.  
> Consider encrypting at rest or using a secrets manager.

### 5.3 Token Tables

```sql
-- Password reset (short-lived, single-use)
Table password_reset_tokens {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  token text [not null, unique]
  expires_at timestamp [not null]
  used boolean [not null, default: false]
  created_at timestamp [not null]
}

-- Email verification (short-lived, single-use)
Table email_verification_tokens {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  token text [not null, unique]
  expires_at timestamp [not null]
  verified boolean [not null, default: false]
  created_at timestamp [not null]
}
```

---

## 6. Subscription & Billing

### 6.1 Subscription Plans

Plans are **data-driven configuration**, not code enums.

```sql
Table subscription_plans {
  id uuid [pk]
  code text [not null, unique]            -- 'free', 'pro', 'advance' (stable identifier)
  name text [not null]                    -- Display name
  price_cents bigint [not null, default: 0]
  currency text [not null, default: 'USD']
  interval billing_interval [not null, default: 'monthly']
  description text
  is_active boolean [not null, default: true]
  is_popular boolean [not null, default: false]
  stripe_price_id text                    -- Stripe integration
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Enum billing_interval {
  monthly
  yearly
}
```

**Plan Code Hierarchy:**
```
guest → free → pro → advance
```

### 6.2 User Subscriptions

> **⚠️ Invariant:** Subscription status is **derived**, never stored as a column.

```sql
Table subscriptions {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  plan_id uuid [not null, ref: > subscription_plans.id]
  
  -- Period tracking
  start_date timestamp [not null]
  current_period_start timestamp
  current_period_end timestamp
  end_date timestamp
  
  -- Trial & cancellation
  trial_ends_at timestamp
  canceled_at timestamp
  cancel_reason text
  cancel_at_period_end boolean [not null, default: false]
  auto_renew boolean [not null, default: true]
  
  -- Coin override (nullable = inherit plan setting)
  allow_coin_usage_override boolean
  
  -- External reference
  stripe_subscription_id text
  
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
  
  indexes {
    -- Only one active subscription per user (enforced at DB level)
    user_id [unique, where: deleted_at IS NULL]
  }
}
```

> **⚠️ Invariant: Single Active Subscription**  
> A user can have only ONE non-deleted subscription at any time.  
> Historical subscriptions are soft-deleted when a new one is created.

**Status Derivation Logic:**

```typescript
function deriveSubscriptionStatus(sub: Subscription): SubscriptionStatus {
  const now = new Date();
  
  if (sub.canceled_at && sub.canceled_at <= now) return 'canceled';
  if (sub.trial_ends_at && sub.trial_ends_at > now) return 'trial';
  if (sub.current_period_end && sub.current_period_end < now) return 'expired';
  if (sub.cancel_at_period_end) return 'active'; // Still active until period ends
  return 'active';
}
```

### 6.3 Payments & Invoices

```sql
Table payments {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  subscription_id uuid [ref: > subscriptions.id]
  amount_cents bigint [not null]
  currency text [not null, default: 'USD']
  status payment_status [not null, default: 'pending']
  provider text [not null]                -- 'stripe', 'paypal'
  provider_payment_id text                -- External ID
  payment_method_id text
  metadata jsonb [default: '{}']
  paid_at timestamp
  created_at timestamp [not null]
  deleted_at timestamp
}

Enum payment_status {
  pending
  paid
  failed
  refunded
}

Table invoices {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  subscription_id uuid [ref: > subscriptions.id]
  invoice_number text [not null, unique]
  amount_cents bigint [not null]
  currency text [not null, default: 'USD']
  status invoice_status [not null, default: 'draft']
  due_date timestamp [not null]
  paid_at timestamp
  payload jsonb [default: '{}']           -- Line items
  created_at timestamp [not null]
  deleted_at timestamp
}

Enum invoice_status {
  draft
  open
  partially_paid
  paid
  void
  uncollectible
}

-- Supports partial payments and refunds
Table invoice_payments {
  id uuid [pk]
  invoice_id uuid [not null, ref: > invoices.id]
  payment_id uuid [not null, ref: > payments.id]
  amount_cents bigint [not null]
  created_at timestamp [not null]
}

Table payment_methods {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  provider text [not null]
  provider_method_id text [not null]
  type text [not null]                    -- 'card', 'bank_account'
  last4 text
  brand text                              -- 'visa', 'mastercard'
  expiry_month text
  expiry_year text
  is_default boolean [not null, default: false]
  created_at timestamp [not null]
  deleted_at timestamp
  
  indexes {
    -- Only one default payment method per user
    user_id [unique, where: is_default = true AND deleted_at IS NULL]
  }
}
```

---

## 7. Coin System (Ledger)

> **⚠️ Invariant:** The `coin_transactions` table is an **immutable ledger**.  
> Wallet balance is always derivable: `SUM(amount) WHERE user_id = ?`

### 7.1 Wallet (Cached Balance)

```sql
Table user_coin_wallets {
  user_id uuid [pk, ref: > users.id]      -- One wallet per user
  balance bigint [not null, default: 0]   -- CACHED: derived from ledger
  lifetime_earned bigint [not null, default: 0]
  lifetime_spent bigint [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
}
```

**Balance Update Strategy:**

| Option | Description | When to Use |
|--------|-------------|-------------|
| **Trigger** | Auto-update on ledger INSERT | Low-volume, simple setups |
| **Reconciliation Job** | Periodic batch recalculation | High-volume, prevents contention |

> **Recommended:** Start with trigger for MVP, switch to reconciliation job if write contention becomes an issue.

> **⚠️ Invariant: Wallet is Cache Only**  
> `user_coin_wallets.balance` is a **cached value**, not the source of truth.  
> - **Source of truth:** `SELECT SUM(amount) FROM coin_transactions WHERE user_id = ?`
> - **Trigger:** Optimization for fast reads (may drift under concurrent writes)
> - **Reconciliation job:** REQUIRED — runs periodically to detect and fix drift
> - **Billing decisions:** Always verify against ledger, never trust wallet alone

### 7.2 Transaction Ledger

```sql
Table coin_transactions {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  amount bigint [not null]                -- Positive = credit, Negative = debit
  txn_type coin_txn_type [not null]
  reference_type text                     -- 'payment', 'tool_usage', 'admin'
  reference_id uuid                       -- ID of related entity
  metadata jsonb [default: '{}']
  created_at timestamp [not null]
  
  indexes {
    user_id
    txn_type
    created_at
    -- Partial unique for idempotency (see DDL section)
  }
}

Enum coin_txn_type {
  purchase      -- User bought coins
  bonus         -- System-granted coins
  spend         -- Tool usage deduction
  refund        -- Coins returned
  admin_adjust  -- Manual admin adjustment
  expiration    -- Expired coins (if implementing expiry)
}
```

### 7.3 Coin Products & Rules

```sql
Table coin_packs {
  id uuid [pk]
  code text [not null, unique]            -- 'starter_100', 'pro_1000'
  coins bigint [not null]
  price_cents bigint [not null]
  currency text [not null, default: 'USD']
  bonus_coins bigint [not null, default: 0]
  is_active boolean [not null, default: true]
  stripe_price_id text
  created_at timestamp [not null]
}

-- Links payments to coin credits
Table coin_purchase_payments {
  id uuid [pk]
  payment_id uuid [not null, ref: > payments.id]
  coin_pack_id uuid [not null, ref: > coin_packs.id]
  coins_credited bigint [not null]
  created_at timestamp [not null]
}

-- Tool-specific coin costs
Table tool_coin_costs {
  id uuid [pk]
  tool_id uuid [not null, ref: > tools.id]
  action_key text [not null]              -- 'image.generate', 'pdf.export'
  coin_cost bigint [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  
  indexes {
    (tool_id, action_key) [unique]
  }
}

-- Plan-level coin rules
Table plan_coin_rules {
  id uuid [pk]
  plan_id uuid [not null, unique, ref: > subscription_plans.id]
  allow_coin_usage boolean [not null, default: true]
  coin_discount_percent int [not null, default: 0]  -- 0-100
  created_at timestamp [not null]
}

-- Fallback costs when plan limits exceeded
Table usage_coin_fallbacks {
  id uuid [pk]
  plan_id uuid [ref: > subscription_plans.id]
  resource_key text [not null]            -- 'image.generate.count'
  coin_cost bigint [not null]
  created_at timestamp [not null]
  
  indexes {
    (plan_id, resource_key) [unique]
  }
}
```

---

## 8. Plan Features & Limits

### 8.1 Feature Flags

Boolean toggles per plan:

```sql
Table plan_features {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  feature_key text [not null]             -- 'ads_visibility', 'priority_support'
  enabled boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (plan_id, feature_key) [unique]
  }
}
```

**Example Feature Keys:**
- `tools.text.advanced` — Access to advanced text tools
- `api.access` — API key generation allowed
- `ads.hide` — No advertisements shown
- `support.priority` — Priority support queue

### 8.2 Resource Limits

Numeric/complex limits per plan:

```sql
Table plan_limits {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  resource_key text [not null]            -- 'image.file_size', 'api.requests'
  
  -- Type discrimination
  value_type plan_limit_type
  is_unlimited boolean [not null, default: false]
  
  -- Value storage (use appropriate field based on value_type)
  -- NOTE: max_value (text) has been REMOVED — use typed fields only
  max_value_bigint bigint                 -- For numeric limits
  max_value_json jsonb                    -- For complex rules
  
  reset_period reset_period               -- When limit resets
  sort_order int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (plan_id, resource_key) [unique]
  }
}

Enum plan_limit_type {
  integer     -- Simple numeric
  size        -- Bytes (KB, MB, GB)
  duration    -- Seconds, minutes
  boolean     -- On/off
  complex     -- JSON-defined rules
}

### 6.5 Plan Permissions (✅ Admin-Configurable)

> **Purpose:** Define granular permissions per plan (tool categories, feature access).  
> **Admin Control:** Managed via admin panel - no code changes needed.

```sql
Table plan_permissions {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  permission_type permission_type [not null]  -- 'tool_category', 'feature', 'api_access'
  resource_key text [not null]                -- 'logistics', 'bulk', 'API', 'PrioritySupport'
  is_allowed boolean [not null, default: true]
  description text                            -- Human-readable description
  sort_order int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (plan_id, permission_type, resource_key) [unique]
  }
}

Enum permission_type {
  tool_category   -- Controls access to tool categories (e.g., 'logistics', 'bulk')
  feature         -- Controls feature access (e.g., 'API', 'PrioritySupport')
  api_access      -- API-specific permissions
}
```

**Example Rows (Managed via Admin Panel):**

| plan_id | permission_type | resource_key | is_allowed |
|---------|----------------|--------------|------------|
| free-id | tool_category | logistics | false |
| free-id | tool_category | bulk | false |
| free-id | feature | API | false |
| pro-id | tool_category | logistics | true |
| pro-id | tool_category | bulk | true |
| pro-id | feature | API | true |
| pro-id | feature | PrioritySupport | false |

### 6.6 Plan Theme Access (✅ Admin-Configurable)

> **Purpose:** Control which theme presets are available per plan.  
> **Admin Control:** Managed via admin panel with drag-and-drop preset assignment.

```sql
Table plan_theme_access {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  preset_code text [not null]              -- 'default', 'red', 'pro-dark', etc.
  is_available boolean [not null, default: true]
  sort_order int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (plan_id, preset_code) [unique]
  }
}
```

**Example Rows (Managed via Admin Panel):**

| plan_id | preset_code | is_available |
|---------|------------|--------------|
| guest-id | default | true |
| free-id | default | true |
| free-id | red | true |
| free-id | green | true |
| free-id | blue | true |
| pro-id | * (all solid/flag presets) | true |
| advance-id | * (all presets) | true |

Enum reset_period {
  hourly
  daily
  monthly
  yearly
  never       -- Lifetime limit
}
```

**Example Resource Keys:**
- `image.file_size.max_mb` — Maximum upload size
- `video.duration.max_seconds` — Maximum video length
- `api.requests.daily` — API calls per day
- `tools.executions.monthly` — Tool uses per month

**Usage Pattern Example:**

```typescript
// Check if user has unlimited access
async function checkResourceLimit(userId: string, resourceKey: string): Promise<{ allowed: boolean; limit?: number }> {
  const userPlan = await getUserCurrentPlan(userId);
  const limit = await db.query.plan_limits.findFirst({
    where: and(
      eq(plan_limits.plan_id, userPlan.id),
      eq(plan_limits.resource_key, resourceKey)
    )
  });
  
  if (!limit) {
    return { allowed: false }; // No limit configured = deny by default
  }
  
  // Check for unlimited access first
  if (limit.is_unlimited) {
    return { allowed: true }; // Skip usage checks
  }
  
  // Otherwise check typed value
  const maxValue = limit.max_value_bigint ?? 0;
  const currentUsage = await getCurrentUsage(userId, resourceKey, limit.reset_period);
  
  return {
    allowed: currentUsage < maxValue,
    limit: maxValue
  };
}
```

**⚠️ Critical:** Always check `is_unlimited === true` BEFORE reading typed value fields. When `is_unlimited` is true, typed fields may be NULL.

### 8.3 Plan Metadata & Upgrade Rules

```sql
Table plan_metadata {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  meta_key text [not null]                -- 'promo_message', 'beta_flag'
  meta_value jsonb
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table plan_upgrade_rules {
  id uuid [pk]
  from_plan_id uuid [not null, ref: > subscription_plans.id]
  to_plan_id uuid [not null, ref: > subscription_plans.id]
  auto_upgrade boolean [not null, default: false]
  conditions jsonb [default: '{}']        -- { usageThreshold: 90 }
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table plan_audit_logs {
  id uuid [pk]
  plan_id uuid [not null, ref: > subscription_plans.id]
  changed_by uuid [not null, ref: > users.id]
  change_type plan_change_type [not null]
  changes jsonb [not null]                -- { old: {...}, new: {...} }
  reason text
  ip_address text
  user_agent text
  created_at timestamp [not null]
}

Enum plan_change_type {
  feature_toggle
  limit_update
  metadata_add
  metadata_remove
}
```

---

## 9. Admin RBAC

> **⚠️ Scope:** This system controls **admin operations only**.  
> See [02_USER_ROLES_PERMISSIONS.md](02_USER_ROLES_PERMISSIONS.md) for full RBAC design.

### 9.1 Roles

```sql
Table roles {
  id uuid [pk]
  name text [not null]                    -- 'super_admin', 'admin', 'support'
  role_type admin_role_type [not null, default: 'system']
  description text
  is_default boolean [not null, default: false]
  is_active boolean [not null, default: true]
  sort_order int [not null, default: 0]
  deleted_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Enum admin_role_type {
  system      -- Built-in, cannot delete
  custom      -- User-created
}
```

### 9.2 Permission Catalog

```sql
Table permission_groups {
  id uuid [pk]
  key text [not null, unique]             -- 'admin_pages', 'user_management'
  name text [not null]
  description text
  sort_order int [not null, default: 0]
  created_at timestamp [not null]
}

Table permissions_catalog {
  id uuid [pk]
  permission_key text [not null]          -- 'users.read', 'billing.refund'
  scope text [not null, default: 'admin'] -- 'admin' or 'user'
  permission_group_id uuid [not null, ref: > permission_groups.id]
  description text
  sort_order int [not null, default: 0]
  deleted_at timestamp
  created_at timestamp [not null]
  
  indexes {
    -- Unique per scope: allows 'users.read' (admin) AND 'users.read' (user)
    (scope, permission_key) [unique, where: deleted_at IS NULL]
  }
}
```

> **⚠️ Invariant:** Permission keys are **immutable once published**.  
> Soft-delete and create new if semantics change.

### 9.3 Role Assignments

```sql
-- Role → Permission mapping
Table role_permissions {
  id uuid [pk]
  role_id uuid [not null, ref: > roles.id]
  permission_id uuid [not null, ref: > permissions_catalog.id]
  granted boolean [not null, default: true]
  created_at timestamp [not null]
  
  indexes {
    (role_id, permission_id) [unique]
  }
}

-- User → Role mapping
Table user_roles {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  role_id uuid [not null, ref: > roles.id]
  expires_at timestamp                    -- For temporary roles
  created_at timestamp [not null]
  
  indexes {
    (user_id, role_id) [unique]
  }
}

-- Per-user permission overrides
Table user_permission_overrides {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  permission_id uuid [not null, ref: > permissions_catalog.id]
  granted boolean [not null]              -- true = grant, false = deny
  reason text
  expires_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (user_id, permission_id) [unique]
  }
}
```

---

## 10. Usage Tracking

### 10.1 Usage Counters

Authoritative usage data for authenticated users:

```sql
Table usage_counters {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  resource_key text [not null]            -- 'image.convert.count'
  source text                             -- 'api', 'web', 'admin'
  period_start timestamp [not null]
  period_end timestamp                    -- NULL = lifetime counter (never resets)
  usage_value bigint [not null, default: 0]
  last_reset_at timestamp [not null]
  metadata jsonb [default: '{}']
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (user_id, resource_key, period_start) [unique]
  }
}
```

**Period Management:**

| Reset Period | Period Start | Period End |
|--------------|--------------|------------|
| Daily | Today 00:00 UTC | Today 23:59 UTC |
| Monthly | 1st of month | Last day of month |
| Yearly | Jan 1 | Dec 31 |
| Never | User creation | **NULL** (lifetime, unbounded) |

### 10.2 Usage vs Redis Counters

| Storage | Purpose | Speed | Durability |
|---------|---------|-------|------------|
| **Redis** | Real-time rate limiting | Fast | Best-effort |
| **PostgreSQL** | Authoritative billing/limits | Slower | Guaranteed |

> **⚠️ Invariant:** For billing-sensitive limits, PostgreSQL is the **source of truth**.  
> Redis counters are optimistic and may drift slightly.

---

## 11. Anonymous Usage (Abuse Prevention)

> **⚠️ Purpose:** Abuse prevention for unauthenticated users.  
> **NOT** for product analytics (see PRD Invariant #6).

### 11.1 Anonymous Tracking Table

```sql
Table anonymous_usage {
  id uuid [pk]
  identifier text [not null]              -- IP hash or fingerprint
  identifier_type identifier_type [not null, default: 'ip_hash']
  tool_id uuid [not null, ref: > tools.id]
  period_start timestamp [not null]
  period_end timestamp [not null]
  usage_value bigint [not null, default: 0]
  created_at timestamp [not null]
  
  indexes {
    (identifier_type, identifier, tool_id, period_start) [unique]
  }
}

Enum identifier_type {
  ip_hash       -- SHA256 of IP address
  fingerprint   -- Browser fingerprint hash
}
```

### 11.2 Two Anonymous Systems

Per PRD Invariant #6, there are **two separate systems**:

| System | Purpose | Storage | Data Retained |
|--------|---------|---------|---------------|
| **Abuse Prevention** | Rate limiting anonymous users | `anonymous_usage` | 24-48 hours |
| **Product Analytics** | Usage metrics, dashboards | Plausible/Umami | Per retention policy |

**Never mix these systems.** Abuse prevention data is security infrastructure, not product telemetry.

---

## 12. Tools & API Configuration

### 12.1 Tool Registry

```sql
Table tools {
  id uuid [pk]
  tool_key text [not null]                -- 'image_converter', 'pdf_merge'
  name text [not null]
  description text
  is_public boolean [not null, default: true]  -- Accessible without auth?
  is_active boolean [not null, default: true]
  deleted_at timestamp
  created_at timestamp [not null]
  
  indexes {
    tool_key [unique, where: deleted_at IS NULL]
  }
}
```

> **⚠️ `is_public` vs Plan Features Precedence**  
> - `is_public = true` → Tool visible to unauthenticated users (Guest tier)
> - `is_public = false` → Tool requires authentication
> - **Plan features ALWAYS apply after visibility check**
> - A tool being public does NOT bypass plan-based feature gating
> - Example: Public tool + `tools.advanced` feature flag = authenticated users with that feature only

### 12.2 Rate Limits Configuration

```sql
Table api_rate_limits {
  id uuid [pk]
  tool_id uuid [not null, ref: > tools.id]
  plan_id uuid [ref: > subscription_plans.id]  -- NULL = all plans
  requests_per_minute int
  burst_limit int
  period reset_period                     -- NULL = per-minute enforcement
  created_at timestamp [not null]
  
  indexes {
    (tool_id, plan_id) [unique]
  }
}
```

**Enforcement Note:**
- `requests_per_minute` + `period = NULL` → Per-minute sliding window
- `requests_per_minute` + `period = daily` → Daily quota

### 12.3 API Keys (B2B Authentication) (✅ Admin-Configurable)

> **Purpose:** Programmatic access for B2B customers.  
> **Admin Control:** Rate limits, scopes, and expiration managed via admin panel.

```sql
Table api_keys {
  id uuid [pk]
  user_id uuid [not null, ref: > users.id]
  key_hash text [not null, unique]        -- SHA256 hash, never plaintext
  key_prefix text [not null]              -- Display only: "hsafx_live_a3f"
  name text [not null]                    -- User-defined label
  scopes text[]                           -- ['tools:execute', 'billing:read']
  rate_limit_per_hour int [not null, default: 100]  -- ✅ ADMIN-CONFIGURABLE
  last_used_at timestamp
  expires_at timestamp                    -- NULL = never expires
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    key_hash [unique]
    user_id
    (user_id, is_active)
  }
}
```

**Rate Limit Configuration (Managed via Admin Panel):**

| Tier | rate_limit_per_hour | Use Case |
|------|---------------------|----------|
| Free | 100 | Basic integration testing |
| Pro | 1000 | Production APIs |
| Enterprise | 10000+ | High-volume customers |
| Custom | Any value | Set by admin per key |

**Admin Panel Controls:**
- Create/revoke API keys
- Set custom rate_limit_per_hour per key
- Define scopes (tools:execute, billing:read, etc.)
- Set expiration date
- View usage statistics per key

### 12.4 API Request Logs

Sampled logs for forensics (not every request):

```sql
Table api_request_logs {
  id uuid [pk]
  user_id uuid [ref: > users.id]
  tool_id uuid [not null, ref: > tools.id]
  status_code int
  duration_ms int
  ip_address text
  user_agent text
  created_at timestamp [not null]
  
  indexes {
    tool_id
    user_id
    created_at
  }
}
```

> **⚠️ Retention Strategy**  
> This table grows rapidly. Implement:
> - **Retention window:** 30 days (configurable)
> - **Partitioning:** Consider partitioning by `created_at` (monthly)
> - **Cleanup job:** Inngest scheduled task to delete old rows
> - **Archive:** Export to cold storage before deletion if needed for compliance

---

## 13. Audit Logging

### 13.1 System Audit Log

> **⚠️ Invariant: Immutable Ledger**  
> `audit_logs` is INSERT-only. No UPDATE or DELETE allowed.  
> Enforce via:
> - DB trigger that raises exception on UPDATE/DELETE
> - Restricted DB role permissions
> - Application-level checks

```sql
Table audit_logs {
  id uuid [pk]
  user_id uuid [ref: > users.id]          -- Actor
  target_user_id uuid [ref: > users.id]   -- Affected user
  action audit_action [not null]
  action_detail text                      -- Free-text context
  resource text [not null]                -- 'user', 'subscription'
  resource_id uuid
  changes jsonb [default: '{}']           -- { old: {...}, new: {...} }
  ip_address text
  user_agent text
  metadata jsonb [default: '{}']
  created_at timestamp [not null]
}

Enum audit_action {
  create
  update
  delete
  grant
  revoke
  login
  logout
  payment
  refund
}
```

### 13.2 Permission Audit Log

```sql
Table permission_audit_logs {
  id uuid [pk]
  actor_id uuid [not null, ref: > users.id]
  action audit_action [not null]
  target_type permission_target [not null]
  target_id uuid
  permission_id uuid [not null, ref: > permissions_catalog.id]
  old_value text
  new_value text
  reason text
  ip_address text
  user_agent text
  created_at timestamp [not null]
}

Enum permission_target {
  role_permission
  user_override
  plan_feature
}
```

---

## 14. Email System

### 14.1 Email Provider Configuration

```sql
Table email_provider_config {
  id uuid [pk]
  provider email_provider [not null, unique]
  daily_limit int [not null, default: 100]
  monthly_limit int [not null, default: 3000]
  is_enabled boolean [not null, default: true]
  priority int [not null, default: 1]     -- 1 = primary
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Enum email_provider {
  resend
  smtp
}

Table email_usage_tracking {
  id uuid [pk]
  provider email_provider [not null]
  period_type reset_period [not null]
  period_start timestamp [not null]
  period_end timestamp [not null]
  emails_sent int [not null, default: 0]
  emails_failed int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
}
```

### 14.2 Admin Settings

```sql
Table admin_settings {
  id uuid [pk]
  setting_key text [not null, unique]     -- 'platform.app_name'
  setting_value text
  setting_group text [not null]           -- 'platform', 'email', 'security'
  description text
  is_encrypted boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
}
```

---

## 15. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                                │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │    users     │
                            └──────┬───────┘
                                   │
       ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
       │           │           │       │           │           │
       ▼           ▼           ▼       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ sessions │ │social_   │ │subscr- │ │payments│ │user_   │ │usage_  │
│          │ │auths     │ │iptions │ │        │ │coin_   │ │counters│
└──────────┘ └──────────┘ └───┬────┘ └───┬────┘ │wallets │ └────────┘
                              │          │      └───┬────┘
                              │          │          │
                              ▼          │          ▼
                    ┌──────────────┐     │   ┌──────────────┐
                    │subscription_ │     │   │coin_         │
                    │plans         │     │   │transactions  │
                    └──────┬───────┘     │   └──────────────┘
                           │             │
           ┌───────┬───────┼─────────────┤
           │       │       │             │
           ▼       ▼       ▼             ▼
     ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
     │plan_    │ │plan_    │ │plan_   │ │invoices│
     │features │ │limits   │ │coin_   │ │        │
     └─────────┘ └─────────┘ │rules   │ └───┬────┘
                             └────────┘     │
                                            ▼
                                    ┌──────────────┐
                                    │invoice_      │
                                    │payments      │
                                    └──────────────┘

                    ┌──────────────┐
                    │    roles     │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │role_         │ │user_roles    │ │permissions_  │
    │permissions   │ │              │ │catalog       │
    └──────┬───────┘ └──────────────┘ └──────┬───────┘
           │                                 │
           └─────────────┬───────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │permission_groups │
               └──────────────────┘

                    ┌──────────────┐
                    │    tools     │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │api_rate_     │ │anonymous_    │ │tool_coin_    │
    │limits        │ │usage         │ │costs         │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 16. Index Strategy

### 16.1 Index Categories

| Category | Purpose | Example |
|----------|---------|---------|
| **Primary Key** | Unique row identifier | `id` on all tables |
| **Foreign Key** | JOIN performance | `user_id`, `plan_id` |
| **Lookup** | Frequent WHERE clauses | `email`, `tool_key` |
| **Composite** | Multi-column queries | `(user_id, resource_key, period_start)` |
| **Partial** | Soft-delete awareness | `WHERE deleted_at IS NULL` |

### 16.2 Critical Indexes

```sql
-- User lookup (partial unique for soft-delete)
CREATE UNIQUE INDEX u_users_email_active 
  ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX u_users_username_active 
  ON users(username) WHERE deleted_at IS NULL AND username IS NOT NULL;

-- Subscription: one active per user
CREATE UNIQUE INDEX u_subscriptions_user_active
  ON subscriptions(user_id) WHERE deleted_at IS NULL;

-- Subscription queries
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Coin ledger queries
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created ON coin_transactions(created_at);

-- Usage tracking
CREATE UNIQUE INDEX u_usage_counters_user_resource_period 
  ON usage_counters(user_id, resource_key, period_start);

-- Audit log queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
```

### 16.3 Partial Unique Indexes

Required for soft-delete + unique constraint:

```sql
-- Roles: unique name among active
CREATE UNIQUE INDEX u_roles_name_active 
  ON roles(name) WHERE deleted_at IS NULL;

-- Permissions: unique (scope, key) among active
CREATE UNIQUE INDEX u_permissions_catalog_scope_key_active 
  ON permissions_catalog(scope, permission_key) WHERE deleted_at IS NULL;

-- Tools: unique key among active
CREATE UNIQUE INDEX u_tools_key_active 
  ON tools(tool_key) WHERE deleted_at IS NULL;

-- Coin transaction idempotency
CREATE UNIQUE INDEX u_coin_transactions_reference_txn
  ON coin_transactions(reference_type, reference_id, txn_type)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
```

---

## 17. Migration Strategy

### 17.1 Migration Tool

Use **Drizzle Kit** for migrations:

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Push schema directly (development only)
pnpm drizzle-kit push
```

### 17.2 Migration Rules

| Rule | Description |
|------|-------------|
| **Always additive** | Add columns, not remove (deprecate first) |
| **Default values** | New columns must have defaults or be nullable |
| **Backfill separately** | Data migrations in separate scripts |
| **Test rollback** | Every migration must be reversible |
| **Zero-downtime** | No locks that block reads |

### 17.3 Data Migration Patterns

```typescript
// Good: Additive change
await db.schema.alterTable('users', (t) => {
  t.text('phone_number'); // Nullable by default
});

// Bad: Breaking change (don't do this)
await db.schema.alterTable('users', (t) => {
  t.dropColumn('role'); // Breaks existing code
});

// Correct approach for breaking changes:
// 1. Add new column
// 2. Deploy code that writes to both
// 3. Backfill old data
// 4. Deploy code that reads from new
// 5. Remove old column (much later)
```

---

## 18. Drizzle ORM Considerations

### 18.1 Schema Definition

```typescript
// db/schema/users.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  phoneNumber: text('phone_number'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
```

### 18.2 Relation Definitions

```typescript
// db/schema/relations.ts
import { relations } from 'drizzle-orm';
import { users, sessions, subscriptions, userCoinWallets } from './';

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  subscription: one(subscriptions),
  wallet: one(userCoinWallets),
}));
```

### 18.3 Edge Compatibility

For Vercel Edge Runtime:

```typescript
// db/client.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## Appendix A: Complete Enum Reference

```sql
-- Subscription & Billing
-- NOTE: subscription_status is NOT a DB enum. Status is DERIVED at runtime.
-- See TypeScript type: type SubscriptionStatus = 'trial' | 'active' | 'paused' | 'canceled' | 'expired'
Enum payment_status { pending, paid, failed, refunded }
Enum invoice_status { draft, open, partially_paid, paid, void, uncollectible }
Enum billing_interval { monthly, yearly }

-- Coins
Enum coin_txn_type { purchase, bonus, spend, refund, admin_adjust, expiration }

-- Audit
Enum audit_action { create, update, delete, grant, revoke, login, logout, payment, refund }
Enum permission_target { role_permission, user_override, plan_feature }

-- RBAC
Enum admin_role_type { system, custom }

-- Plans
Enum plan_change_type { feature_toggle, limit_update, metadata_add, metadata_remove }
Enum plan_limit_type { integer, size, duration, boolean, complex }
Enum reset_period { hourly, daily, monthly, yearly, never }

-- Tools & Usage
Enum identifier_type { ip_hash, fingerprint }

-- Email
Enum email_provider { resend, smtp }
```

---

## Appendix B: PostgreSQL DDL (Deploy-Time)

```sql
-- Wallet balance trigger (Option A)
CREATE OR REPLACE FUNCTION fn_coin_transactions_wallet_update()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_coin_wallets (user_id, balance, lifetime_earned, lifetime_spent, created_at, updated_at)
    VALUES (
      NEW.user_id,
      NEW.amount,
      GREATEST(NEW.amount, 0),
      GREATEST(-NEW.amount, 0),
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      balance = user_coin_wallets.balance + NEW.amount,
      lifetime_earned = user_coin_wallets.lifetime_earned + GREATEST(NEW.amount, 0),
      lifetime_spent = user_coin_wallets.lifetime_spent + GREATEST(-NEW.amount, 0),
      updated_at = now();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coin_txn_wallet_update
  AFTER INSERT ON coin_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_coin_transactions_wallet_update();

-- Prevent direct wallet balance updates
CREATE OR REPLACE FUNCTION fn_prevent_direct_wallet_update()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    -- Only allow if called from the coin transaction trigger
    IF current_setting('hsafx.allow_wallet_update', true) != 'true' THEN
      RAISE EXCEPTION 'Direct wallet balance updates are not allowed. Use coin_transactions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Audit log immutability (prevent UPDATE/DELETE)
CREATE OR REPLACE FUNCTION fn_prevent_audit_log_modification()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs table is immutable. UPDATE and DELETE operations are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_modification();

-- Same for coin_transactions (ledger immutability)
CREATE TRIGGER trg_coin_transactions_immutable
  BEFORE UPDATE OR DELETE ON coin_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_modification();
```

---

## Document Cross-References

| Document                                                     | Relevant Sections                            |
|----------                                                    |-------------------                           |
| [01_PRODUCT_REQUIREMENTS.md](01_PRODUCT_REQUIREMENTS.md)     | Architectural invariants, monetization model |
| [02_USER_ROLES_PERMISSIONS.md](02_USER_ROLES_PERMISSIONS.md) | RBAC design, permission catalog              |
| [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md)       | Redis schemas, data flows                    |
| 21_BILLING_LOGIC.md                                          | Payment processing, subscription lifecycle   |
| 15_SECURITY_MODEL.md                                         | Data encryption, access control              |

---

*This document defines the PostgreSQL schema for HSAFX WORLD. For runtime caching (Redis) and file storage (R2), see [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md).*