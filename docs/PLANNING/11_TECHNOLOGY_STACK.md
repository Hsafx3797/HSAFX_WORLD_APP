# 11 — Technology Stack

> Compacted. Original ~1100 lines → verified essentials. Much of this doc is OUTDATED — written before the engine architecture was implemented.

---

## Reality vs Doc's Vision

**Doc claimed:** "Rust is the ONLY place where logic lives" — Rust WASM for UI, Rust Native for API.

**Actual implementation:** 19 TypeScript engines in `packages/tools/src/engines/` handle ALL 371 client-side tools with 653 presets. Rust WASM is compiled (`backend/rust/text-tools/`) but the engine system uses TS for execution. See `50_TOOL_ENGINE_ARCHITECTURE.md` for the real architecture.

---

## Actual Tool Execution by Group

### Group 1 — Text Tools (192 tools)

- **Engine:** 10 TS engines (case, wrap, comment, markup, filter, transform, encode, hash, counter, unicode)
- **Runtime:** Client-side via `packages/tools` — no server needed for text tools
- **Rust WASM:** Available but secondary to TS engines

### Group 2 — Data Tools (108 tools)

- **Engine:** 5 TS engines (convert, format, schema, diff, api)
- **Runtime:** Node.js (server-side) for parsing/formatting/validation
- **Libraries:** Prettier, AJV, YAML parsers, CSV parsers, etc.

### Group 3 — Media Tools (91 tools, server-side)

- **Stack:** FastAPI (Python) → native binaries via streaming pipes
- **Binaries:** FFmpeg (video/audio), libvips (images), Poppler/MuPDF (PDF), Tesseract (OCR), 7zip/libarchive
- **Storage:** Cloudflare R2 (S3-compatible)
- **Pattern:** `POST /v1/media/convert` → returns `job_id` → `GET /v1/jobs/{job_id}` → poll status
- **Rule:** Never load full files into Python memory — stream via stdin/stdout pipes

### Group 4 — Generators, Calculators, Validators, Unit Converters (73 tools)

- **Engine:** 4 TS engines (generate, calculate, validate, unit)
- **Runtime:** Client-side computations, no server needed

## Monaco Editor Integration (Planned, NOT fully built)

- Client-side lazy-loaded React component (~2MB gzipped)
- Fallback: Prism.js (5KB) for syntax highlighting
- Theme-synced with app theme via CSS variables
- Formatting: debounced API calls to server for Prettier/validators
- Pattern: User types → debounce 300-500ms → `POST /api/format/{tool}` → `monaco.setValue(formatted)` + `monaco.setModelMarkers(errors)`

## Async Job Pattern (Media/Heavy Tools)

```
Client → FastAPI → Redis Queue → Worker → Native Binary → R2 → Client polls result
```

- Returns `202 Accepted` with `job_id` immediately
- Job states: `queued | processing | completed | failed | cancelled`
- Auto-cleanup expired jobs after 24h
- Retry: exponential backoff, max 30s delay, only for retryable errors (PROCESSING_FAILED, WORKER_TIMEOUT, STORAGE_ERROR)
- Non-retryable: INVALID_INPUT, FILE_TOO_LARGE, UNSUPPORTED_FORMAT

## Error Response Contract

**API errors:**

```json
{
  "error": "ValidationError",
  "message": "...",
  "errorCode": "INPUT_TOO_LARGE",
  "statusCode": 400,
  "requestId": "req_abc123"
}
```

**HTTP codes:** 200 success, 202 async queued, 400 client error, 401 unauthorized, 403 forbidden, 404 not found, 413 too large, 422 semantic error, 429 rate limit, 500 server error, 503 unavailable

**Error categories:**

- Validation (4xx): INVALID_INPUT, MISSING_REQUIRED_FIELD, INVALID_FORMAT, INPUT_TOO_LARGE, UNSUPPORTED_OPERATION
- Processing (5xx): TOOL_EXECUTION_FAILED, TIMEOUT, RESOURCE_EXHAUSTED, INTERNAL_ERROR
- Auth (4xx): UNAUTHORIZED, FORBIDDEN, RATE_LIMIT_EXCEEDED, PLAN_LIMIT_EXCEEDED, INVALID_API_KEY

## Performance Targets

| Metric                | Target                    |
| --------------------- | ------------------------- |
| Text engine execution | < 1ms                     |
| API (light tools)     | 5-20ms                    |
| WASM module memory    | 1-3MB                     |
| API server memory     | 30-60MB                   |
| Media worker memory   | 50MB-2GB (file dependent) |
