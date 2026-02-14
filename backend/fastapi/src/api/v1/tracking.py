"""
Container and Vessel Tracking API Endpoints
Tool 446 - Seaport Terminal Container Activity Tracker

Endpoints:
- POST /track/container/{container_no} - Track single container
- POST /track/vessel/{vessel_name} - Get vessel schedule
- POST /track/bulk - Track multiple containers (auto-search)
- POST /track/allinone - Track containers with terminal assignment
- POST /track/cache/clear - Clear tracking cache (admin)
- GET /track/stats - Get tracking statistics
"""

import time
from typing import List, Optional

import structlog
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.scrapers.core.connection_pool import get_pool_stats
from src.scrapers.core.models import (
    AllInOneTrackingRequest,
    AllInOneTrackingResponse,
    BulkTrackingRequest,
    BulkTrackingResponse,
    ContainerTrackResponse,
    ContainerTrackResult,
    VesselScheduleResponse,
)
from src.scrapers.services.bulk_service import (
    track_containers_allinone,
    track_containers_bulk,
)
from src.scrapers.services.cache_service import (
    clear_all_cache,
    clear_container_cache,
    clear_vessel_cache,
    get_cache_stats,
    get_container,
    get_vessel,
    put_container,
    put_vessel,
)
from src.scrapers.terminals import (
    DEFAULT_TERMINALS,
    TERMINAL_SCRAPERS,
    VESSEL_SCRAPERS,
    get_supported_terminals,
    is_terminal_supported,
)

router = APIRouter()
logger = structlog.get_logger()


# ==================== SCHEMAS ====================

class CacheAction(BaseModel):
    """Cache clear request"""
    action: str = Field(default="clear_all", description="Action: clear_all, clear_containers, clear_vessels")
    terminal: Optional[str] = Field(default=None, description="Specific terminal to clear")
    container_no: Optional[str] = Field(default=None, description="Specific container to clear")
    vessel_name: Optional[str] = Field(default=None, description="Specific vessel to clear")


class CacheResponse(BaseModel):
    """Cache operation response"""
    success: bool
    message: str
    cleared_vessels: int = 0
    cleared_containers: int = 0


class TrackingStats(BaseModel):
    """Tracking system statistics"""
    supported_terminals: List[str]
    vessel_scraper_terminals: List[str]
    cache_stats: dict
    connection_pool_stats: dict


# ==================== ENDPOINTS ====================

@router.post("/container/{container_no}", response_model=ContainerTrackResponse)
async def track_container(
    container_no: str,
    terminal: Optional[str] = Query(default=None, description="Specific terminal to search"),
    nocache: bool = Query(default=False, description="Bypass cache"),
    include_vessel: bool = Query(default=True, description="Include vessel schedule enrichment"),
):
    """
    Track a single container across terminals.

    - If terminal is specified, only search that terminal
    - Otherwise, search all terminals until container is found
    - Results are cached for 5 minutes by default
    """
    container_no = container_no.strip().upper()
    start_time = time.time()
    terminals_searched: List[str] = []

    # Validate terminal if specified
    if terminal:
        terminal = terminal.strip().upper()
        if not is_terminal_supported(terminal):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid terminal: {terminal}. Valid terminals: {', '.join(get_supported_terminals())}"
            )

    # Check cache first
    if not nocache and terminal:
        cached = await get_container(terminal, container_no)
        if cached is not None:
            search_time = time.time() - start_time
            return ContainerTrackResponse(
                success=True,
                results=cached,
                terminals_searched=[terminal],
                search_time=search_time,
                cached=True,
            )

    results: List[ContainerTrackResult] = []

    # Search specific terminal or all terminals
    terminals_to_search = [terminal] if terminal else DEFAULT_TERMINALS

    for term in terminals_to_search:
        if not nocache:
            cached = await get_container(term, container_no)
            if cached is not None:
                results.extend(cached)
                terminals_searched.append(term)
                break

        try:
            scraper_func = TERMINAL_SCRAPERS.get(term)
            if not scraper_func:
                continue

            terminal_results = await scraper_func(container_no)
            terminals_searched.append(term)

            if terminal_results and any(r.container_no for r in terminal_results):
                results.extend(terminal_results)
                # Cache the results
                if not nocache:
                    await put_container(term, container_no, terminal_results)
                break
        except Exception as e:
            logger.warning("Terminal scraper failed", terminal=term, container=container_no, error=str(e))
            terminals_searched.append(term)
            continue

    search_time = time.time() - start_time

    return ContainerTrackResponse(
        success=len(results) > 0,
        results=results,
        terminals_searched=terminals_searched,
        search_time=search_time,
        cached=False,
    )


@router.post("/vessel/{vessel_name}", response_model=VesselScheduleResponse)
async def track_vessel(
    vessel_name: str,
    terminal: str = Query(default="QICT", description="Terminal to search (QICT, KGTL)"),
    nocache: bool = Query(default=False, description="Bypass cache"),
):
    """
    Get vessel schedule from a terminal.

    Note: Only QICT and KGTL support direct vessel schedule fetching.
    """
    vessel_name = vessel_name.strip().upper()
    terminal = terminal.strip().upper()
    start_time = time.time()

    if terminal not in VESSEL_SCRAPERS:
        raise HTTPException(
            status_code=400,
            detail=f"Terminal {terminal} doesn't support vessel schedules. Available: {', '.join(VESSEL_SCRAPERS.keys())}"
        )

    # Check cache
    cache_key = f"{terminal}:{vessel_name}".lower()
    if not nocache:
        cached = await get_vessel(cache_key)
        if cached is not None:
            search_time = time.time() - start_time
            return VesselScheduleResponse(
                success=True,
                results=cached,
                terminal=terminal,
                search_time=search_time,
                cached=True,
            )

    try:
        scraper_func = VESSEL_SCRAPERS[terminal]
        results = await scraper_func(vessel_name)

        # Cache results
        if not nocache and results:
            await put_vessel(cache_key, results)

        search_time = time.time() - start_time

        return VesselScheduleResponse(
            success=len(results) > 0,
            results=results,
            terminal=terminal,
            search_time=search_time,
            cached=False,
        )
    except Exception as e:
        logger.error("Vessel schedule fetch failed", terminal=terminal, vessel=vessel_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to fetch vessel schedule: {str(e)}")


@router.post("/bulk", response_model=BulkTrackingResponse)
async def track_bulk(request: BulkTrackingRequest):
    """
    Track multiple containers concurrently.

    - Searches all enabled terminals for each container
    - Stops searching once a container is found
    - Maximum 20 containers per request
    """
    if len(request.containers) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 containers per bulk request"
        )

    logger.info("Bulk tracking started", count=len(request.containers))

    try:
        response = await track_containers_bulk(request)
        logger.info(
            "Bulk tracking completed",
            total=response.total_containers,
            successful=response.successful_containers,
            time=response.total_time
        )
        return response
    except Exception as e:
        logger.error("Bulk tracking failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Bulk tracking failed: {str(e)}")


@router.post("/allinone", response_model=AllInOneTrackingResponse)
async def track_allinone(request: AllInOneTrackingRequest):
    """
    Track containers with pre-assigned terminals.

    More efficient when you know which terminal each container is at.

    - Maximum 200 containers per request
    - Duplicates are automatically removed
    - Containers are grouped by terminal for efficient batch processing
    """
    if len(request.containers) > 200:
        raise HTTPException(
            status_code=400,
            detail="Maximum 200 containers per all-in-one request"
        )

    logger.info("All-in-one tracking started", count=len(request.containers))

    try:
        response = await track_containers_allinone(request)
        logger.info(
            "All-in-one tracking completed",
            total=response.total_containers,
            successful=response.successful_containers,
            duplicates=response.duplicates_removed,
            time=response.total_time
        )
        return response
    except Exception as e:
        logger.error("All-in-one tracking failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"All-in-one tracking failed: {str(e)}")


@router.post("/cache/clear", response_model=CacheResponse)
async def clear_cache(action: CacheAction):
    """
    Clear tracking cache (admin endpoint).

    Actions:
    - clear_all: Clear all caches
    - clear_containers: Clear container cache only
    - clear_vessels: Clear vessel cache only
    """
    try:
        if action.action == "clear_all":
            vessel_count, container_count = await clear_all_cache()
            return CacheResponse(
                success=True,
                message="All caches cleared",
                cleared_vessels=vessel_count,
                cleared_containers=container_count
            )
        elif action.action == "clear_containers":
            count = await clear_container_cache(
                container_no=action.container_no,
                terminal=action.terminal
            )
            return CacheResponse(
                success=True,
                message="Container cache cleared",
                cleared_containers=count
            )
        elif action.action == "clear_vessels":
            count = await clear_vessel_cache(
                vessel_name=action.vessel_name,
                terminal=action.terminal
            )
            return CacheResponse(
                success=True,
                message="Vessel cache cleared",
                cleared_vessels=count
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown action: {action.action}. Valid: clear_all, clear_containers, clear_vessels"
            )
    except Exception as e:
        logger.error("Cache clear failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.get("/stats", response_model=TrackingStats)
async def get_stats():
    """
    Get tracking system statistics.
    """
    return TrackingStats(
        supported_terminals=get_supported_terminals(),
        vessel_scraper_terminals=list(VESSEL_SCRAPERS.keys()),
        cache_stats=await get_cache_stats(),
        connection_pool_stats=get_pool_stats()
    )


@router.get("/terminals")
async def list_terminals():
    """
    List all supported terminals.
    """
    return {
        "terminals": get_supported_terminals(),
        "default_terminals": DEFAULT_TERMINALS,
        "vessel_schedule_terminals": list(VESSEL_SCRAPERS.keys()),
    }
