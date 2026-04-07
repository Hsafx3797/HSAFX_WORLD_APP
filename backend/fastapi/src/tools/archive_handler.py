"""
Archive Handler — ZIP, RAR, 7z, TAR, GZ, TGZ, BZ2, XZ.

Handles compression and decompression of archive formats.

Binary deps: p7zip-full (7z), unrar (RAR)
Python deps: py7zr, rarfile (optional)
"""

from __future__ import annotations

import asyncio
import gzip
import io
import logging
import lzma
import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class ArchiveHandler:
    """Server-side archive compression/decompression — 8 tools."""

    @staticmethod
    def _validate_member_path(member_name: str, extract_dir: Path) -> bool:
        """Return True if member_name resolves inside extract_dir (prevents ZIP slip)."""
        resolved = (extract_dir / member_name).resolve()
        return str(resolved).startswith(str(extract_dir.resolve()))

    async def convert(
        self,
        tool_id: str,
        *,
        input_file_url: str | None = None,
        input_file_urls: list[str] | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        opts = options or {}
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_archive_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            return {"success": False, "error": f"Unknown archive tool: {tool_id}"}

        try:
            return await handler(
                input_file_url=input_file_url,
                input_file_urls=input_file_urls,
                opts=opts,
                out_dir=out_dir,
            )
        except Exception as e:
            logger.exception("Archive tool %s failed", tool_id)
            return {"success": False, "error": str(e)}

    # ── Helpers ────────────────────────────────────────────────────

    async def _download(self, url: str) -> bytes:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.content

    async def _download_multi(self, urls: list[str]) -> list[tuple[str, bytes]]:
        """Download files, returning (filename, bytes) tuples."""
        async with httpx.AsyncClient(timeout=120) as client:
            results = []
            for url in urls:
                r = await client.get(url)
                r.raise_for_status()
                # Extract filename from URL
                name = url.rsplit("/", 1)[-1].split("?")[0] or f"file_{len(results)}"
                results.append((name, r.content))
            return results

    async def _run_cmd(self, cmd: list[str], timeout: int = 300):
        return await asyncio.to_thread(
            __import__("subprocess").run, cmd, capture_output=True, timeout=timeout
        )

    # ── ZIP ────────────────────────────────────────────────────────

    async def _handle_zip_tool(self, *, input_file_url, input_file_urls, opts, out_dir):
        """Compress files to ZIP or decompress a ZIP archive."""
        action = opts.get("action", "compress")

        if action == "decompress" and input_file_url:
            data = await self._download(input_file_url)
            extract_dir = out_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                # Validate all member paths to prevent ZIP slip (path traversal)
                for member in zf.namelist():
                    member_path = (extract_dir / member).resolve()
                    if not str(member_path).startswith(str(extract_dir.resolve())):
                        return {"success": False, "error": f"Unsafe path in archive: {member}"}
                zf.extractall(extract_dir)
            files = [str(p) for p in extract_dir.rglob("*") if p.is_file()]
            return {"success": True, "output": files, "metadata": {"file_count": len(files)}}

        # Compress
        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        if not urls:
            return {"success": False, "error": "No files provided"}

        items = await self._download_multi(urls)
        out_path = out_dir / "archive.zip"
        compression = getattr(zipfile, f"ZIP_{opts.get('compression', 'DEFLATED').upper()}", zipfile.ZIP_DEFLATED)

        with zipfile.ZipFile(out_path, "w", compression=compression) as zf:
            for name, data in items:
                zf.writestr(name, data)

        return {"success": True, "output": str(out_path), "metadata": {"file_count": len(items), "size": out_path.stat().st_size}}

    # ── RAR ────────────────────────────────────────────────────────

    async def _handle_rar_tool(self, *, input_file_url, input_file_urls, opts, out_dir):
        """Decompress RAR archive (compression requires WinRAR/rar binary)."""
        action = opts.get("action", "decompress")

        if action == "decompress" and input_file_url:
            data = await self._download(input_file_url)
            input_path = out_dir / "input.rar"
            input_path.write_bytes(data)
            extract_dir = out_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)

            try:
                import rarfile
                with rarfile.RarFile(str(input_path)) as rf:
                    for member in rf.namelist():
                        if not self._validate_member_path(member, extract_dir):
                            return {"success": False, "error": f"Unsafe path in archive: {member}"}
                    rf.extractall(str(extract_dir))
            except ImportError:
                # Fallback to unrar CLI
                unrar = shutil.which("unrar")
                if not unrar:
                    return {"success": False, "error": "RAR extraction not available (install unrar)"}
                result = await self._run_cmd([unrar, "x", "-y", str(input_path), str(extract_dir) + "/"])
                if result.returncode != 0:
                    return {"success": False, "error": "RAR extraction failed"}

            files = [str(p) for p in extract_dir.rglob("*") if p.is_file()]
            return {"success": True, "output": files, "metadata": {"file_count": len(files)}}

        # Compress to RAR (requires rar binary)
        rar_bin = shutil.which("rar")
        if not rar_bin:
            return {"success": False, "error": "RAR compression requires 'rar' binary"}

        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        items = await self._download_multi(urls)
        staging = out_dir / "staging"
        staging.mkdir(exist_ok=True)
        for name, data in items:
            (staging / name).write_bytes(data)

        out_path = out_dir / "archive.rar"
        result = await self._run_cmd([rar_bin, "a", str(out_path)] + [str(staging / n) for n, _ in items])
        if result.returncode != 0:
            return {"success": False, "error": "RAR compression failed"}
        return {"success": True, "output": str(out_path)}

    # ── 7z ────────────────────────────────────────────────────────

    async def _handle_7z_tool(self, *, input_file_url, input_file_urls, opts, out_dir):
        """Compress/decompress 7z archives."""
        action = opts.get("action", "compress")

        if action == "decompress" and input_file_url:
            data = await self._download(input_file_url)
            input_path = out_dir / "input.7z"
            input_path.write_bytes(data)
            extract_dir = out_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)

            try:
                import py7zr
                with py7zr.SevenZipFile(str(input_path), mode="r") as z:
                    for member in z.getnames():
                        if not self._validate_member_path(member, extract_dir):
                            return {"success": False, "error": f"Unsafe path in archive: {member}"}
                    z.extractall(path=str(extract_dir))
            except ImportError:
                # Fallback to 7z CLI
                bin_7z = shutil.which("7z") or shutil.which("7za")
                if not bin_7z:
                    return {"success": False, "error": "7z not available (install p7zip)"}
                result = await self._run_cmd([bin_7z, "x", f"-o{extract_dir}", "-y", str(input_path)])
                if result.returncode != 0:
                    return {"success": False, "error": "7z extraction failed"}

            files = [str(p) for p in extract_dir.rglob("*") if p.is_file()]
            return {"success": True, "output": files, "metadata": {"file_count": len(files)}}

        # Compress
        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        items = await self._download_multi(urls)
        out_path = out_dir / "archive.7z"

        try:
            import py7zr
            with py7zr.SevenZipFile(str(out_path), mode="w") as z:
                for name, file_data in items:
                    z.writestr(file_data, name)
        except ImportError:
            bin_7z = shutil.which("7z") or shutil.which("7za")
            if not bin_7z:
                return {"success": False, "error": "7z not available"}
            staging = out_dir / "staging"
            staging.mkdir(exist_ok=True)
            for name, file_data in items:
                (staging / name).write_bytes(file_data)
            result = await self._run_cmd([bin_7z, "a", str(out_path)] + [str(staging / n) for n, _ in items])
            if result.returncode != 0:
                return {"success": False, "error": "7z compression failed"}

        return {"success": True, "output": str(out_path), "metadata": {"file_count": len(items)}}

    # ── TAR ────────────────────────────────────────────────────────

    async def _handle_tar_tool(self, *, input_file_url, input_file_urls, opts, out_dir):
        """Create or extract TAR archives."""
        action = opts.get("action", "compress")

        if action == "decompress" and input_file_url:
            data = await self._download(input_file_url)
            extract_dir = out_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)
            with tarfile.open(fileobj=io.BytesIO(data), mode="r:*") as tf:
                for member in tf.getmembers():
                    if not self._validate_member_path(member.name, extract_dir):
                        return {"success": False, "error": f"Unsafe path in archive: {member.name}"}
                tf.extractall(extract_dir, filter="data")
            files = [str(p) for p in extract_dir.rglob("*") if p.is_file()]
            return {"success": True, "output": files, "metadata": {"file_count": len(files)}}

        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        items = await self._download_multi(urls)
        out_path = out_dir / "archive.tar"
        with tarfile.open(out_path, "w") as tf:
            for name, file_data in items:
                info = tarfile.TarInfo(name=name)
                info.size = len(file_data)
                tf.addfile(info, io.BytesIO(file_data))

        return {"success": True, "output": str(out_path), "metadata": {"file_count": len(items)}}

    # ── GZ ────────────────────────────────────────────────────────

    async def _handle_gz_tool(self, *, input_file_url, opts, out_dir, **kw):
        """GZIP compress or decompress a single file."""
        action = opts.get("action", "compress")
        data = await self._download(input_file_url)

        if action == "decompress":
            decompressed = gzip.decompress(data)
            out_path = out_dir / "decompressed"
            out_path.write_bytes(decompressed)
            return {"success": True, "output": str(out_path), "metadata": {"original_size": len(data), "size": len(decompressed)}}

        compressed = gzip.compress(data, compresslevel=int(opts.get("level", 9)))
        out_path = out_dir / "compressed.gz"
        out_path.write_bytes(compressed)
        return {"success": True, "output": str(out_path), "metadata": {"original_size": len(data), "compressed_size": len(compressed)}}

    # ── TGZ ────────────────────────────────────────────────────────

    async def _handle_tgz_tool(self, *, input_file_url, input_file_urls, opts, out_dir):
        """Create or extract .tar.gz (TGZ) archives."""
        action = opts.get("action", "compress")

        if action == "decompress" and input_file_url:
            data = await self._download(input_file_url)
            extract_dir = out_dir / "extracted"
            extract_dir.mkdir(exist_ok=True)
            with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tf:
                for member in tf.getmembers():
                    if not self._validate_member_path(member.name, extract_dir):
                        return {"success": False, "error": f"Unsafe path in archive: {member.name}"}
                tf.extractall(extract_dir, filter="data")
            files = [str(p) for p in extract_dir.rglob("*") if p.is_file()]
            return {"success": True, "output": files, "metadata": {"file_count": len(files)}}

        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        items = await self._download_multi(urls)
        out_path = out_dir / "archive.tar.gz"
        with tarfile.open(out_path, "w:gz") as tf:
            for name, file_data in items:
                info = tarfile.TarInfo(name=name)
                info.size = len(file_data)
                tf.addfile(info, io.BytesIO(file_data))

        return {"success": True, "output": str(out_path), "metadata": {"file_count": len(items)}}

    # ── BZ2 ────────────────────────────────────────────────────────

    async def _handle_bz2_tool(self, *, input_file_url, opts, out_dir, **kw):
        """BZ2 compress or decompress."""
        import bz2
        action = opts.get("action", "compress")
        data = await self._download(input_file_url)

        if action == "decompress":
            decompressed = bz2.decompress(data)
            out_path = out_dir / "decompressed"
            out_path.write_bytes(decompressed)
            return {"success": True, "output": str(out_path)}

        compressed = bz2.compress(data, compresslevel=int(opts.get("level", 9)))
        out_path = out_dir / "compressed.bz2"
        out_path.write_bytes(compressed)
        return {"success": True, "output": str(out_path), "metadata": {"original_size": len(data), "compressed_size": len(compressed)}}

    # ── XZ ────────────────────────────────────────────────────────

    async def _handle_xz_tool(self, *, input_file_url, opts, out_dir, **kw):
        """XZ (LZMA2) compress or decompress."""
        action = opts.get("action", "compress")
        data = await self._download(input_file_url)

        if action == "decompress":
            decompressed = lzma.decompress(data)
            out_path = out_dir / "decompressed"
            out_path.write_bytes(decompressed)
            return {"success": True, "output": str(out_path)}

        compressed = lzma.compress(data, preset=int(opts.get("level", 6)))
        out_path = out_dir / "compressed.xz"
        out_path.write_bytes(compressed)
        return {"success": True, "output": str(out_path), "metadata": {"original_size": len(data), "compressed_size": len(compressed)}}
