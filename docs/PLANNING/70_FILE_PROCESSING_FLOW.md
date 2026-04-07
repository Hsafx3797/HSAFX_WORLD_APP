# 70 — File Processing Flow

> **Status**: SPEC/PROPOSAL — Uploadthing NOT installed, BullMQ NOT installed.
> **R2 storage** ✅ built in `packages/shared/src/storage.ts`

---

## Planned Flow

```
Client Upload → Uploadthing (virus scan) → R2 temp (24h TTL)
→ Job submitted → FastAPI processes → R2 result (3h TTL) → Signed URL download
```

## Uploadthing Config (planned, not built)

5 upload endpoints defined per file type:

- `imageUploader` (10MB max) — Tools 298-320
- `pdfUploader` (50MB max) — Tools 330-345
- `documentUploader` (100MB max) — Tools 350-365
- `audioUploader` (200MB max) — Tools 366-370
- `videoUploader` (500MB max) — Tools 371-375

Each: auth middleware → coin balance check → `db.uploadedFile.create()` → return fileKey

## R2 Storage (✅ built)

`packages/shared/src/storage.ts`:

- `uploadToR2(key, body, contentType)` — PutObject
- `getFromR2(key)` — GetObject stream
- `getSignedDownloadUrl(key, expiration)` — Presigned URL
- `deleteFromR2(key)` — DeleteObject

File naming: `{input|output}/{userId}/{toolId}/{timestamp}-{nanoid}.{ext}`

## Job Submission Flow (planned)

1. Client uploads via Uploadthing → gets fileKey
2. Client calls tRPC mutation (e.g., `convertImage`) with fileKey + options
3. tRPC verifies file ownership, checks coins, deducts coins
4. Creates AsyncJob record, sends to FastAPI `POST /api/v1/jobs/image-convert`
5. Frontend polls job status via tRPC query

## FastAPI Processing (partially built)

Image/PDF/document/audio/video processing endpoints use:

- `libvips` for images, `poppler` for PDFs, `tesseract` for OCR, `ffmpeg` for media
- All installed in `infra/docker/Dockerfile.fastapi`
