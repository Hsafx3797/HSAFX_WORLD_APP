# 🚨 ERROR HANDLING SPECIFICATION

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ APPROVED

> **Purpose:**  
> Complete error taxonomy, HTTP status codes, internal error codes, retry logic, alert thresholds, and user messaging strategy.

---

## Table of Contents

1. [Overview](#1-overview)
2. [HTTP Status Code Taxonomy](#2-http-status-code-taxonomy)
3. [Internal Error Codes](#3-internal-error-codes)
4. [Retry Logic](#4-retry-logic)
5. [User Messaging Strategy](#5-user-messaging-strategy)
6. [Alert Thresholds](#6-alert-thresholds)
7. [Error Response Format](#7-error-response-format)
8. [Language Support](#8-language-support)
9. [Implementation Examples](#9-implementation-examples)

---

## 1. Overview

### 1.1 Error Handling Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│             ERROR HANDLING ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

User Action
     │
     ├─→ Client Validation (Instant feedback)
     │     └─→ Field errors, format checks
     │
     ├─→ API Request
     │     │
     │     ├─→ Rate Limit Check (Fast fail)
     │     ├─→ Authentication Check
     │     ├─→ Authorization Check
     │     ├─→ Business Logic
     │     └─→ External Service Call
     │           │
     │           ├─→ Retry (transient errors)
     │           └─→ Fail (permanent errors)
     │
     └─→ Response
           │
           ├─→ Success: User sees result
           ├─→ User Error (4xx): Clear message + fix suggestion
           ├─→ Server Error (5xx): Apology + retry later
           └─→ Critical Error: Dashboard alert + email
```

### 1.2 Error Categories

| Category | HTTP Range | User Sees | Dev/Admin Sees | Retry? |
|----------|------------|-----------|----------------|--------|
| **Client Errors** | 400-499 | Clear fix suggestion | Error code + details | No (fix input) |
| **Server Errors** | 500-599 | "Try again later" | Stack trace + context | Yes (automatic) |
| **Rate Limit** | 429 | Countdown timer + upgrade CTA | IP/User + rate exceeded | Yes (after delay) |
| **Authentication** | 401 | "Please log in" | Token/Session expired | No (redirect) |
| **Authorization** | 403 | "Upgrade plan" or "Access denied" | Permission check failed | No (upgrade) |

---

## 2. HTTP Status Code Taxonomy

### 2.1 Success Codes (2xx)

| Code | Name | When | Response Body |
|------|------|------|---------------|
| 200 | OK | Standard success | `{ success: true, data: {...} }` |
| 201 | Created | Resource created | `{ success: true, data: {id: "..."}, message: "Created" }` |
| 202 | Accepted | Async job started | `{ success: true, jobId: "...", message: "Processing" }` |
| 204 | No Content | Delete/Update success | Empty body |

### 2.2 Client Error Codes (4xx)

| Code | Name | When | User Message | Internal Code |
|------|------|------|--------------|---------------|
| 400 | Bad Request | Invalid input format | "Please check your input and try again." | `E001-E099` |
| 401 | Unauthorized | Not logged in / Invalid token | "Please log in to continue." | `A001` |
| 402 | Payment Required | Insufficient coins/plan | "Insufficient coins. Purchase more to continue." | `B001-B099` |
| 403 | Forbidden | Plan doesn't allow feature | "This feature requires a Pro plan. Upgrade to access." | `B100-B199` |
| 404 | Not Found | Resource doesn't exist | "We couldn't find what you're looking for." | `E100` |
| 409 | Conflict | Duplicate / Concurrent update | "This resource was already updated. Please refresh." | `E101` |
| 413 | Payload Too Large | File size exceeded | "File size exceeds limit. Maximum: 50MB." | `F001` |
| 415 | Unsupported Media | Wrong file type | "Unsupported file type. Allowed: PDF, DOCX, XLSX." | `F002` |
| 422 | Unprocessable Entity | Validation failed | "Validation failed. [field]: [error message]" | `E102-E199` |
| 429 | Too Many Requests | Rate limit exceeded | "Too many requests. Try again in [X] seconds." | `R001-R099` |

### 2.3 Server Error Codes (5xx)

| Code | Name | When | User Message | Internal Code | Alert? |
|------|------|------|--------------|---------------|--------|
| 500 | Internal Server Error | Unexpected error | "Something went wrong. Please try again later." | `S001` | ✅ Yes (immediate) |
| 502 | Bad Gateway | External service failed | "A service we depend on is unavailable. Try again later." | `S002` | ✅ Yes (>10 errors/min) |
| 503 | Service Unavailable | Maintenance / Overload | "We're temporarily down for maintenance." | `S003` | ⚠️ Manual only |
| 504 | Gateway Timeout | External service timeout | "Request timed out. Please try again." | `S004` | ✅ Yes (>20 errors/min) |

---

## 3. Internal Error Codes

### 3.1 Code Format

```
[Category][Number]

Category:
  A = Authentication
  B = Billing
  E = Input/Entity errors
  F = File errors
  R = Rate limiting
  S = Server errors
  I = Integration (external services)

Number: 001-999 (sequential within category)
```

### 3.2 Complete Error Code List

#### Authentication Errors (A001-A099)

| Code | Description | HTTP | User Message |
|------|-------------|------|--------------|
| A001 | No session/token | 401 | "Please log in to continue." |
| A002 | Token expired | 401 | "Your session expired. Please log in again." |
| A003 | Invalid token format | 401 | "Authentication failed. Please log in again." |
| A004 | User account suspended | 403 | "Your account has been suspended. Contact support." |
| A005 | User account deleted | 403 | "This account no longer exists." |

#### Billing Errors (B001-B199)

| Code | Description | HTTP | User Message |
|------|-------------|------|--------------|
| B001 | Insufficient coins | 402 | "Insufficient coins. Purchase more to continue." |
| B002 | No active subscription | 402 | "This feature requires an active subscription." |
| B003 | Subscription expired | 402 | "Your subscription expired. Renew to continue." |
| B004 | Payment method failed | 402 | "Payment failed. Update your payment method." |
| B005 | Coin transaction failed | 500 | "Failed to process coins. Please try again." |
| B100 | Feature not in plan | 403 | "This feature requires a Pro plan. Upgrade to access." |
| B101 | Usage limit exceeded | 403 | "You've reached your plan's usage limit. Upgrade for more." |
| B102 | Anonymous user limit | 403 | "Sign up to continue using this tool." |
| B103 | Daily limit exceeded | 429 | "Daily limit reached. Try again tomorrow or upgrade." |

#### Input/Entity Errors (E001-E199)

| Code | Description | HTTP | User Message |
|------|-------------|------|--------------|
| E001 | Invalid JSON | 400 | "Invalid JSON format. Please check your input." |
| E002 | Invalid YAML | 400 | "Invalid YAML format. Please check your input." |
| E003 | Invalid CSV | 400 | "Invalid CSV format. Please check your file." |
| E004 | Invalid XML | 400 | "Invalid XML format. Please check your input." |
| E005 | Invalid SQL | 400 | "Invalid SQL syntax. Please check your query." |
| E006 | Invalid regex | 400 | "Invalid regular expression. Please check your pattern." |
| E007 | Invalid cron expression | 400 | "Invalid cron expression. Use format: * * * * *" |
| E008 | Invalid date format | 400 | "Invalid date format. Use: YYYY-MM-DD" |
| E009 | Invalid URL | 400 | "Invalid URL format. Include http:// or https://" |
| E010 | Invalid email | 400 | "Invalid email format." |
| E100 | Resource not found | 404 | "We couldn't find what you're looking for." |
| E101 | Resource conflict | 409 | "This resource was already updated. Please refresh." |
| E102 | Validation failed | 422 | "Validation failed. [field]: [error message]" |
| E103 | Missing required field | 422 | "Required field missing: [field]" |
| E104 | Field value too long | 422 | "[Field] exceeds maximum length of [X] characters." |
| E105 | Field value too short | 422 | "[Field] must be at least [X] characters." |
| E106 | Field value out of range | 422 | "[Field] must be between [X] and [Y]." |

#### File Errors (F001-F099)

| Code | Description | HTTP | User Message |
|------|-------------|------|--------------|
| F001 | File too large | 413 | "File size exceeds limit. Maximum: [X]MB." |
| F002 | Unsupported file type | 415 | "Unsupported file type. Allowed: [types]" |
| F003 | Virus detected | 403 | "Security scan detected a threat. Upload rejected." |
| F004 | File corrupt | 422 | "File appears corrupted. Please try a different file." |
| F005 | Upload failed | 500 | "File upload failed. Please try again." |
| F006 | File processing failed | 500 | "Failed to process file. Please try again." |
| F007 | File not found | 404 | "File not found. It may have expired." |

#### Rate Limiting Errors (R001-R099)

| Code | Description | HTTP | User Message | Retry-After |
|------|-------------|------|--------------|-------------|
| R001 | IP rate limit exceeded | 429 | "Too many requests. Try again in [X] seconds." | `X` seconds |
| R002 | User rate limit exceeded | 429 | "You've made too many requests. Try again in [X] seconds." | `X` seconds |
| R003 | Tool rate limit exceeded | 429 | "This tool is rate-limited. Try again in [X] seconds." | `X` seconds |
| R004 | API key rate limit exceeded | 429 | "API key rate limit exceeded. Upgrade for higher limits." | `X` seconds |
| R005 | Concurrent job limit | 429 | "Too many jobs running. Wait for one to finish." | `30` seconds |

#### Server Errors (S001-S099)

| Code | Description | HTTP | User Message | Alert? |
|------|-------------|------|--------------|--------|
| S001 | Unexpected error | 500 | "Something went wrong. Please try again later." | ✅ Yes |
| S002 | Database error | 500 | "Database error. Our team has been notified." | ✅ Yes |
| S003 | Redis error | 500 | "Cache error. Please try again." | ✅ Yes |
| S004 | External service error | 502 | "A service we depend on is unavailable." | ✅ Yes (>10/min) |
| S005 | External service timeout | 504 | "Request timed out. Please try again." | ✅ Yes (>20/min) |
| S006 | Service overloaded | 503 | "We're experiencing high traffic. Try again in a moment." | ✅ Yes (>50/min) |

#### Integration Errors (I001-I099)

| Code | Description | HTTP | User Message | Alert? |
|------|-------------|------|--------------|--------|
| I001 | Stripe API error | 502 | "Payment service unavailable. Try again later." | ✅ Yes (>5/min) |
| I002 | Polar API error | 502 | "Billing service unavailable. Try again later." | ✅ Yes (>5/min) |
| I003 | Uploadthing error | 502 | "File upload service unavailable. Try again later." | ✅ Yes (>5/min) |
| I004 | R2 storage error | 502 | "Storage service unavailable. Try again later." | ✅ Yes (>5/min) |
| I005 | Redis (Upstash) error | 502 | "Cache service unavailable. Try again." | ✅ Yes (>10/min) |

---

## 4. Retry Logic

### 4.1 Automatic Retry Strategy

```typescript
// Retry configuration per error type
const retryConfig = {
  // Server errors (5xx) - retry with exponential backoff
  500: { maxRetries: 3, backoff: "exponential", initialDelay: 1000 },
  502: { maxRetries: 5, backoff: "exponential", initialDelay: 500 },
  503: { maxRetries: 3, backoff: "linear", initialDelay: 2000 },
  504: { maxRetries: 4, backoff: "exponential", initialDelay: 1000 },

  // Rate limiting (429) - retry after Retry-After header
  429: { maxRetries: 2, backoff: "header", respectRetryAfter: true },

  // Client errors (4xx) - DO NOT retry
  400: { maxRetries: 0 },
  401: { maxRetries: 0 },
  403: { maxRetries: 0 },
  404: { maxRetries: 0 },
  422: { maxRetries: 0 },
};

// Exponential backoff formula
delay = initialDelay * (2 ** attempt) + randomJitter(0, 100);
// Example: 1s → 2s → 4s → 8s

// Linear backoff formula
delay = initialDelay * attempt;
// Example: 2s → 4s → 6s → 8s
```

### 4.2 Retry-After Header

All `429` rate limit responses **MUST** include `Retry-After` header:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "R001",
    "message": "Too many requests. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

### 4.3 Idempotency Keys

For operations that **MUST NOT** be retried automatically (payments, coin deductions):

```typescript
// Client generates idempotency key
const idempotencyKey = `${userId}_${toolId}_${timestamp}_${uuid}`;

// Include in request header
headers: {
  "X-Idempotency-Key": idempotencyKey
}

// Server checks if already processed
const existing = await redis.get(`idempotency:${idempotencyKey}`);
if (existing) {
  return existing; // Return cached response
}

// Process + cache response
await redis.setex(`idempotency:${idempotencyKey}`, 86400, response);
```

---

## 5. User Messaging Strategy

### 5.1 Message Tone Principles

| Error Type | Tone | Example |
|------------|------|---------|
| **User Error (4xx)** | Helpful, actionable | "Please check your input format. Expected: YYYY-MM-DD" |
| **Server Error (5xx)** | Apologetic, reassuring | "We're experiencing technical difficulties. Our team is working on it." |
| **Rate Limit (429)** | Informative, upgrade path | "You've reached your daily limit. Upgrade to Pro for unlimited access." |
| **Auth (401)** | Neutral, clear | "Your session expired. Please log in again." |
| **Payment (402)** | Transactional, clear CTA | "Insufficient coins. Purchase 1000 coins for $10." |

### 5.2 Multi-Language Support

**For MVP:** English only (reduces complexity)

**Post-MVP:** If translations are simple (static strings), add support for:
- English (en)
- Urdu (ur)
- Arabic (ar)

```typescript
// Error message structure for future i18n
const errorMessages = {
  "A001": {
    en: "Please log in to continue.",
    ur: "جاری رکھنے کے لیے لاگ ان کریں۔",
    ar: "الرجاء تسجيل الدخول للمتابعة."
  }
};
```

### 5.3 Error Display Components

**Toast Notifications:**
- Client errors (400, 422): Show inline field errors + toast summary
- Rate limits (429): Toast with countdown timer
- Auth (401): Toast → Redirect to login

**Modal Dialogs:**
- Payment required (402): Modal with coin purchase options
- Plan upgrade (403): Modal with plan comparison

**Full-Screen Errors:**
- Server errors (500): "Something went wrong" page with retry button
- Maintenance (503): "Under maintenance" page with estimated time

---

## 6. Alert Thresholds

### 6.1 Dashboard Notifications (Real-time)

All errors visible in admin panel dashboard in real-time via WebSocket:
- Error code + count
- Affected users
- Trend graph (last 1 hour)
- Quick action buttons (investigate, acknowledge, deploy fix)

### 6.2 Email Alerts (Critical Only)

Send email alerts to dev/ops team when:

| Condition | Alert Level | Recipients | Throttle |
|-----------|-------------|------------|----------|
| **500 errors > 10/min** | 🔴 Critical | All devs + ops | Max 1 per 5 min |
| **502/504 errors > 20/min** | 🟠 High | Ops team | Max 1 per 10 min |
| **Database connection lost** | 🔴 Critical | All devs + ops | Immediate (no throttle) |
| **Redis connection lost** | 🟠 High | Ops team | Immediate |
| **Payment webhook failures > 5** | 🔴 Critical | Billing team | Max 1 per 5 min |
| **Virus detected in uploads** | 🟡 Medium | Security team | Max 1 per 30 min |
| **API keys compromised (suspected)** | 🔴 Critical | Security + ops | Immediate |
| **Rate limit exceeded globally (DDoS?)** | 🟠 High | Ops + security | Max 1 per 5 min |

### 6.3 Email Alert Format

**Subject:** `[HSAFX WORLD] [CRITICAL] 500 Errors Spike (12/min)`

**Body:**
```
Alert: Internal Server Errors Spike
Threshold: 10/min | Current: 12/min
Duration: 3 minutes
Affected Users: 47

Top Errors:
1. S001 (Database timeout) - 8 occurrences
2. S002 (External service) - 4 occurrences

Quick Actions:
→ View Dashboard: https://admin.hsafx.com/dashboard
→ View Logs: https://admin.hsafx.com/logs?filter=S001
→ Acknowledge: Reply "ACK" to this email

Sent at: 2025-01-15 14:32:05 UTC
```

### 6.4 Dark Mode Email Support

✅ **Yes** — All alert emails support dark mode:

```html
<style>
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #ffffff; }
    .card { background: #2a2a2a; border: 1px solid #3a3a3a; }
    a { color: #4a9eff; }
  }
</style>
```

---

## 7. Error Response Format

### 7.1 Standard Error Response

```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response (4xx, 5xx)
{
  "success": false,
  "error": {
    "code": "E001",           // Internal error code
    "message": "Invalid JSON format. Please check your input.",  // User-facing message
    "details": {              // Optional: Additional context
      "field": "input",
      "expected": "Valid JSON",
      "received": "Malformed string"
    },
    "timestamp": "2025-01-15T14:32:05Z",
    "requestId": "req_abc123xyz"  // For support/debugging
  }
}

// Rate limit response (429)
{
  "success": false,
  "error": {
    "code": "R001",
    "message": "Too many requests. Try again in 60 seconds.",
    "retryAfter": 60          // Seconds until retry allowed
  }
}
```

### 7.2 Validation Error Response (422)

```typescript
{
  "success": false,
  "error": {
    "code": "E102",
    "message": "Validation failed.",
    "validationErrors": [
      {
        "field": "email",
        "message": "Invalid email format.",
        "rule": "email"
      },
      {
        "field": "age",
        "message": "Age must be between 18 and 120.",
        "rule": "range",
        "params": { "min": 18, "max": 120 }
      }
    ]
  }
}
```

---

## 8. Language Support

### 8.1 MVP Strategy

❌ **No multi-language error messages for MVP** unless trivial to implement.

**Rationale:**
- Adds complexity (i18n library, translations, maintenance)
- Most users understand basic English error messages
- Focus on clear, simple English first

### 8.2 Post-MVP Strategy

✅ **Add multi-language support** if:
1. Translations are static strings (no dynamic interpolation)
2. Support team can review translations for accuracy
3. User demographics show significant non-English audience

**Supported Languages (Post-MVP):**
- English (en) — Primary
- Urdu (ur) — Large Pakistan audience
- Arabic (ar) — Middle East expansion

**Implementation:**
```typescript
// Error messages with i18n
const errorMessages = {
  "A001": {
    en: "Please log in to continue.",
    ur: "جاری رکھنے کے لیے لاگ ان کریں۔",
    ar: "الرجاء تسجيل الدخول للمتابعة."
  }
};

// Dynamic parameter handling
const getMessage = (code: string, locale: string, params?: Record<string, any>) => {
  let message = errorMessages[code][locale] || errorMessages[code]["en"];
  
  // Replace {param} placeholders
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  
  return message;
};
```

---

## 9. Implementation Examples

### 9.1 Client-Side Error Handling

```typescript
// React component with error handling
const ToolComponent = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (input: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tools/json-formatter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        const { error } = data;
        
        if (response.status === 429) {
          // Rate limit - show countdown
          setError(`${error.message} (Retry in ${error.retryAfter}s)`);
        } else if (response.status === 402) {
          // Payment required - show purchase modal
          showCoinPurchaseModal();
        } else if (response.status === 401) {
          // Auth required - redirect to login
          router.push("/login");
        } else {
          // Generic error
          setError(error.message);
        }
        
        return;
      }

      // Success
      setOutput(data.data.output);
    } catch (err) {
      // Network error
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {/* Tool UI */}
    </>
  );
};
```

### 9.2 Server-Side Error Handling (Next.js API Route)

```typescript
// app/api/tools/json-formatter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Check rate limit (IP-based)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(ip, "json-formatter");
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "R001",
            message: "Too many requests. Try again in 60 seconds.",
            retryAfter: rateLimitResult.retryAfter,
          },
        },
        { 
          status: 429,
          headers: { "Retry-After": rateLimitResult.retryAfter.toString() }
        }
      );
    }

    // 2. Check authentication (optional for some tools)
    const session = await verifySession(req);
    if (!session && requiresAuth) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "A001",
            message: "Please log in to continue.",
          },
        },
        { status: 401 }
      );
    }

    // 3. Parse and validate input
    const body = await req.json();
    const { input } = body;

    if (!input) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "E103",
            message: "Required field missing: input",
            details: { field: "input" },
          },
        },
        { status: 422 }
      );
    }

    // 4. Process tool logic
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "E001",
            message: "Invalid JSON format. Please check your input.",
            details: { parseError: e.message },
          },
        },
        { status: 400 }
      );
    }

    const formatted = JSON.stringify(parsed, null, 2);

    // 5. Return success
    return NextResponse.json({
      success: true,
      data: { output: formatted },
    });

  } catch (err) {
    // Unexpected error
    console.error("[json-formatter] Unexpected error:", err);
    
    // Alert ops team if error rate is high
    await alertOpsTeam("S001", err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "S001",
          message: "Something went wrong. Please try again later.",
          requestId: req.headers.get("x-request-id") || "unknown",
        },
      },
      { status: 500 }
    );
  }
}
```

### 9.3 FastAPI Error Handling

```python
# app/api/tools/python_formatter.py
from fastapi import HTTPException, Request
from app.utils.errors import ErrorResponse
import time

@app.post("/api/tools/python-formatter")
async def python_formatter(request: Request, input: str):
    try:
        # 1. Validate input
        if not input:
            raise HTTPException(
                status_code=422,
                detail=ErrorResponse(
                    code="E103",
                    message="Required field missing: input",
                    details={"field": "input"}
                ).dict()
            )

        # 2. Process with Black formatter
        try:
            formatted = black.format_str(input, mode=black.Mode())
        except black.InvalidInput as e:
            raise HTTPException(
                status_code=400,
                detail=ErrorResponse(
                    code="E005",
                    message="Invalid Python syntax. Please check your code.",
                    details={"error": str(e)}
                ).dict()
            )

        # 3. Return success
        return {"success": True, "data": {"output": formatted}}

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        # Unexpected error - alert ops team
        logger.error(f"[python-formatter] Unexpected error: {e}")
        
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                code="S001",
                message="Something went wrong. Please try again later.",
                timestamp=int(time.time())
            ).dict()
        )
```

---

## 10. Appendix: Error Code Quick Reference

### Complete Error Code List (Alphabetical)

| Code | Category | HTTP | Description |
|------|----------|------|-------------|
| A001 | Auth | 401 | No session/token |
| A002 | Auth | 401 | Token expired |
| A003 | Auth | 401 | Invalid token format |
| A004 | Auth | 403 | User account suspended |
| A005 | Auth | 403 | User account deleted |
| B001 | Billing | 402 | Insufficient coins |
| B002 | Billing | 402 | No active subscription |
| B003 | Billing | 402 | Subscription expired |
| B004 | Billing | 402 | Payment method failed |
| B005 | Billing | 500 | Coin transaction failed |
| B100 | Billing | 403 | Feature not in plan |
| B101 | Billing | 403 | Usage limit exceeded |
| B102 | Billing | 403 | Anonymous user limit |
| B103 | Billing | 429 | Daily limit exceeded |
| E001 | Input | 400 | Invalid JSON |
| E002 | Input | 400 | Invalid YAML |
| E003 | Input | 400 | Invalid CSV |
| E004 | Input | 400 | Invalid XML |
| E005 | Input | 400 | Invalid SQL |
| E006 | Input | 400 | Invalid regex |
| E007 | Input | 400 | Invalid cron expression |
| E008 | Input | 400 | Invalid date format |
| E009 | Input | 400 | Invalid URL |
| E010 | Input | 400 | Invalid email |
| E100 | Entity | 404 | Resource not found |
| E101 | Entity | 409 | Resource conflict |
| E102 | Entity | 422 | Validation failed |
| E103 | Entity | 422 | Missing required field |
| E104 | Entity | 422 | Field value too long |
| E105 | Entity | 422 | Field value too short |
| E106 | Entity | 422 | Field value out of range |
| F001 | File | 413 | File too large |
| F002 | File | 415 | Unsupported file type |
| F003 | File | 403 | Virus detected |
| F004 | File | 422 | File corrupt |
| F005 | File | 500 | Upload failed |
| F006 | File | 500 | File processing failed |
| F007 | File | 404 | File not found |
| R001 | Rate Limit | 429 | IP rate limit exceeded |
| R002 | Rate Limit | 429 | User rate limit exceeded |
| R003 | Rate Limit | 429 | Tool rate limit exceeded |
| R004 | Rate Limit | 429 | API key rate limit exceeded |
| R005 | Rate Limit | 429 | Concurrent job limit |
| S001 | Server | 500 | Unexpected error |
| S002 | Server | 500 | Database error |
| S003 | Server | 500 | Redis error |
| S004 | Server | 502 | External service error |
| S005 | Server | 504 | External service timeout |
| S006 | Server | 503 | Service overloaded |
| I001 | Integration | 502 | Stripe API error |
| I002 | Integration | 502 | Polar API error |
| I003 | Integration | 502 | Uploadthing error |
| I004 | Integration | 502 | R2 storage error |
| I005 | Integration | 502 | Redis (Upstash) error |

---

**End of ERROR_HANDLING.md**
