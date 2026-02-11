"""
Internal API — Next.js ↔ FastAPI communication
Reference: SOLUTION_ROADMAP Task 3.5

Endpoint: POST /internal/execute
Auth:     X-Internal-Secret header (shared secret, not API key)

This receives async jobs dispatched from Next.js for tools that require
native binaries (FFmpeg, libvips, Poppler, Tesseract) or Python dependencies.
"""

from typing import Any, Optional

import httpx
import structlog
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel

logger = structlog.get_logger()

router = APIRouter()

# ─── Config ─────────────────────────────────────────────────────

import os

INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "")
NEXTJS_CALLBACK_URL = os.getenv(
    "NEXTJS_CALLBACK_URL", "http://localhost:3000/api/internal/job-complete"
)

# ─── Schemas ────────────────────────────────────────────────────


class ExecuteRequest(BaseModel):
    """Request body for /internal/execute"""
    jobId: str
    toolId: str
    toolSlug: str
    input: Any
    options: Optional[dict] = None


class ExecuteResponse(BaseModel):
    """Immediate acknowledgement"""
    jobId: str
    accepted: bool
    message: str = "Job accepted for processing"


class JobCompleteCallback(BaseModel):
    """Payload sent back to Next.js when a job finishes"""
    jobId: str
    status: str  # 'completed' | 'failed'
    output: Optional[Any] = None
    resultUrl: Optional[str] = None
    downloadUrl: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[dict] = None


# ─── Auth guard ─────────────────────────────────────────────────


def verify_internal_secret(x_internal_secret: str = Header(...)):
    """Validate the shared internal secret."""
    if not INTERNAL_SECRET:
        raise HTTPException(
            status_code=500,
            detail="INTERNAL_API_SECRET not configured on FastAPI side",
        )
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Invalid internal secret")
    return True


# ─── Routes ─────────────────────────────────────────────────────


@router.post("/execute", response_model=ExecuteResponse)
async def execute_tool(
    request: ExecuteRequest,
    background_tasks: BackgroundTasks,
    _auth: bool = Header(None, alias="x-internal-secret"),
):
    """
    Accept a tool execution job from Next.js.

    The request is validated, acknowledged immediately (202), and the
    actual processing happens in a background task. When done, FastAPI
    calls back to Next.js POST /api/internal/job-complete.
    """
    # Verify secret manually (Header dependency doesn't auto-validate here)
    x_secret = _auth
    if not INTERNAL_SECRET or x_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Invalid internal secret")

    logger.info(
        "internal.execute.received",
        job_id=request.jobId,
        tool_slug=request.toolSlug,
    )

    # Dispatch to background
    background_tasks.add_task(
        _process_and_callback,
        request.jobId,
        request.toolId,
        request.toolSlug,
        request.input,
        request.options,
    )

    return ExecuteResponse(jobId=request.jobId, accepted=True)


# ─── Background processing ─────────────────────────────────────


async def _process_and_callback(
    job_id: str,
    tool_id: str,
    tool_slug: str,
    tool_input: Any,
    options: Optional[dict],
):
    """Run the native tool and POST the result back to Next.js."""
    try:
        result = await _execute_native_tool(tool_slug, tool_input, options)

        callback = JobCompleteCallback(
            jobId=job_id,
            status="completed",
            output=result.get("output"),
            resultUrl=result.get("resultUrl"),
            downloadUrl=result.get("downloadUrl"),
            metadata=result.get("metadata"),
        )
    except Exception as exc:
        logger.error(
            "internal.execute.failed",
            job_id=job_id,
            tool_slug=tool_slug,
            error=str(exc),
        )
        callback = JobCompleteCallback(
            jobId=job_id,
            status="failed",
            error=str(exc),
        )

    # Send callback to Next.js
    await _send_callback(callback)


async def _execute_native_tool(
    tool_slug: str,
    tool_input: Any,
    options: Optional[dict],
) -> dict:
    """
    Route to the appropriate native processor.
    This is the integration point for:
      - Image processing (libvips)
      - Video/audio processing (FFmpeg)
      - Document processing (Poppler, Tesseract)
      - Python scraping tools
    """
    # Check scraper tools first
    if tool_slug in ("container-tracker", "container_tracker"):
        from src.scrapers.core.registry import execute_scraper
        result = await execute_scraper(tool_slug, tool_input, options or {})
        return {"output": result}

    # Check if tool is registered in the native tools module
    try:
        from src.tools.registry import get_tool_handler
        handler = get_tool_handler(tool_slug)
        if handler:
            result = await handler(tool_input, options or {})
            return result
    except ImportError:
        pass

    raise ValueError(
        f"No native handler registered for tool '{tool_slug}'. "
        f"Ensure it's registered in src/tools/registry.py."
    )


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
                    "internal.callback.failed",
                    job_id=callback.jobId,
                    status=response.status_code,
                    body=response.text[:500],
                )
            else:
                logger.info(
                    "internal.callback.sent",
                    job_id=callback.jobId,
                    status=callback.status,
                )
    except Exception as exc:
        logger.error(
            "internal.callback.error",
            job_id=callback.jobId,
            error=str(exc),
        )
