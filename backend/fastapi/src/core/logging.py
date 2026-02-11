"""
Structured Logging Configuration
"""

import sys

import structlog

from src.core.config import settings


def setup_logging() -> None:
    """Configure structured logging with structlog"""

    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if settings.DEBUG:
        # Development: colorful console output
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        # Production: JSON output for log aggregation
        processors.extend([
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ])

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(20 if settings.DEBUG else 30),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )
