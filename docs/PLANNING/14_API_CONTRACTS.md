# 05 — API Contracts

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — Contracts v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `10_SYSTEM_ARCHITECTURE`, `13_DATABASE_SCHEMA`, and `15_SECURITY_MODEL`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Design Principles](#2-api-design-principles)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [tRPC Router Structure](#4-trpc-router-structure)
5. [Public REST API](#5-public-rest-api)
6. [Webhook Contracts](#6-webhook-contracts)
7. [Internal Service API](#7-internal-service-api)
8. [Error Handling](#8-error-handling)
9. [Rate Limiting](#9-rate-limiting)
10. [Request/Response Schemas](#10-requestresponse-schemas)
11. [API Versioning](#11-api-versioning)
12. [OpenAPI Specification](#12-openapi-specification)

---

## 1. Overview

### 1.1 API Surface Areas

HSAFX WORLD exposes **four distinct API surfaces**:

| Surface | Protocol | Consumers | Auth Method |
|---------|----------|-----------|-------------|
| **tRPC (User App)** | HTTP/WebSocket | Web app (authenticated users) | Session cookie |
| **tRPC (Admin Panel)** | HTTP | Admin panel (internal staff) | Session cookie + RBAC |
| **Public REST API** | HTTP | B2B integrations, external apps | API key |
| **Webhooks (Inbound)** | HTTP | Polar, Stripe | Signature verification |

### 1.2 API Routing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API ROUTING OVERVIEW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   Cloudflare    │
                         │   (CDN/WAF)     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Vercel Edge   │
                         │   (Routing)     │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  /api/trpc/*  │        │  /api/v1/*    │        │/api/webhooks/*│
│   (tRPC)      │        │  (REST API)   │        │  (Webhooks)   │
├───────────────┤        ├───────────────┤        ├───────────────┤
│ Session auth  │        │ API key auth  │        │ Signature auth│
│ User + Admin  │        │ B2B clients   │        │ Polar/Stripe  │
└───────────────┘        └───────────────┘        └───────────────┘
```

### 1.3 Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.hsafx.world` |
| Staging | `https://api.staging.hsafx.world` |
| Development | `http://localhost:3000` |

---

## 2. API Design Principles

### 2.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Type-safe** | All APIs are defined with Zod schemas; TypeScript inference end-to-end |
| **Idempotent** | Mutations include idempotency keys where applicable |
| **Consistent** | Uniform error format, pagination, and response structure |
| **Versioned** | Public REST API is versioned; tRPC is not (internal) |
| **Documented** | OpenAPI spec auto-generated for public REST API |

### 2.2 Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| tRPC procedures | `camelCase` | `user.getProfile`, `tool.execute` |
| REST endpoints | `kebab-case` | `/api/v1/tools/image-converter` |
| Query params | `snake_case` | `?limit=20&offset=0&sort_by=created_at` |
| Request body | `camelCase` | `{ "toolId": "...", "inputData": {...} }` |
| Response body | `camelCase` | `{ "data": {...}, "meta": {...} }` |

### 2.4 Pagination Convention

> **📐 Invariant: Unified Pagination**  
> All paginated endpoints (tRPC and REST) use `limit/offset` pagination.  
> REST API responses include `meta.total`, `meta.limit`, `meta.offset`, `meta.hasMore`.  
> Cursor pagination is available for high-volume streams (e.g., transactions) using `cursor` parameter.

**Pagination Decision Tree:**

```
┌─────────────────────────────────────────────────────────────────┐
│           PAGINATION STRATEGY DECISION TREE                     │
└─────────────────────────────────────────────────────────────────┘

[Need to paginate a list endpoint]
             │
             ▼
    ┌────────────────────┐
    │ Is this a high-    │
    │ volume append-only │───YES──▶ Use Cursor Pagination
    │ ledger? (e.g.,     │          • coin_transactions
    │ transactions)      │          • audit_logs
    └────────┬───────────┘          • usage_counters
             │                      
            NO                      Example:
             │                      GET /api/transactions?cursor=uuid&limit=50
             ▼                      
    ┌────────────────────┐         Response:
    │ Do users need      │         {
    │ exact page counts  │           "data": [...],
    │ or jump to         │           "cursor": "next_uuid",
    │ specific pages?    │           "hasMore": true
    └────────┬───────────┘         }
             │
        ┌────┴────┐
       YES       NO
        │         │
        ▼         ▼
   Use Offset   Use Cursor
   Pagination   Pagination
        │         │
        ▼         │
   • users       │
   • subscriptions│
   • admin lists  │
        │         │
   Example:       │
   GET /api/users?│
   limit=20&      │
   offset=40      │
        │         │
   Response:      │
   {              │
     "data": [...],│
     "meta": {    │
       "total": 156,│
       "limit": 20,│
       "offset": 40,│
       "hasMore": true│
     }            │
   }              │
        │         │
        └────┬────┘
             │
             ▼
     [Implement chosen strategy]
```

**When to Use Each:**

| Strategy | Use When | Pros | Cons |
|----------|----------|------|------|
| **Offset** | • Need page numbers<br>• Need total count<br>• Dataset < 10k rows<br>• Random access needed | • User-friendly<br>• Jump to any page<br>• Easy UI (page 1, 2, 3...) | • Slow on large datasets<br>• Inconsistent with concurrent writes |
| **Cursor** | • Append-only logs<br>• High-volume data<br>• Real-time streams<br>• No random access needed | • Fast on large datasets<br>• Consistent with concurrent writes<br>• Works at any scale | • No page numbers<br>• No total count<br>• Forward-only navigation |

**Default Strategy:** Use **offset pagination** unless data volume or append-only pattern requires cursor pagination.

### 2.3 HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|------------|
| `GET` | Read operations, queries | Yes |
| `POST` | Create, execute tools, mutations | No* |
| `PUT` | Full resource update | Yes |
| `PATCH` | Partial resource update | Yes |
| `DELETE` | Remove resource | Yes |

> *POST can be made idempotent with `Idempotency-Key` header.

---

## 3. Authentication & Authorization

### 3.1 Authentication Methods

#### Session-Based (tRPC)

```typescript
// Middleware extracts session from cookie
const session = await auth.api.getSession({
  headers: request.headers,
});

if (!session) {
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}
```

#### API Key (REST API)

```http
Authorization: Bearer hsafx_live_sk_1234567890abcdef
```

> **⚠️ Important:** Although sent via `Authorization: Bearer`, HSAFX API keys are **opaque secrets, not JWTs**, and must never be parsed or decoded client-side. The server validates keys by hash lookup only.

API keys are scoped:
- `hsafx_live_sk_*` — Production keys
- `hsafx_test_sk_*` — Sandbox keys

#### Webhook Signature (Inbound Webhooks)

```typescript
// Polar webhook verification
const isValid = polar.webhooks.verify({
  payload: rawBody,
  headers: {
    'webhook-id': request.headers.get('webhook-id'),
    'webhook-timestamp': request.headers.get('webhook-timestamp'),
    'webhook-signature': request.headers.get('webhook-signature'),
  },
  secret: process.env.POLAR_WEBHOOK_SECRET,
});

// Stripe webhook verification
const event = stripe.webhooks.constructEvent(
  rawBody,
  request.headers.get('stripe-signature'),
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 3.2 Authorization Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Request arrives
      │
      ▼
┌─────────────┐     No      ┌─────────────┐
│ Is public   │────────────>│ Authenticate│
│ endpoint?   │             │ (session/key)│
└──────┬──────┘             └──────┬──────┘
       │ Yes                       │
       │                           ▼
       │                  ┌─────────────────┐     Fail
       │                  │ Valid session/  │────────────> 401 Unauthorized
       │                  │ API key?        │
       │                  └────────┬────────┘
       │                           │ Pass
       │                           ▼
       │                  ┌─────────────────┐
       │                  │ Is Admin API?   │
       │                  └────────┬────────┘
       │                     No    │    Yes
       │               ┌───────────┴───────────┐
       │               ▼                       ▼
       │     ┌─────────────────┐     ┌─────────────────┐
       │     │ Check plan-based│     │ Check RBAC      │
       │     │ access control  │     │ permissions     │
       │     └────────┬────────┘     └────────┬────────┘
       │              │                       │
       │              ▼                       ▼
       │     ┌─────────────────┐     ┌─────────────────┐
       │     │ Check usage     │     │ Permission      │
       │     │ limits          │     │ granted?        │
       │     └────────┬────────┘     └────────┬────────┘
       │              │                       │
       └──────────────┴───────────────────────┘
                      │
                      ▼
              Execute handler
```

### 3.3 API Key Structure

```typescript
interface ApiKey {
  id: string;                    // UUID
  userId: string;                // Owner
  name: string;                  // User-defined label
  keyPrefix: string;             // 'hsafx_live_sk' or 'hsafx_test_sk'
  keyHash: string;               // SHA256 hash (never store plaintext)
  scopes: ApiKeyScope[];         // Permitted operations
  rateLimit: number;             // Requests per minute
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

type ApiKeyScope = 
  | 'tools:execute'              // Execute any tool
  | 'tools:read'                 // List tools, get tool info
  | 'usage:read'                 // Read usage statistics
  | 'account:read';              // Read account info
```

---

## 4. tRPC Router Structure

### 4.1 Router Hierarchy

```typescript
// server/trpc/root.ts
export const appRouter = createTRPCRouter({
  // Public procedures (no auth required)
  public: publicRouter,
  
  // Authenticated user procedures
  auth: authRouter,
  user: userRouter,
  subscription: subscriptionRouter,
  coins: coinsRouter,
  tools: toolsRouter,
  usage: usageRouter,
  
  // Admin procedures (RBAC required)
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
```

### 4.2 User-Facing Procedures

#### Auth Router

```typescript
// server/trpc/routers/auth.ts
export const authRouter = createTRPCRouter({
  // Session management
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.session;
    }),
  
  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      await auth.api.signOut({ headers: ctx.headers });
      return { success: true };
    }),
  
  // OAuth callbacks handled by Better-Auth routes, not tRPC
});
```

#### User Router

```typescript
// server/trpc/routers/user.ts
export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.userId),
        with: { preferences: true, settings: true },
      });
    }),
  
  updateProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().min(1).max(100).optional(),
      username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.session.userId))
        .returning();
    }),
  
  updatePreferences: protectedProcedure
    .input(z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().length(2).optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(userPreferences)
        .set(input)
        .where(eq(userPreferences.userId, ctx.session.userId))
        .returning();
    }),
  
  updateSettings: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(userSettings)
        .set(input)
        .where(eq(userSettings.userId, ctx.session.userId))
        .returning();
    }),
  
  deleteAccount: protectedProcedure
    .input(z.object({
      confirmation: z.literal('DELETE'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete
      await ctx.db.update(users)
        .set({ deletedAt: new Date(), isActive: false })
        .where(eq(users.id, ctx.session.userId));
      
      // Sign out
      await auth.api.signOut({ headers: ctx.headers });
      
      return { success: true };
    }),
});
```

#### Subscription Router

```typescript
// server/trpc/routers/subscription.ts
export const subscriptionRouter = createTRPCRouter({
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await ctx.db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, ctx.session.userId),
          isNull(subscriptions.deletedAt)
        ),
        with: { plan: true },
      });
      
      if (!subscription) {
        return { plan: 'free', status: 'active', features: getFreeFeatures() };
      }
      
      return {
        ...subscription,
        status: deriveSubscriptionStatus(subscription),
      };
    }),
  
  getPlans: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.subscriptionPlans.findMany({
        where: and(
          eq(subscriptionPlans.isActive, true),
          isNull(subscriptionPlans.deletedAt)
        ),
        with: { features: true, limits: true },
        orderBy: asc(subscriptionPlans.priceCents),
      });
    }),
  
  createCheckout: protectedProcedure
    .input(z.object({
      planCode: z.enum(['pro', 'advance']),
      interval: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create Polar checkout session
      const checkout = await polar.checkouts.create({
        productPriceId: getPriceId(input.planCode, input.interval),
        successUrl: `${env.APP_URL}/subscription/success`,
        customerId: ctx.session.userId,
        metadata: { userId: ctx.session.userId },
      });
      
      return { checkoutUrl: checkout.url };
    }),
  
  cancel: protectedProcedure
    .input(z.object({
      reason: z.string().max(500).optional(),
      cancelAtPeriodEnd: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await getCurrentSubscription(ctx.session.userId);
      
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      
      // Cancel via Polar/Stripe
      await polar.subscriptions.cancel(subscription.stripeSubscriptionId, {
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      });
      
      // Update local record
      await ctx.db.update(subscriptions)
        .set({
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          canceledAt: input.cancelAtPeriodEnd ? null : new Date(),
          cancelReason: input.reason,
        })
        .where(eq(subscriptions.id, subscription.id));
      
      return { success: true };
    }),
});
```

#### Coins Router

```typescript
// server/trpc/routers/coins.ts
export const coinsRouter = createTRPCRouter({
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const wallet = await ctx.db.query.userCoinWallets.findFirst({
        where: eq(userCoinWallets.userId, ctx.session.userId),
      });
      
      return {
        balance: wallet?.balance ?? 0,
        lifetimeEarned: wallet?.lifetimeEarned ?? 0,
        lifetimeSpent: wallet?.lifetimeSpent ?? 0,
      };
    }),
  
  getTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
      type: z.enum(['purchase', 'bonus', 'spend', 'refund', 'admin_adjust']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db.query.coinTransactions.findMany({
        where: and(
          eq(coinTransactions.userId, ctx.session.userId),
          input.type ? eq(coinTransactions.txnType, input.type) : undefined,
          input.cursor ? lt(coinTransactions.createdAt, getCursorDate(input.cursor)) : undefined,
        ),
        orderBy: desc(coinTransactions.createdAt),
        limit: input.limit + 1,
      });
      
      const hasMore = transactions.length > input.limit;
      const items = hasMore ? transactions.slice(0, -1) : transactions;
      
      return {
        items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      };
    }),
  
  getPacks: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.coinPacks.findMany({
        where: eq(coinPacks.isActive, true),
        orderBy: asc(coinPacks.priceCents),
      });
    }),
  
  purchasePack: protectedProcedure
    .input(z.object({
      packCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pack = await ctx.db.query.coinPacks.findFirst({
        where: and(
          eq(coinPacks.code, input.packCode),
          eq(coinPacks.isActive, true),
        ),
      });
      
      if (!pack) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coin pack not found' });
      }
      
      // Create Stripe checkout for coin purchase
      const checkout = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price: pack.stripePriceId,
          quantity: 1,
        }],
        success_url: `${env.APP_URL}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.APP_URL}/coins`,
        metadata: {
          userId: ctx.session.userId,
          packId: pack.id,
          coins: pack.coins + pack.bonusCoins,
        },
      });
      
      return { checkoutUrl: checkout.url };
    }),
});
```

#### Tools Router

```typescript
// server/trpc/routers/tools.ts
export const toolsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Use Meilisearch for full-text search if search term provided
      if (input.search) {
        return searchTools(input.search, input);
      }
      
      return ctx.db.query.tools.findMany({
        where: and(
          eq(tools.isActive, true),
          isNull(tools.deletedAt),
          input.category ? eq(tools.category, input.category) : undefined,
        ),
        limit: input.limit,
        offset: input.offset,
      });
    }),
  
  get: publicProcedure
    .input(z.object({
      toolKey: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tool = await ctx.db.query.tools.findFirst({
        where: and(
          eq(tools.toolKey, input.toolKey),
          eq(tools.isActive, true),
          isNull(tools.deletedAt),
        ),
        with: { coinCosts: true, rateLimits: true },
      });
      
      if (!tool) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return tool;
    }),
  
  /**
   * 📐 Invariant: Tool Execution Idempotency
   * 
   * For `tools.execute`, coin deduction and usage increment MUST be idempotent
   * and keyed by `(user_id, tool_id, idempotency_key)` or `(job_id)` for async.
   * 
   * Rules:
   * - `idempotencyKey` is REQUIRED for async (FastAPI) executions
   * - Server auto-generates idempotency key if not provided for sync executions
   * - Duplicate requests within 24h return cached response, no re-charge
   * - Coin deduction is atomic with job creation (single transaction)
   */
  execute: protectedProcedure
    .input(z.object({
      toolKey: z.string(),
      input: z.record(z.unknown()),
      idempotencyKey: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 0. Generate or validate idempotency key
      const idempotencyKey = input.idempotencyKey ?? generateUUID();
      const cacheKey = `idempotency:${ctx.session.userId}:${input.toolKey}:${idempotencyKey}`;
      
      // Check for duplicate request
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached); // Return cached response
      }
      
      // 1. Get tool configuration
      const tool = await getTool(input.toolKey);
      
      // 2. Check plan access
      const canAccess = await checkPlanAccess(ctx.session.userId, tool);
      if (!canAccess.allowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: canAccess.reason,
        });
      }
      
      // 3. Check usage limits
      const withinLimits = await checkUsageLimits(ctx.session.userId, tool);
      if (!withinLimits.allowed) {
        // Check if user can pay with coins
        if (withinLimits.canPayWithCoins) {
          const coinCost = await getCoinCost(tool, 'execute');
          const hasCoins = await checkCoinBalance(ctx.session.userId, coinCost);
          
          if (!hasCoins) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Usage limit exceeded. Purchase coins to continue.',
              cause: { coinCost, currentBalance: hasCoins.balance },
            });
          }
          
          // Deduct coins (with lock)
          await deductCoins(ctx.session.userId, coinCost, {
            referenceType: 'tool_usage',
            referenceId: tool.id,
          });
        } else {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: withinLimits.reason,
          });
        }
      }
      
      // 4. Determine execution strategy
      const strategy = getExecutionStrategy(tool);
      
      // 5. Execute based on strategy
      switch (strategy) {
        case 'wasm':
          // Return WASM module URL for client-side execution
          return {
            executionType: 'client',
            wasmUrl: tool.wasmModuleUrl,
            config: tool.clientConfig,
          };
        
        case 'nextjs':
          // Execute in Next.js serverless function
          const result = await executeInNextjs(tool, input.input);
          await incrementUsage(ctx.session.userId, tool);
          return { executionType: 'server', result };
        
        case 'fastapi':
          // Dispatch to FastAPI backend
          const job = await dispatchToFastAPI(tool, input.input, ctx.session.userId);
          return {
            executionType: 'async',
            jobId: job.id,
            statusUrl: `/api/v1/jobs/${job.id}`,
          };
        
        default:
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),
  
  getJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const job = await redis.hgetall(`job:${input.jobId}`);
      
      if (!job || job.userId !== ctx.session.userId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return {
        status: job.status,
        progress: parseInt(job.progress ?? '0'),
        result: job.result ? JSON.parse(job.result) : null,
        error: job.error,
      };
    }),
});
```

### 4.3 Admin Procedures

```typescript
// server/trpc/routers/admin/index.ts
export const adminRouter = createTRPCRouter({
  users: adminUsersRouter,
  subscriptions: adminSubscriptionsRouter,
  coins: adminCoinsRouter,
  tools: adminToolsRouter,
  plans: adminPlansRouter,
  roles: adminRolesRouter,
  audit: adminAuditRouter,
  analytics: adminAnalyticsRouter,
  system: adminSystemRouter,
});

// Example: Admin Users Router
// server/trpc/routers/admin/users.ts
export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure
    .meta({ permission: 'users.view' })
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['active', 'inactive', 'banned']).optional(),
      plan: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['createdAt', 'lastLogin', 'email']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ ctx, input }) => {
      // Query with filters
      const [items, total] = await Promise.all([
        ctx.db.query.users.findMany({
          where: buildUserFilters(input),
          limit: input.limit,
          offset: input.offset,
          orderBy: buildUserSort(input),
          with: { subscription: { with: { plan: true } } },
        }),
        ctx.db.select({ count: count() }).from(users).where(buildUserFilters(input)),
      ]);
      
      return { items, total: total[0].count, limit: input.limit, offset: input.offset };
    }),
  
  get: adminProcedure
    .meta({ permission: 'users.view' })
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
        with: {
          subscription: { with: { plan: true } },
          wallet: true,
          preferences: true,
          settings: true,
          roles: { with: { role: true } },
        },
      });
      
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      return user;
    }),
  
  ban: adminProcedure
    .meta({ permission: 'users.ban' })
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, input.userId));
      
      // Invalidate all sessions
      await invalidateUserSessions(input.userId);
      
      // Audit log
      await createAuditLog({
        actorId: ctx.session.userId,
        action: 'update',
        resource: 'user',
        resourceId: input.userId,
        changes: { isActive: { old: true, new: false } },
        metadata: { reason: input.reason },
      });
      
      return { success: true };
    }),
  
  impersonate: adminProcedure
    .meta({ permission: 'users.impersonate' })
    .input(z.object({
      userId: z.string().uuid(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create impersonation session
      const token = await createImpersonationToken({
        adminId: ctx.session.userId,
        targetUserId: input.userId,
        reason: input.reason,
        expiresAt: addHours(new Date(), 1),
      });
      
      // Audit log (critical action)
      await createAuditLog({
        actorId: ctx.session.userId,
        actorType: 'support_impersonation',
        action: 'login',
        resource: 'user',
        resourceId: input.userId,
        metadata: { reason: input.reason },
      });
      
      return { impersonationToken: token };
    }),
  
  stopImpersonation: adminProcedure
    .meta({ permission: 'users.impersonate' })
    .mutation(async ({ ctx }) => {
      if (!ctx.isImpersonating) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not impersonating' });
      }
      
      await revokeImpersonationToken(ctx.impersonationTokenId);
      
      await createAuditLog({
        actorId: ctx.originalAdminId,
        actorType: 'support_impersonation',
        action: 'logout',
        resource: 'user',
        resourceId: ctx.session.userId,
      });
      
      return { success: true };
    }),
});

/**
 * 🔒 Impersonation Session Constraints (Invariant)
 * 
 * Impersonation sessions are:
 * - Time-limited: Maximum 1 hour, non-renewable
 * - Action-restricted: Cannot modify billing, passwords, email, or 2FA
 * - Context-flagged: `ctx.isImpersonating = true` for all handlers
 * - Audit-logged: Every action during impersonation includes original admin ID
 * - Revocable: Admin can end session early via `stopImpersonation`
 */
```

---

## 5. Public REST API

> **📐 Invariant: REST API Execution is Always Async**
> 
> The public REST API (`/api/v1/tools/:key/execute`) **always returns an async job**,
> regardless of the tool's execution strategy. This provides a consistent interface
> for B2B integrators.
> 
> In contrast, tRPC `tools.execute` may return:
> - `executionType: 'client'` — WASM URL for client-side execution
> - `executionType: 'server'` — Immediate result for fast server-side tools
> - `executionType: 'async'` — Job ID for long-running operations
> 
> This difference exists because tRPC consumers are our web app (can handle WASM),
> while REST API consumers are external systems expecting uniform async patterns.

### 5.1 Endpoint Structure

```
/api/v1/
├── tools/
│   ├── GET    /                     # List all tools
│   ├── GET    /:toolKey             # Get tool details
│   └── POST   /:toolKey/execute     # Execute tool
├── jobs/
│   ├── GET    /:jobId               # Get job status
│   └── GET    /:jobId/result        # Get job result (if complete)
├── account/
│   ├── GET    /                     # Get account info
│   └── GET    /usage                # Get usage statistics
└── health/
    └── GET    /                     # Health check
```

### 5.2 Request/Response Format

#### List Tools

```http
GET /api/v1/tools?category=image&limit=20&offset=0
Authorization: Bearer hsafx_live_sk_...

---
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "key": "image_converter",
      "name": "Image Converter",
      "description": "Convert images between formats",
      "category": "image",
      "isPublic": true,
      "inputSchema": { ... },
      "outputSchema": { ... },
      "coinCost": 5
    }
  ],
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Execute Tool

```http
POST /api/v1/tools/image_converter/execute
Authorization: Bearer hsafx_live_sk_...
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "input": {
    "sourceUrl": "https://example.com/image.png",
    "targetFormat": "webp",
    "quality": 85
  },
  "webhook": {
    "url": "https://your-app.com/webhooks/tool-complete",
    "secret": "your-webhook-secret"
  }
}

---
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "data": {
    "jobId": "job_abc123",
    "status": "processing",
    "estimatedDuration": 5000,
    "statusUrl": "/api/v1/jobs/job_abc123"
  }
}
```

#### Get Job Status

```http
GET /api/v1/jobs/job_abc123
Authorization: Bearer hsafx_live_sk_...

---
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "jobId": "job_abc123",
    "status": "completed",
    "progress": 100,
    "result": {
      "outputUrl": "https://r2.hsafx.world/outputs/abc123.webp",
      "expiresAt": "2026-01-05T12:00:00Z",
      "metadata": {
        "originalSize": 1024000,
        "outputSize": 256000,
        "compressionRatio": 0.25
      }
    },
    "createdAt": "2026-01-04T11:55:00Z",
    "completedAt": "2026-01-04T11:55:05Z"
  }
}
```

### 5.3 Job Result Retention Policy

| Resource | Retention | Notes |
|----------|-----------|-------|
| Job metadata (Redis) | 72 hours | Status, progress, timestamps |
| Job result payload | 72 hours | Stored in Redis, then deleted |
| Output files (R2) | 24 hours | Signed URLs expire; files auto-deleted |
| Job audit log (Postgres) | 30 days | For billing reconciliation |

> After 72 hours, `GET /api/v1/jobs/:id` returns `404 NOT_FOUND`.
> Clients should download results promptly or use webhook delivery.

### 5.4 API Key Management

API keys are managed via tRPC (authenticated web interface):

```typescript
// server/trpc/routers/apiKeys.ts
export const apiKeysRouter = createTRPCRouter({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.apiKeys.findMany({
        where: and(
          eq(apiKeys.userId, ctx.session.userId),
          isNull(apiKeys.deletedAt),
        ),
        columns: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          rateLimit: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
          // keyHash explicitly excluded
        },
      });
    }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      scopes: z.array(z.enum(['tools:execute', 'tools:read', 'usage:read', 'account:read'])),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check plan allows API access
      const canUseApi = await checkPlanFeature(ctx.session.userId, 'api.access');
      if (!canUseApi) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'API access requires Pro or Advance plan',
        });
      }
      
      // Generate key
      const rawKey = `hsafx_live_sk_${generateSecureToken(32)}`;
      const keyHash = await hashApiKey(rawKey);
      
      // Store
      const apiKey = await ctx.db.insert(apiKeys).values({
        userId: ctx.session.userId,
        name: input.name,
        keyPrefix: 'hsafx_live_sk',
        keyHash,
        scopes: input.scopes,
        rateLimit: getPlanRateLimit(ctx.session.userId),
        expiresAt: input.expiresAt,
      }).returning();
      
      // Return raw key ONCE (never stored)
      return {
        id: apiKey[0].id,
        key: rawKey, // Only time the full key is returned
        name: input.name,
        scopes: input.scopes,
      };
    }),
  
  revoke: protectedProcedure
    .input(z.object({ keyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(apiKeys)
        .set({ deletedAt: new Date() })
        .where(and(
          eq(apiKeys.id, input.keyId),
          eq(apiKeys.userId, ctx.session.userId),
        ));
      
      return { success: true };
    }),
});
```

---

## 6. Webhook Contracts

### 6.1 Inbound Webhooks (From External Services)

#### Polar Webhooks

**Signature Verification (Polar uses Svix standard):**

Polar signs webhooks using **HMAC SHA256** with the following format:

```
HMAC-SHA256(webhook_id + '.' + webhook_timestamp + '.' + raw_body, webhook_secret)
```

**Verification Steps:**
1. Extract `webhook-id`, `webhook-timestamp`, `webhook-signature` headers
2. Concatenate: `webhook_id + '.' + timestamp + '.' + raw_body`
3. Compute HMAC-SHA256 with secret
4. Compare computed signature with received signature
5. Check timestamp (reject if >5 minutes old to prevent replay attacks)

```typescript
// app/api/webhooks/polar/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookId = request.headers.get('webhook-id')!;
  const webhookTimestamp = request.headers.get('webhook-timestamp')!;
  const webhookSignature = request.headers.get('webhook-signature')!;
  
  // Step 1: Verify timestamp (prevent replay attacks)
  const timestamp = parseInt(webhookTimestamp);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) { // 5 minutes
    return new Response('Timestamp too old', { status: 401 });
  }
  
  // Step 2: Compute expected signature
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.POLAR_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex');
  
  // Step 3: Compare signatures (constant-time comparison)
  const receivedSignature = webhookSignature.split(',')[0].split('=')[1]; // Extract v1=<sig>
  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  )) {
    console.error('[Polar Webhook] Invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }
  
  // OR use Polar SDK (recommended):
  const isValid = polar.webhooks.verify({
    payload: rawBody,
    headers: {
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    },
    secret: env.POLAR_WEBHOOK_SECRET,
  });
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(rawBody);
  
  // Idempotency check
  const processed = await checkWebhookProcessed('polar', event.id);
  if (processed) {
    return new Response('Already processed', { status: 200 });
  }
  
  // Process event
  switch (event.type) {
    case 'checkout.created':
      await handleCheckoutCreated(event.data);
      break;
    case 'subscription.created':
      await handleSubscriptionCreated(event.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event.data);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event.data);
      break;
    default:
      console.log(`Unhandled Polar event: ${event.type}`);
  }
  
  // Mark as processed
  await markWebhookProcessed('polar', event.id);
  
  return new Response('OK', { status: 200 });
}
```

**Polar Event Payloads:**

```typescript
interface PolarSubscriptionCreated {
  type: 'subscription.created';
  data: {
    id: string;
    customer_id: string;
    product_id: string;
    price_id: string;
    status: 'active' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    trial_end: string | null;
    metadata: { userId: string };
  };
}

interface PolarSubscriptionUpdated {
  type: 'subscription.updated';
  data: {
    id: string;
    status: 'active' | 'past_due' | 'canceled' | 'unpaid';
    cancel_at_period_end: boolean;
    current_period_start: string;
    current_period_end: string;
  };
}
```

#### Stripe Webhooks

**Signature Verification (Stripe uses custom signature scheme):**

Stripe signs webhooks using **HMAC SHA256** with the following format:

```
stripe-signature: t=<timestamp>,v1=<signature>
```

**Verification Steps:**
1. Extract `t` (timestamp) and `v1` (signature) from `stripe-signature` header
2. Concatenate: `timestamp + '.' + raw_body`
3. Compute HMAC-SHA256 with webhook secret
4. Compare computed signature with received `v1` signature
5. Reject if timestamp >5 minutes old (replay attack prevention)

```typescript
// app/api/webhooks/stripe/route.ts
import crypto from 'crypto';
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  // Method 1: Manual verification (educational)
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const receivedSignature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  
  if (!timestamp || !receivedSignature) {
    return new Response('Missing signature parts', { status: 400 });
  }
  
  // Check timestamp freshness
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return new Response('Timestamp too old', { status: 400 });
  }
  
  // Compute expected signature
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');
  
  // Compare signatures
  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  )) {
    console.error('[Stripe Webhook] Invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Method 2: Use Stripe SDK (recommended - handles edge cases)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Idempotency check
  const processed = await checkWebhookProcessed('stripe', event.id);
  if (processed) {
    return new Response('Already processed', { status: 200 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
  
  await markWebhookProcessed('stripe', event.id);
  
  return new Response('OK', { status: 200 });
}
```

### 6.2 Outbound Webhooks (To Customers)

For B2B API users, we send webhooks on job completion:

```typescript
interface OutboundWebhook {
  id: string;
  type: 'job.completed' | 'job.failed';
  timestamp: string;
  data: {
    jobId: string;
    toolKey: string;
    status: 'completed' | 'failed';
    result?: unknown;
    error?: { code: string; message: string };
  };
}

// Webhook delivery with retry
async function sendWebhook(url: string, secret: string, payload: OutboundWebhook) {
  const signature = hmacSHA256(JSON.stringify(payload), secret);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': payload.timestamp,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    // Queue for retry via Inngest
    await inngest.send({
      name: 'webhook/retry',
      data: { url, secret, payload, attempt: 1 },
    });
  }
}
```

### 6.3 Webhook Retry Policy

| Parameter | Value |
|-----------|-------|
| Max attempts | 10 |
| Backoff strategy | Exponential (2^n seconds, capped at 1 hour) |
| Retry schedule | 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s, 1024s |
| Timeout per attempt | 30 seconds |
| Success codes | 2xx |
| Dead letter queue | After 10 failures, event stored for 30 days |
| Manual retry | Available via admin panel for DLQ items |

```typescript
```

---

## 7. Internal Service API

> **🔒 Internal Service Authentication Constraints**
> 
> Internal service requests MUST:
> - Be sent over private network (VPC peering or internal Kubernetes network)
> - Include `X-Internal-Secret` header for v1 (static shared secret)
> - Support timestamp + HMAC signature in future versions (v2 migration planned)
> - Support secret rotation without downtime (dual-secret acceptance during rotation)
> 
> The static secret approach is acceptable for v1 MVP. Migration to HMAC-signed
> requests with request timestamps will be implemented before public launch.

### 7.1 Next.js → FastAPI

```typescript
// lib/fastapi/client.ts
const fastApiClient = {
  baseUrl: env.FASTAPI_URL,
  secret: env.INTERNAL_SERVICE_SECRET,
  
  async submitJob(request: FastApiJobRequest): Promise<FastApiJobResponse> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': this.secret,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }
    
    return response.json();
  },
  
  async getJobStatus(jobId: string): Promise<FastApiJobStatus> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: {
        'X-Internal-Secret': this.secret,
      },
    });
    
    return response.json();
  },
};

interface FastApiJobRequest {
  jobId: string;
  toolKey: string;
  input: Record<string, unknown>;
  callbackUrl: string;
  userId: string;
}

interface FastApiJobResponse {
  jobId: string;
  status: 'queued' | 'processing';
  estimatedDuration: number;
}
```

### 7.2 FastAPI → Next.js Callback

```typescript
// app/api/internal/job-callback/route.ts
export async function POST(request: Request) {
  // Verify internal secret
  const secret = request.headers.get('X-Internal-Secret');
  if (secret !== env.INTERNAL_SERVICE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const payload: JobCallbackPayload = await request.json();
  
  // Update job status in Redis
  await redis.hset(`job:${payload.jobId}`, {
    status: payload.status,
    progress: payload.progress,
    result: payload.result ? JSON.stringify(payload.result) : null,
    error: payload.error,
    completedAt: new Date().toISOString(),
  });
  
  // Record usage (if successful)
  if (payload.status === 'completed') {
    await incrementUsage(payload.userId, payload.toolKey);
  }
  
  // Send customer webhook (if configured)
  if (payload.webhookUrl) {
    await sendWebhook(payload.webhookUrl, payload.webhookSecret, {
      id: generateId(),
      type: payload.status === 'completed' ? 'job.completed' : 'job.failed',
      timestamp: new Date().toISOString(),
      data: {
        jobId: payload.jobId,
        toolKey: payload.toolKey,
        status: payload.status,
        result: payload.result,
        error: payload.error,
      },
    });
  }
  
  return new Response('OK', { status: 200 });
}
```

---

## 8. Error Handling

### 8.1 Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable code
    message: string;        // Human-readable message
    details?: unknown;      // Additional context
    requestId: string;      // For support reference
  };
}
```

**Example REST Error Response:**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
X-Request-Id: req_abc123xyz

{
  "error": {
    "code": "PLAN_LIMIT_EXCEEDED",
    "message": "Monthly usage limit reached for image_converter",
    "details": {
      "limit": 100,
      "current": 100,
      "resetAt": "2026-02-01T00:00:00Z",
      "canPayWithCoins": true,
      "coinCost": 5
    },
    "requestId": "req_abc123xyz"
  }
}
```

### 8.2 Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid request body or parameters |
| 400 | `VALIDATION_ERROR` | Schema validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 401 | `SESSION_EXPIRED` | Session has expired |
| 401 | `INVALID_API_KEY` | API key is invalid or revoked |
| 403 | `FORBIDDEN` | Access denied |
| 403 | `PLAN_LIMIT_EXCEEDED` | Plan limit reached |
| 403 | `INSUFFICIENT_COINS` | Not enough coins |
| 403 | `FEATURE_NOT_AVAILABLE` | Feature not in current plan |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 422 | `UNPROCESSABLE_ENTITY` | Request understood but cannot be processed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 502 | `UPSTREAM_ERROR` | Downstream service error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

### 8.3 tRPC Error Mapping

```typescript
// lib/trpc/errors.ts
export function mapErrorToTRPC(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }
  
  if (error instanceof ZodError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation error',
      cause: error.flatten(),
    });
  }
  
  if (error instanceof PlanLimitError) {
    return new TRPCError({
      code: 'FORBIDDEN',
      message: error.message,
      cause: {
        code: 'PLAN_LIMIT_EXCEEDED',
        limit: error.limit,
        current: error.current,
        canPayWithCoins: error.canPayWithCoins,
        coinCost: error.coinCost,
      },
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

---

## 9. Rate Limiting

### 9.1 Rate Limit Tiers

| Context | Limit | Window | Scope |
|---------|-------|--------|-------|
| **tRPC (unauthenticated)** | 20 req | 1 minute | IP |
| **tRPC (authenticated)** | 100 req | 1 minute | User |
| **REST API (default)** | 60 req | 1 minute | API key |
| **REST API (Pro)** | 300 req | 1 minute | API key |
| **REST API (Advance)** | 1000 req | 1 minute | API key |
| **Tool execution** | Per tool | Per tool | User |
| **Webhook inbound** | 100 req | 1 minute | IP |

> **📐 Rate Limit Precedence**
> 
> Each API key has a `rateLimit` field that may differ from the plan default.
> The effective rate limit is: `min(key.rateLimit, planTier.maxRateLimit)`
> 
> - Plan tier sets the **ceiling** (Pro: 300, Advance: 1000)
> - Key-specific limit can be **lower** but never **higher** than plan allows
> - Admins can adjust key limits via admin panel (within plan ceiling)

### 9.2 Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704369600
Retry-After: 45
```

### 9.3 Rate Limit Implementation

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const rateLimiters = {
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'rl:public',
  }),
  authenticated: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:auth',
  }),
  api: {
    default: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'rl:api:default',
    }),
    pro: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '1 m'),
      prefix: 'rl:api:pro',
    }),
    advance: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      prefix: 'rl:api:advance',
    }),
  },
};

export async function checkRateLimit(
  identifier: string,
  type: 'public' | 'authenticated' | 'api',
  tier?: 'default' | 'pro' | 'advance'
): Promise<RateLimitResult> {
  const limiter = type === 'api' 
    ? rateLimiters.api[tier ?? 'default']
    : rateLimiters[type];
  
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return { success, limit, remaining, reset };
}
```

---

## 10. Request/Response Schemas

### 10.1 Common Schemas

```typescript
// lib/schemas/common.ts
import { z } from 'zod';

// Pagination
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const cursorPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Sorting
export const sortSchema = z.object({
  sortBy: z.string(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Timestamps
export const timestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// UUID
export const uuidSchema = z.string().uuid();

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    }),
  });

// Cursor paginated response
export const cursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
```

### 10.2 Domain Schemas

```typescript
// lib/schemas/user.ts
export const userSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  username: z.string().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  createdAt: z.date(),
});

export const userProfileSchema = userSchema.extend({
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    timezone: z.string(),
  }),
  settings: z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    marketingEmails: z.boolean(),
  }),
});

// lib/schemas/subscription.ts
export const subscriptionPlanSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  priceCents: z.number(),
  currency: z.string(),
  interval: z.enum(['monthly', 'yearly']),
  description: z.string().nullable(),
  isPopular: z.boolean(),
  features: z.array(z.object({
    key: z.string(),
    enabled: z.boolean(),
  })),
  limits: z.array(z.object({
    resourceKey: z.string(),
    maxValue: z.number().nullable(),
    isUnlimited: z.boolean(),
    resetPeriod: z.enum(['hourly', 'daily', 'monthly', 'yearly', 'never']),
  })),
});

/**
 * 📐 Invariant: Subscription Status is Derived, Not Persisted
 * 
 * `subscription.status` is calculated at read-time from:
 * - `trialEndsAt` vs current time → 'trialing'
 * - `currentPeriodEnd` vs current time → 'expired' if past
 * - `cancelAtPeriodEnd` → 'active_canceling' if true and active
 * - Provider webhook state → 'past_due' if payment failed
 * - `canceledAt` presence → 'canceled'
 * 
 * This field is NEVER stored in the database. See 13_DATABASE_SCHEMA.md.
 */
export const subscriptionSchema = z.object({
  id: uuidSchema,
  plan: subscriptionPlanSchema,
  status: z.enum(['trialing', 'active', 'active_canceling', 'past_due', 'canceled', 'expired']),  // Derived, not persisted
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  trialEndsAt: z.date().nullable(),
  canceledAt: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

// lib/schemas/tool.ts
export const toolSchema = z.object({
  id: uuidSchema,
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  isPublic: z.boolean(),
  executionStrategy: z.enum(['wasm', 'nextjs', 'fastapi']),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  coinCost: z.number(),
});

export const toolExecutionResultSchema = z.discriminatedUnion('executionType', [
  z.object({
    executionType: z.literal('client'),
    wasmUrl: z.string().url(),
    config: z.record(z.unknown()),
  }),
  z.object({
    executionType: z.literal('server'),
    result: z.unknown(),
  }),
  z.object({
    executionType: z.literal('async'),
    jobId: z.string(),
    statusUrl: z.string(),
  }),
]);
```

---

## 11. API Versioning

### 11.1 Versioning Strategy

| API Surface | Versioning | Breaking Changes |
|-------------|------------|------------------|
| **tRPC** | Not versioned | Coordinated with app deploys |
| **REST API** | URL path (`/api/v1/`) | New version required |
| **Webhooks** | Schema versioned | Deprecation notice |

### 11.2 REST API Versioning Rules

```
/api/v1/...  ← Current stable version
/api/v2/...  ← Future major version (when needed)
```

**Breaking changes require new version:**
- Removing fields from responses
- Changing field types
- Removing endpoints
- Changing authentication requirements
- Changing error codes

**Non-breaking changes (same version):**
- Adding optional fields to responses
- Adding optional query parameters
- Adding new endpoints
- Adding new error codes
- Performance improvements

### 11.3 Deprecation Policy

1. Announce deprecation 6 months before removal
2. Add `Deprecation` header to responses
3. Document migration path
4. Remove after deprecation period

```http
Deprecation: @1735689600
Sunset: Sat, 01 Jul 2026 00:00:00 GMT
Link: </api/v2/tools>; rel="successor-version"
```

---

## 12. OpenAPI Specification

### 12.1 Auto-Generation

OpenAPI spec is auto-generated from Zod schemas:

> **⚠️ OpenAPI Scope Restriction**
> 
> Only REST-exposed public procedures are included in the OpenAPI specification.
> The following are **explicitly excluded**:
> - All `admin.*` routers (internal RBAC-protected)
> - All `internal.*` routes (service-to-service)
> - tRPC-only procedures without REST mapping
> 
> This prevents accidental exposure of internal API contracts.

```typescript
// lib/openapi/generate.ts
import { generateOpenApiDocument } from 'trpc-openapi';
import { publicRestRouter } from '@/server/trpc/rest'; // Only public REST procedures

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'HSAFX WORLD API',
  version: '1.0.0',
  baseUrl: 'https://api.hsafx.world',
  description: 'Public REST API for HSAFX WORLD platform',
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'API Key',
    },
  },
});
```

### 12.2 Documentation Endpoint

```typescript
// app/api/docs/route.ts
import { openApiDocument } from '@/lib/openapi/generate';

export function GET() {
  return new Response(JSON.stringify(openApiDocument), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 12.3 Swagger UI

Available at `https://api.hsafx.world/docs` for API exploration.

---

## Appendix A: tRPC Procedure Reference

| Router         | Procedure           | Type     | Auth      | Description         |
|--------        |-----------          |------    |------     |-------------        |
| `auth`         | `getSession`        | Query    | Public    | Get current session |
| `auth`         | `signOut`           | Mutation | Protected | Sign out user       |
| `user`         | `getProfile`        | Query    | Protected | Get user profile    |
| `user`         | `updateProfile`     | Mutation | Protected | Update profile      |
| `user`         | `updatePreferences` | Mutation | Protected | Update preferences  |
| `user`         | `updateSettings`    | Mutation | Protected | Update settings     |
| `user`         | `deleteAccount`     | Mutation | Protected | Delete account      |
| `subscription` | `getCurrent`        | Query    | Protected | Get subscription    |
| `subscription` | `getPlans`          | Query    | Public    | List plans          |
| `subscription` | `createCheckout`    | Mutation | Protected | Create checkout     |
| `subscription` | `cancel`            | Mutation | Protected | Cancel subscription |
| `coins`        | `getBalance`        | Query    | Protected | Get coin balance    |
| `coins`        | `getTransactions`   | Query    | Protected | List transactions   |
| `coins`        | `getPacks`          | Query    | Public    | List coin packs     |
| `coins`        | `purchasePack`      | Mutation | Protected | Purchase coins      |
| `tools`        | `list`              | Query    | Public    | List tools          |
| `tools`        | `get`               | Query    | Public    | Get tool            |
| `tools`        | `execute`           | Mutation | Protected | Execute tool        |
| `tools`        | `getJobStatus`      | Query    | Protected | Get job status      |
| `apiKeys`      | `list`              | Query    | Protected | List API keys       |
| `apiKeys`      | `create`            | Mutation | Protected | Create API key      |
| `apiKeys`      | `revoke`            | Mutation | Protected | Revoke API key      |
| `admin.*`      | Various             | Various  | Admin     | Admin operations    |

---

## Appendix B: REST API Endpoint Reference

| Method  | Endpoint                     | Auth    | Description      |
|-------- |----------                    |------   |-------------     |
| GET     | `/api/v1/tools`              | API Key | List tools       |
| GET     | `/api/v1/tools/:key`         | API Key | Get tool         |
| POST    | `/api/v1/tools/:key/execute` | API Key | Execute tool     |
| GET     | `/api/v1/jobs/:id`           | API Key | Get job status   |
| GET     | `/api/v1/jobs/:id/result`    | API Key | Get job result   |
| GET     | `/api/v1/account`            | API Key | Get account info |
| GET     | `/api/v1/account/usage`      | API Key | Get usage stats  |
| GET     | `/api/v1/health`             | None    | Health check     |

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [01_PRODUCT_REQUIREMENTS.md](01_PRODUCT_REQUIREMENTS.md) | Feature matrix, monetization |
| [02_USER_ROLES_PERMISSIONS.md](02_USER_ROLES_PERMISSIONS.md) | RBAC permissions, plan access |
| [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md) | Service communication, data flows |
| [13_DATABASE_SCHEMA.md](13_DATABASE_SCHEMA.md) | Data models, API key storage |
| 21_BILLING_LOGIC.md | Payment flows, subscription handling |
| 15_SECURITY_MODEL.md | Authentication, authorization details |

---

*This document defines API contracts for HSAFX WORLD. Implementation details may vary; this serves as the specification.*