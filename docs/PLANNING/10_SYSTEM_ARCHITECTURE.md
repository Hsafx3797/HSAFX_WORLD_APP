# 03 — System Architecture

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 3, 2026  
**Status:** ✅ APPROVED — Decisions Frozen

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `00_PRODUCT_REQUIREMENTS`, `13_DATABASE_SCHEMA`, and `14_API_CONTRACTS`.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Service Topology](#2-service-topology)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Data Flow Patterns](#5-data-flow-patterns)
6. [External Service Integration](#6-external-service-integration)
7. [Caching Strategy](#7-caching-strategy)
8. [Background Job Orchestration](#8-background-job-orchestration)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Observability & Monitoring](#10-observability--monitoring)
11. [Security Architecture](#11-security-architecture)
12. [Scalability Considerations](#12-scalability-considerations)

---

## 1. Architecture Overview

### 1.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│   │  User App   │    │ Admin Panel │    │  API Users  │                     │
│   │  (Next.js)  │    │  (Next.js)  │    │  (REST)     │                     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
│          │                  │                  │                            │
└──────────┼──────────────────┼──────────────────┼────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE / CDN LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│   Vercel Edge Network / Cloudflare                                          │
│   • Static asset caching                                                    │
│   • Edge middleware (rate limiting, geo-routing)                            │
│   • DDoS protection                                                         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                    NEXT.JS BACKEND (Primary)                      │     │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │     │
│   │  │   tRPC      │  │   REST API  │  │  Webhooks   │                │     │
│   │  │   Router    │  │   Routes    │  │  Handlers   │                │     │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │     │
│   │         │                │                │                       │     │
│   │         └────────────────┼────────────────┘                       │     │
│   │                          ▼                                        │     │
│   │  ┌─────────────────────────────────────────────────────────────┐  │     │
│   │  │                   SHARED SERVICES                           │  │     │
│   │  │  • Auth (Better-Auth)  • Billing Logic  • Permission Engine │  │     │
│   │  │  • Usage Tracking      • Coin Ledger    • Audit Logging     │  │     │
│   │  └─────────────────────────────────────────────────────────────┘  │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                   │                                         │
│                                   │ Internal calls                          │
│                                   ▼                                         │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                    FASTAPI BACKEND (Secondary)                    │     │
│   │  • AI/ML Processing       • OCR (Tesseract)                       │     │
│   │  • Media Processing       • Native Binary Orchestration           │     │
│   │  • Heavy Computation      • Async Job Execution                   │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    Neon     │  │   Redis     │  │ Cloudflare  │  │ Meilisearch │        │
│   │ (PostgreSQL)│  │  (Cache +   │  │     R2      │  │  (Search)   │        │
│   │             │  │   Queues)   │  │  (Storage)  │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Edge-first** | Compute at the edge where possible (Vercel Edge, WASM) |
| **Shared backend** | Single backend serves both User App and Admin Panel |
| **Polyglot by necessity** | Use the right language for the job (TS, Python, Rust) |
| **Stateless services** | All state in database/cache, services are disposable |
| **Event-driven** | Async processing via webhooks and background jobs |
| **Defense in depth** | Multiple security layers, never trust a single boundary |

> **⚠️ Invariant: Stateless & Idempotent**  
> Next.js is used as a *server-side application runtime*, not a traditional long-running backend.  
> All business logic must be **stateless, idempotent, and safe for re-execution**.  
> Never store state in memory across requests; always use database or Redis.

### 1.3 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React 19, Tailwind v4 | User App + Admin Panel |
| **API Layer** | tRPC + Zod, REST (Next.js API Routes) | Type-safe RPC + Public API |
| **Primary Backend** | Next.js 15 (Node.js) | Business logic, auth, billing |
| **Secondary Backend** | FastAPI (Python) | AI/ML, media processing |
| **Client Compute** | Rust → WASM | Text tools, calculators |
| **Native Binaries** | FFmpeg, libvips, Poppler, Tesseract | Media/document processing |
| **Database** | Neon (PostgreSQL) | Primary data store |
| **Cache** | Redis (Upstash) | Session, rate limits, queues |
| **Object Storage** | Cloudflare R2 | File uploads (temporary) |
| **Search** | Meilisearch | Tool search, full-text |
| **Background Jobs** | Inngest | Workflow orchestration |
| **Auth** | Better-Auth | Session management, OAuth |
| **Billing** | Polar + Stripe | Subscriptions + payments |

---

## 2. Service Topology

### 2.1 Service Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE RESPONSIBILITY MATRIX                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      NEXT.JS BACKEND                                │    │
│  │  Responsibilities:                                                  │    │
│  │  ✓ Authentication & session management                              │   │
│  │  ✓ Authorization (plan-based + RBAC)                                │   │
│  │  ✓ Billing logic & subscription state                               │   │
│  │  ✓ Coin ledger operations                                           │   │
│  │  ✓ Usage tracking & limit enforcement                               │   │
│  │  ✓ API key management                                               │   │
│  │  ✓ Webhook handling (Polar, Stripe)                                 │   │
│  │  ✓ Tool orchestration (dispatch to appropriate processor)           │   │
│  │  ✓ Audit logging                                                    │   │
│  │  ✓ Admin panel endpoints                                            │   │
│  │                                                                     │    │
│  │  Does NOT do:                                                       │    │
│  │  ✗ Heavy computation                                                │   │
│  │  ✗ Binary file processing                                           │   │
│  │  ✗ AI/ML inference                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      FASTAPI BACKEND                                │    │
│  │  Responsibilities:                                                  │    │
│  │  ✓ Media processing (video, audio, image)                           │   │
│  │  ✓ Document conversion (PDF, DOCX, etc.)                            │   │
│  │  ✓ OCR (Tesseract)                                                  │   │
│  │  ✓ AI/ML inference (if added later)                                 │   │
│  │  ✓ Native binary orchestration (FFmpeg, libvips, Poppler)           │   │
│  │  ✓ Async scraping (container tracking)                              │   │
│  │                                                                     │    │
│  │  Does NOT do:                                                       │    │
│  │  ✗ Authentication (trusts internal calls)                           │   │
│  │  ✗ Billing/subscription logic                                       │   │
│  │  ✗ Database writes (PostgreSQL never touched by FastAPI)            │   │
│  │  ✗ Direct client-facing endpoints                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  **FastAPI Job Status Rule:**                                               │
│  FastAPI writes job status to **Redis only** (not PostgreSQL).              │
│  Next.js is notified via callback webhook when job completes.               │
│  Final results are persisted to DB by Next.js, not FastAPI.                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      WASM MODULES (Client)                          │    │
│  │  Responsibilities:                                                  │    │
│  │  ✓ Text transformations (case, encoding, formatting)                │   │
│  │  ✓ Pure calculations (BMI, GPA, converters)                         │   │
│  │  ✓ Client-side validation                                           │   │
│  │  ✓ Real-time previews                                               │   │
│  │                                                                     │    │
│  │  Does NOT do:                                                       │    │
│  │  ✗ Network requests                                                 │   │
│  │  ✗ File system access                                               │   │
│  │  ✗ Sensitive operations                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Inter-Service Communication

| From | To | Protocol | Auth | Use Case |
|------|-----|----------|------|----------|
| User App | Next.js Backend | tRPC (HTTP) | Session cookie | All user operations |
| Admin Panel | Next.js Backend | tRPC (HTTP) | Session cookie | Admin operations |
| API Users | Next.js Backend | REST (HTTP) | API key | B2B integrations |
| Next.js Backend | FastAPI | HTTP (internal) | Shared secret | Processing jobs |
| Next.js Backend | Inngest | HTTP | Signing key | Background jobs |
| Polar/Stripe | Next.js Backend | Webhook (HTTP) | Signature verification | Billing events |
| Next.js Backend | Neon | PostgreSQL (TCP) | Connection string | Data persistence |
| Next.js Backend | Redis | Redis protocol | Password | Cache/sessions |
| FastAPI | Redis | Redis protocol | Password | Job queues |
| FastAPI | R2 | S3 API (HTTP) | Access keys | File storage |

### 2.3 Service Discovery

For MVP, services communicate via **static configuration**:

```typescript
// config/services.ts
export const SERVICES = {
  fastapi: {
    baseUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
    secret: process.env.INTERNAL_SERVICE_SECRET,
  },
  inngest: {
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
  },
} as const;
```

---

## 3. Frontend Architecture

### 3.1 Application Structure

```
apps/
├── web/                          # User-facing application
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (login, register)
│   │   ├── (dashboard)/          # Protected user dashboard
│   │   ├── (tools)/              # Tool pages
│   │   │   ├── [category]/
│   │   │   │   └── [tool]/
│   │   │   │       └── page.tsx
│   │   ├── api/                  # API routes
│   │   │   ├── trpc/
│   │   │   ├── webhooks/
│   │   │   └── public/           # Public REST API
│   │   └── layout.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│
└── admin/                        # Admin panel application
    ├── app/
    │   ├── (auth)/
    │   ├── (dashboard)/
    │   │   ├── users/
    │   │   ├── subscriptions/
    │   │   ├── tools/
    │   │   ├── analytics/
    │   │   └── settings/
    │   └── layout.tsx
    ├── components/
    └── lib/
```

### 3.2 State Management

| State Type | Solution | Scope |
|------------|----------|-------|
| Server state | TanStack Query (via tRPC) | API data, caching |
| Client state | Zustand | UI state, preferences |
| Form state | React Hook Form + Zod | Form validation |
| URL state | Next.js searchParams | Filters, pagination |
| Auth state | Better-Auth React hooks | Session, user |
| Permission state | CASL | UI enforcement |

### 3.3 WASM Integration

```typescript
// lib/wasm/loader.ts
import init, { transform_text } from '@hsafx/text-tools-wasm';

let wasmInitialized = false;

export async function ensureWasmLoaded() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

// Usage in component
export function useTextTransform(input: string, operation: string) {
  const [result, setResult] = useState('');
  
  useEffect(() => {
    ensureWasmLoaded().then(() => {
      const output = transform_text(input, operation);
      setResult(output);
    });
  }, [input, operation]);
  
  return result;
}
```

### 3.4 Tool Execution Flow (Client-Side)

```
┌──────────────────────────────────────────────────────────────┐
│                    TOOL EXECUTION FLOW                        │
└──────────────────────────────────────────────────────────────┘

User Input
    │
    ▼
┌─────────────────┐
│ Check Tool Type │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ WASM  │ │Server │
│ Tool  │ │ Tool  │
└───┬───┘ └───┬───┘
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │ Check Plan/Limit│
    │    └────────┬────────┘
    │             │
    │        ┌────┴────┐
    │        │         │
    │        ▼         ▼
    │    ┌───────┐ ┌───────┐
    │    │Allowed│ │ Limit │
    │    │       │ │Reached│
    │    └───┬───┘ └───┬───┘
    │        │         │
    │        │         ▼
    │        │    ┌─────────────┐
    │        │    │ Coin Prompt │
    │        │    └──────┬──────┘
    │        │           │
    │        │      ┌────┴────┐
    │        │      │         │
    │        │      ▼         ▼
    │        │  ┌───────┐ ┌───────┐
    │        │  │  Pay  │ │Cancel │
    │        │  │ Coins │ │       │
    │        │  └───┬───┘ └───────┘
    │        │      │
    │        ▼      ▼
    │    ┌─────────────────┐
    │    │ Execute on      │
    │    │ Server/FastAPI  │
    │    └────────┬────────┘
    │             │
    ▼             ▼
┌─────────────────────────────┐
│      Return Result          │
│  (Update usage counter)     │
└─────────────────────────────┘
```

---

## 4. Backend Architecture

### 4.1 Next.js Backend Structure

```
apps/web/
├── app/
│   └── api/
│       ├── trpc/
│       │   └── [trpc]/
│       │       └── route.ts      # tRPC handler
│       ├── webhooks/
│       │   ├── polar/
│       │   │   └── route.ts      # Polar webhooks
│       │   └── stripe/
│       │       └── route.ts      # Stripe webhooks
│       └── v1/                   # Public REST API
│           ├── tools/
│           │   └── [toolId]/
│           │       └── route.ts
│           └── health/
│               └── route.ts
│
packages/
├── api/                          # Shared API logic
│   ├── src/
│   │   ├── routers/              # tRPC routers
│   │   │   ├── auth.ts
│   │   │   ├── tools.ts
│   │   │   ├── billing.ts
│   │   │   ├── users.ts
│   │   │   ├── admin.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── planAccess.ts
│   │   │   └── rbac.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── coin.service.ts
│   │   │   ├── tool.service.ts
│   │   │   └── usage.service.ts
│   │   └── trpc.ts               # tRPC setup
│   └── package.json
│
├── db/                           # Database package
│   ├── src/
│   │   ├── schema/               # Drizzle schema
│   │   ├── migrations/
│   │   └── index.ts
│   └── package.json
│
└── shared/                       # Shared utilities
    ├── src/
    │   ├── types/
    │   ├── constants/
    │   └── utils/
    └── package.json
```

### 4.2 tRPC Router Structure

```typescript
// packages/api/src/routers/index.ts
import { router } from '../trpc';
import { authRouter } from './auth';
import { toolsRouter } from './tools';
import { billingRouter } from './billing';
import { usersRouter } from './users';
import { adminRouter } from './admin';
import { coinsRouter } from './coins';

export const appRouter = router({
  auth: authRouter,
  tools: toolsRouter,
  billing: billingRouter,
  users: usersRouter,
  admin: adminRouter,
  coins: coinsRouter,
});

export type AppRouter = typeof appRouter;
```

### 4.3 FastAPI Backend Structure

```
backend/
├── python/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── config.py             # Configuration
│   │   ├── dependencies.py       # Dependency injection
│   │   ├── routers/
│   │   │   ├── media.py          # Media processing routes
│   │   │   ├── documents.py      # Document conversion routes
│   │   │   ├── ocr.py            # OCR routes
│   │   │   └── scraping.py       # Container tracking routes
│   │   ├── services/
│   │   │   ├── ffmpeg.py         # FFmpeg wrapper
│   │   │   ├── imagemagick.py    # Image processing
│   │   │   ├── poppler.py        # PDF processing
│   │   │   ├── tesseract.py      # OCR service
│   │   │   └── libreoffice.py    # Document conversion
│   │   ├── workers/
│   │   │   └── job_processor.py  # Background job handler
│   │   └── utils/
│   │       ├── file_handling.py
│   │       └── validation.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── rust/                         # WASM source
│   ├── text-tools/
│   │   ├── src/
│   │   │   └── lib.rs
│   │   ├── Cargo.toml
│   │   └── build.sh              # WASM build script
│   └── calculators/
│       ├── src/
│       │   └── lib.rs
│       └── Cargo.toml
│
└── native/                       # Native binary configs
    ├── ffmpeg/
    │   └── presets.json
    └── imagemagick/
        └── policies.xml
```

### 4.4 Internal API Contract (Next.js → FastAPI)

```typescript
// All FastAPI endpoints are internal-only
// Authentication via shared secret header

interface FastAPIRequest {
  headers: {
    'X-Internal-Secret': string;
    'X-Request-Id': string;
    'X-User-Id'?: string;
  };
}

// Example: Media processing
interface MediaProcessRequest {
  input_url: string;           // R2 signed URL
  output_format: string;
  options: Record<string, any>;
  callback_url: string;        // Webhook for completion
}

interface MediaProcessResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  output_url?: string;
  error?: string;
}
```

---

## 5. Data Flow Patterns

### 5.1 Tool Execution (Server-Side)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE TOOL EXECUTION                             │
└──────────────────────────────────────────────────────────────────────────┘

 Client                Next.js Backend              FastAPI           R2
    │                        │                         │              │
    │  1. Execute Tool       │                         │              │
    │───────────────────────>│                         │              │
    │                        │                         │              │
    │                        │ 2. Validate session     │              │
    │                        │    Check plan access    │              │
    │                        │    Check usage limits   │              │
    │                        │                         │              │
    │                        │ 3. Upload file          │              │
    │                        │─────────────────────────┼─────────────>│
    │                        │                         │              │
    │                        │ 4. Get signed URL       │              │
    │                        │<────────────────────────┼──────────────│
    │                        │                         │              │
    │                        │ 5. Request processing   │              │
    │                        │────────────────────────>│              │
    │                        │                         │              │
    │                        │                         │ 6. Download  │
    │                        │                         │    input     │
    │                        │                         │<─────────────│
    │                        │                         │              │
    │                        │                         │ 7. Process   │
    │                        │                         │    (FFmpeg)  │
    │                        │                         │              │
    │                        │                         │ 8. Upload    │
    │                        │                         │    output    │
    │                        │                         │─────────────>│
    │                        │                         │              │
    │                        │ 9. Job complete webhook │              │
    │                        │<────────────────────────│              │
    │                        │                         │              │
    │                        │ 10. Update usage        │              │
    │                        │     Deduct coins (if)   │              │
    │                        │                         │              │
    │ 11. Return result URL  │                         │              │
    │<───────────────────────│                         │              │
    │                        │                         │              │
```

### 5.2 Webhook Processing (Polar/Stripe)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK PROCESSING FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

 Polar/Stripe          Next.js Backend                Database
      │                       │                          │
      │  1. Webhook event     │                          │
      │──────────────────────>│                          │
      │                       │                          │
      │                       │ 2. Verify signature      │
      │                       │                          │
      │                       │ 3. Parse event type      │
      │                       │                          │
      │                       │ 4. Idempotency check     │
      │                       │─────────────────────────>│
      │                       │<─────────────────────────│
      │                       │                          │
      │                       │ 5. Process event:        │
      │                       │    - subscription.created│
      │                       │    - subscription.updated│
      │                       │    - payment.succeeded   │
      │                       │    - payment.failed      │
      │                       │                          │
      │                       │ 6. Update DB             │
      │                       │─────────────────────────>│
      │                       │                          │
      │                       │ 7. Record webhook log    │
      │                       │─────────────────────────>│
      │                       │                          │
      │  8. ACK (200 OK)      │                          │
      │<──────────────────────│                          │
      │                       │                          │
```

> **⚠️ Invariant: Webhook Idempotency Key**  
> The idempotency key for webhook processing is the **provider's event ID**:  
> - Stripe: `event.id` (e.g., `evt_1234567890`)  
> - Polar: `id` from webhook payload  
>
> This key is stored in `webhook_logs.provider_event_id` and checked before processing.

### 5.3 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW (OAuth)                           │
└──────────────────────────────────────────────────────────────────────────┘

 Client           Next.js Backend         Better-Auth        OAuth Provider
    │                   │                      │                    │
    │ 1. Click OAuth    │                      │                    │
    │──────────────────>│                      │                    │
    │                   │                      │                    │
    │                   │ 2. Generate state    │                    │
    │                   │─────────────────────>│                    │
    │                   │                      │                    │
    │ 3. Redirect to provider                  │                    │
    │<─────────────────────────────────────────┼───────────────────>│
    │                   │                      │                    │
    │ 4. User authorizes│                      │                    │
    │──────────────────────────────────────────┼───────────────────>│
    │                   │                      │                    │
    │ 5. Callback with code                    │                    │
    │──────────────────>│                      │                    │
    │                   │                      │                    │
    │                   │ 6. Exchange code     │                    │
    │                   │─────────────────────────────────────────> │
    │                   │                      │                    │
    │                   │ 7. Get user info     │                    │
    │                   │<───────────────────────────────────────── │
    │                   │                      │                    │
    │                   │ 8. Create/update user│                    │
    │                   │      Create session  │                    │
    │                   │─────────────────────>│                    │
    │                   │                      │                    │
    │ 9. Set session cookie                    │                    │
    │<──────────────────│                      │                    │
    │                   │                      │                    │
    │ 10. Redirect to app                      │                    │
    │<──────────────────│                      │                    │
    │                   │                      │                    │
```

---

## 6. External Service Integration

### 6.1 Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICE INTEGRATIONS                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   HSAFX WORLD   │
                              │    Backend      │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌───────────────┐
│    BILLING    │            │ INFRASTRUCTURE  │            │   ANALYTICS   │
├───────────────┤            ├─────────────────┤            ├───────────────┤
│               │            │                 │            │               │
│  ┌─────────┐  │            │  ┌───────────┐  │            │  ┌─────────┐  │
│  │  Polar  │  │            │  │   Neon    │  │            │  │Plausible│  │
│  │(Billing)│  │            │  │(Database) │  │            │  │         │  │
│  └─────────┘  │            │  └───────────┘  │            │  └─────────┘  │
│               │            │                 │            │               │
│  ┌─────────┐  │            │  ┌───────────┐  │            │  ┌─────────┐  │
│  │ Stripe  │  │            │  │  Upstash  │  │            │  │  Umami  │  │
│  │(Payment)│  │            │  │  (Redis)  │  │            │  │         │  │
│  └─────────┘  │            │  └───────────┘  │            │  └─────────┘  │
│               │            │                 │            │               │
└───────────────┘            │  ┌───────────┐  │            └───────────────┘
                             │  │Cloudflare │  │
                             │  │    R2     │  │
                             │  └───────────┘  │
                             │                 │
                             │  ┌───────────┐  │
                             │  │Meilisearch│  │
                             │  │           │  │
                             │  └───────────┘  │
                             │                 │
                             │  ┌───────────┐  │
                             │  │  Inngest  │  │
                             │  │  (Jobs)   │  │
                             │  └───────────┘  │
                             │                 │
                             └─────────────────┘
```

> **⚠️ Invariant: Analytics Separation**  
> Analytics tools (Plausible, Umami) are **passive observers only**.  
> They **never** participate in:
> - Rate limiting decisions
> - Billing/coin deduction logic
> - Access control or feature gating
>
> Analytics data may be used for dashboards and reporting but is **never authoritative** for enforcement.

### 6.2 Service Configuration

| Service | SDK/Client | Configuration |
|---------|------------|---------------|
| **Polar** | `@polar-sh/sdk` | Webhook secret, API key |
| **Stripe** | `stripe` | Secret key, webhook secret |
| **Neon** | `@neondatabase/serverless` | Connection string |
| **Upstash Redis** | `@upstash/redis` | REST URL, token |
| **Cloudflare R2** | `@aws-sdk/client-s3` | Account ID, access keys |
| **Meilisearch** | `meilisearch` | Host URL, API key |
| **Inngest** | `inngest` | Event key, signing key |
| **Better-Auth** | `better-auth` | Secret, OAuth configs |
| **Google AdSense** | Client-side script | Publisher ID |

### 6.3 Webhook Endpoints

| Provider | Endpoint | Events Handled |
|----------|----------|----------------|
| **Polar** | `/api/webhooks/polar` | `subscription.*`, `checkout.*` |
| **Stripe** | `/api/webhooks/stripe` | `payment_intent.*`, `invoice.*` |
| **Inngest** | `/api/inngest` | Job completions |

---

## 7. Caching Strategy

### 7.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │           CLIENT                │
                    │  • React Query cache (memory)   │
                    │  • Service Worker (optional)    │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │         CDN / EDGE              │
                    │  • Static assets (immutable)    │
                    │  • Tool metadata (5 min)        │
                    │  • Plan definitions (1 hour)    │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │           REDIS                 │
                    │  • Session data (24 hours)      │
                    │  • Rate limit counters (window) │
                    │  • Usage counters (daily reset) │
                    │  • Plan feature cache (1 hour)  │
                    │  • Permission cache (5 min)     │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │         DATABASE                │
                    │  • Source of truth              │
                    │  • Connection pooling (Neon)    │
                    └─────────────────────────────────┘
```

### 7.2 Cache Invalidation Strategy

| Cache Type | Invalidation Trigger | Strategy |
|------------|---------------------|----------|
| Session | Logout, password change | Explicit delete |
| Rate limits | Time window expires | TTL-based |
| Usage counters | Daily/monthly reset | Scheduled job |
| Plan features | Plan config update | Pub/sub broadcast |
| Permissions | Role assignment change | Explicit delete |
| Tool metadata | Tool config update | Versioned keys |

### 7.3 Redis Key Schema

```typescript
// Key naming convention: {namespace}:{entity}:{id}:{subkey}

const REDIS_KEYS = {
  // Sessions
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  
  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  userRateLimit: (userId: string, resource: string) => `ratelimit:user:${userId}:${resource}`,
  
  // Usage counters
  usageDaily: (userId: string, resource: string, date: string) => 
    `usage:${userId}:${resource}:daily:${date}`,
  usageMonthly: (userId: string, resource: string, month: string) => 
    `usage:${userId}:${resource}:monthly:${month}`,
  
  // Caches
  planFeatures: (planId: string) => `cache:plan:${planId}:features`,
  planLimits: (planId: string) => `cache:plan:${planId}:limits`,
  userPermissions: (userId: string) => `cache:user:${userId}:permissions`,
  toolConfig: (toolId: string, version: number) => `cache:tool:${toolId}:v${version}`,
  
  // Locks
  coinLock: (userId: string) => `lock:coins:${userId}`,
  
  // Pub/Sub channels
  cacheInvalidation: 'channel:cache:invalidation',
} as const;
```

> **⚠️ Invariant: Coin Lock Order**  
> When deducting coins, the order is **always**:  
> 1. Acquire Redis lock (`coinLock`)  
> 2. Begin DB transaction  
> 3. Insert ledger entry (immutable)  
> 4. Commit transaction  
> 5. Release Redis lock  
>
> This ensures atomic deduction and prevents double-spend in concurrent requests.

**Lock Implementation Example:**

```typescript
// lib/redis/locks.ts
import { redis } from './client';

const LOCK_TTL = 10; // seconds - prevents deadlocks if process crashes
const LOCK_RETRY_DELAY = 50; // ms
const MAX_LOCK_ATTEMPTS = 20;

export async function acquireCoinLock(userId: string): Promise<string | null> {
  const lockKey = `lock:coins:${userId}`;
  const lockValue = crypto.randomUUID(); // Unique token for this lock acquisition
  
  for (let attempt = 0; attempt < MAX_LOCK_ATTEMPTS; attempt++) {
    // SET NX (only if not exists) with TTL
    const acquired = await redis.set(lockKey, lockValue, {
      nx: true, // Only set if key doesn't exist
      ex: LOCK_TTL // Expire after TTL seconds
    });
    
    if (acquired === 'OK') {
      return lockValue; // Lock acquired successfully
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY));
  }
  
  // Could not acquire lock after max attempts
  throw new Error(`Failed to acquire coin lock for user ${userId} after ${MAX_LOCK_ATTEMPTS} attempts`);
}

export async function releaseCoinLock(userId: string, lockValue: string): Promise<void> {
  const lockKey = `lock:coins:${userId}`;
  
  // Only delete if our lock value matches (prevents releasing someone else's lock)
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  await redis.eval(script, 1, lockKey, lockValue);
}

// Usage in coin deduction
export async function deductCoins(userId: string, amount: number) {
  const lockValue = await acquireCoinLock(userId);
  
  try {
    // Perform DB operations (transaction)
    await db.transaction(async (tx) => {
      await tx.insert(coin_transactions).values({
        user_id: userId,
        amount: -amount,
        txn_type: 'spend',
        // ...
      });
    });
  } finally {
    // Always release lock, even if transaction fails
    await releaseCoinLock(userId, lockValue);
  }
}
```

**⚠️ Critical Lock Properties:**
1. **TTL (10s):** Prevents deadlocks if process crashes before releasing
2. **Unique Token:** Prevents accidental release of locks acquired by other processes
3. **Lua Script:** Atomic check-and-delete to avoid race conditions on release
4. **Always in try/finally:** Guarantees lock release even on errors

```typescript
// Continuation of key schema or related code
```

---

## 8. Background Job Orchestration

### 8.1 Inngest Integration

```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'hsafx-world',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types
export interface Events {
  'tool/execute': { userId: string; toolId: string; input: unknown };
  'billing/subscription.updated': { userId: string; subscriptionId: string };
  'usage/reset.daily': { date: string };
  'usage/reset.monthly': { month: string };
  'cleanup/expired-files': { olderThan: Date };
  'analytics/aggregate.daily': { date: string };
}
```

### 8.2 Job Definitions

```typescript
// lib/inngest/functions/usage-reset.ts
import { inngest } from '../client';

export const dailyUsageReset = inngest.createFunction(
  { id: 'daily-usage-reset' },
  { cron: '0 0 * * *' }, // Midnight UTC
  async ({ step }) => {
    await step.run('reset-daily-counters', async () => {
      // Reset all daily usage counters in Redis
      await resetDailyUsageCounters();
    });
    
    await step.run('archive-yesterday', async () => {
      // Archive yesterday's usage to database
      await archiveUsageData('daily');
    });
  }
);

export const monthlyUsageReset = inngest.createFunction(
  { id: 'monthly-usage-reset' },
  { cron: '0 0 1 * *' }, // First of month, midnight UTC
  async ({ step }) => {
    await step.run('reset-monthly-counters', async () => {
      await resetMonthlyUsageCounters();
    });
    
    await step.run('generate-monthly-report', async () => {
      await generateMonthlyUsageReport();
    });
  }
);
```

### 8.3 Job Types

| Job Type | Trigger | Execution | Retries |
|----------|---------|-----------|---------|
| Tool execution (heavy) | API request | Async | 3 |
| Webhook processing | External event | Sync (fast) | 5 |
| Usage reset | Cron schedule | Scheduled | 3 |
| File cleanup | Cron schedule | Scheduled | 3 |
| Analytics aggregation | Cron schedule | Scheduled | 3 |
| Email notifications | Event-driven | Async | 5 |

---

## 9. Deployment Architecture

### 9.1 Environment Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT ENVIRONMENTS                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │   Vercel    │     │  Fly.io /   │     │    Neon     │                    │
│  │  (Next.js)  │     │  Railway    │     │ (Database)  │                    │
│  │             │     │  (FastAPI)  │     │             │                    │
│  │  • User App │     │             │     │  • Primary  │                    │
│  │  • Admin    │     │  • Media    │     │  • Read     │                    │
│  │  • API      │     │    process  │     │    replica  │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │   Upstash   │     │ Cloudflare  │     │ Meilisearch │                    │
│  │   (Redis)   │     │    R2       │     │   Cloud     │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           STAGING                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Vercel Preview (per PR)                                                  │
│  • Shared FastAPI staging instance                                          │
│  • Neon branch database                                                     │
│  • Separate Redis namespace                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Local Next.js (pnpm dev)                                                 │
│  • Local FastAPI (uvicorn)                                                  │
│  • Local PostgreSQL (Docker) or Neon branch                                 │
│  • Local Redis (Docker) or Upstash                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Deployment Pipeline

```yaml
# .github/workflows/deploy.yml (simplified)
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm typecheck

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      # Deploy FastAPI to Fly.io
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend/python
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### 9.3 Infrastructure as Code

```hcl
# infra/terraform/main.tf (example structure)

# Neon Database
resource "neon_project" "main" {
  name = "hsafx-world"
  
  branch {
    name = "main"
    role_name = "hsafx_app"
  }
}

# Upstash Redis
resource "upstash_redis_database" "main" {
  database_name = "hsafx-world"
  region        = "us-east-1"
  tls           = true
}

# Cloudflare R2 Bucket
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "hsafx-uploads"
  location   = "enam"
}
```

---

## 10. Observability & Monitoring

### 10.1 Logging Strategy

| Log Level | Use Case | Retention |
|-----------|----------|-----------|
| `error` | Exceptions, failures | 30 days |
| `warn` | Degraded performance, retries | 14 days |
| `info` | Request/response, key events | 7 days |
| `debug` | Detailed execution (dev only) | 1 day |

### 10.2 Metrics Collection

```typescript
// Key metrics to track
const METRICS = {
  // Business metrics
  'tool.executions': { type: 'counter', labels: ['tool_id', 'plan', 'status'] },
  'subscription.conversions': { type: 'counter', labels: ['from_plan', 'to_plan'] },
  'coin.transactions': { type: 'counter', labels: ['type', 'source'] },
  
  // Performance metrics
  'request.duration': { type: 'histogram', labels: ['endpoint', 'method'] },
  'tool.processing_time': { type: 'histogram', labels: ['tool_id', 'processor'] },
  'db.query_duration': { type: 'histogram', labels: ['query_type'] },
  
  // System metrics
  'cache.hit_rate': { type: 'gauge', labels: ['cache_type'] },
  'queue.depth': { type: 'gauge', labels: ['queue_name'] },
  'rate_limit.rejections': { type: 'counter', labels: ['endpoint', 'reason'] },
};
```

### 10.3 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | > 1% errors in 5 min | Critical |
| API latency spike | p95 > 2s for 5 min | Warning |
| Database connection pool exhausted | Available < 5 | Critical |
| Webhook processing delayed | Queue depth > 100 | Warning |
| Disk usage high | > 80% | Warning |
| Payment webhook failures | > 3 failures in 1 hour | Critical |

### 10.4 Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Application logs | Vercel Logs / Axiom | Structured logging |
| Error tracking | Sentry | Exception monitoring |
| Uptime monitoring | Better Uptime | Health checks |
| Analytics | Plausible + Umami | User analytics |
| Database monitoring | Neon Dashboard | Query performance |
| Redis monitoring | Upstash Dashboard | Cache metrics |

---

## 11. Security Architecture

### 11.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: EDGE                                                              │
│  • DDoS protection (Cloudflare/Vercel)                                      │
│  • WAF rules                                                                │
│  • TLS termination                                                          │
│  • Geographic blocking (optional)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: RATE LIMITING                                                     │
│  • IP-based limits (abuse prevention)                                       │
│  • User-based limits (plan enforcement)                                     │
│  • Endpoint-specific limits                                                 │
│                                                                             │
│  Authority Rule:                                                            │
│  • Edge limits = best-effort, fast, may be approximate                      │
│  • Backend limits = authoritative for billing and coin deduction            │
│  • If edge passes but backend rejects → request denied (backend wins)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: AUTHENTICATION                                                    │
│  • Session validation (Better-Auth)                                         │
│  • API key validation                                                       │
│  • OAuth token verification                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: AUTHORIZATION                                                     │
│  • Plan-based access control                                                │
│  • RBAC for admin operations                                                │
│  • Resource-level permissions                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: INPUT VALIDATION                                                  │
│  • Zod schema validation                                                    │
│  • File type verification                                                   │
│  • Size limits                                                              │
│  • Sanitization                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: DATA PROTECTION                                                   │
│  • Encryption at rest (database)                                            │
│  • Encryption in transit (TLS)                                              │
│  • PII handling policies                                                    │
│  • Audit logging                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Secrets Management

| Secret Type | Storage | Rotation |
|-------------|---------|----------|
| Database credentials | Environment variables | 90 days |
| API keys (internal) | Environment variables | 90 days |
| OAuth secrets | Environment variables | Yearly |
| Webhook secrets | Environment variables | On compromise |
| Encryption keys | Environment variables | Yearly |

### 11.3 Security Headers

```typescript
// next.config.js security headers
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling Strategy

| Component | Scaling Approach | Trigger |
|-----------|-----------------|---------|
| Next.js (Vercel) | Auto-scale (serverless) | Request volume |
| FastAPI | Manual scale (Fly.io machines) | CPU/memory threshold |
| Database | Read replicas | Query load |
| Redis | Cluster mode (if needed) | Memory/connections |
| Background jobs | Worker count | Queue depth |

### 12.2 Performance Targets

| Metric | Target | Current Estimate |
|--------|--------|------------------|
| API response time (p95) | < 500ms | ~200ms |
| WASM tool execution | < 100ms | ~50ms |
| Media processing (1MB file) | < 30s | ~10s |
| Database query (simple) | < 50ms | ~20ms |
| Cache hit rate | > 90% | ~95% |

### 12.3 Future Scaling Path

```
Phase 1 (MVP):
├── Single Vercel deployment
├── Single FastAPI instance
├── Single Neon database
└── Shared Redis (Upstash)

Phase 2 (Growth):
├── Vercel Edge Functions for latency-sensitive routes
├── Multiple FastAPI instances (Fly.io auto-scale)
├── Neon read replica
└── Dedicated Redis cluster

Phase 3 (Scale):
├── Multi-region deployment
├── Database sharding (if needed)
├── CDN for processed files
└── Dedicated job processing cluster
```

---

## 13. Multi-Region Strategy

### 13.1 MVP Deployment (Single Region)

**Region:** Asia Pacific (Singapore or Mumbai)

**Rationale:**
- Target audience: Pakistan + South Asia
- Latency optimization for primary users
- Cost-effective for initial deployment
- Vercel Edge + Cloudflare CDN provides global reach

**Infrastructure:**
```
┌─────────────────────────────────────────────────────────────────┐
│                  MVP SINGLE-REGION SETUP                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Global CDN     │  Cloudflare (200+ locations worldwide)
│  (Static Assets)│  • Static assets cached globally
└────────┬────────┘  • Edge routing to nearest region
         │
         ▼
┌─────────────────┐
│  Vercel Edge    │  Global edge network
│  (Middleware)   │  • Rate limiting at edge
└────────┬────────┘  • Geo-routing
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│             ASIA REGION (Primary)                               │
├─────────────────────────────────────────────────────────────────┤
│  Next.js (Vercel)   → Neon DB (Singapore)                      │
│  FastAPI (Fly.io)   → Redis (Upstash - Asia)                   │
│  R2 Storage         → Cloudflare R2 (Asia bucket)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Expected Latency (from Pakistan):                              │
│  • Static assets: <50ms (CDN)                                   │
│  • API requests: 80-150ms (Singapore/Mumbai)                    │
│  • Database queries: 50-100ms (same region as backend)          │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Post-MVP Multi-Region Expansion

**Phase 1 Expansion (Q3 2026):**
- **Add US East region** (New York / N. Virginia)
- Target: North America + Europe traffic
- Deployment: Vercel multi-region + Neon read replica

**Phase 2 Expansion (Q1 2027):**
- **Add Europe region** (London / Frankfurt)
- Target: European traffic (GDPR compliance benefits)
- Deployment: Full regional redundancy

**Target Architecture (Multi-Region):**
```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-REGION ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Global CDN     │
                    │  (Cloudflare)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   ASIA REGION    │ │   US REGION      │ │   EU REGION      │
│   (Primary)      │ │   (Secondary)    │ │   (Secondary)    │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ Next.js (Vercel) │ │ Next.js (Vercel) │ │ Next.js (Vercel) │
│ FastAPI (Fly.io) │ │ FastAPI (Fly.io) │ │ FastAPI (Fly.io) │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │  Neon PostgreSQL (Multi-region)   │
              │  • Primary: Asia (write)          │
              │  • Read replicas: US, EU          │
              └───────────────────────────────────┘
```

### 13.3 Migration Path

**When to expand:**
1. **10,000 users reached** → Review traffic distribution
2. **>20% non-Asia traffic** → Add US region
3. **>10% EU traffic** → Add EU region (GDPR benefits)
4. **Revenue >$5k/month** → Multi-region cost justified

**Migration Steps:**
1. Set up Neon read replica in target region
2. Deploy Next.js to target region (Vercel)
3. Deploy FastAPI to target region (Fly.io)
4. Configure geo-routing (Cloudflare)
5. Monitor latency improvements
6. Gradual traffic shift (10% → 50% → 100%)

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                01_PRODUCT_REQUIREMENTS.md                       │
│                   (What we're building)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                02_USER_ROLES_PERMISSIONS.md                     │
│                   (Who can do what)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                10_SYSTEM_ARCHITECTURE.md                        │
│                    (This Document)                              │
│                   (How it's built)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ 13_DATABASE   │   │ 14_API          │   │ 15_SECURITY     │
│ _SCHEMA       │   │ _CONTRACTS      │   │ _MODEL          │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | HSAFX | 2026-01-03 | ✅ Approved |
| Architecture | — | — | ✅ Approved |

---

**Next Document:** [13_DATABASE_SCHEMA.md](./13_DATABASE_SCHEMA.md)