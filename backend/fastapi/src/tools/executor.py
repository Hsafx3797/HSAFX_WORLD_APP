"""
Tool Executor — Central dispatcher for server-side tool execution.

Routes 121 tool IDs across 9 handlers (from packages/tool-definitions/src/registry/media-tools.ts)
to the correct handler class.  Tool IDs MUST match the source-of-truth definitions;
any rename in media-tools.ts must be reflected here.

Handler classes:
  ImageConverter   — Pillow / libvips image processing (14 tools)
  VideoConverter   — FFmpeg video processing (4 tools)
  AudioConverter   — FFmpeg audio processing (2 tools¹)
  DocumentConverter — LibreOffice / Calibre / Poppler doc conversions (15 tools)
  PdfHandler       — pypdf / reportlab / Ghostscript PDF ops (27 tools)
  ArchiveHandler   — zip / tar / 7z / rar compression (8 tools)
  FileHandler      — Bulk rename / hash / metadata file ops (5 tools)
  FontHandler      — fonttools TTF / OTF / WOFF / WOFF2 (4 tools)
  PythonToolExecutor — Pure-Python NLP / data-science tools (13 tools)

¹ speech-to-text and speech-to-text-2 are Audio subcategory in media-tools.ts
  but routed to PythonToolExecutor (Whisper model, not FFmpeg).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from .archive_handler import ArchiveHandler
from .audio_converter import AudioConverter
from .document_converter import DocumentConverter
from .file_handler import FileHandler
from .font_handler import FontHandler
from .image_converter import ImageConverter
from .pdf_handler import PdfHandler
from .python_tools import PythonToolExecutor
from .video_converter import VideoConverter

logger = logging.getLogger(__name__)

# ── Singleton handler instances ──────────────────────────────────

_image_converter = ImageConverter()
_video_converter = VideoConverter()
_audio_converter = AudioConverter()
_document_converter = DocumentConverter()
_pdf_handler = PdfHandler()
_archive_handler = ArchiveHandler()
_file_handler = FileHandler()
_font_handler = FontHandler()
_python_tools = PythonToolExecutor()

# ── Canonical tool-ID sets (source: media-tools.ts) ─────────────
# Keep alphabetically sorted within each set for easy diffing.

IMAGE_TOOLS: set[str] = {
    "ai-eps-convert",
    "camera-raw-convert",
    "heic-convert",
    "image-batch-filters",
    "image-canvas-resize",
    "image-color-mode",
    "image-compress",          # extra (not in media-tools but implemented)
    "image-crop",
    "image-flip",
    "image-metadata-strip",    # extra
    "image-metadata-view",     # extra
    "image-resize",
    "image-rotate",
    "image-thumbnail",         # extra
    "image-to-ascii",
    "image-watermark",         # extra
    "psd-convert",
    "raster-to-raster",
    "svg-convert",
}

VIDEO_TOOLS: set[str] = {
    "extract-audio",
    "video-compress",
    "video-convert",
    "video-to-gif",
    # Extras (implemented, not in canonical defs but functional):
    "video-extract-frames",
    "video-metadata-strip",
    "video-metadata-view",
    "video-resize",
    "video-rotate",
    "video-speed",
    "video-thumbnail",
    "video-transcode",         # legacy alias kept
    "video-trim",
}

AUDIO_TOOLS: set[str] = {
    "audio-compress",          # extra
    "audio-convert",
    "audio-cutter",
    "audio-fade",              # extra
    "audio-metadata-strip",    # extra
    "audio-metadata-view",     # extra
    "audio-normalize",         # extra
    "audio-reverse",           # extra
    "audio-silence-remove",    # extra
    "audio-speed",             # extra
    "audio-trim",              # legacy alias kept
    "audio-waveform",          # extra
}

DOCUMENT_TOOLS: set[str] = {
    "docx-to-odt",
    "docx-to-pdf",
    "docx-to-rtf",
    "epub-to-azw3",
    "epub-to-mobi",
    "epub-to-pdf",
    "markdown-to-pdf",
    "ods-to-xlsx",
    "odp-to-pptx",
    "pdf-to-html",
    "pptx-to-pdf",
    "txt-to-docx",
    "txt-to-pdf",
    "xls-to-csv",
    "xlsx-to-csv",
    # Legacy methods that still live in DocumentConverter:
    "html-to-pdf",
    "pdf-ocr",
    "pdf-to-image",
    "pdf-to-text",
}

PDF_TOOLS: set[str] = {
    "pdf-bates",
    "pdf-compress",
    "pdf-crop",
    "pdf-delete",
    "pdf-deskew",
    "pdf-edit-metadata",
    "pdf-extract",
    "pdf-extract-images",
    "pdf-flatten",
    "pdf-grayscale",
    "pdf-header-footer",
    "pdf-merge",
    "pdf-mix",
    "pdf-nup",
    "pdf-page-numbers",
    "pdf-protect",
    "pdf-redact",
    "pdf-remove-annotations",
    "pdf-rename-content",
    "pdf-reorder",
    "pdf-repair",
    "pdf-resize",
    "pdf-rotate",
    "pdf-split",
    "pdf-to-pdfa",
    "pdf-unlock",
    "pdf-watermark",
}

ARCHIVE_TOOLS: set[str] = {
    "7z-tool",
    "bz2-tool",
    "gz-tool",
    "rar-tool",
    "tar-tool",
    "tgz-tool",
    "xz-tool",
    "zip-tool",
}

FILE_TOOLS: set[str] = {
    "batch-extension",
    "bulk-rename",
    "file-hash-generator",
    "flatten-folder",
    "metadata-viewer",
}

FONT_TOOLS: set[str] = {
    "font-to-otf",
    "font-to-ttf",
    "font-to-woff",
    "font-to-woff2",
}

PYTHON_TOOLS: set[str] = {
    "api-mock-schema",
    "avro-to-json",
    "avro-to-json-schema",
    "islamic-inheritance-calculator",
    "islamic-zakat-calculator",
    "parquet-to-json",
    "password-strength-analyzer",
    "semantic-speak-casual",
    "semantic-speak-formal",
    "semantic-speak-pirate",
    "semantic-speak-uwu",
    "semantic-speak-yoda",
    "speech-to-text",
    "speech-to-text-2",
}


# ── Primary dispatch function ────────────────────────────────────

async def execute_tool(
    tool_id: str,
    input_data: str | bytes | dict | None = None,
    *,
    input_file_url: str | None = None,
    input_file_urls: list[str] | None = None,
    options: dict[str, Any] | None = None,
    output_dir: str | None = None,
) -> dict[str, Any]:
    """
    Execute a server-side tool.

    Accepts both direct kwargs and a dict payload from ToolService.

    Args:
        tool_id:         kebab-case tool slug (must match media-tools.ts id)
        input_data:      text / bytes / dict payload
        input_file_url:  R2 signed URL for single-file tools
        input_file_urls: R2 signed URLs for multi-file tools (bulk rename, merge)
        options:         Tool-specific options dict
        output_dir:      Directory for output (temp dir used if None)

    Returns:
        dict with keys: success, output, error?, metadata?
    """
    # When called from ToolService, input_data is a dict with all fields.
    if isinstance(input_data, dict):
        if not input_file_url:
            input_file_url = input_data.get("fileUrl") or input_data.get("input_file_url")
        if not input_file_urls:
            input_file_urls = input_data.get("fileUrls") or input_data.get("input_file_urls")
        if not options:
            options = input_data.get("options", {})
        raw_input: str | bytes | None = (
            input_data.get("input") or input_data.get("data") or input_data.get("text")
        )
    else:
        raw_input = input_data

    opts = options or {}

    try:
        # ── Image ────────────────────────────────────────────────
        if tool_id in IMAGE_TOOLS:
            return await _image_converter.convert(
                tool_id, input_file_url=input_file_url, options=opts, output_dir=output_dir
            )

        # ── Video ────────────────────────────────────────────────
        if tool_id in VIDEO_TOOLS:
            return await _video_converter.convert(
                tool_id, input_file_url=input_file_url, options=opts, output_dir=output_dir
            )

        # ── Audio ────────────────────────────────────────────────
        if tool_id in AUDIO_TOOLS:
            return await _audio_converter.convert(
                tool_id, input_file_url=input_file_url, options=opts, output_dir=output_dir
            )

        # ── PDF (27 canonical ops) ───────────────────────────────
        if tool_id in PDF_TOOLS:
            return await _pdf_handler.convert(
                tool_id,
                input_file_url=input_file_url,
                input_file_urls=input_file_urls,
                options=opts,
                output_dir=output_dir,
            )

        # ── Document (office / ebook conversions) ────────────────
        if tool_id in DOCUMENT_TOOLS:
            return await _document_converter.convert(
                tool_id,
                input_data=raw_input or input_data,
                input_file_url=input_file_url,
                options=opts,
                output_dir=output_dir,
            )

        # ── Archive ──────────────────────────────────────────────
        if tool_id in ARCHIVE_TOOLS:
            return await _archive_handler.convert(
                tool_id, input_file_url=input_file_url, options=opts, output_dir=output_dir
            )

        # ── File Operations ──────────────────────────────────────
        if tool_id in FILE_TOOLS:
            return await _file_handler.convert(
                tool_id,
                input_file_url=input_file_url,
                input_file_urls=input_file_urls,
                options=opts,
                output_dir=output_dir,
            )

        # ── Font ─────────────────────────────────────────────────
        if tool_id in FONT_TOOLS:
            return await _font_handler.convert(
                tool_id, input_file_url=input_file_url, options=opts, output_dir=output_dir
            )

        # ── Python-only (NLP, data-science, AI) ──────────────────
        if tool_id in PYTHON_TOOLS:
            return await _python_tools.execute(
                tool_id, input_data=raw_input or input_data, options=opts
            )

        return {"success": False, "error": f"Unknown server-side tool: {tool_id}"}

    except asyncio.TimeoutError:
        logger.error("Tool %s timed out", tool_id)
        return {"success": False, "error": f"Tool '{tool_id}' timed out"}
    except Exception as e:
        logger.exception("Tool %s failed", tool_id)
        return {"success": False, "error": str(e)}


def get_supported_tools() -> dict[str, list[str]]:
    """Return all server-side tool IDs grouped by category."""
    return {
        "image": sorted(IMAGE_TOOLS),
        "video": sorted(VIDEO_TOOLS),
        "audio": sorted(AUDIO_TOOLS),
        "document": sorted(DOCUMENT_TOOLS),
        "pdf": sorted(PDF_TOOLS),
        "archive": sorted(ARCHIVE_TOOLS),
        "file": sorted(FILE_TOOLS),
        "font": sorted(FONT_TOOLS),
        "python": sorted(PYTHON_TOOLS),
    }
