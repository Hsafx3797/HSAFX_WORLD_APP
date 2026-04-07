# 16 — Non-Functional Requirements

> Compacted. Verbose diagrams/code removed. Only targets, rules, and design decisions kept.

---

## 1. SLO Tiers

| Tier | Description                          | Availability | Monthly Downtime Budget |
| ---- | ------------------------------------ | ------------ | ----------------------- |
| 0    | Core (auth, billing)                 | 99.9%        | 43 min                  |
| 1    | Primary (tool execution)             | 99.5%        | 3.6 hours               |
| 2    | Secondary (analytics, admin)         | 99.0%        | 7.2 hours               |
| 3    | Best-effort (notifications, exports) | 95.0%        | 36 hours                |

---

## 2. Performance Targets

### API Latency (P95)

| Endpoint                  | P95   | Hard Limit |
| ------------------------- | ----- | ---------- |
| Session validation        | 40ms  | 150ms      |
| Tool metadata fetch       | 80ms  | 300ms      |
| Coin balance check        | 60ms  | 150ms      |
| Subscription status       | 70ms  | 200ms      |
| Auth                      | 250ms | 1s         |
| API tool execution (sync) | 500ms | 5s         |

### Background Jobs

| Job                | Start Delay | Processing P95 | Max Duration |
| ------------------ | ----------- | -------------- | ------------ |
| Media processing   | <5s         | 30s            | 5 min        |
| PDF operations     | <3s         | 15s            | 2 min        |
| AI/ML inference    | <10s        | 60s            | 10 min       |
| Webhook processing | <1s         | 5s             | 30s          |

### Throughput

| Service      | Sustained RPS | Peak RPS |
| ------------ | ------------- | -------- |
| Next.js Edge | 1,000         | 5,000    |
| Next.js API  | 500           | 2,000    |
| FastAPI      | 200           | 500      |
| DB reads     | 2,000         | 5,000    |
| Redis        | 10,000        | 30,000   |

### Growth Targets

| Year | Registered | MAU | Peak Concurrent | Executions/day |
| ---- | ---------- | --- | --------------- | -------------- |
| 1    | 10K        | 3K  | 300             | 10K            |
| 2    | 50K        | 15K | 1.5K            | 50K            |
| 3    | 200K       | 60K | 6K              | 200K           |

---

## 3. Resource Limits

| Resource        | Free                           | Pro  | Advance |
| --------------- | ------------------------------ | ---- | ------- |
| Max file size   | 10MB                           | 50MB | 100MB   |
| Rate (req/min)  | 60                             | 300  | 1,000   |
| Tool exec/min   | 10                             | 50   | 200     |
| Request body    | 1MB (JSON), 50MB (file upload) |
| Request timeout | 30s                            |
| WASM memory     | 256MB                          |
| WASM timeout    | 30s                            |
| Max batch files | 20                             |
| Max output      | 200MB                          |

---

## 4. Incident Response

| Severity | Definition                     | MTTR Target | Response           |
| -------- | ------------------------------ | ----------- | ------------------ |
| P0       | Complete outage / data loss    | <30 min     | Immediate page     |
| P1       | Major feature unavailable      | <2 hours    | Page within 15 min |
| P2       | Degraded performance           | <8 hours    | Notify on-call     |
| P3       | Minor issue, workaround exists | <48 hours   | Queue for review   |

---

## 5. Graceful Degradation

| Failing Component | Impact              | Degraded Behavior                                   |
| ----------------- | ------------------- | --------------------------------------------------- |
| FastAPI           | No media processing | WASM text tools still work                          |
| Redis             | Limited auth        | Allow existing sessions, disable new logins, banner |
| Neon (read)       | No data access      | Serve cached data, read-only mode                   |
| Neon (write)      | No mutations        | Queue writes, "read-only" banner                    |
| R2                | No file storage     | Text-only tools work                                |
| Polar/Stripe      | No purchases        | Existing subscriptions continue                     |

**Redis fallback rule:** PostgreSQL is LAST RESORT only (>30min outage). DB is not a session store under load.

**Inngest/async job fallback:** Persist to `job_fallback_queue` in PostgreSQL, background poller replays when recovered. NEVER execute heavy jobs synchronously.

---

## 6. Observability (Actual State)

| Component           | Status       | Tool                                       |
| ------------------- | ------------ | ------------------------------------------ |
| Structured logging  | ✅ Built     | `pino` via `@hsafx/shared/logger`          |
| Error tracking      | ✅ Installed | `@sentry/nextjs` (web + admin)             |
| Metrics             | ❌ Not built | Planned: RED method (Rate/Errors/Duration) |
| Alerting            | ❌ Not built | Planned: PagerDuty + Slack                 |
| Distributed tracing | ❌ Not built | Planned: W3C Trace Context, 10% sampling   |
| Custom analytics    | ❌ Not built | Planned: PostgreSQL-based, no GA           |

### Logging Levels

| Level | Retention         | Use Case             |
| ----- | ----------------- | -------------------- |
| ERROR | 90 days           | Exceptions, failures |
| WARN  | 30 days           | Anomalies            |
| INFO  | 14 days           | Business events      |
| DEBUG | 3 days (dev only) | Diagnostic           |

### Alert Definitions (Planned)

- **P0:** auth errors >50% (2min), payment errors >10% (5min), DB unreachable (1min)
- **P1:** error rate >5% (5min), P99 latency >2s (5min), queue depth >1000 (10min)
- **P2:** error rate >1% (15min), slow queries P99 >1s (15min), cert <14 days

---

## 7. Data Management

### Retention

| Data             | Retention                     | Deletion                 |
| ---------------- | ----------------------------- | ------------------------ |
| User accounts    | Until deletion + 30 day purge | Soft → hard delete       |
| Processed files  | 24h                           | R2 lifecycle auto-delete |
| Audit logs       | 2 years                       | Archive to cold storage  |
| Session data     | 30 days                       | Redis TTL                |
| Payment records  | 7 years (legal)               | Retained                 |
| Analytics events | 1 year                        | Auto-archive             |

### GDPR Right to Erasure

- **Delete:** profile, email, sessions, API keys, uploaded files
- **Anonymize:** usage stats, tool execution logs, analytics
- **Retain:** payment records (7 years), compliance audit logs
- Processing time: max 30 days

---

## 8. Disaster Recovery

### RTO/RPO

| Service           | RPO (Data Loss)             | RTO (Downtime) |
| ----------------- | --------------------------- | -------------- |
| Auth / Billing    | 0 (no committed txn loss)\* | 15-30 min      |
| User data         | 1 hour                      | 1 hour         |
| Tool execution    | 4 hours                     | 2 hours        |
| Analytics / Admin | 24 hours                    | 4 hours        |

\*Session state loss during recovery is acceptable.

### Backup Schedule

| Resource          | Frequency          | Retention |
| ----------------- | ------------------ | --------- |
| PostgreSQL (full) | Daily              | 30 days   |
| PostgreSQL (WAL)  | Continuous         | 7 days    |
| Redis snapshot    | Daily              | 7 days    |
| R2 files          | Durable by default | Per TTL   |

---

## 9. Deployment Rules

- **Strategy:** Rolling with canary (5% traffic, 15 min, auto-rollback on error >5% or P99 >5s)
- **Rollback:** <2 minutes automatic
- **Windows:** Preferred Tue-Thu 10-16 UTC. Blocked Fri 14:00 - Mon 10:00 UTC
- **Change types:** Hotfix (1 engineer), Minor (1 + unit/integration), Major (2 + full suite + staging), Breaking (tech lead + migration testing)

---

## 10. Cost Targets

### Year 1 Monthly Budget: $150-550

| Component         | Year 1  | Year 2   |
| ----------------- | ------- | -------- |
| Vercel            | $50-200 | $200-500 |
| Neon (PostgreSQL) | $50-100 | $100-300 |
| Upstash (Redis)   | $20-50  | $50-150  |
| Cloudflare R2     | $10-50  | $50-200  |
| Railway (FastAPI) | $20-50  | $50-150  |

### Efficiency Targets

| Metric                  | Target  |
| ----------------------- | ------- |
| Cost per MAU            | <$0.05  |
| Cost per tool execution | <$0.001 |
| Infra cost / revenue    | <20%    |

### Cost vs SLO Tradeoff (Year 1)

- Tier 0-1 SLOs are **non-negotiable** (auth, billing, tools)
- Tier 2-3 SLOs may be temporarily relaxed
- Observability sampling may be reduced (5% instead of 10%)
- Log retention may be shortened

---

## 11. Partitioning Strategy (Deferred)

Partitioning deferred until:

- `audit_logs` exceeds 10 GB, OR
- `coin_transactions` write rate exceeds 1,000/day

When triggered: partition by month (RANGE on `created_at`) for `coin_transactions` and `audit_logs`.
