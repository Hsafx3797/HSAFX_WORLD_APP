"""Core business logic and utilities"""

from .models import (
    VesselSchedule,
    ContainerTrackResult,
    BulkTrackingRequest,
    BulkContainerResult,
    BulkTrackingResponse,
    AllInOneTrackingRequest,
    AllInOneTrackingResponse,
)
from .utils import (
    parse_dt,
    status_from_ata_atd,
    default_upstream_headers,
    req_timeout,
    validate_container_number,
    is_valid_terminal,
    normalize_terminal_name,
    normalize_string,
    map_vessel_times,
    req_id_var,
    CONTAINER_PATTERN,
)
from .errors import (
    APIError,
    ValidationError,
    ContainerNotFoundError,
    VesselNotFoundError,
    TerminalError,
    RateLimitError,
    AuthenticationError,
    create_error_response,
    create_success_response,
)

__all__ = [
    # Models
    "VesselSchedule",
    "ContainerTrackResult",
    "BulkTrackingRequest",
    "BulkContainerResult",
    "BulkTrackingResponse",
    "AllInOneTrackingRequest",
    "AllInOneTrackingResponse",
    # Utils
    "parse_dt",
    "status_from_ata_atd",
    "default_upstream_headers",
    "req_timeout",
    "validate_container_number",
    "is_valid_terminal",
    "normalize_terminal_name",
    "normalize_string",
    "map_vessel_times",
    "req_id_var",
    "CONTAINER_PATTERN",
    # Errors
    "APIError",
    "ValidationError",
    "ContainerNotFoundError",
    "VesselNotFoundError",
    "TerminalError",
    "RateLimitError",
    "AuthenticationError",
    "create_error_response",
    "create_success_response",
]
