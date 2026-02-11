# 01 — User Roles & Permissions

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 3, 2026  
**Status:** ✅ APPROVED — Decisions Frozen

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `00_PRODUCT_REQUIREMENTS`, `13_DATABASE_SCHEMA`, and `15_SECURITY_MODEL`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Two Permission Systems](#2-two-permission-systems)
3. [Plan-Based Access Control](#3-plan-based-access-control)
4. [Admin RBAC System](#4-admin-rbac-system)
5. [Permission Catalog](#5-permission-catalog)
6. [Enforcement Architecture](#6-enforcement-architecture)
7. [Role Assignment Rules](#7-role-assignment-rules)
8. [Audit Logging](#8-audit-logging)
9. [Edge Cases & Conflict Resolution](#9-edge-cases--conflict-resolution)
10. [CASL Frontend Integration](#10-casl-frontend-integration)

---

## 1. Overview

### 1.1 Core Principle

> **Plans control what users CAN DO (features/limits).**  
> **Roles control what admins CAN MANAGE (operations).**

These are **two separate systems** that never overlap:

| System | Applies To | Controls | Stored In |
|--------|-----------|----------|-----------|
| **Plan-Based Access** | All users (Guest, Free, Pro, Advance) | Feature access, usage limits, coin costs | `plan_features`, `plan_limits` |
| **Admin RBAC** | Internal staff only | Administrative operations | `roles`, `permissions_catalog`, `role_permissions` |

### 1.2 Why Two Systems?

| Concern | Plan-Based | RBAC |
|---------|-----------|------|
| Who can use the PDF merger? | ✅ | ❌ |
| Who can ban a user? | ❌ | ✅ |
| Who can access advanced tools? | ✅ | ❌ |
| Who can refund a payment? | ❌ | ✅ |
| Who can use API endpoints? | ✅ | ❌ |
| Who can view audit logs? | ❌ | ✅ |

### 1.3 Invariant (from PRD)

> **Plans control features; permissions never bypass plans.**

An admin with `super_admin` role still respects their personal plan limits when using tools as a user.

---

## 2. Two Permission Systems

### 2.1 System A: Plan-Based Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN-BASED ACCESS                        │
├─────────────────────────────────────────────────────────────┤
│  User → has Plan → Plan has Features + Limits               │
│                                                             │
│  Enforcement:                                               │
│  • Feature flags (boolean): Can user access this tool?      │
│  • Resource limits (numeric): How much can user consume?    │
│  • Coin costs (numeric): How many coins per action?         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 System B: Admin RBAC

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN RBAC                             │
├─────────────────────────────────────────────────────────────┤
│  Admin User → has Role(s) → Role has Permission(s)          │
│                                                             │
│  Enforcement:                                               │
│  • Permission checks: Can admin perform this operation?     │
│  • Resource scoping: Which entities can admin access?       │
│  • Action logging: All admin actions are audited            │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Visual Separation

```
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │  User App   │                 │ Admin Panel │
    │  (Public)   │                 │ (Internal)  │
    └──────┬──────┘                 └──────┬──────┘
           │                               │
           ▼                               ▼
    ┌─────────────┐                 ┌─────────────┐
    │ Plan-Based  │                 │    RBAC     │
    │   Access    │                 │   System    │
    └─────────────┘                 └─────────────┘
           │                               │
           │      ┌─────────────┐          │
           └─────►│   Backend   │◄─────────┘
                  │   (Shared)  │
                  └─────────────┘
```

---

## 3. Plan-Based Access Control

### 3.1 User Plans

| Plan | ID | Description | Price |
|------|-----|-------------|-------|
| Guest | `guest` | Unauthenticated visitor | $0 |
| Free | `free` | Authenticated, no payment | $0 |
| Pro | `pro` | Paid subscriber | $X/mo |
| Advance | `advance` | Premium subscriber | $Y/mo |

### 3.2 Plan Hierarchy

```
Guest < Free < Pro < Advance
```

Higher plans **inherit** all features from lower plans (unless explicitly restricted).

> **Override Rule:** Feature inheritance can be overridden by explicitly setting `enabled: false` for a feature at a higher tier. This is rare but allows for tier-specific restrictions.

### 3.3 Feature Flags (Boolean Access)

| Feature Key | Guest | Free | Pro | Advance | Description |
|-------------|-------|------|-----|---------|-------------|
| `tools.text.basic` | ✅ | ✅ | ✅ | ✅ | Basic text manipulation |
| `tools.text.advanced` | ❌ | ❌ | ✅ | ✅ | Advanced text tools |
| `tools.data.converters` | Limited | ✅ | ✅ | ✅ | Data format converters |
| `tools.media.image` | Limited | ✅ | ✅ | ✅ | Image processing |
| `tools.media.video` | Limited | ✅ | ✅ | ✅ | Video processing |
| `tools.media.audio` | Limited | ✅ | ✅ | ✅ | Audio processing |
| `tools.pdf.editor` | ❌ | ✅ | ✅ | ✅ | PDF editing suite |
| `tools.generators` | Limited | ✅ | ✅ | ✅ | ID/code generators |
| `tools.calculators` | ✅ | ✅ | ✅ | ✅ | Calculators (all free) |
| `tools.logistics` | ❌ | ❌ | ✅ | ✅ | Terminal scraper |
| `tools.bulk` | ❌ | ❌ | ✅ | ✅ | Bulk operations |
| `api.access` | ❌ | ❌ | ✅ | ✅ | API endpoint access |
| `coins.purchase` | ❌ | ✅ | ✅ | ✅ | Buy coin packs |
| `coins.earn_ads` | ❌ | ✅ | ✅ | ✅ | Earn coins from ads |
| `experience.ad_free` | ❌ | ❌ | ✅ | ✅ | No advertisements |
| `support.priority` | ❌ | ❌ | ❌ | ✅ | Priority support queue |

### 3.4 Resource Limits

Defined in `01_PRODUCT_REQUIREMENTS.md` Section 6.1. Key points:

- **Reset periods:** `daily`, `monthly`, `plan_lifetime`
- **Enforcement:** Server-side, deterministic, verifiable
- **Bypass:** Coins can extend limits (configured per tool)

### 3.5 Plan State Derivation

Plan status is **always computed**, never stored directly:

```typescript
function deriveSubscriptionStatus(subscription: Subscription): PlanStatus {
  const now = new Date();
  
  // Trial period
  if (subscription.trial_ends_at && now < subscription.trial_ends_at) {
    return 'trialing';
  }
  
  // Canceled but not yet expired
  if (subscription.canceled_at && now < subscription.current_period_end) {
    return 'active_canceling';
  }
  
  // Past due (grace period)
  if (subscription.current_period_end < now && 
      now < addDays(subscription.current_period_end, GRACE_PERIOD_DAYS)) {
    return 'past_due';
  }
  
  // Expired
  if (subscription.current_period_end < now) {
    return 'expired';
  }
  
  // Active
  return 'active';
}
```

### 3.6 Plan Downgrade Behavior

When a user downgrades (e.g., Pro → Free):

| Resource Type | Behavior |
|---------------|----------|
| Feature access | Immediately restricted |
| Usage counters | Reset to new plan limits |
| Existing files | N/A (no persistent storage) |
| Coins | Retained (coins never expire) |
| API keys | Deactivated |

---

## 4. Admin RBAC System

### 4.1 Admin Roles

| Role | Level | Description | Typical Assignment |
|------|-------|-------------|-------------------|
| `super_admin` | 100 | Full system access | Owner only |
| `admin` | 80 | Most operations, no system config | Senior staff |
| `support_manager` | 60 | User management, billing ops | Support lead |
| `support_agent` | 40 | Read + limited write | Support staff |
| `content_manager` | 40 | Tool/content management | Content team |
| `analyst` | 20 | Read-only analytics | Data team |
| `auditor` | 20 | Read-only audit logs | Compliance |

### 4.2 Role Hierarchy

```
super_admin (100)
     │
     ▼
  admin (80)
     │
     ├──────────────┬──────────────┐
     ▼              ▼              ▼
support_manager  content_manager  analyst
    (60)            (40)          (20)
     │
     ▼
support_agent
    (40)
```

**Hierarchy Rules:**
- Higher level roles can assign lower level roles
- No role can assign roles at or above their level
- `super_admin` is the only role that can modify role definitions

### 4.3 Role Permissions Matrix

| Permission | super_admin | admin | support_manager | support_agent | content_manager | analyst | auditor |
|------------|-------------|-------|-----------------|---------------|-----------------|---------|---------|
| **User Management** |
| `users.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `users.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.update` | ✅ | ✅ | ✅ | Limited | ❌ | ❌ | ❌ |
| `users.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.ban` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.impersonate` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Subscription Management** |
| `subscriptions.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `subscriptions.modify` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `subscriptions.cancel` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `subscriptions.refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Coin Management** |
| `coins.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `coins.grant` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `coins.revoke` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tool Management** |
| `tools.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tools.create` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `tools.update` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `tools.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `tools.toggle` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Plan Configuration** |
| `plans.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `plans.modify` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `plan_limits.modify` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **System Configuration** |
| `system.config.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `system.config.modify` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `system.feature_flags` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Role Management** |
| `roles.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `roles.assign` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `roles.modify` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit & Analytics** |
| `audit.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `audit.export` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `analytics.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `analytics.export` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **API Management** |
| `api.keys.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `api.keys.revoke` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `api.rate_limits` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4.4 Permission Scoping

Some permissions support **resource scoping**:

| Permission | Scope Options |
|------------|---------------|
| `users.update` | `own`, `team`, `all` |
| `subscriptions.view` | `own`, `all` |
| `audit.view` | `own_actions`, `team`, `all` |

Example: `support_agent` has `users.update:limited` which means:
- Can update: email, name, profile
- Cannot update: plan, roles, ban status

---

## 5. Permission Catalog

### 5.1 Permission Naming Convention

```
{resource}.{action}
```

**Canonical format:** Two-part keys for simple resources, three-part for nested resources.

Examples:
- `users.view` — View user details
- `users.ban` — Ban/unban users
- `billing.subscriptions.cancel` — Cancel subscriptions
- `billing.payments.refund` — Issue refunds

> **⚠️ Invariant: Permission keys are immutable once published.**  
> Never rename or restructure permission keys after they exist in production.
> Add new permissions instead, then deprecate old ones.

### 5.1.1 Permission Scoping (Metadata, Not Key)

Scopes are stored as **permission metadata**, not embedded into permission keys.

```typescript
// ✅ Correct: scope is metadata
{ permission: 'users.update', scope: 'own' }
{ permission: 'users.update', scope: 'team' }
{ permission: 'users.update', scope: 'all' }

// ❌ Wrong: scope embedded in key
'users.update.own'
'users.update.team'
```

This prevents permission key explosion and simplifies queries.

### 5.2 Permission Categories

| Category | Prefix | Description |
|----------|--------|-------------|
| User Management | `users.*` | CRUD on user accounts |
| Billing | `billing.*` | Subscriptions, payments, refunds |
| Coins | `coins.*` | Coin grants, revokes, ledger |
| Tools | `tools.*` | Tool configuration |
| Plans | `plans.*` | Plan definitions, limits |
| System | `system.*` | Global configuration |
| Roles | `roles.*` | RBAC management |
| Audit | `audit.*` | Audit log access |
| Analytics | `analytics.*` | Usage analytics |
| API | `api.*` | API key management |

### 5.3 Full Permission List

```typescript
const PERMISSIONS = {
  // User Management
  'users.list': 'View user list',
  'users.view': 'View user details',
  'users.create': 'Create new users',
  'users.update': 'Update user info',
  'users.delete': 'Soft delete users',
  'users.ban': 'Ban/unban users',
  'users.impersonate': 'Login as user (audit logged)',
  
  // Billing - Subscriptions
  'subscriptions.view': 'View subscriptions',
  'subscriptions.modify': 'Modify subscriptions',
  'subscriptions.cancel': 'Cancel subscriptions',
  
  // Billing - Payments
  'payments.view': 'View payment history',
  'payments.refund': 'Issue refunds',
  
  // Billing - Invoices
  'invoices.view': 'View invoices',
  'invoices.generate': 'Generate invoices',
  
  // Coins
  'coins.view': 'View coin transactions',
  'coins.grant': 'Grant coins to users',
  'coins.revoke': 'Revoke coins (compensating transaction)',
  'coins.packs.manage': 'Manage coin pack offerings',
  
  // Tools
  'tools.list': 'View tool list',
  'tools.view': 'View tool details',
  'tools.create': 'Create new tools',
  'tools.update': 'Update tool config',
  'tools.delete': 'Delete tools',
  'tools.toggle': 'Enable/disable tools',
  'tools.costs.manage': 'Set coin costs per tool',
  
  // Plans
  'plans.view': 'View plan definitions',
  'plans.modify': 'Modify plan details',
  'plans.features.manage': 'Manage plan features',
  'plans.limits.manage': 'Manage plan limits',
  
  // System
  'system.config.view': 'View system configuration',
  'system.config.modify': 'Modify system configuration',
  'system.feature_flags.manage': 'Toggle feature flags',
  'system.maintenance': 'Enable maintenance mode',
  
  // Roles
  'roles.view': 'View role definitions',
  'roles.assign': 'Assign roles to users',
  'roles.modify': 'Create/modify role definitions',
  'roles.permissions.manage': 'Assign permissions to roles',
  
  // Audit
  'audit.view': 'View audit logs',
  'audit.export': 'Export audit logs',
  'audit.retention.manage': 'Manage retention policies',
  
  // Analytics
  'analytics.dashboard': 'View analytics dashboard',
  'analytics.reports': 'Generate reports',
  'analytics.export': 'Export analytics data',
  
  // API
  'api.keys.view': 'View API keys',
  'api.keys.create': 'Create API keys',
  'api.keys.revoke': 'Revoke API keys',
  'api.rate_limits.manage': 'Manage rate limits',
} as const;
```

---

## 6. Enforcement Architecture

### 6.1 Enforcement Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      REQUEST FLOW                           │
└─────────────────────────────────────────────────────────────┘

  Client Request
       │
       ▼
┌─────────────────┐
│  1. Gateway     │ ← Rate limiting (IP-based)
│     (Edge)      │ ← Abuse prevention
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Auth        │ ← Session validation
│     Middleware  │ ← User identification
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Permission  │ ← Plan-based access (tools)
│     Middleware  │ ← RBAC checks (admin)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Limit       │ ← Usage counter checks
│     Middleware  │ ← Coin balance checks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Handler     │ ← Business logic
│     (Endpoint)  │ ← Tool execution
└─────────────────┘
```

### 6.2 Plan-Based Enforcement (User App)

```typescript
// Middleware: checkPlanAccess
async function checkPlanAccess(ctx: Context, featureKey: string) {
  const user = ctx.user;
  const plan = user ? user.subscription.plan : 'guest';
  
  // Get feature flag for plan
  const hasAccess = await db.query.planFeatures.findFirst({
    where: and(
      eq(planFeatures.plan_id, plan),
      eq(planFeatures.feature_key, featureKey),
      eq(planFeatures.enabled, true)
    )
  });
  
  if (!hasAccess) {
    throw new ForbiddenError(`Feature '${featureKey}' not available on ${plan} plan`);
  }
}

// Middleware: checkUsageLimit
async function checkUsageLimit(ctx: Context, resourceKey: string) {
  const user = ctx.user;
  if (!user) return; // Guest limits handled separately
  
  const limit = await getPlanLimit(user.subscription.plan_id, resourceKey);
  const usage = await getCurrentUsage(user.id, resourceKey);
  
  if (usage >= limit.max_value) {
    // Check if coin bypass is allowed
    const tool = ctx.tool;
    if (tool.coin_cost > 0 && user.coin_balance >= tool.coin_cost) {
      ctx.requiresCoinPayment = true;
      return;
    }
    throw new LimitExceededError(resourceKey, usage, limit.max_value);
  }
}
```

### 6.3 RBAC Enforcement (Admin Panel)

```typescript
// Middleware: requirePermission
function requirePermission(permission: string) {
  return async (ctx: Context) => {
    const admin = ctx.admin;
    
    if (!admin) {
      throw new UnauthorizedError('Admin authentication required');
    }
    
    const hasPermission = await checkAdminPermission(admin.id, permission);
    
    if (!hasPermission) {
      // Log failed access attempt
      await auditLog({
        actor_id: admin.id,
        action: 'permission_denied',
        resource: permission,
        details: { attempted_action: ctx.path }
      });
      
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }
  };
}

// Helper: checkAdminPermission
async function checkAdminPermission(adminId: string, permission: string): Promise<boolean> {
  const result = await db.query.sql`
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions_catalog pc ON rp.permission_id = pc.id
    WHERE ur.user_id = ${adminId}
      AND pc.permission_key = ${permission}
      AND ur.is_active = true
    LIMIT 1
  `;
  
  return result.length > 0;
}
```

### 6.4 Enforcement Decision Matrix

| Request Type | Auth Required | Plan Check | RBAC Check | Limit Check |
|--------------|---------------|------------|------------|-------------|
| Guest tool use | ❌ | ✅ (guest plan) | ❌ | ✅ |
| Free user tool | ✅ | ✅ | ❌ | ✅ |
| Pro user tool | ✅ | ✅ | ❌ | ✅ |
| Admin user management | ✅ | ❌ | ✅ | ❌ |
| Admin tool config | ✅ | ❌ | ✅ | ❌ |
| Public API request | ✅ (API key) | ✅ | ❌ | ✅ |

### 6.5 API Surface Separation

There are **two distinct API surfaces** that must never be confused:

| API Type | Auth Method | Plan Check | RBAC Check | Exposure |
|----------|-------------|------------|------------|----------|
| **Public API** | API Key (user-issued) | ✅ | ❌ | External (B2B customers) |
| **Admin API** | Admin Session (cookie) | ❌ | ✅ | Internal (Admin Panel only) |

> **⚠️ Invariant: Admin API endpoints are NEVER exposed via API keys.**  
> Admin operations require session-based authentication from the Admin Panel.  
> This prevents Stripe-like API key privilege escalation attacks.

---

## 7. Role Assignment Rules

### 7.1 Who Can Assign Roles

| Assigner Role | Can Assign |
|---------------|------------|
| `super_admin` | Any role |
| `admin` | All except `super_admin`, `admin` |
| `support_manager` | `support_agent` only |
| Others | Cannot assign roles |

### 7.2 Assignment Constraints

```typescript
const ROLE_ASSIGNMENT_RULES = {
  // Only super_admin can be assigned by owner
  'super_admin': {
    assignableBy: ['super_admin'],
    maxPerOrg: 2,
    requiresMFA: true,
  },
  
  'admin': {
    assignableBy: ['super_admin'],
    maxPerOrg: 5,
    requiresMFA: true,
  },
  
  'support_manager': {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 10,
    requiresMFA: false,
  },
  
  'support_agent': {
    assignableBy: ['super_admin', 'admin', 'support_manager'],
    maxPerOrg: 50,
    requiresMFA: false,
  },
  
  'content_manager': {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 10,
    requiresMFA: false,
  },
  
  'analyst': {
    assignableBy: ['super_admin', 'admin'],
    maxPerOrg: 20,
    requiresMFA: false,
  },
  
  'auditor': {
    assignableBy: ['super_admin'],
    maxPerOrg: 5,
    requiresMFA: true,
  },
};
```

### 7.3 Multiple Roles

- Users **can** have multiple roles
- Permissions are **unioned** (additive)
- No permission is ever "negative" (deny)
- Highest role level determines assignment capability

> **⚠️ Invariant: Role Assignment Authority**  
> Role *assignment authority* is determined by the **highest role level** held by the user, not by permission union.  
> Example: A user with `support_agent` (40) + `content_manager` (40) cannot assign roles, because neither role has `roles.assign` permission — even though permissions are unioned.  
> Only `super_admin` (100) and `admin` (80) can assign roles.

### 7.4 Role Revocation

| Scenario | Behavior |
|----------|----------|
| Admin removes own role | Blocked (cannot de-escalate self) |
| Admin removes higher role | Blocked |
| Admin removes equal role | Blocked |
| Admin removes lower role | Allowed |
| `super_admin` removes any | Allowed |

---

## 8. Audit Logging

### 8.1 What Gets Logged

| Category | Events |
|----------|--------|
| **Auth** | Login, logout, password change, MFA events |
| **Role Changes** | Assign, revoke, modify |
| **Permission Changes** | Grant, revoke |
| **User Management** | Create, update, delete, ban |
| **Billing** | Subscription changes, refunds, coin grants |
| **System Config** | Any modification |
| **Data Access** | Sensitive data views (PII, payments) |

### 8.2 Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  
  // Who
  actor_id: string;
  actor_type: 'user' | 'admin' | 'system' | 'webhook' | 'support_impersonation';
  actor_ip: string;
  actor_user_agent: string;
  
  // For impersonation: who is the real admin?
  impersonator_id?: string; // Only set when actor_type = 'support_impersonation'
  
  // What
  action: string;
  resource_type: string;
  resource_id: string;
  
  // Details
  old_value: JsonObject | null;
  new_value: JsonObject | null;
  metadata: JsonObject;
  
  // Context
  request_id: string;
  session_id: string;
}
```

**Actor Types Explained:**

| Actor Type | Description |
|------------|-------------|
| `user` | Regular user action |
| `admin` | Admin action via Admin Panel |
| `system` | Automated system action (cron, background job) |
| `webhook` | External webhook trigger (Polar, Stripe) |
| `support_impersonation` | Admin acting AS a user (legally distinct) |

### 8.3 Retention Policy

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Auth events | 90 days | Hot storage |
| Admin actions | 2 years | Hot → Cold |
| Billing events | 7 years | Hot → Cold → Archive |
| System changes | 2 years | Hot → Cold |
| Permission changes | 7 years | Hot → Cold → Archive |

### 8.4 Audit Log Access

| Role | View Own | View Team | View All | Export |
|------|----------|-----------|----------|--------|
| `super_admin` | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `support_manager` | ✅ | ✅ | ❌ | ❌ |
| `auditor` | ✅ | ✅ | ✅ | ✅ |
| Others | ❌ | ❌ | ❌ | ❌ |

---

## 9. Edge Cases & Conflict Resolution

### 9.1 Plan vs RBAC Conflict

**Scenario:** Admin user tries to use a tool beyond their personal plan limit.

**Resolution:** Plan limits apply. Admin role does not grant tool usage bypass.

```typescript
// Even admins pay for tool usage
if (user.isAdmin && !checkPlanLimit(user, toolResource)) {
  throw new LimitExceededError('Admin role does not bypass plan limits');
}
```

### 9.2 Multiple Roles with Different Permissions

**Scenario:** User has both `support_agent` (limited user update) and `content_manager` (no user access).

**Resolution:** Permissions are unioned. User gets `support_agent` user permissions.

### 9.3 Role During Subscription Downgrade

**Scenario:** Admin's personal subscription expires.

**Resolution:**
- Admin role: **Retained** (RBAC is separate)
- Personal tool access: **Downgraded** to new plan

### 9.4 Guest Accessing Admin Routes

**Resolution:** Rejected at auth middleware, before RBAC check.

### 9.5 Deleted User with Active Sessions

**Resolution:**
- Sessions invalidated immediately on soft delete
- All active tokens revoked
- Audit log entry created

### 9.6 Permission Not in Catalog

**Resolution:** Fail closed. Unknown permissions are denied.

```typescript
if (!permissionExists(permission)) {
  logger.warn(`Unknown permission requested: ${permission}`);
  return false; // Deny by default
}
```

---

## 10. CASL Frontend Integration

### 10.1 Purpose

CASL provides **UI-level enforcement** to:
- Hide unauthorized buttons/actions
- Disable inaccessible features
- Show appropriate upgrade prompts

> **CASL is NOT a security boundary.** Backend always re-validates.

### 10.2 Ability Definition (User App)

```typescript
import { defineAbility } from '@casl/ability';

export function defineUserAbility(user: User | null) {
  return defineAbility((can, cannot) => {
    const plan = user?.subscription?.plan ?? 'guest';
    
    // Guest abilities
    can('use', 'Tool', { category: 'text.basic' });
    can('use', 'Tool', { category: 'calculators' });
    
    if (plan === 'guest') {
      cannot('purchase', 'Coins');
      cannot('earn', 'Coins');
      return;
    }
    
    // Free+ abilities
    can('purchase', 'Coins');
    can('earn', 'Coins');
    can('use', 'Tool', { category: 'data.converters' });
    can('use', 'Tool', { category: 'media' });
    can('use', 'Tool', { category: 'pdf' });
    can('use', 'Tool', { category: 'generators' });
    
    // ✅ ADMIN-CONFIGURABLE: Query plan_permissions table
    // Permissions are stored in database and managed via admin panel
    const permissions = await db.query.plan_permissions.findMany({
      where: eq(plan_permissions.plan_id, user.subscription.plan_id)
    });
    
    // Apply database-driven permissions
    for (const perm of permissions) {
      if (perm.permission_type === 'tool_category') {
        if (perm.is_allowed) {
          can('use', 'Tool', { category: perm.resource_key });
        } else {
          cannot('use', 'Tool', { category: perm.resource_key });
        }
      } else if (perm.permission_type === 'feature') {
        if (perm.is_allowed) {
          can('access', perm.resource_key);
        } else {
          cannot('access', perm.resource_key);
        }
      }
    }
    
    // Example permissions in database (managed via admin panel):
    // Free plan: logistics=false, bulk=false, API=false, PrioritySupport=false
    // Pro plan:  logistics=true,  bulk=true,  API=true,  PrioritySupport=false
    // Advance:   logistics=true,  bulk=true,  API=true,  PrioritySupport=true
  });
}
```

> **⚠️ Invariant: CASL abilities must NEVER exceed backend plan enforcement.**  
> Never use `can('manage', 'all')` — it bypasses plan context.  
> Always scope abilities to specific resources and conditions.
```

### 10.3 Ability Definition (Admin Panel)

```typescript
export function defineAdminAbility(admin: Admin) {
  return defineAbility((can) => {
    // Load permissions from backend
    const permissions = admin.permissions; // Pre-fetched
    
    permissions.forEach((permission) => {
      const [domain, resource, action] = permission.split('.');
      can(action, resource);
    });
  });
}
```

### 10.4 Component Usage

```tsx
import { Can } from '@casl/react';

// User App: Show upgrade prompt if can't use tool
function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Can I="use" a="Tool" this={{ category: tool.category }}>
      {(allowed) => (
        allowed 
          ? <ToolExecutor tool={tool} />
          : <UpgradePrompt feature={tool.category} />
      )}
    </Can>
  );
}

// Admin Panel: Conditionally show action buttons
function UserActions({ user }: { user: User }) {
  const ability = useAbility();
  
  return (
    <div>
      <Can I="view" a="users">
        <Button>View Details</Button>
      </Can>
      
      <Can I="ban" a="users">
        <Button variant="destructive">Ban User</Button>
      </Can>
      
      {/* Never show impersonate to non-super_admins */}
      <Can I="impersonate" a="users">
        <Button variant="warning">Login as User</Button>
      </Can>
    </div>
  );
}
```

### 10.5 Ability Refresh

Abilities must be refreshed when:
- User logs in/out
- Subscription changes
- Plan upgrade/downgrade completes
- Admin role changes

```typescript
// React context for ability refresh
function useAbilityRefresh() {
  const { user } = useAuth();
  const [ability, setAbility] = useState(() => defineUserAbility(user));
  
  useEffect(() => {
    setAbility(defineUserAbility(user));
  }, [user, user?.subscription?.plan]);
  
  // Also refresh on subscription webhook
  useSubscriptionWebhook(() => {
    refetchUser().then((user) => setAbility(defineUserAbility(user)));
  });
  
  return ability;
}
```

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                00_PRODUCT_REQUIREMENTS.md                   │
│                   (Defines Plans)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                01_USER_ROLES_PERMISSIONS.md                 │
│                    (This Document)                          │
│              Plan Access + Admin RBAC Rules                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                     ┌───────────────────┐
│ 13_DATABASE_SCHEMA│                     │ 15_SECURITY_MODEL │
│  (Tables: roles,  │                     │  (Enforcement     │
│   permissions,    │                     │   patterns)       │
│   user_roles)     │                     │                   │
└───────────────────┘                     └───────────────────┘
```

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | HSAFX | 2026-01-03 | ✅ Approved |
| Architecture | — | — | ✅ Approved |

---

**Next Document:** [10_SYSTEM_ARCHITECTURE.md](./10_SYSTEM_ARCHITECTURE.md)