# 20 — Unified Billing System

> Compacted. Verbose code samples and legacy/deprecated pricing removed. Only rules, tables, and formulas kept.

---

## 1. Billable Action (BA)

**1 BA = 1 terminal FULL_SUCCESS job/output.**

- Charged **only** on `FULL_SUCCESS` status
- Partial, preview, cached, failed → NOT billable
- Retries do NOT add BA charges (idempotency key)
- Only the first `FULL_SUCCESS` per idempotency key is billable

### BA Weight System

`ba_charged = success_count × ba_weight`

| Weight | Meaning             | Example                                |
| ------ | ------------------- | -------------------------------------- |
| 0.1    | 10 successes = 1 BA | Calculators                            |
| 0.2    | 5 successes = 1 BA  | Text transforms, structured conversion |
| 1.0    | 1 success = 1 BA    | Media, generators, advanced            |

**Implementation:** ✅ Built — `toolClassPolicy` table in `packages/db/src/schema/tools.ts`, `coin-service.ts` uses `DEFAULT_BA_WEIGHTS`

---

## 2. Coin System

**Formula:**

```
coins = ceil(successCount × baWeight × (1 - discountPercent / 100))
```

- No `coin_per_ba` multiplier (removed)
- No `max(1, ...)` minimum (removed)
- Direct BA-to-coin conversion with discount only
- Ceiling ensures whole coins

**Implementation:** ✅ Built — `calculateCoinCost()` in `apps/web/src/server/limits/coin-service.ts`, uses atomic reservation pattern (reserve → execute → confirm/release)

---

## 3. Tool Class Policies

| Tool Class              | BA Weight | Mode       | Examples                    |
| ----------------------- | --------- | ---------- | --------------------------- |
| `text_transform`        | 0.2       | sync       | Case, trim, encode, unicode |
| `calculator`            | 0.1       | sync       | Age, BMI, zakat, GPA        |
| `structured_conversion` | 0.2       | sync       | JSON⇄YAML, XML⇄JSON         |
| `text_generator`        | 1.0       | sync       | Lorem ipsum, password       |
| `image_converter`       | 1.0       | async      | PNG→JPG, resize             |
| `video_converter`       | 1.0       | async      | MP4→AVI, trim               |
| `audio_converter`       | 1.0       | async      | MP3→WAV                     |
| `document_converter`    | 1.0       | async      | PDF→DOCX                    |
| `file_converter`        | 1.0       | async      | Archive, split              |
| `diagram_generator`     | 1.0       | async      | Mermaid, PlantUML           |
| `data_visualization`    | 1.0       | sync/async | Charts                      |
| `advanced_processor`    | 1.0       | async      | OCR, AI tools               |

**Async required:** All file/media/doc tools, output >5MB, processing >10s, external compute (FFmpeg, ImageMagick)

---

## 4. Subscription Plans

### B2C

| Code      | Label   | Monthly | Yearly | Monthly Coins | Discount              |
| --------- | ------- | ------- | ------ | ------------- | --------------------- |
| null      | Guest   | $0      | —      | 0 (ad-based)  | 0%                    |
| `free`    | Free    | $0      | $0     | 50            | 0%                    |
| `pro`     | Pro     | $10     | $96    | 150           | 20%                   |
| `advance` | Advance | $20     | $180   | 250           | 40% (50% on advanced) |

### B2B (Separate System — Suite-Based Ops Quotas)

B2B billing is a **completely separate system** from B2C coins. B2B uses **per-suite ops/month quotas**, not coins. 1 op = 1 successful tool execution (`FULL_SUCCESS` only). Failed/partial executions are free.

**Schema:** `packages/db/src/schema/b2b.ts` (7 tables), **Service:** `apps/web/src/server/limits/b2b-quota-service.ts`

| Code         | Label          | Monthly | Yearly | Per-Suite Ops |
| ------------ | -------------- | ------- | ------ | ------------- |
| `basic`      | Basic API      | $10     | $96    | See table     |
| `enterprise` | Enterprise API | $20     | $180   | See table     |

#### Suite Quotas

| Suite            | Categories                | Basic  | Enterprise |
| ---------------- | ------------------------- | ------ | ---------- |
| Text             | text, validate            | 5,000  | 10,000     |
| Data             | data                      | 5,000  | 10,000     |
| Media Convertor  | media (FastAPI)           | 3,000  | 6,000      |
| Generator        | generate                  | 5,000  | 10,000     |
| Calculator       | calculate, convert        | 5,000  | 10,000     |
| Specific         | specialized               | 3,000  | 6,000      |

**Key Rules:**
- Hard block (403 `B2B_QUOTA_EXHAUSTED`) when ops exhausted — no fallback to coins
- Calendar month reset, admin-customizable `resetDayOfMonth` per subscription (1-28)
- Per-tool suite overrides via `b2bToolSuiteOverrides` table (exceptions to category→suite mapping)
- 1 user = 1 API key = 1 active B2B subscription (enforced by partial unique index)
- Downgrade mid-period: keep old quota until period end

**Implementation:** ✅ Built — `b2b-quota-service.ts` (resolveB2bSuite, checkB2bQuota, incrementB2bUsage), integrated into all execution routes and job-worker

### Coin Purchase Packs

| Package | Coins | Price | Requirement         |
| ------- | ----- | ----- | ------------------- |
| Small   | 50    | $2    | Pro or Advance plan |
| Large   | 150   | $5    | Pro or Advance plan |

### Coin Earning

| Action                       | Coins | Frequency               |
| ---------------------------- | ----- | ----------------------- |
| Email verification           | 10    | Once                    |
| Social OAuth (Google/GitHub) | 10    | Once per platform       |
| Referral                     | 5     | Per successful referral |
| Watch ad                     | 10    | Max 10 ads/day          |
| Monthly grant (Free)         | 50    | Monthly                 |
| Monthly grant (Pro)          | 150   | Monthly                 |
| Monthly grant (Advance)      | 250   | Monthly                 |

---

## 5. Rate Limiting & Quota Model

**Three layers enforced simultaneously (in order):**

1. IP-based rate limit → 429
2. Session-based rate limit → 429
3. Account quota (coins) → 402

First violated layer terminates evaluation. Rate-limited requests do NOT consume coins.

### Completion Limits (per minute)

| Tool Class           | Guest | Free      | Pro       | Advance   |
| -------------------- | ----- | --------- | --------- | --------- |
| Text/Calc/Structured | 2     | Unlimited | Unlimited | Unlimited |
| File converters      | 2     | 20        | Unlimited | Unlimited |
| Media tools          | 2     | 10        | Unlimited | Unlimited |
| Diagram generators   | 2     | 10        | 50        | Unlimited |
| Advanced processors  | 0     | 5         | 20        | Unlimited |

---

## 6. Job Execution Model

### Job States

- **Non-terminal:** QUEUED → PREPARING → PROCESSING → PARTIAL
- **Terminal:** COMPLETED (billable), FAILED, CANCELLED, TIMEOUT, BLOCKED (all NOT billable)

### Coin Deduction Flow

```
Request → Security check → Rate limit → Plan limit check
  → If over plan limit → Check coin balance
    → Sufficient → Reserve coins → Execute
      → FULL_SUCCESS → Deduct coins, record BA
      → FAIL/PARTIAL → Release reserved coins
    → Insufficient → 402
```

**Implementation:** ✅ Built — `coin-service.ts` implements reserve/confirm/release pattern

---

## 7. Fallback & Edge Cases

- **Over plan limit:** Falls back to coin-based billing with (potentially less favorable) discount
- **Idempotency:** Same key + FULL_SUCCESS → return cached result, no re-charge
- **Retries:** Only for system failures (worker crash, transient infra, HTTP 5xx). NOT for invalid input, cancellation, policy block, quota exhaustion
- **Partial success:** NOT billable

---

## 8. Ad-Watching System

> ❌ **Ad reward system was REMOVED** from codebase. Replaced by login reward system (`rewards` tRPC router). Doc preserved for future implementation reference.

**Design (not yet built):**

- Authenticated users only, single coin wallet
- Admin-controlled: coins/ad (10), daily cap (100 ads), IP rate limit (10/hr), CAPTCHA after 20 ads
- Fraud prevention: fingerprint tracking (SHA256 canvas+WebGL+fonts+timezone), IP rate limiting, min 30s watch time, behavioral analysis
- Penalty: warning → 24hr ban → 7-day ban → permanent ban
- Provider: Google AdSense with region-based serving

---

## 9. Anonymous User Limits

**Implementation:** ✅ Built — `anon-usage-service.ts` with fingerprint+IP hybrid tracking, Redis fast-check, DB persistence

| Tool Class   | Anonymous Limit   | Free Limit |
| ------------ | ----------------- | ---------- |
| Text Tools   | Unlimited         | Unlimited  |
| Code Tools   | 10/day            | 50/day     |
| File Tools   | 3/day             | 10/day     |
| Generators   | 5/day             | 25/day     |
| Calculators  | Unlimited         | Unlimited  |
| Visualizers  | 3/day             | 10/day     |
| Intelligence | 0 (auth required) | 5/day      |

**Tracking:** SHA256 fingerprint (canvas, fonts, timezone, screen, CPU cores) + IP fallback. 24hr rolling window, reset midnight UTC.

**Conversion funnel:** Soft banner after 3 uses → modal at 50% → full-screen at limit

---

## 10. Security & Bot Mitigation

| Level | User Type          | Restrictions                      |
| ----- | ------------------ | --------------------------------- |
| 0     | Authenticated Pro  | Standard rate limits              |
| 1     | Authenticated Free | Standard rate limits              |
| 2     | Guest (clean)      | PoW may be required               |
| 3     | Guest (flagged)    | CAPTCHA + PoW + aggressive limits |

**CAPTCHA:** ✅ Built — hCaptcha integration in `login-security.ts`
**PoW:** ❌ Not built (doc aspirational)

Escalation: Normal → CAPTCHA → PoW → Hard Block
De-escalation: Automatic after N clean requests or M minutes

---

## 11. Feature Access Matrix

| Feature                     | Guest | Free | Pro | Advance |
| --------------------------- | ----- | ---- | --- | ------- |
| Text/data tools             | ✅    | ✅   | ✅  | ✅      |
| File upload                 | ❌    | ✅   | ✅  | ✅      |
| PNG export (diagrams)       | ❌    | ✅   | ✅  | ✅      |
| SVG/PDF export              | ❌    | ❌   | ✅  | ✅      |
| Bulk CSV (cheque)           | ❌    | ✅   | ✅  | ✅      |
| Multi-terminal tracking     | ❌    | ❌   | ✅  | ✅      |
| Solid/stylized themes       | ❌    | ✅   | ✅  | ✅      |
| Flag themes + custom colors | ❌    | ❌   | ✅  | ✅      |

---

## 12. Resource Limits (Per Plan)

### Images

|          | Guest    | Free      | Pro       | Advance   |
| -------- | -------- | --------- | --------- | --------- |
| Max size | 5MB      | 10MB      | 100MB     | 100MB     |
| Max res  | 1280×720 | 1920×1080 | 2400×1600 | 3840×2160 |

### Video

|            | Guest | Free  | Pro   | Advance |
| ---------- | ----- | ----- | ----- | ------- |
| Max size   | 15MB  | 30MB  | 100MB | 100MB   |
| Max length | 5min  | 15min | 30min | 60min   |

### Audio

|            | Guest | Free  | Pro   | Advance |
| ---------- | ----- | ----- | ----- | ------- |
| Max size   | 5MB   | 10MB  | 50MB  | 100MB   |
| Max length | 10min | 30min | 90min | 180min  |

### Documents

|           | Guest | Free | Pro  | Advance |
| --------- | ----- | ---- | ---- | ------- |
| Max size  | 5MB   | 10MB | 50MB | 100MB   |
| Max pages | 20    | 50   | 50   | 100     |

All limits stored in `system_settings` table, admin-configurable.
