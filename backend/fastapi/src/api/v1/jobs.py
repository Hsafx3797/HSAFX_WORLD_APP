"""
Async Job API Endpoints
HSAFX WORLD - Handles async tool execution jobs
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Any, List, Optional

import httpx
import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from pydantic import BaseModel, Field

from src.core.redis import cache
from src.tools import execute_tool

router = APIRouter()
logger = structlog.get_logger()


# ==================== SCHEMAS ====================

class JobInput(BaseModel):
    """Job creation input"""
    tool_id: str = Field(..., description="Tool ID to execute")
    data: dict[str, Any] = Field(..., description="Tool input data")
    priority: str = Field(default="normal", description="Job priority: low, normal, high, critical")
    webhook_url: Optional[str] = Field(default=None, description="Webhook URL for completion notification")
    idempotency_key: Optional[str] = Field(default=None, description="Idempotency key for deduplication")


class JobStatus(BaseModel):
    """Job status response"""
    id: str
    tool_id: str
    status: str  # queued, running, completed, failed, cancelled, timeout
    progress: Optional[int] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    estimated_completion: Optional[str] = None
    position_in_queue: Optional[int] = None


class JobResult(BaseModel):
    """Job result response"""
    id: str
    status: str
    output: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    coins_used: int = 0
    completed_at: Optional[str] = None


class JobListResponse(BaseModel):
    """Paginated job list"""
    jobs: List[JobStatus]
    total: int
    page: int
    limit: int


# ==================== JOB STORAGE ====================

async def store_job(job_id: str, job_data: dict) -> None:
    """Store job in Redis"""
    await cache.set(f"job:{job_id}", json.dumps(job_data), ttl=86400)  # 24 hours


async def get_job(job_id: str) -> Optional[dict]:
    """Get job from Redis"""
    data = await cache.get(f"job:{job_id}")
    return json.loads(data) if data else None


async def update_job_status(job_id: str, status: str, **kwargs) -> None:
    """Update job status"""
    job = await get_job(job_id)
    if job:
        job["status"] = status
        job.update(kwargs)
        await store_job(job_id, job)


# ==================== JOB PROCESSOR ====================

JOB_TIMEOUT_SECONDS = 300  # 5 minutes max per job


async def process_job(job_id: str) -> None:
    """Background worker: execute a tool job and store the result."""
    job = await get_job(job_id)
    if not job or job["status"] == "cancelled":
        return

    tool_id = job["tool_id"]
    start_ts = time.monotonic()
    now = datetime.utcnow().isoformat()

    # Mark running
    await update_job_status(job_id, "running", started_at=now, progress=10)
    await cache.zrem("job_queue", job_id)

    try:
        result = await asyncio.wait_for(
            execute_tool(
                tool_id,
                input_data=job.get("data"),
                options=job.get("data", {}).get("options"),
            ),
            timeout=JOB_TIMEOUT_SECONDS,
        )

        elapsed_ms = round((time.monotonic() - start_ts) * 1000, 2)
        completed_at = datetime.utcnow().isoformat()

        if result.get("success"):
            await update_job_status(
                job_id,
                "completed",
                output=result.get("output"),
                metadata=result.get("metadata"),
                execution_time_ms=elapsed_ms,
                completed_at=completed_at,
                progress=100,
            )
        else:
            await update_job_status(
                job_id,
                "failed",
                error=result.get("error", "Unknown execution error"),
                execution_time_ms=elapsed_ms,
                completed_at=completed_at,
                progress=100,
            )

    except asyncio.TimeoutError:
        elapsed_ms = round((time.monotonic() - start_ts) * 1000, 2)
        await update_job_status(
            job_id,
            "timeout",
            error=f"Job timed out after {JOB_TIMEOUT_SECONDS}s",
            execution_time_ms=elapsed_ms,
            completed_at=datetime.utcnow().isoformat(),
            progress=100,
        )
    except Exception as exc:
        elapsed_ms = round((time.monotonic() - start_ts) * 1000, 2)
        logger.exception("Job processing failed", job_id=job_id)
        await update_job_status(
            job_id,
            "failed",
            error=str(exc),
            execution_time_ms=elapsed_ms,
            completed_at=datetime.utcnow().isoformat(),
            progress=100,
        )

    # Send webhook notification if configured
    job = await get_job(job_id)
    webhook_url = job.get("webhook_url") if job else None
    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    webhook_url,
                    json={
                        "job_id": job_id,
                        "status": job["status"],
                        "tool_id": tool_id,
                        "completed_at": job.get("completed_at"),
                    },
                )
        except Exception:
            logger.warning("Webhook notification failed", job_id=job_id, url=webhook_url)


# ==================== ENDPOINTS ====================

@router.post("", response_model=JobStatus, status_code=201)
async def create_job(
    input_data: JobInput,
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Create a new async job for tool execution
    """
    user = getattr(request.state, "user", None)
    user_id = user.id if user else None

    # Check idempotency
    if input_data.idempotency_key:
        existing_job_id = await cache.get(f"idempotency:{input_data.idempotency_key}")
        if existing_job_id:
            existing_job = await get_job(existing_job_id)
            if existing_job:
                return JobStatus(
                    id=existing_job_id,
                    tool_id=existing_job["tool_id"],
                    status=existing_job["status"],
                    progress=existing_job.get("progress"),
                    created_at=existing_job["created_at"],
                    started_at=existing_job.get("started_at"),
                    completed_at=existing_job.get("completed_at"),
                )

    # Create job
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    job_data = {
        "id": job_id,
        "tool_id": input_data.tool_id,
        "user_id": user_id,
        "status": "queued",
        "priority": input_data.priority,
        "data": input_data.data,
        "webhook_url": input_data.webhook_url,
        "created_at": now,
        "started_at": None,
        "completed_at": None,
        "progress": 0,
        "output": None,
        "error": None,
        "coins_reserved": 0,
    }

    await store_job(job_id, job_data)

    # Track job per user for list endpoint
    if user_id:
        await cache.sadd(f"user_jobs:{user_id}", job_id)

    # Store idempotency key mapping
    if input_data.idempotency_key:
        await cache.set(f"idempotency:{input_data.idempotency_key}", job_id, ttl=86400)

    # Add to job queue
    priority_scores = {"critical": 1000, "high": 100, "normal": 10, "low": 1}
    priority_score = priority_scores.get(input_data.priority, 10)
    await cache.zadd("job_queue", {job_id: priority_score})

    # Trigger background worker
    background_tasks.add_task(process_job, job_id)

    logger.info("Job created", job_id=job_id, tool_id=input_data.tool_id, user_id=user_id)

    # Get queue position
    queue_position = await cache.zrank("job_queue", job_id)

    return JobStatus(
        id=job_id,
        tool_id=input_data.tool_id,
        status="queued",
        progress=0,
        created_at=now,
        position_in_queue=queue_position,
    )


@router.get("/{job_id}", response_model=JobStatus)
async def get_job_status(
    job_id: str,
    request: Request,
):
    """
    Get job status by ID
    """
    job = await get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    user = getattr(request.state, "user", None)
    if job.get("user_id") and user and job["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get queue position if still queued
    position = None
    if job["status"] == "queued":
        position = await cache.zrank("job_queue", job_id)

    return JobStatus(
        id=job["id"],
        tool_id=job["tool_id"],
        status=job["status"],
        progress=job.get("progress"),
        created_at=job["created_at"],
        started_at=job.get("started_at"),
        completed_at=job.get("completed_at"),
        position_in_queue=position,
    )


@router.get("/{job_id}/result", response_model=JobResult)
async def get_job_result(
    job_id: str,
    request: Request,
):
    """
    Get job result (output/error)
    """
    job = await get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    user = getattr(request.state, "user", None)
    if job.get("user_id") and user and job["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if job["status"] not in ["completed", "failed", "timeout"]:
        raise HTTPException(
            status_code=400,
            detail=f"Job not finished. Current status: {job['status']}"
        )

    return JobResult(
        id=job["id"],
        status=job["status"],
        output=job.get("output"),
        error=job.get("error"),
        execution_time_ms=job.get("execution_time_ms"),
        coins_used=job.get("coins_used", 0),
        completed_at=job.get("completed_at"),
    )


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    request: Request,
):
    """
    Cancel a queued or running job
    """
    job = await get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    user = getattr(request.state, "user", None)
    if job.get("user_id") and user and job["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Can only cancel queued or running jobs
    if job["status"] not in ["queued", "running"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job with status: {job['status']}"
        )

    # Update status
    await update_job_status(
        job_id,
        "cancelled",
        completed_at=datetime.utcnow().isoformat(),
    )

    # Remove from queue
    await cache.zrem("job_queue", job_id)

    # Record coin refund for Next.js to process
    if job.get("coins_reserved", 0) > 0 and job.get("user_id"):
        refund_data = json.dumps({
            "job_id": job_id,
            "user_id": job["user_id"],
            "amount": job["coins_reserved"],
            "reason": "job_cancelled",
            "timestamp": datetime.utcnow().isoformat(),
        })
        await cache.lpush("coin_refund_queue", refund_data)

    logger.info("Job cancelled", job_id=job_id)

    return {"message": "Job cancelled successfully"}


@router.get("", response_model=JobListResponse)
async def list_jobs(
    request: Request,
    status: Optional[str] = None,
    tool_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    List user's jobs
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Get user's job IDs from sorted set
    job_ids = await cache.smembers(f"user_jobs:{user.id}")

    jobs = []
    for job_id in job_ids:
        job = await get_job(job_id)
        if job:
            # Apply filters
            if status and job["status"] != status:
                continue
            if tool_id and job["tool_id"] != tool_id:
                continue

            jobs.append(JobStatus(
                id=job["id"],
                tool_id=job["tool_id"],
                status=job["status"],
                progress=job.get("progress"),
                created_at=job["created_at"],
                started_at=job.get("started_at"),
                completed_at=job.get("completed_at"),
            ))

    # Sort by created_at descending
    jobs.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    total = len(jobs)
    start = (page - 1) * limit
    end = start + limit
    paginated = jobs[start:end]

    return JobListResponse(
        jobs=paginated,
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/{job_id}/retry")
async def retry_job(
    job_id: str,
    request: Request,
):
    """
    Retry a failed job
    """
    job = await get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check ownership
    user = getattr(request.state, "user", None)
    if job.get("user_id") and user and job["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Can only retry failed or timeout jobs
    if job["status"] not in ["failed", "timeout"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot retry job with status: {job['status']}"
        )

    # Check retry count
    retry_count = job.get("retry_count", 0)
    max_retries = 3

    if retry_count >= max_retries:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum retries ({max_retries}) exceeded"
        )

    # Update job for retry
    await update_job_status(
        job_id,
        "queued",
        retry_count=retry_count + 1,
        error=None,
        completed_at=None,
    )

    # Add back to queue
    priority_scores = {"critical": 1000, "high": 100, "normal": 10, "low": 1}
    priority_score = priority_scores.get(job.get("priority", "normal"), 10)
    await cache.zadd("job_queue", {job_id: priority_score})

    logger.info("Job queued for retry", job_id=job_id, retry_count=retry_count + 1)

    return {"message": "Job queued for retry", "retry_count": retry_count + 1}
