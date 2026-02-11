"""API Request/Response Schemas"""
from typing import List, Optional
from pydantic import BaseModel, Field

from src.core.models import VesselSchedule, ContainerTrackResult


class ApiListResponse(BaseModel):
    """Response model for vessel list endpoints"""
    success: bool = True
    results: List[VesselSchedule] = []
    terminals_searched: List[str] = []
    search_time: float = 0.0
    meta: Optional[dict] = None


class ApiContainerListResponse(BaseModel):
    """Response model for container list endpoints"""
    success: bool = True
    results: List[ContainerTrackResult] = []
    terminals_searched: List[str] = []
    search_time: float = 0.0
    meta: Optional[dict] = None
