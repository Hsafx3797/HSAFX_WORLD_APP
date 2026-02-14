"""
Application Configuration
"""

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment"""

    # App
    APP_NAME: str = "HSAFX World App"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = ""

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600

    # Auth — better-auth session validation (JWT removed — better-auth is the single auth system)
    INTERNAL_SECRET: str = ""  # For Next.js → FastAPI service calls

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://hsafx.world",
        "https://admin.hsafx.world",
    ]

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "hsafx-uploads"

    # Rate Limiting
    RATE_LIMIT_FREE: int = 60  # requests per minute
    RATE_LIMIT_PRO: int = 300
    RATE_LIMIT_ADVANCE: int = 1000

    # Tools
    TOOL_TIMEOUT_SECONDS: int = 30
    MAX_FILE_SIZE_MB: int = 50

    # Sentry
    SENTRY_DSN: str = ""

    # ==================== SEAPORT TERMINAL SCRAPERS (Tool 446) ====================
    # Enabled terminals
    TERMINALS_ENABLED: str = "QICT,KICT,KGTL,SAPT"

    # KICT (Karachi International Container Terminal)
    KICT_HISTORY_URL: str = "https://kictl.com/Enquiries/ContainerHistory"
    KICT_DETAILS_URL: str = "https://kictl.com/Enquiries/ContainerDetails"
    KICT_VESSEL_URL: str = "https://kictl.com/Enquiries/VesselSchedule"
    KICT_SSL_VERIFY: str = "false"  # Legacy SSL issues

    # KGTL (Karachi Gateway Terminal Limited)
    KGTL_TRACK_URL: str = "https://www.kgtl.com.pk/en/online-tracking"
    KGTL_VESSEL_PAGE: str = "https://www.kgtl.com.pk/en/vessel-schedule"

    # QICT (Qasim International Container Terminal)
    QICT_API_URL: str = "https://lfs.qict.com.pk/API/api/ds/v1/Ctr-Inq"
    QICT_VESSEL_URL: str = "https://lfs.qict.com.pk/API/api/ds/v1/V-Berth"
    QICT_USER_ID: str = "Test"
    QICT_PASSWORD: str = "Test"
    QICT_CELL_NO: str = "123456"

    # SAPT (South Asia Pakistan Terminal)
    SAPT_HISTORY_URL: str = "https://www.sapt.com.pk/Enquiries/ContainerHistory"
    SAPT_DETAILS_URL: str = "https://www.sapt.com.pk/Enquiries/ContainerDetails"
    SAPT_VESSEL_URL: str = "https://www.sapt.com.pk/Enquiries/VesselSchedule"

    # Scraper Performance Settings
    REQUEST_TIMEOUT: int = 30
    CONNECTION_TIMEOUT: int = 10
    CACHE_TTL: int = 300  # 5 minutes

    # Connection Pool
    SCRAPER_MAX_KEEPALIVE: int = 50
    SCRAPER_MAX_CONNECTIONS: int = 100
    SCRAPER_KEEPALIVE_EXPIRY: int = 30

    # User Agent (Important for some terminals)
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0"
    SCRAPER_ACCEPT_LANGUAGE: str = "en-US,en;q=0.9"

    # SSL Certificate Bundle (for corporate proxies)
    SCRAPER_CA_BUNDLE: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    s = Settings()
    # Fail fast if critical secrets are missing in production
    if not s.DEBUG:
        if not s.SECRET_KEY:
            raise RuntimeError("SECRET_KEY must be set in production (via env or .env)")
        if not s.INTERNAL_SECRET:
            raise RuntimeError("INTERNAL_SECRET must be set in production (via env or .env)")
    return s


settings = get_settings()
