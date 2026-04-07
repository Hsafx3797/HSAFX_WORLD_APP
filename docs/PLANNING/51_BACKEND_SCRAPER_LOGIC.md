# 51 — Backend Scraper Logic (Container Tracker)

> **Tool 446**: Seaport Terminal Container Activity Tracker
> **Status**: ✅ Fully built in `backend/fastapi/src/api/v1/tracking.py`

---

## Overview

Scrapes 4 Pakistan maritime terminals for container tracking data. Each terminal has unique HTML structure requiring dedicated parsing.

## Terminals

| Terminal                     | Port       | Strategy                       | Auth           |
| ---------------------------- | ---------- | ------------------------------ | -------------- |
| KICT (Karachi International) | Karachi    | Form POST → HTML table parse   | None           |
| KGTL (Karachi Gateway)       | Karachi    | POST JSON API → parse response | None           |
| QICT (Qasim International)   | Port Qasim | Form POST → HTML table parse   | Session cookie |
| SAPT (South Asia Pakistan)   | Port Qasim | POST JSON API → parse response | None           |

**Config**: `backend/fastapi/src/core/config.py` → `TERMINALS_ENABLED=QICT,KICT,KGTL,SAPT`

## Data Model

```python
class ContainerActivity:
    container_number: str      # e.g. "MSCU1234567"
    vessel_name: str
    voyage_number: str
    activity_type: str         # IMPORT/EXPORT/TRANSSHIP
    status: str                # ARRIVED/DISCHARGED/LOADED/GATED-IN/GATED-OUT
    activity_date: datetime
    terminal: str
    line_code: str
    size_type: str             # 20GP, 40HC, etc
    weight: float | None
    seal_number: str | None
```

## Performance Optimizations

- **HTTP/2** with `httpx.AsyncClient` + connection pooling
- **msgspec** for zero-copy JSON deserialization (faster than pydantic for scraping)
- **Parallel requests** via `asyncio.gather()` for bulk container lookups
- **Response caching**: Redis with 15-min TTL for identical queries
- **Rate limiting**: Per-terminal rate limits to avoid IP blocks
- **Retry**: Exponential backoff with jitter (3 retries max)

## API Endpoints

- `POST /api/v1/tracking/track` — Single container lookup (terminal auto-detect or specified)
- `POST /api/v1/tracking/bulk` — Bulk lookup (up to 25 containers, parallel across terminals)
- `GET /api/v1/tracking/terminals` — List available terminals + status

## Environment Variables

- `TERMINALS_ENABLED` — Comma-separated terminal codes
- `TRACKING_CACHE_TTL` — Redis cache TTL (default 900s)
- `TRACKING_MAX_BULK` — Max containers per bulk request (default 25)
