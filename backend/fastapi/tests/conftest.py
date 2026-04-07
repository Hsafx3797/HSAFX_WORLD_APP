"""
Shared test fixtures for HSAFX World App FastAPI backend.
"""

import os
import secrets

# Set required secrets BEFORE any app module is imported.
# The config module validates at import time (fail-fast in production).
_test_secret = secrets.token_hex(32)
_test_internal = secrets.token_hex(32)
os.environ.setdefault("SECRET_KEY", _test_secret)
os.environ.setdefault("INTERNAL_SECRET", _test_internal)

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app():
    """Create a fresh FastAPI app instance for testing."""
    from src.main import create_app
    return create_app()


@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Provide internal auth headers for protected endpoints."""
    return {
        "X-Internal-Secret": os.environ.get("INTERNAL_SECRET", _test_internal),
        "X-User-Id": "test-user-123",
        "X-User-Plan": "pro",
    }


@pytest.fixture
def mock_settings(monkeypatch):
    """Override settings for testing."""
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("SECRET_KEY", _test_secret)
    monkeypatch.setenv("INTERNAL_SECRET", _test_internal)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/15")
    monkeypatch.setenv("SENTRY_DSN", "")
