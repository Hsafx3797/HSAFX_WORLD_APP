# 🔐 API Authentication Guide (B2B)

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED — B2B API Authentication

> **Audience:**  
> This guide is for **business customers** integrating HSAFX WORLD tools into their applications via API.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [API Key Format](#3-api-key-format)
4. [Authentication Methods](#4-authentication-methods)
5. [API Key Scopes](#5-api-key-scopes)
6. [Rate Limiting](#6-rate-limiting)
7. [Error Handling](#7-error-handling)
8. [Best Practices](#8-best-practices)
9. [Code Examples](#9-code-examples)
10. [Migration from OAuth](#10-migration-from-oauth)

---

## 1. Overview

### 1.1 What are API Keys?

HSAFX WORLD API keys allow **programmatic access** to all 432 productivity tools without requiring user login. Perfect for:
- Server-to-server integrations
- Automated workflows
- Bulk processing
- Embedding tools in your application

### 1.2 Key Benefits

| Feature | Description |
|---------|-------------|
| **No User Auth** | API keys work independently of user sessions |
| **Scoped Access** | Control exactly what each key can access |
| **Rate Limited** | Predictable quotas based on your plan |
| **Secure** | SHA256-hashed in database, revocable instantly |
| **Simple** | Single header authentication, no OAuth flow |

### 1.3 Comparison: Sessions vs API Keys

| Aspect | Session Auth (B2C) | API Keys (B2B) |
|--------|-------------------|----------------|
| **Use Case** | Web users | Programmatic access |
| **Authentication** | Login + session cookie | API key in header |
| **Lifetime** | 7 days (auto-refresh) | Until revoked |
| **Storage** | Redis (ephemeral) | PostgreSQL (persistent) |
| **Rate Limits** | Based on user plan | Based on API key tier |
| **Scopes** | Full account access | Configurable per key |

---

## 2. Getting Started

### 2.1 Create Your First API Key

1. **Log in** to your HSAFX WORLD account: [app.hsafx.com/login](https://app.hsafx.com/login)
2. Navigate to **Settings → API Keys**
3. Click **"Create New API Key"**
4. Configure:
   - **Name**: "Production Server" (for your reference)
   - **Scopes**: Select permissions (see [Section 5](#5-api-key-scopes))
   - **Rate Limit Tier**: Based on your subscription plan
5. Click **"Generate Key"**
6. **⚠️ IMPORTANT:** Copy your API key immediately — it will only be shown once!

```
hsafx_live_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMn
```

### 2.2 Test Your API Key

```bash
# Test authentication
curl -X GET "https://app.hsafx.com/api/v1/health" \
  -H "Authorization: Bearer hsafx_live_YOUR_KEY_HERE"

# Expected response:
{
  "success": true,
  "message": "API key authenticated",
  "keyName": "Production Server",
  "scopes": ["tools:read", "tools:execute"],
  "rateLimitTier": "pro",
  "remainingRequests": 998
}
```

---

## 3. API Key Format

### 3.1 Structure

```
hsafx_{env}_{random}

hsafx_     → Prefix (identifies HSAFX keys)
live_      → Environment (live/test)
<52chars>  → Random alphanumeric string (cryptographically secure)
```

**Examples:**
```
# Production key
hsafx_live_Xj8pLk2QwRtY5nZaBcDeFgHiJkLmNoPqRsTuVwXyZ123456789Ab

# Test key (sandbox environment)
hsafx_test_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMn
```

### 3.2 Security

- **Never expose** API keys in client-side code (JavaScript, mobile apps)
- **Server-side only** — keys should only be used in backend services
- **SHA256 hashed** in database (we store `sha256(key)`, not plaintext)
- **Revocable** instantly via dashboard or API

---

## 4. Authentication Methods

### 4.1 Bearer Token (Recommended)

Include your API key in the `Authorization` header:

```http
Authorization: Bearer hsafx_live_YOUR_KEY_HERE
```

**Example:**
```bash
curl -X POST "https://app.hsafx.com/api/v1/tools/json-formatter" \
  -H "Authorization: Bearer hsafx_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"input": "{\"name\":\"John\"}"}'
```

### 4.2 Custom Header (Alternative)

If `Authorization` header conflicts with your infrastructure:

```http
X-HSAFX-API-Key: hsafx_live_YOUR_KEY_HERE
```

**Example:**
```bash
curl -X POST "https://app.hsafx.com/api/v1/tools/json-formatter" \
  -H "X-HSAFX-API-Key: hsafx_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"input": "{\"name\":\"John\"}"}'
```

---

## 5. API Key Scopes

### 5.1 Available Scopes

Control what each API key can access:

| Scope | Description | Actions |
|-------|-------------|---------|
| **tools:read** | View tool metadata | `GET /api/v1/tools`, `GET /api/v1/tools/:id` |
| **tools:execute** | Execute tools | `POST /api/v1/tools/:id/execute` |
| **billing:read** | View billing info | `GET /api/v1/billing/balance`, `GET /api/v1/billing/transactions` |
| **billing:write** | Purchase coins | `POST /api/v1/billing/purchase` |
| **admin:*** | Full admin access | All admin panel APIs (restricted to admin accounts) |

### 5.2 Scope Combinations

**Common Combinations:**

| Use Case | Recommended Scopes |
|----------|-------------------|
| **Read-only access** | `tools:read`, `billing:read` |
| **Execute tools only** | `tools:read`, `tools:execute` |
| **Full access (typical)** | `tools:read`, `tools:execute`, `billing:read` |
| **Self-service billing** | `tools:read`, `tools:execute`, `billing:read`, `billing:write` |
| **Admin automation** | `admin:*` (requires admin account) |

### 5.3 Scope Validation

If you attempt an action without the required scope:

```json
{
  "success": false,
  "error": {
    "code": "A005",
    "message": "Insufficient API key permissions. Required scope: tools:execute",
    "missingScopes": ["tools:execute"],
    "currentScopes": ["tools:read"]
  }
}
```

**Solution:** Create a new API key with the required scopes.

---

## 6. Rate Limiting

### 6.1 Rate Limit Tiers

Rate limits are based on your **subscription plan**:

| Tier            | Plan              | Requests per Hour | Requests per Day  | Burst Limit |
|------           |------             |-------------------|------------------ |-------------|
| **Basic**       | Free              | 100               | 2,000             | 10/min      |
| **Pro**         | Pro ($29/mo)      | 1,000             | 20,000            | 50/min      |
| **Business**    | Advance ($99/mo)  | 5,000             | 100,000           | 200/min     |
| **Enterprise**  | Custom            | Custom            | Custom            | Custom      |

### 6.2 Rate Limit Headers

Every API response includes rate limit info:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1673712000
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Total requests allowed per hour |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### 6.3 Handling Rate Limits

When you exceed the limit:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1673712000
```

```json
{
  "success": false,
  "error": {
    "code": "R004",
    "message": "API key rate limit exceeded. Upgrade for higher limits.",
    "retryAfter": 3600,
    "tier": "pro",
    "upgradeUrl": "https://app.hsafx.com/settings/billing"
  }
}
```

**Best Practices:**
1. **Check `X-RateLimit-Remaining`** before making requests
2. **Implement exponential backoff** when rate limited
3. **Respect `Retry-After`** header (seconds until retry)
4. **Upgrade plan** if consistently hitting limits

---

## 7. Error Handling

### 7.1 Common API Key Errors

| Error Code | HTTP | Description | Solution |
|------------|------|-------------|----------|
| **A001** | 401 | Missing API key | Include `Authorization` header |
| **A002** | 401 | Invalid API key | Check key format, regenerate if needed |
| **A003** | 401 | API key revoked | Create new API key |
| **A004** | 403 | Account suspended | Contact support |
| **A005** | 403 | Insufficient scopes | Create key with required scopes |
| **R004** | 429 | Rate limit exceeded | Wait or upgrade plan |

### 7.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "A002",
    "message": "Invalid API key. Please check your key and try again.",
    "timestamp": "2026-01-11T14:32:05Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## 8. Best Practices

### 8.1 Security

✅ **DO:**
- Store API keys in environment variables
- Use separate keys for dev/staging/production
- Rotate keys every 90 days
- Revoke keys immediately if compromised
- Use minimal scopes (principle of least privilege)

❌ **DON'T:**
- Commit API keys to Git/version control
- Expose keys in client-side code
- Share keys between services
- Use production keys in development

### 8.2 Key Management

**Environment Variables:**
```bash
# .env (NEVER commit to Git)
HSAFX_API_KEY_PROD=hsafx_live_YOUR_PRODUCTION_KEY
HSAFX_API_KEY_DEV=hsafx_test_YOUR_DEVELOPMENT_KEY
```

**Usage:**
```javascript
// Node.js
const apiKey = process.env.HSAFX_API_KEY_PROD;

// Python
import os
api_key = os.getenv("HSAFX_API_KEY_PROD")

// .NET
var apiKey = Environment.GetEnvironmentVariable("HSAFX_API_KEY_PROD");
```

### 8.3 Performance

**Caching:**
- Cache tool metadata (`GET /api/v1/tools`) for 1 hour
- Cache results for deterministic tools (same input → same output)

**Batch Processing:**
- Use async/await for concurrent requests
- Respect rate limits (max 10 concurrent requests for Pro tier)

**Error Handling:**
- Implement retry logic for 5xx errors (exponential backoff)
- Don't retry 4xx errors (client errors)

---

## 9. Code Examples

### 9.1 Node.js / TypeScript

```typescript
import axios from 'axios';

const HSAFX_API_KEY = process.env.HSAFX_API_KEY;
const BASE_URL = 'https://app.hsafx.com/api/v1';

class HSAFXClient {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async executeTool(toolId: string, input: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/tools/${toolId}/execute`,
        { input },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limit exceeded
        const retryAfter = error.response.headers['retry-after'];
        console.error(`Rate limited. Retry after ${retryAfter} seconds.`);
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
      }
      
      throw error;
    }
  }
  
  async getTools() {
    const response = await axios.get(`${BASE_URL}/tools`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    return response.data.data;
  }
}

// Usage
const client = new HSAFXClient(HSAFX_API_KEY);

// Execute JSON formatter
const result = await client.executeTool('json-formatter', '{"name":"John"}');
console.log(result.data.output);
```

### 9.2 Python

```python
import os
import requests
from typing import Dict, Any

class HSAFXClient:
    BASE_URL = "https://app.hsafx.com/api/v1"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def execute_tool(self, tool_id: str, input_data: str) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.BASE_URL}/tools/{tool_id}/execute",
            json={"input": input_data}
        )
        
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", 60)
            raise Exception(f"Rate limited. Retry after {retry_after} seconds.")
        
        response.raise_for_status()
        return response.json()
    
    def get_tools(self) -> Dict[str, Any]:
        response = self.session.get(f"{self.BASE_URL}/tools")
        response.raise_for_status()
        return response.json()["data"]

# Usage
client = HSAFXClient(os.getenv("HSAFX_API_KEY"))

# Execute JSON formatter
result = client.execute_tool("json-formatter", '{"name":"John"}')
print(result["data"]["output"])
```

### 9.3 cURL

```bash
#!/bin/bash

API_KEY="hsafx_live_YOUR_KEY_HERE"
BASE_URL="https://app.hsafx.com/api/v1"

# Execute JSON formatter
curl -X POST "$BASE_URL/tools/json-formatter/execute" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "{\"name\":\"John\"}"}'

# Get all tools
curl -X GET "$BASE_URL/tools" \
  -H "Authorization: Bearer $API_KEY"

# Check rate limit status
curl -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer $API_KEY" \
  -I  # Show headers only
```

### 9.4 .NET / C#

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class HSAFXClient
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://app.hsafx.com/api/v1";

    public HSAFXClient(string apiKey)
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", apiKey);
    }

    public async Task<JsonDocument> ExecuteToolAsync(string toolId, string input)
    {
        var payload = new { input };
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(
            $"{BaseUrl}/tools/{toolId}/execute",
            content
        );

        if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            var retryAfter = response.Headers.RetryAfter?.Delta?.TotalSeconds ?? 60;
            throw new Exception($"Rate limited. Retry after {retryAfter} seconds.");
        }

        response.EnsureSuccessStatusCode();
        
        var responseBody = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(responseBody);
    }

    public async Task<JsonDocument> GetToolsAsync()
    {
        var response = await _httpClient.GetAsync($"{BaseUrl}/tools");
        response.EnsureSuccessStatusCode();
        
        var responseBody = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(responseBody);
    }
}

// Usage
var apiKey = Environment.GetEnvironmentVariable("HSAFX_API_KEY");
var client = new HSAFXClient(apiKey);

var result = await client.ExecuteToolAsync("json-formatter", "{\"name\":\"John\"}");
Console.WriteLine(result.RootElement.GetProperty("data").GetProperty("output"));
```

---

## 10. Migration from OAuth

### 10.1 Why API Keys Instead of OAuth?

| Aspect | OAuth 2.0 | API Keys |
|--------|-----------|----------|
| **Complexity** | High (3-legged flow) | Low (single header) |
| **Setup Time** | 30-60 minutes | 2 minutes |
| **Token Refresh** | Required every 1-2 hours | Never (until revoked) |
| **Scopes** | Complex consent flow | Simple selection |
| **Best For** | User-delegated access | Server-to-server |

### 10.2 Migration Checklist

If migrating from OAuth:

- [ ] Create API key in dashboard
- [ ] Replace OAuth token with API key in `Authorization` header
- [ ] Remove token refresh logic
- [ ] Update scopes (if needed)
- [ ] Test all API endpoints
- [ ] Update documentation
- [ ] Revoke old OAuth tokens

### 10.3 Side-by-Side Comparison

**Before (OAuth):**
```javascript
// Step 1: Redirect user to consent screen
window.location.href = `https://app.hsafx.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

// Step 2: Handle callback
const code = new URLSearchParams(window.location.search).get('code');

// Step 3: Exchange code for token
const tokenResponse = await fetch('https://app.hsafx.com/oauth/token', {
  method: 'POST',
  body: JSON.stringify({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
});

const { access_token, refresh_token, expires_in } = await tokenResponse.json();

// Step 4: Use token (expires in 1-2 hours)
const result = await fetch('https://app.hsafx.com/api/v1/tools/json-formatter/execute', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: JSON.stringify({ input: '{"name":"John"}' })
});

// Step 5: Refresh token before expiry
// ... (complex refresh logic)
```

**After (API Keys):**
```javascript
// Single step: Use API key (never expires)
const result = await fetch('https://app.hsafx.com/api/v1/tools/json-formatter/execute', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${HSAFX_API_KEY}` },
  body: JSON.stringify({ input: '{"name":"John"}' })
});
```

---

## 11. FAQ

### Q1: Can I use API keys in mobile apps?

**A:** No. API keys are for **server-side use only**. For mobile apps:
1. User logs in via OAuth/session
2. Your backend receives API requests from mobile app
3. Backend uses API key to call HSAFX API
4. Backend returns results to mobile app

### Q2: How many API keys can I create?

**A:** Unlimited. Create separate keys for:
- Development, staging, production environments
- Different services/microservices
- Different team members (for audit trails)

### Q3: Can I restrict API keys by IP address?

**A:** Not yet. This feature is planned for Q2 2026. Subscribe to our [changelog](https://app.hsafx.com/changelog) for updates.

### Q4: What happens if I delete an API key?

**A:** All requests using that key will immediately return `401 Unauthorized`. This is **instant** — no delay.

### Q5: Can I see which API key made a request?

**A:** Yes! Every API request logs:
- API key name (not the key itself)
- Timestamp
- Tool executed
- Success/failure status

View logs in **Settings → API Keys → Usage Logs**.

### Q6: Do API keys count towards my plan limits?

**A:** Yes. API key executions consume:
- Coins (same as web UI)
- Rate limits (based on your plan)
- Monthly execution quotas

### Q7: Can I transfer API keys to another account?

**A:** No. API keys are tied to the account that created them. To transfer:
1. Create new API key in target account
2. Update your application to use new key
3. Revoke old key

---

## 12. Support

### Need Help?

- **Documentation**: [docs.hsafx.com/api](https://docs.hsafx.com/api)
- **API Status**: [status.hsafx.com](https://status.hsafx.com)
- **Email Support**: [api@hsafx.com](mailto:api@hsafx.com)
- **Discord**: [discord.gg/hsafx](https://discord.gg/hsafx)

### Report Issues

Found a bug? [Submit an issue](https://github.com/hsafx/api-issues/issues)

---

**End of API_AUTHENTICATION_GUIDE.md**
