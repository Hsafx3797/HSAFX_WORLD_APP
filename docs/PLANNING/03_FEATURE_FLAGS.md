# 03 — Feature Flags

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — Feature Flags v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `01_USER_ROLES_PERMISSIONS`, `21_BILLING_LOGIC`, and `15_SECURITY_MODEL`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Flag Architecture](#2-flag-architecture)
3. [Plan-Based Feature Gates](#3-plan-based-feature-gates)
4. [Tool-Level Flags](#4-tool-level-flags)
5. [Operational Kill Switches](#5-operational-kill-switches)
6. [Rollout & Experimentation](#6-rollout--experimentation)
7. [Abuse Response Flags](#7-abuse-response-flags)
8. [Flag Lifecycle Management](#8-flag-lifecycle-management)
9. [Implementation Patterns](#9-implementation-patterns)

---

## 1. Overview

### 1.1 Purpose

Feature flags provide **runtime control** over application behavior without code deployment. This document defines:

- What can be toggled
- Who can toggle it
- How toggles propagate
- When flags should expire

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Fail-safe defaults** | All flags default to most restrictive behavior |
| **Audit everything** | Every flag change is logged with actor + reason |
| **No flag debt** | Flags have mandatory expiry or review dates |
| **Plan authority** | Plan-based gates derive from subscription, not flags |
| **Separation of concerns** | Operational flags ≠ product flags ≠ experiment flags |

### 1.3 Flag Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE FLAG TAXONOMY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  PLAN GATES     │  │  TOOL FLAGS     │  │  KILL SWITCHES  │              │
│  │  (Derived)      │  │  (Configurable) │  │  (Emergency)    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ • API access    │  │ • Tool enabled  │  │ • Service halt  │              │
│  │ • Usage limits  │  │ • Beta access   │  │ • Feature freeze│              │
│  │ • File sizes    │  │ • Deprecation   │  │ • Payment pause │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  EXPERIMENTS    │  │  ABUSE FLAGS    │  │  MAINTENANCE    │              │
│  │  (A/B Tests)    │  │  (Per-User)     │  │  (Scheduled)    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ • UI variants   │  │ • Rate limits   │  │ • Read-only mode│              │
│  │ • Pricing tests │  │ • Feature bans  │  │ • Degraded mode │              │
│  │ • Flow changes  │  │ • Account freeze│  │ • Migration lock│              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flag Architecture

### 2.1 Storage & Propagation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLAG STORAGE HIERARCHY                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   PostgreSQL    │  Source of Truth
│   (Neon)        │  • flag_definitions
│                 │  • flag_overrides
│                 │  • flag_audit_log
└────────┬────────┘
         │
         │  Sync on change (pub/sub)
         ▼
┌─────────────────┐
│   Redis         │  Hot Cache (Upstash)
│   (Upstash)     │  • flags:{scope}:{key}
│                 │  • TTL: 60s default
└────────┬────────┘
         │
         │  SDK fetch (with fallback)
         ▼
┌─────────────────┐
│   Application   │  In-Memory Cache
│   (Next.js)     │  • Per-request context
│                 │  • Fallback to defaults
└─────────────────┘
```

### 2.2 Flag Definition Schema

```typescript
// Database: flag_definitions table
interface FlagDefinition {
  id: string;                    // UUID
  key: string;                   // unique, e.g., "tools.pdf_merge.enabled"
  name: string;                  // Human-readable name
  description: string;           // What this flag controls
  
  // Type & Default
  value_type: 'boolean' | 'string' | 'number' | 'json';
  default_value: string;         // JSON-encoded
  
  // Targeting
  scope: 'global' | 'plan' | 'user' | 'percentage';
  
  // Lifecycle
  category: 'plan_gate' | 'tool' | 'kill_switch' | 'experiment' | 'abuse' | 'maintenance';
  expires_at: Date | null;       // null = permanent
  review_at: Date;               // mandatory review date
  
  // Metadata
  owner: string;                 // team/person responsible
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
}

// Database: flag_overrides table
interface FlagOverride {
  id: string;
  flag_id: string;               // FK to flag_definitions
  
  // Target
  target_type: 'global' | 'plan' | 'user';
  target_value: string | null;   // null for global, plan_code or user_id
  
  // Override
  override_value: string;        // JSON-encoded
  
  // Audit
  reason: string;                // mandatory
  created_by: string;            // admin user_id
  created_at: Date;
  expires_at: Date | null;
}
```

### 2.3 Flag Resolution Order

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLAG RESOLUTION PRECEDENCE                             │
│                        (Highest to Lowest)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  1. User-specific override     →  flag_overrides WHERE target_type = 'user'
                                   AND target_value = {user_id}
                                   
  2. Plan-specific override     →  flag_overrides WHERE target_type = 'plan'
                                   AND target_value = {user_plan}
                                   
  3. Global override            →  flag_overrides WHERE target_type = 'global'
  
  4. Percentage rollout         →  hash(user_id + flag_key) % 100 < percentage
  
  5. Default value              →  flag_definitions.default_value

⚠️ INVARIANT: Kill switches ALWAYS win, regardless of other overrides.
   Kill switches bypass the normal resolution chain.

⚠️ INVARIANT: Percentage rollouts and experiments are only evaluated
   IF no user or plan override exists. Explicit overrides always take
   precedence over experiments.
```

### 2.4 Flag Naming Convention

```
{category}.{domain}.{feature}[.{variant}]

Examples:
├── plan.api.access                    # Plan gate: API access
├── plan.limits.daily_uses             # Plan gate: usage limit
├── tool.pdf_merge.enabled             # Tool availability
├── tool.ai_summarizer.beta            # Tool beta access
├── kill.payments.stripe               # Kill switch: Stripe payments
├── kill.auth.oauth_google             # Kill switch: Google OAuth
├── exp.pricing.annual_discount        # Experiment: pricing test
├── exp.ui.new_dashboard               # Experiment: UI variant
├── abuse.user.rate_limited            # Abuse: per-user rate limit
├── maint.db.readonly                  # Maintenance: DB read-only
```

---

## 3. Plan-Based Feature Gates

### 3.1 Gate Derivation

> **⚠️ CRITICAL INVARIANT**  
> Plan gates are **derived from subscription state**, not stored as flags.  
> The flag system only provides **override capability**, not the base truth.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PLAN GATE RESOLUTION                                   │
└─────────────────────────────────────────────────────────────────────────────┘

[Check Feature Access]
         │
         ▼
┌─────────────────────────────────────────┐
│ 1. Check Kill Switch                    │
│    kill.{feature}.* = true?             │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Kill Active]            [No Kill]
        │                         │
        ▼                         ▼
   [DENY]                ┌─────────────────┐
                         │ 2. Check User   │
                         │    Override     │
                         └────────┬────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
              [Has Override]            [No Override]
                     │                         │
                     ▼                         ▼
              [Use Override]          ┌─────────────────┐
                                      │ 3. Derive from  │
                                      │    Plan Config  │
                                      └────────┬────────┘
                                               │
                                               ▼
                                      [Return Plan Value]
```

### 3.2 Plan Feature Matrix (Reference)

| Feature | Free | Pro | Advance | Override Allowed? |
|---------|------|-----|---------|-------------------|
| `plan.api.access` | ❌ | ✅ | ✅ | Yes (upgrade user) |
| `plan.limits.daily_uses` | 50 | 500 | ∞ | Yes (increase) |
| `plan.limits.file_size_mb` | 10 | 50 | 100 | Yes (increase) |
| `plan.limits.concurrent_jobs` | 1 | 3 | 10 | Yes (increase) |
| `plan.features.batch_processing` | ❌ | ✅ | ✅ | Yes |
| `plan.features.priority_queue` | ❌ | ❌ | ✅ | Yes |
| `plan.features.custom_branding` | ❌ | ❌ | ✅ | No |

### 3.3 Override Rules

```typescript
// Allowed overrides for plan gates
const PLAN_GATE_OVERRIDE_RULES = {
  // Can grant access to higher-tier features
  'plan.api.access': { allowGrant: true, allowRevoke: false },
  
  // Can increase limits, never decrease below plan default
  'plan.limits.*': { 
    allowIncrease: true, 
    allowDecrease: false,
    minValue: 'plan_default'
  },
  
  // Binary features: can grant early access
  'plan.features.*': { allowGrant: true, allowRevoke: false },
};

// ⚠️ INVARIANT: Overrides can only EXPAND access, never restrict
// below plan entitlement. To restrict, use abuse flags.

// ⚠️ INVARIANT: Abuse flags ALWAYS override plan entitlements and
// plan overrides. No override may bypass an active abuse restriction.
// Resolution order: Kill Switch → Abuse Flag → Override → Plan Default
```

---

## 4. Tool-Level Flags

### 4.1 Tool Flag Types

| Flag Type | Purpose | Example |
|-----------|---------|---------|
| `enabled` | Master on/off for tool | `tool.pdf_merge.enabled` |
| `beta` | Beta access gate | `tool.ai_writer.beta` |
| `deprecated` | Deprecation warning | `tool.old_converter.deprecated` |
| `hidden` | Hide from catalog (still callable via direct URL/API) | `tool.internal_debug.hidden` |
| `maintenance` | Temporary disable | `tool.image_resize.maintenance` |

### 4.2 Tool Flag Schema

```typescript
interface ToolFlags {
  // Core availability
  enabled: boolean;              // Default: true (from tools table)
  
  // Access control
  beta: boolean;                 // Default: false
  beta_plans: string[];          // Plans with beta access: ['advance']
  beta_users: string[];          // Individual user IDs
  
  // Lifecycle
  deprecated: boolean;           // Default: false
  deprecation_message: string;   // Shown to users
  sunset_date: Date | null;      // When tool will be removed
  
  // Visibility
  hidden: boolean;               // Default: false
  hidden_reason: string;         // Internal note
  
  // Operational
  maintenance: boolean;          // Default: false
  maintenance_message: string;   // Shown during maintenance
  maintenance_eta: Date | null;  // Expected resolution
}
```

### 4.3 Tool Access Resolution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TOOL ACCESS RESOLUTION                                │
└─────────────────────────────────────────────────────────────────────────────┘

[User Requests Tool]
         │
         ▼
┌───────────────────┐      ┌─────────────────────┐
│ tool.*.enabled?   │────▶ │ NO: 404 Not Found   │
└─────────┬─────────┘      └─────────────────────┘
          │ YES
          ▼
┌───────────────────┐      ┌─────────────────────┐
│ tool.*.maintenance│────▶ │ YES: 503 + ETA msg  │
└─────────┬─────────┘      └─────────────────────┘
          │ NO
          ▼
┌───────────────────┐      ┌─────────────────────────────────────┐
│ tool.*.beta?      │────▶ │ YES: Check beta_plans + beta_users  │
└─────────┬─────────┘      │      └─▶ Access granted / 403       │
          │ NO             └─────────────────────────────────────┘
          ▼
┌───────────────────┐      ┌─────────────────────┐
│ tool.*.deprecated?│────▶ │ YES: Show warning,  │
└─────────┬─────────┘      │      allow access   │
          │ NO             └─────────────────────┘
          ▼
┌───────────────────┐      ┌─────────────────────┐
│ Plan feature gate │────▶ │ Standard plan check │
└─────────┬─────────┘      └─────────────────────┘
          │
          ▼
    [Access Granted]
```

### 4.4 Beta Rollout Configuration

```typescript
// Example: Rolling out new AI tool
const AI_SUMMARIZER_BETA: ToolBetaConfig = {
  flag: 'tool.ai_summarizer.beta',
  
  // Phase 1: Internal only
  phase_1: {
    enabled: true,
    beta_users: ['admin_user_1', 'admin_user_2'],
    beta_plans: [],
    start_date: '2026-01-15',
  },
  
  // Phase 2: Advance plan users
  phase_2: {
    enabled: true,
    beta_users: ['admin_user_1', 'admin_user_2'],
    beta_plans: ['advance'],
    start_date: '2026-02-01',
  },
  
  // Phase 3: All paid plans
  phase_3: {
    enabled: true,
    beta_users: [],
    beta_plans: ['pro', 'advance'],
    start_date: '2026-02-15',
  },
  
  // GA: Remove beta flag
  ga: {
    enabled: true,
    beta: false,  // Remove beta gate entirely
    start_date: '2026-03-01',
  },
};
```

---

## 5. Operational Kill Switches

### 5.1 Kill Switch Categories

| Category | Prefix | Use Case | Auto-Recovery |
|----------|--------|----------|---------------|
| **Service** | `kill.service.*` | Third-party outages | Manual |
| **Payment** | `kill.payment.*` | Payment processor issues | Manual |
| **Auth** | `kill.auth.*` | Auth provider issues | Manual |
| **Feature** | `kill.feature.*` | Critical bugs | Manual |
| **Region** | `kill.region.*` | Regional outages | Manual |

### 5.2 Kill Switch Definitions

```typescript
const KILL_SWITCHES = {
  // Service-level kills
  'kill.service.fastapi': {
    description: 'Disable all FastAPI backend calls',
    impact: 'Media processing, AI tools unavailable',
    fallback: 'Show "service temporarily unavailable" for affected tools',
    blast_radius: { reads: true, writes: true, async_jobs: true },
  },
  'kill.service.r2': {
    description: 'Disable file uploads/downloads',
    impact: 'All file-based tools unavailable',
    fallback: 'Text-only tools remain functional',
    blast_radius: { reads: true, writes: true, async_jobs: false },
  },
  'kill.service.inngest': {
    description: 'Disable background job dispatch',
    impact: 'Async operations fail, sync-only mode',
    fallback: 'Queue jobs to database, process when restored',
    blast_radius: { reads: false, writes: false, async_jobs: true },
  },
  
  // Payment kills
  'kill.payment.stripe': {
    description: 'Disable Stripe checkout for coins',
    impact: 'Users cannot purchase coins',
    fallback: 'Hide coin purchase UI, show maintenance message',
  },
  'kill.payment.polar': {
    description: 'Disable Polar subscription management',
    impact: 'Users cannot upgrade/downgrade plans',
    fallback: 'Hide plan change UI, existing subs continue',
  },
  'kill.payment.webhooks': {
    description: 'Reject all payment webhooks',
    impact: 'Payment events not processed',
    fallback: 'Queue to dead-letter, reconcile manually',
  },
  
  // Auth kills
  'kill.auth.oauth_google': {
    description: 'Disable Google OAuth login',
    impact: 'Users must use email/password or GitHub',
    fallback: 'Hide Google button, show alternative methods',
  },
  'kill.auth.oauth_github': {
    description: 'Disable GitHub OAuth login',
    impact: 'Users must use email/password or Google',
    fallback: 'Hide GitHub button, show alternative methods',
  },
  'kill.auth.new_signups': {
    description: 'Disable new user registration',
    impact: 'No new accounts created',
    fallback: 'Show waitlist form instead',
  },
  
  // Feature kills
  'kill.feature.api': {
    description: 'Disable public REST API',
    impact: 'API consumers receive 503',
    fallback: 'Return maintenance response with Retry-After',
  },
  'kill.feature.coins': {
    description: 'Disable coin system entirely',
    impact: 'All tools free (within plan limits)',
    fallback: 'Skip coin checks, log for reconciliation',
    // ⚠️ CONSTRAINT: When active, coin checks are skipped BUT usage
    // is still logged and hard-limited by plan caps. No unlimited
    // execution is permitted. Reconciliation required post-incident.
  },
  'kill.feature.file_uploads': {
    description: 'Disable file uploads globally',
    impact: 'File-based tools unavailable',
    fallback: 'Text input tools remain functional',
  },
};
```

### 5.3 Kill Switch Activation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      KILL SWITCH ACTIVATION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[Incident Detected]
         │
         ▼
┌─────────────────────────────────────────┐
│ Admin: Activate Kill Switch             │
│ • Select switch from predefined list    │
│ • Enter incident reason (mandatory)     │
│ • Confirm understanding of impact       │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ System Actions:                         │
│ 1. Set Redis flag (immediate)           │
│ 2. Persist to PostgreSQL (durable)      │
│ 3. Broadcast to all instances           │
│ 4. Log to audit trail                   │
│ 5. Send alert to on-call                │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Impact:                                 │
│ • All requests check kill switches FIRST│
│ • Affected features return fallback     │
│ • Users see maintenance messaging       │
└────────────────────┬────────────────────┘
                     │
                     ▼
              [Incident Resolved]
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Admin: Deactivate Kill Switch           │
│ • Enter resolution notes                │
│ • Gradual rollback option               │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Post-Incident:                          │
│ • Audit log complete                    │
│ • Duration tracked                      │
│ • Impact metrics recorded               │
└─────────────────────────────────────────┘
```

### 5.4 Kill Switch SLA

| Switch Type | Activation Time | Propagation Time | Required Approval |
|-------------|-----------------|------------------|-------------------|
| Service | < 30 seconds | < 5 seconds | Any admin |
| Payment | < 30 seconds | < 5 seconds | Any admin |
| Auth | < 30 seconds | < 5 seconds | Any admin |
| Feature | < 30 seconds | < 5 seconds | Any admin |
| `kill.auth.new_signups` | < 30 seconds | < 5 seconds | Super admin |

---

## 6. Rollout & Experimentation

### 6.1 Percentage Rollout

```typescript
interface PercentageRollout {
  flag: string;
  
  // Rollout configuration
  percentage: number;            // 0-100
  sticky: boolean;               // User always gets same value
  
  // Targeting
  include_plans: string[];       // Only these plans
  exclude_users: string[];       // Never include these users
  
  // Rollout schedule
  schedule: RolloutPhase[];
}

interface RolloutPhase {
  percentage: number;
  start_at: Date;
  auto_advance: boolean;         // Auto-advance to next phase
  success_criteria?: {
    error_rate_below: number;    // e.g., 0.01 (1%)
    latency_p99_below: number;   // e.g., 500ms
  };
}

// Example: New dashboard rollout
const NEW_DASHBOARD_ROLLOUT: PercentageRollout = {
  flag: 'exp.ui.new_dashboard',
  percentage: 0,
  sticky: true,
  include_plans: ['pro', 'advance'],  // Paid users first
  exclude_users: [],
  schedule: [
    { percentage: 5, start_at: new Date('2026-02-01'), auto_advance: false },
    { percentage: 25, start_at: new Date('2026-02-08'), auto_advance: true,
      success_criteria: { error_rate_below: 0.01, latency_p99_below: 500 } },
    { percentage: 50, start_at: new Date('2026-02-15'), auto_advance: true,
      success_criteria: { error_rate_below: 0.01, latency_p99_below: 500 } },
    { percentage: 100, start_at: new Date('2026-02-22'), auto_advance: false },
  ],
};
```

### 6.2 A/B Experiment Schema

```typescript
interface Experiment {
  id: string;
  key: string;                   // e.g., 'exp.pricing.annual_discount'
  name: string;
  hypothesis: string;            // What we're testing
  
  // Variants
  variants: ExperimentVariant[];
  
  // Targeting
  target_audience: {
    plans: string[];
    percentage: number;          // % of audience in experiment
    new_users_only: boolean;
  };
  
  // Metrics
  primary_metric: string;        // e.g., 'conversion_rate'
  secondary_metrics: string[];
  minimum_sample_size: number;
  
  // Lifecycle
  status: 'draft' | 'running' | 'paused' | 'concluded';
  start_at: Date;
  end_at: Date;
  concluded_variant: string | null;  // Winner
  
  // Audit
  owner: string;
  created_at: Date;
}

interface ExperimentVariant {
  key: string;                   // e.g., 'control', 'variant_a'
  name: string;
  weight: number;                // 0-100, must sum to 100
  config: Record<string, any>;   // Variant-specific config
}
```

### 6.3 Experiment Assignment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXPERIMENT ASSIGNMENT                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[User Requests Feature]
         │
         ▼
┌─────────────────────────────────────────┐
│ Check Active Experiments                │
│ for this feature                        │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [No Experiment]          [Experiment Active]
        │                         │
        ▼                         ▼
  [Default                ┌─────────────────┐
   Behavior]              │ Check: User in  │
                          │ target audience?│
                          └────────┬────────┘
                                   │
                      ┌────────────┴────────────┐
                      │                         │
                      ▼                         ▼
               [Not in Target]           [In Target]
                      │                         │
                      ▼                         ▼
               [Default                 ┌─────────────────┐
                Behavior]               │ Check: Already  │
                                        │ assigned?       │
                                        └────────┬────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                                    ▼                         ▼
                             [Not Assigned]            [Has Assignment]
                                    │                         │
                                    ▼                         ▼
                             ┌─────────────────┐       [Return Stored
                             │ Assign Variant  │        Variant]
                             │ (weighted random│
                             │  + sticky)      │
                             └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ Store Assignment│
                             │ Log Exposure    │
                             │ (best-effort)   │
                             └────────┬────────┘
                                      │
                                      ▼
                               [Return Variant]
```

> **⚠️ INVARIANT**: Exposure logging is best-effort and must not block request handling. Analytics failures never affect feature delivery.

### 6.4 Experiment Guardrails

```typescript
const EXPERIMENT_GUARDRAILS = {
  // Maximum concurrent experiments per user
  max_experiments_per_user: 3,
  
  // Experiments that cannot run together
  mutually_exclusive: [
    ['exp.pricing.*', 'exp.billing.*'],  // No pricing + billing overlap
    ['exp.ui.checkout.*'],               // Only one checkout experiment
  ],
  
  // Required approval for sensitive experiments
  require_approval: [
    'exp.pricing.*',      // Pricing changes
    'exp.auth.*',         // Auth flow changes
    'exp.billing.*',      // Billing changes
  ],
  
  // Auto-stop conditions
  auto_stop: {
    error_rate_above: 0.05,       // 5% error rate
    latency_p99_above: 2000,      // 2s latency
    conversion_drop_below: 0.8,   // 20% conversion drop
  },
};
```

---

## 7. Abuse Response Flags

### 7.1 Per-User Abuse Flags

```typescript
interface UserAbuseFlags {
  user_id: string;
  
  // Rate limiting
  rate_limited: boolean;
  rate_limit_multiplier: number;     // 0.5 = half normal rate, 2 = double
  rate_limit_expires_at: Date;
  
  // Feature restrictions
  feature_bans: {
    feature: string;                 // e.g., 'file_uploads', 'api_access'
    reason: string;
    banned_at: Date;
    expires_at: Date | null;         // null = permanent
  }[];
  
  // Account-level
  account_frozen: boolean;
  freeze_reason: string;
  frozen_at: Date;
  
  // Coin system
  coin_purchases_disabled: boolean;
  coin_disable_reason: string;
  
  // API access
  api_disabled: boolean;
  api_disable_reason: string;
}
```

### 7.2 Abuse Flag Triggers

| Trigger | Auto-Applied Flag | Duration | Manual Review |
|---------|-------------------|----------|---------------|
| Rate limit exceeded (5x) | `rate_limited: true` | 1 hour | No |
| Rate limit exceeded (10x) | `rate_limit_multiplier: 0.5` | 24 hours | Yes |
| Suspicious file uploads | `feature_bans: ['file_uploads']` | 24 hours | Yes |
| Payment chargeback | `coin_purchases_disabled: true` | Until resolved | Yes |
| API abuse detected | `api_disabled: true` | 24 hours | Yes |
| ToS violation report | `account_frozen: true` | Until review | Yes (mandatory) |

### 7.3 Abuse Flag Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ABUSE FLAG LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[Abuse Signal Detected]
         │
         ▼
┌─────────────────────────────────────────┐
│ Automated Analysis:                     │
│ • Pattern matching                      │
│ • Threshold checks                      │
│ • Historical behavior                   │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Below Threshold]         [Above Threshold]
        │                         │
        ▼                         ▼
  [Log + Monitor]          ┌─────────────────┐
                           │ Apply Auto-Flag │
                           │ (with 24h       │
                           │  cooldown)      │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ Notify User     │
                           │ (if applicable) │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ Queue for       │
                           │ Manual Review   │
                           └────────┬────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
        [False Positive]     [True Positive]     [Escalate]
               │                    │                    │
               ▼                    ▼                    ▼
        ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
        │ Remove Flag │      │ Extend/     │      │ Account     │
        │ Log Review  │      │ Escalate    │      │ Suspension  │
        └─────────────┘      └─────────────┘      └─────────────┘
```

### 7.4 Abuse Cooldown Rules

> **⚠️ INVARIANT**: After any abuse flag is applied, there is a **24-hour cooldown** before the same flag can be automatically re-applied to the same user. This prevents flag-thrashing loops.

```typescript
const ABUSE_COOLDOWN_RULES = {
  // Same flag on same user
  same_flag_same_user: 24 * 60 * 60 * 1000,  // 24 hours
  
  // Any flag on same user (spam protection)
  any_flag_same_user: 60 * 60 * 1000,        // 1 hour
  
  // Account freeze has no cooldown (manual only)
  account_freeze: null,
};
```

---

## 8. Flag Lifecycle Management

### 8.1 Flag States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLAG LIFECYCLE                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  [Draft] ──────▶ [Active] ──────▶ [Deprecated] ──────▶ [Archived]
     │               │                   │
     │               │                   │
     ▼               ▼                   ▼
  Created       Deployed to          Marked for
  in admin      production           removal
  UI
     │               │                   │
     │               │                   │
     ▼               ▼                   ▼
  Review        Evaluation          Cleanup
  required      ongoing             pending
```

### 8.2 Mandatory Review Policy

```typescript
const FLAG_REVIEW_POLICY = {
  // Maximum time without review
  max_age_without_review: {
    experiment: 30,      // 30 days
    tool: 90,            // 90 days
    kill_switch: 7,      // 7 days (if active)
    abuse: 7,            // 7 days
    maintenance: 1,      // 1 day
  },
  
  // Auto-actions on overdue review
  overdue_actions: {
    experiment: 'pause',           // Pause experiment
    tool: 'notify_owner',          // Notify owner
    kill_switch: 'escalate',       // Escalate to on-call
    abuse: 'notify_owner',         // Notify owner
    maintenance: 'auto_disable',   // Auto-disable flag
  },
};
```

### 8.3 Flag Cleanup Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLAG CLEANUP (Weekly Job)                              │
└─────────────────────────────────────────────────────────────────────────────┘

[Weekly Cleanup Job]
         │
         ▼
┌─────────────────────────────────────────┐
│ Scan All Flags                          │
└────────────────────┬────────────────────┘
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
    ▼                ▼                    ▼
[Expired Flags] [Overdue Review Flags] [Concluded Experiments]
    │                │                    │
    ▼                ▼                    ▼
┌─────────────┐  ┌─────────────┐     ┌─────────────┐
│ Archive     │  │ Send        │     │ Archive     │
│ flag        │  │ reminder    │     │ experiment  │
│ Remove      │  │ to owner    │     │ Apply       │
│ overrides   │  └─────────────┘     │ winner      │
└─────────────┘                      └─────────────┘
    │                │                    │
    └────────────────┼────────────────────┘
                     │
                     ▼
            [Generate Report]
            [Notify Owners]
```

### 8.4 Flag Audit Requirements

```typescript
interface FlagAuditEntry {
  id: string;
  timestamp: Date;
  
  // What changed
  flag_key: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'archived';
  previous_value: string | null;
  new_value: string | null;
  
  // Who changed it
  actor_id: string;              // Admin user ID
  actor_type: 'admin' | 'system' | 'automation';
  
  // Why
  reason: string;                // Mandatory
  incident_id: string | null;    // Link to incident if applicable
  
  // Context
  ip_address: string;
  user_agent: string;
}

// ⚠️ INVARIANT: No flag change occurs without an audit entry.
// Audit log is append-only and immutable.

// ⚠️ INVARIANT: Flags are never hard-deleted; archived flags remain
// queryable for audit purposes indefinitely.
```

---

## 9. Implementation Patterns

### 9.1 Flag SDK Interface

```typescript
// Client-side SDK
interface FlagClient {
  // Core methods
  isEnabled(flag: string): boolean;
  getValue<T>(flag: string, defaultValue: T): T;
  
  // User context
  setUserContext(context: UserContext): void;
  
  // Experiments
  getVariant(experimentKey: string): string | null;
  trackExposure(experimentKey: string): void;
  
  // Lifecycle
  refresh(): Promise<void>;
  subscribe(callback: (flags: FlagSet) => void): () => void;
  // ⚠️ NOTE: Subscriptions are per-session; cross-tab synchronization
  // relies on Redis refresh or page reload. No cross-tab broadcast.
}

// Server-side SDK
interface FlagService {
  // Core methods (with user context)
  isEnabled(flag: string, userId: string): Promise<boolean>;
  getValue<T>(flag: string, userId: string, defaultValue: T): Promise<T>;
  
  // Batch operations
  getAllFlags(userId: string): Promise<FlagSet>;
  
  // Admin operations
  setOverride(flag: string, target: OverrideTarget, value: any, reason: string): Promise<void>;
  removeOverride(flag: string, target: OverrideTarget, reason: string): Promise<void>;
  
  // Kill switches (immediate)
  activateKillSwitch(key: string, reason: string): Promise<void>;
  deactivateKillSwitch(key: string, reason: string): Promise<void>;
}
```

### 9.2 Flag Check Patterns

```typescript
// ✅ CORRECT: Check with default fallback
async function processFile(userId: string, file: File) {
  const maxSize = await flags.getValue(
    'plan.limits.file_size_mb',
    userId,
    10  // Default for Free plan
  );
  
  if (file.size > maxSize * 1024 * 1024) {
    throw new FileTooLargeError(maxSize);
  }
}

// ✅ CORRECT: Kill switch check first
async function handleCheckout(userId: string) {
  // Kill switches are checked synchronously from cache
  if (flags.isKillSwitchActive('kill.payment.stripe')) {
    throw new ServiceUnavailableError('Payments temporarily unavailable');
  }
  
  // Continue with checkout...
}

// ✅ CORRECT: Experiment with exposure tracking
function renderPricingPage(userId: string) {
  const variant = flags.getVariant('exp.pricing.annual_discount');
  
  if (variant) {
    flags.trackExposure('exp.pricing.annual_discount');
  }
  
  return variant === 'variant_a' 
    ? <PricingWithDiscount /> 
    : <StandardPricing />;
}

// ❌ WRONG: No default value
const maxSize = await flags.getValue('plan.limits.file_size_mb', userId);
// If flag missing, maxSize is undefined → runtime error

// ❌ WRONG: Checking kill switch after business logic
const result = await processPayment();  // Already failed!
if (flags.isKillSwitchActive('kill.payment.stripe')) { ... }
```

### 9.3 Caching Strategy

```typescript
const FLAG_CACHE_CONFIG = {
  // Redis cache TTLs
  redis: {
    global_flags: 60,           // 60 seconds
    plan_flags: 60,             // 60 seconds
    user_flags: 30,             // 30 seconds
    kill_switches: 5,           // 5 seconds (fast propagation)
    experiments: 300,           // 5 minutes (stable assignments)
  },
  
  // In-memory cache (per request)
  memory: {
    enabled: true,
    ttl: 'request',             // Valid for single request
  },
  
  // Stale-while-revalidate
  swr: {
    enabled: true,
    stale_ttl: 300,             // Serve stale for 5 minutes
    revalidate_on_error: false, // Don't revalidate on error
  },
};
```

### 9.4 Monitoring & Alerting

```typescript
const FLAG_MONITORING = {
  // Metrics to track
  metrics: [
    'flag.check.count',          // Total flag checks
    'flag.check.latency',        // Flag evaluation time
    'flag.cache.hit_rate',       // Cache effectiveness
    'flag.override.count',       // Active overrides
    'kill_switch.active.count',  // Active kill switches
    'experiment.exposure.count', // Experiment exposures
  ],
  
  // Alerts
  alerts: [
    {
      name: 'high_flag_latency',
      condition: 'flag.check.latency.p99 > 50ms',
      severity: 'warning',
    },
    {
      name: 'low_cache_hit_rate',
      condition: 'flag.cache.hit_rate < 0.9',
      severity: 'warning',
    },
    {
      name: 'kill_switch_activated',
      condition: 'kill_switch.active.count > 0',
      severity: 'critical',
      notify: ['on-call', 'slack-incidents'],
    },
    {
      name: 'experiment_stopped',
      condition: 'experiment.auto_stopped = true',
      severity: 'high',
      notify: ['experiment-owner'],
    },
  ],
};
```

---

## Appendix A: Flag Registry

### A.1 Plan Gates

| Flag Key | Type | Default | Description |
|----------|------|---------|-------------|
| `plan.api.access` | boolean | false | REST API access enabled |
| `plan.api.rate_limit` | number | 0 | Requests per minute (0 = no access) |
| `plan.limits.daily_uses` | number | 50 | Daily tool executions |
| `plan.limits.file_size_mb` | number | 10 | Max upload file size |
| `plan.limits.concurrent_jobs` | number | 1 | Simultaneous jobs |
| `plan.features.batch_processing` | boolean | false | Batch file processing |
| `plan.features.priority_queue` | boolean | false | Priority job queue |

### A.2 Kill Switches

| Flag Key | Impact | Fallback |
|----------|--------|----------|
| `kill.service.fastapi` | Media processing down | Text tools only |
| `kill.service.r2` | File uploads down | Text tools only |
| `kill.payment.stripe` | Coin purchase down | Hide UI |
| `kill.payment.polar` | Subscriptions down | Existing subs continue |
| `kill.auth.oauth_google` | Google login down | Alternative logins |
| `kill.auth.oauth_github` | GitHub login down | Alternative logins |
| `kill.feature.api` | Public API down | 503 response |
| `kill.feature.coins` | Coin system down | Free tools |

### A.3 Maintenance Flags

> **Intent Distinction**: Maintenance flags are for **planned, user-visible** degradation (e.g., scheduled maintenance windows). Kill switches are for **unplanned emergency** controls. Do not use maintenance flags for incident response.

| Flag Key | Type | Description |
|----------|------|-------------|
| `maint.db.readonly` | boolean | Database in read-only mode |
| `maint.site.degraded` | boolean | Show degraded mode banner |
| `maint.migrations.lock` | boolean | Prevent user migrations |

---

## Appendix B: Decision Log

| Decision | Rationale |
|----------|-----------|
| Plan gates derived, not stored | Single source of truth for entitlements |
| Kill switches bypass resolution | Emergency response must be instant |
| 24h abuse cooldown | Prevent flag-thrashing loops |
| Mandatory review dates | Prevent flag debt accumulation |
| Sticky experiment assignment | Consistent user experience |

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [01_USER_ROLES_PERMISSIONS](01_USER_ROLES_PERMISSIONS.md) | Plan entitlements |
| [21_BILLING_LOGIC](21_BILLING_LOGIC.md) | Payment kill switches |
| [15_SECURITY_MODEL](15_SECURITY_MODEL.md) | Abuse flags |
| [23_STATE_FLOW_DIAGRAMS](23_STATE_FLOW_DIAGRAMS.md) | Flag check points |

---

*This document defines runtime feature control for HSAFX WORLD. All flags must follow these patterns.*