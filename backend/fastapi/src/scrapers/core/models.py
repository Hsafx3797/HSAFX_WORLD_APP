"""
Data models for Seaport Terminal Scrapers
Pydantic models for validation and serialization

Tool 446 - Seaport Terminal Container Activity Tracker
"""

import re
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from .utils import CONTAINER_PATTERN


class VesselSchedule(BaseModel):
    """Vessel schedule information from terminals"""
    terminal_name: str = Field(default="QICT")
    vessel_name: str
    voyage_no: Optional[str] = None
    vessel_estimated_berth: Optional[datetime] = None  # ETA
    vessel_estimated_depart: Optional[datetime] = None  # ETD
    vessel_actual_berth: Optional[datetime] = None  # ATA
    vessel_actual_depart: Optional[datetime] = None  # ATD
    vessel_current_status: Optional[str] = None  # Upcoming/Arrived/Departed

    @field_validator('vessel_name')
    @classmethod
    def validate_vessel_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Vessel name cannot be empty')
        return v.strip().upper()


class ContainerTrackResult(BaseModel):
    """Container tracking result from terminals"""
    terminal_name: str = Field(default="QICT")
    container_no: str
    container_size_n_type: Optional[str] = None
    shipment_category: Optional[str] = None
    vessel_name: Optional[str] = None
    voyage_no: Optional[str] = None
    destination: Optional[str] = None
    hold_description: Optional[str] = None
    gate_in_date: Optional[datetime] = None
    load_date: Optional[datetime] = None
    container_position: Optional[str] = None
    vessel_estimated_berth: Optional[datetime] = None
    vessel_estimated_depart: Optional[datetime] = None
    vessel_actual_berth: Optional[datetime] = None
    vessel_actual_depart: Optional[datetime] = Field(default=None, serialization_alias="vessel_actual_departure")
    vessel_current_status: Optional[str] = Field(default=None, serialization_alias="vessel_Status")

    @field_validator('container_no')
    @classmethod
    def validate_container_no(cls, v: str) -> str:
        if not v:
            raise ValueError('Container number is required')
        container_clean = v.strip().upper()
        if not CONTAINER_PATTERN.match(container_clean):
            raise ValueError('Invalid container number format. Expected 4 letters + 7 digits')
        return container_clean

    @field_validator('vessel_name')
    @classmethod
    def normalize_vessel_name(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else None


class BulkTrackingRequest(BaseModel):
    """Request model for bulk container tracking"""
    containers: List[str] = Field(..., description="List of container numbers to track")
    terminals: Optional[List[str]] = Field(default=None, description="Specific terminals to search (if None, search all)")
    max_concurrent: int = Field(default=5, description="Maximum concurrent requests per terminal", ge=1, le=20)


class BulkContainerResult(BaseModel):
    """Individual container result in bulk operation"""
    container_no: str
    success: bool
    results: List[ContainerTrackResult] = []
    error_message: Optional[str] = None
    search_time: float = 0.0
    terminals_searched: List[str] = []


class BulkTrackingResponse(BaseModel):
    """Response model for bulk container tracking"""
    success: bool
    total_containers: int
    successful_containers: int
    failed_containers: int
    results: List[BulkContainerResult]
    total_time: float
    summary: dict = Field(default_factory=dict, description="Terminal usage summary")


class AllInOneTrackingRequest(BaseModel):
    """Request model for all-in-one container tracking with terminal assignment"""
    containers: Dict[str, str] = Field(..., description="Container numbers mapped to terminal names")
    max_concurrent: int = Field(default=10, description="Maximum concurrent requests per terminal", ge=1, le=20)


class AllInOneTrackingResponse(BaseModel):
    """Response model for all-in-one container tracking"""
    success: bool
    total_containers: int
    successful_containers: int
    failed_containers: int
    duplicates_removed: int
    results: List[BulkContainerResult]
    total_time: float
    terminal_summary: dict = Field(default_factory=dict, description="Containers processed per terminal")


# API Response wrappers
class ContainerTrackResponse(BaseModel):
    """Standard response for container tracking"""
    success: bool
    results: List[ContainerTrackResult] = []
    terminals_searched: List[str] = []
    search_time: float = 0.0
    cached: bool = False
    meta: Optional[dict] = None


class VesselScheduleResponse(BaseModel):
    """Standard response for vessel schedule"""
    success: bool
    results: List[VesselSchedule] = []
    terminal: str
    search_time: float = 0.0
    cached: bool = False
