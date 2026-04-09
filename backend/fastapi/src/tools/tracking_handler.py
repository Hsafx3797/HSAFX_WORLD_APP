"""
Tracking Engine Handler — Container and vessel tracking via terminal scraping.

Engine #29 in the B2B engine system.
Wraps the existing scraper infrastructure as a standard engine handler.

Operations:
  container-track   — Track a single container across terminals
  vessel-schedule   — Get vessel schedule from a terminal
  bulk-track        — Track multiple containers concurrently
  allinone-track    — Track containers with pre-assigned terminals
  list-terminals    — List supported terminals and capabilities
"""

from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class TrackingHandler:
    """Engine handler for container/vessel tracking (engine #29)."""

    async def convert(
        self,
        tool_slug: str,
        *,
        input_data: Any = None,
        options: dict[str, Any] | None = None,
        **kw: Any,
    ) -> dict[str, Any]:
        """Dispatch tracking operations via tool_slug."""
        opts = options or {}
        handler = getattr(self, f"_handle_{tool_slug.replace('-', '_')}", None)
        if not handler:
            return {"success": False, "error": f"Unknown tracking operation: {tool_slug}"}

        try:
            return await handler(input_data=input_data, opts=opts)
        except Exception as e:
            logger.exception("Tracking operation %s failed", tool_slug)
            return {"success": False, "error": str(e)}

    # ── Container Track ────────────────────────────────────────

    async def _handle_container_track(
        self, *, input_data: Any, opts: dict[str, Any]
    ) -> dict[str, Any]:
        """Track a single container across terminals."""
        from src.scrapers.services.cache_service import get_container, put_container
        from src.scrapers.terminals import (
            DEFAULT_TERMINALS,
            TERMINAL_SCRAPERS,
            get_supported_terminals,
            is_terminal_supported,
        )

        # Extract container number
        if isinstance(input_data, str):
            container_no = input_data.strip().upper()
        elif isinstance(input_data, dict):
            container_no = (
                input_data.get("container_no")
                or input_data.get("containerNo")
                or input_data.get("input", "")
            )
            container_no = str(container_no).strip().upper()
        else:
            return {"success": False, "error": "Input must be a container number string or {container_no: '...'}"}

        if not container_no:
            return {"success": False, "error": "Container number is required"}

        terminal = opts.get("terminal")
        nocache = opts.get("nocache", False)
        start_time = time.time()
        terminals_searched: list[str] = []

        if terminal:
            terminal = terminal.strip().upper()
            if not is_terminal_supported(terminal):
                return {
                    "success": False,
                    "error": f"Invalid terminal: {terminal}. Valid: {', '.join(get_supported_terminals())}",
                }

        # Check cache first
        if not nocache and terminal:
            cached = await get_container(terminal, container_no)
            if cached is not None:
                return {
                    "success": True,
                    "output": {
                        "results": [r.model_dump(mode="json") for r in cached],
                        "terminals_searched": [terminal],
                        "search_time": time.time() - start_time,
                        "cached": True,
                    },
                }

        results = []
        terminals_to_search = [terminal] if terminal else DEFAULT_TERMINALS

        for term in terminals_to_search:
            if not nocache:
                cached = await get_container(term, container_no)
                if cached is not None:
                    results.extend(cached)
                    terminals_searched.append(term)
                    break

            try:
                scraper_func = TERMINAL_SCRAPERS.get(term)
                if not scraper_func:
                    continue

                terminal_results = await scraper_func(container_no)
                terminals_searched.append(term)

                if terminal_results and any(r.container_no for r in terminal_results):
                    results.extend(terminal_results)
                    if not nocache:
                        await put_container(term, container_no, terminal_results)
                    break
            except Exception as e:
                logger.warning("Terminal scraper failed", extra={"terminal": term, "error": str(e)})
                terminals_searched.append(term)
                continue

        search_time = time.time() - start_time
        return {
            "success": len(results) > 0,
            "output": {
                "results": [r.model_dump(mode="json") for r in results],
                "terminals_searched": terminals_searched,
                "search_time": round(search_time, 3),
                "cached": False,
            },
        }

    # ── Vessel Schedule ────────────────────────────────────────

    async def _handle_vessel_schedule(
        self, *, input_data: Any, opts: dict[str, Any]
    ) -> dict[str, Any]:
        """Get vessel schedule from a terminal."""
        from src.scrapers.services.cache_service import get_vessel, put_vessel
        from src.scrapers.terminals import VESSEL_SCRAPERS

        # Extract vessel name
        if isinstance(input_data, str):
            vessel_name = input_data.strip().upper()
        elif isinstance(input_data, dict):
            vessel_name = (
                input_data.get("vessel_name")
                or input_data.get("vesselName")
                or input_data.get("input", "")
            )
            vessel_name = str(vessel_name).strip().upper()
        else:
            return {"success": False, "error": "Input must be a vessel name string or {vessel_name: '...'}"}

        if not vessel_name:
            return {"success": False, "error": "Vessel name is required"}

        terminal = opts.get("terminal", "QICT").strip().upper()
        nocache = opts.get("nocache", False)
        start_time = time.time()

        if terminal not in VESSEL_SCRAPERS:
            return {
                "success": False,
                "error": f"Terminal {terminal} doesn't support vessel schedules. Available: {', '.join(VESSEL_SCRAPERS.keys())}",
            }

        # Check cache
        cache_key = f"{terminal}:{vessel_name}".lower()
        if not nocache:
            cached = await get_vessel(cache_key)
            if cached is not None:
                return {
                    "success": True,
                    "output": {
                        "results": [r.model_dump(mode="json") for r in cached],
                        "terminal": terminal,
                        "search_time": time.time() - start_time,
                        "cached": True,
                    },
                }

        try:
            scraper_func = VESSEL_SCRAPERS[terminal]
            results = await scraper_func(vessel_name)

            if not nocache and results:
                await put_vessel(cache_key, results)

            search_time = time.time() - start_time
            return {
                "success": len(results) > 0,
                "output": {
                    "results": [r.model_dump(mode="json") for r in results],
                    "terminal": terminal,
                    "search_time": round(search_time, 3),
                    "cached": False,
                },
            }
        except Exception as e:
            logger.error("Vessel schedule fetch failed", extra={"terminal": terminal, "error": str(e)})
            return {"success": False, "error": f"Failed to fetch vessel schedule: {str(e)}"}

    # ── Bulk Track ─────────────────────────────────────────────

    async def _handle_bulk_track(
        self, *, input_data: Any, opts: dict[str, Any]
    ) -> dict[str, Any]:
        """Track multiple containers concurrently."""
        from src.scrapers.core.models import BulkTrackingRequest
        from src.scrapers.services.bulk_service import track_containers_bulk

        # Extract container list
        if isinstance(input_data, list):
            containers = input_data
        elif isinstance(input_data, dict):
            containers = (
                input_data.get("containers")
                or input_data.get("container_numbers")
                or []
            )
        else:
            return {"success": False, "error": "Input must be a list of container numbers or {containers: [...]}"}

        if not containers:
            return {"success": False, "error": "At least one container number is required"}

        if len(containers) > 20:
            return {"success": False, "error": "Maximum 20 containers per bulk request"}

        terminals = opts.get("terminals")
        max_concurrent = opts.get("max_concurrent", 5)

        request = BulkTrackingRequest(
            containers=containers,
            terminals=terminals,
            max_concurrent=max_concurrent,
        )

        response = await track_containers_bulk(request)
        return {
            "success": response.success,
            "output": response.model_dump(mode="json"),
        }

    # ── All-In-One Track ───────────────────────────────────────

    async def _handle_allinone_track(
        self, *, input_data: Any, opts: dict[str, Any]
    ) -> dict[str, Any]:
        """Track containers with pre-assigned terminals."""
        from src.scrapers.core.models import AllInOneTrackingRequest
        from src.scrapers.services.bulk_service import track_containers_allinone

        # Extract container→terminal mapping
        if isinstance(input_data, dict):
            containers = input_data.get("containers", input_data)
        else:
            return {
                "success": False,
                "error": "Input must be a dict mapping container numbers to terminal names: {containers: {'ABCD1234567': 'KICT', ...}}",
            }

        if not containers:
            return {"success": False, "error": "At least one container is required"}

        if len(containers) > 200:
            return {"success": False, "error": "Maximum 200 containers per all-in-one request"}

        max_concurrent = opts.get("max_concurrent", 10)

        request = AllInOneTrackingRequest(
            containers=containers,
            max_concurrent=max_concurrent,
        )

        response = await track_containers_allinone(request)
        return {
            "success": response.success,
            "output": response.model_dump(mode="json"),
        }

    # ── List Terminals ─────────────────────────────────────────

    async def _handle_list_terminals(
        self, *, input_data: Any, opts: dict[str, Any]
    ) -> dict[str, Any]:
        """List all supported terminals and capabilities."""
        from src.scrapers.terminals import (
            DEFAULT_TERMINALS,
            VESSEL_SCRAPERS,
            get_supported_terminals,
        )

        return {
            "success": True,
            "output": {
                "terminals": get_supported_terminals(),
                "default_terminals": DEFAULT_TERMINALS,
                "vessel_schedule_terminals": list(VESSEL_SCRAPERS.keys()),
            },
        }
