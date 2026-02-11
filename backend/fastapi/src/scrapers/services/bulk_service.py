"""
Bulk Container Tracking Service

This module provides functionality for tracking multiple containers concurrently
across all supported terminals.

Tool 446 - Seaport Terminal Container Activity Tracker
"""

import asyncio
import time
from typing import List, Optional

from src.scrapers.core.models import (
    AllInOneTrackingRequest,
    AllInOneTrackingResponse,
    BulkContainerResult,
    BulkTrackingRequest,
    BulkTrackingResponse,
    ContainerTrackResult,
)
from src.scrapers.terminals import DEFAULT_TERMINALS, TERMINAL_SCRAPERS


async def track_single_container_bulk(
    container_no: str,
    terminals: List[str],
    semaphore: asyncio.Semaphore
) -> BulkContainerResult:
    """
    Track a single container across specified terminals with concurrency control.

    Args:
        container_no: Container number to track
        terminals: List of terminal names to search
        semaphore: Asyncio semaphore for concurrency control

    Returns:
        BulkContainerResult with tracking results
    """
    start_time = time.time()
    results: List[ContainerTrackResult] = []
    terminals_searched: List[str] = []
    error_message: Optional[str] = None

    try:
        # Try each terminal until we find the container or exhaust all terminals
        for terminal in terminals:
            if terminal not in TERMINAL_SCRAPERS:
                continue

            async with semaphore:  # Control concurrency
                try:
                    scraper_func = TERMINAL_SCRAPERS[terminal]
                    terminal_results = await scraper_func(container_no)
                    terminals_searched.append(terminal)

                    if terminal_results and any(result.container_no for result in terminal_results):
                        results.extend(terminal_results)
                        break  # Found container, no need to search other terminals

                except Exception:
                    # Log error but continue to next terminal
                    terminals_searched.append(terminal)
                    continue

        search_time = time.time() - start_time
        success = len(results) > 0

        return BulkContainerResult(
            container_no=container_no,
            success=success,
            results=results,
            terminals_searched=terminals_searched,
            error_message=error_message if not success else None,
            search_time=search_time
        )

    except Exception as e:
        search_time = time.time() - start_time
        return BulkContainerResult(
            container_no=container_no,
            success=False,
            results=[],
            terminals_searched=terminals_searched,
            error_message=str(e),
            search_time=search_time
        )


async def track_containers_bulk(request: BulkTrackingRequest) -> BulkTrackingResponse:
    """
    Track multiple containers concurrently across specified terminals.

    Args:
        request: BulkTrackingRequest containing containers and options

    Returns:
        BulkTrackingResponse with all tracking results
    """
    start_time = time.time()

    # Validate terminals
    terminals = request.terminals or DEFAULT_TERMINALS
    valid_terminals = [t for t in terminals if t in TERMINAL_SCRAPERS]

    if not valid_terminals:
        return BulkTrackingResponse(
            success=False,
            total_containers=len(request.containers),
            successful_containers=0,
            failed_containers=len(request.containers),
            results=[],
            total_time=0.0,
            summary={}
        )

    # Create semaphore for concurrency control
    semaphore = asyncio.Semaphore(request.max_concurrent)

    # Create tracking tasks for all containers
    tasks = []
    for container_no in request.containers:
        task = track_single_container_bulk(
            container_no=container_no.strip().upper(),
            terminals=valid_terminals,
            semaphore=semaphore
        )
        tasks.append(task)

    # Execute all tracking tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results
    bulk_results: List[BulkContainerResult] = []
    successful_count = 0
    failed_count = 0
    terminal_usage: dict[str, int] = {}

    for result in results:
        if isinstance(result, Exception):
            # Handle exception
            failed_count += 1
            bulk_results.append(BulkContainerResult(
                container_no="UNKNOWN",
                success=False,
                results=[],
                terminals_searched=[],
                error_message=str(result),
                search_time=0.0
            ))
        else:
            bulk_results.append(result)
            if result.success:
                successful_count += 1
            else:
                failed_count += 1

            # Track terminal usage
            for terminal in result.terminals_searched:
                terminal_usage[terminal] = terminal_usage.get(terminal, 0) + 1

    total_time = time.time() - start_time

    return BulkTrackingResponse(
        success=successful_count > 0,
        total_containers=len(request.containers),
        successful_containers=successful_count,
        failed_containers=failed_count,
        results=bulk_results,
        total_time=total_time,
        summary=terminal_usage
    )


async def track_containers_by_terminal_bulk(
    containers: List[str],
    terminal: str,
    max_concurrent: int = 10
) -> List[BulkContainerResult]:
    """
    Track multiple containers on a specific terminal concurrently.

    Args:
        containers: List of container numbers
        terminal: Terminal name to search
        max_concurrent: Maximum concurrent requests

    Returns:
        List of BulkContainerResult for each container
    """
    if terminal not in TERMINAL_SCRAPERS:
        return [
            BulkContainerResult(
                container_no=container,
                success=False,
                results=[],
                terminals_searched=[],
                error_message=f"Terminal {terminal} not supported"
            )
            for container in containers
        ]

    semaphore = asyncio.Semaphore(max_concurrent)
    scraper_func = TERMINAL_SCRAPERS[terminal]

    async def track_single(container_no: str) -> BulkContainerResult:
        start_time = time.time()
        try:
            async with semaphore:
                results = await scraper_func(container_no.strip().upper())
                search_time = time.time() - start_time

                return BulkContainerResult(
                    container_no=container_no,
                    success=bool(results),
                    results=results,
                    terminals_searched=[terminal],
                    search_time=search_time
                )
        except Exception as e:
            search_time = time.time() - start_time
            return BulkContainerResult(
                container_no=container_no,
                success=False,
                results=[],
                terminals_searched=[terminal],
                error_message=str(e),
                search_time=search_time
            )

    tasks = [track_single(container) for container in containers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle exceptions in results
    final_results: List[BulkContainerResult] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            final_results.append(BulkContainerResult(
                container_no=containers[i],
                success=False,
                results=[],
                terminals_searched=[terminal],
                error_message=str(result)
            ))
        else:
            final_results.append(result)

    return final_results


async def track_containers_allinone(request: AllInOneTrackingRequest) -> AllInOneTrackingResponse:
    """
    Track containers organized by terminal, removing duplicates and processing efficiently.

    Args:
        request: AllInOneTrackingRequest with containers mapped to terminals

    Returns:
        AllInOneTrackingResponse with organized tracking results
    """
    start_time = time.time()

    # Organize containers by terminal and remove duplicates
    terminal_containers: dict[str, List[str]] = {}
    seen_containers: set[str] = set()
    duplicates_count = 0

    for container_no, terminal in request.containers.items():
        container_clean = container_no.strip().upper()
        terminal_clean = terminal.strip().upper()

        # Check if container is duplicate
        if container_clean in seen_containers:
            duplicates_count += 1
            continue

        seen_containers.add(container_clean)

        # Validate terminal
        if terminal_clean not in TERMINAL_SCRAPERS:
            continue

        if terminal_clean not in terminal_containers:
            terminal_containers[terminal_clean] = []
        terminal_containers[terminal_clean].append(container_clean)

    # Create concurrent tracking tasks for each terminal
    terminal_tasks = []
    for terminal, containers in terminal_containers.items():
        if containers:
            task = track_containers_by_terminal_bulk(
                containers=containers,
                terminal=terminal,
                max_concurrent=request.max_concurrent
            )
            terminal_tasks.append((terminal, task))

    # Execute all terminal tasks concurrently
    all_results: List[BulkContainerResult] = []
    if terminal_tasks:
        task_results = await asyncio.gather(
            *[task for _, task in terminal_tasks],
            return_exceptions=True
        )

        # Process results from each terminal
        for i, result in enumerate(task_results):
            terminal = terminal_tasks[i][0]
            if isinstance(result, Exception):
                # Handle terminal-level failures
                for container in terminal_containers[terminal]:
                    all_results.append(BulkContainerResult(
                        container_no=container,
                        success=False,
                        results=[],
                        terminals_searched=[terminal],
                        error_message=f"Terminal {terminal} failed: {str(result)}"
                    ))
            else:
                all_results.extend(result)

    # Calculate statistics
    total_time = time.time() - start_time
    successful_count = sum(1 for r in all_results if r.success)
    failed_count = len(all_results) - successful_count

    # Create terminal summary
    terminal_summary = {
        terminal: len(containers)
        for terminal, containers in terminal_containers.items()
    }

    return AllInOneTrackingResponse(
        success=successful_count > 0,
        total_containers=len(seen_containers),
        successful_containers=successful_count,
        failed_containers=failed_count,
        duplicates_removed=duplicates_count,
        results=all_results,
        total_time=total_time,
        terminal_summary=terminal_summary
    )
