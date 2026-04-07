"""
Engine API — Unified engine execution route for B2B API.

Replaces the old tool-slug-based dispatch with engine-name-based dispatch.
8 media engines map 1:1 to 8 handler classes.

Endpoints:
  POST /execute/{engine_name}  — Execute an engine operation
  GET  /engines                — List all 8 media engines + their operations

Auth: X-Internal-Secret header (same as /internal/*)
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import os
from typing import Any, Optional

import httpx
import structlog
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel, Field

from src.tools.archive_handler import ArchiveHandler
from src.tools.audio_converter import AudioConverter
from src.tools.document_converter import DocumentConverter
from src.tools.file_handler import FileHandler
from src.tools.font_handler import FontHandler
from src.tools.image_converter import ImageConverter
from src.tools.pdf_handler import PdfHandler
from src.tools.video_converter import VideoConverter

logger = structlog.get_logger()

router = APIRouter()


def _sanitize_error(error: str | Exception) -> str:
    """Return a generic message for client-facing errors.

    Detailed error information (file paths, library versions, stderr
    output) is logged server-side but never sent to callers.
    """
    msg = str(error)
    # Keep short, known-safe messages as-is (e.g. validation errors)
    safe_prefixes = (
        "Unsupported",
        "Missing",
        "Invalid",
        "No input",
        "angle must be",
        "Engine '",
    )
    if msg.startswith(safe_prefixes) and len(msg) < 200:
        return msg
    return "Processing failed. Please check your input and try again."

# ─── Config ─────────────────────────────────────────────────────

INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "")
NEXTJS_CALLBACK_URL = os.getenv(
    "NEXTJS_CALLBACK_URL", "http://localhost:3000/api/internal/job-complete"
)

# ─── Handler singletons ────────────────────────────────────────

_image_converter = ImageConverter()
_video_converter = VideoConverter()
_audio_converter = AudioConverter()
_document_converter = DocumentConverter()
_pdf_handler = PdfHandler()
_archive_handler = ArchiveHandler()
_file_handler = FileHandler()
_font_handler = FontHandler()

# ─── Engine → handler map ──────────────────────────────────────

ENGINE_MAP: dict[str, Any] = {
    "image": _image_converter,
    "video": _video_converter,
    "audio": _audio_converter,
    "pdf": _pdf_handler,
    "document": _document_converter,
    "archive": _archive_handler,
    "file": _file_handler,
    "font": _font_handler,
}

# ─── Engine → supported operations ─────────────────────────────
# Each engine lists its valid operation values.

ENGINE_OPERATIONS: dict[str, list[str]] = {
    "image": [
        "resize", "crop", "rotate", "flip", "compress", "convert",
        "thumbnail", "watermark", "canvas-resize", "color-mode",
        "metadata-strip", "metadata-view", "to-ascii", "batch-filters",
        "svg-convert", "psd-convert", "heic-convert", "camera-raw-convert",
        "ai-eps-convert",
    ],
    "video": [
        "convert", "compress", "trim", "to-gif", "extract-audio",
        "resize", "rotate", "speed", "thumbnail", "extract-frames",
        "metadata-strip", "metadata-view", "transcode",
    ],
    "audio": [
        "convert", "compress", "trim", "cutter", "normalize",
        "reverse", "speed", "fade", "waveform", "silence-remove",
        "metadata-strip", "metadata-view",
    ],
    "pdf": [
        "merge", "split", "compress", "rotate", "delete", "reorder",
        "extract", "extract-images", "watermark", "protect", "unlock",
        "crop", "resize", "flatten", "grayscale", "repair",
        "page-numbers", "header-footer", "bates", "nup", "mix",
        "to-pdfa", "edit-metadata", "redact", "deskew",
        "remove-annotations", "rename-content",
    ],
    "document": [
        "docx-to-pdf", "docx-to-odt", "docx-to-rtf",
        "pptx-to-pdf", "xlsx-to-csv", "xls-to-csv", "ods-to-xlsx",
        "odp-to-pptx", "txt-to-pdf", "txt-to-docx",
        "markdown-to-pdf", "html-to-pdf",
        "epub-to-pdf", "epub-to-mobi", "epub-to-azw3",
        "pdf-to-text", "pdf-to-html", "pdf-to-image", "pdf-ocr",
    ],
    "archive": [
        "zip", "tar", "gz", "bz2", "xz", "7z", "tgz", "rar",
    ],
    "file": [
        "bulk-rename", "batch-extension", "file-hash-generator",
        "flatten-folder", "metadata-viewer",
    ],
    "font": [
        "to-ttf", "to-otf", "to-woff", "to-woff2",
    ],
}

# Operation → legacy tool slug mapping per engine.
# The handler classes use tool slugs internally (e.g., "image-resize").
# This maps the new clean operation names to old tool slugs.

_OPERATION_TO_SLUG: dict[str, dict[str, str]] = {
    "image": {
        "resize": "image-resize",
        "crop": "image-crop",
        "rotate": "image-rotate",
        "flip": "image-flip",
        "compress": "image-compress",
        "convert": "raster-to-raster",
        "thumbnail": "image-thumbnail",
        "watermark": "image-watermark",
        "canvas-resize": "image-canvas-resize",
        "color-mode": "image-color-mode",
        "metadata-strip": "image-metadata-strip",
        "metadata-view": "image-metadata-view",
        "to-ascii": "image-to-ascii",
        "batch-filters": "image-batch-filters",
        "svg-convert": "svg-convert",
        "psd-convert": "psd-convert",
        "heic-convert": "heic-convert",
        "camera-raw-convert": "camera-raw-convert",
        "ai-eps-convert": "ai-eps-convert",
    },
    "video": {
        "convert": "video-convert",
        "compress": "video-compress",
        "trim": "video-trim",
        "to-gif": "video-to-gif",
        "extract-audio": "extract-audio",
        "resize": "video-resize",
        "rotate": "video-rotate",
        "speed": "video-speed",
        "thumbnail": "video-thumbnail",
        "extract-frames": "video-extract-frames",
        "metadata-strip": "video-metadata-strip",
        "metadata-view": "video-metadata-view",
        "transcode": "video-transcode",
    },
    "audio": {
        "convert": "audio-convert",
        "compress": "audio-compress",
        "trim": "audio-trim",
        "cutter": "audio-cutter",
        "normalize": "audio-normalize",
        "reverse": "audio-reverse",
        "speed": "audio-speed",
        "fade": "audio-fade",
        "waveform": "audio-waveform",
        "silence-remove": "audio-silence-remove",
        "metadata-strip": "audio-metadata-strip",
        "metadata-view": "audio-metadata-view",
    },
    "pdf": {
        "merge": "pdf-merge",
        "split": "pdf-split",
        "compress": "pdf-compress",
        "rotate": "pdf-rotate",
        "delete": "pdf-delete",
        "reorder": "pdf-reorder",
        "extract": "pdf-extract",
        "extract-images": "pdf-extract-images",
        "watermark": "pdf-watermark",
        "protect": "pdf-protect",
        "unlock": "pdf-unlock",
        "crop": "pdf-crop",
        "resize": "pdf-resize",
        "flatten": "pdf-flatten",
        "grayscale": "pdf-grayscale",
        "repair": "pdf-repair",
        "page-numbers": "pdf-page-numbers",
        "header-footer": "pdf-header-footer",
        "bates": "pdf-bates",
        "nup": "pdf-nup",
        "mix": "pdf-mix",
        "to-pdfa": "pdf-to-pdfa",
        "edit-metadata": "pdf-edit-metadata",
        "redact": "pdf-redact",
        "deskew": "pdf-deskew",
        "remove-annotations": "pdf-remove-annotations",
        "rename-content": "pdf-rename-content",
    },
    "document": {
        "docx-to-pdf": "docx-to-pdf",
        "docx-to-odt": "docx-to-odt",
        "docx-to-rtf": "docx-to-rtf",
        "pptx-to-pdf": "pptx-to-pdf",
        "xlsx-to-csv": "xlsx-to-csv",
        "xls-to-csv": "xls-to-csv",
        "ods-to-xlsx": "ods-to-xlsx",
        "odp-to-pptx": "odp-to-pptx",
        "txt-to-pdf": "txt-to-pdf",
        "txt-to-docx": "txt-to-docx",
        "markdown-to-pdf": "markdown-to-pdf",
        "html-to-pdf": "html-to-pdf",
        "epub-to-pdf": "epub-to-pdf",
        "epub-to-mobi": "epub-to-mobi",
        "epub-to-azw3": "epub-to-azw3",
        "pdf-to-text": "pdf-to-text",
        "pdf-to-html": "pdf-to-html",
        "pdf-to-image": "pdf-to-image",
        "pdf-ocr": "pdf-ocr",
    },
    "archive": {
        "zip": "zip-tool",
        "tar": "tar-tool",
        "gz": "gz-tool",
        "bz2": "bz2-tool",
        "xz": "xz-tool",
        "7z": "7z-tool",
        "tgz": "tgz-tool",
        "rar": "rar-tool",
    },
    "file": {
        "bulk-rename": "bulk-rename",
        "batch-extension": "batch-extension",
        "file-hash-generator": "file-hash-generator",
        "flatten-folder": "flatten-folder",
        "metadata-viewer": "metadata-viewer",
    },
    "font": {
        "to-ttf": "font-to-ttf",
        "to-otf": "font-to-otf",
        "to-woff": "font-to-woff",
        "to-woff2": "font-to-woff2",
    },
}

# ─── Schemas ────────────────────────────────────────────────────


class EngineExecuteRequest(BaseModel):
    """Request body for POST /execute/{engine_name}"""
    jobId: str
    input: Any = None
    options: dict[str, Any] = Field(default_factory=dict)


class EngineExecuteResponse(BaseModel):
    """Immediate acknowledgement (202)"""
    jobId: str
    accepted: bool
    engine: str
    operation: str | None = None
    message: str = "Job accepted for processing"


class JobCompleteCallback(BaseModel):
    """Payload sent back to Next.js when a job finishes"""
    jobId: str
    status: str  # 'completed' | 'failed'
    output: Any | None = None
    resultUrl: str | None = None
    downloadUrl: str | None = None
    error: str | None = None
    metadata: dict | None = None


class EngineInfo(BaseModel):
    """Engine descriptor for GET /engines"""
    name: str
    operations: list[str]
    operationCount: int


# ─── Validation ─────────────────────────────────────────────────

# Max input sizes per engine (bytes)
_MAX_INPUT_SIZE: dict[str, int] = {
    "image":    50 * 1024 * 1024,   # 50 MB
    "video":    100 * 1024 * 1024,  # 100 MB
    "audio":    100 * 1024 * 1024,  # 100 MB
    "pdf":      50 * 1024 * 1024,   # 50 MB
    "document": 50 * 1024 * 1024,   # 50 MB
    "archive":  100 * 1024 * 1024,  # 100 MB
    "file":     50 * 1024 * 1024,   # 50 MB
    "font":     20 * 1024 * 1024,   # 20 MB
}


def _validate_engine_request(engine_name: str, options: dict[str, Any]) -> str | None:
    """
    Validate engine name and operation.
    Returns the resolved tool slug, or raises HTTPException on error.
    """
    if engine_name not in ENGINE_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown engine: {engine_name}. Valid engines: {', '.join(ENGINE_MAP.keys())}",
        )

    operation = options.get("operation")
    if not operation:
        raise HTTPException(
            status_code=400,
            detail=f"Missing 'operation' in options. Valid operations for {engine_name}: {', '.join(ENGINE_OPERATIONS[engine_name])}",
        )

    valid_ops = ENGINE_OPERATIONS.get(engine_name, [])
    if operation not in valid_ops:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid operation '{operation}' for engine '{engine_name}'. Valid: {', '.join(valid_ops)}",
        )

    # Resolve to legacy tool slug
    slug_map = _OPERATION_TO_SLUG.get(engine_name, {})
    tool_slug = slug_map.get(operation, operation)
    return tool_slug


# ─── Routes ─────────────────────────────────────────────────────


@router.post("/execute/{engine_name}", response_model=EngineExecuteResponse, status_code=202)
async def execute_engine(
    engine_name: str,
    request: EngineExecuteRequest,
    background_tasks: BackgroundTasks,
    x_internal_secret: str = Header(...),
):
    """
    Execute a media engine operation.

    The request is validated, acknowledged immediately (202), and the
    actual processing happens in a background task. When done, FastAPI
    calls back to Next.js POST /api/internal/job-complete.
    """
    # Auth
    if not INTERNAL_SECRET or not hmac.compare_digest(x_internal_secret, INTERNAL_SECRET):
        raise HTTPException(status_code=401, detail="Invalid internal secret")

    # Validate engine + operation
    tool_slug = _validate_engine_request(engine_name, request.options)
    operation = request.options.get("operation")

    logger.info(
        "engine.execute.received",
        job_id=request.jobId,
        engine=engine_name,
        operation=operation,
    )

    # Dispatch to background
    background_tasks.add_task(
        _process_engine_and_callback,
        request.jobId,
        engine_name,
        tool_slug,
        request.input,
        request.options,
    )

    return EngineExecuteResponse(
        jobId=request.jobId,
        accepted=True,
        engine=engine_name,
        operation=operation,
    )


@router.get("/engines", response_model=list[EngineInfo])
async def list_engines(
    x_internal_secret: str = Header(...),
):
    """List all 8 media engines and their supported operations."""
    if not INTERNAL_SECRET or not hmac.compare_digest(x_internal_secret, INTERNAL_SECRET):
        raise HTTPException(status_code=401, detail="Invalid internal secret")

    return [
        EngineInfo(
            name=name,
            operations=ENGINE_OPERATIONS[name],
            operationCount=len(ENGINE_OPERATIONS[name]),
        )
        for name in ENGINE_MAP
    ]


# ─── Background processing ─────────────────────────────────────


async def _process_engine_and_callback(
    job_id: str,
    engine_name: str,
    tool_slug: str,
    input_data: Any,
    options: dict[str, Any],
):
    """Run the engine operation and POST the result back to Next.js."""
    try:
        result = await _execute_engine(engine_name, tool_slug, input_data, options)

        callback = JobCompleteCallback(
            jobId=job_id,
            status="completed",
            output=result.get("output"),
            resultUrl=result.get("resultUrl"),
            downloadUrl=result.get("downloadUrl"),
            metadata=result.get("metadata"),
        )
    except Exception as exc:
        result = None
        logger.error(
            "engine.execute.failed",
            job_id=job_id,
            engine=engine_name,
            tool_slug=tool_slug,
            error=str(exc),
        )
        callback = JobCompleteCallback(
            jobId=job_id,
            status="failed",
            error=_sanitize_error(exc),
        )

    await _send_callback(callback)

    # Clean up temp directory created by handler (tagged as _tmp_dir)
    if result and result.get("_tmp_dir"):
        import shutil
        shutil.rmtree(result["_tmp_dir"], ignore_errors=True)


async def _execute_engine(
    engine_name: str,
    tool_slug: str,
    input_data: Any,
    options: dict[str, Any],
) -> dict[str, Any]:
    """
    Dispatch to the correct handler class via ENGINE_MAP.

    Each handler's .convert() method takes the legacy tool_slug
    and handles its own internal dispatch via _handle_{method}.
    """
    handler = ENGINE_MAP[engine_name]

    # Normalize input: extract file URLs from the input or options
    file_url: str | None = None
    file_urls: list[str] | None = None
    raw_input: Any = None

    if isinstance(input_data, dict):
        file_url = input_data.get("fileUrl") or input_data.get("file_url") or input_data.get("input_file_url")
        file_urls = input_data.get("fileUrls") or input_data.get("file_urls") or input_data.get("input_file_urls")
        raw_input = input_data.get("input") or input_data.get("data") or input_data.get("text")
    elif isinstance(input_data, str):
        # Could be a URL or text input
        if input_data.startswith(("http://", "https://")):
            file_url = input_data
        else:
            raw_input = input_data

    # Also check options for file URLs (some callers put them there)
    if not file_url:
        file_url = options.get("fileUrl") or options.get("file_url")
    if not file_urls:
        file_urls = options.get("fileUrls") or options.get("file_urls")

    # Remove operation from options before passing to handler (it's already resolved to tool_slug)
    handler_options = {k: v for k, v in options.items() if k not in ("operation", "fileUrl", "file_url", "fileUrls", "file_urls")}

    try:
        # Route to handler based on engine type
        if engine_name in ("image", "video", "audio", "font"):
            # Single-file handlers
            return await handler.convert(
                tool_slug,
                input_file_url=file_url,
                options=handler_options,
                output_dir=None,
            )

        elif engine_name == "pdf":
            # PDF handler accepts both single and multi-file
            return await handler.convert(
                tool_slug,
                input_file_url=file_url,
                input_file_urls=file_urls,
                options=handler_options,
                output_dir=None,
            )

        elif engine_name == "document":
            # Document handler also takes raw text input
            return await handler.convert(
                tool_slug,
                input_data=raw_input or input_data,
                input_file_url=file_url,
                options=handler_options,
                output_dir=None,
            )

        elif engine_name in ("archive", "file"):
            # Archive and file handlers accept multi-file
            return await handler.convert(
                tool_slug,
                input_file_url=file_url,
                input_file_urls=file_urls,
                options=handler_options,
                output_dir=None,
            )

        else:
            return {"success": False, "error": f"No dispatch logic for engine: {engine_name}"}

    except asyncio.TimeoutError:
        logger.error("Engine %s operation %s timed out", engine_name, tool_slug)
        return {"success": False, "error": f"Engine '{engine_name}' operation timed out"}
    except Exception as e:
        logger.exception("Engine %s operation %s failed", engine_name, tool_slug)
        return {"success": False, "error": _sanitize_error(e)}


async def _send_callback(callback: JobCompleteCallback):
    """HTTP POST the result back to Next.js."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                NEXTJS_CALLBACK_URL,
                json=callback.model_dump(),
                headers={
                    "X-Internal-Secret": INTERNAL_SECRET,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code >= 400:
                logger.error(
                    "engine.callback.failed",
                    job_id=callback.jobId,
                    status=response.status_code,
                    body=response.text[:500],
                )
    except Exception as exc:
        logger.error(
            "engine.callback.error",
            job_id=callback.jobId,
            error=str(exc),
        )
