"""
HSAFX World App — FastAPI Compute Backend

Stateless compute service. Per the Backend Ownership Matrix:
  - NO database access (auth, billing, catalog, users all in Next.js)
  - Redis for async job orchestration only
  - Internal secret auth for Next.js → FastAPI calls
  - Public endpoints for tool execution and capabilities

Active routers: tools (compute), jobs (Redis), tracking (scraping)
Internal router: /internal/* (callback from Next.js)
"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.api.v1 import router as v1_router
from src.core.config import settings
from src.core.logging import setup_logging
from src.middleware.auth import AuthMiddleware
from src.middleware.error_tracking import ErrorTrackingMiddleware
from src.middleware.rate_limit import RateLimitMiddleware
from src.middleware.security import SecurityHeadersMiddleware

# Setup structured logging
setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — Redis + scraper pools only (no DB)"""
    logger.info(
        "Starting HSAFX compute server",
        version=settings.VERSION,
        mode="compute-only",
    )

    # Redis for async job queue (jobs.py)
    try:
        from src.core.redis import init_redis
        await init_redis()
        logger.info("Redis connection initialized")
    except Exception as e:
        logger.warning("Redis not available — jobs will fail", error=str(e))

    yield

    # Shutdown
    logger.info("Shutting down HSAFX compute server")

    # Close scraper HTTP pools (tracking.py)
    try:
        from src.scrapers.core.connection_pool import close_all_clients
        await close_all_clients()
    except Exception:
        pass

    # Close Redis
    try:
        from src.core.redis import close_redis
        await close_redis()
    except Exception:
        pass


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title="HSAFX World App API",
        description="Backend API for HSAFX World App - 448 Online Tools",
        version=settings.VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Compression middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Security headers + CSRF Origin validation
    app.add_middleware(SecurityHeadersMiddleware)

    # Error tracking (Sentry) — outermost to catch all errors
    app.add_middleware(ErrorTrackingMiddleware)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # Authentication
    app.add_middleware(AuthMiddleware)

    # Include routers
    app.include_router(v1_router, prefix="/api/v1")

    # Internal API for Next.js ↔ FastAPI communication (Task 3.5)
    from src.api.internal import router as internal_router
    app.include_router(internal_router, prefix="/internal", tags=["Internal"])

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}

    @app.get("/")
    async def root():
        return {
            "name": "HSAFX World App API",
            "version": settings.VERSION,
            "docs": "/docs" if settings.DEBUG else None,
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
