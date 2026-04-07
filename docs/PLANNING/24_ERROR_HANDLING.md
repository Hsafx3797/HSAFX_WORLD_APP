# 24 — Error Handling Specification (Compacted)

> Error taxonomy, internal codes, retry logic, alerting, and response format.

---

## Error Response Format

```typescript
// Success
{ "success": true, "data": { ... } }

// Error (4xx/5xx)
{
  "success": false,
  "error": {
    "code": "E001",           // Internal code (see table below)
    "message": "...",         // User-facing message
    "details": { ... },       // Optional context
    "requestId": "req_abc",   // For debugging
    "retryAfter": 60          // Only for 429
  }
}

// Validation error (422) adds: "validationErrors": [{ "field", "message", "rule" }]
```

**✅ Built** — `ErrorResponse` schema in `backend/fastapi/src/schemas/__init__.py` and `apps/web/src/lib/openapi-spec.ts`. Error codes actively used in API routes + tests.

---

## HTTP Status Codes

| Code            | When                                              | Retry?                          |
| --------------- | ------------------------------------------------- | ------------------------------- |
| 200/201/202/204 | Success / Created / Async job started / Delete OK | —                               |
| 400             | Invalid input format                              | No                              |
| 401             | Not logged in / expired session                   | No (redirect)                   |
| 402             | Insufficient coins / no subscription              | No (purchase/upgrade)           |
| 403             | Feature not in plan / access denied               | No (upgrade)                    |
| 404             | Resource not found                                | No                              |
| 409             | Duplicate / concurrent update                     | No (refresh)                    |
| 413             | File too large                                    | No                              |
| 415             | Unsupported file type                             | No                              |
| 422             | Validation failed                                 | No (fix input)                  |
| 429             | Rate limit exceeded                               | Yes (after Retry-After)         |
| 500             | Unexpected server error                           | Yes (auto, exponential backoff) |
| 502             | External service failed                           | Yes (auto, exponential)         |
| 503             | Maintenance / overload                            | Yes (linear backoff)            |
| 504             | External service timeout                          | Yes (auto, exponential)         |

---

## Internal Error Codes

**Format:** `[Category][Number]` — A=Auth, B=Billing, E=Input/Entity, F=File, R=RateLimit, S=Server, I=Integration

### Auth (A001-A005)

| Code | HTTP | Description          |
| ---- | ---- | -------------------- |
| A001 | 401  | No session/token     |
| A002 | 401  | Token expired        |
| A003 | 401  | Invalid token format |
| A004 | 403  | Account suspended    |
| A005 | 403  | Account deleted      |

### Billing (B001-B103)

| Code | HTTP | Description             |
| ---- | ---- | ----------------------- |
| B001 | 402  | Insufficient coins      |
| B002 | 402  | No active subscription  |
| B003 | 402  | Subscription expired    |
| B004 | 402  | Payment method failed   |
| B005 | 500  | Coin transaction failed |
| B100 | 403  | Feature not in plan     |
| B101 | 403  | Usage limit exceeded    |
| B102 | 403  | Anonymous user limit    |
| B103 | 429  | Daily limit exceeded    |

### Input/Entity (E001-E106)

| Code      | HTTP | Description                                                               |
| --------- | ---- | ------------------------------------------------------------------------- |
| E001-E010 | 400  | Invalid format (JSON, YAML, CSV, XML, SQL, regex, cron, date, URL, email) |
| E100      | 404  | Resource not found                                                        |
| E101      | 409  | Resource conflict                                                         |
| E102      | 422  | Validation failed                                                         |
| E103      | 422  | Missing required field                                                    |
| E104-E106 | 422  | Field too long / too short / out of range                                 |

### File (F001-F007)

| Code      | HTTP | Description                       |
| --------- | ---- | --------------------------------- |
| F001      | 413  | File too large                    |
| F002      | 415  | Unsupported file type             |
| F003      | 403  | Virus detected                    |
| F004      | 422  | File corrupt                      |
| F005/F006 | 500  | Upload/processing failed          |
| F007      | 404  | File not found (may have expired) |

### Rate Limit (R001-R005)

| Code      | HTTP | Description                                    |
| --------- | ---- | ---------------------------------------------- |
| R001-R004 | 429  | IP / user / tool / API key rate limit exceeded |
| R005      | 429  | Concurrent job limit                           |

### Server (S001-S006)

| Code | HTTP | Alert?  | Description              |
| ---- | ---- | ------- | ------------------------ |
| S001 | 500  | Yes     | Unexpected error         |
| S002 | 500  | Yes     | Database error           |
| S003 | 500  | Yes     | Redis error              |
| S004 | 502  | >10/min | External service error   |
| S005 | 504  | >20/min | External service timeout |
| S006 | 503  | >50/min | Service overloaded       |

### Integration (I001-I005)

| Code | HTTP | Description           |
| ---- | ---- | --------------------- |
| I001 | 502  | Stripe API error      |
| I002 | 502  | Polar API error       |
| I003 | 502  | Uploadthing error     |
| I004 | 502  | R2 storage error      |
| I005 | 502  | Redis (Upstash) error |

---

## Retry Logic

- **5xx errors:** Exponential backoff: `delay = initialDelay * 2^attempt + jitter(0,100)ms`. Max 3-5 retries.
- **429 errors:** Respect `Retry-After` header. Max 2 retries.
- **4xx errors:** Never retry (fix input or upgrade).
- **Payments/coins:** Never auto-retry — use idempotency keys (`X-Idempotency-Key` header, cached in Redis 24h).

## Alert Thresholds

| Condition                      | Level    | Throttle     |
| ------------------------------ | -------- | ------------ |
| 500 errors > 10/min            | Critical | 1 per 5 min  |
| 502/504 > 20/min               | High     | 1 per 10 min |
| DB/Redis connection lost       | Critical | Immediate    |
| Payment webhook failures > 5   | Critical | 1 per 5 min  |
| Virus detected in upload       | Medium   | 1 per 30 min |
| API key compromise suspected   | Critical | Immediate    |
| Global rate limit spike (DDoS) | High     | 1 per 5 min  |

**⚠️ Alerting implementation:** ❌ NOT fully built — no PagerDuty/Slack integration. Errors logged via pino + Sentry.

## User Messaging

| Error Type       | Tone                      | Display                      |
| ---------------- | ------------------------- | ---------------------------- |
| 4xx (user)       | Helpful, actionable       | Inline field errors + toast  |
| 429 (rate limit) | Informative + upgrade CTA | Toast with countdown         |
| 401 (auth)       | Neutral                   | Toast → redirect to login    |
| 402 (payment)    | Transactional             | Modal with coin purchase     |
| 403 (plan)       | Upgrade path              | Modal with plan comparison   |
| 5xx (server)     | Apologetic                | Full-screen "try again" page |

**i18n:** MVP = English only. Post-MVP: en/ur/ar.
