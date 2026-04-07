# 00 — Product Requirements Document (PRD)

**Status:** ✅ APPROVED — Decisions Frozen

> Unified platform: text manipulation, data conversion, media processing, document generation, utility calculators.

**Business Model:** Subscriptions (Free/$0, Pro/$10mo, Advance/$20mo) + Coins (pay-as-you-go) + Ad-earned coins + B2B API.
**Billing:** Polar (subscriptions) + Stripe (payments). **Search:** ✅ Built — PostgreSQL FTS `to_tsvector` in `packages/api/src/routers/tools.ts`.

---

## Architectural Invariants

1. Subscription state is **derived** (from `trial_ends_at`, `current_period_end`, `canceled_at`) — never stored directly
2. Ledger data is **immutable** (coin transactions, audit logs, payments = append-only)
3. External providers are inputs, not source of truth (Polar/Stripe → webhooks → DB)
4. Plans control features; permissions never bypass plans
5. Client-side execution preferred (WASM = zero server cost)
6. Auth tables owned by us (custom schema with Better-Auth adapter)
7. Usage enforcement is deterministic and server-verifiable

---

## User Tiers

| Tier    | Price            | API          | Coins           | Key Limits                |
| ------- | ---------------- | ------------ | --------------- | ------------------------- |
| Guest   | —                | ❌           | ❌              | Very restrictive daily    |
| Free    | $0               | ❌           | ✅ Purchase/ads | Moderate daily/monthly    |
| Pro     | $10/mo ($96/yr)  | ✅ 10K/mo    | ✅ Discounted   | High limits, large files  |
| Advance | $20/mo ($180/yr) | ✅ Unlimited | ✅ Max discount | Unlimited, bulk, priority |

## Resource Limits (Guest / Free / Pro / Advance)

- API calls: 0 / 0 / 10K / Unlimited (monthly)
- Image ops: 10 / 50 / 500 / ∞ daily — file: 5MB / 10MB / 50MB / ∞ — res: 1920×1080 / same / 4096×2160 / ∞
- Video ops: 3 / 20 / 100 / ∞ daily — file: 25MB / 50MB / 500MB / ∞ — quality: 480p / 720p / 1080p / 4K
- Audio ops: 5 / 30 / 200 / ∞ daily — file: 10MB / 25MB / 100MB / ∞
- Data conversions: 10 / 50 / 500 / ∞ daily — uploads: 1 / 5 / 50 / ∞ monthly
- Cheques: 5 / 25 / 200 / ∞ daily — bulk: 0 / 5 / 50 / ∞
- Upload size: 200MB / 500MB / 1GB / 5GB — total: 200MB / 5GB / 49GB / ∞
- Advanced/Bulk/PDF/Scraper: ❌ / ❌ / ✅ / ✅

## Feature Flags by Plan

Guest: basic text (limited data/media). Free: all basic. Pro: +advanced, bulk, API, scraper, ad-free. Advance: +priority support + unlimited everything.

## Tool Categories (454 total)

| Group       | Count | Execution                                            | UI Pattern              |
| ----------- | ----- | ---------------------------------------------------- | ----------------------- |
| Text        | ~192  | Client WASM (19 engines)                             | Textarea→Options→Output |
| Data/Code   | ~103  | Client WASM (convert/format/schema/diff/api engines) | Monaco↔Monaco           |
| Media/File  | ~83   | Server (FastAPI native binaries)                     | Upload→Options→Download |
| Generators  | ~37   | Client WASM (generate engine)                        | Form→Generate→Output    |
| Calculators | ~9    | Client WASM (calculate engine)                       | Form→Compute→Output     |
| Converters  | ~23   | Client WASM (unit engine)                            | Form→Convert→Output     |
| Specialized | ~4    | Custom                                               | Input→Processing→Table  |

## Coin System

Purchase via Stripe, earn via AdSense (~10/ad, cap 1000/day). Never expire, no transfer, compensating txns only. Used when plan limit exhausted. Legal: consumable digital credit, not currency.

## Non-Goals (MVP)

Mobile native, real-time collab, user-generated tools, persistent file storage, AI/ML, white-labeling, multi-language UI, offline, desktop.

## External Dependencies

Polar (subs), Stripe (payments, critical), Better-Auth (auth), AdSense (ad coins), Neon (PostgreSQL), Cloudflare R2 (files, future), Vercel (frontend), Fly.io/Railway (backend).

## Success Metrics (TBD — not launched)

Business: Free→Pro >5%, churn <5%. Technical: API p95 <500ms, WASM <100ms, uptime >99.9%.
