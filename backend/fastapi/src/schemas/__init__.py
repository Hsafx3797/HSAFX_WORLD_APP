"""
Pydantic Schemas
Request/Response models for API endpoints
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# Enums
class UserTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class ExecutionTier(str, Enum):
    CLIENT = "client"
    EDGE = "edge"
    SERVER = "server"


# Tool Schemas
class ToolResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str]
    short_description: Optional[str]
    category_id: Optional[str]
    category_name: Optional[str] = None
    execution_tier: str
    coin_cost: int
    is_active: bool
    is_featured: bool
    requires_auth: bool
    tags: List[str] = []
    usage_count: int = 0
    avg_execution_time: Optional[float]
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    ui_config: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    tools: List[ToolResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ToolExecuteRequest(BaseModel):
    tool_id: str
    input: Dict[str, Any]
    session_id: Optional[str] = None


class ToolExecuteResponse(BaseModel):
    success: bool
    output: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: int
    coins_charged: int = 0


# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int


# Error Response
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# Health Check
class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
