# 73 — Tool Execution Router

> **Status**: PARTIALLY BUILT — Execution routing exists in `apps/web/src/lib/tools/executor.ts` and `wasm-loader.ts`, but NOT the full router pattern described here.

---

## Actual Implementation

- `executor.ts` — Switch/case dispatch per tool category with direct function calls
- `wasm-loader.ts` — Text tool execution via WASM engines (191 tools)
- `job-manager.ts` — Async job dispatch (inline processing, not BullMQ)

## Planned Router Pattern (not built as described)

### Execution Paths

| Path          | Tools                                 | Runtime            | Method                               |
| ------------- | ------------------------------------- | ------------------ | ------------------------------------ |
| WASM          | 1-191 (text)                          | Client-side, sync  | `executeBySlug()` via engine presets |
| Node.js       | 192-414 (data/generators/calculators) | Client-side, sync  | `executor.ts` handlers               |
| Native/Python | 298-379 (files), 446 (scraper)        | Server-side, async | FastAPI + job queue                  |
| Media         | 91 media tools                        | Server-side, async | FastAPI (ffmpeg/libvips)             |

### Flow

```
User Input → Permission check → Coin balance check →
  WASM? → executeBySlug(slug, input) → instant result
  Node.js? → executor.ts handler → instant result
  Server? → Upload to R2 → Create AsyncJob → Submit to FastAPI → Return jobId → Poll
```

### Caching Strategy

- Only for deterministic + cacheable tools
- Cache key: `tool:{id}:{sha256(input+options)[:16]}`
- TTL: 1 hour
- Redis via `@upstash/redis`

### Error Handling

- Don't retry: PermissionError, InsufficientCoinsError, ValidationError
- Retry with exponential backoff: network/server errors (max 3)

### WASM Fallback

- If WASM fails to load → falls back to JS engine implementation
- `wasm-loader.ts` handles this transparently
