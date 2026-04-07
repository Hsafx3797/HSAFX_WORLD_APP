# 71 — Async Job Spec

> **Status**: PARTIALLY BUILT — `apps/web/src/server/jobs/job-manager.ts` processes inline. BullMQ NOT installed (planned Phase 4+).

---

## What Exists

- `job-manager.ts` — Creates jobs, dispatches inline, tracks progress in Redis
- `job-worker.ts` — Processes jobs (imported dynamically to avoid circular deps)
- Job status polling via Redis keys with TTL

## What's Planned (not built)

### BullMQ Queues (Phase 4+)
- `image-conversion` queue — 3 retries, 2s exponential backoff
- `pdf-conversion` queue — 3 retries
- `document-conversion` queue — 3 retries
- `web-scraping` queue — 5 retries, 5s exponential backoff

### Job Database Schema
```
AsyncJob: id, userId, toolId, status (QUEUED/PROCESSING/COMPLETED/FAILED/CANCELLED/EXPIRED),
  priority (LOW/NORMAL/HIGH/URGENT), inputFileKey, parameters (JSON),
  outputFileKey, outputFileName, resultData, progress (0-100), currentStep,
  error, retryCount, maxRetries, expiresAt (3h), timestamps
```

### Status Polling (designed)
- Client hook `useJobPolling(jobId)` — exponential backoff: 1s→2s→5s→10s
- Stops polling on terminal states (completed/failed/cancelled/expired)
- tRPC `jobs.getStatus` query + `jobs.cancelJob` mutation

### WebSocket Updates (premium, not built)
- Real-time job progress for premium users
- JWT-authenticated WebSocket connection
- Subscribe per-job, receive progress/completion events
