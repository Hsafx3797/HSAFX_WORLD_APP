"""
Tests for tool executor — tool ID routing and supported tools registry.
"""

import pytest
from src.tools.executor import (
    IMAGE_TOOLS,
    VIDEO_TOOLS,
    AUDIO_TOOLS,
    DOCUMENT_TOOLS,
    PDF_TOOLS,
    ARCHIVE_TOOLS,
    FILE_TOOLS,
    FONT_TOOLS,
    PYTHON_TOOLS,
    get_supported_tools,
)


class TestToolSets:
    """Verify tool ID sets are well-formed."""

    def test_image_tools_not_empty(self):
        assert len(IMAGE_TOOLS) > 10

    def test_video_tools_not_empty(self):
        assert len(VIDEO_TOOLS) >= 4

    def test_audio_tools_not_empty(self):
        assert len(AUDIO_TOOLS) >= 2

    def test_document_tools_not_empty(self):
        assert len(DOCUMENT_TOOLS) >= 15

    def test_pdf_tools_not_empty(self):
        assert len(PDF_TOOLS) >= 20

    def test_archive_tools_not_empty(self):
        assert len(ARCHIVE_TOOLS) == 8

    def test_file_tools_not_empty(self):
        assert len(FILE_TOOLS) >= 4

    def test_font_tools_not_empty(self):
        assert len(FONT_TOOLS) == 4

    def test_python_tools_not_empty(self):
        assert len(PYTHON_TOOLS) >= 10

    def test_no_duplicate_tool_ids_across_sets(self):
        all_sets = [
            IMAGE_TOOLS, VIDEO_TOOLS, AUDIO_TOOLS,
            DOCUMENT_TOOLS, PDF_TOOLS, ARCHIVE_TOOLS,
            FILE_TOOLS, FONT_TOOLS, PYTHON_TOOLS,
        ]
        all_ids = []
        for s in all_sets:
            all_ids.extend(s)
        assert len(all_ids) == len(set(all_ids)), "Duplicate tool IDs found across sets"

    def test_tool_ids_are_kebab_case(self):
        """All tool IDs should be lowercase kebab-case."""
        all_sets = [
            IMAGE_TOOLS, VIDEO_TOOLS, AUDIO_TOOLS,
            DOCUMENT_TOOLS, PDF_TOOLS, ARCHIVE_TOOLS,
            FILE_TOOLS, FONT_TOOLS, PYTHON_TOOLS,
        ]
        for tool_set in all_sets:
            for tool_id in tool_set:
                assert tool_id == tool_id.lower(), f"{tool_id} is not lowercase"
                assert " " not in tool_id, f"{tool_id} contains spaces"
                assert "_" not in tool_id or tool_id.endswith("_2"), f"{tool_id} contains underscores"


class TestGetSupportedTools:
    """Test the get_supported_tools() registry function."""

    def test_returns_dict(self):
        result = get_supported_tools()
        assert isinstance(result, dict)

    def test_has_all_categories(self):
        result = get_supported_tools()
        expected = ["image", "video", "audio", "document", "pdf", "archive", "file", "font", "python"]
        for cat in expected:
            assert cat in result, f"Missing category: {cat}"

    def test_lists_are_sorted(self):
        result = get_supported_tools()
        for cat, tools in result.items():
            assert tools == sorted(tools), f"Category '{cat}' tools are not sorted"

    def test_total_tool_count(self):
        result = get_supported_tools()
        total = sum(len(tools) for tools in result.values())
        assert total >= 100, f"Expected 100+ server-side tools, got {total}"

    def test_known_tools_present(self):
        result = get_supported_tools()
        assert "image-resize" in result["image"]
        assert "pdf-merge" in result["pdf"]
        assert "zip-tool" in result["archive"]
        assert "video-convert" in result["video"]
