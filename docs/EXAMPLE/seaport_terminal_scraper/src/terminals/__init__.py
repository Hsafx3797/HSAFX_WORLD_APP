"""
Terminal Scraper Registry
Central registry for all terminal scrapers with auto-discovery
"""

from typing import Dict, Callable, List
from src.core.models import ContainerTrackResult, VesselSchedule

# Import Pakistan terminals
from .pakistan import (
    qict_track_container,
    qict_fetch_vessel_schedules,
    kict_track_container_html,
    kgtl_track_container_html,
    kgtl_fetch_vessel_html,
    sapt_track_container_html,
)

# Terminal scraper registry
# Maps terminal name to container tracking function
TERMINAL_SCRAPERS: Dict[str, Callable] = {
    "QICT": qict_track_container,
    "KICT": kict_track_container_html,
    "KGTL": kgtl_track_container_html,
    "SAPT": sapt_track_container_html,
}

# Vessel schedule fetchers (terminals that support it)
VESSEL_SCRAPERS: Dict[str, Callable] = {
    "QICT": qict_fetch_vessel_schedules,
    "KGTL": kgtl_fetch_vessel_html,
    # KICT and SAPT use internal vessel schedule fetching
}

# Default enabled terminals
DEFAULT_TERMINALS: List[str] = ["QICT", "KICT", "KGTL", "SAPT"]


def get_terminal_scraper(terminal: str) -> Callable:
    """
    Get container tracking scraper for a terminal
    
    Args:
        terminal: Terminal name (e.g., "QICT")
        
    Returns:
        Async function that takes container_no and returns List[ContainerTrackResult]
        
    Raises:
        ValueError: If terminal is not supported
    """
    terminal_upper = terminal.upper()
    if terminal_upper not in TERMINAL_SCRAPERS:
        available = ", ".join(TERMINAL_SCRAPERS.keys())
        raise ValueError(f"Unknown terminal: {terminal}. Available: {available}")
    return TERMINAL_SCRAPERS[terminal_upper]


def get_vessel_scraper(terminal: str) -> Callable:
    """
    Get vessel schedule scraper for a terminal
    
    Args:
        terminal: Terminal name (e.g., "QICT")
        
    Returns:
        Async function that takes vessel_name and returns List[VesselSchedule]
        
    Raises:
        ValueError: If terminal doesn't support vessel schedule fetching
    """
    terminal_upper = terminal.upper()
    if terminal_upper not in VESSEL_SCRAPERS:
        available = ", ".join(VESSEL_SCRAPERS.keys())
        raise ValueError(f"Terminal {terminal} doesn't support vessel schedules. Available: {available}")
    return VESSEL_SCRAPERS[terminal_upper]


def is_terminal_supported(terminal: str) -> bool:
    """Check if a terminal is supported"""
    return terminal.upper() in TERMINAL_SCRAPERS


def get_supported_terminals() -> List[str]:
    """Get list of all supported terminals"""
    return list(TERMINAL_SCRAPERS.keys())


__all__ = [
    "TERMINAL_SCRAPERS",
    "VESSEL_SCRAPERS",
    "DEFAULT_TERMINALS",
    "get_terminal_scraper",
    "get_vessel_scraper",
    "is_terminal_supported",
    "get_supported_terminals",
]
