# Backend Ownership Matrix

## 1. Architecture Decision

### ✅ Next.js-Only Database Writes

**Decision**
All PostgreSQL database **reads and writes are owned exclusively by Next.js**.
FastAPI is a **stateless compute service** and **must never write to the database**.

This decision is **non-negotiable** and treated as a **system invariant**.

---

## 2. Architectural Philosophy

### Core Principle

> **State belongs to Next.js. Compute belongs to FastAPI.**

* **Next.js** is the authoritative backend:
  * Authentication
  * Authorization
  * Billing & coins
  * Usage metering
  * Idempotency
  * Audit logs

* **FastAPI** is execution-only:
  * Tool execution
  * Media / AI / OCR / FFmpeg workloads
  * No persistence
  * No business logic
  * No financial authority

This model applies equally to:

* **B2C (Web UI)**
* **B2B (Public Tools API)**

Both are just **entry points** into the same trusted backend.

---

## 3. Service Ownership Matrix

### Database Authority: **Next.js ONLY**

| Service Domain        | Owns Endpoints | DB Write Permission | Tables                                                   |
| --------------------- | -------------- | ------------------- | -------------------------------------------------------- |
| **Authentication**    | Next.js        | ✅ Yes               | users, sessions, oauth_accounts                          |
| **User Management**   | Next.js        | ✅ Yes               | users, user_profiles                                     |
| **Permissions**       | Next.js        | ✅ Yes               | permissions, role_permissions, user_permission_overrides |
| **Subscriptions**     | Next.js        | ✅ Yes               | subscriptions, subscription_plans, plan_limits           |
| **Billing & Coins**   | Next.js        | ✅ Yes               | payments, invoices, coin_transactions, user_coin_wallets |
| **Tools Metadata**    | Next.js        | ✅ Yes               | tools, tool_coin_costs, tool_class_policy                |
| **Usage Tracking**    | Next.js        | ✅ Yes               | usage_counters, billable_action_logs                     |
| **Tool Execution**    | FastAPI        | ❌ No                | None                                                     |
| **Job Orchestration** | FastAPI        | ❌ No                | None                                                     |
| **File Storage**      | FastAPI        | ❌ No                | None (Blob storage only)                                 |
| **Rate Limiting**     | Both           | N/A                 | Redis / Upstash                                          |

---

## 4. FastAPI Constraints (Hard Rules)

FastAPI **MUST**:
* ❌ NOT have `DATABASE_URL`
* ❌ NOT include ORM / Prisma / SQL clients
* ❌ NOT validate user JWTs
* ❌ NOT deduct coins
* ❌ NOT write usage or billing logs
* ❌ NOT own long-lived state

FastAPI **MAY**:
* ✅ Execute tools
* ✅ Perform CPU/GPU-heavy workloads
* ✅ Upload outputs to blob storage
* ✅ Return execution metrics
* ✅ Use Redis for rate limiting
* ✅ Call **internal Next.js APIs** for metadata

---

## 5. Environment Configuration

### FastAPI `.env`

```env
# Database access is strictly forbidden
# DATABASE_URL must NOT exist

NEXT_JS_API_BASE_URL=http://localhost:3000/api
NEXT_JS_API_KEY=<service-to-service shared secret>

REDIS_URL=<rate limiting only>
BLOB_STORAGE_URL=<file uploads>
```

> CI/CD must fail if `DATABASE_URL` is detected in FastAPI.

---

## 6. Execution Flow (Canonical)

### Tool Execution (Web or API)

1. Client (Web or B2B API) calls **Next.js**
2. Next.js:

   * Validates auth
   * Checks rate limits
   * Checks coin balance
   * Creates idempotency key
   * Creates pending job
3. Next.js calls **FastAPI** (service key auth)
4. FastAPI:

   * Executes tool (stateless)
   * Stores output in blob storage
   * Returns metrics + result URL
5. Next.js:

   * Logs usage
   * Deducts coins
   * Finalizes job
   * Returns result to client

**All state transitions happen in Next.js.**

---

## 7. Implementation Responsibilities

### 7.1 Next.js Responsibilities

* JWT issuance & validation
* Billing correctness
* Coin ledger updates
* Usage metering
* Idempotency enforcement
* Database migrations
* Audit trail

Example (simplified):

```ts
// apps/web/app/api/tools/execute/route.ts
export async function POST(req: Request) {
  const user = await validateSession(req);
  await checkRateLimits(user.id);

  const jobId = await createPendingJob(user.id);

  const result = await callFastAPI(jobId);

  await logBillableAction(jobId, result.ba_charged);
  await deductCoins(user.id, result.coins_charged, jobId);

  return Response.json({ result: result.result_url });
}
```

---

### 7.2 FastAPI Responsibilities

```python
@app.post("/execute")
async def execute_tool(request: ExecuteRequest):
    assert_valid_service_key(request)

    result = await run_tool(request.payload)

    result_url = await blob.upload(result.output, request.jobId)

    return {
        "result_url": result_url,
        "success_count": result.success_count,
        "execution_time_ms": result.execution_time
    }
```

* No database
* No billing
* No auth decisions

---

## 8. Job Status Storage

### 8.1 Storage Strategy

**Job Lifecycle:**

1. **Creation (Next.js):**
   - Write to PostgreSQL: `job_id`, `user_id`, `tool_id`, `status='pending'`, `created_at`
   - Create Redis entry: `job:{jobId}` → `{ status: 'pending', progress: 0 }` (TTL: 72 hours)

2. **Execution (FastAPI):**
   - Read job metadata from Next.js internal API (NOT PostgreSQL)
   - Update Redis: `job:{jobId}` → `{ status: 'processing', progress: 50 }`
   - On completion: `job:{jobId}` → `{ status: 'completed', result_url: '...' }`

3. **Finalization (Next.js):**
   - Poll Redis for status updates (or webhook from FastAPI)
   - When `status='completed'` → Write to PostgreSQL:
     - Update `jobs.status = 'completed'`
     - Create `billable_action_logs` entry
     - Create `coin_transactions` entry
   - Redis entry expires after 72 hours (auto-cleanup)

### 8.2 Storage Responsibilities

| Storage     | Owner   | Purpose                      | TTL         | Authority |
|-------------|---------|------------------------------|-------------|-----------|
| PostgreSQL  | Next.js | Permanent job record         | Permanent   | Source of truth for billing |
| Redis       | FastAPI | Real-time status updates     | 72 hours    | Ephemeral progress tracking |
| R2          | FastAPI | Temporary output files       | 24 hours    | User download |

**Key Rules:**
- ❌ FastAPI NEVER writes to PostgreSQL
- ✅ FastAPI writes to Redis: `job:{jobId}` (status updates only)
- ✅ Next.js reads Redis for real-time status
- ✅ Next.js finalizes job in PostgreSQL after completion

### 8.3 Redis Schema

```typescript
// Redis key: job:{jobId}
interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;  // 0-100
  result_url?: string;  // R2 signed URL (if completed)
  error?: string;  // Error message (if failed)
  updated_at: number;  // Unix timestamp
}

// Example:
await redis.hset(`job:${jobId}`, {
  status: 'processing',
  progress: 75,
  updated_at: Date.now()
});
```

### 8.4 PostgreSQL Schema (Jobs Table)

```sql
-- Managed by Next.js only
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  tool_id UUID NOT NULL REFERENCES tools(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result_url TEXT,
  ba_charged DECIMAL(10,2),
  coins_charged INTEGER
);
```

**Finalization Flow:**
```typescript
// Next.js polls Redis or receives FastAPI webhook
const jobStatus = await redis.hgetall(`job:${jobId}`);

if (jobStatus.status === 'completed') {
  await prisma.jobs.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      completed_at: new Date(),
      result_url: jobStatus.result_url,
      ba_charged: calculateBA(tool),
      coins_charged: calculateCoins(tool, plan)
    }
  });

  // Create billing entries
  await createBillableActionLog(jobId);
  await deductCoins(userId, coinsCharged, jobId);
}
```

---

## 9. API Key Authentication (B2B)

### 9.1 API Key Structure

**Format:** `hsafx_live_<random_52_chars>` (total 64 characters)

**Example:** `hsafx_live_a3f8d92e1c7b4f6a8e2d9c1b5a7f3e6d4c8b2a1f9e7d3c5b8a`

**Storage:**
- **PostgreSQL:** `api_keys` table (Next.js authority)
- **SHA256 hash:** Only hash stored in database
- **Key prefix:** First 12 chars stored for user reference (`hsafx_live_a3f`)

### 9.2 API Keys Table Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256(full_key)
  key_prefix VARCHAR(12) NOT NULL,        -- For display: "hsafx_live_a3f"
  name VARCHAR(100),                      -- User-assigned name
  scopes TEXT[] NOT NULL DEFAULT '{}',   -- ['tools:execute', 'billing:read']
  rate_limit_tier VARCHAR(20) NOT NULL,  -- 'basic', 'pro', 'enterprise'
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                -- NULL = never expires
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 9.3 Scopes System

**Available Scopes:**

| Scope            | Permissions                                      | Use Case                 |
|------------------|--------------------------------------------------|--------------------------|
| `tools:read`     | List tools, read metadata                        | Monitoring, integration  |
| `tools:execute`  | Execute tools, consume coins                     | Primary API usage        |
| `billing:read`   | View usage, coin balance, subscription status    | Dashboard, reporting     |
| `billing:write`  | Purchase coins, change subscription              | Self-service portal      |
| `admin:*`        | Full access (only for super admin keys)          | Internal automation      |

**Default:** `['tools:execute', 'billing:read']`

**Scope Validation (Next.js middleware):**
```typescript
export async function verifyAPIKey(req: Request) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey || !apiKey.startsWith('hsafx_')) {
    throw new Error('Invalid API key format');
  }

  const keyHash = sha256(apiKey);
  const record = await prisma.apiKeys.findUnique({
    where: { key_hash: keyHash },
    include: { user: true }
  });

  if (!record || !record.is_active) {
    throw new Error('Invalid or inactive API key');
  }

  return { user: record.user, scopes: record.scopes };
}

export async function requireScope(scopes: string[], required: string) {
  if (!scopes.includes(required) && !scopes.includes('admin:*')) {
    throw new Error(`Missing required scope: ${required}`);
  }
}
```

### 9.4 Rate Limit Tiers

| Tier         | Requests/Hour | Requests/Day | Concurrent Jobs | Plan Requirement |
|--------------|---------------|--------------|-----------------|------------------|
| **Basic**    | 100           | 1,000        | 2               | Free             |
| **Pro**      | 1,000         | 10,000       | 10              | Pro              |
| **Business** | 5,000         | 50,000       | 50              | Advance          |
| **Enterprise** | Custom      | Custom       | Custom          | Custom contract  |

**Enforcement:**
```typescript
// Redis-based rate limiting (Upstash Ratelimit)
import { Ratelimit } from '@upstash/ratelimit';

// ✅ ADMIN-CONFIGURABLE: Rate limits stored in api_keys table
// Admins can adjust rate_limit_per_hour via admin panel
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(
    apiKey.rate_limit_per_hour, // Dynamic value from database
    '1h'
  )
});

const { success, limit, remaining } = await ratelimit.limit(apiKey.id);

// Example database values (managed via admin panel):
// Free tier:    100 requests/hour
// Pro tier:     1000 requests/hour
// Enterprise:   10000 requests/hour
// Custom tiers: Any value set by admin
if (!success) {
  return Response.json(
    { error: 'Rate limit exceeded' },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': '3600'
      }
    }
  );
}
```

### 9.5 API Key Management (Admin Panel)

**Admin Controls:**
- Create API key (generate random 52-char string)
- Assign scopes
- Set rate limit tier
- Set expiration date
- Revoke key (set `is_active = false`)
- View usage logs per key

**User Self-Service:**
- View own API keys (prefix only: `hsafx_live_a3f...`)
- Create new keys (max 5 per user)
- Delete keys
- Rotate keys (create new, delete old)

---

## 10. File Upload Flow (Uploadthing → R2)

### 10.1 Security Flow

**All file uploads MUST go through virus scanning before processing.**

```
User selects file in browser
  ↓
Upload to Uploadthing (automatic virus scan via ClamAV)
  ↓
Uploadthing webhook → Next.js
  ├─ Signature verification (HMAC-SHA256)
  ├─ Status check: 'clean' or 'infected'
  │
  ├─ If infected:
  │   ├─ Delete from Uploadthing
  │   ├─ Notify user: "File contains malware and was rejected"
  │   └─ Log incident (user_id, file_hash, timestamp)
  │
  ↓ If clean:
Create job in PostgreSQL
  ├─ status: 'pending'
  ├─ uploadthing_file_key: 'abc123'
  └─ Write to Redis: job:{jobId} → { status: 'pending' }
  ↓
Next.js calls FastAPI (internal API)
  ├─ Pass: jobId, uploadthing_file_url (signed)
  ↓
FastAPI downloads file from Uploadthing
  ├─ Temporary local storage (RAM or /tmp)
  ├─ Process file (convert, transform, etc.)
  ├─ Generate output file
  ↓
FastAPI uploads output to R2
  ├─ Bucket: hsafx-world
  ├─ Key: outputs/{jobId}/{filename}
  ├─ TTL: 24 hours (auto-delete via lifecycle policy)
  ↓
FastAPI updates Redis
  ├─ job:{jobId} → { status: 'completed', result_url: 'r2://...' }
  ↓
FastAPI deletes Uploadthing file
  ├─ Clean up source file (no persistent storage)
  ↓
Next.js polls Redis → Detects completion
  ├─ Generate signed R2 URL (1 hour expiry)
  ├─ Finalize job in PostgreSQL
  ├─ Deduct coins
  ↓
Return signed R2 URL to user
  ├─ User downloads directly from R2
  ├─ R2 auto-deletes after 24 hours
```

### 10.2 Storage Responsibilities

| Storage      | Purpose                     | Retention    | Owner   | Cost    |
|--------------|-----------------------------|--------------|---------|---------|
| **Uploadthing** | Virus scanning + validation | 1 hour       | Security boundary | ~$10/mo |
| **R2**       | Temporary output files      | 24 hours     | FastAPI | $0-5/mo |
| **Local (/tmp)** | Processing workspace   | During job   | FastAPI | $0      |

**Security Rules:**
- ❌ NEVER process files without virus scan
- ❌ NEVER store user files permanently
- ✅ ALL uploads → Uploadthing first (mandatory)
- ✅ R2 auto-deletes after 24 hours (lifecycle policy)
- ✅ Uploadthing deletes after processing

### 10.3 Uploadthing Configuration

```env
# .env (Next.js)
UPLOADTHING_TOKEN='eyJhcGlL...'

# Webhook URL (must be HTTPS in production)
# https://hsafx.world/api/webhooks/uploadthing
```

**Webhook Handler (Next.js):**
```typescript
// app/api/webhooks/uploadthing/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('uploadthing-signature');
  const body = await req.text();

  // Verify signature
  const isValid = verifyUploadthingSignature(body, signature);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === 'upload.completed') {
    if (event.file.status === 'infected') {
      // Virus detected
      await deleteUploadthingFile(event.file.key);
      await notifyUser(event.metadata.userId, 'File rejected: malware detected');
    } else {
      // Clean file → Create job
      await createJob({
        userId: event.metadata.userId,
        toolId: event.metadata.toolId,
        uploadthingFileKey: event.file.key,
        uploadthingFileUrl: event.file.url
      });
    }
  }

  return Response.json({ received: true });
}
```

### 10.4 R2 Configuration

```env
# .env (FastAPI)
CLOUDFLARE_ACCOUNT_ID='2da6401fe...'
CLOUDFLARE_ACCESS_KEY_ID='xxx'
CLOUDFLARE_SECRET_ACCESS_KEY='xxx'
CLOUDFLARE_BUCKET_NAME='hsafx-world'
```

**Lifecycle Policy (24hr auto-delete):**
```json
{
  "rules": [
    {
      "id": "delete-after-24h",
      "status": "Enabled",
      "filter": {
        "prefix": "outputs/"
      },
      "expiration": {
        "days": 1
      }
    }
  ]
}
```

---

## 11. Redis Usage Matrix

### 11.1 Single Instance Strategy

**Provider:** Upstash Redis  
**Environment Variables:**
```env
UPSTASH_REDIS_REST_URL='https://obliging-rhino-21071.upstash.io'
UPSTASH_REDIS_REST_TOKEN='AVJPAAIncD...'
```

**Cost:** ~$10/month (500MB storage, 10K requests/day free tier)

### 11.2 Use Cases

| Use Case            | Writer  | Reader            | TTL             | Mandatory | Key Pattern           |
|---------------------|---------|-------------------|-----------------|-----------|------------------------|
| **Rate limiting**   | Next.js | Next.js + FastAPI | 1 minute        | ✅ Yes     | `ratelimit:{id}`       |
| **Session storage** | Next.js | Next.js           | 7 days          | ✅ Yes     | `session:{token}`      |
| **Job status**      | FastAPI | Next.js + FastAPI | 72 hours        | ✅ Yes     | `job:{jobId}`          |
| **Job queue**       | Next.js | FastAPI           | Until processed | ✅ Yes     | `queue:jobs`           |
| **Theme cache**     | Next.js | Next.js           | 7 days          | Optional  | `theme:{userId}`       |
| **API key cache**   | Next.js | Next.js           | 1 hour          | Optional  | `apikey:{hash}`        |

### 11.3 Access Patterns

**Next.js:**
- Full read/write access
- Session management
- Rate limiting (Upstash Ratelimit SDK)
- Job queue producer
- Theme caching

**FastAPI:**
- Limited read/write
- Job status updates (`job:{jobId}`)
- Job queue consumer
- Rate limit checks (read-only)

### 11.4 Configuration Removed

**Deprecated (removed from .env):**
```env
# ❌ REMOVED - Single Redis instance only
# REDIS_URL_CLI='redis://default:...'
```

**Reason:** Consolidate to Upstash for simplicity and serverless compatibility.

---

## 12. Theme Caching Strategy

### 12.1 Cache Structure

**Theme data cached in Redis:**
```typescript
interface CachedTheme {
  preset: string;           // 'red', 'blue', 'default'
  customizations: object;   // User overrides (if any)
  cssVariables: string;     // Compiled CSS custom properties
  generatedAt: number;      // Unix timestamp
}

// Redis key: theme:{userId}
// TTL: 7 days (604800 seconds)
```

### 12.2 Cache Flow

**Cache Miss (First Load):**
```typescript
// Next.js
const cachedTheme = await redis.get(`theme:${userId}`);

if (!cachedTheme) {
  // Fetch from PostgreSQL
  const userPrefs = await prisma.userPreferences.findUnique({
    where: { user_id: userId }
  });

  // Derive theme from THEME_SYSTEM.md rules
  const theme = deriveTheme(userPrefs.theme_preset, userPrefs.customizations);

  // Cache for 7 days
  await redis.setex(`theme:${userId}`, 604800, JSON.stringify(theme));

  return theme;
}

return JSON.parse(cachedTheme);
```

**Cache Invalidation:**
- User changes theme preset → Delete `theme:{userId}`
- User customizes theme → Delete `theme:{userId}`
- Auto-expires after 7 days (TTL)

### 12.3 Performance Benefits

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| Theme load | 50-100ms (DB) | 2-5ms (Redis) | **20x faster** |
| CSS generation | Every request | Once per 7 days | **Massive savings** |

---

## 13. Internal APIs (Next.js)

FastAPI accesses metadata **only** via internal endpoints.

Example:

```ts
// /api/internal/tools/[id]
verifyServiceKey(req);

return prisma.tools.findUnique({
  where: { id },
  include: { tool_class_policy: true }
});
```

These routes:

* Are **not public**
* Require service key
* Are rate limited
* Are logged

---

## 9. File Structure (Final)

```
backend/
├── api/                     # Next.js (authoritative backend)
│   ├── auth/
│   ├── users/
│   ├── permissions/
│   ├── subscriptions/
│   ├── billing/
│   ├── tools/
│   └── internal/            # Service-only APIs
│
├── fastapi/                 # Stateless compute layer
│   ├── services/
│   │   ├── text/
│   │   ├── image/
│   │   ├── video/
│   │   └── document/
│   └── utils/
│       └── nextjs_client.py
```

---

## 10. Migration Guidance (If Needed)

If any FastAPI service currently writes to DB:

1. Remove `DATABASE_URL`
2. Delete ORM / DB code
3. Move writes to Next.js
4. Return metrics instead of persisting
5. Enforce service-key auth
6. Add CI guardrails

---

## 11. Security Model (Final)

### Strengths

* Single JWT issuer
* Single billing authority
* Single audit trail
* No cross-service money writes
* No privilege escalation paths

### Mitigations

* Rotate service keys
* HTTPS everywhere
* Rate-limit internal APIs
* Log all service-to-service calls

---

## 12. Final Declaration

> **FastAPI is compute. Next.js is authority.**
>
> This rule applies to **Web (B2C)** and **Tools API (B2B)** equally.
>
> Any violation of this boundary is considered an architectural bug.
