"""
Safe file download with SSRF validation and size enforcement.

All handler _download() methods should delegate here.
Streams the response and aborts if the file exceeds max_bytes.
"""

from __future__ import annotations

import httpx

from src.core.url_validation import validate_download_url

# Default per-engine max download sizes (bytes)
MAX_DOWNLOAD_BYTES: dict[str, int] = {
    "image": 50 * 1024 * 1024,      # 50 MB
    "video": 500 * 1024 * 1024,     # 500 MB
    "audio": 100 * 1024 * 1024,     # 100 MB
    "pdf": 100 * 1024 * 1024,       # 100 MB
    "document": 50 * 1024 * 1024,   # 50 MB
    "archive": 500 * 1024 * 1024,   # 500 MB
    "file": 100 * 1024 * 1024,      # 100 MB
    "font": 20 * 1024 * 1024,       # 20 MB
}

_DEFAULT_MAX = 100 * 1024 * 1024  # 100 MB fallback


async def safe_download(url: str, *, max_bytes: int = _DEFAULT_MAX, timeout: float = 120.0) -> bytes:
    """Download a URL with SSRF validation and streaming size enforcement.

    Raises ValueError if the URL is blocked or the file exceeds max_bytes.
    """
    err = validate_download_url(url)
    if err:
        raise ValueError(f"Blocked download: {err}")

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()

            # Check Content-Length header first (fast reject)
            content_length = resp.headers.get("content-length")
            if content_length and int(content_length) > max_bytes:
                raise ValueError(
                    f"File too large: {int(content_length)} bytes "
                    f"(limit: {max_bytes} bytes)"
                )

            # Stream with running total (handles chunked/no Content-Length)
            chunks: list[bytes] = []
            total = 0
            async for chunk in resp.aiter_bytes(8192):
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError(
                        f"File exceeds size limit during download "
                        f"(limit: {max_bytes} bytes)"
                    )
                chunks.append(chunk)

            return b"".join(chunks)


async def safe_download_multi(
    urls: list[str], *, max_bytes: int = _DEFAULT_MAX, timeout: float = 120.0
) -> list[tuple[str, bytes]]:
    """Download multiple URLs, returning (filename, bytes) tuples.

    Validates SSRF and enforces size limit on each file.
    """
    results: list[tuple[str, bytes]] = []
    for url in urls:
        data = await safe_download(url, max_bytes=max_bytes, timeout=timeout)
        raw_name = url.rsplit("/", 1)[-1].split("?")[0] or f"file_{len(results)}"
        # Sanitize: strip path separators, reject traversal components
        import os
        name = os.path.basename(raw_name.replace("\\", "/"))
        if not name or name in (".", ".."):
            name = f"file_{len(results)}"
        results.append((name, data))
    return results
