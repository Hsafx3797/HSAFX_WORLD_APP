# 🛳️ Backend Scraper Logic Specification (Tool 446)

**Tool ID:** 446 - Seaport Terminal Container Activity Tracker  
**Category:** Async Intelligence  
**Execution:** Python Backend (FastAPI)  
**Package:** `packages/backend-scrapers/seaport-tracker/`

---

## 1. Overview

This specification documents the complete scraping logic for tracking shipping containers and vessels across 4 major Pakistan terminals. Each terminal requires a completely different approach due to varying authentication, data formats, and HTML structures.

**Performance Benchmarks (Optimized):**
- KICT: 9.0s (50% faster than baseline)
- SAPT: 8.8s (15% faster)
- QICT: 0.5s (Ultra-fast JSON API)
- KGTL: 1.7s (62% faster)

---

## 2. Terminal-Specific Scraping Strategies

### 2.1 KGTL (Karachi Gateway Terminal Limited) - ASP.NET Pattern

**Base URL:** `https://www.kgtl.com.pk/en/online-tracking`  
**Vessel URL:** `https://www.kgtl.com.pk/en/vessel-schedule`  
**Strategy:** HTML Form Submission with ASP.NET ViewState  
**Authentication:** None (Public endpoint)

#### Request Flow
```
1. GET /en/online-tracking
   ↓ Extract hidden form fields
2. POST form with container number + ViewState tokens
   ↓ Response contains ASP.NET Ajax Delta
3. Parse UpdatePanel fragment
```

#### Critical Headers
```python
{
    "X-MicrosoftAjax": "Delta=true",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": base_url
}
```

#### Form Payload Structure
```python
{
    "header$scrptmngr": "updPnlTracking|btnSearch",
    "__VIEWSTATE": extracted_value,
    "__VIEWSTATEGENERATOR": extracted_value,
    "__EVENTVALIDATION": extracted_value,
    "txtSearch": container_no,
    "radio": "rdioCon",
    "__ASYNCPOST": "true",
    "btnSearch": "Search"
}
```

#### HTML Parsing Strategy
```python
# Extract updatePanel content via Regex
panel_html = re.search(r"updatePanel\|updPnlTracking\|(.*?)(?:\|\d+\||$)", response.text)

# Parse labels
size = doc.css_first("#lblSize") or doc.css_first("#lblDescription")
vessel = doc.css_first("#lblVessel")
voyage = doc.css_first("#lblVoyage")

# Parse events grid
for tr in doc.css("#grdEvents tr"):
    activity = tds[0].text().upper()
    if activity == "UNIT_IN_GATE":
        gate_in = parse_dt(tds[1].text())
```

#### Vessel Schedule Parsing
```python
# Table structure: #VesselScheduleGrid
headers = ["vessel name", "voyage", "phase", "ata", "eta", "atd", "etd"]
for tr in rows[1:]:  # Skip header row
    name = tds[i_name].text()
    if query.lower() in name.lower():
        # Build VesselSchedule object
```

---

### 2.2 KICT (Karachi International Container Terminal) - JSON Extraction

**History URL:** `https://kictl.com/Enquiries/ContainerHistory`  
**Details URL:** `https://kictl.com/Enquiries/ContainerDetails`  
**Vessel URL:** `https://kictl.com/Enquiries/VesselSchedule`  
**Strategy:** Dual Parallel Fetch → Extract PID → Fetch Details  
**Authentication:** None (Session-based)

#### Request Flow (Optimized with Parallel Execution)
```python
# OPTIMIZATION: Fetch History and Vessel Schedule simultaneously (saves ~290ms)
history_task = client.get(hist_url, params={"cntrNum": container_no})
schedule_task = client.get(vessel_url)
r1, schedule = await asyncio.gather(history_task, schedule_task)
```

#### PID Extraction (3-Stage Fallback)
```python
# Strategy 1: Extract _jsonArray from script tags
m = re.search(r'"_jsonArray"\s*:\s*"(.*?)"', r1.text, re.DOTALL)
if m:
    json_string = codecs.decode(m.group(1), 'unicode_escape')
    arr = msgspec.json.decode(json_string)  # 30-50% faster than stdlib json
    pid = arr[0].get("pid")

# Strategy 2: Direct pid regex search
if not pid:
    pid = re.search(r'"pid"\s*:\s*"?(\d+)"?', r1.text).group(1)

# Strategy 3: Parse HTML table (slowest fallback)
```

#### Details Fetch with Retry Logic
```python
# POST first (preferred)
form = {"cntrPK": pid, "method": "C", "BU": "KICT"}
r2 = await client.post(details_url, data=form)

# GET fallback if POST returns empty
if "#tblcntr" not in r2.text:
    r2 = await client.get(details_url, params=form)
```

#### Single-Pass Table Parsing (800-1200ms savings)
```python
# BEFORE: 20+ table scans with repeated CSS queries
# AFTER: Parse once, dictionary lookups

data_dict = {}
for tr in doc.css("#tblcntr tr"):
    tds = tr.css("td")
    # Column structure: [Label1, Value1, Empty, Label2, Value2]
    if len(tds) >= 2:
        key1 = tds[0].text().upper()
        data_dict[key1] = tds[1].text().strip()
    if len(tds) >= 5:
        key2 = tds[3].text().upper()
        data_dict[key2] = tds[4].text().strip()

# Fast multi-key lookup
def get_value(*keys):
    for key in keys:
        if val := data_dict.get(key.upper()):
            return val
    return None

size = get_value("Container Size/Type", "SIZE/TYPE", "SZTP")
```

#### Vessel Schedule JSON Parsing
```python
# Extract from var data = {"_jsonArray": "..."}
matches = re.search(r'var\s+data\s*=\s*{[^}]*"_jsonArray"\s*:\s*"([^"]+)"', r.text)
json_string = codecs.decode(matches[0], 'unicode_escape')
vessels = msgspec.json.decode(json_string)

for item in vessels:
    eta, ata, etd, atd = map_vessel_times(item.get('STATUS'), ...)
```

---

### 2.3 QICT (Qasim International Container Terminal) - JSON API

**API URL:** `https://lfs.qict.com.pk/API/api/ds/v1/Ctr-Inq`  
**Vessel URL:** `https://lfs.qict.com.pk/API/api/ds/v1/V-Berth`  
**Strategy:** REST API with Credentials  
**Authentication:** POST body credentials

#### Request Flow
```python
# 1. Preflight to get Citrix cookies
await client.get("https://lfs.qict.com.pk/")

# 2. POST with credentials
payload = {
    "ctrnbr": container_no,
    "UserID": env.QICT_USER_ID,
    "Password": env.QICT_PASSWORD,
    "Cellno": env.QICT_CELL_NO
}
resp = await client.post(QICT_API_URL, data=payload)
```

#### Double-Encoded JSON Handling
```python
# QICT returns JSON-string-encoded-in-JSON
data = msgspec.json.decode(resp.content)

# Handle double encoding
if isinstance(data, str):
    data = msgspec.json.decode(data)
```

#### Field Mapping (Key-Value Pair Format)
```python
# Response structure: [{"FIELD_NAME": "...", "FIELD_VALUE": "..."}, ...]
kv = {}
for row in data:
    key = row.get("FIELD_NAME", "").strip().upper()
    val = row.get("FIELD_VALUE", "").strip()
    kv[key] = val

# Map to ContainerTrackResult
size_type = kv.get("SIZE/TYPE") or kv.get("SIZE TYPE")
gate_in = parse_dt(kv.get("TRUCK IN TIME") or kv.get("IN TIME"))
```

#### Vessel Enrichment
```python
# QICT provides vessel name but not schedule in container API
# Must fetch vessel schedule separately and match
if vessel_name:
    schedules = await qict_fetch_vessel_schedules(vessel_name)
    match = next((s for s in schedules 
                  if s.vessel_name.lower() == vessel_name.lower() 
                  and s.voyage_no == voyage_no), None)
    if match:
        eta = match.vessel_estimated_berth
        vstatus = match.vessel_current_status
```

---

### 2.4 SAPT (South Asia Pakistan Terminal) - KICT Clone

**History URL:** `https://www.sapt.com.pk/Enquiries/ContainerHistory`  
**Details URL:** `https://www.sapt.com.pk/Enquiries/ContainerDetails`  
**Vessel URL:** `https://www.sapt.com.pk/Enquiries/VesselSchedule`  
**Strategy:** Identical to KICT (Same Backend System)  
**Authentication:** None (Requires Referer header)

#### Key Differences from KICT
1. **Referer Requirement:**
   ```python
   headers = {
       "Referer": "https://www.sapt.com.pk/Enquiries?is=ContainerBLEnquiry"
   }
   ```
2. **Parallel Optimization (saves ~400ms):**
   ```python
   history_task = client.get(hist_url, params=params)
   schedule_task = _sapt_get_vessel_schedule(client)
   r1, schedule = await asyncio.gather(history_task, schedule_task)
   ```
3. **Same PID extraction and table parsing as KICT**

---

## 3. Core Infrastructure

### 3.1 Data Models (Pydantic)

#### ContainerTrackResult
```python
class ContainerTrackResult(BaseModel):
    terminal_name: str  # "KICT"|"KGTL"|"QICT"|"SAPT"
    container_no: str  # Validated: 4 letters + 7 digits
    container_size_n_type: Optional[str]  # "40 / HC"
    shipment_category: Optional[str]  # "IMPORT"|"EXPORT"
    vessel_name: Optional[str]
    voyage_no: Optional[str]
    destination: Optional[str]
    hold_description: Optional[str]
    gate_in_date: Optional[datetime]
    load_date: Optional[datetime]
    container_position: Optional[str]
    vessel_estimated_berth: Optional[datetime]
    vessel_estimated_depart: Optional[datetime]
    vessel_actual_berth: Optional[datetime]
    vessel_actual_depart: Optional[datetime]
    vessel_current_status: Optional[str]  # "Upcoming"|"Arrived"|"Departed"
    
    @validator('container_no')
    def validate_container_no(cls, v):
        if not re.match(r'^[A-Z]{4}\d{7}$', v.strip().upper()):
            raise ValueError('Invalid container format')
        return v.strip().upper()
```

#### VesselSchedule
```python
class VesselSchedule(BaseModel):
    terminal_name: str
    vessel_name: str  # Uppercase normalized
    voyage_no: Optional[str]
    vessel_estimated_berth: Optional[datetime]
    vessel_estimated_depart: Optional[datetime]
    vessel_actual_berth: Optional[datetime]
    vessel_actual_depart: Optional[datetime]
    vessel_current_status: Optional[str]
```

---

### 3.2 Connection Pooling (40-50% Performance Gain)

**Module:** `src.core.connection_pool`

#### Configuration
```python
DEFAULT_MAX_KEEPALIVE = 50  # Connections to keep alive
DEFAULT_MAX_CONNECTIONS = 100  # Max concurrent
KEEPALIVE_EXPIRY = 30.0  # seconds

limits = httpx.Limits(
    max_keepalive_connections=50,
    max_connections=100,
    keepalive_expiry=30.0
)

client = httpx.AsyncClient(
    timeout=timeout,
    headers=headers,
    verify=verify,
    limits=limits,
    http2=True,  # 15-30% speedup
    follow_redirects=True
)
```

#### Terminal-Specific Clients
```python
# Global pool: {terminal_name: AsyncClient}
_TERMINAL_CLIENTS = {}

async def get_terminal_client(terminal: str, ...) -> httpx.AsyncClient:
    if terminal not in _TERMINAL_CLIENTS:
        _TERMINAL_CLIENTS[terminal] = create_client_for_terminal(...)
    return _TERMINAL_CLIENTS[terminal]
```

#### Shutdown Cleanup
```python
async def close_all_clients():
    for client in _TERMINAL_CLIENTS.values():
        await client.aclose()
    _TERMINAL_CLIENTS.clear()
```

---

### 3.3 Date Parsing (Multi-Format Support)

**Module:** `src.core.utils.parse_dt`

#### Supported Formats (Ordered by Frequency)
```python
_DATE_FORMATS = [
    "%d-%b-%Y %H:%M",       # 22-Nov-2025 14:30
    "%d-%b-%Y %H:%M:%S",    # 22-Nov-2025 14:30:00
    "%m/%d/%Y %H:%M:%S",    # 11/22/2025 14:30:00
    "%d-%b-%y %H:%M",       # 22-Nov-25 14:30
    "%d-%b-%Y %I:%M %p",    # 22-Nov-2025 02:30 PM
    "%Y-%m-%d %H:%M:%S",    # 2025-11-22 14:30:00 (ISO-like)
]
```

#### Invalid AM/PM Correction
```python
# Fix "13:00:00 PM" → "13:00:00" (remove PM for 24-hour)
# Fix "00:30:00 AM" → "12:30:00 AM" (midnight)
# Fix "00:30:00 PM" → "12:30:00 PM" (noon)

if hour > 12:
    s = s.replace(" PM", "").replace(" AM", "")
elif hour == 0 and "AM" in s:
    s = s.replace("00:", "12:", 1)
```

---

### 3.4 Vessel Status Mapping

**Module:** `src.core.utils`

#### status_from_ata_atd
```python
def status_from_ata_atd(ata: datetime, atd: datetime) -> str:
    if not ata:
        return "Upcoming"
    if ata and not atd:
        return "Arrived"
    return "Departed"
```

#### map_vessel_times
```python
def map_vessel_times(status: str, eta: datetime, etd: datetime):
    """
    Different terminals store times differently based on vessel status.
    This centralizes the mapping logic.
    
    Returns: (estimated_berth, actual_berth, estimated_depart, actual_depart)
    """
    if status.upper() == 'UPCOMING':
        return (eta, None, etd, None)
    elif status.upper() == 'ARRIVED':
        return (None, eta, etd, None)  # ETA becomes actual berth
    elif status.upper() == 'DEPARTED':
        return (None, eta, None, etd)  # Both are actual
    else:
        return (eta, None, etd, None)  # Default to estimated
```

---

### 3.5 Caching (In-Memory TTL)

**Module:** `src.services.cache_service`

#### Cache Structure
```python
# Vessel cache: {terminal:vessel_name → (expiry, [VesselSchedule])}
_vessel_cache: dict[str, tuple[float, list]] = {}

# Container cache: {(terminal, container_no) → (expiry, [ContainerTrackResult])}
_container_cache: dict[tuple[str, str], tuple[float, list]] = {}
```

#### Usage
```python
# Check cache
if not nocache:
    cached = cache_service.get_container("KICT", container_no)
    if cached is not None:
        return cached

# Fetch from terminal
results = await kict_track_container_html(container_no)

# Store in cache (300s TTL default)
if not nocache:
    cache_service.put_container("KICT", container_no, results)
```

#### Cache Management
```python
# Clear specific container
cache_service.clear_container_cache(container_no="CSNU1234567", terminal="KICT")

# Clear all containers for a terminal
cache_service.clear_container_cache(terminal="KICT")

# Clear all caches
vessel_count, container_count = cache_service.clear_all_cache()
```

---

### 3.6 Bulk Processing

**Module:** `src.services.bulk_service`

#### Bulk Tracking (Auto-Search All Terminals)
```python
async def track_containers_bulk(request: BulkTrackingRequest):
    """
    Track multiple containers by searching all enabled terminals.
    Stops searching once container is found.
    """
    semaphore = asyncio.Semaphore(request.max_concurrent)
    
    async def track_one(container_no):
        for terminal in enabled_terminals:
            async with semaphore:
                results = await TERMINAL_SCRAPERS[terminal](container_no)
                if results:
                    return BulkContainerResult(success=True, results=results)
        return BulkContainerResult(success=False, error="Not found")
    
    tasks = [track_one(c) for c in request.containers]
    results = await asyncio.gather(*tasks)
```

#### All-In-One Tracking (Terminal Pre-Assigned)
```python
async def track_containers_allinone(request: AllInOneTrackingRequest):
    """
    More efficient: User specifies terminal per container.
    Example: {"CSNU1234567": "KICT", "HLXU9876543": "QICT"}
    """
    # Organize by terminal
    terminal_containers = defaultdict(list)
    for container, terminal in request.containers.items():
        terminal_containers[terminal].append(container)
    
    # Process each terminal concurrently
    tasks = []
    for terminal, containers in terminal_containers.items():
        task = track_containers_by_terminal_bulk(containers, terminal)
        tasks.append(task)
    
    all_results = await asyncio.gather(*tasks)
```

---

### 3.7 Response Formatting

**Module:** `src.services.response_builder`

#### Standard Response Structure
```json
{
  "success": true,
  "results": [...],  // List of ContainerTrackResult or VesselSchedule
  "terminals_searched": ["KICT", "QICT"],
  "search_time": 9.2,
  "meta": {
    "total": 1,
    "page": 1,
    "page_size": 100,
    "total_pages": 1,
    "has_more": false
  }
}
```

#### Bulk Response Structure
```json
{
  "success": true,
  "total_containers": 10,
  "successful_containers": 8,
  "failed_containers": 2,
  "results": [
    {
      "container_no": "CSNU1234567",
      "success": true,
      "results": [...],
      "terminals_searched": ["KICT"],
      "search_time": 9.1
    }
  ],
  "total_time": 15.3,
  "summary": {
    "KICT": 5,
    "QICT": 3,
    "KGTL": 2
  }
}
```

---

## 4. Environment Variables

```env
# ========================================
# TERMINAL CONFIGURATION
# ========================================
TERMINALS_ENABLED=QICT,KICT,KGTL,SAPT

# KICT URLs
KICT_HISTORY_URL=https://kictl.com/Enquiries/ContainerHistory
KICT_DETAILS_URL=https://kictl.com/Enquiries/ContainerDetails
KICT_VESSEL_URL=https://kictl.com/Enquiries/VesselSchedule
KICT_SSL_VERIFY=false  # Legacy SSL issues

# KGTL URLs
KGTL_TRACK_URL=https://www.kgtl.com.pk/en/online-tracking
KGTL_VESSEL_PAGE=https://www.kgtl.com.pk/en/vessel-schedule

# QICT URLs + Credentials
QICT_API_URL=https://lfs.qict.com.pk/API/api/ds/v1/Ctr-Inq
QICT_VESSEL_URL=https://lfs.qict.com.pk/API/api/ds/v1/V-Berth
QICT_USER_ID=Test
QICT_PASSWORD=Test
QICT_CELL_NO=123456

# SAPT URLs
SAPT_HISTORY_URL=https://www.sapt.com.pk/Enquiries/ContainerHistory
SAPT_DETAILS_URL=https://www.sapt.com.pk/Enquiries/ContainerDetails
SAPT_VESSEL_URL=https://www.sapt.com.pk/Enquiries/VesselSchedule

# ========================================
# PERFORMANCE TUNING
# ========================================
REQUEST_TIMEOUT=12
CONNECTION_TIMEOUT=4
CACHE_TTL=300  # seconds

# Connection Pool
ENABLE_CONNECTION_POOL=true
DEFAULT_MAX_KEEPALIVE=50
DEFAULT_MAX_CONNECTIONS=100
KEEPALIVE_EXPIRY=30

# User Agent (Important for some terminals)
SCRAPER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0
SCRAPER_ACCEPT_LANGUAGE=en-US,en;q=0.9

# SSL Certificate Bundle (for corporate proxies)
SCRAPER_CA_BUNDLE=/path/to/cert.pem
```

---

## 5. Performance Optimizations Applied

### 5.1 HTTP/2 Multiplexing (15-30% speedup)
Enabled globally in connection pool:
```python
client = httpx.AsyncClient(http2=True, ...)
```

### 5.2 msgspec JSON Parsing (30-50% speedup)
Replaced `json.loads()` with `msgspec.json.decode()` (Rust-based):
```python
import msgspec
data = msgspec.json.decode(response.content)
```

### 5.3 Parallel Request Execution (saves 290-400ms per container)
KICT and SAPT now fetch History + Vessel Schedule simultaneously:
```python
r1, schedule = await asyncio.gather(history_task, schedule_task)
```

### 5.4 Single-Pass HTML Parsing (saves 800-1200ms)
KICT/SAPT table parsing changed from 20+ CSS queries to 1 pass:
```python
# Build dictionary once, then lookup
data_dict = parse_table_once(doc.css("#tblcntr tr"))
size = get_value("Container Size/Type", "SIZE/TYPE")
```

### 5.5 Pre-Compiled Regex Patterns
```python
KICT_PATTERNS = {
    'json_array': re.compile(r'"_jsonArray"\s*:\s*"(.*?)"', re.DOTALL),
    'pid': re.compile(r'"pid"\s*:\s*"?(\d+)"?'),
}
```

---

## 6. Error Handling Strategy

### 6.1 Terminal Unavailability
```python
try:
    results = await kict_track_container_html(container_no)
except httpx.HTTPStatusError as e:
    # Terminal returned 4xx/5xx
    return [ContainerTrackResult(terminal_name="KICT", container_no=container_no)]
except httpx.TimeoutException:
    # Terminal took too long
    raise TimeoutError(f"KICT timeout after {REQUEST_TIMEOUT}s")
```

### 6.2 Data Not Found vs Parsing Failure
```python
# If no data parsed but no exception, return placeholder
if not (size or category or vessel or position):
    return [ContainerTrackResult(terminal_name="KICT", container_no=container_no)]

# Preserve connection pool even on error
except Exception:
    raise  # Re-raise but keep client alive
```

### 6.3 SSL Verification Issues
```python
# Allow per-terminal SSL configuration
verify_opt = os.getenv("KICT_SSL_VERIFY", "false").lower() in ("1", "true")
ca_bundle = os.getenv("SCRAPER_CA_BUNDLE", "")
if ca_bundle and os.path.exists(ca_bundle):
    verify_opt = ca_bundle

client = await get_terminal_client("KICT", verify=verify_opt)
```

---

## 7. Integration with Main App

### 7.1 FastAPI Endpoint Structure
```python
@app.get("/api/track/container/{container_no}")
async def track_container(
    container_no: str,
    terminal: Optional[str] = None,
    nocache: bool = False,
    include_vessel: bool = False
):
    # Route to appropriate terminal scraper
    if terminal:
        scraper_func = TERMINAL_SCRAPERS[terminal]
        results = await scraper_func(container_no)
    else:
        # Search all terminals
        for term in enabled_terminals:
            results = await TERMINAL_SCRAPERS[term](container_no)
            if results:
                break
    
    # Enrich with vessel data if requested
    if include_vessel and results:
        await enrich_with_vessel_info(results, terminal, nocache)
    
    return build_container_response(results, ...)
```

### 7.2 Job Queue Integration
For the async job pattern in the main app:
```python
# 1. User submits container numbers
job_id = create_job({"containers": ["CSNU1234567", "HLXU9876543"]})

# 2. Celery/Redis background worker
@celery_app.task
def process_container_tracking(job_id, containers):
    results = await track_containers_bulk(containers)
    store_results_in_r2(job_id, results)
    update_job_status(job_id, "complete")

# 3. Frontend polls /api/jobs/{job_id}/status
# 4. When complete, downloads from R2 signed URL
```

---

## 8. Testing Strategy

### 8.1 Known Test Containers
```python
# KICT test containers (from existing database)
KICT_TESTS = ["CSNU8234026", "HLXU6412970"]

# QICT test containers
QICT_TESTS = ["SEGU4440183"]

# KGTL test containers
KGTL_TESTS = ["MRKU6711777"]
```

### 8.2 Mock Responses
For CI/CD without hitting live terminals:
```python
@pytest.fixture
def mock_kict_response():
    return {
        "history": load_fixture("kict_history.html"),
        "details": load_fixture("kict_details.html"),
        "vessel": load_fixture("kict_vessel.json")
    }
```

---

## 9. Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Configure SSL certificates if behind corporate proxy
- [ ] Set QICT credentials (obtain from terminal)
- [ ] Enable HTTP/2 in production server (nginx/caddy)
- [ ] Configure connection pool limits based on load
- [ ] Set up Sentry for error tracking
- [ ] Enable Prometheus metrics endpoint
- [ ] Configure cache TTL based on data freshness requirements
- [ ] Set rate limits per terminal to avoid IP bans
- [ ] Configure retry logic with exponential backoff

---

**This specification captures ALL scraping logic from the working backend.**  
**Developers can implement the main app's Tool 446 without guessing any details.**
