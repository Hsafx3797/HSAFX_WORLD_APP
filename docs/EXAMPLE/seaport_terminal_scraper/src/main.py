import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
import time

import httpx
from fastapi import FastAPI, HTTPException, Query, Body, Response, Request
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from aiolimiter import AsyncLimiter
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
# SlowAPI (inbound rate limiting)
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sentry_sdk import init as sentry_init
from sentry_sdk.integrations.fastapi import FastApiIntegration
# High-perf JSON and compression
try:
	from fastapi.responses import ORJSONResponse as _DefaultResponseClass
except Exception:
	from fastapi import Response as _DefaultResponseClass  # fallback
from starlette.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
import structlog
from src.core.errors import (
	APIError,
	ValidationError,
	ContainerNotFoundError,
	VesselNotFoundError,
	TerminalError,
	RateLimitError,
	AuthenticationError,
	create_error_response,
	create_success_response,
	validate_container_number,
	validate_terminal,
	validate_vessel_name,
)
from src.terminals.pakistan import (
	kgtl_track_container_html,
	kgtl_fetch_vessel_html,
	sapt_track_container_html,
	kict_track_container_html,
	qict_track_container,
	qict_fetch_vessel_schedules,
)
from src.core.models import (
	VesselSchedule,
	ContainerTrackResult,
	BulkTrackingRequest,
	BulkContainerResult,
	BulkTrackingResponse,
	AllInOneTrackingRequest,
	AllInOneTrackingResponse,
)
from src.core.utils import (
	parse_dt as _parse_dt,
	status_from_ata_atd as _status_from_ata_atd,
	req_timeout as _req_timeout,
	default_upstream_headers as _default_upstream_headers,
	req_id_var as _shared_req_id_var,
)
from src.core.connection_pool import close_all_clients
from src.services.bulk_service import (
	track_containers_bulk,
	track_containers_by_terminal_bulk,
	track_containers_allinone,
)
from src.services import cache_service, terminal_service
from src.api.schemas import ApiListResponse, ApiContainerListResponse
from src.api.dependencies import require_api_key, require_admin_key, get_rate_limit as _get_limit
from fastapi.openapi.utils import get_openapi
from contextvars import ContextVar

# Response models moved to src/api/schemas.py
CONTAINER_RE = r"^[A-Z]{4}\d{7}$"

# Load environment from project root .env
load_dotenv(".env", override=True)

app = FastAPI(
	title="FreightForwarder Tracking API (Minimal)",
	version="0.1.0",
	default_response_class=_DefaultResponseClass,
)
app.state.started_at = time.time()

# Optional Sentry initialization (if DSN is set)
try:
	_SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
	if _SENTRY_DSN:
		_sentry_env = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "local"))
		_sentry_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
		_sentry_replays_rate = float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.0"))
		sentry_init(
			dsn=_SENTRY_DSN,
			integrations=[FastApiIntegration()],
			traces_sample_rate=_sentry_rate,
			environment=_sentry_env,
			release=os.getenv("APP_VERSION", app.version),
		)
except Exception:
	# Sentry is optional; do not fail app startup
	pass

# Cache moved to src/services/cache_service.py

_QICT_RPM = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
_QICT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

# Inbound rate limiter (per client IP)
limiter = Limiter(key_func=get_remote_address, headers_enabled=True, enabled=True)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def _rl_handler(request, exc: RateLimitExceeded):
	return create_error_response(
		RateLimitError(f"Rate limit exceeded: {exc.detail}", reset_time=exc.retry_after),
		request
	)

# CORS for local UI
_origins_env = os.getenv("ALLOW_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
_allow_all = "*" in _origins
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"] if _allow_all else _origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=int(os.getenv("GZIP_MIN_SIZE", "1024")))

# ---- Prometheus metrics ----
# Wrap in try-except to handle hot-reload duplicate registration
try:
	REQUEST_COUNT = Counter(
		"ff_api_requests_total",
		"Total HTTP requests",
		["endpoint", "method", "status"],
	)
except ValueError:
	from prometheus_client import REGISTRY
	REQUEST_COUNT = REGISTRY._names_to_collectors.get("ff_api_requests_total")

try:
	REQUEST_LATENCY = Histogram(
		"ff_request_latency_seconds",
		"Request latency in seconds",
		["endpoint", "method"],
	)
except ValueError:
	from prometheus_client import REGISTRY
	REQUEST_LATENCY = REGISTRY._names_to_collectors.get("ff_request_latency_seconds")

try:
	EXCEPTIONS_TOTAL = Counter(
		"ff_exceptions_total",
		"Unhandled exceptions",
		["endpoint", "method"],
	)
except ValueError:
	from prometheus_client import REGISTRY
	EXCEPTIONS_TOTAL = REGISTRY._names_to_collectors.get("ff_exceptions_total")

try:
	QICT_REQUESTS = Counter(
		"ff_qict_requests_total",
		"QICT HTTP requests",
		["op", "method", "status"],
	)
except ValueError:
	from prometheus_client import REGISTRY
	QICT_REQUESTS = REGISTRY._names_to_collectors.get("ff_qict_requests_total")
try:
	QICT_REQUEST_LATENCY = Histogram(
		"ff_qict_request_latency_seconds",
		"QICT HTTP latency seconds",
		["op", "method"],
	)
except ValueError:
	# Metric already registered (hot-reload)
	from prometheus_client import REGISTRY
	QICT_REQUEST_LATENCY = REGISTRY._names_to_collectors.get("ff_qict_request_latency_seconds")

# Upstream (generic) metrics
try:
	UPSTREAM_REQUESTS = Counter(
		"ff_upstream_requests_total",
		"Upstream HTTP requests (provider-agnostic)",
		["provider", "op", "method", "status"],
	)
except ValueError:
	# Metric already registered (hot-reload)
	from prometheus_client import REGISTRY
	UPSTREAM_REQUESTS = REGISTRY._names_to_collectors.get("ff_upstream_requests_total")

try:
	UPSTREAM_LATENCY = Histogram(
		"ff_upstream_request_latency_seconds",
		"Upstream request latency seconds",
		["provider", "op", "method"],
	)
except ValueError:
	# Metric already registered (hot-reload)
	from prometheus_client import REGISTRY
	UPSTREAM_LATENCY = REGISTRY._names_to_collectors.get("ff_upstream_request_latency_seconds")

# Add missing request-scoped correlation variable
_req_id_var: ContextVar[Optional[str]] = ContextVar("_req_id", default=None)

@app.middleware("http")
async def _metrics_and_requestid_middleware(request, call_next):
	req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
	_req_id_var.set(req_id)
	# also set in shared to propagate to scraper headers
	try:
		_shared_req_id_var.set(req_id)
	except Exception:
		pass
	start = time.perf_counter()
	endpoint = request.url.path
	route = request.scope.get("route")
	if route and getattr(route, "path", None):
		endpoint = route.path  # use path template to avoid high-cardinality
	method = request.method.upper()
	# Optional structured request logs
	_log_req = os.getenv("LOG_REQUESTS", "false").lower() == "true"
	_logger = structlog.get_logger("api").bind(req_id=req_id, method=method, path=endpoint)
	if _log_req:
		_logger.info("request.start")
	try:
		response = await call_next(request)
	except Exception:
		EXCEPTIONS_TOTAL.labels(endpoint=endpoint, method=method).inc()
		if _log_req:
			_logger.exception("request.exception")
		raise
	elapsed = time.perf_counter() - start
	status = getattr(response, "status_code", 500)
	REQUEST_COUNT.labels(endpoint=endpoint, method=method, status=str(status)).inc()
	REQUEST_LATENCY.labels(endpoint=endpoint, method=method).observe(elapsed)
	if _log_req:
		_logger.info("request.end", status=status, elapsed_ms=int(elapsed * 1000))
	response.headers["X-Request-ID"] = req_id
	# Add app version header
	response.headers["X-App-Version"] = os.getenv("APP_VERSION", "0.1.0")
	return response

# Enhanced error handlers with consistent response format
@app.exception_handler(APIError)
async def _api_error_handler(request: Request, exc: APIError):
	return create_error_response(exc, request)

@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError):
	# Extract field name from validation error
	field = None
	if exc.errors():
		first_error = exc.errors()[0]
		if first_error.get("loc"):
			field = str(first_error["loc"][-1])
	
	validation_error = ValidationError(
		"Request validation failed", 
		field=field,
		details={"validation_errors": exc.errors()}
	)
	return create_error_response(validation_error, request)

@app.exception_handler(HTTPException)
async def _http_exception_handler(request: Request, exc: HTTPException):
	# Convert HTTPException to APIError for consistent format
	api_error = APIError(
		message=str(exc.detail) if isinstance(exc.detail, str) else "Request failed",
		code=f"HTTP_{exc.status_code}",
		status_code=exc.status_code
	)
	return create_error_response(api_error, request)

@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
	return create_error_response(exc, request)

# --- API key auth (optional) and ETag helpers ---
try:
	import orjson as _orjson  # for fast ETag hashing
except Exception:
	_orjson = None

# Auth functions moved to src/api/dependencies.py (imported as require_api_key, require_admin_key)

def _to_json_bytes(obj: dict) -> bytes:
	if _orjson:
		return _orjson.dumps(obj, option=getattr(_orjson, "OPT_SORT_KEYS", 0))
	return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")

def _etag_for(obj: dict) -> str:
	import hashlib
	return '"' + hashlib.sha256(_to_json_bytes(obj)).hexdigest() + '"'

def _maybe_304(request: Request, response: Response, payload: dict):
	inm = request.headers.get("if-none-match")
	etag = _etag_for(payload)
	if inm and inm.strip() == etag:
		return Response(status_code=304)
	response.headers["ETag"] = etag
	return None

# Added: attach Cache-Control header (configurable)
def _attach_cache_headers(response: Response):
	response.headers["Cache-Control"] = os.getenv("CACHE_CONTROL", "private, max-age=60, must-revalidate")

# Added: default upstream headers with correlation and UA
def _default_upstream_headers() -> dict:
	req_id = _req_id_var.get()
	# Use a browser-like UA and include language to reduce blocking by ASP.NET sites
	ua = os.getenv(
		"SCRAPER_USER_AGENT",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
	)
	h = {
		"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
		"Accept-Language": os.getenv("SCRAPER_ACCEPT_LANGUAGE", "en-US,en;q=0.9"),
		"User-Agent": ua,
		"Cache-Control": "no-cache",
		"Pragma": "no-cache",
	}
	if req_id:
		h["X-Request-ID"] = req_id
	return h

# ---- Shared HTTP fetch with retry and method fallback ----
_SCRAPER_MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", "3"))
_SCRAPER_RETRY_MIN = float(os.getenv("SCRAPER_RETRY_MIN", "1"))
_SCRAPER_RETRY_MAX = float(os.getenv("SCRAPER_RETRY_MAX", "8"))

def _req_timeout() -> httpx.Timeout:
	return httpx.Timeout(
		float(os.getenv("REQUEST_TIMEOUT", "30")),
		connect=float(os.getenv("CONNECTION_TIMEOUT", "10")),
	)

# Provider-scoped outbound controls (RPS + concurrency)
_UPSTREAM_LIMITERS: dict[str, AsyncLimiter] = {}
_UPSTREAM_SEMAPHORES: dict[str, asyncio.Semaphore] = {}

def _provider_rps(provider: str) -> int:
	p = (provider or "GENERIC").upper()
	# provider-specific override, else default
	return int(os.getenv(f"{p}_RPS", os.getenv("UPSTREAM_RPS", "5")))

def _provider_concurrency(provider: str) -> int:
	p = (provider or "GENERIC").upper()
	return int(os.getenv(f"{p}_CONCURRENCY", os.getenv("UPSTREAM_CONCURRENCY", "5")))

def _get_upstream_controls(provider: str) -> tuple[AsyncLimiter, asyncio.Semaphore]:
	p = (provider or "GENERIC").upper()
	lim = _UPSTREAM_LIMITERS.get(p)
	sem = _UPSTREAM_SEMAPHORES.get(p)
	if lim is None:
		lim = AsyncLimiter(_provider_rps(p), time_period=1)
		_UPSTREAM_LIMITERS[p] = lim
	if sem is None:
		sem = asyncio.Semaphore(_provider_concurrency(p))
		_UPSTREAM_SEMAPHORES[p] = sem
	return lim, sem

@retry(
	stop=stop_after_attempt(_SCRAPER_MAX_RETRIES),
	wait=wait_exponential(multiplier=1, min=_SCRAPER_RETRY_MIN, max=_SCRAPER_RETRY_MAX),
	retry=retry_if_exception_type((httpx.HTTPError, asyncio.TimeoutError)),
	reraise=True,
)
# _fetch_json_list moved to src/services/http_client.py (import as http_client.fetch_json_list)
# _generic_fetch_vessel_schedules, _generic_track_container moved to src/services/terminal_service.py
# _enabled_terminals moved to src/services/terminal_service.py (get_enabled_terminals)

@app.get("/api/track/vessel/{vessel_name}", response_model=ApiListResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_VESSEL", "30/minute"))
async def track_vessel(
	request: Request,
	response: Response,
	vessel_name: str,
	terminal: Optional[str] = Query(default=None, pattern="^(KICT|KGTL|QICT|SAPT)$"),
	nocache: bool = Query(default=False, description="Bypass caches for fresh data"),
	page: int = Query(1, ge=1, description="Page number (1-based)"),
	page_size: int = Query(100, ge=1, le=500, description="Items per page"),
):
	require_api_key(request)
	

	# Enhanced validation using our error handling
	try:
		vessel_name = validate_vessel_name(vessel_name)
	except ValidationError as e:
		raise e
	
	# Validate terminal if provided
	if terminal:
		try:
			terminal = validate_terminal(terminal)
		except ValidationError as e:
			raise e
	
	start = asyncio.get_event_loop().time()
	results: List[VesselSchedule] = []

	# Build targets from query or enabled list
	targets = [terminal] if terminal else terminal_service.get_enabled_terminals()

	# Run terminal fetches in parallel with enhanced error handling
	async def _fetch_for_term(t: str) -> List[VesselSchedule]:
		try:
			if t == "QICT":
				return await _qict_fetch_vessel_schedules(vessel_name, nocache=nocache)
			else:
				return await terminal_service.fetch_vessel_schedules(t, vessel_name, nocache=nocache)
		except Exception as e:
			# Log terminal-specific errors but continue processing other terminals
			logger = structlog.get_logger("api")
			logger.warning("Terminal vessel lookup failed", terminal=t, vessel=vessel_name, error=str(e))
			raise TerminalError(t, str(e))

	tasks = [asyncio.create_task(_fetch_for_term(t)) for t in targets]
	out = await asyncio.gather(*tasks, return_exceptions=True)
	
	failed_terminals = []
	for i, part in enumerate(out):
		if isinstance(part, Exception):
			failed_terminals.append(targets[i])
			continue
		results.extend(part or [])

	searched = targets
	
	# Check if no vessel found
	if not results:
		raise VesselNotFoundError(vessel_name, searched)
	
	elapsed = asyncio.get_event_loop().time() - start
	total = len(results)
	start_idx = (page - 1) * page_size
	end_idx = start_idx + page_size
	results = results[start_idx:end_idx]
	
	meta = {
		"total": total,
		"page": page,
		"page_size": page_size,
		"returned": len(results),
		"attempted_terminals": searched,
		"enabled_terminals": terminal_service.get_enabled_terminals(),
	}
	
	# Add failed terminals info if any
	if failed_terminals:
		meta["failed_terminals"] = failed_terminals
	
	body = ApiListResponse(success=True, results=results, terminals_searched=searched, search_time=round(elapsed, 3), meta=meta)
	# ETag + Cache-Control
	payload = body.model_dump(exclude_none=True)
	cond = _maybe_304(request, response, payload)
	if cond is not None:
		return cond
	_attach_cache_headers(response)
	return body

@app.get("/api/track/container/{container_no}", response_model=ApiContainerListResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_CONTAINER", "60/minute"))
async def track_container(
	request: Request,
	response: Response,
	container_no: str,
	terminal: Optional[str] = Query(default=None, pattern="^(KICT|KGTL|QICT|SAPT)$"),
	include_vessel: bool = Query(default=False, description="If true, enrich results with vessel schedule"),
	nocache: bool = Query(default=False, description="Bypass caches for fresh data"),
	notfound_as_404: bool = Query(default=False, description="If true, return 404 when no meaningful data found"),
	page: int = Query(1, ge=1, description="Page number (1-based)"),
	page_size: int = Query(100, ge=1, le=500, description="Items per page"),
):
	require_api_key(request)
	
	# Enhanced validation using our error handling
	try:
		container_no = validate_container_number(container_no)
	except ValidationError as e:
		raise e
	
	# Validate terminal if provided
	if terminal:
		try:
			terminal = validate_terminal(terminal)
		except ValidationError as e:
			raise e
	
	start = asyncio.get_event_loop().time()
	results: List[ContainerTrackResult] = []

	# Build targets from query or enabled list
	targets = [terminal] if terminal else terminal_service.get_enabled_terminals()

	# Run terminal fetches in parallel
	async def _fetch_for_term(t: str) -> List[ContainerTrackResult]:
		try:
			if t == "QICT":
				return await _qict_track_container(container_no, nocache=nocache)
			else:
				return await terminal_service.track_container(t, container_no, nocache=nocache)
		except Exception as e:
			# Log terminal-specific errors but continue processing other terminals
			logger = structlog.get_logger("api")
			logger.warning("Terminal scraping failed", terminal=t, container=container_no, error=str(e))
			raise TerminalError(t, str(e))

	tasks = [asyncio.create_task(_fetch_for_term(t)) for t in targets]
	out = await asyncio.gather(*tasks, return_exceptions=True)
	
	failed_terminals = []
	for i, part in enumerate(out):
		if isinstance(part, Exception):
			failed_terminals.append(targets[i])
			continue
		results.extend(part or [])

	searched = targets
	# Optional enrichment (QICT schedules only for now)
	if include_vessel and results and ("QICT" in searched):
		try:
			await terminal_service.enrich_with_vessel_info(results, terminal="QICT", nocache=nocache)
		except Exception:
			pass

	# Enhanced 404 handling with better error response
	if notfound_as_404 and (not results or all(not r.vessel_name and not r.container_size_n_type and not r.container_position for r in results)):
		raise ContainerNotFoundError(container_no, searched)

	elapsed = asyncio.get_event_loop().time() - start
	total = len(results)
	start_idx = (page - 1) * page_size
	end_idx = start_idx + page_size
	results = results[start_idx:end_idx]
	
	meta = {
		"total": total,
		"page": page,
		"page_size": page_size,
		"returned": len(results),
		"attempted_terminals": searched,
		"enabled_terminals": terminal_service.get_enabled_terminals(),
	} if total > 1 else {
		"attempted_terminals": searched,
		"enabled_terminals": terminal_service.get_enabled_terminals(),
	}
	
	# Add failed terminals info if any
	if failed_terminals:
		meta["failed_terminals"] = failed_terminals
	
	body = ApiContainerListResponse(success=True, results=results, terminals_searched=searched, search_time=round(elapsed, 3), meta=meta)
	# ETag + Cache-Control
	payload = body.model_dump(exclude_none=True)
	cond = _maybe_304(request, response, payload)
	if cond is not None:
		return cond
	_attach_cache_headers(response)
	return body

@app.post("/api/track/batch", response_model=ApiContainerListResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_BATCH", "10/minute"))
async def track_batch(
	request: Request,
	response: Response,  # added
	body: dict = Body(..., example={"container_numbers": ["CSNU6356093", "TCLU8128064"], "terminal": "QICT", "include_vessel": True, "nocache": False}),
):
	require_api_key(request)
	containers_raw = body.get("container_numbers", [])
	containers_norm = [str(c).strip().upper() for c in containers_raw if str(c).strip()]
	if not containers_norm:
		raise HTTPException(status_code=422, detail="container_numbers is required and must be a non-empty array.")
	# Validate all and collect invalids
	import re as _re
	invalid = [c for c in containers_norm if not _re.match(CONTAINER_RE, c)]
	if invalid:
		raise HTTPException(status_code=422, detail=f"Invalid container number(s): {', '.join(invalid)}")
	# Dedupe preserving order and collect duplicates
	seen = set()
	unique: List[str] = []
	duplicates: List[str] = []
	for c in containers_norm:
		if c in seen:
			duplicates.append(c)
		else:
			seen.add(c)
			unique.append(c)
	# Enforce max 10 unique; ignore extras
	excess_ignored: List[str] = []
	if len(unique) > 10:
		excess_ignored = unique[10:]
		unique = unique[:10]

	terminal = body.get("terminal")
	if terminal and terminal not in {"KICT", "KGTL", "QICT", "SAPT"}:
		raise HTTPException(status_code=422, detail="terminal must be one of KICT, KGTL, QICT, SAPT")
	include_vessel = bool(body.get("include_vessel", False))
	nocache = bool(body.get("nocache", False))

	start = asyncio.get_event_loop().time()
	results: List[ContainerTrackResult] = []

	# Build targets from query or enabled list and run in parallel
	targets = [terminal] if terminal else terminal_service.get_enabled_terminals()

	async def _fetch_for_term(t: str, cn: str) -> List[ContainerTrackResult]:
		if t == "QICT":
			return await _qict_track_container(cn, nocache=nocache)
		else:
			return await terminal_service.track_container(t, cn, nocache=nocache)

	tasks = [asyncio.create_task(_fetch_for_term(t, cn)) for cn in unique for t in targets]
	out = await asyncio.gather(*tasks, return_exceptions=True)
	for part in out:
		if isinstance(part, Exception):
			continue
		results.extend(part or [])

	searched = targets
	elapsed = asyncio.get_event_loop().time() - start

	# Optional enrichment (QICT schedules only for now)
	if include_vessel and results and ("QICT" in searched):
		try:
			await terminal_service.enrich_with_vessel_info(results, terminal="QICT", nocache=nocache)
		except Exception:
			pass

	meta = {
		"requested": len(containers_raw),
		"unique": len(seen),
		"processed": len(unique),
		"duplicates_ignored": duplicates,
		"excess_ignored": excess_ignored,
		"attempted_terminals": searched,
	}

	return ApiContainerListResponse(
		success=True,
		results=results,
		terminals_searched=searched,
		search_time=round(elapsed, 3),
		meta=meta,
	)

# ============== BULK CONTAINER TRACKING ENDPOINTS ==============

@app.post("/api/track/bulk", response_model=BulkTrackingResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_BULK", "5/minute"))
async def track_containers_bulk_endpoint(
	request: Request,
	response: Response,
	bulk_request: BulkTrackingRequest,
):
	"""
	Track multiple containers across all terminals concurrently.
	

	- **containers**: List of container numbers (max 20)
	- **terminals**: Optional list of specific terminals to search (default: all enabled)
	- **max_concurrent**: Maximum concurrent requests per terminal (1-20, default: 5)
	"""
	require_api_key(request)
	
	# Validate container count
	if len(bulk_request.containers) > 20:
		raise HTTPException(
			status_code=422, 
			detail="Maximum 20 containers allowed per bulk request"
		)
	
	if not bulk_request.containers:
		raise HTTPException(
			status_code=422,
			detail="At least one container number is required"
		)
	
	# Validate container formats
	import re as _re
	invalid_containers = [
		container for container in bulk_request.containers 
		if not _re.match(CONTAINER_RE, container.strip().upper())
	]
	
	if invalid_containers:
		raise HTTPException(
			status_code=422,
			detail=f"Invalid container number format(s): {', '.join(invalid_containers)}. Expected 4 letters + 7 digits."
		)
	
	# Validate terminals if specified
	if bulk_request.terminals:
		invalid_terminals = [
			terminal for terminal in bulk_request.terminals 
			if terminal.upper() not in {"KICT", "KGTL", "QICT", "SAPT"}
		]
		if invalid_terminals:
			raise HTTPException(
				status_code=422,
				detail=f"Invalid terminal(s): {', '.join(invalid_terminals)}. Supported: KICT, KGTL, QICT, SAPT"
			)
	
	# Execute bulk tracking
	result = await track_containers_bulk(bulk_request)
	
	# Attach cache headers
	_attach_cache_headers(response)
	
	return result


@app.post("/api/track/bulk/{terminal}", response_model=BulkTrackingResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_BULK_TERMINAL", "10/minute"))
async def track_containers_by_terminal_endpoint(
	request: Request,
	response: Response,
	terminal: str,
	containers: List[str] = Body(..., description="List of container numbers to track"),
	max_concurrent: int = Body(default=10, description="Maximum concurrent requests", ge=1, le=20),
):
	"""
	Track multiple containers on a specific terminal concurrently.
	
	- **terminal**: Terminal name (KICT, KGTL, QICT, SAPT)
	- **containers**: List of container numbers (max 50 for single terminal)
	- **max_concurrent**: Maximum concurrent requests (1-20, default: 10)
	"""
	require_api_key(request)
	
	# Validate terminal
	if terminal.upper() not in {"KICT", "KGTL", "QICT", "SAPT"}:
		raise HTTPException(
			status_code=422,
			detail=f"Invalid terminal: {terminal}. Supported: KICT, KGTL, QICT, SAPT"
		)
	
	# Validate container count
	if len(containers) > 50:
		raise HTTPException(
			status_code=422,
			detail="Maximum 50 containers allowed per terminal bulk request"
		)
	
	if not containers:
		raise HTTPException(
			status_code=422,
			detail="At least one container number is required"
		)
	
	# Validate container formats
	import re as _re
	invalid_containers = [
		container for container in containers 
		if not _re.match(CONTAINER_RE, container.strip().upper())
	]
	
	if invalid_containers:
		raise HTTPException(
			status_code=422,
			detail=f"Invalid container number format(s): {', '.join(invalid_containers)}. Expected 4 letters + 7 digits."
		)
	
	# Execute terminal-specific bulk tracking
	bulk_results = await track_containers_by_terminal_bulk(
		containers=containers,
		terminal=terminal.upper(),
		max_concurrent=max_concurrent
	)
	
	# Convert to BulkTrackingResponse format
	successful_count = sum(1 for r in bulk_results if r.success)
	failed_count = len(bulk_results) - successful_count
	total_time = sum(r.search_time for r in bulk_results)
	
	response_data = BulkTrackingResponse(
		success=successful_count > 0,
		total_containers=len(containers),
		successful_containers=successful_count,
		failed_containers=failed_count,
		results=bulk_results,
		total_time=total_time,
		summary={terminal.upper(): len(containers)}
	)
	
	# Attach cache headers
	_attach_cache_headers(response)
	
	return response_data


@app.post("/api/track/allinone", response_model=AllInOneTrackingResponse)
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_BULK", "5/minute"))
async def track_containers_allinone_endpoint(
	request: Request,
	response: Response,
	allinone_request: AllInOneTrackingRequest,
):
	"""
	Track containers organized by terminal efficiently.
	
	This endpoint accepts containers mapped to their specific terminals,
	removes duplicates, organizes by terminal, and processes each terminal
	in parallel using bulk scraping for optimal performance.
	
	- **containers**: Dict mapping container numbers to terminal names
	- **max_concurrent**: Maximum concurrent requests per terminal (1-20, default: 10)
	
	Example request:
	```json
	{
		"containers": {
			"CSNU8234026": "KICT",
			"HLXU6412970": "KICT", 
			"SEGU4440183": "KGTL",
			"MRKU6918086": "QICT",
			"TCNU6664105": "SAPT"
		},
		"max_concurrent": 10
	}
	```
	"""
	require_api_key(request)
	
	# Validate container count
	if len(allinone_request.containers) > 200:
		raise HTTPException(
			status_code=422,
			detail="Maximum 200 containers allowed per all-in-one request"
		)
	
	if not allinone_request.containers:
		raise HTTPException(
			status_code=422,
			detail="At least one container is required"
		)
	
	# Validate container formats
	import re as _re
	invalid_containers = []
	for container_no in allinone_request.containers.keys():
		if not _re.match(CONTAINER_RE, container_no.strip().upper()):
			invalid_containers.append(container_no)
	
	if invalid_containers:
		raise HTTPException(
			status_code=422,
			detail=f"Invalid container number format(s): {', '.join(invalid_containers)}. Expected 4 letters + 7 digits."
		)
	
	# Validate terminals
	invalid_terminals = []
	for terminal in allinone_request.containers.values():
		if terminal.upper() not in {"KICT", "KGTL", "QICT", "SAPT"}:
			invalid_terminals.append(terminal)
	
	if invalid_terminals:
		unique_invalid = list(set(invalid_terminals))
		raise HTTPException(
			status_code=422,
			detail=f"Invalid terminal(s): {', '.join(unique_invalid)}. Supported: KICT, KGTL, QICT, SAPT"
		)
	
	# Execute all-in-one tracking
	result = await track_containers_allinone(allinone_request)
	
	# Attach cache headers
	_attach_cache_headers(response)
	
	return result


# ============== END BULK ENDPOINTS ==============

# ---- Cache admin endpoints ----
@app.post("/api/admin/cache/clear")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"))
async def cache_clear(request: Request, response: Response, body: Optional[dict] = Body(default=None, example={"scope": "all"})):
	require_admin_key(request)
	scope = (body or {}).get("scope", "all")
	scope = str(scope).lower()
	stats_before = cache_service.get_cache_stats()
	before = {"vessel": stats_before["vessel"]["size"], "container": stats_before["container"]["size"]}
	
	if scope in ("all", "vessel", "container"):
		vessel_cleared, container_cleared = cache_service.clear_all_cache() if scope == "all" else (0, 0)
		if scope == "vessel":
			vessel_cleared = cache_service.clear_vessel_cache()
		elif scope == "container":
			container_cleared = cache_service.clear_container_cache()
	
	stats_after = cache_service.get_cache_stats()
	after = {"vessel": stats_after["vessel"]["size"], "container": stats_after["container"]["size"]}
	return {"ok": True, "scope": scope, "before": before, "after": after}

@app.delete("/api/admin/cache/container/{container_no}")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"))
async def cache_evict_container(
	request: Request,
	response: Response,  # added
	container_no: str,
	terminal: Optional[str] = Query(default=None, pattern="^(KICT|KGTL|QICT|SAPT)$"),
):
	require_admin_key(request)
	cleared = cache_service.clear_container_cache(container_no, terminal)
	return {"ok": True, "evicted_count": cleared}

@app.delete("/api/admin/cache/vessel/{vessel_name}")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"))
async def cache_evict_vessel(
	request: Request,
	response: Response,  # added
	vessel_name: str,
	terminal: Optional[str] = Query(default=None, pattern="^(KICT|KGTL|QICT|SAPT)$"),
):
	require_admin_key(request)
	cleared = cache_service.clear_vessel_cache(vessel_name, terminal)
	return {"ok": True, "evicted_count": cleared}

@app.get("/api/admin/metrics")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"))
async def metrics(request: Request, response: Response):
	require_admin_key(request)
	return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/api/admin/statistics")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"))
async def statistics(request: Request, response: Response):
	require_admin_key(request)
	uptime = round(time.time() - app.state.started_at, 3)
	stats = cache_service.get_cache_stats()
	return {
		"uptime_seconds": uptime,
		"rate_limit": {"requests": _QICT_RPM, "window_sec": _QICT_WINDOW},
		"cache": {
			"ttl_sec": stats["ttl_seconds"],
			"sizes": {"vessel": stats["vessel"]["size"], "container": stats["container"]["size"]},
		},
		"env": {
			"request_timeout": os.getenv("REQUEST_TIMEOUT", "30"),
			"connect_timeout": os.getenv("CONNECTION_TIMEOUT", "10"),
		},
	}

# ---- OpenAPI security (docs) ----
def _custom_openapi():
	base = get_openapi(
		title=app.title,
		version=app.version,
		routes=app.routes,
	)
	# Security schemes
	base.setdefault("components", {}).setdefault("securitySchemes", {})
	base["components"]["securitySchemes"]["ApiKeyAuth"] = {
		"type": "apiKey",
		"in": "header",
		"name": "X-API-Key",
		"description": "Provide an API key in X-API-Key header.",
	}
	base["components"]["securitySchemes"]["BearerAuth"] = {
		"type": "http",
		"scheme": "bearer",
		"bearerFormat": "JWT/opaque",
		"description": "Provide a Bearer token in Authorization header.",
	}
	# If API_KEYS is configured, show either ApiKey or Bearer required
	if os.getenv("API_KEYS", "").strip():
		base["security"] = [
			{"ApiKeyAuth": []},
			{"BearerAuth": []},
		]
	return base

# Attach custom OpenAPI
app.openapi = _custom_openapi

if __name__ == "__main__":
	import uvicorn
	host = os.getenv("API_HOST", "0.0.0.0")
	port = int(os.getenv("API_PORT", "8000"))
	reload = os.getenv("API_RELOAD", "false").lower() == "true"
	uvicorn.run("src.main:app", host=host, port=port, reload=reload)

# ---- Minimal QICT helpers (missing earlier) ----
# Note: _parse_dt and _status_from_ata_atd already imported from src.core.utils at top of file

async def _qict_fetch_vessel_schedules(vessel_name_query: str, nocache: bool = False) -> List[VesselSchedule]:
	# Cached wrapper around module function
	if not nocache:
		cached = cache_service.get_vessel(vessel_name_query)
		if cached is not None:
			return cached
	results = await qict_fetch_vessel_schedules(vessel_name_query)
	if not nocache:
		cache_service.put_vessel(vessel_name_query, results)
	return results

async def _qict_track_container(container_no: str, nocache: bool = False) -> List[ContainerTrackResult]:
	# Cached wrapper around module function
	if not nocache:
		cached = cache_service.get_container("QICT", container_no)
		if cached is not None:
			return cached
	results = await qict_track_container(container_no)
	if not nocache:
		cache_service.put_container("QICT", container_no, results)
	return results

# (removed duplicate _generic_track_container; keeping earlier definition with HTML fallback when API_URL is missing)

## HTML scrapers moved to src/scrapers/* modules

# ---- Cache functions moved to src/services/cache_service.py ----

# Public index and health endpoints
@app.get("/")
async def index():
	return {
		"name": "FreightForwarder Tracking API",
		"version": app.version,
		"docs": "/docs",
		"health": "/health",
		"health_simple": "/health/simple",
	}

@app.get("/health/simple")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_HEALTH", "120/minute"))
async def health_simple(request: Request, response: Response):
	return {"status": "ok"}

@app.on_event("shutdown")
async def shutdown_event():
	"""Cleanup handler: close all persistent HTTP connections in the pool"""
	await close_all_clients()
	log = structlog.get_logger(__name__)
	log.info("Connection pool shutdown complete")

@app.get("/health")
@limiter.limit(lambda: _get_limit("INBOUND_LIMIT_HEALTH", "120/minute"))
async def health(request: Request, response: Response):
	now = datetime.utcnow().isoformat() + "Z"
	return {
		"status": "healthy",
		"timestamp": now,
		"version": app.version,
		"app_version": os.getenv("APP_VERSION", app.version),
		"details": {
			"timeouts": {
				"request": os.getenv("REQUEST_TIMEOUT", "30"),
				"connect": os.getenv("CONNECTION_TIMEOUT", "10"),
			},
			"cache": cache_service.get_cache_stats(),
			"rate_limit": {"requests": _QICT_RPM, "window_sec": _QICT_WINDOW},
			"inbound_limits": {
				"vessel": _get_limit("INBOUND_LIMIT_VESSEL", "30/minute"),
				"container": _get_limit("INBOUND_LIMIT_CONTAINER", "60/minute"),
				"batch": _get_limit("INBOUND_LIMIT_BATCH", "10/minute"),
				"health": _get_limit("INBOUND_LIMIT_HEALTH", "120/minute"),
				"admin": _get_limit("INBOUND_LIMIT_ADMIN", "100/minute"),
			},
			"enabled_terminals": terminal_service.get_enabled_terminals(),
		},
	}

# --------------- Enrichment helpers (QICT) ---------------
# _enrich_with_qict_vessel moved to src/services/terminal_service.py (enrich_with_vessel_info)