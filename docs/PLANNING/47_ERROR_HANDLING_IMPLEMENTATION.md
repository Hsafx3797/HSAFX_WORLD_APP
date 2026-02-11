# 47 — Error Handling Implementation

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED

> **Purpose:**  
> Defines error handling strategies, retry logic, error exposure policies, and implementation patterns for both frontend and backend. Ensures consistent error handling across 446 tools and all system components.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Error Classification](#2-error-classification)
3. [Error Exposure Policy](#3-error-exposure-policy)
4. [Retry Logic](#4-retry-logic)
5. [Frontend Error Handling](#5-frontend-error-handling)
6. [Backend Error Handling](#6-backend-error-handling)
7. [WASM Error Handling](#7-wasm-error-handling)
8. [Database Error Handling](#8-database-error-handling)
9. [External Service Errors](#9-external-service-errors)
10. [Error Logging](#10-error-logging)
11. [User-Facing Error Messages](#11-user-facing-error-messages)
12. [Admin Error Monitoring](#12-admin-error-monitoring)

---

## 1. Overview

### 1.1 Error Handling Philosophy

**User Experience First:**
- Show specific errors for user mistakes (validation, input format)
- Show generic errors for system failures (protect implementation details)
- Always provide actionable guidance ("Try again" vs "Contact support")
- Never expose stack traces or internal error codes to end users

**Developer Experience:**
- Log all errors with full context (stack trace, request ID, user ID, tool ID)
- Structured error objects for easy parsing
- Correlation IDs for tracing errors across services
- Clear distinction between expected and unexpected errors

### 1.2 Error Categories

**Reference:** [24_ERROR_HANDLING.md](24_ERROR_HANDLING.md) defines 50+ specific error codes.

| Category | User Facing | Retryable | Example |
|----------|-------------|-----------|---------|
| **Validation** | ✅ Specific | ❌ No | "Invalid JSON format on line 5" |
| **Authorization** | ✅ Specific | ❌ No | "Upgrade to Pro to use this tool" |
| **Rate Limit** | ✅ Specific | ✅ Yes (after delay) | "Rate limit exceeded. Retry in 30s" |
| **Input Processing** | ✅ Specific | ❌ No | "File size exceeds plan limit" |
| **System** | ❌ Generic | ✅ Yes | "Something went wrong. Please try again" |
| **Network** | ❌ Generic | ✅ Yes | "Request failed. Please try again" |
| **Database** | ❌ Generic | ✅ Yes | "Database temporarily unavailable" |

---

## 2. Error Classification

### 2.1 Expected Errors (4xx)

**Definition:** Errors caused by user input or business logic constraints.

**Examples:**
- Invalid input format
- Missing required fields
- Exceeding plan limits
- Unauthorized access
- Rate limit exceeded

**Handling:**
- Show specific error message to user
- Do NOT retry automatically
- Log at `warn` level (not critical)
- Provide clear remediation steps

---

### 2.2 Unexpected Errors (5xx)

**Definition:** Errors caused by system failures or bugs.

**Examples:**
- Database connection failure
- External API timeout
- Unhandled exceptions
- Out of memory
- Network errors

**Handling:**
- Show generic error message to user
- Retry automatically (with exponential backoff)
- Log at `error` level with full stack trace
- Alert admin if error rate exceeds threshold

---

### 2.3 Transient Errors

**Definition:** Temporary failures that may succeed on retry.

**Examples:**
- Network timeout
- Redis connection error
- Database deadlock
- External API 503 Service Unavailable

**Handling:**
- Retry up to 3 times with exponential backoff
- Show loading state during retries
- Fall back to error message if all retries fail
- Log retry attempts for debugging

---

## 3. Error Exposure Policy

### 3.1 Validation Errors (Show Specific Details)

**User Input Errors:**
```typescript
// ✅ GOOD: Specific validation error
throw new ValidationError({
  code: "INVALID_JSON",
  message: "Invalid JSON format",
  details: "Unexpected token '}' at line 5, column 12",
  field: "input",
});

// User sees:
// "Invalid JSON format: Unexpected token '}' at line 5, column 12"
```

**Plan Limit Errors:**
```typescript
// ✅ GOOD: Specific limit error
throw new PlanLimitError({
  code: "TOOL_LOCKED",
  message: "This tool requires a Pro subscription",
  upgrade_url: "/pricing",
  required_plan: "PRO",
});

// User sees:
// "This tool requires a Pro subscription. [Upgrade Now]"
```

---

### 3.2 System Errors (Show Generic Messages)

**Database Errors:**
```typescript
// ❌ BAD: Exposes implementation details
throw new Error("PostgreSQL connection refused on port 5432");

// ✅ GOOD: Generic message
throw new SystemError({
  code: "DATABASE_ERROR",
  message: "Unable to process request. Please try again.",
  internalMessage: "PostgreSQL connection refused on port 5432",
  retryable: true,
});

// User sees:
// "Unable to process request. Please try again."

// Developer logs see:
// "PostgreSQL connection refused on port 5432"
```

**External API Errors:**
```typescript
// ❌ BAD: Exposes third-party service
throw new Error("Stripe API returned 500 Internal Server Error");

// ✅ GOOD: Generic message
throw new SystemError({
  code: "PAYMENT_PROCESSING_ERROR",
  message: "Payment processing temporarily unavailable",
  internalMessage: "Stripe API returned 500 Internal Server Error",
  retryable: true,
});
```

---

## 4. Retry Logic

### 4.1 Retry Strategy

**Reference:** User specified "3 retries max with exponential backoff for transient errors"

**Implementation:**
```typescript
// src/lib/retry.ts
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,        // 1 second
  maxDelay: 10000,           // 10 seconds
  backoffMultiplier: 2,      // Double delay each retry
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry: (error: any) => boolean = isTransientError
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not transient
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Don't wait after last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms`, {
        error: error.message,
      });
      
      // Wait before retry
      await sleep(delay);
      
      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  // All retries failed
  throw new Error(`Operation failed after ${config.maxAttempts} attempts: ${lastError.message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

### 4.2 Transient Error Detection

**Implementation:**
```typescript
export function isTransientError(error: any): boolean {
  // Network errors
  if (error.code === "ECONNREFUSED") return true;
  if (error.code === "ETIMEDOUT") return true;
  if (error.code === "ENOTFOUND") return true;
  
  // HTTP 5xx errors (server-side)
  if (error.status >= 500 && error.status < 600) return true;
  
  // HTTP 429 (rate limit) - retry after delay
  if (error.status === 429) return true;
  
  // Redis errors
  if (error.message?.includes("Redis connection")) return true;
  if (error.message?.includes("READONLY")) return true;
  
  // Database errors
  if (error.code === "ECONNRESET") return true;
  if (error.code === "ER_LOCK_WAIT_TIMEOUT") return true;
  if (error.message?.includes("deadlock")) return true;
  
  // Default: not transient
  return false;
}
```

---

### 4.3 Retry Examples

**Database Query:**
```typescript
const user = await withRetry(
  () => db.select().from(users).where(eq(users.id, userId)).limit(1),
  DEFAULT_RETRY_CONFIG
);
```

**External API Call:**
```typescript
const stripeCustomer = await withRetry(
  () => stripe.customers.create({ email: user.email }),
  { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 } // Only retry once for Stripe
);
```

**Redis Operation:**
```typescript
const cached = await withRetry(
  () => redis.get(key),
  { maxAttempts: 2, initialDelay: 500, maxDelay: 1000, backoffMultiplier: 2 }
);
```

---

## 5. Frontend Error Handling

### 5.1 Error Boundary (React)

**Implementation:**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Log to external service (post-MVP)
    // logErrorToSentry(error, errorInfo);
  }
  
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.reset);
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please refresh the page.</p>
          <button onClick={this.reset}>Try Again</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**Usage:**
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### 5.2 API Error Handling

**Client-Side API Wrapper:**
```typescript
// src/lib/api-client.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        response.status,
        error.code || "UNKNOWN_ERROR",
        error.message || "An error occurred",
        error.details
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error or JSON parse error
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Unable to connect to server. Please check your internet connection."
    );
  }
}
```

**Usage in Components:**
```tsx
// src/app/tools/[toolId]/page.tsx
"use client";

import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";

export default function ToolPage({ params }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  async function handleExecute(input: string) {
    setError(null);
    setLoading(true);
    
    try {
      const result = await apiRequest(`/tools/${params.toolId}/execute`, {
        method: "POST",
        body: JSON.stringify({ input }),
      });
      
      // Handle success
      console.log("Result:", result);
    } catch (err) {
      if (err instanceof ApiError) {
        // Show specific error message from API
        setError(err.message);
        
        // Handle specific error codes
        if (err.code === "TOOL_LOCKED") {
          // Show upgrade prompt
        } else if (err.code === "RATE_LIMIT_EXCEEDED") {
          // Show rate limit message with countdown
        }
      } else {
        // Generic error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {/* Tool UI */}
    </div>
  );
}
```

---

### 5.3 Form Validation Errors

**Implementation:**
```typescript
// src/lib/validation.ts
import { z } from "zod";

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  }
  
  return errors;
}

// Usage in form
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

try {
  const data = schema.parse(formData);
  // Submit form
} catch (err) {
  if (err instanceof z.ZodError) {
    const fieldErrors = formatZodErrors(err);
    setErrors(fieldErrors);
    // Display errors next to form fields
  }
}
```

---

## 6. Backend Error Handling

### 6.1 API Route Error Handler (Next.js)

**Implementation:**
```typescript
// src/lib/api-error-handler.ts
import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleApiError(error: any): NextResponse {
  // Log error with full context
  console.error("API Error:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
  });
  
  // Known application error
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          retryable: error.retryable,
        },
      },
      { status: error.statusCode }
    );
  }
  
  // Zod validation error
  if (error.name === "ZodError") {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }
  
  // Database error (generic message)
  if (error.code?.startsWith("ER_") || error.code?.startsWith("PG_")) {
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_ERROR",
          message: "A database error occurred. Please try again.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
  
  // Generic error (hide details)
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
        retryable: true,
      },
    },
    { status: 500 }
  );
}
```

**Usage in API Routes:**
```typescript
// src/app/api/tools/[toolId]/execute/route.ts
import { handleApiError, AppError } from "@/lib/api-error-handler";

export async function POST(req: Request, { params }) {
  try {
    // Validate input
    const { input, options } = await req.json();
    
    if (!input) {
      throw new AppError(
        400,
        "MISSING_INPUT",
        "Input is required",
        { field: "input" }
      );
    }
    
    // Check plan limits
    const hasAccess = await checkToolAccess(session.user, params.toolId);
    if (!hasAccess) {
      throw new AppError(
        403,
        "TOOL_LOCKED",
        "This tool requires a Pro subscription",
        { required_plan: "PRO", upgrade_url: "/pricing" }
      );
    }
    
    // Execute tool
    const result = await executeTool(params.toolId, input, options);
    
    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 6.2 FastAPI Error Handler (Python)

**Implementation:**
```python
# fastapi/lib/error_handler.py
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict = None,
        retryable: bool = False
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}
        self.retryable = retryable
        super().__init__(self.message)

async def error_handler(request: Request, exc: Exception):
    """Global error handler for FastAPI"""
    
    # Log error with full context
    logger.error(f"API Error: {exc}", exc_info=True, extra={
        "path": request.url.path,
        "method": request.method,
        "client": request.client.host,
    })
    
    # Known application error
    if isinstance(exc, AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "retryable": exc.retryable,
                }
            }
        )
    
    # HTTPException (FastAPI)
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                }
            }
        )
    
    # Generic error (hide details)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again.",
                "retryable": True,
            }
        }
    )

# Register in main.py
from fastapi import FastAPI
app = FastAPI()
app.add_exception_handler(Exception, error_handler)
```

**Usage:**
```python
# fastapi/tools/file/resize.py
from lib.error_handler import AppError

async def resize_image(file: UploadFile, width: int, height: int, user_plan: str):
    # Get plan-specific file size limit
    max_size = get_file_size_limit('IMAGE', user_plan)
    
    # Validate file size
    file_size = await get_file_size(file)
    if file_size > max_size:
        raise AppError(
            status_code=413,
            code="FILE_TOO_LARGE",
            message=f"File size exceeds {max_size / 1024 / 1024:.0f}MB limit for {user_plan} plan",
            details={
                "plan": user_plan,
                "max_size": f"{max_size / 1024 / 1024:.0f}MB",
                "actual_size": f"{file_size / 1024 / 1024:.2f}MB"
            }
        )
    
    # Process file
    result = await process_image(file, width, height)
    return result
```

---

## 7. WASM Error Handling

### 7.1 Rust Error Handling

**Implementation:**
```rust
// rust/text-tools/src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ToolResult {
    success: bool,
    output: String,
    error_code: Option<String>,
    error_message: Option<String>,
}

#[wasm_bindgen]
impl ToolResult {
    pub fn success(output: String) -> Self {
        Self {
            success: true,
            output,
            error_code: None,
            error_message: None,
        }
    }
    
    pub fn error(code: String, message: String) -> Self {
        Self {
            success: false,
            output: String::new(),
            error_code: Some(code),
            error_message: Some(message),
        }
    }
}

#[wasm_bindgen]
pub fn uppercase(input: &str) -> ToolResult {
    if input.is_empty() {
        return ToolResult::error(
            "EMPTY_INPUT".to_string(),
            "Input cannot be empty".to_string()
        );
    }
    
    ToolResult::success(input.to_uppercase())
}
```

**JavaScript Bridge:**
```typescript
// src/lib/wasm-executor.ts
import init, { uppercase } from "@/wasm/text-tools";

let wasmInitialized = false;

export async function executeWasmTool(toolId: string, input: string): Promise<string> {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
  
  try {
    const result = uppercase(input); // Example tool
    
    if (!result.success) {
      throw new AppError(
        400,
        result.error_code || "WASM_ERROR",
        result.error_message || "WASM execution failed"
      );
    }
    
    return result.output;
  } catch (error) {
    // WASM panic or unexpected error
    throw new AppError(
      500,
      "WASM_PANIC",
      "Tool execution failed unexpectedly",
      { internalError: error.message },
      true // Retryable
    );
  }
}
```

---

## 8. Database Error Handling

### 8.1 Drizzle ORM Error Handling

**Implementation:**
```typescript
// src/lib/db-error-handler.ts
export function handleDbError(error: any): never {
  // PostgreSQL error codes
  if (error.code === "23505") {
    // Unique violation
    throw new AppError(
      409,
      "DUPLICATE_RECORD",
      "A record with this value already exists",
      { field: error.constraint }
    );
  }
  
  if (error.code === "23503") {
    // Foreign key violation
    throw new AppError(
      400,
      "INVALID_REFERENCE",
      "Referenced record does not exist",
      { constraint: error.constraint }
    );
  }
  
  if (error.code === "23502") {
    // Not null violation
    throw new AppError(
      400,
      "MISSING_REQUIRED_FIELD",
      "Required field is missing",
      { field: error.column }
    );
  }
  
  // Connection errors (retryable)
  if (error.code === "ECONNREFUSED" || error.code === "ECONNRESET") {
    throw new AppError(
      503,
      "DATABASE_UNAVAILABLE",
      "Database temporarily unavailable. Please try again.",
      undefined,
      true // Retryable
    );
  }
  
  // Generic database error
  throw new AppError(
    500,
    "DATABASE_ERROR",
    "A database error occurred. Please try again.",
    undefined,
    true // Retryable
  );
}
```

**Usage:**
```typescript
try {
  await db.insert(users).values({ email: "user@example.com" });
} catch (error) {
  handleDbError(error);
}
```

---

## 9. External Service Errors

### 9.1 Stripe Error Handling

**Implementation:**
```typescript
// src/lib/stripe-error-handler.ts
import Stripe from "stripe";

export function handleStripeError(error: any): never {
  if (error instanceof Stripe.errors.StripeCardError) {
    // Card declined
    throw new AppError(
      402,
      "CARD_DECLINED",
      error.message,
      { decline_code: error.decline_code }
    );
  }
  
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    // Too many requests to Stripe API
    throw new AppError(
      429,
      "STRIPE_RATE_LIMIT",
      "Too many requests. Please try again later.",
      undefined,
      true // Retryable
    );
  }
  
  if (error instanceof Stripe.errors.StripeAPIError) {
    // Stripe service error
    throw new AppError(
      503,
      "PAYMENT_SERVICE_UNAVAILABLE",
      "Payment processing temporarily unavailable",
      undefined,
      true // Retryable
    );
  }
  
  // Generic Stripe error
  throw new AppError(
    500,
    "PAYMENT_ERROR",
    "Payment processing failed. Please try again."
  );
}
```

---

### 9.2 Redis Error Handling

**Implementation:**
```typescript
// src/lib/redis-error-handler.ts
export async function safeRedisGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    // Fallback: Return null (cache miss)
    return null;
  }
}

export async function safeRedisSet(key: string, value: string, ttl: number): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error("Redis set error:", error);
    // Swallow error (caching is non-critical)
  }
}
```

**Pattern:** Redis errors should not break core functionality. Use fallbacks.

---

## 10. Error Logging

### 10.1 Structured Logging

**Implementation:**
```typescript
// src/lib/logger.ts
export interface LogContext {
  userId?: string;
  toolId?: string;
  requestId?: string;
  [key: string]: any;
}

export function logError(error: Error, context: LogContext = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
  };
  
  // Development: Log to console
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", logEntry);
  }
  
  // Production: Send to external service (post-MVP)
  // await sendToSentry(logEntry);
  
  // Store in database for admin panel
  await db.insert(error_logs).values({
    user_id: context.userId,
    tool_id: context.toolId,
    request_id: context.requestId,
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    context_data: context,
    created_at: new Date(),
  });
}
```

**Usage:**
```typescript
try {
  await executeTool(toolId, input);
} catch (error) {
  await logError(error, {
    userId: session.user.id,
    toolId,
    requestId: req.headers.get("x-request-id"),
  });
  throw error;
}
```

---

## 11. User-Facing Error Messages

### 11.1 Error Message Guidelines

**DO:**
- Explain what went wrong in plain language
- Provide actionable next steps
- Include relevant context (limits, requirements)
- Use friendly, non-technical tone

**DON'T:**
- Expose technical details or stack traces
- Use jargon or error codes
- Blame the user ("You did X wrong")
- Be vague ("Error occurred")

---

### 11.2 Error Message Examples

**Good Examples:**

| Scenario | Good Message | Bad Message |
|----------|--------------|-------------|
| File too large | "File size exceeds your plan's limit. Please choose a smaller file or upgrade your plan." | "File upload failed" |
| Invalid JSON | "Invalid JSON format: Missing closing brace on line 5" | "Parse error" |
| Rate limit | "You've reached the 2 requests/minute limit. Please wait 30 seconds." | "429 Too Many Requests" |
| Auth required | "Sign in to use this tool" | "Unauthorized: 401" |
| Plan upgrade | "This tool requires a Pro subscription. Upgrade now to unlock it." | "Access denied: TOOL_LOCKED" |

---

## 12. Admin Error Monitoring

### 12.1 Error Dashboard

**Implementation:**
```typescript
// src/app/admin/errors/page.tsx
export default async function ErrorsPage() {
  const recentErrors = await db.select()
    .from(error_logs)
    .orderBy(desc(error_logs.created_at))
    .limit(100);
  
  const errorsByType = await db.select({
    error_name: error_logs.error_name,
    count: sql<number>`count(*)`,
  })
    .from(error_logs)
    .groupBy(error_logs.error_name)
    .orderBy(desc(sql`count(*)`));
  
  return (
    <div>
      <h1>Error Monitoring</h1>
      <ErrorStats errors={errorsByType} />
      <ErrorList errors={recentErrors} />
    </div>
  );
}
```

**Database Schema:**
```sql
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  tool_id VARCHAR(50),
  request_id VARCHAR(100),
  error_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_name ON error_logs(error_name);
```

---

## 13. Notes for AI Agent

**When Implementing Error Handling:**
- **ALWAYS** use AppError for known errors
- **ALWAYS** include error codes for tracking
- **NEVER** expose stack traces to users
- **ALWAYS** log errors with full context
- Show specific messages for validation errors
- Show generic messages for system errors
- Retry transient errors automatically (max 3 attempts)
- Use exponential backoff for retries
- Handle edge cases gracefully
- Provide actionable error messages

**Testing Error Scenarios:**
```typescript
// Test validation error
test("Returns 400 for invalid input", async () => {
  const response = await apiRequest("/tools/uppercase/execute", {
    method: "POST",
    body: JSON.stringify({ input: "" }),
  });
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe("EMPTY_INPUT");
});

// Test retry logic
test("Retries transient errors", async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) throw new Error("ECONNREFUSED");
    return "success";
  };
  
  const result = await withRetry(operation);
  expect(result).toBe("success");
  expect(attempts).toBe(3);
});
```

---

**Total Pages:** 13  
**Status:** ✅ Production-Ready Strategy
