"""
File Operations Handler — Bulk rename, extension change, flatten, hash, metadata.

Handles file-level utilities that operate on uploaded files without format conversion.

Python deps: Pillow (for EXIF metadata), python-magic (optional, MIME detection)
"""

from __future__ import annotations

import hashlib
import io
import json
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class FileHandler:
    """Server-side file operations — 5 tools."""

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
        _created_tmp = output_dir is None
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_file_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": f"Unknown file tool: {tool_id}"}

        try:
            result = await handler(
                input_file_url=input_file_url,
                input_file_urls=input_file_urls,
                opts=opts,
                out_dir=out_dir,
            )
            if _created_tmp:
                result["_tmp_dir"] = str(out_dir)
            return result
        except Exception as e:
            logger.exception("File tool %s failed", tool_id)
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": str(e)}

    # ── Helpers ────────────────────────────────────────────────────

    async def _download(self, url: str) -> tuple[str, bytes]:
        """Download file, return (filename, data)."""
        from src.core.safe_download import MAX_DOWNLOAD_BYTES, safe_download
        data = await safe_download(url, max_bytes=MAX_DOWNLOAD_BYTES["file"])
        name = url.rsplit("/", 1)[-1].split("?")[0] or "file"
        return name, data

    async def _download_multi(self, urls: list[str]) -> list[tuple[str, bytes]]:
        from src.core.safe_download import MAX_DOWNLOAD_BYTES, safe_download_multi
        return await safe_download_multi(urls, max_bytes=MAX_DOWNLOAD_BYTES["file"])

    # ── Bulk Rename ────────────────────────────────────────────────

    async def _handle_bulk_rename(self, *, input_file_urls, opts, out_dir, **kw):
        """Rename files in bulk using a pattern."""
        urls = input_file_urls or []
        if not urls:
            return {"success": False, "error": "No files provided"}

        items = await self._download_multi(urls)
        pattern = opts.get("pattern", "{name}_{index}")
        start_index = int(opts.get("startIndex", 1))
        find = opts.get("find", "")
        replace = opts.get("replace", "")

        output_files = []
        for i, (original_name, data) in enumerate(items):
            stem = Path(original_name).stem
            ext = Path(original_name).suffix

            if find:
                # Find-and-replace mode
                new_stem = stem.replace(find, replace)
            else:
                # Pattern mode
                new_stem = (
                    pattern
                    .replace("{name}", stem)
                    .replace("{index}", str(start_index + i))
                    .replace("{ext}", ext.lstrip("."))
                )

            new_name = f"{new_stem}{ext}"
            out_path = out_dir / new_name
            out_path.write_bytes(data)
            output_files.append(str(out_path))

        return {"success": True, "output": output_files, "metadata": {"file_count": len(output_files)}}

    # ── Batch Extension Change ─────────────────────────────────────

    async def _handle_batch_extension(self, *, input_file_urls, opts, out_dir, **kw):
        """Change file extensions in batch."""
        urls = input_file_urls or []
        if not urls:
            return {"success": False, "error": "No files provided"}

        items = await self._download_multi(urls)
        new_ext = opts.get("extension", "").lstrip(".")
        if not new_ext:
            return {"success": False, "error": "No target extension specified"}

        output_files = []
        for name, data in items:
            stem = Path(name).stem
            new_name = f"{stem}.{new_ext}"
            out_path = out_dir / new_name
            out_path.write_bytes(data)
            output_files.append(str(out_path))

        return {"success": True, "output": output_files, "metadata": {"file_count": len(output_files), "extension": new_ext}}

    # ── Flatten Folder ─────────────────────────────────────────────

    async def _handle_flatten_folder(self, *, input_file_urls, opts, out_dir, **kw):
        """Flatten uploaded files into a single directory (strip folder paths)."""
        urls = input_file_urls or []
        if not urls:
            return {"success": False, "error": "No files provided"}

        items = await self._download_multi(urls)
        separator = opts.get("separator", "_")
        output_files = []
        seen_names: dict[str, int] = {}

        for name, data in items:
            # Replace path separators with the chosen separator
            flat_name = name.replace("/", separator).replace("\\", separator)

            # Handle duplicates
            if flat_name in seen_names:
                seen_names[flat_name] += 1
                stem = Path(flat_name).stem
                ext = Path(flat_name).suffix
                flat_name = f"{stem}_{seen_names[flat_name]}{ext}"
            else:
                seen_names[flat_name] = 0

            out_path = out_dir / flat_name
            out_path.write_bytes(data)
            output_files.append(str(out_path))

        return {"success": True, "output": output_files, "metadata": {"file_count": len(output_files)}}

    # ── File Hash Generator ────────────────────────────────────────

    async def _handle_file_hash_generator(self, *, input_file_url, opts, out_dir, **kw):
        """Generate MD5, SHA-256, SHA-512 hashes for a file."""
        if not input_file_url:
            return {"success": False, "error": "No file provided"}

        name, data = await self._download(input_file_url)
        algorithms = opts.get("algorithms", ["md5", "sha256", "sha512"])
        if isinstance(algorithms, str):
            algorithms = [a.strip() for a in algorithms.split(",")]

        ALLOWED_ALGORITHMS = {"md5", "sha1", "sha256", "sha384", "sha512"}
        hashes = {}
        for algo in algorithms:
            algo_lower = algo.lower().replace("-", "")
            if algo_lower in ALLOWED_ALGORITHMS:
                h = hashlib.new(algo_lower)
                h.update(data)
                hashes[algo] = h.hexdigest()

        return {
            "success": True,
            "output": json.dumps({"filename": name, "size": len(data), "hashes": hashes}, indent=2),
            "metadata": {"filename": name, "size": len(data), **hashes},
        }

    # ── Metadata Viewer ────────────────────────────────────────────

    async def _handle_metadata_viewer(self, *, input_file_url, opts, out_dir, **kw):
        """View EXIF/XMP/IPTC metadata from files (primarily images)."""
        if not input_file_url:
            return {"success": False, "error": "No file provided"}

        name, data = await self._download(input_file_url)
        metadata: dict[str, Any] = {"filename": name, "size": len(data)}

        # Try Pillow EXIF
        try:
            from PIL import ExifTags, Image
            img = Image.open(io.BytesIO(data))
            metadata["format"] = img.format
            metadata["mode"] = img.mode
            metadata["dimensions"] = {"width": img.width, "height": img.height}

            exif_data = img.getexif()
            if exif_data:
                exif_dict = {}
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    try:
                        exif_dict[tag_name] = str(value) if not isinstance(value, (str, int, float)) else value
                    except Exception:
                        exif_dict[tag_name] = repr(value)
                metadata["exif"] = exif_dict

            # XMP
            xmp = img.info.get("xmp")
            if xmp:
                metadata["xmp_present"] = True

        except Exception:
            # Not an image — try basic file metadata
            ext = Path(name).suffix.lower()
            metadata["extension"] = ext

            # Try PyPDF for PDF files
            if ext == ".pdf":
                try:
                    import pypdf
                    reader = pypdf.PdfReader(io.BytesIO(data))
                    info = reader.metadata
                    if info:
                        pdf_meta = {}
                        for key in ["/Title", "/Author", "/Subject", "/Creator", "/Producer", "/CreationDate"]:
                            val = info.get(key)
                            if val:
                                pdf_meta[key.lstrip("/")] = str(val)
                        metadata["pdf"] = pdf_meta
                        metadata["pages"] = len(reader.pages)
                except Exception:
                    pass

        return {
            "success": True,
            "output": json.dumps(metadata, indent=2, default=str),
            "metadata": metadata,
        }

    # ── File Structure Analysis ────────────────────────────────────

    async def _handle_file_structure(self, *, input_file_url=None, input_file_urls=None, opts, out_dir, **kw):
        """
        Analyze file structure of archives (zip, tar, etc.) or list file properties.

        For archive files: extracts internal directory tree with sizes.
        For regular files: returns file info (name, size, type).
        """
        urls = input_file_urls or ([input_file_url] if input_file_url else [])
        if not urls:
            return {"success": False, "error": "No files provided"}

        import mimetypes
        import tarfile
        import zipfile

        results = []
        for url in urls:
            name, data = await self._download(url)
            ext = Path(name).suffix.lower()
            mime_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
            file_info: dict[str, Any] = {
                "filename": name,
                "size": len(data),
                "type": mime_type,
                "extension": ext,
            }

            # Analyze archive structure
            if ext == ".zip" or mime_type == "application/zip":
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as zf:
                        entries = []
                        total_uncompressed = 0
                        for info in zf.infolist():
                            entries.append({
                                "path": info.filename,
                                "is_dir": info.is_dir(),
                                "compressed_size": info.compress_size,
                                "uncompressed_size": info.file_size,
                            })
                            total_uncompressed += info.file_size
                        file_info["archive_type"] = "zip"
                        file_info["entries"] = entries
                        file_info["entry_count"] = len(entries)
                        file_info["total_uncompressed_size"] = total_uncompressed
                except zipfile.BadZipFile:
                    file_info["error"] = "Invalid or corrupted ZIP file"

            elif ext in (".tar", ".tgz", ".tar.gz", ".tar.bz2", ".tar.xz") or name.endswith((".tar.gz", ".tar.bz2", ".tar.xz")):
                try:
                    mode = "r:*"
                    with tarfile.open(fileobj=io.BytesIO(data), mode=mode) as tf:
                        entries = []
                        total_size = 0
                        for member in tf.getmembers():
                            entries.append({
                                "path": member.name,
                                "is_dir": member.isdir(),
                                "size": member.size,
                                "mode": oct(member.mode) if member.mode else None,
                            })
                            total_size += member.size
                        file_info["archive_type"] = "tar"
                        file_info["entries"] = entries
                        file_info["entry_count"] = len(entries)
                        file_info["total_uncompressed_size"] = total_size
                except (tarfile.TarError, Exception) as e:
                    file_info["error"] = f"Failed to read tar archive: {str(e)}"
            else:
                # Non-archive file — just return basic info
                file_info["is_archive"] = False

            results.append(file_info)

        return {
            "success": True,
            "output": json.dumps(results, indent=2, default=str),
            "metadata": {"file_count": len(results)},
        }
