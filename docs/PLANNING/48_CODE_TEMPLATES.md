# 48 — Code Templates

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ APPROVED

> **Purpose:**  
> Defines code style conventions, file naming patterns, project structure templates, and import ordering rules. Ensures consistent code style across all 446 tools and system components for 100+ iteration consistency.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Code Style Conventions](#2-code-style-conventions)
3. [File Naming Conventions](#3-file-naming-conventions)
4. [Import Order Rules](#4-import-order-rules)
5. [Component Templates](#5-component-templates)
6. [API Route Templates](#6-api-route-templates)
7. [Tool Implementation Templates](#7-tool-implementation-templates)
8. [Database Query Templates](#8-database-query-templates)
9. [Test Templates](#9-test-templates)
10. [Configuration Files](#10-configuration-files)

---

## 1. Overview

### 1.1 Code Style Philosophy

**Consistency Over Cleverness:**
- Predictable patterns make code easier to navigate
- Explicit is better than implicit
- Readability matters more than brevity
- Follow established patterns from existing codebase

**Language-Specific Patterns:**
- **React/Frontend:** Functional components with hooks
- **Backend Services:** Class-based architecture
- **Utilities:** Pure functions
- **WASM (Rust):** Functional style with explicit error handling

---

### 1.2 Formatting Tools

**TypeScript/JavaScript:**
- **Prettier** for code formatting
- **ESLint** for linting
- Configuration: `.prettierrc`, `.eslintrc.json`

**Python:**
- **Black** for code formatting
- **Ruff** for linting
- Configuration: `pyproject.toml`

**Rust:**
- **rustfmt** for code formatting
- **clippy** for linting
- Configuration: `rustfmt.toml`

---

## 2. Code Style Conventions

### 2.1 React Components (Functional)

**Pattern:**
```typescript
// src/components/ToolCard.tsx
"use client"; // Only if using hooks/state

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolMetadata } from "@/types/tool";

interface ToolCardProps {
  tool: ToolMetadata;
  onSelect: (toolId: string) => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    onSelect(tool.id);
  };
  
  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
    </Card>
  );
}
```

**Rules:**
- Use arrow functions for event handlers
- Destructure props in parameter list
- Define interfaces above component
- Export named functions (not default)
- Keep components under 200 lines (split if larger)

---

### 2.2 Backend Services (Class-Based)

**Pattern:**
```typescript
// src/services/billing-service.ts
import { db } from "@/lib/db";
import { user_coins, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export class BillingService {
  /**
   * Deduct coins from user account
   * @param userId - User ID
   * @param amount - Number of coins to deduct
   * @param reason - Reason for deduction
   * @throws {InsufficientCoinsError} If user has insufficient coins
   */
  async deductCoins(userId: string, amount: number, reason: string): Promise<void> {
    // Get current balance
    const user = await this.getUserBalance(userId);
    
    if (user.coin_balance < amount) {
      throw new InsufficientCoinsError(userId, amount, user.coin_balance);
    }
    
    // Deduct coins
    await db.insert(user_coins).values({
      user_id: userId,
      change_amount: -amount,
      reason,
      transaction_id: generateTransactionId(),
    });
    
    // Update balance
    await db.update(users)
      .set({ coin_balance: user.coin_balance - amount })
      .where(eq(users.id, userId));
  }
  
  async getUserBalance(userId: string): Promise<{ coin_balance: number }> {
    const [user] = await db.select({ coin_balance: users.coin_balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user;
  }
}

// Export singleton instance
export const billingService = new BillingService();
```

**Rules:**
- Use classes for stateful services
- Document public methods with JSDoc
- Export singleton instance at bottom
- Use descriptive method names
- Group related methods together

---

### 2.3 Python Services (Class-Based)

**Pattern:**
```python
# fastapi/services/file_processor.py
from typing import BinaryIO, Dict, Any
from PIL import Image
from io import BytesIO

class FileProcessorService:
    """Service for processing uploaded files"""
    
    def __init__(self):
        self.supported_formats = ["png", "jpg", "jpeg", "gif", "webp"]
    
    async def resize_image(
        self,
        file: BinaryIO,
        width: int,
        height: int,
        maintain_aspect: bool = True
    ) -> bytes:
        """
        Resize an image to specified dimensions
        
        Args:
            file: Input image file
            width: Target width in pixels
            height: Target height in pixels
            maintain_aspect: Whether to maintain aspect ratio
        
        Returns:
            Resized image as bytes
        
        Raises:
            ValueError: If dimensions are invalid
            UnsupportedFormatError: If image format not supported
        """
        # Validate dimensions
        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive integers")
        
        # Load image
        img = Image.open(file)
        
        # Resize
        if maintain_aspect:
            img.thumbnail((width, height))
        else:
            img = img.resize((width, height))
        
        # Save to bytes
        output = BytesIO()
        img.save(output, format=img.format)
        return output.getvalue()

# Export singleton instance
file_processor_service = FileProcessorService()
```

**Rules:**
- Use classes for services
- Type hints for all parameters and returns
- Docstrings for all public methods (Google style)
- Use async/await for I/O operations
- Export singleton at bottom

---

### 2.4 Utility Functions (Pure Functions)

**Pattern:**
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency
 * @param amount - Amount in cents
 * @param currency - Currency code (default: USD)
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

/**
 * Generate unique transaction ID
 * Format: txn_<timestamp>_<random>
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `txn_${timestamp}_${random}`;
}
```

**Rules:**
- One function per export (no default exports)
- JSDoc comments for complex functions
- Pure functions (no side effects)
- Descriptive names (prefer long over short)
- Group related functions in same file

---

## 3. File Naming Conventions

### 3.1 General Rules

**Case Styles:**
- **Files:** kebab-case (e.g., `user-profile.tsx`, `billing-service.ts`)
- **Components:** PascalCase file name matches component name (e.g., `UserProfile.tsx` exports `UserProfile`)
- **Classes:** PascalCase (e.g., `class BillingService`)
- **Functions:** camelCase (e.g., `function getUserProfile()`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `const MAX_FILE_SIZE = 10`)

---

### 3.2 File Naming Examples

**Frontend Components:**
```
src/components/
├── ui/
│   ├── button.tsx              (exports Button)
│   ├── card.tsx                (exports Card)
│   └── input.tsx               (exports Input)
├── tool-card.tsx               (exports ToolCard)
├── user-profile.tsx            (exports UserProfile)
└── error-boundary.tsx          (exports ErrorBoundary)
```

**Backend Services:**
```
src/services/
├── billing-service.ts          (exports BillingService)
├── tool-execution-service.ts   (exports ToolExecutionService)
└── user-service.ts             (exports UserService)
```

**API Routes:**
```
src/app/api/
├── tools/
│   └── [toolId]/
│       └── execute/
│           └── route.ts        (POST handler)
├── webhooks/
│   └── stripe/
│       └── route.ts            (POST handler)
└── auth/
    └── [...nextauth]/
        └── route.ts            (GET/POST handlers)
```

**Utilities:**
```
src/lib/
├── utils.ts                    (general utilities)
├── api-client.ts               (API wrapper)
├── redis-client.ts             (Redis connection)
└── db.ts                       (Database connection)
```

---

## 4. Import Order Rules

### 4.1 TypeScript Import Order

**Pattern:**
```typescript
// 1. React imports
import { useState, useEffect } from "react";

// 2. Next.js imports
import { useRouter } from "next/navigation";
import Image from "next/image";

// 3. External libraries (alphabetical)
import { clsx } from "clsx";
import { z } from "zod";

// 4. Internal imports (by category)
// 4a. Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4b. Hooks
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

// 4c. Services
import { billingService } from "@/services/billing-service";

// 4d. Utilities
import { cn, formatCurrency } from "@/lib/utils";

// 4e. Types
import type { ToolMetadata } from "@/types/tool";
import type { User } from "@/types/user";

// 5. Styles (last)
import styles from "./component.module.css";
```

**Rules:**
- Group imports by category (React → Next → External → Internal → Types → Styles)
- Alphabetical within each group
- Blank line between groups
- Type imports use `import type` syntax

---

### 4.2 Python Import Order

**Pattern:**
```python
# 1. Standard library imports
import os
import logging
from typing import Dict, List, Optional

# 2. Third-party imports
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

# 3. Local application imports
from lib.error_handler import AppError
from services.file_processor import file_processor_service
from models.tool import ToolMetadata
```

**Rules:**
- Standard library → Third-party → Local
- Alphabetical within each group
- Blank line between groups
- Use absolute imports

---

## 5. Component Templates

### 5.1 Page Component Template

**Pattern:**
```typescript
// src/app/tools/[toolId]/page.tsx
import { notFound } from "next/navigation";
import { ToolHeader } from "@/components/tool-header";
import { ToolExecutor } from "@/components/tool-executor";
import { getToolMetadata } from "@/lib/tool-metadata";
import type { ToolMetadata } from "@/types/tool";

interface ToolPageProps {
  params: {
    toolId: string;
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = await getToolMetadata(params.toolId);
  
  if (!tool) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8">
      <ToolHeader tool={tool} />
      <ToolExecutor tool={tool} />
    </div>
  );
}

export async function generateMetadata({ params }: ToolPageProps) {
  const tool = await getToolMetadata(params.toolId);
  
  return {
    title: `${tool.name} - HSAFX WORLD`,
    description: tool.description,
  };
}
```

---

### 5.2 Client Component Template

**Pattern:**
```typescript
// src/components/tool-executor.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import type { ToolMetadata } from "@/types/tool";

interface ToolExecutorProps {
  tool: ToolMetadata;
}

export function ToolExecutor({ tool }: ToolExecutorProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleExecute = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const result = await apiRequest(`/tools/${tool.id}/execute`, {
        method: "POST",
        body: JSON.stringify({ input }),
      });
      
      setOutput(result.output);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter input..."
      />
      
      <Button onClick={handleExecute} disabled={loading || !input}>
        {loading ? "Processing..." : "Execute"}
      </Button>
      
      {error && <ErrorAlert message={error} />}
      
      {output && (
        <Textarea
          value={output}
          readOnly
          placeholder="Output will appear here..."
        />
      )}
    </div>
  );
}
```

---

## 6. API Route Templates

### 6.1 Next.js API Route Template

**Pattern:**
```typescript
// src/app/api/tools/[toolId]/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { handleApiError, AppError } from "@/lib/api-error-handler";
import { executeTool } from "@/lib/tool-executor";

const requestSchema = z.object({
  input: z.string().min(1, "Input is required"),
  options: z.record(z.any()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { input, options } = requestSchema.parse(body);
    
    // Get user session
    const session = await getServerSession();
    
    // Check authentication (if required)
    if (!session?.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    
    // Check tool access
    const hasAccess = await checkToolAccess(session.user.id, params.toolId);
    if (!hasAccess) {
      throw new AppError(
        403,
        "TOOL_LOCKED",
        "This tool requires a Pro subscription"
      );
    }
    
    // Execute tool
    const result = await executeTool(params.toolId, input, options);
    
    // Return result
    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 6.2 FastAPI Route Template

**Pattern:**
```python
# fastapi/routers/tools.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from services.file_processor import file_processor_service
from lib.error_handler import AppError

router = APIRouter(prefix="/tools", tags=["tools"])

class ResizeImageRequest(BaseModel):
    width: int
    height: int
    maintain_aspect: bool = True

@router.post("/resize-image")
async def resize_image(
    file: UploadFile = File(...),
    request: ResizeImageRequest
):
    """
    Resize an uploaded image
    
    Args:
        file: Image file to resize
        request: Resize parameters
    
    Returns:
        Resized image URL
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise AppError(
                status_code=400,
                code="INVALID_FILE_TYPE",
                message="File must be an image"
            )
        
        # Process image
        result = await file_processor_service.resize_image(
            file.file,
            request.width,
            request.height,
            request.maintain_aspect
        )
        
        # Upload to R2
        url = await upload_to_r2(result)
        
        return {"url": url}
    except AppError:
        raise
    except Exception as e:
        raise AppError(
            status_code=500,
            code="PROCESSING_ERROR",
            message="Failed to process image"
        )
```

---

## 7. Tool Implementation Templates

### 7.1 WASM Tool Template (Rust)

**Pattern:**
```rust
// rust/text-tools/src/tools/uppercase.rs
use wasm_bindgen::prelude::*;

/// Convert text to uppercase
#[wasm_bindgen]
pub fn uppercase(input: &str) -> Result<String, JsValue> {
    // Validate input
    if input.is_empty() {
        return Err(JsValue::from_str("Input cannot be empty"));
    }
    
    // Transform
    Ok(input.to_uppercase())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_uppercase() {
        assert_eq!(uppercase("hello").unwrap(), "HELLO");
        assert_eq!(uppercase("hello world").unwrap(), "HELLO WORLD");
        assert_eq!(uppercase("hello123!@#").unwrap(), "HELLO123!@#");
    }
    
    #[test]
    fn test_empty_input() {
        assert!(uppercase("").is_err());
    }
}
```

---

### 7.2 Node.js Tool Template

**Pattern:**
```typescript
// src/tools/code/json-formatter.ts
import { z } from "zod";

const optionsSchema = z.object({
  indent: z.number().min(0).max(8).default(2),
  sortKeys: z.boolean().default(false),
});

export type JsonFormatterOptions = z.infer<typeof optionsSchema>;

/**
 * Format JSON with specified indentation
 * @throws {ValidationError} If input is not valid JSON
 */
export async function formatJson(
  input: string,
  options: JsonFormatterOptions = {}
): Promise<string> {
  // Validate options
  const opts = optionsSchema.parse(options);
  
  // Parse JSON (throws if invalid)
  let parsed: any;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    throw new ValidationError({
      code: "INVALID_JSON",
      message: "Invalid JSON format",
      details: err.message,
    });
  }
  
  // Sort keys if requested
  if (opts.sortKeys) {
    parsed = sortObjectKeys(parsed);
  }
  
  // Format
  return JSON.stringify(parsed, null, opts.indent);
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortObjectKeys(obj[key]);
        return sorted;
      }, {} as any);
  }
  
  return obj;
}
```

---

## 8. Database Query Templates

### 8.1 Drizzle ORM Query Template

**Pattern:**
```typescript
// src/services/user-service.ts
import { db } from "@/lib/db";
import { users, subscriptions, user_coins } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export class UserService {
  /**
   * Get user with subscription and coin balance
   */
  async getUserProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        plan_type: users.plan_type,
        coin_balance: users.coin_balance,
        subscription: {
          status: subscriptions.status,
          current_period_end: subscriptions.current_period_end,
        },
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.user_id))
      .where(eq(users.id, userId))
      .limit(1);
    
    return user;
  }
  
  /**
   * Get user's recent coin transactions
   */
  async getCoinTransactions(userId: string, limit: number = 10) {
    return await db
      .select()
      .from(user_coins)
      .where(eq(user_coins.user_id, userId))
      .orderBy(desc(user_coins.created_at))
      .limit(limit);
  }
}
```

---

## 9. Test Templates

### 9.1 Unit Test Template

**Pattern:**
```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency, generateTransactionId } from "../utils";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1000)).toBe("$10.00");
    expect(formatCurrency(99)).toBe("$0.99");
    expect(formatCurrency(0)).toBe("$0.00");
  });
  
  it("handles different currencies", () => {
    expect(formatCurrency(1000, "EUR")).toBe("€10.00");
    expect(formatCurrency(1000, "GBP")).toBe("£10.00");
  });
});

describe("generateTransactionId", () => {
  it("generates unique IDs", () => {
    const id1 = generateTransactionId();
    const id2 = generateTransactionId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^txn_\d+_[a-z0-9]{6}$/);
  });
});
```

---

### 9.2 Integration Test Template

**Pattern:**
```typescript
// src/app/api/tools/__tests__/execute.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { POST } from "../[toolId]/execute/route";
import { createMockRequest } from "@/test-utils/mock-request";

describe("POST /api/tools/[toolId]/execute", () => {
  it("executes tool successfully", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { input: "hello world" },
    });
    
    const response = await POST(req, { params: { toolId: "uppercase" } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.result).toBe("HELLO WORLD");
  });
  
  it("returns 400 for invalid input", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { input: "" },
    });
    
    const response = await POST(req, { params: { toolId: "uppercase" } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe("EMPTY_INPUT");
  });
});
```

---

## 10. Configuration Files

### 10.1 Prettier Configuration

**File:** `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

### 10.2 ESLint Configuration

**File:** `.eslintrc.json`
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

### 10.3 TypeScript Configuration

**File:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### 10.4 Python Configuration

**File:** `pyproject.toml`
```toml
[tool.black]
line-length = 100
target-version = ["py311"]
include = '\.pyi?$'

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "W"]
ignore = ["E501"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

---

## 11. Notes for AI Agent

**When Writing Code:**
- **ALWAYS** follow the patterns in this document
- Use functional components for React (not class components)
- Use classes for backend services
- Follow import order rules strictly
- Use kebab-case for file names
- Export named exports (avoid default exports)
- Document public APIs with JSDoc/docstrings
- Keep functions focused (one responsibility)
- Prefer explicit over implicit
- Test edge cases

**Code Review Checklist:**
- ✅ Follows naming conventions
- ✅ Imports in correct order
- ✅ Proper error handling
- ✅ Type annotations present
- ✅ JSDoc/docstrings for complex functions
- ✅ No unused imports
- ✅ No console.logs (use logger)
- ✅ Follows DRY principle
- ✅ Tests included

---

**Total Pages:** 11  
**Status:** ✅ Production-Ready Templates
