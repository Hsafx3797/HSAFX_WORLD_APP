"""
Tests for FastAPI — health endpoint, app creation, config.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Test application health and root endpoints."""

    def test_health_check(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_root_endpoint(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "HSAFX World App API"
        assert "version" in data


class TestAppCreation:
    """Test create_app factory."""

    def test_app_has_routes(self, app):
        routes = [r.path for r in app.routes]
        assert "/health" in routes
        assert "/" in routes

    def test_cors_middleware_present(self, app):
        middleware_classes = [m.cls.__name__ for m in app.user_middleware]
        assert "CORSMiddleware" in middleware_classes
