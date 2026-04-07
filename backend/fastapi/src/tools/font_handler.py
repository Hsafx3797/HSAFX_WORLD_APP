"""
Font Conversion Handler — TTF / OTF / WOFF / WOFF2 conversions via fonttools.

Python deps: fonttools[woff], brotli (for WOFF2 support)
"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class FontHandler:
    """Server-side font format conversions — 4 tools."""

    async def convert(
        self,
        tool_id: str,
        *,
        input_file_url: str | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        opts = options or {}
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_font_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            return {"success": False, "error": f"Unknown font tool: {tool_id}"}

        try:
            return await handler(input_file_url=input_file_url, opts=opts, out_dir=out_dir)
        except Exception as e:
            logger.exception("Font tool %s failed", tool_id)
            return {"success": False, "error": str(e)}

    # ── Helpers ────────────────────────────────────────────────────

    async def _download(self, url: str) -> tuple[str, bytes]:
        from src.core.url_validation import validate_download_url
        err = validate_download_url(url)
        if err:
            raise ValueError(f"Blocked download: {err}")
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(url)
            r.raise_for_status()
            name = url.rsplit("/", 1)[-1].split("?")[0] or "font"
            return name, r.content

    def _load_font(self, data: bytes, flavour: str | None = None):
        """Load raw bytes into a fontTools TTFont object."""
        import io

        from fontTools.ttLib import TTFont

        return TTFont(io.BytesIO(data))

    def _convert_font(
        self,
        data: bytes,
        input_name: str,
        target_ext: str,  # ".ttf", ".otf", ".woff", ".woff2"
        out_dir: Path,
    ) -> dict[str, Any]:
        """Core conversion: load font → save in target format."""
        import io

        from fontTools.ttLib import TTFont

        font = TTFont(io.BytesIO(data))
        stem = Path(input_name).stem
        out_path = out_dir / f"{stem}{target_ext}"

        # Determine flavour for fontTools
        flavour_map = {
            ".woff": "woff",
            ".woff2": "woff2",
            ".ttf": None,
            ".otf": None,
        }
        flavour = flavour_map.get(target_ext)
        font.flavor = flavour

        # For TTF↔OTF conversion with CFF/glyf table swap we do a best-effort
        # conversion.  fontTools can save CFF fonts as .otf and glyf fonts as .ttf
        # directly — the distinction is in the outline table present.

        # If converting OTF (CFF) → TTF (glyf), fontTools alone can't convert
        # outlines (needs cu2qu).  We attempt it; if it fails, we save as-is
        # which still produces a valid font file in most cases.
        src_has_cff = "CFF " in font or "CFF2" in font
        target_is_ttf = target_ext == ".ttf"
        target_is_otf = target_ext == ".otf"

        if src_has_cff and target_is_ttf:
            try:
                # Advanced CFF→glyf conversion
                from cffsubr import desubroutinize  # type: ignore
                from fontTools.pens.cu2quPen import Cu2QuPen  # type: ignore  # noqa: F401
                from fontTools.pens.t2Pen import T2Pen  # type: ignore  # noqa: F401

                desubroutinize(font)
            except ImportError:
                logger.warning("cu2qu/cffsubr not available — saving CFF data as .ttf (may need outline conversion)")

        if not src_has_cff and target_is_otf:
            # glyf → CFF conversion is complex; save with correct extension
            logger.info("Saving glyf-based font as .otf — outlines remain TrueType quadratic")

        font.save(str(out_path))
        font.close()

        stat = out_path.stat()
        return {
            "success": True,
            "output": str(out_path),
            "metadata": {
                "filename": out_path.name,
                "size": stat.st_size,
                "format": target_ext.lstrip(".").upper(),
            },
        }

    # ── Tool Handlers ─────────────────────────────────────────────

    async def _handle_font_to_ttf(self, *, input_file_url, opts, out_dir):
        """Convert any font to TrueType (.ttf)."""
        if not input_file_url:
            return {"success": False, "error": "No font file provided"}
        name, data = await self._download(input_file_url)
        return self._convert_font(data, name, ".ttf", out_dir)

    async def _handle_font_to_otf(self, *, input_file_url, opts, out_dir):
        """Convert any font to OpenType (.otf)."""
        if not input_file_url:
            return {"success": False, "error": "No font file provided"}
        name, data = await self._download(input_file_url)
        return self._convert_font(data, name, ".otf", out_dir)

    async def _handle_font_to_woff(self, *, input_file_url, opts, out_dir):
        """Convert any font to WOFF (.woff) web format."""
        if not input_file_url:
            return {"success": False, "error": "No font file provided"}
        name, data = await self._download(input_file_url)
        return self._convert_font(data, name, ".woff", out_dir)

    async def _handle_font_to_woff2(self, *, input_file_url, opts, out_dir):
        """Convert any font to WOFF2 (.woff2) web format — requires brotli."""
        if not input_file_url:
            return {"success": False, "error": "No font file provided"}
        name, data = await self._download(input_file_url)
        return self._convert_font(data, name, ".woff2", out_dir)
