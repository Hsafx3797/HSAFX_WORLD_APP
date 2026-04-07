# 46 — Redis Key Schema

> Complete Redis key structure for caching, rate limiting, sessions, and job management.

## Provider

Upstash Redis (serverless, globally replicated)

## Key Pattern

```
{environment}:{category}:{scope}:{identifier}:{optional_suffix}
```

- Environments: `dev:`, `staging:`, `prod:`
- Lowercase, colons for namespace, underscores for word separation
- All keys MUST have TTL (no eternal keys)

## Key Categories

### Rate Limiting (Upstash Ratelimit)

| Pattern                                  | Purpose                                 | TTL  |
| ---------------------------------------- | --------------------------------------- | ---- |
| `{env}:ratelimit:user:{userId}`          | Per-user API limit                      | Auto |
| `{env}:ratelimit:ip:{ipHash}`            | Anonymous IP limit                      | Auto |
| `{env}:ratelimit:tool:{toolId}:{userId}` | Per-tool limit (expensive ops)          | Auto |
| `{env}:ratelimit:api:{userId}`           | Global API limit (60 req/min all tools) | Auto |

### Job Queue (BullMQ — NOT yet installed)

| Pattern                          | Purpose                      | TTL  |
| -------------------------------- | ---------------------------- | ---- |
| `{env}:bull:{queueName}:{jobId}` | Job data (managed by BullMQ) | Auto |
| `{env}:job:{jobId}:result`       | Job result URL               | 24h  |
| `{env}:job:{jobId}:progress`     | Real-time progress tracking  | 1h   |

Queues: `file-processing`, `scraper`, `email` (post-MVP)

### Caching

| Pattern                                   | Purpose                           | TTL   |
| ----------------------------------------- | --------------------------------- | ----- |
| `{env}:cache:tool:{toolId}:{inputHash}`   | Deterministic tool result cache   | 24h   |
| `{env}:cache:api:{endpoint}:{paramsHash}` | API response cache                | 1-24h |
| `{env}:cache:user:{userId}:{dataType}`    | User plan/permissions/theme cache | 1h    |

**Rule:** Only cache deterministic tools. Non-deterministic tools always execute fresh.

### Sessions (Better-Auth managed)

| Pattern                        | Purpose           | TTL    |
| ------------------------------ | ----------------- | ------ |
| `{env}:session:{sessionToken}` | User session data | 7 days |

### Temporary Data

| Pattern                                   | Purpose                                | TTL |
| ----------------------------------------- | -------------------------------------- | --- |
| `{env}:temp:anon:{ipHash}:ba_count`       | Anonymous BA (business action) counter | 24h |
| `{env}:temp:ad:{userId}:view:{timestamp}` | Ad view tracking for coin rewards      | 1h  |

## TTL Summary

| Category      | TTL    | Reason                          |
| ------------- | ------ | ------------------------------- |
| Rate Limits   | Auto   | Sliding window by library       |
| Job Results   | 24h    | Matches R2 presigned URL expiry |
| Tool Caches   | 24h    | Balance cache hits vs staleness |
| API Caches    | 1-24h  | Varies (plans=24h, metadata=1h) |
| User Caches   | 1h     | Prevent stale permissions       |
| Sessions      | 7 days | Standard session duration       |
| Anon Tracking | 24h    | Daily reset                     |
| Ad Views      | 1h     | Prevent reward abuse            |

## Key Rules

1. All keys get environment prefix via `getEnvPrefix()`
2. Hash IP addresses for privacy (SHA-256, first 16 chars)
3. Hash tool inputs for cache keys (SHA-256, first 16 chars)
4. Invalidate entire user cache on user update: `DEL {env}:cache:user:{userId}:*`
5. Flush dev data: `DEL dev:*`
6. Admin can clear tool cache: `DEL {env}:cache:tool:{toolId}:*`
