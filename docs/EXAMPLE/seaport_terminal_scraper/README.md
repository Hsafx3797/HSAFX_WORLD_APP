# Seaport Terminal Scraper API

A **production-ready**, high-performance container and vessel tracking system for Pakistani maritime terminals. Track containers and vessels across KICT, KGTL, QICT, and SAPT terminals with comprehensive performance optimizations.

## 📋 Table of Contents

- [Features](#-features)
- [Performance Optimizations](#-performance-optimizations)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring)
- [Development](#-development)

---

## 🚀 Features

### Core Functionality
- **Multi-Terminal Container Tracking**: Search containers across KICT, KGTL, QICT, and SAPT
- **Vessel Schedule Information**: Real-time vessel arrival/departure schedules
- **Bulk Operations**: Process 10-100 containers concurrently
- **Smart Caching**: In-memory caching with configurable TTL
- **Rate Limiting**: Configurable rate limits per endpoint

### Performance Features
- **HTTP/2 Support**: Enabled globally for 15-30% faster connections
- **Connection Pooling**: Persistent HTTP clients reduce overhead
- **msgspec JSON Parsing**: 30-50% faster JSON processing
- **Parallel Requests**: Async operations with asyncio.gather()
- **Single-Pass HTML Parsing**: Optimized table parsing (800-1200ms savings)

### API Features
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Authentication**: Optional API key authentication
- **CORS Support**: Configurable cross-origin resource sharing
- **Structured Logging**: JSON logs with request correlation
- **Prometheus Metrics**: Built-in monitoring endpoints

---

## ⚡ Performance Optimizations

### Current Performance (Latest Optimizations)

| Terminal | Before | After | Improvement |
|----------|--------|-------|-------------|
| **KICT** | 18.0s → 10.7s | 9.0s | **50% faster** |
| **SAPT** | 10.4s | 8.8s | **15% faster** |
| **QICT** | 0.8s | 0.5s | **38% faster** |
| **KGTL** | 4.5s | 1.7s | **62% faster** |

### Optimization Techniques Applied

#### 1. HTTP/2 Multiplexing (15-30% speedup)
```python
# Enabled in src/core/connection_pool.py
client = httpx.AsyncClient(http2=True, ...)
```
- Multiple concurrent requests over single TCP connection
- Reduced connection overhead
- Better resource utilization

#### 2. msgspec JSON Parsing (30-50% speedup)
```python
# Rust-based JSON parser (3-10x faster than stdlib)
import msgspec
data = msgspec.json.decode(response.content)
```

#### 3. Parallel Request Execution (saves 400ms per container)
```python
# KICT & SAPT optimization
history_task = client.get(hist_url, params=params)
schedule_task = _get_vessel_schedule(client)
r1, schedule = await asyncio.gather(history_task, schedule_task)
```

#### 4. Single-Pass HTML Parsing (saves 800-1200ms)
```python
# Before: 20+ table scans (get_row() function)
# After: Parse once, dictionary lookups
data_dict = {}
for tr in doc.css("#tblcntr tr"):
    # Parse all rows once
    data_dict[key.upper()] = clean_val.strip()

# Fast lookups
def get_value(*keys):
    for key in keys:
        val = data_dict.get(key.upper())
        if val: return val
    return None
```

#### 5. Connection Pooling
```python
# Persistent HTTP clients with keepalive
DEFAULT_MAX_KEEPALIVE = 50
DEFAULT_MAX_CONNECTIONS = 100
keepalive_expiry = 30.0
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd seaport_terminal_scraper

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Install dependencies (28 core packages)
pip install -r requirements.txt

# Create environment file (optional)
cp .env.example .env
# Edit .env with your settings

# Start the application
python start.py

# Or start manually
python -m src.main
```

### Access the Application
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🏗️ Architecture

### Project Structure

```
seaport_terminal_scraper/
├── src/
│   ├── main.py                      # FastAPI application entry
│   │
│   ├── api/                         # API layer
│   │   ├── __init__.py
│   │   ├── schemas.py               # Response models
│   │   └── dependencies.py          # Auth, rate limiting
│   │
│   ├── core/                        # Core business logic
│   │   ├── __init__.py
│   │   ├── models.py                # Pydantic data models
│   │   ├── utils.py                 # Utility functions
│   │   ├── errors.py                # Error handling
│   │   ├── logging.py               # Logging configuration
│   │   └── connection_pool.py       # HTTP pooling
│   │
│   ├── services/                    # Business services
│   │   ├── __init__.py
│   │   ├── bulk_service.py          # Bulk tracking
│   │   ├── cache_service.py         # Caching operations
│   │   ├── http_client.py           # HTTP client wrapper
│   │   ├── response_builder.py      # Response formatting
│   │   └── terminal_service.py      # Terminal operations
│   │
│   └── terminals/                   # Terminal scrapers
│       ├── __init__.py              # Terminal registry
│       └── pakistan/                # Pakistan terminals
│           ├── __init__.py
│           ├── qict.py              # QICT scraper
│           ├── kict.py              # KICT scraper
│           ├── kgtl.py              # KGTL scraper
│           └── sapt.py              # SAPT scraper
│
├── Doc/                             # Documentation
├── requirements.txt                 # Dependencies
├── .env                             # Environment config
├── start.py                         # Startup script
└── README.md                        # This file
```

### Modular Design Benefits

1. **Separation of Concerns**: Clear boundaries between API, business logic, and scrapers
2. **Easy to Scale**: Add new terminals by creating files in `terminals/{region}/`
3. **Team Collaboration**: Multiple developers can work on different terminals
4. **Maintainability**: Changes to one terminal don't affect others

### Adding New Terminals

Example: Adding Indian terminals (JNPT, Mundra):

```python
# 1. Create terminals/india/jnpt.py
from src.core.models import ContainerTrackResult
from src.core.utils import parse_dt, default_upstream_headers

async def jnpt_track_container(container_no: str) -> List[ContainerTrackResult]:
    # Your scraping logic
    pass

# 2. Register in terminals/__init__.py
from .india import jnpt_track_container

TERMINAL_SCRAPERS = {
    # Pakistan terminals
    "QICT": qict_track_container,
    "KICT": kict_track_container,
    # India terminals
    "JNPT": jnpt_track_container,
}
```

---

## 📡 API Reference

### Base URL
```
http://localhost:8000
```

### Authentication

Optional API key authentication via headers:
```bash
X-API-Key: your-api-key
# OR
Authorization: Bearer your-api-key
```

Configure keys in `.env`:
```env
API_KEYS=key1,key2,key3
ADMIN_API_KEYS=admin-key1,admin-key2
```

### Endpoints

#### 1. Health Check

**GET** `/health/simple`
```bash
curl http://localhost:8000/health/simple
```

**GET** `/health` - Detailed health information
```bash
curl http://localhost:8000/health
```

#### 2. Container Tracking

**GET** `/api/track/container/{container_no}`

Query Parameters:
- `terminal` (optional): Specific terminal (KICT|KGTL|QICT|SAPT)
- `nocache` (optional): Bypass cache (true|false)
- `include_vessel` (optional): Enrich with vessel data (true|false)

```bash
# Single terminal
curl "http://localhost:8000/api/track/container/CSNU8234026?terminal=KICT"

# All terminals
curl "http://localhost:8000/api/track/container/CSNU8234026"

# With vessel enrichment
curl "http://localhost:8000/api/track/container/CSNU8234026?include_vessel=true"
```

Response:
```json
{
  "success": true,
  "results": [
    {
      "terminal_name": "KICT",
      "container_no": "CSNU8234026",
      "container_size_n_type": "40 / HC",
      "shipment_category": "IMPORT",
      "vessel_name": "EVER GIVEN",
      "voyage_no": "0145E",
      "destination": "KARACHI",
      "vessel_estimated_berth": "2025-11-20T08:00:00",
      "vessel_actual_berth": "2025-11-20T09:30:00",
      "vessel_Status": "ARRIVED"
    }
  ],
  "terminals_searched": ["KICT"],
  "search_time": 9.2
}
```

#### 3. Vessel Search

**GET** `/api/track/vessel/{vessel_name}`

Query Parameters:
- `terminal` (optional): Specific terminal
- `nocache` (optional): Bypass cache

```bash
# Search all terminals
curl "http://localhost:8000/api/track/vessel/EVER"

# Specific terminal
curl "http://localhost:8000/api/track/vessel/EVER?terminal=QICT"
```

#### 4. Batch Tracking

**POST** `/api/track/batch`

Request Body:
```json
{
  "container_numbers": ["CSNU8234026", "HLXU6412970"],
  "terminal": "KICT",
  "include_vessel": true,
  "nocache": false
}
```

```bash
curl -X POST "http://localhost:8000/api/track/batch" \
  -H "Content-Type: application/json" \
  -d '{"container_numbers":["CSNU8234026","HLXU6412970"]}'
```

#### 5. Bulk Tracking

**POST** `/api/track/bulk`

Track multiple containers across multiple terminals (up to 20 containers).

Request Body:
```json
{
  "containers": ["CSNU8234026", "HLXU6412970", "MRKU6711777"],
  "terminals": ["KICT", "QICT"],
  "max_concurrent": 5
}
```

```bash
curl -X POST "http://localhost:8000/api/track/bulk" \
  -H "Content-Type: application/json" \
  -d '{"containers":["CSNU8234026","HLXU6412970"],"max_concurrent":10}'
```

#### 6. All-In-One Tracking

**POST** `/api/track/allinone`

Map containers to specific terminals for optimal performance (up to 100 containers).

Request Body:
```json
{
  "containers": {
    "CSNU8234026": "KICT",
    "HLXU6412970": "KICT",
    "SEGU4440183": "QICT"
  },
  "max_concurrent": 10
}
```

```bash
curl -X POST "http://localhost:8000/api/track/allinone" \
  -H "Content-Type: application/json" \
  -d '{"containers":{"CSNU8234026":"KICT","HLXU6412970":"KICT"}}'
```

#### 7. Admin Endpoints

**GET** `/api/admin/statistics` - System statistics

```bash
curl -H "X-API-Key: admin-key" \
  "http://localhost:8000/api/admin/statistics"
```

**GET** `/api/admin/metrics` - Prometheus metrics

```bash
curl -H "X-API-Key: admin-key" \
  "http://localhost:8000/api/admin/metrics"
```

**POST** `/api/admin/cache/clear` - Clear caches

```bash
curl -X POST -H "X-API-Key: admin-key" \
  "http://localhost:8000/api/admin/cache/clear" \
  -d '{"scope":"all"}'
```

### Rate Limits

Default rate limits (configurable via environment):
- Container tracking: 60/minute
- Vessel search: 30/minute
- Batch operations: 10/minute
- Bulk operations: 5/minute
- Admin endpoints: 100/minute

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```env
# ========================================
# API CONFIGURATION
# ========================================
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
APP_ENV=development

# ========================================
# AUTHENTICATION (Optional)
# ========================================
API_KEYS=your-api-key-1,your-api-key-2
ADMIN_API_KEYS=admin-key-1,admin-key-2

# ========================================
# CORS CONFIGURATION
# ========================================
ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ========================================
# TERMINAL CONFIGURATION
# ========================================
TERMINALS_ENABLED=QICT,KICT,KGTL,SAPT

# KICT URLs
KICT_API_URL=https://kictl.com/Enquiries/ContainerHistory
KICT_VESSEL_URL=https://kictl.com/Enquiries/VesselSchedule

# KGTL URLs
KGTL_API_URL=https://www.kgtl.com.pk/en/online-tracking
KGTL_VESSEL_URL=https://www.kgtl.com.pk/en/vessel-schedule

# QICT URLs
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
CACHE_TTL=300
UPSTREAM_RPS=5
UPSTREAM_CONCURRENCY=5

# Connection Pool Settings
ENABLE_CONNECTION_POOL=true
DEFAULT_MAX_KEEPALIVE=50
DEFAULT_MAX_CONNECTIONS=100
KEEPALIVE_EXPIRY=30

# ========================================
# RATE LIMITING
# ========================================
INBOUND_LIMIT_VESSEL=30/minute
INBOUND_LIMIT_CONTAINER=60/minute
INBOUND_LIMIT_BATCH=10/minute
INBOUND_LIMIT_BULK=5/minute
INBOUND_LIMIT_ADMIN=100/minute

# ========================================
# LOGGING
# ========================================
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_REQUESTS=false

# ========================================
# MONITORING (Optional)
# ========================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Production Configuration

For production deployment:

```env
APP_ENV=production
API_RELOAD=false
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_REQUESTS=true

# Security
API_KEYS=prod-key-1,prod-key-2,prod-key-3
ADMIN_API_KEYS=admin-prod-key

# Performance
REQUEST_TIMEOUT=45
CONNECTION_TIMEOUT=15
CACHE_TTL=600
UPSTREAM_RPS=10
UPSTREAM_CONCURRENCY=20

# Monitoring
SENTRY_DSN=https://your-production-sentry-dsn
```

---

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY .env .
COPY start.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health/simple || exit 1

# Run application
CMD ["python", "-m", "src.main"]
```

Build and run:
```bash
docker build -t seaport-tracker .
docker run -p 8000:8000 seaport-tracker
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - API_PORT=8000
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/simple"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Production Server (uvicorn + gunicorn)

```bash
# Install production server
pip install gunicorn

# Run with gunicorn
gunicorn src.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

---

## 📊 Monitoring

### Prometheus Metrics

Access metrics at `/api/admin/metrics` (requires admin API key):

```bash
curl -H "X-API-Key: admin-key" http://localhost:8000/api/admin/metrics
```

Key metrics:
- `ff_api_requests_total` - Total API requests
- `ff_request_latency_seconds` - Request latency histogram
- `ff_upstream_requests_total` - Terminal scraping requests
- `ff_exceptions_total` - Application errors
- `ff_cache_hits_total` - Cache hit rate
- `ff_cache_misses_total` - Cache miss rate

### Health Checks

**Simple**: Returns 200 OK
```bash
curl http://localhost:8000/health/simple
```

**Detailed**: System information
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "version": "1.0.0",
  "environment": "production",
  "enabled_terminals": ["QICT", "KICT", "KGTL", "SAPT"]
}
```

### Logging

Structured JSON logs with request correlation:

```json
{
  "timestamp": "2025-11-22T10:30:00Z",
  "level": "INFO",
  "logger": "api",
  "message": "Container tracking request",
  "request_id": "abc123",
  "container_no": "CSNU8234026",
  "terminal": "KICT",
  "duration_ms": 9200
}
```

### Sentry Integration

Error tracking with Sentry:

```python
# Automatic error tracking
# Configure SENTRY_DSN in .env
SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## 🛠️ Development

### Setup Development Environment

```bash
# Clone and navigate
cd seaport_terminal_scraper

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Install development tools (optional)
pip install black flake8 isort pytest pytest-asyncio

# Run in development mode
python start.py
```

### Code Formatting

```bash
# Format code with black
black src/

# Sort imports
isort src/

# Lint code
flake8 src/
```

### Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Async tests
pytest -v tests/
```

### Adding New Terminal

1. Create scraper file in `src/terminals/{region}/{terminal}.py`
2. Implement tracking function following pattern:

```python
async def terminal_track_container(container_no: str) -> List[ContainerTrackResult]:
    """Track container at Terminal"""
    # Implementation
    pass
```

3. Register in `src/terminals/__init__.py`:

```python
TERMINAL_SCRAPERS = {
    "TERMINAL": terminal_track_container,
}
```

---

## 📈 Performance Benchmarks

### Latest Performance Results

| Operation | Containers | Time | Throughput |
|-----------|-----------|------|------------|
| Single container (KICT) | 1 | 9.0s | 0.11 req/s |
| Single container (SAPT) | 1 | 8.8s | 0.11 req/s |
| Single container (QICT) | 1 | 0.5s | 2.0 req/s |
| Single container (KGTL) | 1 | 1.7s | 0.59 req/s |
| Bulk (10 containers) | 10 | 15s | 0.67 req/s |
| Bulk (20 containers) | 20 | 25s | 0.80 req/s |

### Optimization Impact

**KICT Terminal Journey:**
- Original: 18.0s
- After HTTP/2 + msgspec: 10.7s (40% faster)
- After parallel requests: 10.0s (6% faster)
- After single-pass parsing: 9.0s (10% faster)
- **Total improvement: 50% faster**

**SAPT Terminal Journey:**
- Original: 10.4s
- After parallel requests + single-pass parsing: 8.8s
- **Total improvement: 15% faster**

---

## 📋 Supported Terminals

| Terminal | Code | Location | Features |
|----------|------|----------|----------|
| Karachi International Container Terminal | KICT | Port Qasim | ✅ Container tracking<br>✅ Vessel schedules<br>✅ Optimized (9.0s) |
| Karachi Gateway Terminal Limited | KGTL | West Wharf | ✅ Container tracking<br>✅ Vessel schedules<br>✅ Ultra-fast (1.7s) |
| Qasim International Container Terminal | QICT | Port Qasim | ✅ Container tracking<br>✅ Vessel schedules<br>✅ Ultra-fast (0.5s) |
| South Asia Pakistan Terminals | SAPT | Port Qasim | ✅ Container tracking<br>✅ Vessel schedules<br>✅ Optimized (8.8s) |

---

## 🔒 Security

### API Key Authentication

```env
# Configure in .env
API_KEYS=key1,key2,key3
ADMIN_API_KEYS=admin1,admin2
```

Usage:
```bash
curl -H "X-API-Key: your-key" http://localhost:8000/api/track/container/...
```

### CORS Configuration

```env
ALLOW_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Rate Limiting

Built-in rate limiting prevents abuse:
- Per-endpoint limits
- Configurable windows
- Returns 429 on limit exceeded

---

## 📝 License

[Your License Here]

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Your Repo]
- Email: [Your Email]
- Documentation: http://localhost:8000/docs

---

## 🎯 Roadmap

### Planned Features
- [ ] Additional terminal support (India, UAE, etc.)
- [ ] Real-time notifications
- [ ] Historical tracking data
- [ ] Advanced analytics dashboard
- [ ] GraphQL API
- [ ] Webhook support

### Performance Targets
- [ ] Sub-second tracking for all terminals
- [ ] 100+ concurrent requests support
- [ ] Redis caching layer
- [ ] Database persistence

---

**Built with ❤️ for the Pakistani freight forwarding community**

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
- **ReDoc Documentation**: http://localhost:8000/redoc (Alternative docs)
- **OpenAPI Spec**: http://localhost:8000/openapi.json

---

*Last Updated: November 22, 2025*
*Version: 2.0.0*
