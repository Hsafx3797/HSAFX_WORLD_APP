# HSAFX World App — Copilot Context Instructions

> **This file is auto-loaded by GitHub Copilot / VS Code every session.**
> It prevents context loss and hallucination across conversations.

---

## 1. Project Identity

- **Monorepo**: pnpm workspace + Turborepo
- **Apps**: `apps/web` (Next.js — B2B API server), `apps/admin` (Next.js admin panel)
- **Backend**: `backend/fastapi` (Python — media engines), `backend/rust` (Rust — text/data engine service)
- **Packages**: `packages/tools` (engine implementations), `packages/ui`, `packages/shared`, `packages/schemas`, `packages/db`, `packages/api`, `packages/theme`
- **Deleted**: `packages/tool-definitions` (removed — presets are dead), `executor.ts` (removed)

---

## 2. Engine Architecture (THE CORE PATTERN)

**Master Plan**: `docs/PLANNING/70_B2B_ENGINE_ONLY_IMPLEMENTATION_PLAN.md`

### What It Is

**30 parameterized engines** — ALL server-side. No presets. No tool IDs. Direct parameter calls only.
Each engine exposes `execute(input, options)` and runs on one of 3 server backends.

### Execution Backends (ALL Server-Side)

| Backend  | Service       | Protocol      | Engines |
|----------|---------------|---------------|---------|
| Rust     | Separate HTTP | `X-Internal-Secret` | 9 engines: case, wrap, filter, transform, encode, hash, counter, unicode, generate-data |
| Node.js  | Next.js process | Direct import | 11 engines: comment, markup, convert, format, schema, diff, api, generate-web, validate, calculate, unit |
| FastAPI  | Separate HTTP | `X-Internal-Secret` | 10 engines: image, video, audio, pdf, document, archive, file, font, tracking, cheque |

**NOTHING runs client-side. The API IS the product.**

### Engine List (30 Total)

| #  | Engine          | Backend  | What It Does                          |
|----|-----------------|----------|---------------------------------------|
| 1  | `case`          | Rust     | Case conversions (snake, camel, etc.) |
| 2  | `wrap`          | Rust     | Text wrapping (quotes, brackets, etc.)|
| 3  | `filter`        | Rust     | Remove/extract/keep text patterns     |
| 4  | `transform`     | Rust     | Reverse/sort/shuffle/pad/join         |
| 5  | `encode`        | Rust     | Base64/hex/URL/ROT13/morse/etc.       |
| 6  | `hash`          | Rust     | SHA/MD5/CRC/HMAC/checksum             |
| 7  | `counter`       | Rust     | Word/char/line/frequency counts       |
| 8  | `unicode`       | Rust     | Unicode transforms (zalgo, fullwidth) |
| 9  | `generate-data` | Rust     | UUID/password/nanoid/person/etc.      |
| 10 | `comment`       | Node.js  | Add/remove comments (37 languages)    |
| 11 | `markup`        | Node.js  | HTML/MD/BBCode/LaTeX tag wrapping     |
| 12 | `convert`       | Node.js  | JSON↔YAML↔XML↔CSV↔TOML converters    |
| 13 | `format`        | Node.js  | Format/minify SQL/JSON/CSS/GraphQL    |
| 14 | `schema`        | Node.js  | JSON Schema↔TypeScript↔Zod↔Joi       |
| 15 | `diff`          | Node.js  | Text/schema/OpenAPI diff              |
| 16 | `api`           | Node.js  | curl parse, JWT decode, URL parse     |
| 17 | `generate-web`  | Node.js  | CSS generators, QR, SEO, lorem        |
| 18 | `validate`      | Node.js  | 39 format validators (email, UUID, etc.)|
| 19 | `calculate`     | Node.js  | Expression, financial, health calcs   |
| 20 | `unit`          | Node.js  | Unit conversions (length, weight, etc.)|
| 21 | `image`         | FastAPI  | Resize, crop, convert, watermark (19 ops) |
| 22 | `video`         | FastAPI  | Convert, trim, extract audio (12 ops) |
| 23 | `audio`         | FastAPI  | Convert, normalize, split (12 ops)    |
| 24 | `pdf`           | FastAPI  | Merge, split, compress, OCR (27 ops)  |
| 25 | `document`      | FastAPI  | DOCX↔PDF, EPUB, markdown (15 ops)     |
| 26 | `archive`       | FastAPI  | Zip, tar, 7z, extract (8 ops)         |
| 27 | `file`          | FastAPI  | Metadata extraction (5 ops)           |
| 28 | `font`          | FastAPI  | Convert, subset, WOFF2 (4 ops)        |
| 29 | `tracking`      | FastAPI  | Container/vessel/flight tracking      |
| 30 | `cheque`        | FastAPI  | Multi-currency cheque generation      |

### How It Works

```typescript
// ALL execution is server-side, dispatched by engine name
// Node.js engines — direct import
import { execute } from '@hsafx/tools/engines';
execute('comment', 'const x = 1;', { language: 'javascript', style: 'line', action: 'add' });

// Rust engines — HTTP call to Rust service
POST http://rust-service:3001/execute
{ "engine": "case", "input": "hello world", "options": { "separator": "_", "wordCase": "lower" } }

// FastAPI media engines — HTTP call to FastAPI service  
POST http://fastapi:8000/execute/image
{ "input": { "file_url": "..." }, "options": { "operation": "resize", "width": 800, "height": 600 } }
```

### Key Rules

- **ALL tools go through engines, ALL engines run server-side**
- Text/data engines → Rust service (9) or Node.js (11)
- Media/specialized engines → FastAPI (10)
- **NO presets** — callers pass engine name + options directly
- **NO tool IDs** — tool-definitions package is deleted
- **NO executor.ts** — deleted, was the old switch/case dispatch
- **NO client-side execution** — the API is the product, customers pay for server compute

---

## 3. API Surface (B2B Only)

### Target API (Being Built)

```
POST /api/v1/engine/{name}          ← Execute any of 30 engines
  Body: { input, options }
  → authenticateApiKey() + requireScope('tools:execute')
  → resolve engine runtime (rust/node/python)
  → B2B billing: checkB2bQuota() → engine.execute() → incrementB2bUsage()
  → 202 + jobId

GET /api/v1/engines                 ← List all 30 engines + option schemas
GET /api/v1/engine/{name}/schema    ← Option schema for one engine
```

### Deleted (All Gone)

- 6 category routes (`/text`, `/data`, `/generate`, `/validate`, `/calculate`, `/convert`) — deleted
- Category route handler (`category-route-handler.ts`) — deleted
- 4 legacy tool routes (`/tools/*`) — deleted
- Old generic engine execute (`/engine/execute`) — deleted
- Old engine list (`/engine/list`) — deleted
- `executor.ts` — deleted
- `packages/tool-definitions` — deleted

---

## 4. File Layout Quick Reference

```
packages/tools/src/
  engines/           ← 20 engine files + index.ts + types.ts (generate split into data+web)
  text/              ← Raw text functions (used BY engines)
  data-converters/   ← Raw converter functions (used BY engines)
  generators/        ← Raw generator functions (used BY engines)
  calculators/       ← Raw calculator functions (used BY engines)
  converters/        ← Raw unit converter functions (used BY engines)
  validators/        ← Raw validator functions (used BY engines)
  encoders/          ← Raw encoder functions (used BY engines)
  formatters/        ← Raw formatter functions (used BY engines)

apps/web/src/app/api/v1/
  engine/[name]/route.ts       ← NEW: B2B engine execution endpoint
  engine/[name]/schema/route.ts ← NEW: Engine schema endpoint
  engines/route.ts             ← NEW: Engine discovery endpoint

apps/web/src/server/jobs/
  job-worker.ts      ← Job processor — routes to rust/node/python by engine name
  job-manager.ts     ← Job creation + Redis/DB storage

apps/web/src/server/limits/
  b2b-quota-service.ts ← B2B suite quota enforcement

backend/fastapi/src/
  handlers/          ← 10 handler classes (ImageConverter, VideoConverter, TrackingHandler, ChequeHandler, etc.)
  routes/engine.py   ← POST /execute/{engine} (unified media engine route)

backend/rust/
  text-tools/        ← Existing ~170 pure functions (being refactored from WASM to native)
  engine-service/    ← NEW: Axum HTTP service wrapping text-tools

packages/db/src/schema/
  b2b.ts             ← 7 B2B tables (plans, subscriptions, suites, quotas, usage, categories, overrides)

apps/admin/src/app/api/admin/b2b/
  plans/route.ts         ← B2B plan CRUD
  subscriptions/route.ts ← B2B subscription management
  suites/route.ts        ← Suite CRUD
  quotas/route.ts        ← Per-plan per-suite quota management
  usage/route.ts         ← Read-only usage stats
  suite-categories/route.ts ← Category→suite mapping
  tool-overrides/route.ts   ← Per-tool suite overrides
```

---

## 5. Common Commands

```bash
# Run TypeScript scripts (tsx)
node node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs <script>

# Type check
pnpm exec tsc --noEmit -p packages/tools/tsconfig.json

# Run tests
pnpm exec vitest run packages/tools

# Build all
pnpm turbo build
```

---

## 6. Critical Rules

1. **Never use `npx tsx`** — use the full path shown above
2. **ALL engines are server-side** — no client-side execution, no WASM, no browser
3. **NO presets, NO tool IDs** — engines accept raw parameters only
4. **The B2B plan (70_B2B_ENGINE_ONLY_IMPLEMENTATION_PLAN.md) is the source of truth** — follow it
5. **3 execution backends**: Rust HTTP service, Node.js direct import, FastAPI HTTP service
6. **B2B billing only** — no B2C coin system for engine execution

---

## 7. What NOT to Do

- Don't say "client-side" — ALL engines are server-side
- Don't add presets or tool IDs — they're dead
- Don't reference executor.ts — it's deleted
- Don't add category routes — they're deleted  
- Don't import from `@hsafx/tool-definitions` — package is deleted
- Don't add B2C coin billing for engine execution — B2B ops billing only
