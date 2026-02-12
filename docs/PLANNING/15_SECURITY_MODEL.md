# 15 — Security Model

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — Security Model v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `10_SYSTEM_ARCHITECTURE`, `14_API_CONTRACTS`, and `21_BILLING_LOGIC`.

---

## Table of Contents

1. [Security Principles](#1-security-principles)
2. [Authentication](#2-authentication)
3. [Authorization](#3-authorization)
4. [API Security](#4-api-security)
5. [Input Validation](#5-input-validation)
6. [Data Protection](#6-data-protection)
7. [Secrets Management](#7-secrets-management)
8. [Impersonation Security](#8-impersonation-security)
9. [Abuse Prevention](#9-abuse-prevention)
10. [Incident Response](#10-incident-response)

---

## 1. Security Principles

### 1.1 Security Invariants

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Never trust the client** | All validation server-side; CASL is UI-only |
| 2 | **Defense in depth** | Multiple layers; no single point of failure |
| 3 | **Least privilege** | Minimum permissions by default |
| 4 | **Fail secure** | Deny access on error; never fail open |
| 5 | **Audit everything sensitive** | All admin actions, auth events, billing ops logged |
| 6 | **Secrets never in code** | Environment variables only; rotatable |
| 7 | **Zero PII in logs** | Structured logging with PII redaction |
| 8 | **Session integrity** | Server-side sessions; tokens are opaque references |

### 1.2 Security Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: EDGE (Vercel/Cloudflare)                                           │
│ • DDoS protection                                                           │
│ • WAF rules                                                                 │
│ • TLS termination (TLS 1.3 only)                                            │
│ • Geographic blocking (if needed)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: RATE LIMITING (Upstash Redis)                                      │
│ • IP-based limits (anonymous)                                               │
│ • User-based limits (authenticated)                                         │
│ • Endpoint-specific limits                                                  │
│ • Sliding window algorithm                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: AUTHENTICATION (Better-Auth)                                       │
│ • Session validation                                                        │
│ • API key validation (opaque bearer tokens, hash lookup)                    │
│ • OAuth provider verification                                               │
│ • Impersonation context check                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: AUTHORIZATION (Plan + RBAC)                                        │
│ • Plan-based feature gates                                                  │
│ • Admin role verification                                                   │
│ • Resource ownership check                                                  │
│ • Usage limit enforcement                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 5: INPUT VALIDATION (Zod)                                             │
│ • Schema validation                                                         │
│ • Type coercion                                                             │
│ • Sanitization                                                              │
│ • Size limits                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 6: DATA ACCESS (Drizzle + Row-Level)                                  │
│ • Parameterized queries (no SQL injection)                                  │
│ • Row-level filtering by user_id                                            │
│ • Soft-delete enforcement                                                   │
│ • Audit trail insertion                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 Authentication Methods

| Method | Use Case | Provider | Token Type |
|--------|----------|----------|------------|
| Email + Password | Primary | Better-Auth | Session cookie |
| OAuth (Google) | Social login | Better-Auth | Session cookie |
| OAuth (GitHub) | Social login | Better-Auth | Session cookie |
| OAuth (Facebook) | Social login | Better-Auth | Session cookie |
| API Key | REST API access | Custom | Opaque bearer token |
| Service Token | Inter-service | Static secret → HMAC | Signed request |

### 2.2 Session Management

```typescript
// Session configuration (Better-Auth)
const sessionConfig = {
  // Session stored server-side in Redis
  storage: 'redis',
  
  // Cookie settings
  cookie: {
    name: '__hsafx_session',
    httpOnly: true,        // No JS access
    secure: true,          // HTTPS only
    sameSite: 'lax',       // Primary CSRF protection
    maxAge: 60 * 60 * 24 * 7,  // 7 days
  },
  
  // CSRF Protection: SameSite=Lax provides primary protection.
  // State-changing endpoints additionally validate Origin/Referer headers.
  // tRPC mutations include automatic CSRF token validation via framework.
  
  // Sliding expiration
  rolling: true,
  
  // Absolute maximum lifetime
  absoluteTimeout: 60 * 60 * 24 * 30,  // 30 days
};
```

### 2.3 Session Data Structure

```typescript
interface SessionData {
  userId: string;
  email: string;
  plan: 'guest' | 'free' | 'pro' | 'advance';
  
  // Admin context (if applicable)
  adminRole?: AdminRole;
  adminPermissions?: string[];
  
  // Impersonation context (if active)
  impersonation?: {
    originalAdminId: string;
    targetUserId: string;
    startedAt: Date;
    expiresAt: Date;          // Max 1 hour
    reason: string;
    allowedActions: string[]; // Scoped permissions
  };
  
  // Security metadata (advisory signals only)
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress: string;          // For anomaly detection
  userAgent: string;
}

// INVARIANT: IP and User-Agent Tolerance
// IP and User-Agent are ADVISORY SIGNALS ONLY and do NOT invalidate sessions.
// - Mobile users frequently change IPs (cell towers, WiFi handoff)
// - VPN users may have rotating IPs
// - Browser updates change User-Agent strings
// These fields are used for:
// - Anomaly detection (impossible travel, device fingerprint change)
// - Step-up authentication triggers
// - Audit trail enrichment
// They are NEVER used for hard session invalidation.
```

### 2.4 API Key Authentication

```typescript
// API keys are opaque secrets, NOT JWTs
// Format: hsafx_<environment>_<random_32_bytes_base64>
// Example: hsafx_prod_a1b2c3d4e5f6g7h8i9j0...

interface ApiKeyValidation {
  // 1. Extract from Authorization header
  // Authorization: Bearer hsafx_prod_xxx
  
  // 2. Hash the key (we store hashes, not plaintext)
  keyHash: sha256(apiKey);
  
  // 3. Lookup in DB
  // SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL
  
  // 4. Check expiration
  // WHERE expires_at IS NULL OR expires_at > NOW()
  
  // 5. Check rate limits (per-key limits)
  // Redis: api_key:{keyId}:requests
  
  // 6. Return associated user context
}
```

### 2.5 Password Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Breached check | HaveIBeenPwned API (k-anonymity) |
| Hashing | Argon2id (memory: 64MB, iterations: 3) |
| Rate limit | 5 attempts per 15 minutes per IP |

---

## 3. Authorization

### 3.1 Two Authorization Systems

| System | Scope | Enforcement | Storage |
|--------|-------|-------------|---------|
| **Plan-Based** | User features | Server-side middleware | Derived from subscription |
| **Admin RBAC** | Admin panel | Server-side middleware | `admin_roles` + `admin_permissions` |

> **Invariant:** CASL on frontend is for **UI hints only**. Backend MUST re-verify all permissions.

### 3.2 Plan-Based Access Control

```typescript
// Middleware: checkPlanAccess
async function checkPlanAccess(
  userId: string,
  requiredFeature: string
): Promise<boolean> {
  // 1. Get effective plan (derived from subscription)
  const plan = await getEffectivePlan(userId);
  
  // 2. Check feature matrix (query database)
  const hasAccess = PLAN_FEATURES[plan][requiredFeature] ?? false;
  
  // 3. ✅ ADMIN-CONFIGURABLE: Check usage limits from database
  if (hasAccess && USAGE_LIMITED_FEATURES.includes(requiredFeature)) {
    const usage = await getCurrentUsage(userId, requiredFeature);
    
    // Query plan_limits table (managed via admin panel)
    const limitRecord = await db.query.plan_limits.findFirst({
      where: and(
        eq(plan_limits.plan_id, user.subscription.plan_id),
        eq(plan_limits.resource_key, requiredFeature)
      )
    });
    
    // Check if unlimited or within limit
    if (limitRecord && !limitRecord.is_unlimited) {
      const limit = limitRecord.max_value_bigint;
      if (usage >= limit && limit !== -1) {
        return false;
      }
    }
  }
  
  return hasAccess;
}
```

### 3.3 Admin RBAC

```typescript
// Admin role hierarchy (lower can't modify higher)
const ROLE_HIERARCHY = {
  super_admin: 100,
  admin: 80,
  billing_admin: 60,
  support_lead: 50,
  support_agent: 40,
  content_manager: 30,
  viewer: 10,
};

// Permission check
async function checkAdminPermission(
  adminId: string,
  requiredPermission: string,
  targetResource?: { type: string; id: string }
): Promise<boolean> {
  // 1. Get admin's role and permissions
  const admin = await getAdminWithPermissions(adminId);
  if (!admin) return false;
  
  // 2. Super admin bypasses all checks
  if (admin.role === 'super_admin') return true;
  
  // 3. Check explicit permission
  if (!admin.permissions.includes(requiredPermission)) {
    return false;
  }
  
  // 4. Resource-level checks (e.g., can't edit higher-role admins)
  if (targetResource?.type === 'admin') {
    const targetAdmin = await getAdmin(targetResource.id);
    if (ROLE_HIERARCHY[targetAdmin.role] >= ROLE_HIERARCHY[admin.role]) {
      return false;
    }
  }
  
  return true;
}
```

### 3.4 Resource Ownership

```typescript
// All user-owned resources include user_id
// Every query MUST filter by user_id

// ❌ WRONG - No ownership check
const file = await db.query.files.findFirst({
  where: eq(files.id, fileId)
});

// ✅ CORRECT - Always filter by owner
const file = await db.query.files.findFirst({
  where: and(
    eq(files.id, fileId),
    eq(files.userId, currentUserId)
  )
});
```

---

## 4. API Security

### 4.1 Rate Limiting Tiers

| Tier | Scope | Limit | Window |
|------|-------|-------|--------|
| Anonymous | IP | 100 req | 1 minute |
| Free | User | 300 req | 1 minute |
| Pro | User | 1,000 req | 1 minute |
| Advance | User | 5,000 req | 1 minute |
| API Key | Key | Per-key config | 1 minute |
| Auth endpoints | IP | 10 req | 15 minutes |
| Webhooks | Source IP | 1,000 req | 1 minute |

### 4.2 Rate Limit Implementation

```typescript
// Sliding window rate limiter (Upstash)
async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Atomic operation
  const result = await redis.multi()
    .zremrangebyscore(key, 0, windowStart)  // Remove old entries
    .zadd(key, now, `${now}:${crypto.randomUUID()}`)  // Add current
    .zcard(key)  // Count in window
    .pexpire(key, windowMs)  // Set expiry
    .exec();
  
  const count = result[2] as number;
  const allowed = count <= limit;
  
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(now + windowMs),
  };
}

// ⚠️ OPERATIONAL NOTE: Sliding window with UUID per request can cause
// Redis memory pressure at high traffic. If memory becomes a concern:
// - Switch high-traffic endpoints to token bucket / fixed window counters
// - Reduce window granularity for anonymous tier
// - Implement key expiration monitoring
```

### 4.3 CORS Configuration

```typescript
const corsConfig = {
  origin: [
    'https://hsafx.world',
    'https://www.hsafx.world',
    // No localhost in production
    ...(process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000'] 
      : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400,  // 24 hours preflight cache
};
```

### 4.4 Security Headers

```typescript
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS protection
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  // ⚠️ WARNING: 'unsafe-eval' is required due to Next.js dev tooling / dynamic imports.
  // Must be removed or restricted in hardened production builds if feasible.
  // Do NOT copy this CSP blindly to admin/internal apps without review.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires - see warning above
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.polar.sh https://api.stripe.com",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### 4.5 Webhook Security

| Check | Implementation |
|-------|----------------|
| Signature verification | HMAC-SHA256 with provider secret |
| Timestamp validation | Reject if > 5 minutes old |
| Idempotency | Store event ID, unique index |
| Source IP allowlist | Optional for Stripe/Polar known ranges |
| Replay attack prevention | One-time event ID consumption |

```typescript
async function verifyWebhook(
  provider: 'polar' | 'stripe',
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  // 1. Timestamp freshness
  const eventTime = parseInt(timestamp) * 1000;
  if (Date.now() - eventTime > 5 * 60 * 1000) {
    throw new WebhookError('Timestamp too old');
  }
  
  // 2. Signature verification
  const secret = provider === 'polar' 
    ? env.POLAR_WEBHOOK_SECRET 
    : env.STRIPE_WEBHOOK_SECRET;
  
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )) {
    throw new WebhookError('Invalid signature');
  }
  
  return true;
}
```

---

## 5. Input Validation

### 5.1 Validation Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| HTTP | Zod | Request body/query/params |
| tRPC | Zod | Procedure inputs |
| Database | Drizzle | Type safety + constraints |
| Files | Custom | Size, type, content |

### 5.2 Common Validation Patterns

```typescript
// String sanitization
const sanitizedString = z.string()
  .trim()
  .min(1)
  .max(1000)
  .transform(s => s.replace(/[<>]/g, ''));  // Basic XSS

// Email validation
const email = z.string()
  .email()
  .toLowerCase()
  .max(254);

// UUID validation
const uuid = z.string().uuid();

// Pagination
const pagination = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// File upload
const fileUpload = z.object({
  name: z.string().max(255).regex(/^[a-zA-Z0-9._-]+$/),
  size: z.number().max(50 * 1024 * 1024),  // 50MB
  mimeType: z.enum(['image/png', 'image/jpeg', 'application/pdf']),
});
```

### 5.3 SQL Injection Prevention

```typescript
// ❌ NEVER - String interpolation
const user = await db.execute(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ ALWAYS - Parameterized queries (Drizzle handles this)
const user = await db.query.users.findFirst({
  where: eq(users.email, email)
});

// ✅ For raw SQL - Use sql template tag
const result = await db.execute(
  sql`SELECT * FROM users WHERE email = ${email}`
);
```

### 5.4 File Upload Security

```typescript
async function validateFileUpload(file: File): Promise<void> {
  // 1. Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large');
  }
  
  // 2. MIME type check (don't trust Content-Type header)
  const buffer = await file.slice(0, 8).arrayBuffer();
  const magic = new Uint8Array(buffer);
  const detectedType = detectMimeType(magic);
  
  if (!ALLOWED_MIME_TYPES.includes(detectedType)) {
    throw new ValidationError('File type not allowed');
  }
  
  // 3. Extension check
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError('File extension not allowed');
  }
  
  // 4. Filename sanitization
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
  
  // 5. Virus scan (conditional)
  // RULE: Virus scanning is MANDATORY when:
  // - File retention > 24 hours
  // - File is shareable/public
  // - File is executable or archive type
  if (requiresVirusScan(file)) {
    await virusScanner.scan(file);
  }
}
```

---

## 6. Data Protection

### 6.1 Data Classification

| Classification | Examples | Protection |
|----------------|----------|------------|
| **Public** | Tool names, categories | None required |
| **Internal** | Usage stats, tool configs | Access control |
| **Confidential** | User emails, file metadata | Encryption at rest |
| **Restricted** | Passwords, payment tokens | Hashed/tokenized, audit logged |

### 6.2 Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Database | Neon automatic encryption | TLS 1.3 |
| Redis | Upstash automatic encryption | TLS 1.3 |
| Files (R2) | AES-256 automatic | TLS 1.3 |
| Passwords | Argon2id hash | N/A |
| API keys | SHA-256 hash | TLS 1.3 |

**OAuth Token Storage Decision:**

> **⚠️ Design Decision: OAuth Tokens Stored Plaintext (Encrypted at Rest by Neon)**  
>
> OAuth `access_token` and `refresh_token` from providers (Google, GitHub, Facebook) are stored **as plaintext in the database** but protected by:
> 1. **Neon's automatic encryption at rest** (AES-256)
> 2. **TLS 1.3 in transit** (database connections)
> 3. **Database access controls** (service credentials only)
>
> **Why Not Application-Level Encryption?**
> - OAuth tokens are **short-lived** (typically 1-2 hours for access tokens)
> - Refresh tokens can be **revoked** by the provider at any time
> - Application-level encryption adds **key management complexity** (where to store encryption keys?)
> - If an attacker has database access, they likely have environment variable access too (where encryption keys would be stored)
> - **Provider-level revocation** is the primary security mechanism (users can revoke app access from Google/GitHub/Facebook settings)
>
> **Security Measures:**
> - Monitor for unusual OAuth token usage patterns
> - Implement token rotation on security events
> - Log all OAuth token access attempts
> - Support user-initiated revocation of all OAuth connections
> - Regularly audit OAuth scopes to minimize permission surface area
>
> **Future Enhancement (if needed):**  
> If regulatory requirements mandate application-level encryption:
> 1. Use `@paralleldrive/cuid2` for deterministic key derivation
> 2. Store encryption key in separate secret management (AWS Secrets Manager, Vault)
> 3. Add `encrypted` flag to `accounts` table to track which tokens are encrypted
> 4. Implement transparent encryption/decryption layer in ORM

### 6.3 PII Handling

```typescript
// Logging sanitizer - remove PII before logging
function sanitizeForLogging(data: unknown): unknown {
  const piiFields = ['email', 'password', 'apiKey', 'token', 'ip', 'userAgent'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  for (const field of piiFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Usage
logger.info('User action', sanitizeForLogging({ userId, email, action }));
// Logs: { userId: "123", email: "[REDACTED]", action: "login" }
```

### 6.4 Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| User accounts | Until deletion request | Soft delete + 30 day purge |
| Processed files | 24 hours | Automatic R2 lifecycle |
| Audit logs | 2 years | Automatic archival |
| Session data | 30 days max | Redis TTL |
| Payment records | 7 years (legal) | N/A (required) |

---

## 7. Secrets Management

### 7.1 Secret Categories

| Category | Examples | Storage | Rotation |
|----------|----------|---------|----------|
| **Provider Keys** | Stripe, Polar API keys | Vercel env vars | Quarterly |
| **Database** | Connection strings | Vercel env vars | On breach |
| **Internal** | JWT signing keys | Vercel env vars | Monthly |
| **Webhook** | Signing secrets | Vercel env vars | On breach |

### 7.2 Environment Variables

```bash
# Required secrets (production)
DATABASE_URL=               # Neon connection string
REDIS_URL=                  # Upstash connection string
BETTER_AUTH_SECRET=         # Session signing (32+ bytes)
STRIPE_SECRET_KEY=          # Stripe API key
STRIPE_WEBHOOK_SECRET=      # Stripe webhook signing
POLAR_ACCESS_TOKEN=         # Polar API key
POLAR_WEBHOOK_SECRET=       # Polar webhook signing
R2_ACCESS_KEY_ID=           # Cloudflare R2
R2_SECRET_ACCESS_KEY=       # Cloudflare R2
INTERNAL_SERVICE_SECRET=    # Inter-service auth
```

### 7.3 JWT Secret Management & Rotation

#### Development Environment

```env
JWT_SECRET=dev-secret-only-never-in-production
```

**Rules:**
- ❌ Never use in production
- ❌ Never commit to git
- ✅ Store in `.env.local` (gitignored)

#### Production Environment

```bash
# Generate secure secret
openssl rand -base64 64
# Output: 88-character random base64 string
```

```env
JWT_SECRET=prd_<88-character-random-base64-string>
```

#### Multi-Environment Strategy

| Environment | Format  | Rotation      | Storage                       |
|-------------|---------|---------------|-------------------------------|
| Development | `dev_*` | Never         | `.env.local` (gitignored)     |
| Staging     | `stg_*` | Every 90 days | Vercel Environment Variables  |
| Production  | `prd_*` | Every 90 days | Vercel Environment Variables  |

#### JWT Secret Rotation Procedure

**Zero-Downtime Rotation Steps:**

1. **Generate new secret**
   ```bash
   openssl rand -base64 64
   ```

2. **Add to Vercel as `JWT_SECRET_NEW`**
   - Go to Vercel Project Settings → Environment Variables
   - Add `JWT_SECRET_NEW` with new value
   - Deploy

3. **Deploy with dual-key validation** (accept both old + new)
   ```typescript
   async function verifyJWT(token: string) {
     const secrets = [
       env.JWT_SECRET,
       env.JWT_SECRET_NEW,  // During rotation
     ].filter(Boolean);
     
     for (const secret of secrets) {
       try {
         const payload = await verify(token, secret);
         return payload;
       } catch (err) {
         continue; // Try next secret
       }
     }
     throw new Error('Invalid token');
   }
   ```

4. **Monitor for 24 hours**
   - Check error rates in Vercel logs
   - Verify no auth failures

5. **Complete rotation**
   - Remove old `JWT_SECRET` from Vercel
   - Rename `JWT_SECRET_NEW` → `JWT_SECRET`
   - Deploy final version
   - Remove dual-key validation code

6. **Document rotation date**
   - Track in team documentation
   - Set calendar reminder for next rotation (90 days)

#### Security Rules

- ❌ Never commit secrets to git
- ❌ Never use same secret across environments
- ❌ Never share secrets via Slack/email
- ✅ Store in Vercel Environment Variables only
- ✅ Rotate every 90 days minimum
- ✅ Use `openssl rand -base64 64` for generation
- ✅ Prefix with environment (`dev_`, `stg_`, `prd_`)

### 7.4 Internal Service Secret Rotation

```typescript
// Zero-downtime secret rotation for inter-service auth
// 1. Add new secret alongside old
// 2. Update code to accept both
// 3. Rotate all clients to new secret
// 4. Remove old secret

async function verifyInternalService(signature: string, payload: string) {
  const secrets = [
    env.INTERNAL_SERVICE_SECRET,
    env.INTERNAL_SERVICE_SECRET_OLD,  // During rotation
  ].filter(Boolean);
  
  for (const secret of secrets) {
    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    if (timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return true;
    }
  }
  
  return false;
}
```

---

## 8. Impersonation Security

### 8.1 Impersonation Rules

| Rule | Enforcement |
|------|-------------|
| Admin-only | Requires `admin:impersonate` permission |
| Time-limited | Max 1 hour, then auto-expire |
| Manual exit | Explicit "Stop Impersonation" action available at any time |
| Scoped actions | Predefined allowlist, no billing/security |
| Mandatory reason | Stored in audit log |
| Full audit trail | Every action logged with impersonation context |
| Visible indicator | UI banner for impersonating admin |

### 8.2 Impersonation Flow

```typescript
// Start impersonation
async function startImpersonation(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<ImpersonationSession> {
  // 1. Verify admin permission
  if (!await checkAdminPermission(adminId, 'admin:impersonate')) {
    throw new ForbiddenError('Missing impersonate permission');
  }
  
  // 2. Prevent impersonating other admins
  const targetUser = await getUser(targetUserId);
  if (targetUser.adminRole) {
    throw new ForbiddenError('Cannot impersonate admins');
  }
  
  // 3. Create impersonation context
  const impersonation = {
    originalAdminId: adminId,
    targetUserId,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),  // 1 hour
    reason,
    allowedActions: IMPERSONATION_ALLOWED_ACTIONS,
  };
  
  // 4. Store in session
  await updateSession(adminId, { impersonation });
  
  // 5. Audit log
  await createAuditLog({
    action: 'impersonation_start',
    actorId: adminId,
    targetId: targetUserId,
    metadata: { reason },
  });
  
  return impersonation;
}

// Allowed actions during impersonation
const IMPERSONATION_ALLOWED_ACTIONS = [
  'read:profile',
  'read:files',
  'read:usage',
  'read:history',
  'execute:tool',
  // NOT allowed: billing, password change, API keys, delete account
];
```

### 8.3 Action Filtering During Impersonation

```typescript
// Middleware: filterImpersonationAction
function filterImpersonationAction(action: string) {
  return async (ctx: Context, next: Next) => {
    const session = ctx.session;
    
    if (session.impersonation) {
      // Check expiration
      if (new Date() > session.impersonation.expiresAt) {
        await endImpersonation(session);
        throw new SessionExpiredError('Impersonation expired');
      }
      
      // Check allowed actions
      if (!session.impersonation.allowedActions.includes(action)) {
        throw new ForbiddenError('Action not allowed during impersonation');
      }
      
      // Add context for audit
      ctx.auditContext = {
        impersonatedBy: session.impersonation.originalAdminId,
        impersonationReason: session.impersonation.reason,
      };
    }
    
    return next();
  };
}
```

---

## 9. Abuse Prevention

### 9.1 Abuse Vectors & Mitigations

| Vector | Attack | Mitigation |
|--------|--------|------------|
| **Credential stuffing** | Automated login attempts | Rate limit + CAPTCHA after 3 fails |
| **Account enumeration** | Probe for valid emails | Same response for valid/invalid |
| **Free tier abuse** | Multiple accounts | Device fingerprinting + email domain checks |
| **Coin farming** | Automated ad watching | CAPTCHA + behavior analysis |
| **API abuse** | Excessive requests | Per-key rate limits + anomaly detection |
| **File upload abuse** | Malicious files | Type validation + size limits + scanning |
| **Refund fraud** | Request refunds after use | FIFO attribution (see billing doc) |

### 9.2 Suspicious Activity Detection

```typescript
// Anomaly detection signals
const suspiciousSignals = {
  // Login anomalies
  multipleFailedLogins: (userId: string) => 
    countRecentFailedLogins(userId) > 5,
  
  // Geographic anomaly
  impossibleTravel: (userId: string, ip: string) =>
    detectImpossibleTravel(userId, ip),
  
  // Usage anomaly
  unusualUsageSpike: (userId: string) =>
    getCurrentUsage(userId) > 10 * getAverageUsage(userId),
  
  // Coin anomaly
  rapidCoinSpending: (userId: string) =>
    getRecentCoinSpend(userId, '5m') > 500,
};

async function checkSuspiciousActivity(
  userId: string,
  ip: string
): Promise<void> {
  const flags = await Promise.all([
    suspiciousSignals.multipleFailedLogins(userId),
    suspiciousSignals.impossibleTravel(userId, ip),
    suspiciousSignals.unusualUsageSpike(userId),
    suspiciousSignals.rapidCoinSpending(userId),
  ]);
  
  const flagCount = flags.filter(Boolean).length;
  
  if (flagCount >= 2) {
    // Cooldown: Only trigger once per 24 hours to prevent loops
    const cooldownKey = `abuse_cooldown:${userId}`;
    const inCooldown = await redis.get(cooldownKey);
    
    if (!inCooldown) {
      await flagAccountForReview(userId, flags);
      await requireReauthentication(userId);
      await redis.set(cooldownKey, '1', { ex: 86400 }); // 24h cooldown
    }
  }
}
```

### 9.3 Account Lockout Policy

| Trigger | Action | Duration |
|---------|--------|----------|
| 5 failed logins | Temporary lock + CAPTCHA | 15 minutes |
| 10 failed logins | Account lock + email | Until email verification |
| Suspicious activity | Review flag | Until admin review |
| Payment dispute | Purchase freeze | 30 days |
| ToS violation | Suspension | Permanent (appealable) |

---

## 10. Incident Response

### 10.1 Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 Critical** | Service down, data breach | 15 minutes | Database leak |
| **P1 High** | Major feature broken, security vulnerability | 1 hour | Auth bypass |
| **P2 Medium** | Partial outage, minor vulnerability | 4 hours | Rate limit bypass |
| **P3 Low** | Minor issue, cosmetic | 24 hours | UI security warning |

### 10.2 Incident Response Playbook

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT RESPONSE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. DETECT
   │
   ├── Automated alerts (monitoring)
   ├── User reports
   └── Security scanner
         │
         ▼
2. TRIAGE (≤15 min for P0/P1)
   │
   ├── Assess severity
   ├── Identify affected systems
   └── Notify on-call
         │
         ▼
3. CONTAIN
   │
   ├── Isolate affected systems
   ├── Revoke compromised credentials
   └── Enable additional logging
         │
         ▼
4. ERADICATE
   │
   ├── Patch vulnerability
   ├── Remove malicious artifacts
   └── Verify fix
         │
         ▼
5. RECOVER
   │
   ├── Restore services
   ├── Verify integrity
   └── Monitor for recurrence
         │
         ▼
6. POST-MORTEM
   │
   ├── Document timeline
   ├── Root cause analysis
   └── Update runbooks
```

### 10.3 Security Contacts

| Role | Responsibility | Escalation |
|------|----------------|------------|
| On-call engineer | Initial response | → Security lead |
| Security lead | Triage + coordination | → CTO |
| CTO | External communication | → Legal |

### 10.4 Breach Notification

| Stakeholder | Timeline | Method |
|-------------|----------|--------|
| Internal team | Immediately | Slack/PagerDuty |
| Affected users | ≤72 hours | Email |
| Regulatory (GDPR) | ≤72 hours | Official channels |
| Public disclosure | After containment | Blog post |

---

## Appendix A: Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF protection enabled
- [ ] Session security configured
- [ ] Audit logging enabled

### Ongoing

- [ ] Dependency vulnerability scanning (weekly)
- [ ] Secret rotation (quarterly)
- [ ] Access review (monthly)
- [ ] Penetration testing (annually)
- [ ] Incident response drill (quarterly)

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [02_USER_ROLES_PERMISSIONS](02_USER_ROLES_PERMISSIONS.md) | Admin RBAC details |
| [10_SYSTEM_ARCHITECTURE](10_SYSTEM_ARCHITECTURE.md) | Security layer integration |
| [14_API_CONTRACTS](14_API_CONTRACTS.md) | API security, rate limits |
| [21_BILLING_LOGIC](21_BILLING_LOGIC.md) | Payment security, webhooks |

---

*This document defines the security model for HSAFX WORLD. Security is non-negotiable.*
