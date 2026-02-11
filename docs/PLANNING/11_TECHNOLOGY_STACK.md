# 🟦 GROUP 1 — TEXT TOOLS

## ✅ FINAL TECHNOLOGY STACK (AUTHORITATIVE)

---

## 🎯 DESIGN GOAL (Fixed)

> One implementation → used by **UI + API**
> Ultra-fast, deterministic, Unicode-correct
> No wasted backend calls
> Lowest possible memory footprint

---

## 🧠 FINAL ARCHITECTURE (Single Source of Truth)

```
                ┌────────────────────────┐
                │   UI (Web / SaaS)      │
                │  (Next.js / Browser)   │
                └──────────┬─────────────┘
                           │ (optional)
                           │ HTTP
                           ▼
┌────────────────────────────────────────────────┐
│            API GATEWAY (Thin)                  │
│  Auth · Rate Limit · Billing · Logging         │
└──────────┬─────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────┐
│        TEXT TOOL EXECUTION CORE (Rust)         │
│  • Pure functions                              │
│  • Stateless                                   │
│  • Unicode-correct                             │
│  • No auth / no billing / no UI                │
└──────────┬─────────────────────────────────────┘
           │
   ┌───────▼────────┐
   │ Rust → WASM    │  ← UI (browser)
   └────────────────┘

   ┌───────▼────────┐
   │ Rust Native    │  ← API customers
   └────────────────┘
```

---

## 🧩 CORE LOGIC (MANDATORY)

### Language

> **Rust (single codebase)**

### Structure

```
/text-core
  ├── case/
  ├── separators/
  ├── wrappers/
  ├── unicode/
  ├── encoding/
  ├── fun/
  ├── ops/
  └── lib.rs
```

### Characteristics

* Pure functions
* No globals
* No heap growth per request
* Deterministic output (except marked random tools)

---

## 🧪 TOOL CATEGORY → FINAL EXECUTION DECISION

### 1️⃣ Case Conversions

**Execution:** Rust → WASM (UI) + Rust Native (API)

✔ camelCase
✔ snake_case
✔ kebab-case
✔ Machine Case
✔ Humanized Case

**Why:** Unicode-aware, fast, deterministic

---

### 2️⃣ Separators & Joiners

**Execution:**

* UI → Browser JS (OPTIONAL shortcut)
* API → Rust Native (authoritative)

**Reason:**
Tiny operations, but API must be canonical

---

### 3️⃣ Wrappers & Quoting

**Execution:**

* UI → Browser JS
* API → Rust Native

**Reason:**
No Unicode math, but API consistency matters

---

### 4️⃣ Text Styling

**Execution:**

* UI → Browser JS
* API → Rust Native (string wrapper only)

---

### 5️⃣ Unicode & Glyph Transformations

**Execution:** **Rust ONLY**

✔ Small Caps
✔ Superscript
✔ Fullwidth
✔ Mirrored
✔ Mathematical alphabets

**Reason:**
JS Unicode handling is unreliable
Rust = correct grapheme segmentation

---

### 6️⃣ Fun / Expressive Text

**Execution:** **Rust**

✔ Emoji Case
✔ Zalgo
✔ Leet
✔ Meme styles

⚠️ Non-deterministic tools use seeded RNG

---

### 7️⃣ Encoding / Cipher

**Execution:** **Rust**

✔ Base64 / Base32 / Base58 / Base91
✔ ROT13 / ROT47
✔ Atbash / Caesar
✔ Morse / Braille

**Reason:**
Security + correctness + speed

---

### 8️⃣ Text Operations

**Execution:**

* UI → Browser JS (fast feedback)
* API → Rust Native (truth)

✔ Reverse
✔ Count
✔ Extract
✔ Normalize

---

## 🌐 API EXPOSURE (FINAL)

### Protocol

* **REST (required)**
* **gRPC (optional, for enterprise)**

### Endpoint Pattern

```
POST /v1/text/{category}/{tool}
```

### Examples

```
POST /v1/text/case/snake
POST /v1/text/encode/base64
POST /v1/text/unicode/small-caps
POST /v1/text/ops/extract-emails
```

### Payload

```json
{
  "input": "string",
  "options": { }
}
```

---

## 🖥️ UI USAGE (FINAL)

### Execution Routing Policy

**The Golden Rule:**
> **Rust is the ONLY place where logic lives.**  
> **Browser execution (WASM) is an optimization, not an alternative.**  
> **API is always canonical.**

### Decision Matrix: When to Execute Where

| Scenario | Execute Where | Rationale |
|----------|---------------|-----------|
| Input < 100KB, deterministic, no auth | Browser (WASM) | Zero latency, no server cost, instant feedback |
| Input 100KB - 1MB, deterministic | Browser (WASM) with API fallback | Try browser first, fall back to API if OOM |
| Input > 1MB | API (Rust Native) | Browser memory limits, persistence needed |
| User authenticated | API (Rust Native) | Enable history, billing, rate limits |
| Tool requires secrets/API keys | API Only | Security requirement |
| Randomized tools (UUID, Password) | Browser for UI, API for bulk | UI: instant; API: logging + billing |
| Tool result needs persistence | API (Rust Native) | Store in database for retrieval |

### Fallback Behavior

```typescript
// Client-side execution pattern
async function executeTextTool(toolName: string, input: string) {
  // Try WASM first for speed
  if (input.length < 100000 && wasmIsLoaded) {
    try {
      return await wasmModule[toolName](input);
    } catch (error) {
      console.warn('WASM execution failed, falling back to API', error);
    }
  }
  
  // Fall back to API (canonical)
  return await fetch(`/api/v1/text/${toolName}`, {
    method: 'POST',
    body: JSON.stringify({ input }),
    headers: { 'Content-Type': 'application/json' }
  }).then(r => r.json());
}
```

### UI Architecture

### Primary

* **Rust → WASM**
* Runs in browser
* Zero server cost
* Instant response

### Fallback

* UI calls same API endpoints
* Used for:

  * Large text
  * Auth-required tools
  * Paid plans

---

## 📦 BUILD & DELIVERY

### WASM

* `wasm-bindgen`
* `wasm-pack`
* Tree-shaken exports

### Native

* Static Rust binary
* Deployed as:

  * Dedicated service
  * Or embedded in API gateway

---

## ⚙️ PERFORMANCE GUARANTEES

| Metric              | Result               |
| ------------------- | -------------------- |
| Small input latency | **< 1 ms**           |
| Memory (native)     | **3–10 MB**          |
| Memory (WASM)       | **1–3 MB**           |
| Throughput          | **100k+ req/s/core** |
| Unicode correctness | **Yes**              |

---

## 🚫 EXPLICITLY NOT USED

❌ Python
❌ Node.js
❌ Database
❌ Cache
❌ Background jobs
❌ External services

---

## 🧠 FINAL RULE (IMPORTANT)

> **Rust is the ONLY place where logic lives**
> JS is allowed ONLY as a UI convenience
> API and UI must NEVER diverge in behavior

---

## 🏁 FINAL VERDICT (LOCK THIS)

**GROUP 1 FINAL STACK**

| Layer         | Technology             |
| ------------- | ---------------------- |
| Core logic    | **Rust**               |
| UI execution  | **Rust → WASM**        |
| API execution | **Rust Native**        |
| Protocol      | REST (+ gRPC optional) |
| Memory        | Ultra-low              |
| Speed         | Near-native            |

This stack is **correct, scalable, and future-proof**.

---

# 🎨 **MONACO EDITOR INTEGRATION STRATEGY**

## Overview
Monaco Editor is used **client-side only** as a React component, providing a rich code editing experience without server-side dependencies.

## Implementation Architecture

### **Core Strategy**
- **Client-Side Only**: Monaco runs entirely in the browser as a React component
- **Lazy Loading**: Monaco is code-split and lazy-loaded to save ~2MB from initial bundle
- **Fallback**: Prism.js syntax highlighting when Monaco is blocked/fails to load
- **No Server Dependency**: All Monaco features work offline (syntax highlighting, basic autocomplete)

### **Component Structure**
```typescript
// Lazy-loaded Monaco component
const MonacoEditor = React.lazy(() => import('./MonacoEditor'));

function CodeTool() {
  return (
    <Suspense fallback={<PrismEditor />}>
      <MonacoEditor 
        language="typescript"
        theme="vs-dark" // Synced with app theme
        onChange={handleChange}
      />
    </Suspense>
  );
}
```

### **Theme Integration**
- Monaco theme **always matches** the current app theme (light/dark)
- No separate Monaco theme selector
- Theme sync happens via CSS variables: `--vscode-editor-background`, `--vscode-editor-foreground`, etc.
- Custom theme: Use `monaco.editor.defineTheme()` with app theme colors

### **Formatting & Validation Flow**
```
┌─────────────────────────────────────────────────────┐
│         MONACO FORMATTING PATTERN                   │
└─────────────────────────────────────────────────────┘

User Types in Monaco
     │
     │ (Debounced 300-500ms)
     ▼
POST /api/format/{tool}
     │ { code: "...", language: "typescript" }
     ▼
Next.js API Route
     │
     ├─→ TypeScript: Prettier formatter
     ├─→ Python: Black formatter
     ├─→ JSON: Built-in JSON.stringify
     └─→ Rust: rustfmt via FastAPI
     │
     ▼
Response: { formatted: "...", errors: [...] }
     │
     ▼
Monaco Editor
     │
     ├─→ monaco.setValue(formatted)
     └─→ monaco.setModelMarkers(errors) // Red squiggles
```

### **Shared Formatting Logic**
The same formatting logic works with **or without** Monaco:
- **With Monaco**: Rich editor with real-time feedback
- **Without Monaco (Prism.js fallback)**: Syntax highlighting only, formatting still works via API

### **Language Support**
Monaco provides built-in support for:
- JavaScript/TypeScript (IntelliSense, type checking)
- JSON/YAML (schema validation)
- CSS/SCSS (auto-completion)
- HTML/XML (tag matching)
- Markdown (preview mode)
- SQL (syntax highlighting)
- Python/Rust/Go (syntax highlighting, basic autocomplete)

### **Performance Considerations**
- **Bundle Size**: Monaco adds ~2MB gzipped (lazy-loaded)
- **Initial Load**: Delayed via `React.lazy()` + `<Suspense>`
- **Memory**: ~30-50MB per editor instance (reasonable for modern browsers)
- **Fallback**: Prism.js is 5KB, loads instantly if Monaco fails

### **Browser Execution Preference**
When a tool supports both browser and server execution:
1. **Default**: Execute in browser using Monaco's in-memory model
2. **Fallback**: If browser execution fails or is unavailable, call API
3. **Admin Override**: Admin panel can force server execution for specific tools

### **Key Design Decisions**
✅ **Client-side only** — No SSR Monaco (incompatible)
✅ **Lazy-loaded** — Save initial bundle size
✅ **Theme-synced** — Always match app theme
✅ **Prism.js fallback** — Graceful degradation
✅ **Shared formatting** — Same API works with/without Monaco
❌ **No separate Monaco themes** — Reduces complexity
❌ **No server-side Monaco** — Not needed, client-side is sufficient

---

# 🟥 GROUP 2 — FINAL STACK

### 1️⃣ **Light Parsing / Formatting / Validation**

| Layer / Tool                                   | Language / Tech                         | Notes / Reason                                                  |
| ---------------------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| JSON / YAML / CSV Parser                       | **Node.js (TypeScript)**                | Fast parsing, low memory (~30–60 MB), works in server & browser |
| Formatters / Minifiers                         | **Node.js (Prettier / custom parsers)** | AST-safe formatting, can stream output                          |
| Validators (JSON/YAML/CSV)                     | **Node.js (AJV / YAML libs)**           | Real-time validation, integrates with API & Monaco              |
| Regex / Cron / JSONPath Testers                | **Node.js**                             | Lightweight, predictable performance                            |
| Encoding Utilities (HTML Escape, Base64, etc.) | **Node.js / WASM (optional for speed)** | Use WASM for heavy Unicode / Base58 / Base91 conversions        |

✅ **Key idea:** Node.js dominates interactive tooling + Monaco integration, predictable memory, fast dev cycle.

---

### 2️⃣ **AST / Schema / API Tools**

| Tool                                                       | Language    | Notes                                                 |
| ---------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| OpenAPI ↔ TypeScript / JSON Schema                         | **Node.js** | Uses Babel / TS compiler libraries, fast and accurate |
| GraphQL Schema ↔ TypeScript / OpenAPI                      | **Node.js** | GraphQL ecosystem is JS-first                         |
| SQL → JSON Schema / ER Diagram                             | **Node.js** | Node parsers + visualization in browser               |
| Code Transpilers (TS ↔ JS / CoffeeScript ↔ JS / Dart ↔ JS) | **Node.js** | Leverage Babel / TypeScript / SWC                     |

❌ Avoid Rust/Python here — minimal latency gain, high dev cost.

---

### 3️⃣ **Binary / Columnar Formats**

| Tool            | Language / Tech                    | Notes                                       |
| --------------- | ---------------------------------- | ------------------------------------------- |
| Parquet ⇄ JSON  | **Python (pyarrow / fastparquet)** | Memory-heavy (~100–300 MB), I/O bound       |
| Avro / Protobuf | **Python (fastavro / protobuf)**   | Mature, predictable, easier than Rust       |
| NDJSON / JSONL  | **Node.js**                        | Lightweight streaming, fits browser API too |

> **Note:** Binary formats are heavy, async jobs recommended in API mode.

---

### 4️⃣ **DBML / Diagram / File Tree Tools**

| Tool              | Language / Tech                              | Notes                                       |
| ----------------- | -------------------------------------------- | ------------------------------------------- |
| DBML → ER Diagram | **Node.js parser** + **Browser SVG / D3.js** | Node parses schema, browser renders diagram |
| SQL → ER Diagram  | **Node.js parser** + **Browser SVG**         | Same pattern                                |
| File Tree Viewer  | **Browser JS (React / Tree Component)**      | Thin, interactive UI, consumes API only     |

**Monaco Editor Integration Pattern:**

```
┌─────────────────────────────────────────────────────┐
│              MONACO INTEGRATION                     │
└─────────────────────────────────────────────────────┘

Monaco Editor (Browser)
     │
     │ User types/pastes code
     │ (debounced 300-500ms)
     ▼
API Call: POST /api/format/{tool}
     │
     ▼
Node.js Backend
     │ Parse with Prettier/ESLint/AJV/etc.
     │ Format or validate
     │ Return formatted result + errors
     ▼
Response to Browser
     │
     ▼
Monaco.setValue(formattedCode)
Monaco.setModelMarkers(errors)  // Show red squiggles

```

**NOT:** Monaco → Run Node.js in browser (impossible)

**Implementation Example:**
```typescript
// Client-side (React component)
const editor = monaco.editor.create(element, {
  value: code,
  language: 'json',
});

// Debounced format on change
const formatCode = debounce(async (code: string) => {
  const response = await fetch('/api/format/json', {
    method: 'POST',
    body: JSON.stringify({ input: code }),
  });
  
  const { formatted, errors } = await response.json();
  
  if (formatted) {
    editor.setValue(formatted);
  }
  
  if (errors) {
    monaco.editor.setModelMarkers(
      editor.getModel(),
      'validator',
      errors.map(err => ({
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: err.column + err.length,
        message: err.message,
        severity: monaco.MarkerSeverity.Error,
      }))
    );
  }
}, 500);

editor.onDidChangeModelContent(() => {
  formatCode(editor.getValue());
});
```

---

### 5️⃣ **API Patterns (Dual-Mode SaaS + API)**

| Endpoint Type           | Example                    | Notes                                         |
| ----------------------- | -------------------------- | --------------------------------------------- |
| Formatting / Validation | `POST /v1/json/format`     | Input JSON/YAML/CSV → output formatted string |
| Schema / AST            | `POST /v1/openapi/to-ts`   | Input OpenAPI → TypeScript types              |
| Binary / Columnar       | `POST /v1/parquet/convert` | Input Parquet → JSON, returns job_id if large |
| DBML / ER Diagram       | `POST /v1/dbml/diagram`    | Returns diagram SVG / PNG                     |

✅ Both **UI and external API users** call same endpoints.

---

### 6️⃣ **Execution Split (Memory / Performance)**

| Sub-Group               | Language / Runtime | Memory / Latency      |
| ----------------------- | ------------------ | --------------------- |
| Formatters / Validators | Node.js            | 30–60 MB, ~5–20 ms    |
| AST / Schema Transform  | Node.js            | 50–80 MB, 10–30 ms    |
| Binary / Columnar       | Python             | 100–300 MB, I/O bound |
| DBML / File Tree        | Node.js + Browser  | 50–100 MB, real-time  |

---

### 7️⃣ **Other Tech Notes**

* Use **TypeScript** for Node.js for type safety & faster dev.
* For heavy Unicode or encoding, optional **Rust WASM module** can accelerate some tools (Base58, Base91, URL-safe encoding).
* Async-heavy jobs (large files / Parquet / Protobuf) → **background queue + job IDs**.
* Frontend (SaaS) → API consumer, only visualization/UI logic.

---

### ✅ TL;DR — Language Map for Group 2

| Tool Category               | Language / Stack                                     |
| --------------------------- | ---------------------------------------------------- |
| Light parsers & validators  | Node.js (TypeScript)                                 |
| Formatters / AST transforms | Node.js (TS + Babel / SWC)                           |
| Binary / columnar formats   | Python (PyArrow / fastparquet / fastavro / protobuf) |
| Diagrams / Tree             | Node.js parser + Browser SVG / React                 |

> Node.js dominates **interactive, fast tools**, Python only for **I/O-heavy binary formats**, Rust optional for micro-optimizations.

---

# 🟩 GROUP 3 - Final Technology Stack

### 1️⃣ API Layer — Orchestration & Request Handling

| Layer           | Choice                                    | Reason                                                                |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| API Framework   | **Python (FastAPI + Uvicorn / Gunicorn)** | Minimal overhead, async ready, supports streaming, easy orchestration |
| Async Queue     | **Redis Queue (RQ) or Celery + Redis)**   | Offload heavy jobs; async polling pattern; retries & scheduling       |
| Task Management | Job IDs, Status Endpoint                  | Standard async pattern for large files                                |

**Pattern Example**

```text
POST /v1/media/convert       → returns job_id
GET /v1/jobs/{job_id}        → check status / download result
```

---

### 2️⃣ Workers — File & Media Processing

| Category         | Native Tool / Binary                                           | Notes                                       |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Image Conversion | **libvips (C)**                                                | High-speed, low memory, batch-friendly      |
| Video / Audio    | **FFmpeg (C)**                                                 | All common formats, filters, compressions   |
| OCR              | **Tesseract (C++)**                                            | Text extraction from images/PDF             |
| RAW / PSD / AI   | **ImageMagick / psd-tools / Adobe CLI / proprietary binaries** | Orchestrated via CLI calls                  |
| PDF Tools        | **Poppler / MuPDF (C++)**                                      | Merge, split, crop, text extraction, render |
| Archives         | **7zip / libarchive (C)**                                      | Compression / decompression; streaming      |

**Rules**

* Never load full files into Python/JS memory
* Always stream via stdin/stdout pipes
* Use temporary storage / object store for large files

---

### 3️⃣ Storage Layer

| Layer             | Choice                           | Notes                                                        |
| ----------------- | -------------------------------- | ------------------------------------------------------------ |
| Object Storage    | **Cloudflare R2 / AWS S3**       | Large file persistence, supports streaming, cheap & scalable |
| Temporary Storage | OS temp dirs / ephemeral storage | For streaming pipelines only                                 |

---

### 4️⃣ Execution & Streaming

* **Pattern**: `UI/API → FastAPI → Worker → Native binary → Object store → Client`
* **Streaming**: Pipes for stdin/stdout reduce memory spikes
* **Async**: Long-running jobs return `202 Accepted` immediately
* **UI Integration**: Job polling / WebSocket streaming for progress

**Async Job Error Handling & Lifecycle:**

```typescript
// Job state interface
interface MediaJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  result?: {
    url: string;          // Object storage URL
    size: number;
    format: string;
  };
  error?: {
    code: string;         // ERROR_CODES enum
    message: string;      // User-facing message
    details?: any;        // Debug info (internal only)
  };
  progress?: number;      // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;        // Auto-cleanup after 24h
  retryCount: number;
  maxRetries: number;     // Default: 3
}

// Error codes
enum ERROR_CODES {
  INVALID_INPUT = 'INVALID_INPUT',           // Don't retry
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',         // Don't retry
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT', // Don't retry
  PROCESSING_FAILED = 'PROCESSING_FAILED',   // Retry
  WORKER_TIMEOUT = 'WORKER_TIMEOUT',         // Retry
  STORAGE_ERROR = 'STORAGE_ERROR',           // Retry
}

// Retry strategy
const shouldRetry = (error: ERROR_CODES): boolean => {
  const retryable = [
    ERROR_CODES.PROCESSING_FAILED,
    ERROR_CODES.WORKER_TIMEOUT,
    ERROR_CODES.STORAGE_ERROR,
  ];
  return retryable.includes(error);
};

// Exponential backoff
const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
};

// Partial result handling
interface PartialResult {
  completedPages?: number;   // For PDF operations
  processedFrames?: number;  // For video operations
  partialOutput?: string;    // Downloadable partial result
  canResume: boolean;        // Whether job can be resumed
}

// Job cleanup
const cleanupExpiredJobs = async () => {
  // Run every hour
  const expired = await db.jobs.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { in: ['completed', 'failed', 'cancelled'] }
    }
  });
  
  for (const job of expired) {
    // Delete from object storage
    if (job.result?.url) {
      await objectStorage.delete(job.result.url);
    }
    // Delete job record
    await db.jobs.delete({ where: { id: job.id } });
  }
};
```

**API Response Patterns:**

```python
# FastAPI endpoint
@app.post("/v1/media/convert")
async def convert_media(file: UploadFile):
    # Validate immediately
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File size {file.size} exceeds maximum {MAX_FILE_SIZE}",
            }
        )
    
    # Create job
    job = await create_job(file)
    
    # Queue for processing
    await queue.enqueue(process_media, job.id)
    
    # Return 202 Accepted with job ID
    return JSONResponse(
        status_code=202,
        content={
            "job_id": job.id,
            "status": "queued",
            "status_url": f"/v1/jobs/{job.id}",
            "estimated_time": estimate_processing_time(file),
        }
    )

# Job status endpoint
@app.get("/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await db.jobs.get(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "created_at": job.createdAt,
    }
    
    if job.status == "completed":
        response["result"] = {
            "url": job.result.url,
            "expires_at": job.expiresAt,
        }
    elif job.status == "failed":
        response["error"] = job.error
        response["retryable"] = shouldRetry(job.error.code)
    
    return response
```

---

### 5️⃣ UI / API Consumer Layer

* **UI**: Upload files, select conversion options, poll for job completion, download results
* **API Customers**: Same endpoints, same payloads
* **No duplication**: Both UI & API hit **exactly the same FastAPI endpoints**

---

### 6️⃣ Recommended Infrastructure

| Component        | Choice                               | Notes                                    |
| ---------------- | ------------------------------------ | ---------------------------------------- |
| Containerization | Docker + Docker Compose / Kubernetes | Each worker isolated, easy to scale      |
| Queue Broker     | Redis                                | Handles async jobs reliably              |
| Reverse Proxy    | Nginx / Traefik                      | TLS termination, caching for small files |
| Monitoring       | Prometheus + Grafana                 | Track job queues, worker health          |
| Logging          | Structlog / Sentry                   | Track errors in orchestration            |

---

### 7️⃣ Why Not Rust / Node for Core Processing

| Reason       | Explanation                                                      |
| ------------ | ---------------------------------------------------------------- |
| Rust / Node  | Rewriting FFmpeg, Poppler, Tesseract in Rust/JS is **pointless** |
| Memory Usage | Python orchestrates, workers run native binaries efficiently     |
| Latency      | Streaming pipelines already faster than language rewrite         |
| Maintenance  | Existing tools are battle-tested; minimal bugs                   |

---

### ✅ Memory & Speed Guidance

* **Worker memory footprint**: 50MB → 2GB depending on file size
* **API server memory footprint**: 50–150MB (async orchestration)
* **Latency**: CPU-bound tasks dominated by binaries, not Python
* **Scaling**: Horizontally scale workers by file type

---

### 8️⃣ Summary Pattern

```
Client (UI / API) 
  ↓
FastAPI Endpoint (Python) — async job creation
  ↓
Redis / Celery Queue
  ↓
Worker Container — calls Native Binary via streaming pipes
  ↓
Result stored in Object Storage
  ↓
Client fetches result (poll / callback / streaming)
```
---

# 🟨 GROUP 4 — GENERATORS & CALCULATORS (Final Stack)

### 1️⃣ Client-Side (UI / SaaS Frontend)

> **Use browser JS whenever possible** — avoids server load, ultra-low latency.

| Tool Type                     | Complexity | Technology / Language                    | Notes                                                                               |
| ----------------------------- | ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| UUID / Hash / Password        | 🟢         | **Vanilla JS / Web Crypto API**          | Generates instantly in browser, no server needed                                    |
| SEO / Meta Generators         | 🟢         | **Vanilla JS / Node modules (optional)** | Client-side string manipulation; server optional for persistence                    |
| CSS / UI Generators           | 🟢         | **Vanilla JS / Tailwind + JS**           | Real-time preview in browser                                                        |
| Calculators (BMI, GPA, Zakat) | 🟡         | **Vanilla JS**                           | Deterministic, works entirely client-side                                           |
| Inheritance (Islamic)         | 🟡         | **Vanilla JS**                           | Rule-based, deterministic, no server required unless logging or multi-user features |
| Time Zone Conversion          | 🟡         | **Vanilla JS + Luxon / date-fns-tz**     | Lightweight, fast, works entirely in browser                                        |

✅ **Rule of Thumb:** If it’s deterministic, small data, or purely computational → **client-side**.

---

### 2️⃣ API-Only (for SaaS users / external API clients)

> **Backend only when you want to sell the tool as a standalone API**, or for deterministic low-memory execution.

| Tool                                       | Execution / Language  | Notes                                                 |
| ------------------------------------------ | --------------------- | ----------------------------------------------------- |
| Generators (UUID, Hash, Password)          | **Rust** (or Node.js) | Extremely low memory, sub-ms latency, deterministic   |
| Calculators (BMI, GPA, Zakat, Inheritance) | **Rust**              | No floating-point drift, low memory, deterministic    |
| CSS / SEO / Meta Generators                | **Node.js**           | String manipulation, async-friendly for bulk requests |

---

### 3️⃣ API Layer Design (UI + External API unified)

* **Single API surface**: UI calls same API as external customers
* **Auth / Rate-limiting**: Only in API gateway layer
* **Bulk / async support**: Optional for large-scale requests
* **Persistence / Logging**: Only if you want history or billing

**Example Endpoint Patterns**:

```
POST /v1/generator/uuid
POST /v1/generator/password
POST /v1/calculator/bmi
POST /v1/calculator/zakat
POST /v1/seo/meta
POST /v1/css/gradient
```

> UI can call same endpoints via fetch/axios. Rust binaries handle logic for max performance.

---

### 4️⃣ Deployment Recommendation

| Component                            | Language / Stack                                   | Notes                                                               |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| Text / Generators / Calculators Core | **Rust**                                           | Compiled to native, deterministic, tiny RAM (~5–10 MB per instance) |
| SEO / CSS / String Tools             | **Node.js**                                        | Easy string ops, async, bulk-friendly                               |
| API Gateway / Auth / Billing         | **Node.js / FastAPI (Python optional)**            | Handles rate limits, quotas, plan enforcement                       |
| Frontend                             | **React 19 + Next.js 15 + Tailwind 4 + shadcn UI** | Calls API or performs client-side computations directly             |

---

### ✅ Key Advantages

1. **Ultra-low latency**

   * Rust: sub-ms per operation
   * Browser JS: instant for single operations
2. **Minimal RAM footprint**

   * Rust: ~5–10 MB per API worker
   * Node.js: ~30–50 MB per bulk worker
3. **Deterministic results**

   * Rust: no floating-point drift
   * JS: deterministic for calculators / generators
4. **Single source of truth**

   * Same Rust binary or JS module drives both UI & API
5. **Optional server use**

   * Only for persistence, logging, bulk requests, or paid API exposure

---

💡 **Mental Model:**

> “Everything that can run in the browser runs there; everything sold as API runs in Rust/Node. UI is just an API client.”

---
## 🚨 ERROR HANDLING STANDARDS (ALL GROUPS)

### Error Response Contract

**User-Facing Errors (UI):**
```json
{
  "error": "ValidationError",
  "message": "Invalid JSON input: Unexpected token at line 5, column 12",
  "suggestion": "Check for missing commas or closing braces",
  "errorCode": "PARSE_ERROR",
  "field": "input"
}
```

**API Errors (External Customers):**
```json
{
  "error": "ValidationError",
  "message": "Input exceeds maximum size of 10MB",
  "errorCode": "INPUT_TOO_LARGE",
  "statusCode": 400,
  "requestId": "req_abc123def456",
  "docs": "https://api.hsafx.world/docs/errors/INPUT_TOO_LARGE"
}
```

**HTTP Status Code Standards:**
| Code | Usage | Example |
|------|-------|---------|
| 200 | Success | Tool executed successfully |
| 202 | Accepted | Async job queued |
| 400 | Client error | Invalid input, format error |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Rate limit exceeded, plan restriction |
| 404 | Not found | Tool or job not found |
| 413 | Payload too large | File size exceeds limit |
| 422 | Unprocessable | Valid format but semantic error |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Server error | Internal processing failure |
| 503 | Service unavailable | Maintenance or overload |

**Internal Errors (Never Expose to Users):**
```typescript
// Log full details internally
logger.error('Tool execution failed', {
  toolName: 'json-formatter',
  input: input.substring(0, 100), // Truncated for logs
  error: error.stack,
  userId: user?.id,
  timestamp: new Date(),
  environment: process.env.NODE_ENV,
});

// Show generic error to user
return {
  error: 'InternalError',
  message: 'Something went wrong. Please try again.',
  errorCode: 'INTERNAL_ERROR',
  requestId: requestId, // For support reference
};
```

### Error Code Categories

```typescript
// Validation errors (4xx - client's fault)
enum ValidationErrors {
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INPUT_TOO_LARGE = 'INPUT_TOO_LARGE',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
}

// Processing errors (5xx - server's fault, retryable)
enum ProcessingErrors {
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Authentication/Authorization errors (4xx - client's fault)
enum AuthErrors {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PLAN_LIMIT_EXCEEDED = 'PLAN_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
}
```

---
If you want, I can **draw a full dual-stack diagram specifically for GROUP 4**, showing **browser, Rust backend, Node backend, API gateway, and SaaS UI interactions** — so you can literally see how one codebase serves both UI & external API.

Do you want me to do that?
