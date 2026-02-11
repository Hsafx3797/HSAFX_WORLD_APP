"""
Scrapers Core Module
"""

from src.scrapers.core.connection_pool import (
    TemporaryClient,
    close_all_clients,
    close_terminal_client,
    get_pool_stats,
    get_terminal_client,
)
from src.scrapers.core.models import (
    CONTAINER_PATTERN,
    AllInOneTrackingRequest,
    AllInOneTrackingResponse,
    BulkContainerResult,
    BulkTrackingRequest,
    BulkTrackingResponse,
    ContainerTrackResponse,
    ContainerTrackResult,
    VesselSchedule,
    VesselScheduleResponse,
)
from src.scrapers.core.utils import (
    default_upstream_headers,
    is_valid_terminal,
    map_vessel_times,
    normalize_string,
    normalize_terminal_name,
    parse_dt,
    req_id_var,
    req_timeout,
    status_from_ata_atd,
    validate_container_number,
)

__all__ = [
    # Models
    "ContainerTrackResult",
    "VesselSchedule",
    "BulkTrackingRequest",
    "BulkTrackingResponse",
    "BulkContainerResult",
    "AllInOneTrackingRequest",
    "AllInOneTrackingResponse",
    "ContainerTrackResponse",
    "VesselScheduleResponse",
    "CONTAINER_PATTERN",
    # Utils
    "parse_dt",
    "status_from_ata_atd",
    "map_vessel_times",
    "default_upstream_headers",
    "req_timeout",
    "validate_container_number",
    "is_valid_terminal",
    "normalize_terminal_name",
    "normalize_string",
    "req_id_var",
    # Connection pool
    "get_terminal_client",
    "close_terminal_client",
    "close_all_clients",
    "get_pool_stats",
    "TemporaryClient",
]
