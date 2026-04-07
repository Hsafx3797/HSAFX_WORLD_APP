"""
Tests for Engine API — POST /execute/{engine_name} and GET /engines.
"""

import os

# Set INTERNAL_API_SECRET before any app module is imported
os.environ["INTERNAL_API_SECRET"] = "test-engine-secret"

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def engine_client():
    """Create a test client with INTERNAL_API_SECRET set."""
    os.environ["INTERNAL_API_SECRET"] = "test-engine-secret"
    # Re-import to pick up the env var
    from src.api import engine as engine_module
    engine_module.INTERNAL_SECRET = "test-engine-secret"

    from src.main import create_app
    app = create_app()
    return TestClient(app)


@pytest.fixture
def engine_headers():
    """Auth headers for engine endpoints."""
    return {
        "X-Internal-Secret": "test-engine-secret",
    }


class TestListEngines:
    """Test GET /engines"""

    def test_list_engines_returns_8(self, engine_client, engine_headers):
        response = engine_client.get("/engines", headers=engine_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8
        names = [e["name"] for e in data]
        assert sorted(names) == sorted([
            "image", "video", "audio", "pdf",
            "document", "archive", "file", "font",
        ])

    def test_list_engines_has_operations(self, engine_client, engine_headers):
        response = engine_client.get("/engines", headers=engine_headers)
        data = response.json()
        for engine in data:
            assert "operations" in engine
            assert "operationCount" in engine
            assert len(engine["operations"]) == engine["operationCount"]
            assert engine["operationCount"] > 0

    def test_list_engines_requires_auth(self, engine_client):
        response = engine_client.get("/engines")
        assert response.status_code == 422  # missing required header

    def test_list_engines_rejects_bad_secret(self, engine_client):
        response = engine_client.get(
            "/engines",
            headers={"X-Internal-Secret": "wrong-secret"},
        )
        assert response.status_code == 401


class TestExecuteEngineValidation:
    """Test POST /execute/{engine_name} validation"""

    def test_unknown_engine_returns_404(self, engine_client, engine_headers):
        response = engine_client.post(
            "/execute/nonexistent",
            json={"jobId": "job_1", "input": {}, "options": {"operation": "foo"}},
            headers=engine_headers,
        )
        assert response.status_code == 404
        assert "Unknown engine" in response.json()["detail"]

    def test_missing_operation_returns_400(self, engine_client, engine_headers):
        response = engine_client.post(
            "/execute/image",
            json={"jobId": "job_1", "input": {}, "options": {}},
            headers=engine_headers,
        )
        assert response.status_code == 400
        assert "Missing 'operation'" in response.json()["detail"]

    def test_invalid_operation_returns_400(self, engine_client, engine_headers):
        response = engine_client.post(
            "/execute/image",
            json={"jobId": "job_1", "input": {}, "options": {"operation": "nope"}},
            headers=engine_headers,
        )
        assert response.status_code == 400
        assert "Invalid operation" in response.json()["detail"]

    def test_requires_auth(self, engine_client):
        response = engine_client.post(
            "/execute/image",
            json={"jobId": "job_1", "input": {}, "options": {"operation": "resize"}},
        )
        assert response.status_code == 422

    def test_rejects_bad_secret(self, engine_client):
        response = engine_client.post(
            "/execute/image",
            json={"jobId": "job_1", "input": {}, "options": {"operation": "resize"}},
            headers={"X-Internal-Secret": "wrong"},
        )
        assert response.status_code == 401


class TestExecuteEngineAcceptance:
    """Test POST /execute/{engine_name} returns 202 for valid requests"""

    @pytest.mark.parametrize("engine,operation", [
        ("image", "resize"),
        ("video", "convert"),
        ("audio", "convert"),
        ("pdf", "merge"),
        ("document", "docx-to-pdf"),
        ("archive", "zip"),
        ("file", "bulk-rename"),
        ("font", "to-woff2"),
    ])
    def test_valid_request_returns_202(
        self, engine_client, engine_headers, engine, operation
    ):
        response = engine_client.post(
            f"/execute/{engine}",
            json={
                "jobId": f"job_test_{engine}",
                "input": {"fileUrl": "https://example.com/test.bin"},
                "options": {"operation": operation},
            },
            headers=engine_headers,
        )
        assert response.status_code == 202
        data = response.json()
        assert data["accepted"] is True
        assert data["engine"] == engine
        assert data["operation"] == operation
        assert data["jobId"] == f"job_test_{engine}"


class TestOperationToSlugMapping:
    """Verify operation → legacy tool slug resolution"""

    def test_image_resize_maps_to_image_resize(self):
        from src.api.engine import _OPERATION_TO_SLUG
        assert _OPERATION_TO_SLUG["image"]["resize"] == "image-resize"

    def test_archive_zip_maps_to_zip_tool(self):
        from src.api.engine import _OPERATION_TO_SLUG
        assert _OPERATION_TO_SLUG["archive"]["zip"] == "zip-tool"

    def test_font_to_woff2_maps_to_font_to_woff2(self):
        from src.api.engine import _OPERATION_TO_SLUG
        assert _OPERATION_TO_SLUG["font"]["to-woff2"] == "font-to-woff2"

    def test_all_operations_have_slug_mapping(self):
        from src.api.engine import ENGINE_OPERATIONS, _OPERATION_TO_SLUG
        for engine, operations in ENGINE_OPERATIONS.items():
            slug_map = _OPERATION_TO_SLUG.get(engine, {})
            for op in operations:
                assert op in slug_map, (
                    f"Operation '{op}' in engine '{engine}' has no slug mapping"
                )
