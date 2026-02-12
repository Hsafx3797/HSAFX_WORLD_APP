# EXHAUSTIVE REQUIREMENTS EXTRACTION — 16 Planning Documents

**Source:** `docs/PLANNING/` files 30–52  
**Extraction Date:** January 2026  
**Scope:** Every concrete, verifiable requirement

---

## TABLE OF CONTENTS

1. [30_TOOLS_CATALOG.md](#1-30_tools_catalogmd)
2. [31_TOOLS_CLASSIFICATION_GUIDE.md](#2-31_tools_classification_guidemd)
3. [32_THEME_SYSTEM.md](#3-32_theme_systemmd)
4. [33_THEME_PRESETS.md](#4-33_theme_presetsmd)
5. [40_TOOL_METADATA_STANDARD.md](#5-40_tool_metadata_standardmd)
6. [41_PRESET_CONVERSION_TEMPLATE.md](#6-41_preset_conversion_templatemd)
7. [44_IMPLEMENTATION_ROADMAP.md](#7-44_implementation_roadmapmd)
8. [45_INTEGRATION_CONTRACTS.md](#8-45_integration_contractsmd)
9. [46_REDIS_KEY_SCHEMA.md](#9-46_redis_key_schemamd)
10. [47_ERROR_HANDLING_IMPLEMENTATION.md](#10-47_error_handling_implementationmd)
11. [48_CODE_TEMPLATES.md](#11-48_code_templatesmd)
12. [49_DEPLOYMENT_GUIDE.md](#12-49_deployment_guidemd)
13. [50_COMPLEX_TOOL_ALGORITHMS.md](#13-50_complex_tool_algorithmsmd)
14. [50_DEFINITION_OF_DONE.md](#14-50_definition_of_donemd)
15. [51_BACKEND_SCRAPER_LOGIC.md](#15-51_backend_scraper_logicmd)
16. [52_WASM_BRIDGE_INTERFACE.md](#16-52_wasm_bridge_interfacemd)

---

## 1. 30_TOOLS_CATALOG.md

### Functions/Classes/Interfaces
- None specified (catalog only — enumerates tool IDs/names/categories)

### Tool Inventory (446 tools)
| Range | Category | Count |
|-------|----------|-------|
| 001–191 | Text Converter | 191 |
| 192–297 | Code Editor | 106 |
| 298–379 | File Converter | 82 |
| 380–414 | Generators | 35 |
| 415–442 | Calculators | 28 |
| 443–444 | Visualizers | 2 |
| 445 | Document Generator (Cheque) | 1 |
| 446 | Async Intelligence (Container Tracker) | 1 |

### Integration Points
- Each tool has a canonical numeric ID (001–446) used as `toolId` across all systems
- Tool numbering is the master reference for all other documents

---

## 2. 31_TOOLS_CLASSIFICATION_GUIDE.md

### Interfaces

#### `ToolMetadata`
```typescript
{
  executionEnvironments: Array<'browser-wasm' | 'api-nodejs' | 'api-python' | 'api-native'>
}
```

### Functions

#### `selectExecution(tool: ToolMetadata, context: 'ui' | 'api')`
- Routing logic for hybrid execution
- Browser-first when cheap (<100ms), API when state/billing/scale needed

### Classification Axes (per tool)
| Axis | Values |
|------|--------|
| Global Level | 0–11 |
| Engineering Tier | A–D |
| Deterministic | Yes/No |
| Cacheable | Yes/No |
| Async | Yes/No |
| Primary Risk | (varies) |

### Technology Assignment Rules
| Condition | Technology |
|-----------|------------|
| Pure/stateless/repeatable, Level 0–2, Tier A | WASM (Rust) |
| API-facing/schema-heavy, Level 2–5, Tier A–B | Node.js |
| Semantic/AI/heuristic, Level 2–6, Tier B–C | Python (FastAPI) |
| Media/documents, Level 4–5, Tier B–C | Native Binaries |

### UI Patterns (8 total)
| Pattern | Description |
|---------|-------------|
| `TEXT_CONVERTER` | Textarea → Buttons → Output |
| `CODE_EDITOR` | Monaco bidirectional |
| `FILE_CONVERTER` | Dropzone → Settings → Download |
| `GENERATORS` | Form → Generate → Output |
| `CALCULATORS` | Form → Calculate → Result |
| `DB_VISUALIZATION` | Monaco → Diagram |
| `FILE_TREE` | Text → Tree |
| `DOCUMENT_GEN` | Form → Template → PDF |
| `ASYNC_INTELLIGENCE` | Identifiers → Jobs → Results |

### All 446 tools scored on all 6 classification axes
- Complete per-tool table with Level, Tier, Deterministic, Cacheable, Async, Risk

---

## 3. 32_THEME_SYSTEM.md

### Interfaces

#### `ThemeIntent`
```typescript
{
  version: number;
  brand: {
    primary: string;    // OKLCH color
    accent?: string;
    danger?: string;
  };
  surface: {
    contrast: 'soft' | 'medium' | 'high';
    neutralBias: 'warm' | 'cool' | 'true';
  };
  mode: 'light' | 'dark' | 'system';
  typography: {
    font: string;
    scale: number;          // 0.9–1.1
    letterSpacing: number;  // -0.01–0.05
  };
  shape: {
    roundness: number;      // 0 (sharp) to 1 (pill)
  };
  elevation: {
    intensity: number;      // 0–1
    softness: number;       // 0–1
  };
  spacing: {
    density: number;        // 0.8–1.2
  };
  preset?: string;
}
```

### Functions

#### `deriveColors(intent: ThemeIntent, mode: 'light' | 'dark')`
- OKLCH color derivation
- WCAG AA 4.5:1 contrast guarantee required

#### `deriveSurfaces(baseBackground: string, mode: 'light' | 'dark')`
- Surface hierarchy generation

#### `deriveRadius(roundness: number)`
- 0 = sharp (0rem), 1 = pill (9999px)

#### `deriveShadow(intensity: number, softness: number, mode: 'light' | 'dark')`
- Mode-aware shadow generation

### Required Libraries
| Library | Version |
|---------|---------|
| `culori` | ^4.0.1 |
| `wcag-contrast` | ^3.0.0 |

### CSS Variable Contract (~40 variables)
- `--background`, `--foreground`, `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--card`, `--card-foreground`, `--popover`, `--popover-foreground`
- `--sidebar-*` variants (background, foreground, primary, accent, border, ring)
- `--chart-1` through `--chart-5`
- `--radius`, `--spacing`, font families, shadows

### Tailwind v4 Integration
- `@theme inline` block mapping CSS vars to `--color-*` tokens

### Database Storage
- `user_preferences.preferences` JSONB column stores `ThemeIntent`

### Components
| Component | Purpose |
|-----------|---------|
| `ThemeProvider` | React context provider |
| `useTheme` hook | Access/mutate theme |

### Plan-Based Access Control
| Plan | Access |
|------|--------|
| Guest | Light/dark + default preset only |
| Free | + solid + stylized presets |
| Pro | + flag presets + custom colors |
| Advance | + advanced controls |

### File Structure
```
src/lib/theme/
├── types.ts
├── derive.ts
├── presets.ts
├── access.ts
└── utils.ts
src/components/theme-provider.tsx
```

### Test Requirements
| Type | What |
|------|------|
| Unit | Derivation math correctness |
| Visual | Preset snapshot tests |
| Accessibility | Contrast validation (≥4.5:1) |
| Integration | Persistence round-trip |
| E2E | Theme change propagation |

---

## 4. 33_THEME_PRESETS.md

### Architecture
- Two-tier system: presets are **FULL variable snapshots**, NOT overrides
- Simple class overrides **DEPRECATED**
- Each preset MUST include: `:root` block, `.dark` block, `@theme inline` block, font definitions, radius, shadows, spacing

### Presets Defined (full OKLCH CSS)
| Preset | Status |
|--------|--------|
| Default (neutral grayscale) | ✅ Complete |
| Red | ✅ Complete |
| Green | ✅ Complete |
| Blue | ✅ Complete |
| Pink | ✅ Complete |
| Orange | ✅ Complete |
| Purple | ✅ Complete |
| 15 flag-inspired presets | Listed |
| Cyberpunk | Listed |
| Claude | Listed |
| Retro Arcade | Listed |
| Neo Brutalism | Listed |

### All presets use OKLCH color values throughout

---

## 5. 40_TOOL_METADATA_STANDARD.md

### Interfaces

#### `ToolPage`
```typescript
{
  slug: string;              // kebab-case
  h1: string;                // 40–70 characters
  description: string;       // 150–160 characters
  useCases: UseCase[];       // 3–5 items
  examples: Example[];       // 2–4 items
  commonErrors: CommonError[]; // 3–5 items
  relatedTools: RelatedTool[]; // 3–5 items
  config?: ToolConfig;
}
```

#### `UseCase`
```typescript
{
  title: string;
  description: string;
  audience?: string;
}
```

#### `Example`
```typescript
{
  title: string;
  input: string;
  output: string;
  explanation?: string;
}
```

#### `CommonError`
```typescript
{
  symptom: string;
  cause: string;
  solution: string;
  example?: string;
}
```

#### `RelatedTool`
```typescript
{
  slug: string;
  title: string;
  relationship: 'alternative' | 'next-step' | 'complementary' | 'prerequisite';
}
```

#### `ToolConfig`
```typescript
{
  category: string;
  subcategory?: string;
  keywords: string[];       // 5–10 items
  executionEnvironments: string[];
  requiresAuth?: boolean;
}
```

### Structured Data
- Schema.org `SoftwareApplication` JSON-LD required on every tool page

### Maintenance
- Quarterly review cycle for metadata

---

## 6. 41_PRESET_CONVERSION_TEMPLATE.md

### Conversion Process
- HEX → OKLCH conversion using oklch.com or colorjs.io

### Multi-Color Flag Strategy
- Primary = dominant color
- Secondary = secondary color
- Accent = third color

### Status Tracker
| Preset | Status |
|--------|--------|
| Red | DONE |
| 20 others | TODO |

### Checklist per Preset (11 items)
1. HEX identification
2. OKLCH conversion
3. `:root` block
4. `.dark` block
5. `@theme inline` block
6. Font definitions
7. Radius values
8. Shadow values
9. Spacing values
10. Light/dark mode testing
11. Contrast validation (≥4.5:1)

---

## 7. 44_IMPLEMENTATION_ROADMAP.md

### Phase Structure (5 phases, 23–33 weeks total)

#### Phase 1: Tools + API (8–12 weeks)
| Step | Duration | Details |
|------|----------|---------|
| TEXT_CONVERTER | 4 weeks | Rust→WASM, single crate `text-tools-wasm`, 191 tools, 573 unit tests |
| CODE_EDITOR | 3 weeks | Node.js + Monaco, 106 tools |
| FILE_CONVERTER | 3 weeks | FastAPI + native binaries, 82 tools |
| GENERATORS | 1.5 weeks | 35 tools |
| CALCULATORS | 1.5 weeks | 28 tools |
| VISUALIZERS | 1 week | 2 tools |
| DOCUMENT_GEN | 1 week | 1 tool |
| ASYNC_INTELLIGENCE | 1 week | 1 tool |

#### Phase 2: DB + Auth (3–4 weeks)
#### Phase 3: Admin Panel (4–6 weeks)
#### Phase 4: User Frontend (6–8 weeks)
#### Phase 5: Finalization (2–3 weeks)

### Performance Targets
| Metric | Target |
|--------|--------|
| WASM binary | <3MB gzipped |
| WASM execution | <5ms average |
| API response | <150ms p95 |
| Large file support | Up to 10MB |
| Memory per worker | <500MB |
| Phase 5 load test | 1000 concurrent users, <500ms p95 |
| Lighthouse | >90 |

### Test Requirements
- 3 test vectors per tool (1,338 total minimum)
- Browser compat: Chrome/Firefox/Safari/Edge last 2 versions
- Mobile: iOS 15+, Android 11+

### Build Patterns
- Rust modules: `case_converter.rs`, `text_wrapper.rs`, `encoding.rs`, `ciphers.rs`, `text_ops.rs`
- Node.js service structure
- FastAPI service structure with workers

### Dependency
- Phase dependencies are strictly sequential
- Rollback strategy: per-phase and per-tool-category

---

## 8. 45_INTEGRATION_CONTRACTS.md

### Stripe Plans

#### B2C Plans
| Plan | Price | Coin Grant |
|------|-------|------------|
| Free | $0/mo | 0 |
| Pro | $10/mo or $96/yr ($8/mo) | 150/mo |
| Advance | $20/mo or $180/yr ($15/mo) | 250/mo |

#### B2B Plans
| Plan | Price | Operations |
|------|-------|------------|
| Basic | $10/mo or $96/yr | 5,000/mo |
| Enterprise | $20/mo or $180/yr | 10,000/mo |

#### Coin Packages (requires Pro/Advance)
| Package | Price |
|---------|-------|
| 50 coins | $2 |
| 150 coins | $5 |

### Stripe Webhook Events
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription |
| `customer.subscription.created` | Create subscription record |
| `customer.subscription.updated` | Update plan/status |
| `customer.subscription.deleted` | Deactivate subscription |
| `invoice.payment_succeeded` | Grant monthly coins |
| `invoice.payment_failed` | Mark payment failed |
| `charge.succeeded` | Complete coin purchase |
| `charge.failed` | Mark charge failed |

### Stripe Idempotency
- `stripe_events` table with unique `stripe_event_id` column

### Uploadthing
- File upload with virus scanning
- File size limits per plan per file type (IMAGE/AUDIO/VIDEO/DOCUMENT × GUEST/FREE/PRO/ADVANCE)
- Anonymous upload: IP-based rate limiting (10/hr anon, 50/hr auth)
- 24hr cleanup cron every 6 hours

### Cloudflare R2
- Bucket name: `hsafx-world`
- File key pattern: `{userId}/{toolId}/{jobId}/{filename}`
- 24hr lifecycle auto-delete
- Presigned URLs for download

### BullMQ
- Queue names: `file-processing`, `scraper`
- 3 retry attempts, exponential backoff starting at 2s

### Rate Limiting (Upstash Ratelimit)
| Scope | Limit |
|-------|-------|
| Per user (anti-bot) | 2 req/min |
| Per IP (anonymous) | 2 req/min |
| Per tool | 10 req/min |

### Environment Variables
- Complete `.env.local` template with all service credentials

### Deferred Services
- Email, Analytics, Error Tracking — all post-MVP

### Test Cards
| Card | Purpose |
|------|---------|
| `4242424242424242` | Success |
| `4000000000000002` | Decline |
| `4000002760003184` | 3DS |

---

## 9. 46_REDIS_KEY_SCHEMA.md

### Redis Key Patterns

| Category | Pattern | TTL |
|----------|---------|-----|
| User Rate Limit | `{env}:ratelimit:user:{userId}:{toolId}` | Auto (Upstash) |
| IP Rate Limit | `{env}:ratelimit:ip:{ipHash}:{toolId}` | Auto |
| Tool Rate Limit | `{env}:ratelimit:tool:{toolId}:{userId}` | Auto |
| Global API Limit | `{env}:ratelimit:api:{userId}` | Auto |
| Job Queue | `{env}:bull:{queueName}:{jobId}` | BullMQ-managed |
| Job Result | `{env}:job:{jobId}:result` | 24h |
| Job Progress | `{env}:job:{jobId}:progress` | 1h |
| Tool Cache | `{env}:cache:tool:{toolId}:{inputHash}` | 24h |
| API Cache | `{env}:cache:api:{endpoint}:{paramsHash}` | 1–24h |
| User Cache | `{env}:cache:user:{userId}:{dataType}` | 1h |
| Session | `{env}:session:{sessionToken}` | 7d |
| Anon Tracking | `{env}:temp:anon:{ipHash}:{dataType}` | 24h |
| Ad View | `{env}:temp:ad:{userId}:view:{timestamp}` | 1h |

### Functions

#### `getEnvPrefix(): string`
- Returns `dev:`, `staging:`, or `prod:` based on `NODE_ENV`

#### `ENV_PREFIX` constant
```typescript
{ development: "dev:", staging: "staging:", production: "prod:" }
```

#### Rate Limiting Functions
- `userRateLimit` — Upstash sliding window 2 req/min, prefix `{env}:ratelimit:user:`
- `ipRateLimit` — Upstash sliding window 2 req/min, prefix `{env}:ratelimit:ip:`
- `getToolRateLimit(toolId, requestsPerMin)` — configurable per-tool
- `globalApiLimit` — 60 req/min across all tools, prefix `{env}:ratelimit:api:`

#### IP Hashing
```typescript
function hashIp(ip: string): string
// SHA-256 hash, first 16 chars
```

#### Caching Functions
- `generateInputHash(input)` — SHA-256, first 16 chars
- `getCachedResult(toolId, input)` — get from `cache:tool:{toolId}:{inputHash}`
- `setCachedResult(toolId, input, result)` — set with 24h TTL
- `getCachedApiResponse(endpoint, params)` / `setCachedApiResponse(...)`
- `getCachedUserData(userId, dataType)` / `setCachedUserData(...)`
- `invalidateUserCache(userId)` — bulk delete `cache:user:{userId}:*`

#### Job Functions
- `storeJobResult(jobId, resultUrl)` — 24h TTL
- `getJobResult(jobId)`
- `updateJobProgress(jobId, progress)` — 1h TTL
- `getJobProgress(jobId)`

#### Anonymous User Functions
- `incrementAnonBA(ipHash)` — returns count, 24h TTL on first use
- `shouldShowAd(ipHash)` — true every 5th BA
- `recordAdView(userId)` — 1h TTL
- `grantAdReward(userId)` — grants 10 coins, reason `"AD_VIEW"`

#### Admin Functions
- `getUserRateLimitKeys(userId)`
- `clearToolCache(toolId)`
- `flushDevKeys()` — only in development
- `getKeyStats()` — counts per category
- `logRedisOperation(operation, key, success, duration)` — dev logging, 5min TTL

### Naming Rules
- Lowercase for all keys
- Underscores for word separation within identifier
- Colons for namespace separation
- Keys under 128 characters
- No `.`, `/`, `\` characters

### TTL Policy
- **ALL keys MUST have TTL** (no eternal keys)

### Queue Names
```typescript
QUEUE_NAMES = {
  FILE_PROCESSING: `${env}:bull:file-processing`,
  SCRAPER: `${env}:bull:scraper`,
  EMAIL: `${env}:bull:email`  // post-MVP
}
```

### Database Table
```sql
CREATE TABLE tool_rate_limits (
  tool_id VARCHAR(50) PRIMARY KEY,
  requests_per_minute INT DEFAULT 2,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. 47_ERROR_HANDLING_IMPLEMENTATION.md

### Error Classes

#### `AppError` (Backend — Next.js)
```typescript
class AppError extends Error {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}
```

#### `AppError` (Backend — Python)
```python
class AppError(Exception):
    status_code: int
    code: str
    message: str
    details: dict
    retryable: bool
```

#### `ValidationError`
```typescript
{ code: string; message: string; details: string; field: string; }
```

#### `PlanLimitError`
```typescript
{ code: string; message: string; upgrade_url: string; required_plan: string; }
```

#### `SystemError`
```typescript
{ code: string; message: string; internalMessage: string; retryable: boolean; }
```

#### `ApiError` (Frontend)
```typescript
class ApiError extends Error {
  status: number;
  code: string;
  message: string;
  details?: any;
}
```

### Error Codes
| Code | Status | Category |
|------|--------|----------|
| `INVALID_JSON` | 400 | Validation |
| `TOOL_LOCKED` | 403 | Authorization |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit |
| `MISSING_INPUT` | 400 | Validation |
| `FILE_TOO_LARGE` | 413 | Input Processing |
| `DATABASE_ERROR` | 500 | System |
| `PAYMENT_PROCESSING_ERROR` | 503 | System |
| `INTERNAL_ERROR` | 500 | System |
| `NETWORK_ERROR` | 0 | Network |
| `VALIDATION_ERROR` | 400 | Validation |
| `DUPLICATE_RECORD` | 409 | Database (PG 23505) |
| `INVALID_REFERENCE` | 400 | Database (PG 23503) |
| `MISSING_REQUIRED_FIELD` | 400 | Database (PG 23502) |
| `DATABASE_UNAVAILABLE` | 503 | Database |
| `CARD_DECLINED` | 402 | Stripe |
| `STRIPE_RATE_LIMIT` | 429 | Stripe |
| `PAYMENT_SERVICE_UNAVAILABLE` | 503 | Stripe |
| `PAYMENT_ERROR` | 500 | Stripe |
| `WASM_ERROR` | 400 | WASM |
| `WASM_PANIC` | 500 | WASM |
| `EMPTY_INPUT` | 400 | Validation |
| `UNAUTHORIZED` | 401 | Auth |

### Functions

#### `handleApiError(error): NextResponse`
- Dispatches on `AppError`, `ZodError`, DB error codes, generic fallback

#### `error_handler(request, exc)` (Python)
- Global FastAPI exception handler

#### `handleDbError(error): never`
- Maps PostgreSQL error codes (23505, 23503, 23502) to `AppError`

#### `handleStripeError(error): never`
- Maps Stripe error types to `AppError`

#### `safeRedisGet(key)` / `safeRedisSet(key, value, ttl)`
- Non-throwing Redis wrappers — cache miss on failure

#### `formatZodErrors(error: z.ZodError): Record<string, string>`
- Flattens Zod issues to field→message map

### Retry Logic

#### `RetryConfig`
```typescript
{
  maxAttempts: 3;
  initialDelay: 1000;      // 1 second
  maxDelay: 10000;          // 10 seconds
  backoffMultiplier: 2;
}
```

#### `withRetry<T>(operation, config, shouldRetry): Promise<T>`
- Exponential backoff retry wrapper

#### `isTransientError(error): boolean`
- Detects: `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, HTTP 5xx, HTTP 429, Redis connection errors, `READONLY`, `ECONNRESET`, `ER_LOCK_WAIT_TIMEOUT`, deadlock

### Error Exposure Policy
| Error Type | User Sees | Logs |
|------------|-----------|------|
| Validation (4xx) | Specific message + details | `warn` level |
| System (5xx) | Generic "Something went wrong" | `error` level + full stack |
| Transient | Auto-retried, then generic | Retry attempts logged |

### Components

#### `ErrorBoundary` (React class component)
- Props: `children`, `fallback?`
- State: `hasError`, `error`
- Static `getDerivedStateFromError`
- `componentDidCatch` for logging

#### `apiRequest<T>(endpoint, options): Promise<T>`
- Prefixes `/api`, sets JSON headers, parses errors into `ApiError`

### Logging

#### `logError(error, context)` function
```typescript
context: { userId?: string; toolId?: string; requestId?: string; }
```
- Dev: `console.error`
- Prod: External service (post-MVP)
- Always: Insert into `error_logs` table

### Database Table
```sql
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  tool_id VARCHAR(50),
  request_id VARCHAR(100),
  error_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_name ON error_logs(error_name);
```

### Stripe Retry Override
- Max 2 attempts for Stripe (not 3)

### Redis Retry Override
- Max 2 attempts, initialDelay 500ms, maxDelay 1000ms

---

## 11. 48_CODE_TEMPLATES.md

### Code Style Rules

#### React Components
- Functional components only (no class components except ErrorBoundary)
- Arrow functions for event handlers
- Destructure props in parameter list
- Define interfaces above component
- **Export named functions** (no default exports)
- Max 200 lines per component

#### Backend Services
- Class-based architecture
- JSDoc for all public methods
- Export singleton instance at bottom
- Descriptive method names

#### Python Services
- Class-based with type hints
- Google-style docstrings
- async/await for I/O
- Export singleton at bottom

#### Utilities
- Pure functions, no side effects
- One function per export
- JSDoc for complex functions

### File Naming Conventions
| Type | Convention |
|------|-----------|
| Files | kebab-case (`user-profile.tsx`) |
| Components | PascalCase matching export (`UserProfile.tsx` → `UserProfile`) |
| Classes | PascalCase (`BillingService`) |
| Functions | camelCase (`getUserProfile()`) |
| Constants | SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`) |

### Import Order (TypeScript)
1. React imports
2. Next.js imports
3. External libraries (alphabetical)
4. Internal: Components → Hooks → Services → Utilities → Types
5. Styles (last)
- Type imports use `import type` syntax
- Blank line between groups

### Import Order (Python)
1. Standard library
2. Third-party
3. Local application
- Absolute imports only

### Configuration Files

#### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### `.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": ["warn", {"allow": ["warn", "error"]}]
  }
}
```

#### `tsconfig.json`
- `target`: ES2020
- `module`: ESNext
- `moduleResolution`: bundler
- `strict`: true
- Path aliases: `@/*` → `./src/*`

#### `pyproject.toml`
- Black: line-length 100, target py311
- Ruff: line-length 100, select E/F/I/W

### Template Patterns
- Page component template (server component with `generateMetadata`)
- Client component template (with `"use client"`, state, apiRequest)
- Next.js API route template (Zod validation, session check, `handleApiError`)
- FastAPI route template (Pydantic model, `AppError`)
- WASM tool template (Rust with `#[wasm_bindgen]`, 3 tests)
- Node.js tool template (Zod options validation)
- Drizzle ORM query template
- Unit test template (Vitest `describe`/`it`/`expect`)
- Integration test template

---

## 12. 49_DEPLOYMENT_GUIDE.md

### Deployment Architecture
| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js app |
| Backend API | Fly.io | FastAPI |
| Database | Neon | PostgreSQL |
| Redis | Upstash | Cache & Queue |
| Storage | Cloudflare R2 | Temp file storage |
| Payments | Stripe | Billing |
| DNS | Cloudflare | Domain management |

### Deployment Configurations

#### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [{"path": "/api/cron/cleanup-uploads", "schedule": "0 */6 * * *"}]
}
```

#### `fly.toml`
- App: `hsafx-world-api`
- Region: `iad`
- Internal port: 8000
- Concurrency: hard 250, soft 200
- Health checks: 15s interval, 2s timeout, 10s grace

#### `Dockerfile` (FastAPI)
- Base: `python:3.11-slim`
- System deps: `ffmpeg`, `libvips`, `poppler-utils`
- CMD: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`

### Environment Variables (complete list)
| Variable | Service |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
| `NEXTAUTH_URL` | App URL |
| `NEXTAUTH_SECRET` | Auth secret |
| `GOOGLE_CLIENT_ID` / `_SECRET` | OAuth |
| `GITHUB_CLIENT_ID` / `_SECRET` | OAuth |
| `STRIPE_SECRET_KEY` / `PUBLISHABLE_KEY` / `WEBHOOK_SECRET` | Stripe |
| `UPLOADTHING_SECRET` / `APP_ID` | Uploadthing |
| `R2_ACCOUNT_ID` / `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` / `BUCKET_NAME` | R2 |
| `UPSTASH_REDIS_URL` / `TOKEN` | Redis |
| `FASTAPI_URL` | Backend URL |
| `CRON_SECRET` | Cron auth |
| `SECRET_KEY` (Python) | FastAPI secret |
| `ALLOWED_ORIGINS` (Python) | CORS |
| `PORT` (Python) | 8000 |

### DNS Records
| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 (Vercel) |
| CNAME | www | cname.vercel-dns.com |
| CNAME | api | hsafx-world-api.fly.dev |

### Domain
- `hsafx-world.com`

### SSL
- Auto-generated (Let's Encrypt) on both Vercel and Fly.io

### CI/CD
- `.github/workflows/deploy.yml`
- GitHub Actions: checkout → build → deploy frontend (Vercel) + deploy backend (Fly.io)
- GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `FLY_API_TOKEN`

### Database Setup
- Neon project: `hsafx-world`
- Region: US East (Ohio)
- Migration: `drizzle-kit generate:pg` → `drizzle-kit push:pg`
- Seed script: `scripts/seed-database.ts`
- Seeds: plans, plan limits, plan permissions, tool metadata (446), system settings

### Redis Setup
- Database name: `hsafx-world-redis`
- Region: US-East-1
- Max memory policy: `allkeys-lru`

### R2 Lifecycle Rule
- Rule: `auto-cleanup`, delete after 1 day

### Stripe Products
| Product | ID Convention |
|---------|---------------|
| Pro Monthly | `prod_pro_monthly` |
| Pro Yearly | `prod_pro_yearly` |
| Advance Monthly | `prod_advance_monthly` |
| Advance Yearly | `prod_advance_yearly` |
| Basic Monthly | `prod_basic_monthly` |
| Basic Yearly | `prod_basic_yearly` |
| Enterprise Monthly | `prod_enterprise_monthly` |
| Enterprise Yearly | `prod_enterprise_yearly` |
| 50 Coins | `prod_coins_50` |
| 150 Coins | `prod_coins_150` |

### Stripe Webhook Endpoint
- URL: `https://hsafx-world.com/api/webhooks/stripe`
- Events: 6 event types (same as §8)

### Rollback Procedures
- Vercel: `vercel rollback <deployment-url>` or Dashboard promote
- Fly.io: `fly releases rollback <version>`
- Database: `drizzle-kit drop` or Neon backup restore

### Post-Deployment Verification
- `curl https://hsafx-world.com` → HTML
- `curl https://api.hsafx-world.com/health` → `{"status": "ok"}`
- Test auth flows (email, Google, GitHub)
- Test tool execution (WASM, Node.js, FastAPI)
- Test billing (Stripe test mode)
- Test rate limiting (3 rapid requests → 429)

### Monitoring
- Vercel Analytics
- Fly.io Metrics
- Neon Monitoring
- Upstash Metrics

### Backups
- Neon: automatic daily, 7-day retention (free)
- Upstash: automatic daily, 1-day retention (free)

---

## 13. 50_COMPLEX_TOOL_ALGORITHMS.md

### Tool 419: GPA Calculator

#### Interfaces
```typescript
interface Course {
  name: string;
  gradePoint: number;
  creditHours: number;
}

interface Semester {
  gpa: number;
  credits: number;
}

interface StandardGrading { scale: 4.0; gradeMap: {...} }
interface GermanGrading { scale: 5.0; gradeMap: {...} }
```

#### Functions
- `calculateSimpleGPA(courses: Course[]): number` — unweighted average
- `calculateWeightedGPA(courses: Course[]): number` — credit-weighted
- `calculateCumulativeGPA(semesters: Semester[]): number` — multi-semester
- `percentageToGPA(percentage: number): number` — Pakistan/India scale
- `filterPassFailCourses(courses: Course[]): Course[]`
- `handleRetakes(courses: Course[]): Course[]` — use higher grade

#### Grading Systems
| System | Scale | Region |
|--------|-------|--------|
| Standard 4.0 | A+=4.0 … F=0.0 | USA |
| Percentage→GPA | 85+=4.0 … <50=0.0 | Pakistan/India |
| 5.0 Scale | 1.0=5.0 … 5.0=0.0 | Germany |

### Tool 417: Islamic Inheritance Calculator

#### Enums
- `HeirCategory`: `ASHAB_AL_FURUD` | `ASABAH` | `DHAWIL_ARHAM`
- `HeirRelation`: HUSBAND, WIFE, MOTHER, FATHER, DAUGHTER, SON, FULL_SISTER, etc.

#### Interfaces
```typescript
interface Heir {
  name: string;
  relationship: HeirRelation;
  gender: 'male' | 'female';
  isAlive: boolean;
}

interface Fraction {
  numerator: number;
  denominator: number;
}
```

#### Functions
- `getFixedShare(heir, hasChildren, hasMaleChildren, totalWives, madhhab)` — returns `Fraction`
- `applyBlockingRules(heirs: Heir[]): Heir[]` — Hijab rules
- `distributeResidue(residue, residuaries): Map<Heir, number>` — 2:1 male:female ratio
- `handleAwl(shares)` — proportional reduction when shares exceed 100%
- `handleRadd(shares, totalEstate)` — redistribute remainder (excluding spouse)

#### Blocking Rules (Hijab)
1. Sons block grandsons
2. Father blocks grandfather
3. Children block siblings (most madhhabs)

#### Fixed Share Table
| Heir | With Children | Without Children |
|------|---------------|------------------|
| Husband | 1/4 | 1/2 |
| Wife | 1/8 ÷ total_wives | 1/4 ÷ total_wives |
| Mother | 1/6 | 1/3 |
| Father (with male children) | 1/6 | Residuary |

#### Madhhab Support
- `hanafi`, `shafii`, `maliki`, `hanbali`

### Tool 418: Zakat Calculator

#### Interfaces
```typescript
interface ZakatAssets {
  cash, bankSavings, goldGrams, silverGrams,
  businessInventory, businessCash, accountsReceivable,
  stocks, bonds, mutualFunds, crops, livestock, pension: number;
}

interface ZakatLiabilities {
  shortTermDebts, businessLiabilities: number;
}

interface ZakatResult {
  zakatDue, netWealth, nisabAmount: number;
  isZakatApplicable: boolean;
  zakatRate: number; // 0.025
}

interface NisabStandard {
  type: 'gold' | 'silver';
  amount: number;
  unit: 'grams' | 'tola';
}
```

#### Constants
| Standard | Grams | Tola |
|----------|-------|------|
| Gold Nisab | 87.48g | 7.5 tola |
| Silver Nisab | 612.36g | 52.5 tola |
| 1 tola | 11.664 grams | — |

#### Functions
- `calculateZakat(assets, liabilities, nisabStandard, goldPrice, silverPrice): ZakatResult`
  - Rate: 2.5% of net wealth above nisab
- `calculateAgriculturalZakat(cropValue, irrigationType): number`
  - Rain-fed: 10%, Irrigated: 5%, Mixed: 7.5%
- `calculateLivestockZakat(livestock): Map<string, number>`
  - Camels: 5–9 → 1 sheep, 10–14 → 2 sheep, etc.
  - Cattle: 30–39 → 1 calf, etc.
  - Goats: 40–120 → 1 goat, etc.

### Tool 445: Cheque Generator

#### Constants
- `ONES[]`, `TEENS[]`, `TENS[]`, `SCALES[]` (Trillion→Hundred)

#### Interfaces
```typescript
interface ChequeData {
  payeeName: string;
  amount: number;
  date: Date;
  bankName: string;
  accountNumber?: string;
}
```

#### Functions
- `convertToWords(amount: number): string` — amount to "X Rupees and Y Paisa Only"
- `convertIntegerToWords(n: number): string` — recursive word conversion
- `formatCheque(data: ChequeData): string`

### Age Calculator

#### Interfaces
```typescript
interface AgeResult {
  years, months, days, hours, minutes: number;
  totalDays, totalHours, totalMinutes: number;
  nextBirthday: Date;
  zodiacSign: string;
}
```

#### Functions
- `calculateAge(birthDate, targetDate, birthdayTimezone, targetTimezone): AgeResult`
  - Uses Luxon `DateTime` for timezone handling
- `isLeapYear(year: number): boolean`
- `getDaysInMonth(year: number, month: number): number`
- `getZodiacSign(month: number, day: number): string` — 12 signs with date ranges

### Validation Requirements (all calculators)
| Calculator | Rule |
|------------|------|
| GPA | creditHours > 0, gradePoint in [0, scale], ≥1 course |
| Inheritance | estate > 0, ≥1 heir, no circular relationships |
| Zakat | all amounts ≥ 0, nisab = 'gold' or 'silver', prices provided |
| Cheque | amount > 0 and < 10,000,000, payee non-empty, date < 6 months ahead |
| Age | birthDate < targetDate, birthDate > 1900, valid timezone IDs |

### Error Messages
| Code | Template |
|------|----------|
| `GPA_INVALID_GRADE` | "Grade point must be between 0 and {scale}" |
| `GPA_NO_COURSES` | "At least one course is required" |
| `INHERITANCE_INVALID_HEIR` | "Invalid heir relationship: {relation}" |
| `INHERITANCE_CIRCULAR` | "Circular relationship detected" |
| `ZAKAT_NEGATIVE_AMOUNT` | "Asset amounts cannot be negative" |
| `ZAKAT_INVALID_NISAB` | "Nisab standard must be \"gold\" or \"silver\"" |
| `CHEQUE_AMOUNT_TOO_HIGH` | "Amount exceeds maximum limit of {max}" |
| `CHEQUE_INVALID_DATE` | "Cheque date must be within next 6 months" |
| `AGE_FUTURE_BIRTH` | "Birth date cannot be in the future" |
| `AGE_INVALID_TIMEZONE` | "Invalid timezone: {tz}" |

### Execution Environment
| Tool | Environment |
|------|-------------|
| GPA, Zakat, Cheque | Node.js (synchronous) |
| Inheritance | Node.js (complex validation) |
| Age | Client-side (Luxon for timezone) |

---

## 14. 50_DEFINITION_OF_DONE.md

### Three-Level Acceptance
| Level | Name | Criteria |
|-------|------|----------|
| 1 | Code Complete | All functionality, no TODOs, error handling, logging, comments |
| 2 | Test Verified | Unit + integration passing, manual testing, edge cases, perf benchmarks |
| 3 | Production Ready | Docs, security, accessibility, browser compat, monitoring |

### Code Quality Standards
- Zero ESLint errors
- Zero TypeScript errors
- Zero Prettier violations
- Zero unused imports
- No `console.log` (use logger)
- No commented-out code
- No dead code

### Test Coverage Thresholds
| Category | Minimum Coverage |
|----------|-----------------|
| Critical paths (auth, billing, API keys) | 80% |
| Tools | 60% |
| Utilities | 70% |

### Test Types Required
| Type | Scope |
|------|-------|
| Unit | ≥3 tests per tool (happy path, error, edge case) |
| Integration | API endpoints, DB CRUD, external services (mocked), auth flows |
| E2E | Critical journeys: signup→tool→subscribe, signup→tool→coins→tool, anon→tool+ads |

### Performance Thresholds (API)
| Endpoint Type | p50 | p95 | p99 |
|---------------|-----|-----|-----|
| WASM execution | <10ms | <50ms | <100ms |
| API execution | <50ms | <150ms | <300ms |
| Database queries | <20ms | <50ms | <100ms |
| Authentication | <100ms | <200ms | <400ms |
| **No endpoint** | — | — | **>1s** |

### Performance Thresholds (Frontend / Lighthouse)
| Metric | Target |
|--------|--------|
| Performance score | >90 |
| FCP | <1.5s |
| LCP | <2.5s |
| TTI | <3.5s |
| CLS | <0.1 |
| TBT | <300ms |

### Bundle Size Limits
| Bundle | Max (uncompressed) | Max (gzipped) |
|--------|--------------------|---------------|
| Initial JS | <200KB | <80KB |
| WASM module | <3MB | <1MB |
| CSS | <50KB | <20KB |
| Total first load | <500KB | <200KB |

### Browser Compatibility
- Chrome last 2 versions
- Firefox last 2 versions
- Safari last 2 versions
- Edge last 2 versions
- NOT: IE11, Opera Mini, UC Browser
- Responsive: 375px–1920px
- Touch interactions on mobile

### Accessibility (WCAG 2.1 Level AA)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader (ARIA labels)
- Color contrast ≥4.5:1
- Focus indicators visible
- No flashing content
- Alt text for images
- Form labels and error messages
- Lighthouse Accessibility >90
- Zero critical Axe issues

### Security (OWASP Top 10)
- Parameterized queries (Drizzle ORM)
- JWT rotation, secure session storage
- HTTPS only, encrypt secrets
- RBAC at API level
- CSP headers
- Input sanitization (XSS prevention)
- Validated serialized data
- Dependencies updated (`npm audit` zero high/critical)
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite`
- CSRF protection
- Zod validation on all inputs
- Security event logging

### Documentation Requirements
- JSDoc for all public functions
- TypeScript interfaces documented
- Complex algorithms commented
- OpenAPI/Swagger spec
- User docs: tool instructions, FAQ, error explanations, billing guide

### Phase-Specific Criteria

#### Phase 1 Sign-Off
- 446 tools implemented, API endpoints created, error handling
- 1,338 tests (3 per tool), all passing, manual test 44 tools (10%)
- WASM <50ms p95, API <150ms p95, no memory leaks

#### Phase 2 Sign-Off
- Schema deployed, auth flows, API key system, rate limiting
- 80% coverage auth paths, all auth flows tested, API key tested, rate limiting verified
- JWT rotation, secure cookies, RBAC, zero critical vulns

#### Phase 3 Sign-Off
- 55+ admin features, 2FA for destructive ops, audit logging
- 70% coverage admin features, all actions tested, audit logs verified
- Admin auth separate, 2FA enforced, all actions logged

#### Phase 4 Sign-Off
- All tool UIs, auth/billing integrated, subscription management
- 60% coverage tools, E2E critical journeys, cross-browser
- Lighthouse >90, LCP <2.5s, FCP <1.5s, bundle <200KB gzipped
- Accessibility >90, keyboard nav, screen reader

#### Phase 5 Sign-Off
- Edge cases, error scenarios, performance optimizations
- Load test 1000 concurrent, security audit, browser compat, mobile
- API p95 <150ms, frontend <1.5s, Lighthouse >90
- Monitoring, alerts, backups, rollback procedures documented

---

## 15. 51_BACKEND_SCRAPER_LOGIC.md

### Tool 446: Seaport Terminal Container Activity Tracker

### Data Models (Pydantic)

#### `ContainerTrackResult`
```python
class ContainerTrackResult(BaseModel):
    terminal_name: str          # "KICT"|"KGTL"|"QICT"|"SAPT"
    container_no: str           # Validated: ^[A-Z]{4}\d{7}$
    container_size_n_type: Optional[str]
    shipment_category: Optional[str]  # "IMPORT"|"EXPORT"
    vessel_name: Optional[str]
    voyage_no: Optional[str]
    destination: Optional[str]
    hold_description: Optional[str]
    gate_in_date: Optional[datetime]
    load_date: Optional[datetime]
    container_position: Optional[str]
    vessel_estimated_berth: Optional[datetime]
    vessel_estimated_depart: Optional[datetime]
    vessel_actual_berth: Optional[datetime]
    vessel_actual_depart: Optional[datetime]
    vessel_current_status: Optional[str]  # "Upcoming"|"Arrived"|"Departed"
```

#### `VesselSchedule`
```python
class VesselSchedule(BaseModel):
    terminal_name: str
    vessel_name: str
    voyage_no: Optional[str]
    vessel_estimated_berth: Optional[datetime]
    vessel_estimated_depart: Optional[datetime]
    vessel_actual_berth: Optional[datetime]
    vessel_actual_depart: Optional[datetime]
    vessel_current_status: Optional[str]
```

### Terminal Strategies (4 terminals)

| Terminal | Strategy | Auth | Performance |
|----------|----------|------|-------------|
| KGTL | ASP.NET form + ViewState | None | 1.7s |
| KICT | Dual parallel fetch + PID extraction | None (session) | 9.0s |
| QICT | REST API with credentials | POST body creds | 0.5s |
| SAPT | KICT clone | None (Referer) | 8.8s |

### Functions

#### Terminal Scrapers
- `kgtl_track_container(container_no)` — ASP.NET form submission
- `kict_track_container_html(container_no)` — dual parallel fetch, PID 3-stage fallback
- `qict_track_container(container_no)` — JSON API with credentials
- `sapt_track_container(container_no)` — KICT clone with Referer

#### Core Utilities
- `parse_dt(date_string)` — multi-format parser (6 formats)
- `status_from_ata_atd(ata, atd)` — returns "Upcoming"|"Arrived"|"Departed"
- `map_vessel_times(status, eta, etd)` — returns (est_berth, act_berth, est_depart, act_depart)
- `hashIp(ip)` — SHA-256 hash, first 16 chars (privacy)

#### Connection Pool
- `get_terminal_client(terminal, ...)` — per-terminal async client pool
- `close_all_clients()` — cleanup all pooled connections
- Config: max_keepalive=50, max_connections=100, keepalive_expiry=30s
- HTTP/2 enabled globally

#### Caching
- `cache_service.get_container(terminal, container_no)`
- `cache_service.put_container(terminal, container_no, results)` — 300s TTL
- `cache_service.clear_container_cache(container_no?, terminal?)`
- `cache_service.clear_all_cache()`

#### Bulk Processing
- `track_containers_bulk(request: BulkTrackingRequest)` — auto-search all terminals
- `track_containers_allinone(request: AllInOneTrackingRequest)` — user specifies terminal

### Performance Optimizations
| Optimization | Impact |
|-------------|--------|
| HTTP/2 multiplexing | 15–30% speedup |
| msgspec JSON parsing | 30–50% faster than stdlib |
| Parallel requests (KICT/SAPT) | 290–400ms saved |
| Single-pass HTML parsing | 800–1200ms saved |
| Pre-compiled regex patterns | Minor |

### Environment Variables (Scraper-specific)
| Variable | Value |
|----------|-------|
| `TERMINALS_ENABLED` | `QICT,KICT,KGTL,SAPT` |
| `KICT_HISTORY_URL` | `https://kictl.com/Enquiries/ContainerHistory` |
| `KICT_DETAILS_URL` | `https://kictl.com/Enquiries/ContainerDetails` |
| `KICT_VESSEL_URL` | `https://kictl.com/Enquiries/VesselSchedule` |
| `KICT_SSL_VERIFY` | `false` |
| `KGTL_TRACK_URL` | `https://www.kgtl.com.pk/en/online-tracking` |
| `KGTL_VESSEL_PAGE` | `https://www.kgtl.com.pk/en/vessel-schedule` |
| `QICT_API_URL` | `https://lfs.qict.com.pk/API/api/ds/v1/Ctr-Inq` |
| `QICT_VESSEL_URL` | `https://lfs.qict.com.pk/API/api/ds/v1/V-Berth` |
| `QICT_USER_ID` | `Test` |
| `QICT_PASSWORD` | `Test` |
| `QICT_CELL_NO` | `123456` |
| `SAPT_HISTORY_URL` | `https://www.sapt.com.pk/Enquiries/ContainerHistory` |
| `SAPT_DETAILS_URL` | `https://www.sapt.com.pk/Enquiries/ContainerDetails` |
| `SAPT_VESSEL_URL` | `https://www.sapt.com.pk/Enquiries/VesselSchedule` |
| `REQUEST_TIMEOUT` | `12` |
| `CONNECTION_TIMEOUT` | `4` |
| `CACHE_TTL` | `300` |
| `ENABLE_CONNECTION_POOL` | `true` |
| `DEFAULT_MAX_KEEPALIVE` | `50` |
| `DEFAULT_MAX_CONNECTIONS` | `100` |
| `KEEPALIVE_EXPIRY` | `30` |
| `SCRAPER_USER_AGENT` | Chrome/124 UA string |
| `SCRAPER_ACCEPT_LANGUAGE` | `en-US,en;q=0.9` |
| `SCRAPER_CA_BUNDLE` | Path to cert.pem |

### Date Formats Supported
```
%d-%b-%Y %H:%M          # 22-Nov-2025 14:30
%d-%b-%Y %H:%M:%S       # 22-Nov-2025 14:30:00
%m/%d/%Y %H:%M:%S       # 11/22/2025 14:30:00
%d-%b-%y %H:%M          # 22-Nov-25 14:30
%d-%b-%Y %I:%M %p       # 22-Nov-2025 02:30 PM
%Y-%m-%d %H:%M:%S       # 2025-11-22 14:30:00
```

### Response Formats

#### Standard Response
```json
{
  "success": true,
  "results": [],
  "terminals_searched": [],
  "search_time": 0.0,
  "meta": { "total": 0, "page": 1, "page_size": 100, "total_pages": 0, "has_more": false }
}
```

#### Bulk Response
```json
{
  "success": true,
  "total_containers": 0,
  "successful_containers": 0,
  "failed_containers": 0,
  "results": [],
  "total_time": 0.0,
  "summary": {}
}
```

### Test Containers
| Terminal | Container Numbers |
|----------|-------------------|
| KICT | `CSNU8234026`, `HLXU6412970` |
| QICT | `SEGU4440183` |
| KGTL | `MRKU6711777` |

### Container Validation
- Regex: `^[A-Z]{4}\d{7}$` (4 letters + 7 digits)

### Error Handling
- `httpx.HTTPStatusError` → return placeholder result
- `httpx.TimeoutException` → raise `TimeoutError` with terminal name
- Empty parse → return placeholder `ContainerTrackResult`
- Connection pool preserved on error

### Deployment Checklist (10 items)
1. Set all env vars
2. Configure SSL certs
3. Set QICT credentials
4. Enable HTTP/2
5. Configure pool limits
6. Set up Sentry
7. Enable Prometheus metrics
8. Configure cache TTL
9. Set rate limits per terminal
10. Configure retry with exponential backoff

---

## 16. 52_WASM_BRIDGE_INTERFACE.md

### Crate Info
- Name: `productivity-wasm-core`
- Target: `wasm32-unknown-unknown`
- Build tool: `wasm-pack`
- Package location: `packages/wasm/productivity-wasm-core/`
- Bindings output: `packages/wasm-bindings/pkg/`

### Core Types (Rust)

#### `WasmResponse<T>`
```rust
pub struct WasmResponse<T> {
    pub success: bool,
    pub result: Option<T>,
    pub error: Option<String>,
}
```
- `WasmResponse::ok(result)` — success constructor
- `WasmResponse::err(error)` — error constructor
- `to_json_string(response)` — serialize to JSON string for wasm_bindgen

### Core Types (TypeScript)

#### `WasmResponse<T>`
```typescript
{ success: boolean; result?: T; error?: string; }
```

#### `WasmTextResult`
```typescript
{ output: string; metadata?: { charCount: number; wordCount: number; lineCount: number; } }
```

#### `WasmHashResult`
```typescript
{ hash: string; algorithm: string; }
```

#### `WasmValidationResult`
```typescript
{ valid: boolean; errors?: string[]; }
```

### Exported WASM Functions

#### Text Transformation (Tools 1–50)
| Function | Signature | Purpose |
|----------|-----------|---------|
| `text_uppercase` | `(input: &str) -> String` | To uppercase |
| `text_lowercase` | `(input: &str) -> String` | To lowercase |
| `text_title_case` | `(input: &str, options_json: &str) -> String` | Title case with options |
| `text_reverse` | `(input: &str, mode: &str) -> String` | Reverse chars/words/sentences |
| `text_count` | `(input: &str) -> String` | Count chars/words/lines/bytes |
| `lorem_generate` | `(paragraphs: usize) -> String` | Lorem ipsum generator |

#### Encoding (Tools 51–80)
| Function | Signature | Purpose |
|----------|-----------|---------|
| `base64_encode` | `(input: &str) -> String` | Base64 encode |
| `base64_decode` | `(input: &str) -> String` | Base64 decode |
| `url_encode` | `(input: &str) -> String` | URL encode |
| `url_decode` | `(input: &str) -> String` | URL decode |
| `html_encode` | `(input: &str) -> String` | HTML entity encode |
| `html_decode` | `(input: &str) -> String` | HTML entity decode |

#### Hash (Tools 81–100)
| Function | Signature | Purpose |
|----------|-----------|---------|
| `hash_md5` | `(input: &str) -> String` | MD5 hash |
| `hash_sha256` | `(input: &str) -> String` | SHA-256 hash |
| `hash_sha512` | `(input: &str) -> String` | SHA-512 hash |

#### Format (Tools 101–150)
| Function | Signature | Purpose |
|----------|-----------|---------|
| `json_minify` | `(input: &str) -> String` | Minify JSON |
| `json_prettify` | `(input: &str, indent_size: usize) -> String` | Pretty-print JSON |
| `json_validate` | `(input: &str) -> String` | Validate JSON |
| `xml_prettify` | `(input: &str) -> String` | Pretty-print XML |

### Rust Dependencies (Cargo.toml)
| Crate | Version | Purpose |
|-------|---------|---------|
| `wasm-bindgen` | 0.2 | JS interop |
| `serde` + `serde_json` | 1.0 | Serialization |
| `base64` | 0.21 | Base64 encoding |
| `urlencoding` | 2.1 | URL encoding |
| `htmlescape` | 0.3 | HTML entities |
| `md5` | 0.7 | MD5 hashing |
| `sha2` | 0.10 | SHA-256/512 |
| `quick-xml` | 0.31 | XML parsing |
| `regex` | 1.10 | Pattern matching |
| `wasm-bindgen-test` | 0.3 | Testing |

### Build Configuration (Cargo.toml release profile)
```toml
opt-level = "z"        # Size optimization
lto = true             # Link-time optimization
codegen-units = 1      # Better optimization
panic = "abort"        # Smaller binary
strip = true           # Strip symbols
```

### Build Command
```bash
wasm-pack build --target web --out-dir ../../../packages/wasm-bindings/pkg --release
```

### TypeScript Integration

#### WASM Loader
- `initWasm(): Promise<InitOutput>` — lazy singleton init
- `isWasmLoaded(): boolean`

#### Tool Executor
- `executeWasmTool<T>(toolFunction, input, options?): Promise<WasmResponse<T>>`
- Dynamic function dispatch via `(wasm as any)[toolFunction]`

#### Convenience Functions
- `textUppercase(input)` → `executeWasmTool('text_uppercase', input)`
- `base64Encode(input)` → `executeWasmTool('base64_encode', input)`
- `jsonPrettify(input, indentSize)` → `executeWasmTool('json_prettify', input, {indentSize})`

### Error Handling
- **NEVER panic in WASM** — always return `WasmResponse::err()`
- TypeScript catches all errors in `executeWasmTool` wrapper

### Performance Targets
| Metric | Target |
|--------|--------|
| Development build | ~500KB |
| Production build | 150–250KB |
| Gzipped production | 50–80KB |
| WASM load time (3G) | <500ms |

### Lazy Loading Strategy
- WASM loaded only when first TEXT_CONVERTER tool accessed, not on app startup
- React `lazy()` with WASM preload

### Crate Organization
```
src/
├── lib.rs              # Entry, wasm_bindgen exports
├── types.rs            # WasmResponse, ToolOptions
├── text/               # case.rs, reverse.rs, whitespace.rs
├── encoding/           # base64.rs, url.rs, html.rs
├── hash/               # md5.rs, sha.rs, bcrypt.rs
├── format/             # json.rs, xml.rs, csv.rs
└── utils/              # validation.rs
tests/
└── integration.rs
```

### Testing
- Rust unit tests: `#[cfg(test)]` with `assert_eq!`/`assert!`
- WASM integration tests: `wasm-pack test --headless --firefox` / `--chrome`

### Deployment Checklist (9 items)
1. Build release (`wasm-pack build --release`)
2. Verify size <250KB
3. Test all 191 functions
4. CDN caching: 1 year TTL for `.wasm`
5. MIME type `application/wasm`
6. Brotli/Gzip compression
7. Test offline (WASM caching)
8. Fallback if WASM fails
9. Monitor load times (<500ms on 3G)

---

## CROSS-DOCUMENT SUMMARY

### Total Interfaces/Types Specified: ~30
### Total Functions Specified: ~60+
### Total Redis Key Patterns: 13
### Total Error Codes: 22+
### Total Environment Variables: ~50+
### Total Performance Targets: 15+
### Total Test Requirements: 1,338+ tool tests + coverage thresholds
### Total Integration Points: 8 external services (Stripe, Uploadthing, R2, Upstash, Neon, OAuth ×2, BullMQ)
### Total Deployment Configs: 5 providers (Vercel, Fly.io, Neon, Upstash, Cloudflare R2)
### Total Algorithms: 12+ (GPA ×3, Inheritance ×5, Zakat ×3, Cheque ×1, Age ×1, Zodiac ×1)
