"""
Structured logging configuration for FreightForwarder Tracking API
Optimized for production monitoring and debugging
"""

import logging
import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime
import structlog
from structlog.stdlib import LoggerFactory, add_logger_name
from structlog.processors import JSONRenderer, TimeStamper, add_log_level, StackInfoRenderer
import uuid

class RequestIDFilter(logging.Filter):
    """Add request ID to log records when available"""
    
    def filter(self, record):
        from src.main import _req_id_var
        try:
            record.request_id = _req_id_var.get()
        except (LookupError, AttributeError):
            record.request_id = None
        return True

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record):
        # Create structured log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add request ID if available
        if hasattr(record, 'request_id') and record.request_id:
            log_entry["request_id"] = record.request_id
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 
                          'msecs', 'relativeCreated', 'thread', 'threadName', 
                          'processName', 'process', 'getMessage', 'exc_info', 'exc_text', 
                          'stack_info', 'request_id']:
                if not key.startswith('_'):
                    log_entry[key] = value
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add stack trace if present
        if record.stack_info:
            log_entry["stack_info"] = record.stack_info
        
        # Convert to JSON string
        import json
        try:
            return json.dumps(log_entry, separators=(',', ':'))
        except (TypeError, ValueError):
            # Fallback to simple format if JSON serialization fails
            return f"{log_entry['timestamp']} {log_entry['level']} {log_entry['logger']}: {log_entry['message']}"

def setup_logging(
    log_level: str = "INFO",
    log_format: str = "json",
    enable_request_logs: bool = False,
    log_file: Optional[str] = None
) -> None:
    """
    Configure structured logging for the application
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Output format ("json" or "console")
        enable_request_logs: Whether to log HTTP requests
        log_file: Optional file path for log output
    """
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if log_format == "json" else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Set formatter based on format preference
    if log_format == "json":
        console_handler.setFormatter(StructuredFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter(
                fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        )
    
    # Add request ID filter
    console_handler.addFilter(RequestIDFilter())
    root_logger.addHandler(console_handler)
    
    # Create file handler if specified
    if log_file:
        try:
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
            file_handler.setFormatter(StructuredFormatter())  # Always JSON for files
            file_handler.addFilter(RequestIDFilter())
            root_logger.addHandler(file_handler)
        except Exception as e:
            structlog.get_logger().warning("Failed to create file handler", error=str(e), file=log_file)
    
    # Configure specific loggers
    configure_logger_levels(enable_request_logs)
    
    # Log configuration
    logger = structlog.get_logger("logging")
    logger.info("Logging configured", 
               level=log_level, 
               format=log_format,
               request_logs=enable_request_logs,
               file_output=bool(log_file))

def configure_logger_levels(enable_request_logs: bool = False) -> None:
    """Configure logging levels for various components"""
    
    # Set httpx to WARNING to reduce noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Set uvicorn to INFO
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO if enable_request_logs else logging.WARNING)
    
    # Set fastapi to INFO
    logging.getLogger("fastapi").setLevel(logging.INFO)
    
    # Set our application loggers
    logging.getLogger("api").setLevel(logging.INFO)
    logging.getLogger("scrapers").setLevel(logging.INFO)
    logging.getLogger("bulk_tracking").setLevel(logging.INFO)
    
    # Reduce noise from other libraries
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("aiohttp").setLevel(logging.WARNING)

def get_logger(name: str, **kwargs) -> structlog.BoundLogger:
    """
    Get a structured logger with optional context
    
    Args:
        name: Logger name
        **kwargs: Additional context to bind to logger
        
    Returns:
        Configured structlog logger
    """
    logger = structlog.get_logger(name)
    if kwargs:
        logger = logger.bind(**kwargs)
    return logger

def log_api_call(
    endpoint: str,
    method: str,
    status_code: int,
    duration_ms: int,
    request_id: Optional[str] = None,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
    **kwargs
) -> None:
    """
    Log API call with structured data
    
    Args:
        endpoint: API endpoint path
        method: HTTP method
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        request_id: Optional request ID
        user_agent: Optional user agent
        ip_address: Optional client IP
        **kwargs: Additional context
    """
    logger = get_logger("api.access")
    
    context = {
        "endpoint": endpoint,
        "method": method,
        "status": status_code,
        "duration_ms": duration_ms,
    }
    
    if request_id:
        context["request_id"] = request_id
    if user_agent:
        context["user_agent"] = user_agent
    if ip_address:
        context["ip"] = ip_address
    
    context.update(kwargs)
    
    # Log at appropriate level based on status code
    if status_code >= 500:
        logger.error("API request failed", **context)
    elif status_code >= 400:
        logger.warning("API request error", **context)
    else:
        logger.info("API request", **context)

def log_scraper_activity(
    terminal: str,
    operation: str,
    success: bool,
    duration_ms: int,
    container_no: Optional[str] = None,
    vessel_name: Optional[str] = None,
    error: Optional[str] = None,
    **kwargs
) -> None:
    """
    Log scraper activity with structured data
    
    Args:
        terminal: Terminal name (QICT, KICT, etc.)
        operation: Operation type (container, vessel)
        success: Whether operation succeeded
        duration_ms: Operation duration in milliseconds
        container_no: Optional container number
        vessel_name: Optional vessel name
        error: Optional error message
        **kwargs: Additional context
    """
    logger = get_logger("scrapers")
    
    context = {
        "terminal": terminal,
        "operation": operation,
        "success": success,
        "duration_ms": duration_ms,
    }
    
    if container_no:
        context["container"] = container_no
    if vessel_name:
        context["vessel"] = vessel_name
    if error:
        context["error"] = error
    
    context.update(kwargs)
    
    if success:
        logger.info("Scraper operation completed", **context)
    else:
        logger.error("Scraper operation failed", **context)

def log_performance_metrics(
    operation: str,
    duration_ms: int,
    items_processed: int = 0,
    cache_hits: int = 0,
    cache_misses: int = 0,
    **kwargs
) -> None:
    """
    Log performance metrics
    
    Args:
        operation: Operation name
        duration_ms: Total duration in milliseconds
        items_processed: Number of items processed
        cache_hits: Number of cache hits
        cache_misses: Number of cache misses
        **kwargs: Additional metrics
    """
    logger = get_logger("performance")
    
    context = {
        "operation": operation,
        "duration_ms": duration_ms,
        "items_processed": items_processed,
    }
    
    if cache_hits or cache_misses:
        context["cache_hit_ratio"] = cache_hits / (cache_hits + cache_misses) if (cache_hits + cache_misses) > 0 else 0
        context["cache_hits"] = cache_hits
        context["cache_misses"] = cache_misses
    
    if items_processed > 0:
        context["avg_time_per_item"] = duration_ms / items_processed
    
    context.update(kwargs)
    
    logger.info("Performance metrics", **context)

# Initialize logging with environment variables
def init_logging():
    """Initialize logging from environment variables"""
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = os.getenv("LOG_FORMAT", "console" if os.getenv("APP_ENV") == "local" else "json")
    enable_request_logs = os.getenv("LOG_REQUESTS", "false").lower() == "true"
    log_file = os.getenv("LOG_FILE")
    
    setup_logging(
        log_level=log_level,
        log_format=log_format,
        enable_request_logs=enable_request_logs,
        log_file=log_file
    )