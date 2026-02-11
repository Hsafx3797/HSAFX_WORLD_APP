"""
Response Builder Service - Standardized API response construction
"""
from typing import List, Optional, Dict, Any
from src.core.models import ContainerTrackResult, VesselSchedule


def apply_pagination(items: List[Any], page: int, page_size: int) -> List[Any]:
    """
    Apply pagination to list of items
    
    Args:
        items: List to paginate
        page: Page number (1-indexed)
        page_size: Items per page
    
    Returns:
        Paginated slice of items
    """
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]


def build_pagination_meta(total: int, page: int, page_size: int) -> dict:
    """
    Build pagination metadata
    
    Returns:
        Dictionary with pagination info
    """
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_more": page < total_pages,
    }


def build_vessel_response(
    results: List[VesselSchedule],
    terminals_searched: List[str],
    search_time: float,
    page: int = 1,
    page_size: int = 100,
    meta: Optional[dict] = None
) -> dict:
    """
    Build standardized vessel tracking response
    
    Args:
        results: List of vessel schedules
        terminals_searched: Terminals that were searched
        search_time: Time taken for search in seconds
        page: Current page number
        page_size: Items per page
        meta: Additional metadata
    
    Returns:
        Standardized response dictionary
    """
    total = len(results)
    paginated = apply_pagination(results, page, page_size)
    
    response = {
        "success": True,
        "results": [r.model_dump() for r in paginated],
        "terminals_searched": terminals_searched,
        "search_time": round(search_time, 3),
        "meta": {
            **build_pagination_meta(total, page, page_size),
            **(meta or {})
        }
    }
    
    return response


def build_container_response(
    results: List[ContainerTrackResult],
    terminals_searched: List[str],
    search_time: float,
    page: int = 1,
    page_size: int = 100,
    meta: Optional[dict] = None
) -> dict:
    """
    Build standardized container tracking response
    
    Args:
        results: List of container tracking results
        terminals_searched: Terminals that were searched
        search_time: Time taken for search in seconds
        page: Current page number
        page_size: Items per page
        meta: Additional metadata
    
    Returns:
        Standardized response dictionary
    """
    total = len(results)
    paginated = apply_pagination(results, page, page_size)
    
    response = {
        "success": True,
        "results": [r.model_dump() for r in paginated],
        "terminals_searched": terminals_searched,
        "search_time": round(search_time, 3),
        "meta": {
            **build_pagination_meta(total, page, page_size),
            **(meta or {})
        }
    }
    
    return response


def build_bulk_response(
    results: List[Dict[str, Any]],
    total_time: float,
    summary: Optional[dict] = None
) -> dict:
    """
    Build standardized bulk tracking response
    
    Args:
        results: List of bulk container results
        total_time: Total time for bulk operation
        summary: Summary statistics
    
    Returns:
        Standardized bulk response
    """
    total = len(results)
    successful = sum(1 for r in results if r.get("success", False))
    failed = total - successful
    
    return {
        "success": True,
        "total_containers": total,
        "successful_containers": successful,
        "failed_containers": failed,
        "results": results,
        "total_time": round(total_time, 3),
        "summary": summary or {}
    }


def build_error_response(
    error: Exception,
    request_id: Optional[str] = None,
    status_code: int = 500
) -> dict:
    """
    Build standardized error response
    
    Args:
        error: Exception object
        request_id: Request correlation ID
        status_code: HTTP status code
    
    Returns:
        Standardized error response
    """
    from datetime import datetime
    
    response = {
        "success": False,
        "error": {
            "message": str(error),
            "type": type(error).__name__,
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    if request_id:
        response["request_id"] = request_id
    
    # Add error details if available
    if hasattr(error, "details"):
        response["error"]["details"] = error.details
    
    if hasattr(error, "code"):
        response["error"]["code"] = error.code
    
    return response
