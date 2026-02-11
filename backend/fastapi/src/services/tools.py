"""
Tool Service — Compute-Only

Stateless tool execution and validation. No database access.
Catalog operations (list_tools, get_tool_by_slug) have been removed
per the Backend Ownership Matrix — Next.js owns the tool catalog via tRPC.
"""

import asyncio
from typing import Any, Optional

import structlog

from src.core.config import settings

logger = structlog.get_logger()


class ToolService:
    """Stateless service for tool execution and input validation"""

    async def execute_tool(
        self,
        tool_slug: str,
        input_data: dict,
        user_id: Optional[str] = None,
        user_tier: str = "free",
    ) -> dict:
        """Execute a tool (pure compute, no DB)"""
        from src.tools.executor import execute_tool

        try:
            result = await asyncio.wait_for(
                execute_tool(tool_slug, input_data),
                timeout=settings.TOOL_TIMEOUT_SECONDS,
            )
            return result
        except asyncio.TimeoutError:
            logger.error("Tool execution timeout", tool=tool_slug)
            return {"success": False, "error": "Tool execution timed out"}
        except Exception as e:
            logger.error("Tool execution error", tool=tool_slug, error=str(e))
            return {
                "success": False,
                "error": str(e) if settings.DEBUG else "Tool execution failed",
            }

    def validate_input(self, input_schema: dict, input_data: dict) -> dict:
        """Validate input against a JSON Schema-like spec (stateless)"""
        errors = []

        required = input_schema.get("required", [])
        properties = input_schema.get("properties", {})

        for field in required:
            if field not in input_data or input_data[field] is None:
                errors.append({"field": field, "message": f"Required field '{field}' is missing"})

        for field, value in input_data.items():
            if field in properties:
                schema = properties[field]
                expected_type = schema.get("type")

                if expected_type and not self._check_type(value, expected_type):
                    errors.append({"field": field, "message": f"Expected type '{expected_type}'"})

                if expected_type == "string":
                    if schema.get("minLength") and len(str(value)) < schema["minLength"]:
                        errors.append({"field": field, "message": f"String must be at least {schema['minLength']} characters"})
                    if schema.get("maxLength") and len(str(value)) > schema["maxLength"]:
                        errors.append({"field": field, "message": f"String must be at most {schema['maxLength']} characters"})

                if expected_type == "number":
                    if schema.get("minimum") is not None and value < schema["minimum"]:
                        errors.append({"field": field, "message": f"Value must be at least {schema['minimum']}"})
                    if schema.get("maximum") is not None and value > schema["maximum"]:
                        errors.append({"field": field, "message": f"Value must be at most {schema['maximum']}"})

                if schema.get("enum") and value not in schema["enum"]:
                    errors.append({"field": field, "message": f"Value must be one of: {', '.join(map(str, schema['enum']))}"})

        return {"valid": len(errors) == 0, "errors": errors}

    def _check_type(self, value: Any, expected_type: str) -> bool:
        """Check if value matches expected type"""
        type_map = {
            "string": str,
            "number": (int, float),
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        expected = type_map.get(expected_type)
        if expected is None:
            return True
        return isinstance(value, expected)
