# 🔀 Tool Execution Router Specification

**Module:** `packages/tool-execution/router.ts`  
**Purpose:** Route tool execution to the correct runtime (WASM, Node.js, Native, Python)

---

## 1. Overview

This router reads tool metadata from [74_TOOL_METADATA_REGISTRY.md](74_TOOL_METADATA_REGISTRY.md) and [31_TOOLS_CLASSIFICATION_GUIDE.md](31_TOOLS_CLASSIFICATION_GUIDE.md) to determine the execution strategy for each tool.

**Execution Flow:**
```
User Input → Router Decision Tree → Execute → Return Result
```

---

## 2. Decision Tree

```typescript
async function routeToolExecution(
  toolId: number,
  input: ToolInput,
  options: ToolOptions,
  userContext: UserContext
): Promise<ToolResult> {
  // Step 1: Get tool metadata
  const tool = await getToolById(toolId);
  
  // Step 2: Validate permissions
  if (!hasPermission(userContext, tool.permissionKey)) {
    throw new PermissionError(`No access to ${tool.name}`);
  }
  
  // Step 3: Check coin balance (if not free tier tool)
  if (tool.coinCost > 0 && userContext.coinBalance < tool.coinCost) {
    throw new InsufficientCoinsError();
  }
  
  // Step 4: Route based on technology
  switch (tool.technology) {
    case 'WASM':
      return await executeWasmTool(tool, input, options);
    
    case 'Node.js':
      return await executeNodeTool(tool, input, options);
    
    case 'Native':
      return await executeNativeTool(tool, input, options, userContext);
    
    case 'Python':
      return await executePythonTool(tool, input, options, userContext);
    
    default:
      throw new UnsupportedTechnologyError(tool.technology);
  }
}
```

---

## 3. WASM Execution Path

**Tools:** 1-191 (Text Converters)  
**Execution:** Client-side, Synchronous  
**Coin Cost:** 0 (Free)

```typescript
import { executeWasmTool } from '@/wasm-bindings/executor';
import type { WasmResponse } from '@/wasm-bindings/types';

async function executeWasmTool(
  tool: ToolMetadata,
  input: string,
  options: ToolOptions
): Promise<ToolResult> {
  try {
    // Map tool ID to WASM function name
    const wasmFunction = getWasmFunctionName(tool.id);
    
    // Execute WASM
    const response: WasmResponse = await executeWasmTool(
      wasmFunction,
      input,
      options
    );
    
    if (!response.success) {
      throw new ToolExecutionError(response.error);
    }
    
    return {
      success: true,
      output: response.result,
      executionTime: 0, // WASM is instant
      metadata: {
        technology: 'WASM',
        cached: false
      }
    };
    
  } catch (error) {
    // Fallback to Node.js if WASM fails to load
    if (error instanceof WasmLoadError && tool.hasNodeFallback) {
      return await executeNodeTool(tool, input, options);
    }
    throw error;
  }
}

// Mapping: Tool ID → WASM function
function getWasmFunctionName(toolId: number): string {
  const mapping: Record<number, string> = {
    1: 'text_uppercase',
    2: 'text_lowercase',
    3: 'text_title_case',
    10: 'text_reverse',
    51: 'base64_encode',
    52: 'base64_decode',
    81: 'hash_md5',
    82: 'hash_sha256',
    // ... (all 191 tools)
  };
  
  return mapping[toolId] || 'unknown';
}
```

---

## 4. Node.js Execution Path

**Tools:** 192-414 (Code Editors, Generators, some Converters)  
**Execution:** Server-side (Next.js API route), Synchronous  
**Coin Cost:** Variable (0-5 coins)

```typescript
async function executeNodeTool(
  tool: ToolMetadata,
  input: ToolInput,
  options: ToolOptions
): Promise<ToolResult> {
  // Call Next.js API route
  const response = await fetch('/api/tools/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      toolId: tool.id,
      input,
      options
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new ToolExecutionError(error.message);
  }
  
  const result: ToolResult = await response.json();
  return result;
}
```

**Next.js API Route:**
```typescript
// app/api/tools/execute/route.ts

import { executeCodeEditor } from '@/lib/tools/code-editor';
import { executeGenerator } from '@/lib/tools/generators';
import { deductCoins } from '@/lib/billing';

export async function POST(req: Request) {
  const { toolId, input, options } = await req.json();
  const user = await authenticate(req);
  
  // Get tool metadata
  const tool = await getToolById(toolId);
  
  // Validate permissions
  if (!hasPermission(user, tool.permissionKey)) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }
  
  // Deduct coins
  if (tool.coinCost > 0) {
    await deductCoins(user.id, tool.coinCost);
  }
  
  // Execute tool
  let result: ToolResult;
  
  if (tool.category === 'CODE_EDITOR') {
    result = await executeCodeEditor(tool, input, options);
  } else if (tool.category === 'GENERATOR') {
    result = await executeGenerator(tool, input, options);
  } else {
    result = await executeGenericNodeTool(tool, input, options);
  }
  
  return Response.json(result);
}
```

---

## 5. Native Execution Path (with Async Jobs)

**Tools:** 298-379 (File Converters)  
**Execution:** Backend service (FastAPI/Python), Asynchronous  
**Coin Cost:** 1-10 coins

```typescript
async function executeNativeTool(
  tool: ToolMetadata,
  input: FileInput,
  options: ToolOptions,
  userContext: UserContext
): Promise<ToolResult> {
  // Step 1: Upload file to R2
  const uploadedFile = await uploadToR2(input.file);
  
  // Step 2: Create async job
  const job = await createAsyncJob({
    toolId: tool.id,
    userId: userContext.userId,
    inputFileUrl: uploadedFile.url,
    options
  });
  
  // Step 3: Submit job to FastAPI backend
  await fetch(`${FASTAPI_BASE_URL}/jobs/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BACKEND_API_KEY
    },
    body: JSON.stringify({
      jobId: job.id,
      toolId: tool.id,
      inputFile: uploadedFile.r2Key,
      options
    })
  });
  
  // Step 4: Return job ID (frontend will poll for status)
  return {
    success: true,
    jobId: job.id,
    status: 'queued',
    message: 'File conversion started. Please wait...'
  };
}
```

**Job Status Polling (Frontend):**
```typescript
// Poll job status every 1s → 2s → 5s → 10s (exponential backoff)
async function pollJobStatus(jobId: string): Promise<ToolResult> {
  let interval = 1000; // Start at 1 second
  const maxInterval = 10000; // Max 10 seconds
  
  while (true) {
    const response = await fetch(`/api/jobs/${jobId}/status`);
    const job: JobStatus = await response.json();
    
    if (job.status === 'completed') {
      return {
        success: true,
        output: {
          downloadUrl: job.resultUrl,
          fileName: job.resultFileName
        }
      };
    }
    
    if (job.status === 'failed') {
      throw new ToolExecutionError(job.error);
    }
    
    // Exponential backoff
    await sleep(interval);
    interval = Math.min(interval * 2, maxInterval);
  }
}
```

---

## 6. Python Execution Path (Async Intelligence)

**Tools:** 446 (Seaport Terminal Tracker)  
**Execution:** Python Backend (FastAPI), Asynchronous  
**Coin Cost:** 5-20 coins

```typescript
async function executePythonTool(
  tool: ToolMetadata,
  input: PythonToolInput,
  options: ToolOptions,
  userContext: UserContext
): Promise<ToolResult> {
  // Create async job
  const job = await createAsyncJob({
    toolId: tool.id,
    userId: userContext.userId,
    input: JSON.stringify(input),
    options
  });
  
  // Submit to Python backend
  await fetch(`${PYTHON_BACKEND_URL}/tools/${tool.id}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BACKEND_API_KEY
    },
    body: JSON.stringify({
      jobId: job.id,
      input,
      options
    })
  });
  
  // Return job ID for polling
  return {
    success: true,
    jobId: job.id,
    status: 'queued',
    message: 'Scraping started. This may take 10-30 seconds...'
  };
}
```

**Example: Container Tracking**
```typescript
// Tool 446: Seaport Terminal Container Tracker
const result = await routeToolExecution(
  446, // Tool ID
  {
    containers: ['CSNU8234026', 'HLXU6412970'],
    terminals: ['KICT', 'QICT']
  },
  { maxConcurrent: 10 },
  userContext
);

// Returns job ID, frontend polls for completion
const jobResult = await pollJobStatus(result.jobId);
// jobResult.output = { containers: [...], summary: {...} }
```

---

## 7. Caching Strategy

```typescript
import { redis } from '@/lib/redis';

async function executeWithCache(
  tool: ToolMetadata,
  input: ToolInput,
  options: ToolOptions
): Promise<ToolResult> {
  // Only cache deterministic, cacheable tools
  if (!tool.deterministic || !tool.cacheable) {
    return await routeToolExecution(tool.id, input, options, userContext);
  }
  
  // Generate cache key
  const cacheKey = `tool:${tool.id}:${hashInput(input, options)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return {
      ...JSON.parse(cached),
      metadata: { cached: true }
    };
  }
  
  // Execute
  const result = await routeToolExecution(tool.id, input, options, userContext);
  
  // Cache result (TTL: 1 hour for most tools)
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
  
  return result;
}

function hashInput(input: ToolInput, options: ToolOptions): string {
  return createHash('sha256')
    .update(JSON.stringify({ input, options }))
    .digest('hex')
    .substring(0, 16);
}
```

---

## 8. Error Handling & Retry Logic

```typescript
async function executeWithRetry(
  tool: ToolMetadata,
  input: ToolInput,
  options: ToolOptions,
  userContext: UserContext,
  maxRetries: number = 3
): Promise<ToolResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await routeToolExecution(tool.id, input, options, userContext);
      
    } catch (error) {
      // Don't retry on these errors
      if (
        error instanceof PermissionError ||
        error instanceof InsufficientCoinsError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      
      // Retry on network/server errors
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential: 2s, 4s, 8s
        await sleep(delay);
        continue;
      }
      
      // Max retries exceeded
      throw new ToolExecutionError(
        `Tool execution failed after ${maxRetries} attempts: ${error.message}`
      );
    }
  }
}
```

---

## 9. Tool Metadata Integration

**Source Files:**
- `30_TOOLS_CATALOG.md` - Tool IDs and names
- `31_TOOLS_CLASSIFICATION_GUIDE.md` - Technology assignments
- `TOOLS_UI_DESIGN.md` - Tool options

```typescript
// Generated from planning docs
export interface ToolMetadata {
  id: number;
  name: string;
  category: ToolCategory;
  technology: 'WASM' | 'Node.js' | 'Native' | 'Python';
  executionType: 'sync' | 'async';
  deterministic: boolean;
  cacheable: boolean;
  coinCost: number;
  permissionKey: string;
  globalLevel: number; // 0-11
  tier: 'A' | 'B' | 'C' | 'D';
  options: ToolOption[];
}

// Auto-generated registry (see 58_TOOL_METADATA_REGISTRY.md)
import { toolRegistry } from '@/generated/tool-registry';

export function getToolById(id: number): ToolMetadata {
  const tool = toolRegistry.find(t => t.id === id);
  if (!tool) {
    throw new ToolNotFoundError(`Tool ${id} not found`);
  }
  return tool;
}
```

---

## 10. Complete Usage Example

```typescript
import { routeToolExecution } from '@/lib/tool-execution/router';
import { getUserContext } from '@/lib/auth';

// Example 1: WASM Tool (Text Uppercase)
const result1 = await routeToolExecution(
  1, // Tool ID
  { text: 'hello world' },
  {},
  await getUserContext()
);
// result1.output = 'HELLO WORLD' (instant)

// Example 2: Node.js Tool (UUID Generator)
const result2 = await routeToolExecution(
  380,
  { count: 5 },
  { version: 'v4' },
  await getUserContext()
);
// result2.output = ['uuid1', 'uuid2', ...] (fast)

// Example 3: Native Tool (PDF to Word)
const result3 = await routeToolExecution(
  320,
  { file: uploadedPdfFile },
  { quality: 'high' },
  await getUserContext()
);
// result3.jobId = 'job_abc123' (async)
const final = await pollJobStatus(result3.jobId);
// final.output.downloadUrl = 'https://r2.../output.docx'

// Example 4: Python Tool (Container Tracking)
const result4 = await routeToolExecution(
  446,
  { containers: ['CSNU1234567'], terminals: ['KICT'] },
  {},
  await getUserContext()
);
// result4.jobId = 'job_xyz789' (async)
```

---

## 11. Monitoring & Logging

```typescript
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

async function routeToolExecutionWithMonitoring(...args) {
  const startTime = Date.now();
  const tool = await getToolById(args[0]);
  
  try {
    const result = await routeToolExecution(...args);
    
    // Log success
    logger.info('Tool execution succeeded', {
      toolId: tool.id,
      technology: tool.technology,
      duration: Date.now() - startTime
    });
    
    // Metrics
    metrics.increment('tool.execution.success', {
      tool: tool.name,
      technology: tool.technology
    });
    
    return result;
    
  } catch (error) {
    // Log error
    logger.error('Tool execution failed', {
      toolId: tool.id,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    // Metrics
    metrics.increment('tool.execution.error', {
      tool: tool.name,
      errorType: error.constructor.name
    });
    
    throw error;
  }
}
```

---

**This router provides unified execution logic for all 446 tools with proper error handling, caching, and monitoring.**
