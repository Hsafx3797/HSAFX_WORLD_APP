"""
Error Tracking Middleware — FastAPI
Reference: SOLUTION_ROADMAP Sprint 5.3

Integrates Sentry SDK for error tracking and performance monitoring.
- Auto-captures unhandled exceptions
- Adds request context (user, path, method) to Sentry events
- Performance tracing for slow endpoints
- Alert-worthy error tagging

Sentry SDK is already in requirements.txt (sentry-sdk[fastapi]==2.21.0).
Set SENTRY_DSN env var to enable.
"""

import time
from typing import Optional

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from src.core.config import settings

logger = structlog.get_logger()

# ── Sentry initialization ─────────────────────────────────────

_sentry_initialized = False


def init_sentry() -> bool:
    """Initialize Sentry SDK. Returns True if successful."""
    global _sentry_initialized

    if _sentry_initialized:
        return True

    dsn = settings.SENTRY_DSN
    if not dsn:
        logger.info("sentry_disabled", reason="SENTRY_DSN not configured")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment="production" if not settings.DEBUG else "development",
            release=settings.VERSION,
            traces_sample_rate=0.1 if not settings.DEBUG else 1.0,
            profiles_sample_rate=0.05,
            enable_tracing=True,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(transaction_style="endpoint"),
            ],
            # Don't send PII by default (GDPR)
            send_default_pii=False,
            # Filter noisy errors
            before_send=_before_send,
        )

        _sentry_initialized = True
        logger.info("sentry_initialized", dsn_prefix=dsn[:20] + "...")
        return True
    except ImportError:
        logger.warning("sentry_import_failed", hint="pip install sentry-sdk[fastapi]")
        return False
    except Exception as e:
        logger.error("sentry_init_error", error=str(e))
        return False


def _before_send(event: dict, hint: dict) -> Optional[dict]:
    """Filter events before sending to Sentry."""
    # Skip health check noise
    if event.get("request", {}).get("url", "").endswith("/health"):
        return None

    # Skip 404s (usually bots probing)
    exc_info = hint.get("exc_info")
    if exc_info:
        _, exc_value, _ = exc_info
        if hasattr(exc_value, "status_code") and exc_value.status_code == 404:
            return None

    return event


# ── Error tracking helpers ─────────────────────────────────────

def capture_exception(error: Exception, **context) -> None:
    """Capture an exception to Sentry + structured log."""
    logger.error(
        "exception_captured",
        error=str(error),
        error_type=type(error).__name__,
        **context,
    )

    if _sentry_initialized:
        try:
            import sentry_sdk
            with sentry_sdk.new_scope() as scope:
                for key, value in context.items():
                    scope.set_extra(key, value)
                sentry_sdk.capture_exception(error)
        except Exception:
            pass  # Don't let monitoring break the app


def capture_message(message: str, level: str = "info", **context) -> None:
    """Capture a message to Sentry + structured log."""
    log_fn = getattr(logger, level, logger.info)
    log_fn("message_captured", message=message, **context)

    if _sentry_initialized:
        try:
            import sentry_sdk
            with sentry_sdk.new_scope() as scope:
                for key, value in context.items():
                    scope.set_extra(key, value)
                sentry_sdk.capture_message(message, level=level)
        except Exception:
            pass


# ── Middleware ──────────────────────────────────────────────────

class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Times every request
    2. Captures unhandled exceptions to Sentry
    3. Tags slow requests (>5s) as performance issues
    4. Adds user context from auth middleware
    """

    def __init__(self, app):
        super().__init__(app)
        # Initialize Sentry on first middleware creation
        init_sentry()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.time()
        path = request.url.path
        method = request.method

        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000

            # Tag slow requests
            if duration_ms > 5000 and not path.startswith("/health"):
                capture_message(
                    f"Slow request: {method} {path}",
                    level="warning",
                    duration_ms=round(duration_ms),
                    status_code=response.status_code,
                )

            # Log 5xx errors
            if response.status_code >= 500:
                capture_message(
                    f"Server error: {method} {path} → {response.status_code}",
                    level="error",
                    duration_ms=round(duration_ms),
                    status_code=response.status_code,
                )

            return response

        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000

            capture_exception(
                exc,
                path=path,
                method=method,
                duration_ms=round(duration_ms),
            )

            # Re-raise so FastAPI's exception handlers can process it
            raise
