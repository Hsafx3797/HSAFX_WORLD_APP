"""
Tools API Endpoints — Compute-Only

Per the Backend Ownership Matrix (22_BACKEND_OWNERSHIP_MATRIX.md):
  FastAPI owns ONLY tool execution. No DB reads/writes.
  Catalog, billing, usage logging all belong to Next.js.

Kept endpoints:
  GET  /tools/server-capabilities  — stateless tool registry
  POST /tools/{slug}/execute       — pure tool execution (no coin logic)
  POST /tools/{slug}/validate      — stateless input validation

Removed endpoints (now served by Next.js):
  GET  /tools                      — catalog listing (Next.js SSR/ISR)
  GET  /tools/{slug}               — tool metadata (Next.js SSR)
  GET  /tools/{slug}/schema        — tool schema (Next.js tRPC)
  GET  /tools/{slug}/usage         — usage stats (Next.js tRPC)
"""

import asyncio
from typing import Any, Optional

import structlog
from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.core.config import settings

router = APIRouter()
logger = structlog.get_logger()


# ==================== SCHEMAS ====================

class ToolInput(BaseModel):
    """Generic tool input"""
    data: dict[str, Any] = Field(..., description="Tool input data")


class ToolExecutionResponse(BaseModel):
    """Tool execution response"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: float


# ==================== ENDPOINTS ====================

@router.get("/server-capabilities")
async def get_server_capabilities():
    """
    Return tool IDs that are executable server-side.
    Frontend uses this to decide: run locally (WASM/JS) vs. call API.
    """
    from src.tools.executor import get_supported_tools
    return get_supported_tools()


@router.post("/{tool_slug}/execute", response_model=ToolExecutionResponse)
async def execute_tool(
    tool_slug: str,
    input_data: ToolInput,
):
    """
    Execute a tool with the given input.

    This endpoint is pure compute — no coin deduction, no usage logging,
    no DB access. Next.js handles billing pre-checks and usage logging
    via the tRPC layer before dispatching here.

    For heavy native tools (FFmpeg, libvips, etc.), Next.js uses
    POST /internal/execute with background callback instead.
    """
    import time
    start_time = time.time()

    try:
        from src.tools.executor import execute_tool as run_tool

        result = await run_tool(
            tool_slug=tool_slug,
            input_data=input_data.data,
        )

        execution_time = (time.time() - start_time) * 1000

        return ToolExecutionResponse(
            success=result.get("success", False),
            data=result.get("data"),
            error=result.get("error"),
            execution_time_ms=execution_time,
        )

    except asyncio.TimeoutError:
        execution_time = (time.time() - start_time) * 1000
        return ToolExecutionResponse(
            success=False,
            error="Tool execution timed out",
            execution_time_ms=execution_time,
        )

    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        logger.error("Tool execution error", tool=tool_slug, error=str(e))
        return ToolExecutionResponse(
            success=False,
            error=str(e) if settings.DEBUG else "Tool execution failed",
            execution_time_ms=execution_time,
        )


@router.post("/{tool_slug}/validate")
async def validate_tool_input(
    tool_slug: str,
    input_data: ToolInput,
):
    """
    Validate tool input without executing.
    Stateless — uses schema definitions, no DB access.
    """
    try:
        from src.tools.executor import validate_tool_input as do_validate

        result = do_validate(
            tool_slug=tool_slug,
            input_data=input_data.data,
        )
        return {
            "valid": result.get("valid", False),
            "errors": result.get("errors", []),
        }
    except ImportError:
        # Fallback: accept all input if validator not available
        return {"valid": True, "errors": []}
    except Exception as e:
        return {"valid": False, "errors": [str(e)]}
