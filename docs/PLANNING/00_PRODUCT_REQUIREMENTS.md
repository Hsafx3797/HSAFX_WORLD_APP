# 00 — Product Requirements Document (PRD)

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 3, 2026  
**Status:** ✅ APPROVED — Decisions Frozen

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `10_SYSTEM_ARCHITECTURE`, `13_DATABASE_SCHEMA`, and `21_BILLING_LOGIC`.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Architectural Invariants](#2-architectural-invariants)
3. [Target Audience](#3-target-audience)
4. [User Personas](#4-user-personas)
5. [Product Scope](#5-product-scope)
6. [Feature Matrix by Plan](#6-feature-matrix-by-plan)
7. [Tool Categories](#7-tool-categories)
8. [Monetization Model](#8-monetization-model)
9. [Success Metrics](#9-success-metrics)
10. [Explicit Non-Goals](#10-explicit-non-goals)
11. [Dependencies & Assumptions](#11-dependencies--assumptions)
12. [Glossary](#12-glossary)

---

## 1. Product Vision

### 1.1 One-Line Description

> **A unified platform that consolidates hundreds of professional tools into a single window — eliminating the need to visit multiple websites for text manipulation, data conversion, media processing, document generation, and utility calculators.**

### 1.2 Problem Statement

Professionals (students, freelancers, employees) currently:
- Visit 10+ different websites for common tasks (PDF tools, image conversion, text manipulation, etc.)
- Deal with inconsistent UIs, varying quality, and scattered bookmarks
- Face fragmented pricing — paying for multiple subscriptions across tools
- Risk privacy concerns uploading files to unknown services

### 1.3 Solution

HSAFX WORLD aggregates **all these tools into one trusted platform** with:
- Consistent, high-quality UI/UX
- Unified billing (subscription + pay-as-you-go coins)
- Privacy-first design (client-side processing where possible)
- Professional-grade output quality

### 1.4 Competitive Positioning

| Competitor   | Focus                  | Our Differentiation                               |
|------------  |-------                 |---------------------                              |
| iLovePDF     | PDF only               | We cover ALL file types + text + code + utilities |
| CloudConvert | File conversion        | We include generators, calculators, and dev tools |
| SmallPDF     | PDF + limited tools    | We aim to offer hundreds of tools over time (MVP targets curated subset) |
| TinyPNG      | Image compression only | We do full image suite + video + audio            |
| ClickUp      | Project management     | We focus on **utility tools**, not collaboration  |

**Core differentiator:** One window to compete with many.

### 1.5 Business Model

| Revenue Stream      | Description                                               |
|----------------     |-------------                                              |
| **Subscriptions**   | Monthly/yearly plans (Free, Pro, Advance)                 |
| **Coins**           | Pay-as-you-go credits for usage beyond limits             |
| **Ad-earned coins** | Users watch ads to earn coins (engagement + monetization) |
| **API Access**      | B2B customers access tools programmatically               |

---

## 2. Architectural Invariants

> **These are non-negotiable principles that ALL subsequent documents must respect.**

| # | Invariant                                                  | Rationale                                                                |
|---|-----------                                                 |-----------                                                               |
| 1 | **Subscription state is derived, never manually set**      | Computed from `trial_ends_at`, `current_period_end`, `canceled_at`, etc. |
| 2 | **Ledger data is immutable**                               | Coin transactions, audit logs, payment records are append-only           |
| 3 | **External providers are inputs, not sources of truth**    | Polar/Stripe inform our DB via webhooks; we don't query them at runtime  |
| 4 | **Plans control features; permissions never bypass plans** | Admin RBAC is separate from plan-based access control                    |
| 5 | **Client-side execution is preferred where possible**      | WASM tools run in browser = zero server cost, instant response           |
| 6 | **Abuse prevention and analytics are separate systems**    | Security logic must never pollute product analytics                      |
| 7 | **Auth tables are owned by us, not Better-Auth**           | Custom schema with Better-Auth adapter for full control                  |
| 8 | **Usage enforcement is deterministic and server-verifiable** | Prevents client-side bypass, ensures billing correctness                 |

---

## 3. Target Audience

### 3.1 Primary Segments

| Segment                   | Description                               | Key Needs                                     |
|---------                  |-------------                              |-----------                                    |
| **Students**              | University/college students, researchers  | Free tier, document tools, text manipulation  |
| **Freelancers**           | Designers, writers, developers            | Media conversion, bulk operations, API access |
| **Office Employees**      | Corporate workers, assistants             | PDF tools, data conversion, cheque generation |
| **Small Business Owners** | Entrepreneurs, startups                   | All tools, priority support, high limits      |

### 3.2 Market Approach

| Channel           | Priority                                 |
|---------          |----------                                |
| **B2C (Web App)** | Primary — individual users               |
| **B2B (API)**     | Secondary — businesses integrating tools |

### 3.3 Geographic Focus

- Initial: Global (English)
- Future: Localization for high-traffic regions

---

## 4. User Personas

### 4.1 Guest (Unauthenticated)

| Attribute      | Value                                    |
|-----------     |-------                                   |
| **Access**     | Limited subset of tools                  |
| **Limits**     | Per-tool daily limits (very restrictive) |
| **Tracking**   | Anonymous session (no PII stored)        |
| **Goal**       | Experience value → convert to Free       |
| **Coin Usage** | ❌ Not available                         |

### 4.2 Free (Authenticated, $0/month)

| Attribute      | Value                            |
|-----------     |-------                           |
| **Access**     | Most tools (some locked)         |
| **Limits**     | Moderate daily/monthly limits    |
| **Coin Usage** | ✅ Can purchase or earn via ads  |
| **Goal**       | Daily use → convert to Pro       |
| **Ad Coins**   | ✅ Earn coins by watching ads    |

### 4.3 Pro (Paid, ~$X/month)

| Attribute            | Value                                       |
|-----------           |-------                                      |
| **Access**           | All standard tools                          |
| **Limits**           | High limits, larger files, longer durations |
| **Coin Usage**       | ✅ Discounted coin costs                    |
| **API Access**       | ✅ 10K requests/month                       |
| **Priority Support** | ❌                                          |

### 4.4 Advance (Paid, ~$Y/month)

| Attribute            | Value                                   |
|-----------           |-------                                  |
| **Access**           | All tools, including those that are computationally expensive, bulk-oriented, or operationally sensitive |
| **Limits**           | Unlimited or very high                  |
| **Coin Usage**       | ✅ Maximum discount                     |
| **API Access**       | ✅ Unlimited                            |
| **Priority Support** | ✅                                      |
| **Bulk Operations**  | ✅                                      |

---

## 5. Product Scope

### 5.1 What We ARE Building (In Scope)

| Category             | Description                                   |
|----------            |-------------                                  |
| **Web Application**  | User-facing SaaS with all tools               |
| **Admin Panel**      | Internal dashboard for management             |
| **API**              | RESTful endpoints for B2B customers           |
| **Billing System**   | Subscriptions + coins + ad rewards            |
| **Auth System**      | Email/password + OAuth (Google, GitHub, Meta) |
| **Usage Tracking**   | Per-user, per-tool, per-plan limits           |
| **Abuse Prevention** | Rate limiting, fingerprinting, blocking       |

### 5.2 What We ARE NOT Building (Out of Scope)

| Category                   | Reason                             |
|----------                  |--------                            |
| **Mobile Native Apps**     | Web-first; PWA may come later      |
| **Collaboration Features** | Not a project management tool      |
| **Cloud Storage**          | No persistent file storage for MVP |
| **AI Chat/Assistant**      | Tools only, no conversational AI   |
| **Marketplace**            | No third-party tool submissions    |
| **White-label**            | Not licensing platform to others   |

---

## 6. Feature Matrix by Plan

### 6.1 Resource Limits by Plan

| Resource                  | Guest     | Free      | Pro       | Advance   | Reset Period    |
|----------                 |-------    |------     |-----      |---------  |--------------   |
| `advanced_tools.usage`    | 0         | 0         | Yes       | Yes       | plan_lifetime   |
| `api_access.usage`        | 0         | 0         | 10K       | Unlimited | monthly       |
| `audio.usage`             | 5         | 30        | 200       | Unlimited | daily         |
| `bulk_operations.usage`   | 0         | 0         | 100       | Unlimited | plan_lifetime |
| `cheque.bulk.usage`       | 0         | 5         | 50        | Unlimited | daily         |
| `cheque.generation.usage` | 5         | 25        | 200       | Unlimited | daily         |
| `data_conv.file_upload`   | 1         | 5         | 50        | Unlimited | monthly       |
| `data_conv.usage`         | 10        | 50        | 500       | Unlimited | daily         |
| `image.usage`             | 10        | 50        | 500       | Unlimited | daily         |
| `pdf_editor.usage`        | 0         | 50        | 500       | Unlimited | plan_lifetime |
| `terminal_scraper.usage`  | 0         | 0         | 100       | Unlimited | plan_lifetime |
| `video.usage`             | 3         | 20        | 100       | Unlimited | daily         |
| `audio.duration`          | 3min      | 5min      | 30min     | Unlimited | monthly       |
| `video.duration`          | 1min      | 5min      | 30min     | Unlimited | monthly       |
| `audio.file_size`         | 10MB      | 25MB      | 100MB     | Unlimited | monthly       |
| `file.size.per_upload`    | 200MB     | 500MB     | 1GB       | 5GB       | monthly       |
| `file.size.total`         | 200MB     | 5GB       | 49GB      | Unlimited | monthly       |
| `image.file_size`         | 5MB       | 10MB      | 50MB      | Unlimited | monthly       |
| `video.file_size`         | 25MB      | 50MB      | 500MB     | Unlimited | monthly       |
| `file.quality`            | 720×480   | 1280×720  | 1920×1080 | 4K        | plan_lifetime |
| `image.resolution`        | 1920×1080 | 1920×1080 | 4096×2160 | Unlimited | monthly       |
| `video.quality`           | 720×480   | 1280×720  | 1920×1080 | 4K        | plan_lifetime |
| `priority_support`        | None      | None      | None      | Yes       | plan_lifetime |

### 6.2 Feature Flags by Plan

| Feature                  | Guest   | Free | Pro | Advance |
|---------                 |-------  |------|-----|---------|
| Basic text tools         | ✅      | ✅   | ✅ | ✅      |
| Data converters          | Limited | ✅   | ✅ | ✅      |
| Media processing         | Limited | ✅   | ✅ | ✅      |
| Generators & calculators | Limited | ✅   | ✅ | ✅      |
| Advanced tools           | ❌      | ❌   | ✅ | ✅      |
| Bulk operations          | ❌      | ❌   | ✅ | ✅      |
| API access               | ❌      | ❌   | ✅ | ✅      |
| Terminal scraper         | ❌      | ❌   | ✅ | ✅      |
| Priority support         | ❌      | ❌   | ❌ | ✅      |
| Ad-free experience       | ❌      | ❌   | ✅ | ✅      |
| Coin purchases           | ❌      | ✅   | ✅ | ✅      |
| Ad-earned coins          | ❌      | ✅   | ✅ | ✅      |

---

## 7. Tool Categories

### 7.1 GROUP 1 — Text Tools

**UI Pattern:** `[Textarea] → [Options] → [Output Textarea]`  
**Execution:** Client-side (WASM) preferred, server fallback available  
*(Implementation details in `10_SYSTEM_ARCHITECTURE.md`)*

| Sub-category | Examples |
|--------------|----------|
| Case conversions | UPPERCASE, camelCase, snake_case, kebab-case, etc. |
| Separators & joiners | Pipe-separated, comma-separated, custom delimiters |
| Wrappers & quoting | Bracket wrap, quote wrap, code block wrap |
| Text styling | Bold, italic, markdown formatting |
| Unicode & glyph | Small caps, superscript, fullwidth, mirrored |
| Fun/expressive | Emoji case, Leet speak, Zalgo, mocking SpongeBob |
| Encoding/cipher | Base64, ROT13, Morse, Caesar cipher |
| Text operations | Reverse, count, extract emails/URLs/numbers |

**Total:** ~150+ tools

### 7.2 GROUP 2 — Data & Code Converters

**UI Pattern:** `[Monaco Editor Input] ⇄ [Monaco Editor Output]`  
**Execution:** Server-side processing  
*(Language/runtime defined in `10_SYSTEM_ARCHITECTURE.md`)*

| Sub-category | Examples |
|--------------|----------|
| Data converters | CSV ⇄ JSON, XML ⇄ JSON, YAML ⇄ JSON |
| Schema converters | OpenAPI ⇄ TypeScript, JSON Schema ⇄ Zod |
| Validators | JSON, XML, YAML, SQL syntax validation |
| Formatters | JSON prettier, SQL formatter, code beautifier |
| Code transpilers | TypeScript ⇄ JavaScript, SCSS ⇄ CSS |
| Dev utilities | JWT decoder, cURL ⇄ Fetch, API response beautifier |
| Diff tools | JSON diff, schema diff, line-by-line diff |
| DBML/ER diagrams | SQL → ER diagram, DBML visualization |

**Total:** ~100+ tools

### 7.3 GROUP 3 — Media & File Processing

**UI Pattern:** `[Upload/Dropzone] → [Options] → [Download]`  
**Execution:** Server-side processing with native binaries  
*(Implementation details in `10_SYSTEM_ARCHITECTURE.md`)*

| Sub-category | Examples |
|--------------|----------|
| Image conversion | PNG ⇄ JPG, HEIC → JPG, SVG → PNG |
| Video/audio | Format conversion, compression, extraction |
| Document conversion | DOCX ⇄ PDF, Markdown → PDF |
| PDF suite | Merge, split, compress, watermark, OCR |
| Archive tools | ZIP/RAR compression & extraction |
| Batch operations | Bulk rename, batch resize |

**Total:** ~100+ tools

### 7.4 GROUP 4 — Generators & Calculators

**UI Pattern:** `[Form Fields] → [Generate/Calculate] → [Output]`  
**Execution:** Client-side (WASM) for pure calculations, server-side for generators  
*(Implementation details in `10_SYSTEM_ARCHITECTURE.md`)*

| Sub-category     | Examples                                  |
|--------------    |----------                                 |
| ID generators    | UUID, password, API key, nanoid           |
| Web/SEO tools    | Meta tag generator, robots.txt, sitemap   |
| CSS generators   | Gradient, box-shadow, flexbox, grid       |
| Calculators      | BMI, GPA, Zakat, Islamic inheritance      |
| Unit converters  | Length, weight, temperature, data storage |
| Cheque generator | Single & bulk printable cheques           |

**Total:** ~100+ tools

### 7.5 GROUP 5 — Logistics & Specialized

**UI Pattern:** `[Identifier Input] → [Async Processing] → [Results Table]`  
**Execution:** Server-side async processing  
*(Implementation details in `10_SYSTEM_ARCHITECTURE.md`)*

| Sub-category       | Examples                      |
|--------------      |----------                     |
| Container tracking | Multi-source terminal scraping |
| Data aggregation   | Normalized activity timelines |

**Total:** ~10+ tools

---

## 8. Monetization Model

### 8.1 Subscription Tiers

| Plan    | Price | Billing          |
|------   |-------|---------         |
| Free    | $0    | —                |
| Pro     | $10/mo | Monthly ($10) / Yearly ($96) |
| Advance | $20/mo | Monthly ($20) / Yearly ($180) |

**Billing Provider:** Polar (subscription lifecycle) + Stripe (payment processing)

### 8.2 Coin System

| Aspect           | Details                                                         |
|--------          |---------                                                        |
| **Purchase**     | Buy coin packs via Stripe                                       |
| **Earn**         | Watch ads (Google AdSense)                                      |
| **Spend**        | Extend usage beyond plan limits                                 |
| **Expiration**   | None — coins never expire                                       |
| **Transfer**     | Not allowed                                                     |
| **Refunds**      | Via compensating transactions                                   |
| **Legal Status** | Consumable digital service credit; not stored value or currency |

**Ad-earned coins (configurable from admin):**
- Coins per ad: ~10 (default)
- Daily cap: ~1000 coins (default)
- Platforms: Web + Mobile

### 8.3 When Coins Are Used

1. User exhausts plan limit for a resource
2. Tool offers coin-based extension
3. User chooses to spend coins OR watch ad to earn coins
4. Tool execution proceeds

### 8.4 Coin Cost per Tool Action

Configured per tool via admin panel. Examples:
- Image conversion: 5 coins
- PDF merge (10 pages): 10 coins
- Video compression: 20 coins

---

## 9. Success Metrics

### 9.1 Business Metrics

| Metric                          | Target (12 months) |
|--------                         |------------------- |
| Monthly Active Users (MAU)      | TBD                |
| Free → Pro conversion rate      | > 5%               |
| Pro → Advance conversion rate   | > 10%              |
| Monthly Recurring Revenue (MRR) | TBD                |
| Churn rate (monthly)            | < 5%               |
| API customers                   | TBD                |

### 9.2 Product Metrics

| Metric                                | Target             |
|--------                               |--------            |
| Tool completion rate                  | > 90%              |
| Average tools used per session        | > 3                |
| Return user rate (7-day)              | > 40%              |
| Time to first value                   | < 30 seconds       |
| Error rate                            | < 1%               |
| Cost per tool execution (server-side) | Monitor & optimize |

### 9.3 Technical Metrics

| Metric                  | Target      |
|--------                 |--------     |
| API response time (p95) | < 500ms     |
| WASM tool execution     | < 100ms     |
| Uptime                  | > 99.9%     |
| Webhook processing lag  | < 5 seconds |

---

## 10. Explicit Non-Goals

> **These items are intentionally excluded to maintain focus.**

| Non-Goal                | Reason                                     |
|----------               |--------                                    |
| Mobile native apps      | Web-first strategy; PWA sufficient for MVP |
| Real-time collaboration | We're tools, not a workspace               |
| User-generated tools    | No marketplace complexity                  |
| Persistent file storage | Process-and-forget model                   |
| AI/ML features          | Pure utility tools only                    |
| White-labeling          | Not a platform business                    |
| Multi-language UI       | English only for MVP                       |
| Offline mode            | Online-first acceptable                    |
| Desktop app             | Browser is sufficient                      |

---

## 11. Dependencies & Assumptions

### 11.1 External Dependencies

| Dependency           | Purpose                 | Fallback                          |
|------------          |---------                |----------                         |
| **Polar**            | Subscription management | Manual DB management (temporary)  |
| **Stripe**           | Payment processing      | None (critical)                   |
| **Better-Auth**      | Authentication          | Auth.js migration path documented |
| **Google AdSense**   | Ad-earned coins         | Disable feature temporarily       |
| **Neon**             | PostgreSQL database     | Self-hosted Postgres              |
| **Cloudflare R2**    | File storage (future)   | AWS S3                            |
| **Vercel**           | Frontend hosting        | Netlify / Cloudflare Pages        |
| **Fly.io / Railway** | Backend hosting         | Render / self-hosted              |

### 11.2 Assumptions

| Assumption                            | Risk if Wrong                 |
|------------                           |---------------                |
| Users want aggregated tools           | Low demand = pivot product    |
| Ad-earned coins drive engagement      | Remove feature if low uptake  |
| WASM performance is sufficient        | Fallback to server-side       |
| Hundreds of tools are buildable rapidly | Adjust MVP scope            |
| B2B API demand exists                 | Deprioritize API if no traction |

---

## 12. Search Strategy

### 12.1 Search Implementation (MVP)

**Technology:** PostgreSQL full-text search with trigram similarity

**Why PostgreSQL?**
- Already have database, no additional service needed
- Supports fuzzy matching via `pg_trgm` extension
- Fast enough for 432 tools (<50ms query time)
- Can upgrade to Elasticsearch/Typesense post-MVP if needed

### 12.2 Search Features

| Feature | Implementation | Example |
|---------|----------------|----------|
| **Full-text search** | `to_tsvector` + `to_tsquery` | "json format" matches "JSON Formatter" |
| **Fuzzy matching** | `similarity()` via `pg_trgm` | "jsn formater" matches "JSON Formatter" (typo tolerance) |
| **Real-time suggestions** | As-you-type search (debounced 300ms) | Shows top 5 results while typing |
| **Search ranking** | Usage count + text similarity | Popular tools rank higher |
| **Multi-field search** | Search across name, description, keywords | "convert pdf" matches tools by description |

### 12.3 Search Query Flow

```
User types "json format" (debounced 300ms)
     │
     ▼
POST /api/search
     │
     ▼
PostgreSQL Query:
  SELECT 
    id, name, description, category,
    ts_rank(search_vector, query) AS rank,
    similarity(name, 'json format') AS name_sim
  FROM tools
  WHERE 
    search_vector @@ to_tsquery('json:* & format:*')
    OR similarity(name, 'json format') > 0.3
  ORDER BY 
    rank DESC, name_sim DESC, usage_count DESC
  LIMIT 10
     │
     ▼
Return: [
  {id: 'json-formatter', name: 'JSON Formatter', ...},
  {id: 'json-to-yaml', name: 'JSON to YAML Converter', ...},
  ...
]
```

### 12.4 Search Optimizations

**Database Indexes:**
```sql
-- Full-text search index
CREATE INDEX idx_tools_search_vector ON tools USING GIN(search_vector);

-- Trigram index for fuzzy matching
CREATE INDEX idx_tools_name_trgm ON tools USING GIN(name gin_trgm_ops);

-- Usage count for ranking
CREATE INDEX idx_tools_usage_count ON tools(usage_count DESC);
```

**Caching:**
- Popular search queries cached in Redis (7-day TTL)
- Cache key: `search:${query}:${limit}`
- Invalidate on tool metadata updates

**Performance Targets:**
- Query time: <50ms (p95)
- Cache hit rate: >70% (popular queries)
- Real-time suggestions: <100ms (including debounce)

### 12.5 Search UI Behavior

**As-you-type (Real-time):**
- Show top 5 results in dropdown
- Debounced 300ms (wait for user to stop typing)
- Highlight matching text
- Click result → Navigate to tool page

**On-submit (Full results):**
- Show all matching results (paginated)
- Advanced filters: Category, execution mode, pricing
- Sort options: Relevance, popularity, A-Z

**Empty state:**
- No results found → Suggest similar queries
- Show popular tools in selected category

---

## 13. Glossary

| Term             | Definition                                 |
|------            |------------                                |
| **Guest**        | Unauthenticated user with minimal access   |
| **Coin**         | Virtual currency for pay-as-you-go usage   |
| **Plan**         | Subscription tier (Free, Pro, Advance)     |
| **Limit**        | Usage cap per resource per reset period    |
| **Feature flag** | Boolean toggle for plan-based access       |
| **WASM**         | WebAssembly — client-side execution        |
| **Ledger**       | Immutable transaction log (coins, payments) |
| **Webhook**      | Event notification from external service   |
| **Polar**        | Subscription lifecycle management service  |
| **Better-Auth**  | Authentication library for Next.js         |
| **CASL**         | Frontend permission enforcement library    |

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                 00_PRODUCT_REQUIREMENTS.md                  │
│                    (This Document)                          │
│                      ROOT OF TRUTH                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ 01_USER_ROLES │   │ 10_SYSTEM_ARCH  │   │ 21_BILLING      │
│ _PERMISSIONS  │   │ _ITECTURE       │   │ _LOGIC          │
└───────────────┘   └─────────────────┘   └─────────────────┘
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

**Next Document:** [01_USER_ROLES_PERMISSIONS.md](./01_USER_ROLES_PERMISSIONS.md)