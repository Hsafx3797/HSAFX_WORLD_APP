"""
Enhanced error handling for FreightForwarder Tracking API
Provides consistent error responses optimized for frontend integration
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging
import traceback
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base API error class"""
    def __init__(
        self, 
        message: str, 
        code: str = "GENERIC_ERROR", 
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class ValidationError(APIError):
    """Validation error for bad input data"""
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR", 
            status_code=422,
            details={"field": field, **(details or {})}
        )

class ContainerNotFoundError(APIError):
    """Container not found in specified terminals"""
    def __init__(self, container_no: str, terminals: List[str]):
        super().__init__(
            message=f"Container {container_no} not found",
            code="CONTAINER_NOT_FOUND",
            status_code=404,
            details={
                "container_no": container_no,
                "terminals_searched": terminals,
                "suggestion": "Verify container number format (4 letters + 7 digits) and try different terminal"
            }
        )

class VesselNotFoundError(APIError):
    """Vessel not found in specified terminals"""
    def __init__(self, vessel_name: str, terminals: List[str]):
        super().__init__(
            message=f"Vessel '{vessel_name}' not found",
            code="VESSEL_NOT_FOUND", 
            status_code=404,
            details={
                "vessel_name": vessel_name,
                "terminals_searched": terminals,
                "suggestion": "Try partial vessel name or check different terminals"
            }
        )

class TerminalError(APIError):
    """Error connecting to or scraping terminal"""
    def __init__(self, terminal: str, original_error: str):
        super().__init__(
            message=f"Terminal {terminal} is temporarily unavailable",
            code="TERMINAL_ERROR",
            status_code=503,
            details={
                "terminal": terminal,
                "original_error": original_error,
                "suggestion": "Terminal may be down for maintenance. Try again later."
            }
        )

class RateLimitError(APIError):
    """Rate limit exceeded"""
    def __init__(self, limit: str, reset_time: Optional[int] = None):
        super().__init__(
            message=f"Rate limit exceeded: {limit}",
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details={
                "limit": limit,
                "reset_time": reset_time,
                "suggestion": "Wait before making more requests"
            }
        )

class AuthenticationError(APIError):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR", 
            status_code=401,
            details={
                "suggestion": "Provide valid X-API-Key header or Authorization Bearer token"
            }
        )

def create_error_response(
    error: Exception,
    request: Optional[Request] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """
    Create consistent error response for frontend consumption
    """
    if request_id is None:
        request_id = str(uuid.uuid4())
    
    # Handle different error types
    if isinstance(error, APIError):
        response_data = {
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            },
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Log error details for debugging
        logger.warning(f"API Error [{error.code}]: {error.message}", extra={
            "request_id": request_id,
            "status_code": error.status_code,
            "details": error.details
        })
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data
        )
    
    elif isinstance(error, HTTPException):
        # Convert FastAPI HTTPException to our format
        response_data = {
            "success": False,
            "error": {
                "code": f"HTTP_{error.status_code}",
                "message": str(error.detail),
                "details": {}
            },
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return JSONResponse(
            status_code=error.status_code,
            content=response_data
        )
    
    else:
        # Handle unexpected errors
        logger.error(f"Unexpected error: {str(error)}", extra={
            "request_id": request_id,
            "error_type": type(error).__name__,
            "traceback": traceback.format_exc()
        })
        
        response_data = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {
                    "suggestion": "Please try again or contact support if the problem persists"
                }
            },
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return JSONResponse(
            status_code=500,
            content=response_data
        )

def create_success_response(
    data: Any,
    message: str = "Success",
    meta: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create consistent success response for frontend consumption
    """
    if request_id is None:
        request_id = str(uuid.uuid4())
    
    response = {
        "success": True,
        "message": message,
        "data": data,
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    if meta:
        response["meta"] = meta
    
    return response

def validate_container_number(container_no: str) -> str:
    """
    Validate and normalize container number
    """
    if not container_no:
        raise ValidationError("Container number is required", "container_no")
    
    container_clean = container_no.strip().upper()
    
    # Validate format: 4 letters + 7 digits
    import re
    if not re.match(r'^[A-Z]{4}\d{7}$', container_clean):
        raise ValidationError(
            "Invalid container number format. Expected 4 letters + 7 digits (e.g., CSNU8234026)",
            "container_no",
            {"provided": container_no, "expected_format": "AAAA9999999"}
        )
    
    return container_clean

def validate_terminal(terminal: str) -> str:
    """
    Validate terminal name
    """
    if not terminal:
        raise ValidationError("Terminal is required", "terminal")
    
    terminal_clean = terminal.strip().upper()
    valid_terminals = {"KICT", "KGTL", "QICT", "SAPT"}
    
    if terminal_clean not in valid_terminals:
        raise ValidationError(
            f"Invalid terminal: {terminal}",
            "terminal",
            {
                "provided": terminal,
                "valid_terminals": list(valid_terminals)
            }
        )
    
    return terminal_clean

def validate_vessel_name(vessel_name: str) -> str:
    """
    Validate and normalize vessel name
    """
    if not vessel_name:
        raise ValidationError("Vessel name is required", "vessel_name")
    
    vessel_clean = vessel_name.strip().upper()
    
    if len(vessel_clean) < 2:
        raise ValidationError(
            "Vessel name must be at least 2 characters", 
            "vessel_name",
            {"provided": vessel_name, "min_length": 2}
        )
    
    return vessel_clean

# Common HTTP status codes and their meanings for frontend
HTTP_STATUS_MEANINGS = {
    200: "Success",
    400: "Bad Request - Check your input data", 
    401: "Authentication Required",
    403: "Forbidden - Access denied",
    404: "Not Found - Container/Vessel not found",
    422: "Validation Error - Invalid input format",
    429: "Rate Limit Exceeded - Too many requests",
    500: "Internal Server Error - Something went wrong on our end", 
    503: "Service Unavailable - Terminal temporarily unavailable"
}