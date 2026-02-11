# 46 — Redis Key Schema

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED

> **Purpose:**  
> Defines the complete Redis key structure, naming conventions, TTL policies, and usage patterns for caching, rate limiting, and job queue management. Ensures consistent key usage across all services and prevents key collisions between environments.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Key Naming Conventions](#2-key-naming-conventions)
3. [Environment Prefixes](#3-environment-prefixes)
4. [Rate Limiting Keys](#4-rate-limiting-keys)
5. [Job Queue Keys (BullMQ)](#5-job-queue-keys-bullmq)
6. [Caching Keys](#6-caching-keys)
7. [Session Keys](#7-session-keys)
8. [Temporary Data Keys](#8-temporary-data-keys)
9. [TTL Policies](#9-ttl-policies)
10. [Key Management](#10-key-management)
11. [Monitoring & Debugging](#11-monitoring--debugging)

---

## 1. Overview

### 1.1 Redis Usage

**Primary Uses:**
1. **Rate Limiting** - Per-user and per-IP request throttling
2. **Job Queue** - BullMQ job management for async tools
3. **Caching** - Tool results, user data, API responses
4. **Session Storage** - User session management (Better-Auth)
5. **Temporary Storage** - Job results, temporary files (24hr TTL)

**Redis Provider:** Upstash Redis (serverless, globally replicated)

### 1.2 Design Principles

**Namespace Isolation:**
- All keys MUST have environment prefix (`dev:`, `staging:`, `prod:`)
- Prevents development data bleeding into production
- Enables safe testing without affecting live data

**Predictable Structure:**
- Keys follow consistent pattern: `{env}:{category}:{scope}:{identifier}`
- Easy to search, filter, and bulk delete
- Human-readable for debugging

**TTL Strategy:**
- All keys have TTL (no eternal keys)
- Short TTL for rate limits (1-60 minutes)
- Medium TTL for caches (1-24 hours)
- Long TTL for sessions (7-30 days)

---

## 2. Key Naming Conventions

### 2.1 General Pattern

```
{environment}:{category}:{scope}:{identifier}:{optional_suffix}

Examples:
prod:ratelimit:user:user_123:tool_001
dev:cache:tool:uppercase:hash_abc123
staging:job:file-processing:job_xyz789:status
```

### 2.2 Naming Rules

**Case:**
- Use lowercase for all keys
- Use underscores for multi-word identifiers
- Use hyphens for category names

**Delimiters:**
- Primary: `:` (colon) for namespace separation
- Secondary: `_` (underscore) for word separation within identifier
- Avoid: `.` (period), `/` (slash), `\` (backslash)

**Length:**
- Keep keys under 128 characters when possible
- Use abbreviations for long tool names (e.g., `islamic_inheritance` → `isl_inh`)
- Hash long identifiers if necessary

---

## 3. Environment Prefixes

**Purpose:** Prevent key collisions between development, staging, and production environments.

### 3.1 Prefix Values

```typescript
// src/lib/redis-config.ts
export const ENV_PREFIX = {
  development: "dev:",
  staging: "staging:",
  production: "prod:",
} as const;

export function getEnvPrefix(): string {
  const env = process.env.NODE_ENV || "development";
  return ENV_PREFIX[env] || "dev:";
}
```

### 3.2 Usage

**Always prefix keys with environment:**
```typescript
const key = `${getEnvPrefix()}ratelimit:user:${userId}`;
// development: "dev:ratelimit:user:user_123"
// production: "prod:ratelimit:user:user_123"
```

**Benefits:**
- Multiple developers can share same Redis instance without conflicts
- Staging tests don't affect production data
- Easy to flush all dev data: `DEL dev:*`

---

## 4. Rate Limiting Keys

**Reference:** 2 requests/min for all user tiers (anti-bot protection as specified in 20_BILLING_SYSTEM.md).

### 4.1 Per-User Rate Limiting

**Pattern:** `{env}:ratelimit:user:{userId}:{toolId}`

**Example:**
```
prod:ratelimit:user:user_123:tool_001
prod:ratelimit:user:user_456:tool_192
```

**Implementation:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis-client";

export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"), // 2 requests/minute
  prefix: `${getEnvPrefix()}ratelimit:user:`,
});

// Usage
const userId = session.user.id;
const { success, limit, remaining, reset } = await userRateLimit.limit(userId);

if (!success) {
  throw new Error(`Rate limit exceeded. Retry after ${reset}`);
}
```

**TTL:** Automatic (managed by Upstash Ratelimit library)

---

### 4.2 Per-IP Rate Limiting (Anonymous Users)

**Pattern:** `{env}:ratelimit:ip:{ipAddress}:{toolId}`

**Example:**
```
prod:ratelimit:ip:192.168.1.1:tool_001
prod:ratelimit:ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334:tool_192
```

**Implementation:**
```typescript
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"), // Stricter for anonymous
  prefix: `${getEnvPrefix()}ratelimit:ip:`,
});

// Usage
const ip = req.headers.get("x-forwarded-for") || req.ip;
const ipHash = hashIp(ip); // Hash for privacy
const { success } = await ipRateLimit.limit(ipHash);

if (!success) {
  throw new Error("Rate limit exceeded for anonymous users");
}
```

**IP Hashing (Privacy):**
```typescript
import crypto from "crypto";

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
```

**Why Stricter for Anonymous:**
- Prevent abuse without authentication
- Encourage sign-up for higher limits
- Tie rate limit to IP prevents rotating accounts

---

### 4.3 Per-Tool Rate Limiting (Optional)

**Pattern:** `{env}:ratelimit:tool:{toolId}:{userId}`

**Use Case:** Some tools may have different rate limits (e.g., expensive computations).

**Example:**
```
prod:ratelimit:tool:video_trim:user_123
prod:ratelimit:tool:pdf_ocr:user_456
```

**Implementation:**
```typescript
export function getToolRateLimit(toolId: string, requestsPerMin: number) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requestsPerMin, "1 m"),
    prefix: `${getEnvPrefix()}ratelimit:tool:${toolId}:`,
  });
}

// Usage
const toolLimit = getToolRateLimit("video_trim", 1); // 1 request/min for video
const { success } = await toolLimit.limit(userId);
```

**Configuration (Admin Panel):**
```sql
-- Store per-tool rate limits in database
CREATE TABLE tool_rate_limits (
  tool_id VARCHAR(50) PRIMARY KEY,
  requests_per_minute INT DEFAULT 2,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4.4 Global API Rate Limiting

**Pattern:** `{env}:ratelimit:api:{userId}` (all endpoints combined)

**Use Case:** Prevent users from hammering API with mixed tool requests.

**Implementation:**
```typescript
export const globalApiLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests/min across all tools
  prefix: `${getEnvPrefix()}ratelimit:api:`,
});

// Applied in middleware
const { success } = await globalApiLimit.limit(userId);
```

---

## 5. Job Queue Keys (BullMQ)

**Purpose:** BullMQ manages async job processing for file conversions, scraping, etc.

### 5.1 Queue Names

**Pattern:** `{env}:bull:{queueName}:{jobId}`

**Queues:**
```typescript
// src/lib/queue.ts
export const QUEUE_NAMES = {
  FILE_PROCESSING: `${getEnvPrefix()}bull:file-processing`,
  SCRAPER: `${getEnvPrefix()}bull:scraper`,
  EMAIL: `${getEnvPrefix()}bull:email`, // Post-MVP
} as const;
```

**Example Keys (Managed by BullMQ):**
```
prod:bull:file-processing:1
prod:bull:file-processing:2:progress
prod:bull:file-processing:2:returnvalue
prod:bull:scraper:5
prod:bull:scraper:5:logs
```

---

### 5.2 Job Result Storage

**Pattern:** `{env}:job:{jobId}:result`

**Use Case:** Store job result URLs for 24 hours after completion.

**Example:**
```
prod:job:job_abc123:result
prod:job:job_xyz789:result
```

**Implementation:**
```typescript
// Store result after job completes
async function storeJobResult(jobId: string, resultUrl: string) {
  const key = `${getEnvPrefix()}job:${jobId}:result`;
  await redis.set(key, resultUrl, { ex: 24 * 60 * 60 }); // 24 hours
}

// Retrieve result
async function getJobResult(jobId: string): Promise<string | null> {
  const key = `${getEnvPrefix()}job:${jobId}:result`;
  return await redis.get(key);
}
```

**TTL:** 24 hours (matches R2 presigned URL expiry)

---

### 5.3 Job Progress Tracking

**Pattern:** `{env}:job:{jobId}:progress`

**Use Case:** Track real-time progress for long-running jobs.

**Example:**
```typescript
// Update progress
async function updateJobProgress(jobId: string, progress: number) {
  const key = `${getEnvPrefix()}job:${jobId}:progress`;
  await redis.set(key, progress, { ex: 60 * 60 }); // 1 hour
}

// Get progress
async function getJobProgress(jobId: string): Promise<number> {
  const key = `${getEnvPrefix()}job:${jobId}:progress`;
  const progress = await redis.get(key);
  return progress ? parseInt(progress) : 0;
}
```

**TTL:** 1 hour (jobs should complete within 1 hour or fail)

---

## 6. Caching Keys

### 6.1 Tool Result Caching

**Pattern:** `{env}:cache:tool:{toolId}:{inputHash}`

**Use Case:** Cache deterministic tool results to avoid recomputation.

**Example:**
```
prod:cache:tool:uppercase:hash_abc123
prod:cache:tool:json_formatter:hash_xyz789
```

**Implementation:**
```typescript
import crypto from "crypto";

function generateInputHash(input: any): string {
  const inputString = JSON.stringify(input);
  return crypto.createHash("sha256").update(inputString).digest("hex").slice(0, 16);
}

async function getCachedResult(toolId: string, input: any): Promise<string | null> {
  const hash = generateInputHash(input);
  const key = `${getEnvPrefix()}cache:tool:${toolId}:${hash}`;
  return await redis.get(key);
}

async function setCachedResult(toolId: string, input: any, result: string) {
  const hash = generateInputHash(input);
  const key = `${getEnvPrefix()}cache:tool:${toolId}:${hash}`;
  await redis.set(key, result, { ex: 24 * 60 * 60 }); // 24 hours
}
```

**TTL:** 24 hours (balance between cache hits and stale data)

**Cache Only Deterministic Tools:**
```typescript
// From 31_TOOLS_CLASSIFICATION_GUIDE.md
const tool = await getToolMetadata(toolId);

if (tool.deterministic) {
  // Check cache first
  const cached = await getCachedResult(toolId, input);
  if (cached) return cached;
  
  // Execute tool
  const result = await executeTool(toolId, input);
  
  // Cache result
  await setCachedResult(toolId, input, result);
  return result;
} else {
  // Non-deterministic: Always execute, never cache
  return await executeTool(toolId, input);
}
```

---

### 6.2 API Response Caching

**Pattern:** `{env}:cache:api:{endpoint}:{paramsHash}`

**Use Case:** Cache expensive API responses (e.g., tool metadata, subscription plans).

**Example:**
```
prod:cache:api:tools_metadata:hash_abc
prod:cache:api:subscription_plans:hash_xyz
```

**Implementation:**
```typescript
async function getCachedApiResponse(endpoint: string, params: any): Promise<any> {
  const hash = generateInputHash(params);
  const key = `${getEnvPrefix()}cache:api:${endpoint}:${hash}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedApiResponse(endpoint: string, params: any, data: any, ttl: number) {
  const hash = generateInputHash(params);
  const key = `${getEnvPrefix()}cache:api:${endpoint}:${hash}`;
  await redis.set(key, JSON.stringify(data), { ex: ttl });
}
```

**TTL:** Variable (1 hour for tool metadata, 1 day for plans)

---

### 6.3 User Data Caching

**Pattern:** `{env}:cache:user:{userId}:{dataType}`

**Use Case:** Cache frequently accessed user data (plan limits, permissions, theme).

**Example:**
```
prod:cache:user:user_123:plan_limits
prod:cache:user:user_123:permissions
prod:cache:user:user_456:theme
```

**Implementation:**
```typescript
async function getCachedUserData(userId: string, dataType: string): Promise<any> {
  const key = `${getEnvPrefix()}cache:user:${userId}:${dataType}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedUserData(userId: string, dataType: string, data: any) {
  const key = `${getEnvPrefix()}cache:user:${userId}:${dataType}`;
  await redis.set(key, JSON.stringify(data), { ex: 60 * 60 }); // 1 hour
}

// Invalidate on user update
async function invalidateUserCache(userId: string) {
  const pattern = `${getEnvPrefix()}cache:user:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**TTL:** 1 hour (balance between freshness and DB load)

---

## 7. Session Keys

**Purpose:** Store user sessions (managed by Better-Auth).

### 7.1 Session Pattern

**Pattern:** `{env}:session:{sessionToken}`

**Example:**
```
prod:session:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Implementation (Better-Auth handles this):**
```typescript
// In Better-Auth config
export const auth = betterAuth({
  database: db,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  redis: {
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
    prefix: `${getEnvPrefix()}session:`,
  },
});
```

**TTL:** 7 days (configurable per plan)

---

## 8. Temporary Data Keys

### 8.1 Anonymous User Tracking

**Pattern:** `{env}:temp:anon:{ipHash}:{dataType}`

**Use Case:** Track anonymous user activity (BA count, last tool used).

**Example:**
```
prod:temp:anon:hash_abc123:ba_count
prod:temp:anon:hash_xyz789:last_tool
```

**Implementation:**
```typescript
async function incrementAnonBA(ipHash: string): Promise<number> {
  const key = `${getEnvPrefix()}temp:anon:${ipHash}:ba_count`;
  const count = await redis.incr(key);
  
  // Set TTL on first increment
  if (count === 1) {
    await redis.expire(key, 24 * 60 * 60); // 24 hours
  }
  
  return count;
}

// Check if ad should be shown (every 5 BA)
async function shouldShowAd(ipHash: string): Promise<boolean> {
  const count = await getAnonBACount(ipHash);
  return count > 0 && count % 5 === 0;
}
```

**TTL:** 24 hours (reset daily)

---

### 8.2 Ad View Tracking

**Pattern:** `{env}:temp:ad:{userId}:view:{timestamp}`

**Use Case:** Track ad views to grant coins (Guest users only).

**Example:**
```
prod:temp:ad:user_123:view:1640995200
```

**Implementation:**
```typescript
async function recordAdView(userId: string): Promise<void> {
  const timestamp = Date.now();
  const key = `${getEnvPrefix()}temp:ad:${userId}:view:${timestamp}`;
  await redis.set(key, "1", { ex: 60 * 60 }); // 1 hour
}

async function grantAdReward(userId: string): Promise<void> {
  // Verify ad was viewed (check key exists)
  const pattern = `${getEnvPrefix()}temp:ad:${userId}:view:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    // Grant 10 coins
    await db.insert(user_coins).values({
      user_id: userId,
      change_amount: 10,
      reason: "AD_VIEW",
    });
    
    // Delete ad view keys
    await redis.del(...keys);
  }
}
```

**TTL:** 1 hour (prevent stale rewards)

---

## 9. TTL Policies

### 9.1 TTL by Category

| Category | TTL | Reason |
|----------|-----|--------|
| **Rate Limits** | Auto (Upstash) | Sliding window managed by library |
| **Job Results** | 24 hours | Matches R2 presigned URL expiry |
| **Tool Caches** | 24 hours | Balance between cache hits and staleness |
| **API Caches** | 1-24 hours | Varies by endpoint (plans: 24h, metadata: 1h) |
| **User Caches** | 1 hour | Prevent stale permissions/limits |
| **Sessions** | 7 days | Standard session duration |
| **Anonymous Tracking** | 24 hours | Daily reset for BA counting |
| **Ad View Tracking** | 1 hour | Prevent reward abuse |

---

### 9.2 TTL Implementation Pattern

**Always Set TTL:**
```typescript
// ❌ BAD: No TTL (key lives forever)
await redis.set(key, value);

// ✅ GOOD: TTL in seconds
await redis.set(key, value, { ex: 3600 }); // 1 hour

// ✅ GOOD: TTL in milliseconds
await redis.set(key, value, { px: 3600000 }); // 1 hour
```

**Update TTL on Access:**
```typescript
// Reset TTL when accessing cached data
async function getCachedData(key: string, ttl: number): Promise<string | null> {
  const value = await redis.get(key);
  
  if (value) {
    await redis.expire(key, ttl); // Reset TTL
  }
  
  return value;
}
```

---

## 10. Key Management

### 10.1 Bulk Operations

**List Keys by Pattern:**
```typescript
// Get all rate limit keys for a user
async function getUserRateLimitKeys(userId: string): Promise<string[]> {
  const pattern = `${getEnvPrefix()}ratelimit:user:${userId}:*`;
  return await redis.keys(pattern);
}

// Delete all caches for a tool
async function clearToolCache(toolId: string): Promise<void> {
  const pattern = `${getEnvPrefix()}cache:tool:${toolId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Flush Environment:**
```typescript
// Delete all development keys (safe to run in dev)
async function flushDevKeys(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Can only flush dev keys in development");
  }
  
  const keys = await redis.keys("dev:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

### 10.2 Admin Panel Integration

**Key Browser:**
```typescript
// src/app/admin/redis/page.tsx
export default async function RedisManagementPage() {
  const categories = [
    { name: "Rate Limits", pattern: `${getEnvPrefix()}ratelimit:*` },
    { name: "Job Results", pattern: `${getEnvPrefix()}job:*:result` },
    { name: "Tool Caches", pattern: `${getEnvPrefix()}cache:tool:*` },
    { name: "User Caches", pattern: `${getEnvPrefix()}cache:user:*` },
    { name: "Sessions", pattern: `${getEnvPrefix()}session:*` },
  ];
  
  // For each category, show key count and allow bulk delete
  return <RedisKeyBrowser categories={categories} />;
}
```

---

## 11. Monitoring & Debugging

### 11.1 Key Count by Category

**Implementation:**
```typescript
async function getKeyStats(): Promise<Record<string, number>> {
  const categories = [
    "ratelimit:user",
    "ratelimit:ip",
    "job",
    "cache:tool",
    "cache:user",
    "session",
  ];
  
  const stats: Record<string, number> = {};
  
  for (const category of categories) {
    const pattern = `${getEnvPrefix()}${category}:*`;
    const keys = await redis.keys(pattern);
    stats[category] = keys.length;
  }
  
  return stats;
}
```

**Example Output:**
```json
{
  "ratelimit:user": 1543,
  "ratelimit:ip": 892,
  "job": 45,
  "cache:tool": 3201,
  "cache:user": 567,
  "session": 234
}
```

---

### 11.2 Debug Logging

**Pattern:**
```typescript
// src/lib/redis-logger.ts
export async function logRedisOperation(
  operation: string,
  key: string,
  success: boolean,
  duration: number
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Redis] ${operation} ${key} - ${success ? "✅" : "❌"} (${duration}ms)`);
  }
  
  // Store in Redis for debugging (short TTL)
  const logKey = `${getEnvPrefix()}logs:redis:${Date.now()}`;
  await redis.set(logKey, JSON.stringify({ operation, key, success, duration }), { ex: 300 });
}
```

**Usage:**
```typescript
const start = Date.now();
try {
  await redis.set(key, value);
  await logRedisOperation("SET", key, true, Date.now() - start);
} catch (err) {
  await logRedisOperation("SET", key, false, Date.now() - start);
}
```

---

## 12. Key Schema Summary Table

| Category | Pattern | TTL | Example |
|----------|---------|-----|---------|
| **User Rate Limit** | `{env}:ratelimit:user:{userId}:{toolId}` | Auto | `prod:ratelimit:user:user_123:tool_001` |
| **IP Rate Limit** | `{env}:ratelimit:ip:{ipHash}:{toolId}` | Auto | `prod:ratelimit:ip:hash_abc:tool_001` |
| **Tool Rate Limit** | `{env}:ratelimit:tool:{toolId}:{userId}` | Auto | `prod:ratelimit:tool:video_trim:user_123` |
| **Global API Limit** | `{env}:ratelimit:api:{userId}` | Auto | `prod:ratelimit:api:user_123` |
| **Job Queue** | `{env}:bull:{queueName}:{jobId}` | BullMQ | `prod:bull:file-processing:1` |
| **Job Result** | `{env}:job:{jobId}:result` | 24h | `prod:job:job_abc123:result` |
| **Job Progress** | `{env}:job:{jobId}:progress` | 1h | `prod:job:job_abc123:progress` |
| **Tool Cache** | `{env}:cache:tool:{toolId}:{inputHash}` | 24h | `prod:cache:tool:uppercase:hash_abc` |
| **API Cache** | `{env}:cache:api:{endpoint}:{paramsHash}` | 1-24h | `prod:cache:api:tools_metadata:hash_abc` |
| **User Cache** | `{env}:cache:user:{userId}:{dataType}` | 1h | `prod:cache:user:user_123:plan_limits` |
| **Session** | `{env}:session:{sessionToken}` | 7d | `prod:session:eyJhbGciOi...` |
| **Anon Tracking** | `{env}:temp:anon:{ipHash}:{dataType}` | 24h | `prod:temp:anon:hash_abc:ba_count` |
| **Ad View** | `{env}:temp:ad:{userId}:view:{timestamp}` | 1h | `prod:temp:ad:user_123:view:1640995200` |

---

## 13. Notes for AI Agent

**When Implementing Redis Operations:**
- **ALWAYS** include environment prefix using `getEnvPrefix()`
- **ALWAYS** set TTL for every key (no eternal keys)
- Use consistent naming patterns from this document
- Log Redis operations in development for debugging
- Handle Redis failures gracefully (fallback to DB or skip cache)
- Test key patterns with `redis.keys()` before deploying
- Verify TTL with `redis.ttl(key)` in tests

**Testing Pattern:**
```typescript
// Test key creation and TTL
test("Rate limit key has correct TTL", async () => {
  const userId = "user_test";
  const key = `${getEnvPrefix()}ratelimit:user:${userId}`;
  
  await redis.set(key, "1", { ex: 60 });
  
  const ttl = await redis.ttl(key);
  expect(ttl).toBeGreaterThan(55);
  expect(ttl).toBeLessThanOrEqual(60);
});
```

**Environment Isolation:**
```bash
# Development
NODE_ENV=development  # Uses "dev:" prefix

# Staging
NODE_ENV=staging      # Uses "staging:" prefix

# Production
NODE_ENV=production   # Uses "prod:" prefix
```

---

**Total Pages:** 11  
**Status:** ✅ Production-Ready Schema
