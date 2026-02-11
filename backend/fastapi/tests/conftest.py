"""
Shared test fixtures for HSAFX World App FastAPI backend.
"""

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
        "X-Internal-Secret": "internal-secret-change-me",
        "X-User-Id": "test-user-123",
        "X-User-Plan": "pro",
    }


@pytest.fixture
def mock_settings(monkeypatch):
    """Override settings for testing."""
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
    monkeypatch.setenv("INTERNAL_SECRET", "internal-secret-change-me")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/15")
    monkeypatch.setenv("SENTRY_DSN", "")
