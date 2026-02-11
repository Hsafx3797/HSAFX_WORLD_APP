# 45 — Integration Contracts

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED

> **Purpose:**  
> Defines the integration contracts, configuration requirements, and operational procedures for all third-party services used in the platform. Ensures the AI agent understands how external services are integrated and what configuration the human user must provide.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Stripe Integration](#2-stripe-integration)
3. [Uploadthing Integration](#3-uploadthing-integration)
4. [Cloudflare R2 Integration](#4-cloudflare-r2-integration)
5. [BullMQ & Redis Integration](#5-bullmq--redis-integration)
6. [External Services (Deferred)](#6-external-services-deferred)
7. [Environment Variables](#7-environment-variables)
8. [Webhook Security](#8-webhook-security)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Overview

### 1.1 Integration Philosophy

**AI Builds, Human Configures:**
- AI agent creates generic integration code for test mode
- Human user provides production secrets and configuration
- All integrations must work in test/development mode without external dependencies

**Minimal External Dependencies for MVP:**
- Only essential services integrated (Stripe, Uploadthing, R2, Redis)
- Email, analytics, and error tracking deferred to post-MVP
- Focus on core payment and storage functionality

### 1.2 Service Categories

| Service | Purpose | Required | Phase |
|---------|---------|----------|-------|
| **Stripe** | Payments, subscriptions | ✅ Yes | Phase 2 |
| **Uploadthing** | File uploads, virus scanning | ✅ Yes | Phase 1 |
| **Cloudflare R2** | Temporary file storage | ✅ Yes | Phase 1 |
| **Upstash Redis** | Caching, rate limiting, job queue | ✅ Yes | Phase 1 |
| **Email Service** | Transactional emails | ❌ No | Post-MVP |
| **Analytics** | Usage tracking | ❌ No | Post-MVP |
| **Error Tracking** | Sentry/Rollbar | ❌ No | Post-MVP |

---

## 2. Stripe Integration

**Purpose:** Handle subscriptions, one-time coin purchases, and payment webhooks.

### 2.1 Integration Approach

**AI Generates:**
- Generic Stripe integration code
- Test mode configuration examples
- Webhook handler implementation
- Local webhook testing documentation

**Human Provides:**
- Production API keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`)
- Webhook endpoint secret (`STRIPE_WEBHOOK_SECRET`)
- Stripe CLI for local webhook testing

### 2.2 Subscription Plans

**Reference:** [20_BILLING_SYSTEM.md](20_BILLING_SYSTEM.md)

**B2C Plans:**
| Plan | Price | Stripe Product ID | Features |
|------|-------|------------------|----------|
| Free | $0 | (no subscription) | Free tier limits, 50 coins/month |
| Pro | $10/mo | `prod_pro_monthly` | All Pro features, 150 coins/month |
| Advance | $20/mo | `prod_advance_monthly` | All Advance features, 250 coins/month |

**B2B Plans:**
| Plan | Price (Monthly) | Price (Yearly) | Stripe Product ID | Features |
|------|-----------------|----------------|-------------------|----------|
| Basic | $10/mo | $96/year ($8/mo) | `prod_basic_monthly` / `prod_basic_yearly` | 5000 operations/month per tool suite |
| Enterprise | $20/mo | $180/year ($15/mo) | `prod_enterprise_monthly` / `prod_enterprise_yearly` | 10000 operations/month per tool suite |

**Coin Packages (One-Time Purchases):**
| Package | Coins | Price | Stripe Product ID | Requirement |
|---------|-------|-------|-------------------|-------------|
| Small | 50 coins | $2 | `prod_coins_50` | Requires Pro or Advance plan |
| Large | 150 coins | $5 | `prod_coins_150` | Requires Pro or Advance plan |

**AI Implementation Notes:**
- Create placeholder product IDs in code (e.g., `prod_pro_monthly`)
- Document that human must create products in Stripe Dashboard
- Provide exact product/price setup instructions in [49_DEPLOYMENT_GUIDE.md](49_DEPLOYMENT_GUIDE.md)

---

### 2.3 Webhook Events

**Required Events:**
```javascript
// src/app/api/webhooks/stripe/route.ts
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.succeeded',
  'charge.failed',
]);
```

**Event Handlers:**

#### `checkout.session.completed`
**Purpose:** User completed subscription or coin purchase  
**Action:**
1. Extract `session.client_reference_id` (user ID)
2. If subscription: Create `subscriptions` record in DB
3. If one-time: Add coins to `user_coins` table
4. Update `users.plan_type`
5. Send success email (post-MVP)

**Implementation:**
```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const mode = session.mode; // 'subscription' | 'payment'
  
  if (mode === 'subscription') {
    await db.insert(subscriptions).values({
      user_id: userId,
      stripe_subscription_id: session.subscription,
      status: 'active',
      plan_type: extractPlanType(session.metadata.plan),
      current_period_start: new Date(session.subscription.current_period_start * 1000),
      current_period_end: new Date(session.subscription.current_period_end * 1000),
    });
    
    await db.update(users)
      .set({ plan_type: session.metadata.plan })
      .where(eq(users.id, userId));
  } else if (mode === 'payment') {
    const coins = parseInt(session.metadata.coins);
    await db.insert(user_coins).values({
      user_id: userId,
      change_amount: coins,
      reason: 'PURCHASED',
      transaction_id: session.payment_intent,
    });
  }
}
```

#### `customer.subscription.updated`
**Purpose:** Subscription plan changed or renewed  
**Action:**
1. Update `subscriptions` table
2. Update `users.plan_type`
3. Adjust plan limits if plan changed

#### `customer.subscription.deleted`
**Purpose:** Subscription cancelled or expired  
**Action:**
1. Update `subscriptions.status = 'cancelled'`
2. Update `users.plan_type = 'FREE'`
3. Reset plan limits to Free tier

#### `invoice.payment_failed`
**Purpose:** Subscription renewal payment failed  
**Action:**
1. Log failure in `admin_alerts` table
2. Send payment failure email (post-MVP)
3. Grace period: Keep subscription active for 7 days

---

### 2.4 Local Webhook Testing

**Setup Instructions (for human user):**

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe  # macOS
# or download from: https://stripe.com/docs/stripe-cli
```

2. Login:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy webhook signing secret to `.env.local`:
```bash
# Stripe CLI outputs: whsec_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

5. Trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

**AI Implementation:**
- Generate test mode webhook handler
- Include retry logic (Stripe retries failed webhooks)
- Log all webhook events to database for debugging
- Verify webhook signature before processing

---

### 2.5 Error Handling

**Idempotency:**
- All webhook handlers must be idempotent (safe to retry)
- Check if event already processed before taking action
- Use `stripe_events` table to track processed events

**Database Schema Addition:**
```sql
CREATE TABLE stripe_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  raw_data JSONB
);
```

**Handler Pattern:**
```typescript
async function handleWebhook(event: Stripe.Event) {
  // Check if already processed
  const exists = await db.select()
    .from(stripe_events)
    .where(eq(stripe_events.stripe_event_id, event.id))
    .limit(1);
  
  if (exists.length > 0) {
    console.log(`Event ${event.id} already processed`);
    return;
  }
  
  // Process event
  await processEvent(event);
  
  // Mark as processed
  await db.insert(stripe_events).values({
    stripe_event_id: event.id,
    event_type: event.type,
    raw_data: event,
  });
}
```

---

### 2.6 Configuration Reference

**Environment Variables:**
```bash
# .env.local (development)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# .env.production
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Stripe Dashboard Setup (human task):**
1. Create products for each plan
2. Create prices for each product
3. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Enable required events in webhook settings
5. Copy webhook signing secret

---

## 3. Uploadthing Integration

**Purpose:** Handle file uploads with virus scanning and size validation.

### 3.1 Integration Approach

**AI Generates:**
- Uploadthing API route (`/api/uploadthing`)
- File router configuration
- Client-side upload components
- File size validation

**Human Provides:**
- Uploadthing API key (`UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`)

### 3.2 File Size Limits

**Reference:** [20_BILLING_SYSTEM.md](20_BILLING_SYSTEM.md) Section 12: Resource Tier Limits

**Per-Plan Limits (Admin-Configurable):**
```typescript
// src/lib/upload-limits.ts
export const FILE_SIZE_LIMITS = {
  IMAGE: {
    GUEST: 5 * 1024 * 1024,         // 5 MB
    FREE: 10 * 1024 * 1024,         // 10 MB
    PRO: 100 * 1024 * 1024,         // 100 MB
    ADVANCE: 100 * 1024 * 1024,     // 100 MB
  },
  AUDIO: {
    GUEST: 5 * 1024 * 1024,         // 5 MB
    FREE: 10 * 1024 * 1024,         // 10 MB
    PRO: 50 * 1024 * 1024,          // 50 MB
    ADVANCE: 100 * 1024 * 1024,     // 100 MB
  },
  VIDEO: {
    GUEST: 15 * 1024 * 1024,        // 15 MB
    FREE: 30 * 1024 * 1024,         // 30 MB
    PRO: 100 * 1024 * 1024,         // 100 MB
    ADVANCE: 100 * 1024 * 1024,     // 100 MB
  },
  DOCUMENT: {
    GUEST: 5 * 1024 * 1024,         // 5 MB
    FREE: 10 * 1024 * 1024,         // 10 MB
    PRO: 50 * 1024 * 1024,          // 50 MB
    ADVANCE: 100 * 1024 * 1024,     // 100 MB
  },
};
```

**AI Implementation:**
- Fetch user's plan from JWT token or session
- Look up plan-specific limit from `system_settings` table (admin-configurable)
- Fall back to hardcoded defaults if not set in database
- Validate file size before and after upload

**Database Schema:**
```sql
-- Already in 13_DATABASE_SCHEMA.dbml
-- Limit keys format: FILE_SIZE_LIMIT_{CATEGORY}_{PLAN}
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example records:
INSERT INTO system_settings (key, value) VALUES
  ('FILE_SIZE_LIMIT_IMAGE_GUEST', '5242880'),     -- 5 MB
  ('FILE_SIZE_LIMIT_IMAGE_FREE', '10485760'),     -- 10 MB
  ('FILE_SIZE_LIMIT_IMAGE_PRO', '104857600'),     -- 100 MB
  ('FILE_SIZE_LIMIT_IMAGE_ADVANCE', '104857600'); -- 100 MB
```

---

### 3.3 Anonymous Uploads

**Requirements:**
- Allow anonymous users to upload files
- Enforce stricter rate limiting for anonymous uploads
- Tie uploads to IP address for rate limiting
- Clean up anonymous uploads after 24 hours

**Rate Limiting Strategy:**

**Authenticated Users:**
```typescript
// src/lib/rate-limit.ts
const authenticatedUploadLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "1 h"), // 50 uploads per hour
  prefix: "upload:user:",
});
```

**Anonymous Users (IP-based):**
```typescript
const anonymousUploadLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
  prefix: "upload:ip:",
});
```

**Implementation:**
```typescript
// src/app/api/uploadthing/route.ts
export const ourFileRouter = {
  fileUploader: f({ 
    image: { maxFileSize: "20MB" },
    video: { maxFileSize: "100MB" },
    pdf: { maxFileSize: "100MB" },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(req);
      
      if (session?.user) {
        // Authenticated: Rate limit by user ID
        const { success } = await authenticatedUploadLimit.limit(session.user.id);
        if (!success) throw new Error("Upload rate limit exceeded");
        
        return { userId: session.user.id, ip: null };
      } else {
        // Anonymous: Rate limit by IP
        const ip = req.headers.get("x-forwarded-for") || req.ip;
        const { success } = await anonymousUploadLimit.limit(ip);
        if (!success) throw new Error("Anonymous upload rate limit exceeded");
        
        return { userId: null, ip };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Store upload metadata for cleanup
      await db.insert(uploaded_files).values({
        file_url: file.url,
        file_key: file.key,
        user_id: metadata.userId,
        ip_address: metadata.ip,
        uploaded_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      
      return { url: file.url };
    }),
};
```

---

### 3.4 Cleanup Job

**Cron Job (runs every 6 hours):**
```typescript
// src/app/api/cron/cleanup-uploads/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Find expired files
  const expiredFiles = await db.select()
    .from(uploaded_files)
    .where(lt(uploaded_files.expires_at, new Date()));
  
  // Delete from Uploadthing
  const utapi = new UTApi();
  const fileKeys = expiredFiles.map(f => f.file_key);
  await utapi.deleteFiles(fileKeys);
  
  // Delete from database
  await db.delete(uploaded_files)
    .where(lt(uploaded_files.expires_at, new Date()));
  
  return Response.json({ 
    deleted: expiredFiles.length,
    keys: fileKeys 
  });
}
```

**Vercel Cron Configuration:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-uploads",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

### 3.5 Configuration Reference

**Environment Variables:**
```bash
# .env.local
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=xxxxx
```

**Uploadthing Dashboard Setup (human task):**
1. Create account at uploadthing.com
2. Create new app
3. Copy API keys to environment variables
4. Configure allowed file types
5. Enable virus scanning (premium feature)

---

## 4. Cloudflare R2 Integration

**Purpose:** Store temporary tool outputs (converted files, generated documents, etc.).

### 4.1 Integration Approach

**AI Generates:**
- R2 client configuration
- Presigned URL generation
- Bucket operations (put, get, delete)
- Cleanup cron job

**Human Provides:**
- R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- Creates bucket: `hsafx-world`

### 4.2 Bucket Configuration

**Bucket Name:** `hsafx-world`  
**Region:** Auto (Cloudflare's global network)  
**Lifecycle Rule:** Auto-delete files after 24 hours

**Bucket Creation (human task):**
```bash
# Using Wrangler CLI
wrangler r2 bucket create hsafx-world

# Configure lifecycle rule via Cloudflare Dashboard:
# Settings > Lifecycle Rules > Add Rule
# - Rule name: auto-cleanup
# - Action: Delete objects
# - Days after upload: 1
```

---

### 4.3 Implementation

**R2 Client Setup:**
```typescript
// src/lib/r2-client.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: "hsafx-world",
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  
  // Return public URL (if bucket is public) or presigned URL
  return await getPresignedUrl(key);
}

export async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "hsafx-world",
    Key: key,
  });
  
  // Presigned URL expires after 24 hours (matches Redis TTL)
  const url = await getSignedUrl(r2, command, { expiresIn: 24 * 60 * 60 });
  return url;
}
```

---

### 4.4 File Key Structure

**Naming Convention:**
```
{userId}/{toolId}/{jobId}/{filename}

Examples:
- user_123/resize-image/job_abc123/output.png
- anonymous_192.168.1.1/pdf-merge/job_xyz789/merged.pdf
- user_456/video-trim/job_def456/trimmed.mp4
```

**Benefits:**
- Easy to identify file owner
- Easy to trace to specific job
- Easy to clean up by user/tool
- Anonymous files use IP address hash

---

### 4.5 Cleanup Strategy

**Automatic Cleanup:**
- Cloudflare R2 lifecycle rule deletes files after 24 hours
- No cron job needed (R2 handles it)

**Manual Cleanup (Admin Panel):**
```typescript
// Admin can trigger cleanup for specific user
async function cleanupUserFiles(userId: string) {
  const prefix = `${userId}/`;
  const objects = await listR2Objects(prefix);
  await deleteR2Objects(objects.map(o => o.Key));
}
```

---

### 4.6 Configuration Reference

**Environment Variables:**
```bash
# .env.local
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=hsafx-world
```

**R2 Setup (human task):**
1. Create Cloudflare account
2. Navigate to R2 section
3. Create bucket: `hsafx-world`
4. Generate API token with R2 permissions
5. Configure lifecycle rule: Delete after 1 day
6. Copy credentials to environment variables

---

## 5. BullMQ & Redis Integration

**Purpose:** Job queue for async tools, rate limiting, caching.

### 5.1 Integration Approach

**AI Generates:**
- BullMQ queue configuration
- Job processors
- Rate limiting with Upstash Ratelimit
- Redis key schema (see [46_REDIS_KEY_SCHEMA.md](46_REDIS_KEY_SCHEMA.md))

**Human Provides:**
- Upstash Redis credentials (`UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`)

### 5.2 BullMQ Configuration

**Queue Setup:**
```typescript
// src/lib/queue.ts
import { Queue, Worker } from "bullmq";
import { Redis } from "@upstash/redis";

const connection = {
  host: process.env.UPSTASH_REDIS_URL!,
  port: 6379,
  password: process.env.UPSTASH_REDIS_TOKEN!,
};

export const fileProcessingQueue = new Queue("file-processing", { connection });
export const scraperQueue = new Queue("scraper", { connection });
```

**Job Producer (API endpoint):**
```typescript
// src/app/api/tools/convert/route.ts
export async function POST(req: Request) {
  const { toolId, input, options } = await req.json();
  
  const job = await fileProcessingQueue.add("convert", {
    toolId,
    input,
    options,
    userId: session.user.id,
  }, {
    attempts: 3,  // Retry 3 times
    backoff: {
      type: "exponential",
      delay: 2000,  // Start with 2s delay
    },
  });
  
  return Response.json({ jobId: job.id });
}
```

**Job Consumer (Worker process):**
```typescript
// src/workers/file-processor.ts
import { Worker } from "bullmq";

const worker = new Worker("file-processing", async (job) => {
  const { toolId, input, options, userId } = job.data;
  
  // Update job progress
  await job.updateProgress(10);
  
  // Execute tool
  const result = await executeTool(toolId, input, options);
  
  await job.updateProgress(90);
  
  // Upload result to R2
  const url = await uploadToR2(`${userId}/${toolId}/${job.id}/output`, result);
  
  await job.updateProgress(100);
  
  return { url };
}, { connection });

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```

---

### 5.3 Rate Limiting

**See:** [46_REDIS_KEY_SCHEMA.md](46_REDIS_KEY_SCHEMA.md) for complete key schema.

**Implementation:**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// Per-user rate limits (2 requests/min for all tiers - anti-bot protection)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  prefix: "ratelimit:api:user:",
});

// Per-IP rate limits (stricter for anonymous)
export const anonRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  prefix: "ratelimit:api:ip:",
});

// Tool-specific rate limits (configurable per tool)
export function getToolRateLimit(toolId: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: `ratelimit:tool:${toolId}:`,
  });
}
```

**Middleware:**
```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const session = await getServerSession();
  
  if (session?.user) {
    const { success } = await apiRateLimit.limit(session.user.id);
    if (!success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
  } else {
    const ip = req.headers.get("x-forwarded-for") || req.ip;
    const { success } = await anonRateLimit.limit(ip);
    if (!success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
  }
  
  return NextResponse.next();
}
```

---

### 5.4 Configuration Reference

**Environment Variables:**
```bash
# .env.local
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx
```

**Upstash Setup (human task):**
1. Create Upstash account
2. Create Redis database
3. Copy REST URL and token
4. Configure max memory policy: `allkeys-lru`
5. Enable TLS

---

## 6. External Services (Deferred)

**The following integrations are NOT included in MVP:**

### 6.1 Email Service (Post-MVP)
**Deferred To:** Post-MVP phase  
**Recommended:** Resend, SendGrid, or AWS SES  
**Use Cases:**
- Welcome emails
- Password reset
- Subscription renewal reminders
- Payment failure notifications

**Why Deferred:**
- Not critical for core functionality
- Can test manually without automated emails
- Reduces MVP complexity

---

### 6.2 Analytics (Post-MVP)
**Deferred To:** Post-MVP phase  
**Recommended:** PostHog, Plausible, or Google Analytics  
**Use Cases:**
- Tool usage tracking
- User behavior analysis
- Conversion funnels

**Why Deferred:**
- Can track manually via database queries initially
- Focus on core product first
- Can add later without affecting existing code

---

### 6.3 Error Tracking (Post-MVP)
**Deferred To:** Post-MVP phase  
**Recommended:** Sentry, Rollbar, or Bugsnag  
**Use Cases:**
- JavaScript error tracking
- API error monitoring
- Performance monitoring

**Why Deferred:**
- Console logs sufficient for MVP
- Can add later as wrapper
- User testing will surface critical bugs

---

## 7. Environment Variables

**Complete `.env.local` Template:**

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/hsafx_world

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# ============================================
# PAYMENTS (STRIPE)
# ============================================
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ============================================
# FILE UPLOADS (UPLOADTHING)
# ============================================
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=xxxxx

# ============================================
# STORAGE (CLOUDFLARE R2)
# ============================================
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=hsafx-world

# ============================================
# REDIS & JOB QUEUE (UPSTASH)
# ============================================
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# ============================================
# INTERNAL
# ============================================
CRON_SECRET=your-cron-secret-here
NODE_ENV=development
```

**Production `.env.production` Changes:**
```bash
# Use production keys for all services
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 8. Webhook Security

### 8.1 Signature Verification

**Stripe:**
```typescript
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Process event
    await handleStripeWebhook(event);
    
    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }
}
```

---

### 8.2 Idempotency

**All webhook handlers must:**
1. Check if event already processed
2. Use database transactions
3. Return success even if already processed (prevents retries)

**Pattern:**
```typescript
async function handleWebhook(event: any) {
  // Start transaction
  await db.transaction(async (tx) => {
    // Check if processed
    const existing = await tx.select()
      .from(webhook_events)
      .where(eq(webhook_events.external_id, event.id));
    
    if (existing.length > 0) {
      return; // Already processed
    }
    
    // Process event
    await processEvent(tx, event);
    
    // Mark as processed
    await tx.insert(webhook_events).values({
      external_id: event.id,
      source: "stripe",
      event_type: event.type,
      processed_at: new Date(),
    });
  });
}
```

---

## 9. Testing Strategy

### 9.1 Stripe Testing

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

**Test Webhooks:**
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

---

### 9.2 Uploadthing Testing

**Test Files:**
- Small file: < 1 MB (should succeed)
- Large file: > 100 MB (should fail)
- Invalid type: .exe file (should fail)
- Virus file: EICAR test file (should fail if scanning enabled)

---

### 9.3 R2 Testing

**Manual Tests:**
```typescript
// Upload test
const url = await uploadToR2("test/file.txt", Buffer.from("Hello"), "text/plain");
console.log("Uploaded:", url);

// Presigned URL test
const presignedUrl = await getPresignedUrl("test/file.txt");
console.log("Presigned URL:", presignedUrl);

// Verify expires after 24 hours
setTimeout(() => {
  fetch(presignedUrl).then(res => {
    if (res.status === 403) console.log("✅ URL expired correctly");
  });
}, 24 * 60 * 60 * 1000 + 1000); // 24h + 1s
```

---

### 9.4 BullMQ Testing

**Test Job Lifecycle:**
```typescript
// Add job
const job = await fileProcessingQueue.add("test", { data: "test" });
console.log("Job added:", job.id);

// Check status
const status = await job.getState();
console.log("Job status:", status);

// Wait for completion
await job.waitUntilFinished(queueEvents);
console.log("Job completed");
```

---

## 10. Notes for AI Agent

**When Implementing Integrations:**
- Use test mode for all services by default
- Document exact setup steps for human user
- Include retry logic for all external API calls
- Log all external requests for debugging
- Handle rate limits gracefully
- Verify webhook signatures
- Make all operations idempotent

**Configuration Pattern:**
```typescript
// src/config/external-services.ts
export const config = {
  stripe: {
    enabled: !!process.env.STRIPE_SECRET_KEY,
    testMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
  },
  uploadthing: {
    enabled: !!process.env.UPLOADTHING_SECRET,
  },
  r2: {
    enabled: !!process.env.R2_ACCESS_KEY_ID,
  },
  redis: {
    enabled: !!process.env.UPSTASH_REDIS_URL,
  },
};
```

**Graceful Degradation:**
- If service unavailable, return user-friendly error
- Log error for admin investigation
- Don't crash entire app
- Provide fallback where possible (e.g., skip rate limiting in dev mode)

---

**Total Pages:** 12  
**Status:** ✅ Production-Ready Reference
