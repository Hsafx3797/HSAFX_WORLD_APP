"""
Terminal Service - Generic terminal operations and vessel enrichment
"""
import os
import asyncio
from typing import List, Optional
from datetime import datetime

from src.core.models import ContainerTrackResult, VesselSchedule
from src.core.utils import parse_dt, status_from_ata_atd
from src.services.http_client import fetch_json_list
from src.services import cache_service
from src.terminals.pakistan import (
    kgtl_track_container_html,
    kgtl_fetch_vessel_html,
    kict_track_container_html,
    sapt_track_container_html,
    qict_track_container,
    qict_fetch_vessel_schedules,
)


def get_enabled_terminals() -> List[str]:
    """Get list of enabled terminals from environment"""
    raw = os.getenv("TERMINALS_ENABLED", "QICT,KICT,KGTL,SAPT")
    return [t.strip().upper() for t in raw.split(",") if t.strip()]


async def fetch_vessel_schedules(
    terminal: str,
    vessel_name_query: str,
    nocache: bool = False
) -> List[VesselSchedule]:
    """
    Generic vessel schedule fetching for any terminal
    
    Args:
        terminal: Terminal name (QICT, KICT, KGTL, SAPT)
        vessel_name_query: Vessel name to search
        nocache: Bypass cache
    
    Returns:
        List of vessel schedules
    """
    prefix = f"{terminal}_"
    
    # KGTL uses HTML scraper
    if terminal == "KGTL":
        try:
            return await kgtl_fetch_vessel_html(vessel_name_query)
        except Exception:
            return []
    
    # QICT uses dedicated function
    if terminal == "QICT":
        if not nocache:
            cached = cache_service.get_vessel(vessel_name_query)
            if cached is not None:
                return cached
        results = await qict_fetch_vessel_schedules(vessel_name_query)
        if not nocache:
            cache_service.put_vessel(vessel_name_query, results)
        return results
    
    # Other terminals: check for JSON endpoint
    url = os.getenv(f"{prefix}VESSEL_URL")
    if not url:
        return []
    
    # Terminal-scoped cache key
    cache_key = f"{terminal}:{vessel_name_query}".strip().lower()
    if not nocache:
        cached = cache_service.get_vessel_by_key(cache_key)
        if cached is not None:
            return cached
    
    # Fetch from API
    user = os.getenv(f"{prefix}USER_ID", os.getenv("QICT_USER_ID", "Test"))
    pwd = os.getenv(f"{prefix}PASSWORD", os.getenv("QICT_PASSWORD", "Test"))
    cell = os.getenv(f"{prefix}CELL_NO", os.getenv("QICT_CELL_NO", "123456"))
    payload = {"UserID": user, "Password": pwd, "Cellno": cell}
    
    data = await fetch_json_list(url, payload, "POST", provider=terminal, op="vessel")
    
    if not isinstance(data, list):
        return []
    
    # Parse results
    q = vessel_name_query.strip().lower()
    results: List[VesselSchedule] = []
    
    for item in data:
        name = str(
            item.get("NAME") or
            item.get("VESSELNAME") or
            item.get("VESSEL") or
            item.get("VSL") or
            ""
        ).strip()
        
        if not name or (q and q not in name.lower()):
            continue
        
        voy = str(item.get("IN_VOY_NBR", "")).strip() or None
        eta = parse_dt(str(item.get("ETA", "")).strip())
        etd = parse_dt(str(item.get("ETD", "")).strip())
        ata = parse_dt(str(item.get("ATA", "")).strip())
        atd = parse_dt(str(item.get("ATD", "")).strip())
        status = status_from_ata_atd(ata, atd)
        
        results.append(VesselSchedule(
            terminal_name=terminal,
            vessel_name=name,
            voyage_no=voy,
            vessel_estimated_berth=eta,
            vessel_estimated_depart=etd,
            vessel_actual_berth=ata,
            vessel_actual_depart=atd,
            vessel_current_status=status,
        ))
    
    # Cache results
    if not nocache:
        cache_service.put_vessel_by_key(cache_key, results)
    
    return results


async def track_container(
    terminal: str,
    container_no: str,
    nocache: bool = False
) -> List[ContainerTrackResult]:
    """
    Generic container tracking for any terminal
    
    Args:
        terminal: Terminal name (QICT, KICT, KGTL, SAPT)
        container_no: Container number
        nocache: Bypass cache
    
    Returns:
        List of container tracking results
    """
    prefix = f"{terminal}_"
    
    # HTML-based terminals
    if terminal in {"KICT", "KGTL", "SAPT"}:
        try:
            if terminal == "KICT":
                return await kict_track_container_html(container_no)
            elif terminal == "KGTL":
                return await kgtl_track_container_html(container_no)
            elif terminal == "SAPT":
                return await sapt_track_container_html(container_no)
        except Exception:
            pass
        return [ContainerTrackResult(terminal_name=terminal, container_no=container_no)]
    
    # QICT uses dedicated function
    if terminal == "QICT":
        if not nocache:
            cached = cache_service.get_container(terminal, container_no)
            if cached is not None:
                return cached
        results = await qict_track_container(container_no)
        if not nocache:
            cache_service.put_container(terminal, container_no, results)
        return results
    
    # Other terminals: check for JSON API
    url = os.getenv(f"{prefix}API_URL")
    if not url:
        return [ContainerTrackResult(terminal_name=terminal, container_no=container_no)]
    
    # Check cache
    if not nocache:
        cached = cache_service.get_container(terminal, container_no)
        if cached is not None:
            return cached
    
    # Fetch from API
    user = os.getenv(f"{prefix}USER_ID", os.getenv("QICT_USER_ID", "Test"))
    pwd = os.getenv(f"{prefix}PASSWORD", os.getenv("QICT_PASSWORD", "Test"))
    cell = os.getenv(f"{prefix}CELL_NO", os.getenv("QICT_CELL_NO", "123456"))
    payload = {"ctrnbr": container_no, "UserID": user, "Password": pwd, "Cellno": cell}
    
    data = await fetch_json_list(url, payload, "POST", provider=terminal, op="container")
    
    if not isinstance(data, list):
        return [ContainerTrackResult(terminal_name=terminal, container_no=container_no)]
    
    # Parse results (simplified, add full parsing logic as needed)
    results: List[ContainerTrackResult] = []
    
    for item in data:
        # Add parsing logic here based on terminal-specific response format
        # This is a placeholder
        result = ContainerTrackResult(
            terminal_name=terminal,
            container_no=container_no,
        )
        results.append(result)
    
    if not results:
        results = [ContainerTrackResult(terminal_name=terminal, container_no=container_no)]
    
    # Cache results
    if not nocache:
        cache_service.put_container(terminal, container_no, results)
    
    return results


async def enrich_with_vessel_info(
    results: List[ContainerTrackResult],
    terminal: str = "QICT",
    nocache: bool = False
) -> None:
    """
    Enrich container results with vessel schedule information
    Modifies results in-place
    
    Args:
        results: Container tracking results to enrich
        terminal: Terminal to fetch vessel info from
        nocache: Bypass cache
    """
    # Collect unique vessel names
    names = {
        r.vessel_name.strip()
        for r in results
        if r.terminal_name == terminal and r.vessel_name and r.vessel_name.strip()
    }
    
    if not names:
        return
    
    # Fetch schedules concurrently
    async def _fetch(name: str) -> tuple[str, List[VesselSchedule]]:
        try:
            schedules = await fetch_vessel_schedules(terminal, name, nocache)
            return name, schedules
        except Exception:
            return name, []
    
    tasks = [asyncio.create_task(_fetch(n)) for n in names]
    fetched = await asyncio.gather(*tasks, return_exceptions=False)
    
    # Build best-match map
    best: dict[str, VesselSchedule] = {}
    for name, schedules in fetched:
        if not schedules:
            continue
        
        # Pick schedule with ATA (arrived) or latest ETA
        arrived = [s for s in schedules if s.vessel_actual_berth]
        if arrived:
            best[name.strip().lower()] = max(
                arrived,
                key=lambda s: s.vessel_actual_berth or datetime.min
            )
        elif schedules:
            best[name.strip().lower()] = max(
                schedules,
                key=lambda s: s.vessel_estimated_berth or datetime.min
            )
    
    # Apply enrichment
    for r in results:
        if r.terminal_name != terminal or not r.vessel_name:
            continue
        
        vessel_key = r.vessel_name.strip().lower()
        if vessel_key not in best:
            continue
        
        match = best[vessel_key]
        r.vessel_estimated_berth = match.vessel_estimated_berth
        r.vessel_estimated_depart = match.vessel_estimated_depart
        r.vessel_actual_berth = match.vessel_actual_berth
        r.vessel_actual_depart = match.vessel_actual_depart
        r.vessel_current_status = match.vessel_current_status
