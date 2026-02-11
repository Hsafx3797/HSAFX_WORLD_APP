"""
Utility functions for Seaport Terminal Scrapers
Date parsing, validation, headers, and helpers

Tool 446 - Seaport Terminal Container Activity Tracker
"""

import os
import re
from contextvars import ContextVar
from datetime import datetime
from typing import Dict, Optional, Tuple

import httpx

# Request-scoped correlation ID shared between main and scrapers
req_id_var: ContextVar[Optional[str]] = ContextVar("_req_id", default=None)

# Container number regex pattern
CONTAINER_PATTERN = re.compile(r'^[A-Z]{4}\d{7}$')

# Cache for compiled date format patterns (optimized order by frequency)
_DATE_FORMATS = [
    "%d-%b-%Y %H:%M",
    "%d-%b-%Y %H:%M:%S",
    "%m/%d/%Y %H:%M:%S",
    "%d-%b-%y %H:%M",
    "%d-%b-%y %H:%M:%S",
    "%d-%b-%Y %I:%M %p",
    "%d-%b-%Y %I:%M:%S %p",
    "%d-%b-%y %I:%M %p",
    "%d-%b-%y %I:%M:%S %p",
    "%m/%d/%Y %I:%M:%S %p",
    "%m/%d/%Y %H:%M",
    "%d-%m-%Y %H:%M",
    "%d/%m/%Y %H:%M",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M",
]


def parse_dt(val: Optional[str]) -> Optional[datetime]:
    """
    Enhanced date/time parser for various terminal formats
    Handles mixed 24-hour and 12-hour formats with intelligent AM/PM correction
    """
    if not val:
        return None

    s_raw = str(val).strip()
    if not s_raw or s_raw.upper() in {"N/A", "NA", "NULL", "NONE", "-", "—"}:
        return None

    # Normalize format
    s = s_raw.upper().replace(".", ":").replace("  ", " ")

    # Fix invalid AM/PM combinations
    if " PM" in s or " AM" in s:
        # Find the time component (contains ":")
        parts = s.split()
        time_part = None
        ampm_part = None

        for i, part in enumerate(parts):
            if ":" in part:
                time_part = part
                # AM/PM should be the next part or the last part
                if i + 1 < len(parts) and parts[i + 1] in ("AM", "PM"):
                    ampm_part = parts[i + 1]
                elif parts[-1] in ("AM", "PM"):
                    ampm_part = parts[-1]
                break

        if time_part and ampm_part:
            try:
                hour_str = time_part.split(":")[0]
                hour = int(hour_str)

                # Handle invalid combinations like "13:00:00 PM" or "23:00:00 PM"
                if hour > 12:
                    # Remove AM/PM for 24-hour format (13-23 hours)
                    s = s.replace(" PM", "").replace(" AM", "")
                elif hour == 0 and ampm_part == "AM":
                    # Fix "00:xx:xx AM" -> "12:xx:xx AM" (midnight)
                    s = s.replace("00:", "12:", 1)
                elif hour == 0 and ampm_part == "PM":
                    # Fix "00:xx:xx PM" -> "12:xx:xx PM" (noon)
                    s = s.replace("00:", "12:", 1)
            except (ValueError, IndexError):
                pass

    # Try cached formats first (ordered by frequency)
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except (ValueError, TypeError):
            continue

    # Try ISO format as fallback
    try:
        return datetime.fromisoformat(s)
    except (ValueError, TypeError):
        return None


def status_from_ata_atd(ata: Optional[datetime], atd: Optional[datetime]) -> str:
    """Determine vessel status from arrival and departure times"""
    if not ata:
        return "Upcoming"
    if ata and not atd:
        return "Arrived"
    return "Departed"


def map_vessel_times(
    status: str,
    eta: Optional[datetime],
    etd: Optional[datetime]
) -> Tuple[Optional[datetime], Optional[datetime], Optional[datetime], Optional[datetime]]:
    """
    Map ETA/ETD to estimated/actual berth/depart based on vessel status

    This centralizes the vessel time mapping logic used across all terminals (KICT, SAPT, etc)

    Args:
        status: Vessel status ('UPCOMING', 'ARRIVED', 'DEPARTED', or other)
        eta: Estimated Time of Arrival
        etd: Estimated Time of Departure

    Returns:
        Tuple of (estimated_berth, actual_berth, estimated_depart, actual_depart)

    Examples:
        >>> map_vessel_times('UPCOMING', eta_dt, etd_dt)
        (eta_dt, None, etd_dt, None)

        >>> map_vessel_times('ARRIVED', eta_dt, etd_dt)
        (None, eta_dt, etd_dt, None)

        >>> map_vessel_times('DEPARTED', eta_dt, etd_dt)
        (None, eta_dt, None, etd_dt)
    """
    status_upper = status.upper() if status else ''

    if status_upper == 'UPCOMING':
        # Vessel not yet arrived - all times are estimates
        return (eta, None, etd, None)
    elif status_upper == 'ARRIVED':
        # Vessel has arrived - ETA becomes actual berth, ETD still estimated
        return (None, eta, etd, None)
    elif status_upper == 'DEPARTED':
        # Vessel has departed - both times are actual
        return (None, eta, None, etd)
    else:
        # Unknown status - treat as estimated (defensive)
        return (eta, None, etd, None)


def default_upstream_headers() -> Dict[str, str]:
    """Get default headers for upstream requests with request correlation"""
    req_id = req_id_var.get()
    ua = os.getenv(
        "SCRAPER_USER_AGENT",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    )
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
        "Accept-Language": os.getenv("SCRAPER_ACCEPT_LANGUAGE", "en-US,en;q=0.9"),
        "User-Agent": ua,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    if req_id:
        headers["X-Request-ID"] = req_id
    return headers


def req_timeout() -> httpx.Timeout:
    """Get configured HTTP timeout settings"""
    return httpx.Timeout(
        float(os.getenv("REQUEST_TIMEOUT", "30")),
        connect=float(os.getenv("CONNECTION_TIMEOUT", "10")),
    )


def validate_container_number(container_no: str) -> str:
    """Validate and normalize container number"""
    if not container_no:
        raise ValueError('Container number is required')

    container_clean = container_no.strip().upper()
    if not CONTAINER_PATTERN.match(container_clean):
        raise ValueError('Invalid container number format. Expected 4 letters + 7 digits')

    return container_clean


def is_valid_terminal(terminal: str) -> bool:
    """Check if terminal name is valid"""
    return terminal.upper() in {"QICT", "KICT", "KGTL", "SAPT"}


def normalize_terminal_name(terminal: str) -> str:
    """Normalize terminal name"""
    terminal_upper = terminal.strip().upper()
    if not is_valid_terminal(terminal_upper):
        raise ValueError(f'Invalid terminal: {terminal}. Valid terminals: QICT, KICT, KGTL, SAPT')
    return terminal_upper


def normalize_string(value: Optional[str]) -> str:
    """
    Normalize string for comparison (strip, upper, empty string for None)
    Useful for vessel names, voyage numbers, and terminal codes
    """
    if not value:
        return ""
    return value.strip().upper()
