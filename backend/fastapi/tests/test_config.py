"""
Tests for FastAPI — config settings.
"""

import pytest


class TestSettings:
    """Test application settings and defaults."""

    def test_default_settings_loaded(self):
        from src.core.config import Settings
        settings = Settings()
        assert settings.APP_NAME == "HSAFX World App"
        assert settings.VERSION == "1.0.0"
        assert settings.HOST == "0.0.0.0"
        assert settings.PORT == 8000

    def test_debug_default_false(self):
        from src.core.config import Settings
        settings = Settings()
        assert settings.DEBUG is False

    def test_cors_origins_default(self):
        from src.core.config import Settings
        settings = Settings()
        assert "http://localhost:3000" in settings.CORS_ORIGINS
        assert "https://hsafx.world" in settings.CORS_ORIGINS

    def test_rate_limits_default(self):
        from src.core.config import Settings
        settings = Settings()
        assert settings.RATE_LIMIT_FREE == 60
        assert settings.RATE_LIMIT_PRO == 300
        assert settings.RATE_LIMIT_ADVANCE == 1000

    def test_settings_from_env(self, monkeypatch):
        monkeypatch.setenv("DEBUG", "true")
        monkeypatch.setenv("SECRET_KEY", "my-secret")
        monkeypatch.setenv("PORT", "9000")

        from src.core.config import Settings
        settings = Settings()
        assert settings.DEBUG is True
        assert settings.SECRET_KEY == "my-secret"
        assert settings.PORT == 9000

    def test_terminal_settings(self):
        from src.core.config import Settings
        settings = Settings()
        assert "QICT" in settings.TERMINALS_ENABLED
        assert "KICT" in settings.TERMINALS_ENABLED
        assert settings.REQUEST_TIMEOUT == 30
        assert settings.CACHE_TTL == 300
