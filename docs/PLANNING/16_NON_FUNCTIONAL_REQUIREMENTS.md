# 16 — Non-Functional Requirements

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — NFRs v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `10_SYSTEM_ARCHITECTURE`, `15_SECURITY_MODEL`, and `03_FEATURE_FLAGS`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Performance Requirements](#2-performance-requirements)
3. [Availability & Reliability](#3-availability--reliability)
4. [Scalability Requirements](#4-scalability-requirements)
5. [Security & Compliance](#5-security--compliance)
6. [Observability & Monitoring](#6-observability--monitoring)
7. [Data Management](#7-data-management)
8. [Disaster Recovery](#8-disaster-recovery)
9. [Operational Requirements](#9-operational-requirements)
10. [Cost & Resource Constraints](#10-cost--resource-constraints)

---

## 1. Overview

### 1.1 Purpose

This document defines **measurable, enforceable non-functional requirements** (NFRs) for HSAFX WORLD. These are not aspirations — they are **Service Level Objectives (SLOs)** that drive architectural decisions and operational practices.

### 1.2 NFR Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NFR TAXONOMY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  PERFORMANCE    │  │  AVAILABILITY   │  │  SCALABILITY    │              │
│  │  (Speed)        │  │  (Uptime)       │  │  (Growth)       │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ • Latency       │  │ • Uptime SLO    │  │ • User growth   │              │
│  │ • Throughput    │  │ • Error budget  │  │ • Data growth   │              │
│  │ • Response time │  │ • MTTR/MTBF     │  │ • Traffic spikes│              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  SECURITY       │  │  OBSERVABILITY  │  │  OPERATIONS     │              │
│  │  (Protection)   │  │  (Visibility)   │  │  (Maintenance)  │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ • Compliance    │  │ • Logging       │  │ • Deployment    │              │
│  │ • Audit         │  │ • Metrics       │  │ • Backup/DR     │              │
│  │ • Encryption    │  │ • Alerting      │  │ • Runbooks      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 SLO Hierarchy

| Tier | Description | Error Budget (monthly) |
|------|-------------|------------------------|
| **Tier 0** | Core platform (auth, billing) | 0.1% (99.9% availability) |
| **Tier 1** | Primary features (tool execution) | 0.5% (99.5% availability) |
| **Tier 2** | Secondary features (analytics, admin) | 1.0% (99.0% availability) |
| **Tier 3** | Best-effort (notifications, exports) | 5.0% (95.0% availability) |

---

## 2. Performance Requirements

### 2.1 Latency Budgets

#### 2.1.1 API Response Times

| Endpoint Category | P50 | P95 | P99 | Hard Limit |
|-------------------|-----|-----|-----|------------|
| **Authentication** | 80ms | 250ms | 400ms | 1s |
| **Session validation** | 10ms | 40ms | 80ms | 150ms |
| **Tool metadata fetch** | 30ms | 80ms | 150ms | 300ms |
| **WASM tool execution** | N/A (client) | N/A | N/A | N/A |
| **API tool execution (sync)** | 200ms | 500ms | 1s | 5s |
| **File upload presigned URL** | 40ms | 100ms | 180ms | 300ms |
| **Coin balance check** | 15ms | 60ms | 100ms | 150ms |
| **Subscription status** | 20ms | 70ms | 120ms | 200ms |

> **⚠️ Serverless Latency Note**  
> P95 targets are calibrated for serverless infrastructure (Vercel Edge, Neon, Upstash) including cold start variance. Hard limits remain unchanged as circuit breaker thresholds.

#### 2.1.2 Background Job Latency

| Job Type | Start Delay | Processing P95 | Max Duration |
|----------|-------------|----------------|--------------|
| **Media processing** | < 5s | 30s | 5 min |
| **PDF operations** | < 3s | 15s | 2 min |
| **AI/ML inference** | < 10s | 60s | 10 min |
| **Webhook processing** | < 1s | 5s | 30s |
| **Email sending** | < 10s | 30s | 2 min |

#### 2.1.3 Latency Budget Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API REQUEST LATENCY BUDGET (P95)                         │
│                         Target: 500ms total                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  [Edge/CDN]     [Auth]      [Business]    [Database]    [Response]      │
  │     20ms         30ms         200ms          200ms         50ms         │
  │                                                                         │
  │  ├────────────┼───────────┼─────────────┼─────────────┼──────────────┤  │
  │  0           20          50           250           450           500   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Budget Allocation:
  • Edge/CDN:        20ms (4%)   - TLS, routing, edge processing
  • Auth:            30ms (6%)   - Session validation, JWT decode
  • Business Logic: 200ms (40%)  - Application processing
  • Database:       200ms (40%)  - Query execution, serialization
  • Response:        50ms (10%)  - Serialization, compression
```

### 2.2 Throughput Requirements

#### 2.2.1 Request Throughput

| Service | Sustained RPS | Peak RPS | Burst Duration |
|---------|---------------|----------|----------------|
| **Next.js (Edge)** | 1,000 | 5,000 | 30s |
| **Next.js (API)** | 500 | 2,000 | 30s |
| **FastAPI** | 200 | 500 | 60s |
| **Database (read)** | 2,000 | 5,000 | 30s |
| **Database (write)** | 200 | 500 | 30s |
| **Redis** | 10,000 | 30,000 | 60s |

#### 2.2.2 Concurrent User Targets

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Registered users** | 10,000 | 50,000 | 200,000 |
| **Monthly active users** | 3,000 | 15,000 | 60,000 |
| **Peak concurrent users** | 300 | 1,500 | 6,000 |
| **Tool executions/day** | 10,000 | 50,000 | 200,000 |

### 2.3 Resource Limits

```typescript
const RESOURCE_LIMITS = {
  // Request limits
  request: {
    max_body_size: '50MB',          // File uploads
    max_json_body: '1MB',           // API payloads
    max_query_params: 100,          // URL parameters
    max_headers_size: '32KB',       // HTTP headers
    request_timeout: '30s',         // Total request timeout
  },
  
  // Processing limits
  processing: {
    max_file_size_free: '10MB',
    max_file_size_pro: '50MB',
    max_file_size_advance: '100MB',
    max_batch_files: 20,
    max_output_size: '200MB',
    wasm_memory_limit: '256MB',     // Browser WASM limit
    wasm_execution_timeout: '30s',  // Client-side timeout
  },
  
  // Rate limits (per user, per minute)
  rate_limits: {
    free: { requests: 60, tools: 10 },
    pro: { requests: 300, tools: 50 },
    advance: { requests: 1000, tools: 200 },
    api: { requests_per_key: 100 },
  },
};
```

---

## 3. Availability & Reliability

### 3.1 Availability Targets

#### 3.1.1 Service Level Objectives (SLOs)

| Service | Availability | Monthly Downtime Budget | Error Rate |
|---------|--------------|-------------------------|------------|
| **Authentication** | 99.9% | 43 minutes | < 0.1% |
| **Billing/Payments** | 99.9% | 43 minutes | < 0.1% |
| **Tool Execution** | 99.5% | 3.6 hours | < 0.5% |
| **File Storage (R2)** | 99.9% | 43 minutes | < 0.1% |
| **Background Jobs** | 99.0% | 7.2 hours | < 1.0% |
| **Admin Dashboard** | 99.0% | 7.2 hours | < 1.0% |
| **Public API** | 99.5% | 3.6 hours | < 0.5% |

#### 3.1.2 Error Budget Policy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR BUDGET POLICY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Error Budget = (1 - SLO) × Time Period

  For 99.5% SLO over 30 days:
  Budget = 0.5% × 43,200 minutes = 216 minutes of downtime

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Budget Remaining    │  Policy                                          │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  > 50%               │  Normal operations, feature velocity             │
  │  25% - 50%           │  Caution: reduce risky deployments               │
  │  10% - 25%           │  Warning: focus on reliability work              │
  │  < 10%               │  Critical: freeze features, fix reliability      │
  │  Exhausted           │  Emergency: all hands on reliability             │
  └─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Reliability Metrics

#### 3.2.1 MTTR / MTBF Targets

| Severity | MTTR Target | MTBF Target | Escalation |
|----------|-------------|-------------|------------|
| **P0 (Critical)** | < 30 min | > 30 days | Immediate page |
| **P1 (High)** | < 2 hours | > 14 days | Page within 15 min |
| **P2 (Medium)** | < 8 hours | > 7 days | Notify on-call |
| **P3 (Low)** | < 48 hours | N/A | Queue for review |

#### 3.2.2 Incident Severity Definitions

| Severity | Definition | Examples |
|----------|------------|----------|
| **P0** | Complete service outage or data loss | Auth down, payments failing, data corruption |
| **P1** | Major feature unavailable | Tool execution failing, file uploads broken |
| **P2** | Degraded performance or partial outage | Slow responses, some tools failing |
| **P3** | Minor issue, workaround available | UI glitch, non-critical feature broken |

### 3.3 Fault Tolerance

#### 3.3.1 Failure Domains

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FAILURE DOMAIN ISOLATION                            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │                          EXTERNAL SERVICES                            │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
  │  │   Polar     │  │   Stripe    │  │  OAuth      │  │   R2        │   │
  │  │  (billing)  │  │  (coins)    │  │ (auth)      │  │  (storage)  │   │
  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
  │         │                │                │                │          │
  │         ▼                ▼                ▼                ▼          │
  │  ┌─────────────────────────────────────────────────────────────────┐  │
  │  │                    CIRCUIT BREAKERS                             │  │
  │  │  • Each external service has independent circuit                │  │
  │  │  • Failure in one service does not cascade                      │  │
  │  │  • Graceful degradation with kill switches                      │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │                          INTERNAL SERVICES                            │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
  │  │  Next.js    │  │  FastAPI    │  │  PostgreSQL │  │   Redis     │   │
  │  │  (edge)     │  │  (compute)  │  │  (Neon)     │  │  (Upstash)  │   │
  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
  │         │                │                │                │          │
  │         ▼                ▼                ▼                ▼          │
  │  ┌─────────────────────────────────────────────────────────────────┐  │
  │  │                    ISOLATION RULES                              │  │
  │  │  • FastAPI failure → text tools still work                      │  │
  │  │  • Redis failure → fall back to database                        │  │
  │  │  • Edge can serve cached responses during DB outage             │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Graceful Degradation Matrix

| Failing Component | Impact | Degraded Behavior |
|-------------------|--------|-------------------|
| **FastAPI** | No media processing | WASM text tools work, file/media tools show "unavailable" |
| **Redis** | Limited auth operations | See graded fallback below |
| **Neon (read)** | No data access | Serve cached data, read-only mode |

> **⚠️ Redis Failure: Graded Fallback (NOT PostgreSQL)**
> ```
> Redis down →
>   1. Allow existing JWT sessions (stateless validation continues)
>   2. Disable session refresh and new login creation
>   3. Shorten effective session TTL (existing sessions honor original)
>   4. Show banner: "Limited authentication mode"
>   5. PostgreSQL fallback is LAST RESORT only if outage > 30min
> ```
> Rationale: PostgreSQL is not a session store under load. During Redis outage, DB is likely already stressed.
| **Neon (write)** | No mutations | Queue writes, show "read-only" banner |
| **R2** | No file storage | Text-only tools work |
| **Inngest** | No async jobs | Queue to DB fallback table (see below) |
| **Polar** | No subscription mgmt | Existing subscriptions continue |

> **⚠️ Inngest Failure: DB-Backed Queue (NEVER Sync Fallback)**
> ```
> Inngest down →
>   1. Accept job request normally
>   2. Persist to `job_fallback_queue` table in PostgreSQL
>   3. Return "queued" response with estimated delay
>   4. Background poller replays jobs when Inngest recovers
>   5. NEVER execute media/AI/PDF jobs synchronously
> ```
> Rationale: Sync fallback for heavy jobs blows request timeouts, exhausts compute, and causes cascades.
| **Stripe** | No coin purchases | Hide purchase UI, coins still usable |

---

## 4. Scalability Requirements

### 4.1 Horizontal Scaling

#### 4.1.1 Scaling Triggers

| Component | Scale-Up Trigger | Scale-Down Trigger | Min Instances | Max Instances |
|-----------|------------------|-------------------|---------------|---------------|
| **Next.js Edge** | CPU > 70% for 5min | CPU < 30% for 15min | 2 | 20 |
| **Next.js API** | CPU > 70% for 5min | CPU < 30% for 15min | 2 | 10 |
| **FastAPI** | Queue depth > 100 | Queue depth < 10 | 1 | 5 |
| **Neon** | Connections > 80% | Connections < 40% | Auto (serverless) | Auto |

#### 4.1.2 Stateless Design Requirements

```typescript
const STATELESS_REQUIREMENTS = {
  // Session state: NEVER in application memory
  sessions: {
    storage: 'Redis (Upstash)',
    fallback: 'PostgreSQL (Neon)',
    sticky_sessions: false,  // Load balancer does NOT use sticky sessions
  },
  
  // File state: NEVER on local disk
  files: {
    uploads: 'R2 (presigned)',
    temp_processing: 'R2 with TTL',
    local_disk: false,  // No local file storage in compute
  },
  
  // Cache state: External only
  cache: {
    primary: 'Redis (Upstash)',
    local_memory: 'per-request only',
    shared_memory: false,  // No shared memory between requests
  },
};
```

### 4.2 Data Scaling

#### 4.2.1 Storage Growth Projections

| Data Type | Year 1 | Year 2 | Year 3 | Retention |
|-----------|--------|--------|--------|-----------|
| **User data (PostgreSQL)** | 5 GB | 25 GB | 100 GB | Forever |
| **Audit logs (PostgreSQL)** | 10 GB | 50 GB | 200 GB | 2 years |
| **Temp files (R2)** | 100 GB | 500 GB | 2 TB | 24h-7d |
| **Analytics events** | 20 GB | 100 GB | 400 GB | 1 year |

#### 4.2.2 Database Partitioning Strategy

```sql
-- Partition by date for time-series data
-- coin_transactions: partition by month
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- audit_logs: partition by month
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Retention policy: auto-drop partitions older than retention period
-- coin_transactions: keep forever (financial records)
-- audit_logs: keep 2 years, then archive to cold storage
```

> **⚠️ Partitioning Guardrail**
> Partitioning is **deferred until**:
> - `audit_logs` exceeds 10 GB, OR
> - `coin_transactions` write rate exceeds 1,000/day
>
> Neon serverless supports partitions, but partition management (creation, retention, auto-drop) requires scheduled jobs and adds operational complexity. Do not over-engineer early.

### 4.3 Traffic Spike Handling

#### 4.3.1 Spike Scenarios

| Scenario | Expected Spike | Duration | Mitigation |
|----------|----------------|----------|------------|
| **Product Hunt launch** | 10x normal | 24-48h | Pre-scale, edge caching |
| **Viral social media** | 5x normal | 4-8h | Auto-scale, rate limiting |
| **DDoS attack** | 100x+ normal | Variable | WAF, rate limiting, geo-blocking |
| **Scheduled maintenance** | 2x normal (before/after) | 1h | Staggered rollout |

#### 4.3.2 Backpressure Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKPRESSURE HANDLING                               │
└─────────────────────────────────────────────────────────────────────────────┘

  [Incoming Request]
         │
         ▼
  ┌─────────────────────────────────────────┐
  │ Layer 1: Edge Rate Limiting             │
  │ (Cloudflare/Vercel)                     │
  │ • Global rate limit per IP              │
  │ • Bot detection                         │
  └────────────────────┬────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────┐
  │ Layer 2: Application Rate Limiting      │
  │ (Redis-based)                           │
  │ • Per-user limits                       │
  │ • Per-plan limits                       │
  └────────────────────┬────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────┐
  │ Layer 3: Queue Depth Check              │
  │ (Inngest/Redis)                         │
  │ • If queue > threshold: return 503      │
  │ • If queue ok: accept job               │
  └────────────────────┬────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────┐
  │ Layer 4: Database Connection Pool       │
  │ (Neon/pgBouncer)                        │
  │ • If pool exhausted: queue or reject    │
  │ • Connection timeout: 5s                │
  └─────────────────────────────────────────┘
```

---

## 5. Security & Compliance

### 5.1 Security Requirements

#### 5.1.1 Encryption Standards

| Data State | Encryption | Algorithm | Key Management |
|------------|------------|-----------|----------------|
| **At rest (database)** | Required | AES-256 | Neon managed |
| **At rest (files)** | Required | AES-256 | R2 managed |
| **In transit** | Required | TLS 1.3 | Auto-renewed certs |
| **Secrets** | Required | AES-256-GCM | Vercel/Infisical |
| **API keys (stored)** | Hashed | SHA-256 | N/A (one-way) |
| **Passwords** | Hashed | Argon2id | N/A (one-way) |

#### 5.1.2 Access Control Requirements

```typescript
const ACCESS_CONTROL_REQUIREMENTS = {
  // Authentication
  authentication: {
    mfa_available: true,
    mfa_required_for: ['admin', 'super_admin'],
    session_timeout: '7 days',
    session_timeout_inactive: '24 hours',
    max_sessions_per_user: 10,
  },
  
  // Authorization
  authorization: {
    model: 'RBAC + Plan-based',
    principle: 'least privilege',
    default_deny: true,
    audit_all_access: true,
  },
  
  // API Security
  api: {
    rate_limiting: true,
    key_rotation_period: '90 days recommended',
    key_expiry_max: '1 year',
    scopes_required: true,
  },
};
```

### 5.2 Compliance Requirements

#### 5.2.1 Regulatory Compliance

| Regulation | Applicability | Status | Requirements |
|------------|---------------|--------|--------------|
| **GDPR** | EU users | Required | Data export, deletion, consent |
| **CCPA** | California users | Required | Opt-out, disclosure |
| **SOC 2 Type II** | Enterprise customers | Future (Year 2) | Audit, controls |
| **PCI DSS** | Payment data | N/A (Stripe/Polar handle) | No card data stored |

#### 5.2.2 Data Residency

```typescript
const DATA_RESIDENCY = {
  // Primary data location
  primary: {
    region: 'US (Neon default)',
    provider: 'AWS us-east-1',
  },
  
  // User data handling
  user_data: {
    storage_location: 'US',
    processing_location: 'US + Edge (global)',
    transfer_mechanism: 'Standard Contractual Clauses',
  },
  
  // File storage
  files: {
    storage_location: 'R2 (Cloudflare global)',
    auto_replication: true,
  },
  
  // Future: EU data residency option for enterprise
  eu_option: {
    planned: true,
    timeline: 'Year 2',
  },
};
```

### 5.3 Audit Requirements

#### 5.3.1 Audit Log Retention

| Log Type | Retention | Storage | Access |
|----------|-----------|---------|--------|
| **Security events** | 2 years | PostgreSQL → Archive | Admin only |
| **Authentication logs** | 1 year | PostgreSQL | Admin only |
| **API access logs** | 90 days | PostgreSQL | Admin only |
| **Tool execution logs** | 30 days | PostgreSQL | User (own) + Admin |
| **Payment events** | 7 years | PostgreSQL (immutable) | Finance + Admin |
| **Admin actions** | 2 years | PostgreSQL (immutable) | Super admin only |

#### 5.3.2 Audit Event Requirements

```typescript
interface AuditEvent {
  // Required for all events
  id: string;
  timestamp: Date;
  event_type: string;
  actor_id: string | null;
  actor_type: 'user' | 'admin' | 'system' | 'api_key';
  
  // Context
  ip_address: string;
  user_agent: string;
  request_id: string;
  
  // Event-specific
  resource_type: string;
  resource_id: string;
  action: string;
  outcome: 'success' | 'failure';
  
  // Optional details
  metadata: Record<string, any>;
  
  // Immutability
  // ⚠️ INVARIANT: Audit logs are append-only and cannot be modified or deleted
}
```

---

## 6. Observability & Monitoring

### 6.1 Logging Requirements

#### 6.1.1 Log Levels & Retention

| Level | Use Case | Volume (est.) | Retention |
|-------|----------|---------------|-----------|
| **ERROR** | Exceptions, failures | Low | 90 days |
| **WARN** | Anomalies, degradation | Low | 30 days |
| **INFO** | Business events | Medium | 14 days |
| **DEBUG** | Diagnostic details | High | 3 days (dev only) |

#### 6.1.2 Structured Logging Schema

```typescript
interface LogEntry {
  // Standard fields (all logs)
  timestamp: string;           // ISO 8601
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service: string;             // 'nextjs' | 'fastapi' | 'inngest'
  
  // Request context (when applicable)
  request_id?: string;
  user_id?: string;
  session_id?: string;
  
  // Error context (error logs)
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Performance context
  duration_ms?: number;
  
  // Custom fields
  metadata?: Record<string, any>;
}
```

### 6.2 Metrics Requirements

#### 6.2.1 Core Metrics (RED Method)

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| **Rate** | Requests per second | > 2x normal for 5min |
| **Errors** | Error rate percentage | > 1% for 5min |
| **Duration** | Request latency P99 | > 2s for 5min |

#### 6.2.2 Service-Specific Metrics

```typescript
const METRICS_REQUIREMENTS = {
  // Application metrics
  application: [
    'http_requests_total',
    'http_request_duration_seconds',
    'http_request_size_bytes',
    'http_response_size_bytes',
    'active_sessions',
    'tool_executions_total',
    'tool_execution_duration_seconds',
  ],
  
  // Business metrics
  business: [
    'user_signups_total',
    'subscription_changes_total',
    'coin_purchases_total',
    'coin_usage_total',
    'api_key_usage_total',
  ],
  
  // Infrastructure metrics
  infrastructure: [
    'database_connections_active',
    'database_query_duration_seconds',
    'redis_connections_active',
    'redis_memory_used_bytes',
    'queue_depth',
    'queue_processing_time_seconds',
  ],
};
```

### 6.3 Alerting Requirements

#### 6.3.1 Alert Routing

| Severity | Channel | Response Time | Escalation |
|----------|---------|---------------|------------|
| **P0** | PagerDuty + Slack | Immediate | Auto-escalate 15min |
| **P1** | PagerDuty + Slack | 15 minutes | Auto-escalate 1h |
| **P2** | Slack | 1 hour | Manual |
| **P3** | Email | Next business day | N/A |

#### 6.3.2 Alert Definitions

```typescript
const ALERT_DEFINITIONS = {
  // P0: Critical
  p0: [
    { name: 'auth_service_down', condition: 'auth_errors > 50% for 2min' },
    { name: 'payment_failures', condition: 'payment_errors > 10% for 5min' },
    { name: 'database_unreachable', condition: 'db_connection_errors > 0 for 1min' },
    { name: 'data_corruption_detected', condition: 'data_integrity_check_failed' },
  ],
  
  // P1: High
  p1: [
    { name: 'high_error_rate', condition: 'error_rate > 5% for 5min' },
    { name: 'high_latency', condition: 'p99_latency > 2s for 5min' },
    { name: 'queue_backlog', condition: 'queue_depth > 1000 for 10min' },
    { name: 'redis_connection_issues', condition: 'redis_errors > 10% for 5min' },
  ],
  
  // P2: Medium
  p2: [
    { name: 'elevated_error_rate', condition: 'error_rate > 1% for 15min' },
    { name: 'slow_queries', condition: 'db_query_p99 > 1s for 15min' },
    { name: 'certificate_expiry', condition: 'cert_expires_in < 14 days' },
    { name: 'disk_space_low', condition: 'disk_usage > 80%' },
  ],
  
  // P3: Low
  p3: [
    { name: 'deprecation_warnings', condition: 'deprecated_api_calls > 100/day' },
    { name: 'unusual_traffic_pattern', condition: 'traffic_anomaly_score > 0.8' },
  ],
};
```

### 6.4 Tracing Requirements

#### 6.4.1 Distributed Tracing

```typescript
const TRACING_REQUIREMENTS = {
  // Trace sampling
  sampling: {
    default_rate: 0.1,           // 10% of requests
    error_rate: 1.0,             // 100% of errors
    slow_request_rate: 1.0,      // 100% of slow requests (> 1s)
  },
  
  // Span requirements
  spans: {
    required: [
      'http_request',
      'database_query',
      'redis_operation',
      'external_api_call',
      'background_job',
    ],
    context_propagation: 'W3C Trace Context',
  },
  
  // Retention
  retention: {
    traces: '7 days',
    trace_summaries: '30 days',
  },
};
```

---

## 7. Data Management

### 7.1 Data Classification

| Classification | Description | Examples | Handling |
|----------------|-------------|----------|----------|
| **Public** | Intentionally public | Tool catalog, pricing | No restrictions |
| **Internal** | Business data | Analytics, metrics | Employee access |
| **Confidential** | User data | Profiles, usage | Encrypted, audited |
| **Restricted** | Sensitive data | Payments, auth | Encrypted, MFA, audited |

### 7.2 Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LIFECYCLE                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  [Create]        [Use]          [Archive]       [Delete]
     │              │                │               │
     ▼              ▼                ▼               ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │  User Data:    Profile created → Active use → Account deleted → Purge    │
  │                                                                          │
  │  Temp Files:   Uploaded → Processed → 24h expiry → Auto-delete           │
  │                                                                          │
  │  Audit Logs:   Created → Queryable → Archive (2y) → Cold storage         │
  │                                                                          │
  │  Transactions: Created → Immutable → Archive (7y) → Retained forever     │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Data Deletion Requirements

#### 7.3.1 User-Initiated Deletion

| Data Type | Deletion Timeline | Method |
|-----------|-------------------|--------|
| **Account** | 30 days (grace period) | Soft delete → Hard delete |
| **Files** | Immediate | Hard delete from R2 |
| **Usage history** | 30 days | Anonymize or delete |
| **Payment records** | Retained (legal) | Anonymize user reference |

#### 7.3.2 GDPR Right to Erasure

```typescript
const GDPR_ERASURE = {
  // Data that MUST be deleted
  delete: [
    'user profile',
    'email address',
    'session data',
    'API keys',
    'uploaded files',
  ],
  
  // Data that MAY be anonymized
  anonymize: [
    'usage statistics',
    'tool execution logs',
    'analytics events',
  ],
  
  // Data that MUST be retained (legal obligation)
  retain: [
    'payment transaction records (7 years)',
    'audit logs for legal compliance',
  ],
  
  // Timeline
  processing_time: '30 days maximum',
  confirmation: 'Email confirmation upon completion',
};
```

---

## 8. Disaster Recovery

### 8.1 Backup Requirements

#### 8.1.1 Backup Schedule

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| **PostgreSQL (full)** | Daily | 30 days | Neon + S3 cross-region |
| **PostgreSQL (WAL)** | Continuous | 7 days | Neon managed |
| **Redis** | Snapshot daily | 7 days | Upstash managed |
| **R2 files** | N/A (durable) | Per TTL | Cloudflare multi-region |
| **Secrets** | On change | 90 days | Encrypted backup |

#### 8.1.2 Backup Verification

```typescript
const BACKUP_VERIFICATION = {
  // Automated verification
  automated: {
    frequency: 'weekly',
    tests: [
      'backup file integrity (checksum)',
      'backup file accessibility',
      'backup file encryption',
    ],
  },
  
  // Restore testing
  restore_testing: {
    frequency: 'monthly',
    scope: 'full database restore to test environment',
    success_criteria: [
      'restore completes within RTO',
      'data integrity verified',
      'application functional tests pass',
    ],
  },
};
```

### 8.2 Recovery Objectives

#### 8.2.1 RTO/RPO by Service

| Service | RPO (Data Loss) | RTO (Downtime) | Recovery Priority |
|---------|-----------------|----------------|-------------------|
| **Authentication** | 0 (no loss)* | 15 minutes | P0 |
| **Billing** | 0 (no loss)* | 30 minutes | P0 |

> **\* RPO=0 Clarification:** "No loss" means no committed transaction loss. Session state loss during recovery is acceptable (users re-authenticate). Billing operations use idempotent keys, so replay is safe.
| **User data** | 1 hour | 1 hour | P1 |
| **Tool execution** | 4 hours | 2 hours | P1 |
| **Analytics** | 24 hours | 4 hours | P2 |
| **Admin dashboard** | 24 hours | 4 hours | P2 |

#### 8.2.2 Recovery Procedures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DISASTER RECOVERY RUNBOOK                              │
└─────────────────────────────────────────────────────────────────────────────┘

  Scenario: Complete database failure

  1. Detect (automated)
     └─▶ Alert triggers on database unreachable
     
  2. Assess (< 5 min)
     └─▶ Determine scope: single region vs global
     └─▶ Check Neon status page
     
  3. Activate failover (< 10 min)
     └─▶ If Neon-managed: wait for auto-recovery
     └─▶ If prolonged: restore from backup to new cluster
     
  4. Validate (< 15 min)
     └─▶ Run data integrity checks
     └─▶ Verify application connectivity
     
  5. Resume (< 5 min)
     └─▶ Update connection strings if needed
     └─▶ Clear caches
     └─▶ Verify user-facing functionality
     
  6. Post-incident (< 24h)
     └─▶ Root cause analysis
     └─▶ Update runbooks if needed
```

### 8.3 Business Continuity

#### 8.3.1 Degraded Mode Operations

| Scenario | Capability | Duration | Communication |
|----------|------------|----------|---------------|
| **Database read-only** | Read-only mode, no mutations | Hours | Banner + email |
| **Payment processor down** | Free tier only, no purchases | Hours | Banner |
| **File storage down** | Text tools only | Hours | Banner |
| **Complete outage** | Static status page | Hours | Status page + email |

---

## 9. Operational Requirements

### 9.1 Deployment Requirements

#### 9.1.1 Deployment Strategy

```typescript
const DEPLOYMENT_STRATEGY = {
  // Deployment approach
  approach: 'Rolling deployment with canary',
  
  // Stages
  stages: {
    canary: {
      traffic: '5%',
      duration: '15 minutes',
      auto_rollback: true,
      success_criteria: {
        error_rate: '< 1%',
        latency_p99: '< 2s',
      },
    },
    gradual: {
      steps: ['25%', '50%', '100%'],
      duration_per_step: '10 minutes',
    },
  },
  
  // Rollback
  rollback: {
    automatic: true,
    trigger: 'error_rate > 5% OR latency_p99 > 5s',
    time_to_rollback: '< 2 minutes',
  },
  
  // Deployment windows
  windows: {
    preferred: 'Tuesday-Thursday, 10:00-16:00 UTC',
    blocked: 'Friday 14:00 - Monday 10:00 UTC',
  },
};
```

#### 9.1.2 Change Management

| Change Type | Approval Required | Rollback Plan | Testing Required |
|-------------|-------------------|---------------|------------------|
| **Hotfix** | 1 engineer | Automatic | Smoke tests |
| **Minor** | 1 engineer | Automatic | Unit + integration |
| **Major** | 2 engineers | Manual + automatic | Full suite + staging |
| **Breaking** | Tech lead | Manual | Full suite + migration testing |

### 9.2 On-Call Requirements

#### 9.2.1 On-Call Structure

```typescript
const ONCALL_STRUCTURE = {
  // Rotation
  rotation: {
    primary: '1 week',
    secondary: '1 week (shadow)',
    handoff: 'Monday 10:00 UTC',
  },
  
  // Response requirements
  response: {
    p0: { acknowledge: '5 min', respond: '15 min' },
    p1: { acknowledge: '15 min', respond: '30 min' },
    p2: { acknowledge: '1 hour', respond: '4 hours' },
  },
  
  // Escalation
  escalation: {
    primary_unreachable: '10 min → secondary',
    secondary_unreachable: '10 min → tech lead',
    major_incident: 'Immediate → incident commander',
  },
  
  // Tools
  tools: [
    'PagerDuty (alerting)',
    'Slack #incidents (coordination)',
    'Runbook (procedures)',
    'Status page (communication)',
  ],
};
```

### 9.3 Documentation Requirements

| Document | Update Frequency | Owner | Location |
|----------|------------------|-------|----------|
| **Architecture diagrams** | On change | Tech lead | Confluence/Docs |
| **Runbooks** | Monthly review | On-call | GitHub/Notion |
| **API documentation** | On deploy | Auto-generated | /docs endpoint |
| **Postmortem reports** | Per incident | Incident owner | Confluence/Docs |

---

## 10. Cost & Resource Constraints

### 10.1 Infrastructure Budget

#### 10.1.1 Monthly Cost Targets

| Component | Year 1 (est.) | Year 2 (est.) | Scaling Factor |
|-----------|---------------|---------------|----------------|
| **Vercel (Next.js)** | $50-200 | $200-500 | Per user/request |
| **Neon (PostgreSQL)** | $50-100 | $100-300 | Per storage/compute |
| **Upstash (Redis)** | $20-50 | $50-150 | Per request/storage |
| **Cloudflare R2** | $10-50 | $50-200 | Per storage/egress |
| **Railway (FastAPI)** | $20-50 | $50-150 | Per compute |
| **Inngest** | $0-50 | $50-100 | Per execution |
| **Monitoring** | $0-50 | $50-100 | Per data ingested |
| **Total** | $150-550 | $550-1,500 | |

#### 10.1.2 Cost vs SLO Tradeoff Policy

> **⚠️ Early-Stage Tradeoff Clause**
> During Year 1, if cost ceilings conflict with SLO targets:
> 1. **Tier 0–1 SLOs are non-negotiable** (auth, billing, tool execution)
> 2. **Tier 2–3 SLOs may be temporarily relaxed** before Tier 0–1
> 3. **Observability sampling may be reduced** (tracing: 5% instead of 10%)
> 4. **Log retention may be shortened** (INFO: 7 days instead of 14)
>
> This avoids philosophical fights and acknowledges that $150–550/month constrains observability depth.

#### 10.1.3 Cost Optimization Rules

```typescript
const COST_OPTIMIZATION = {
  // Compute
  compute: {
    right_sizing: 'Review instance sizes quarterly',
    auto_scaling: 'Scale down during off-peak (50% at night)',
    spot_instances: 'Use for background jobs where applicable',
  },
  
  // Storage
  storage: {
    temp_files: 'Auto-delete after 24h default',
    cold_storage: 'Archive audit logs > 90 days',
    compression: 'Compress all stored files',
  },
  
  // Network
  network: {
    cdn_caching: 'Cache static assets aggressively',
    api_caching: 'Cache read-heavy endpoints at edge',
    compression: 'Enable gzip/brotli for all responses',
  },
  
  // Alerts
  alerts: {
    budget_warning: '80% of monthly budget',
    budget_critical: '100% of monthly budget',
    anomaly_detection: 'Flag 2x daily normal',
  },
};
```

### 10.2 Resource Efficiency

#### 10.2.1 Efficiency Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cost per MAU** | < $0.05 | Monthly cost / MAU |
| **Cost per tool execution** | < $0.001 | Monthly cost / executions |
| **Infra cost / revenue** | < 20% | Monthly infra / MRR |
| **Database utilization** | > 50% | Used capacity / provisioned |

#### 10.2.2 Waste Reduction

```typescript
const WASTE_REDUCTION = {
  // Identify waste
  reviews: {
    unused_resources: 'Monthly review of idle resources',
    over_provisioned: 'Quarterly right-sizing review',
    orphaned_data: 'Monthly cleanup of orphaned records',
  },
  
  // Automate cleanup
  automation: {
    temp_files: 'Auto-delete via R2 lifecycle rules',
    old_sessions: 'Auto-expire via Redis TTL',
    stale_cache: 'Auto-invalidate via TTL',
    orphaned_jobs: 'Auto-cleanup failed jobs > 7 days',
  },
};
```

---

## 11. Analytics Implementation

### 11.1 Analytics Strategy

**Approach:** Custom PostgreSQL-based analytics (no Google Analytics, no third-party trackers)

**Rationale:**
- User privacy (no data sent to external trackers)
- Full control over data and queries
- Integration with existing PostgreSQL database
- Custom business metrics not available in GA
- Cost-effective (no additional service fees)

### 11.2 Event Taxonomy

**Core Events:**

```typescript
interface AnalyticsEvent {
  id: string;                    // UUID
  userId: string | null;         // Null for anonymous
  sessionId: string;             // FingerprintJS session ID
  eventType: EventType;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  ip: string;                    // Hashed for privacy
  country: string;               // From IP geolocation
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

enum EventType {
  // User events
  USER_SIGNUP = 'user.signup',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  
  // Tool events
  TOOL_VIEW = 'tool.view',
  TOOL_EXECUTE = 'tool.execute',
  TOOL_ERROR = 'tool.error',
  
  // Billing events
  SUBSCRIPTION_STARTED = 'subscription.started',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  COINS_PURCHASED = 'coins.purchased',
  AD_WATCHED = 'ad.watched',
  
  // Engagement events
  PAGE_VIEW = 'page.view',
  SEARCH = 'search',
  SHARE = 'share',
}
```

### 11.3 Event Collection

**Client-Side Tracking:**

```typescript
// lib/analytics.ts
import { v4 as uuid } from 'uuid';

class Analytics {
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }
  
  track(eventName: string, properties?: Record<string, any>) {
    const event = {
      sessionId: this.sessionId,
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    };
    
    // Send to backend (batched, debounced)
    this.sendBatch([event]);
  }
  
  private sendBatch(events: any[]) {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
  }
}

// Usage
const analytics = new Analytics();
analytics.track('tool.execute', { toolId: 'json-formatter' });
```

**Server-Side Tracking:**

```typescript
// app/api/analytics/events/route.ts
export async function POST(req: Request) {
  const { events } = await req.json();
  const ip = req.headers.get('x-forwarded-for');
  const userAgent = req.headers.get('user-agent');
  
  // Batch insert to database
  await db.analyticsEvent.createMany({
    data: events.map(event => ({
      ...event,
      ip: hashIP(ip), // Hash IP for privacy
      userAgent,
      country: getCountryFromIP(ip),
    }))
  });
  
  return Response.json({ success: true });
}
```

### 11.4 Aggregation Jobs

**Daily Aggregation (runs at 1 AM UTC):**

```sql
-- Daily tool usage aggregation
INSERT INTO tool_usage_daily (
  date, tool_id, executions, unique_users, avg_duration_ms
)
SELECT 
  DATE(timestamp) as date,
  properties->>'toolId' as tool_id,
  COUNT(*) as executions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG((properties->>'duration')::int) as avg_duration_ms
FROM analytics_events
WHERE 
  event_name = 'tool.execute'
  AND DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(timestamp), properties->>'toolId';

-- Daily user activity aggregation
INSERT INTO user_activity_daily (
  date, active_users, new_signups, churned_users
)
SELECT 
  CURRENT_DATE - INTERVAL '1 day' as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT CASE WHEN event_name = 'user.signup' THEN user_id END) as new_signups,
  -- Churn calculation (no activity in 30 days)
  (SELECT COUNT(*) FROM users 
   WHERE last_active_at < CURRENT_DATE - INTERVAL '30 days') as churned_users
FROM analytics_events
WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day';
```

**Weekly/Monthly Aggregation:**
- Runs Sunday at 2 AM UTC (weekly)
- Runs 1st of month at 3 AM UTC (monthly)
- Aggregates from daily tables (faster than raw events)

### 11.5 Analytics Queries

**Common Queries:**

```sql
-- Top 10 tools (last 7 days)
SELECT 
  t.name,
  SUM(tud.executions) as total_executions,
  SUM(tud.unique_users) as unique_users
FROM tool_usage_daily tud
JOIN tools t ON t.id = tud.tool_id
WHERE tud.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY t.id, t.name
ORDER BY total_executions DESC
LIMIT 10;

-- User retention (cohort analysis)
SELECT 
  DATE_TRUNC('month', u.created_at) as cohort_month,
  COUNT(DISTINCT u.id) as cohort_size,
  COUNT(DISTINCT CASE WHEN uad.date >= CURRENT_DATE - INTERVAL '30 days' 
                      THEN u.id END) as retained_users,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN uad.date >= CURRENT_DATE - INTERVAL '30 days' 
                                    THEN u.id END) / COUNT(DISTINCT u.id), 2) as retention_rate
FROM users u
LEFT JOIN user_activity_daily uad ON uad.user_id = u.id
GROUP BY cohort_month
ORDER BY cohort_month DESC;

-- Conversion funnel
SELECT 
  'Step 1: Tool View' as step,
  COUNT(DISTINCT session_id) as users
FROM analytics_events
WHERE event_name = 'tool.view'
  AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Step 2: Tool Execute' as step,
  COUNT(DISTINCT session_id) as users
FROM analytics_events
WHERE event_name = 'tool.execute'
  AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Step 3: Signup' as step,
  COUNT(DISTINCT user_id) as users
FROM analytics_events
WHERE event_name = 'user.signup'
  AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days';
```

### 11.6 Admin Dashboard Integration

**Real-Time Metrics (Redis-backed):**
- Active users (last 5 minutes)
- Requests per minute
- Tool executions per minute

**Historical Metrics (PostgreSQL-backed):**
- DAU/MAU/WAU trends
- Revenue trends (MRR, ARR)
- Tool popularity rankings
- User retention cohorts
- Conversion funnels

### 11.7 Privacy Compliance

**GDPR/CCPA Compliance:**
- IP addresses hashed (SHA256)
- User can request data export (JSON)
- User can request data deletion (GDPR right to erasure)
- Anonymous events (no PII)
- No third-party trackers
- Cookie consent banner (analytics opt-out)

**Data Retention:**
- Raw events: 1 year (then deleted)
- Daily aggregates: 3 years
- Monthly aggregates: Forever (no PII)

---

## Appendix A: SLO Dashboard Specification

### A.1 Key Indicators

| Indicator | Calculation | Target | Dashboard |
|-----------|-------------|--------|-----------|
| **Availability** | (1 - error_minutes / total_minutes) × 100 | 99.5% | Main |
| **Latency P99** | 99th percentile response time | < 500ms | Main |
| **Error Rate** | errors / total_requests × 100 | < 0.5% | Main |
| **Apdex Score** | (satisfied + tolerating/2) / total | > 0.9 | Main |

### A.2 Error Budget Burn Rate

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ERROR BUDGET BURN RATE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Burn Rate = (errors in window) / (budget for window)

  Fast burn (1h window):   > 14.4x → Page immediately
  Slow burn (6h window):   > 6x    → Page within 1h
  Steady burn (24h window): > 3x   → Alert, review
  Normal burn:              < 1x   → Normal operations
```

---

## Appendix B: Capacity Planning

### B.1 Growth Projections

| Metric | Current | +6 months | +12 months | +24 months |
|--------|---------|-----------|------------|------------|
| **Users** | 0 | 5,000 | 20,000 | 100,000 |
| **Daily requests** | 0 | 50,000 | 200,000 | 1,000,000 |
| **Storage (GB)** | 0 | 50 | 200 | 1,000 |
| **Database size (GB)** | 0 | 5 | 20 | 100 |

### B.2 Scaling Checkpoints

| Threshold | Action Required |
|-----------|-----------------|
| **10,000 users** | Review database indexing, add read replicas |
| **50,000 users** | Implement database sharding strategy |
| **100,000 users** | Multi-region deployment, CDN optimization |
| **500,000 users** | Major architecture review, potential re-platforming |

---

## 11. Analytics Implementation

### 11.1 Analytics Strategy

**Approach:** Custom PostgreSQL-based analytics (no Google Analytics, no third-party trackers)

**Rationale:**
- User privacy (no data sent to external trackers)
- Full control over data and queries
- Integration with existing PostgreSQL database
- Custom business metrics not available in GA
- Cost-effective (no additional service fees)

### 11.2 Event Taxonomy

**Core Events:**

```typescript
interface AnalyticsEvent {
  id: string;                    // UUID
  userId: string | null;         // Null for anonymous
  sessionId: string;             // FingerprintJS session ID
  eventType: EventType;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  ip: string;                    // Hashed for privacy
  country: string;               // From IP geolocation
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

enum EventType {
  // User events
  USER_SIGNUP = 'user.signup',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  
  // Tool events
  TOOL_VIEW = 'tool.view',
  TOOL_EXECUTE = 'tool.execute',
  TOOL_ERROR = 'tool.error',
  
  // Billing events
  SUBSCRIPTION_STARTED = 'subscription.started',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  COINS_PURCHASED = 'coins.purchased',
  AD_WATCHED = 'ad.watched',
  
  // Engagement events
  PAGE_VIEW = 'page.view',
  SEARCH = 'search',
  SHARE = 'share',
}
```

### 11.3 Privacy Compliance

**GDPR/CCPA Compliance:**
- IP addresses hashed (SHA256)
- User can request data export (JSON)
- User can request data deletion (GDPR right to erasure)
- Anonymous events (no PII)
- No third-party trackers
- Cookie consent banner (analytics opt-out)

**Data Retention:**
- Raw events: 1 year (then deleted)
- Daily aggregates: 3 years
- Monthly aggregates: Forever (no PII)

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [10_SYSTEM_ARCHITECTURE](10_SYSTEM_ARCHITECTURE.md) | Infrastructure topology |
| [15_SECURITY_MODEL](15_SECURITY_MODEL.md) | Security requirements |
| [08_STATE_FLOW_DIAGRAMS](08_STATE_FLOW_DIAGRAMS.md) | Flow performance |
| [03_FEATURE_FLAGS](03_FEATURE_FLAGS.md) | Kill switches, degradation |

---

*This document defines measurable non-functional requirements for HSAFX WORLD. All SLOs must be tracked and reviewed monthly.*