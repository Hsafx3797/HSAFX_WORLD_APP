# 47 — Error Handling Implementation

> Error handling strategies, retry logic, and error exposure policies across frontend and backend.

## Status

✅ Core error handling built in `apps/web/src/lib/api-v1-auth.ts` (`apiErrorResponse()`)
✅ Error codes taxonomy (A001-A005, B001-B103, E001-E106, F001-F007, R001-R005, S001-S006, I001-I005) — used in v1 API routes, tested in auth.test.ts
❌ React ErrorBoundary — not verified
❌ withRetry utility — not verified
❌ Structured logger — not verified (console.error only for now)
❌ External error tracking (Sentry) — deferred post-MVP

## Error Classification

| Category         | User Facing | Retryable         | HTTP | Example                                  |
| ---------------- | ----------- | ----------------- | ---- | ---------------------------------------- |
| Validation       | Specific    | No                | 400  | "Invalid JSON format on line 5"          |
| Authorization    | Specific    | No                | 403  | "Upgrade to Pro to use this tool"        |
| Rate Limit       | Specific    | Yes (after delay) | 429  | "Rate limit exceeded. Retry in 30s"      |
| Input Processing | Specific    | No                | 413  | "File size exceeds plan limit"           |
| System           | Generic     | Yes               | 500  | "Something went wrong. Please try again" |
| Network          | Generic     | Yes               | 0    | "Request failed. Please try again"       |
| Database         | Generic     | Yes               | 503  | "Database temporarily unavailable"       |

## Error Exposure Policy

- **User input errors (4xx):** Show specific message + field details + remediation steps
- **System errors (5xx):** Show generic message, log full stack trace internally
- **NEVER expose:** Stack traces, SQL queries, internal service names, API keys

## Retry Strategy

- Max 3 attempts with exponential backoff (1s → 2s → 4s, max 10s)
- Only retry transient errors: network timeouts, 5xx, 429, Redis connection, DB deadlock
- Never retry: validation errors, auth errors, 4xx

## API Error Response Format

```json
{
  "error": {
    "code": "T001",
    "message": "Tool not found",
    "details": {},
    "retryable": false
  }
}
```

Built in `apiErrorResponse(code, message, ctx, status, details?)` — used across all v1 API routes.

## Database Error Mapping

| PG Code      | App Code               | HTTP | Message                       |
| ------------ | ---------------------- | ---- | ----------------------------- |
| 23505        | DUPLICATE_RECORD       | 409  | "Record already exists"       |
| 23503        | INVALID_REFERENCE      | 400  | "Referenced record not found" |
| 23502        | MISSING_REQUIRED_FIELD | 400  | "Required field missing"      |
| ECONNREFUSED | DATABASE_UNAVAILABLE   | 503  | "Try again" (retryable)       |

## Service Error Patterns

- **Stripe:** Card declined (402), Stripe rate limit (429, retryable), Stripe API error (503, retryable)
- **Redis:** Non-critical — fallback to null/skip on failure, never break core flow
- **WASM:** Catch panics, return generic "tool execution failed" (retryable)
- **FastAPI:** Global exception handler, AppError class with status/code/message/retryable

## Frontend Patterns

- React ErrorBoundary wraps app layout
- API client wraps fetch with typed ApiError
- Form validation via Zod with `formatZodErrors()` → per-field display
- Tool-locked → show upgrade prompt; Rate-limited → show countdown

## TODO

- Implement React ErrorBoundary (if not already done)
- Implement `withRetry()` utility for DB/Redis/Stripe calls
- Add structured logger with correlation IDs
- Add Sentry integration (post-MVP)
- Add admin error monitoring dashboard alerts
