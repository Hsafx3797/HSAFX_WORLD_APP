# 🦀 WASM Bridge Interface Specification

**Crate Name:** `productivity-wasm-core`  
**Package Location:** `packages/wasm/productivity-wasm-core/`  
**Target:** `wasm32-unknown-unknown`  
**Build Tool:** `wasm-pack`

---

## 1. Overview

This document defines the contract between TypeScript (Frontend) and Rust (WASM) for client-side tool execution. All 191 TEXT CONVERTER tools (Tools 1-191) execute via WASM for maximum performance and offline capability.

**Design Principles:**
- **Consistent Interface:** All WASM functions accept and return JSON strings
- **Non-Throwing:** Never panic; always return `{success: bool, result?: any, error?: string}`
- **Zero-Copy Where Possible:** Use `&str` inputs to avoid allocations
- **Progressive Enhancement:** Graceful degradation if WASM fails to load

---

## 2. WASM Module Structure

### 2.1 Crate Organization

```
productivity-wasm-core/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Entry point, wasm_bindgen exports
│   ├── types.rs            # Shared types (WasmResponse, ToolOptions)
│   ├── text/
│   │   ├── mod.rs          # Text transformation functions
│   │   ├── case.rs         # uppercase, lowercase, title case
│   │   ├── reverse.rs      # reverse text, words, sentences
│   │   └── whitespace.rs   # trim, normalize, remove
│   ├── encoding/
│   │   ├── mod.rs
│   │   ├── base64.rs       # encode/decode
│   │   ├── url.rs          # URL encode/decode
│   │   └── html.rs         # HTML entity encode/decode
│   ├── hash/
│   │   ├── mod.rs
│   │   ├── md5.rs
│   │   ├── sha.rs          # SHA-1, SHA-256, SHA-512
│   │   └── bcrypt.rs
│   ├── format/
│   │   ├── mod.rs
│   │   ├── json.rs         # Minify, prettify, validate
│   │   ├── xml.rs
│   │   └── csv.rs
│   └── utils/
│       ├── mod.rs
│       └── validation.rs   # Input validation helpers
└── tests/
    └── integration.rs
```

### 2.2 TypeScript Bindings Location

Generated TypeScript bindings will be placed in:
```
packages/wasm-bindings/
├── pkg/                    # wasm-pack output
│   ├── productivity_wasm_core.js
│   ├── productivity_wasm_core.d.ts
│   ├── productivity_wasm_core_bg.wasm
│   └── package.json
└── loader.ts               # Lazy loading utility
```

---

## 3. Core Interface Types

### 3.1 Rust Response Type

```rust
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct WasmResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T: Serialize> WasmResponse<T> {
    pub fn ok(result: T) -> Self {
        Self {
            success: true,
            result: Some(result),
            error: None,
        }
    }

    pub fn err(error: impl Into<String>) -> Self {
        Self {
            success: false,
            result: None,
            error: Some(error.into()),
        }
    }
}

// Helper to serialize to JSON string for wasm_bindgen
pub fn to_json_string<T: Serialize>(response: WasmResponse<T>) -> String {
    serde_json::to_string(&response).unwrap_or_else(|_| {
        r#"{"success":false,"error":"Failed to serialize response"}"#.to_string()
    })
}
```

### 3.2 TypeScript Response Type

```typescript
// packages/wasm-bindings/types.ts

export interface WasmResponse<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface WasmTextResult {
  output: string;
  metadata?: {
    charCount: number;
    wordCount: number;
    lineCount: number;
  };
}

export interface WasmHashResult {
  hash: string;
  algorithm: string;
}

export interface WasmValidationResult {
  valid: boolean;
  errors?: string[];
}
```

---

## 4. Function Signatures

### 4.1 Text Transformation Category (Tools 1-50)

#### Uppercase/Lowercase/Title Case
```rust
#[wasm_bindgen]
pub fn text_uppercase(input: &str) -> String {
    to_json_string(WasmResponse::ok(WasmTextResult {
        output: input.to_uppercase(),
        metadata: Some(TextMetadata::from_str(input)),
    }))
}

#[wasm_bindgen]
pub fn text_lowercase(input: &str) -> String {
    to_json_string(WasmResponse::ok(WasmTextResult {
        output: input.to_lowercase(),
        metadata: Some(TextMetadata::from_str(input)),
    }))
}

#[wasm_bindgen]
pub fn text_title_case(input: &str, options_json: &str) -> String {
    let opts: TitleCaseOptions = match serde_json::from_str(options_json) {
        Ok(o) => o,
        Err(e) => return to_json_string(WasmResponse::<String>::err(e.to_string())),
    };
    
    let result = apply_title_case(input, opts);
    to_json_string(WasmResponse::ok(WasmTextResult {
        output: result,
        metadata: Some(TextMetadata::from_str(input)),
    }))
}
```

**TypeScript Usage:**
```typescript
import { text_uppercase, text_lowercase, text_title_case } from '@/wasm-bindings/pkg';

const response: WasmResponse<WasmTextResult> = JSON.parse(text_uppercase("hello world"));
if (response.success) {
  console.log(response.result.output); // "HELLO WORLD"
}
```

#### Reverse Text/Words/Sentences
```rust
#[wasm_bindgen]
pub fn text_reverse(input: &str, mode: &str) -> String {
    let result = match mode {
        "chars" => input.chars().rev().collect::<String>(),
        "words" => reverse_words(input),
        "sentences" => reverse_sentences(input),
        _ => return to_json_string(WasmResponse::<String>::err("Invalid mode")),
    };
    
    to_json_string(WasmResponse::ok(WasmTextResult {
        output: result,
        metadata: None,
    }))
}
```

---

### 4.2 Encoding Category (Tools 51-80)

#### Base64 Encode/Decode
```rust
use base64::{Engine as _, engine::general_purpose};

#[wasm_bindgen]
pub fn base64_encode(input: &str) -> String {
    let encoded = general_purpose::STANDARD.encode(input.as_bytes());
    to_json_string(WasmResponse::ok(encoded))
}

#[wasm_bindgen]
pub fn base64_decode(input: &str) -> String {
    match general_purpose::STANDARD.decode(input) {
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(s) => to_json_string(WasmResponse::ok(s)),
            Err(e) => to_json_string(WasmResponse::<String>::err(format!("Invalid UTF-8: {}", e))),
        },
        Err(e) => to_json_string(WasmResponse::<String>::err(format!("Invalid Base64: {}", e))),
    }
}
```

#### URL Encode/Decode
```rust
use urlencoding::{encode, decode};

#[wasm_bindgen]
pub fn url_encode(input: &str) -> String {
    to_json_string(WasmResponse::ok(encode(input).into_owned()))
}

#[wasm_bindgen]
pub fn url_decode(input: &str) -> String {
    match decode(input) {
        Ok(s) => to_json_string(WasmResponse::ok(s.into_owned())),
        Err(e) => to_json_string(WasmResponse::<String>::err(e.to_string())),
    }
}
```

#### HTML Entity Encode/Decode
```rust
use htmlescape::{encode_minimal, decode_html};

#[wasm_bindgen]
pub fn html_encode(input: &str) -> String {
    to_json_string(WasmResponse::ok(encode_minimal(input)))
}

#[wasm_bindgen]
pub fn html_decode(input: &str) -> String {
    match decode_html(input) {
        Ok(s) => to_json_string(WasmResponse::ok(s)),
        Err(e) => to_json_string(WasmResponse::<String>::err(e.to_string())),
    }
}
```

---

### 4.3 Hash Category (Tools 81-100)

#### MD5/SHA Hashing
```rust
use md5::Md5;
use sha2::{Sha256, Sha512, Digest};

#[wasm_bindgen]
pub fn hash_md5(input: &str) -> String {
    let hash = format!("{:x}", Md5::digest(input.as_bytes()));
    to_json_string(WasmResponse::ok(WasmHashResult {
        hash,
        algorithm: "MD5".to_string(),
    }))
}

#[wasm_bindgen]
pub fn hash_sha256(input: &str) -> String {
    let hash = format!("{:x}", Sha256::digest(input.as_bytes()));
    to_json_string(WasmResponse::ok(WasmHashResult {
        hash,
        algorithm: "SHA-256".to_string(),
    }))
}

#[wasm_bindgen]
pub fn hash_sha512(input: &str) -> String {
    let hash = format!("{:x}", Sha512::digest(input.as_bytes()));
    to_json_string(WasmResponse::ok(WasmHashResult {
        hash,
        algorithm: "SHA-512".to_string(),
    }))
}
```

---

### 4.4 Format Category (Tools 101-150)

#### JSON Minify/Prettify
```rust
#[wasm_bindgen]
pub fn json_minify(input: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(value) => {
            let minified = serde_json::to_string(&value).unwrap();
            to_json_string(WasmResponse::ok(minified))
        }
        Err(e) => to_json_string(WasmResponse::<String>::err(format!("Invalid JSON: {}", e))),
    }
}

#[wasm_bindgen]
pub fn json_prettify(input: &str, indent_size: usize) -> String {
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(value) => {
            let prettified = serde_json::to_string_pretty(&value).unwrap();
            to_json_string(WasmResponse::ok(prettified))
        }
        Err(e) => to_json_string(WasmResponse::<String>::err(format!("Invalid JSON: {}", e))),
    }
}

#[wasm_bindgen]
pub fn json_validate(input: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(_) => to_json_string(WasmResponse::ok(WasmValidationResult {
            valid: true,
            errors: None,
        })),
        Err(e) => to_json_string(WasmResponse::ok(WasmValidationResult {
            valid: false,
            errors: Some(vec![e.to_string()]),
        })),
    }
}
```

#### XML Format/Validate
```rust
use quick_xml::{Reader, Writer, events::Event};

#[wasm_bindgen]
pub fn xml_prettify(input: &str) -> String {
    // Implementation using quick-xml
    match prettify_xml(input) {
        Ok(result) => to_json_string(WasmResponse::ok(result)),
        Err(e) => to_json_string(WasmResponse::<String>::err(e)),
    }
}
```

---

### 4.5 Utility Functions (Tools 151-191)

#### Word/Character Count
```rust
#[wasm_bindgen]
pub fn text_count(input: &str) -> String {
    let char_count = input.chars().count();
    let word_count = input.split_whitespace().count();
    let line_count = input.lines().count();
    
    #[derive(Serialize)]
    struct CountResult {
        chars: usize,
        words: usize,
        lines: usize,
        bytes: usize,
    }
    
    to_json_string(WasmResponse::ok(CountResult {
        chars: char_count,
        words: word_count,
        lines: line_count,
        bytes: input.len(),
    }))
}
```

#### Lorem Ipsum Generator
```rust
#[wasm_bindgen]
pub fn lorem_generate(paragraphs: usize) -> String {
    let lorem = generate_lorem_ipsum(paragraphs);
    to_json_string(WasmResponse::ok(lorem))
}
```

---

## 5. TypeScript Integration Layer

### 5.1 WASM Loader

```typescript
// packages/wasm-bindings/loader.ts

import type { InitOutput } from './pkg';

let wasmInstance: InitOutput | null = null;
let initPromise: Promise<InitOutput> | null = null;

export async function initWasm(): Promise<InitOutput> {
  if (wasmInstance) return wasmInstance;
  
  if (initPromise) return initPromise;
  
  initPromise = import('./pkg').then(async (wasm) => {
    await wasm.default(); // Initialize WASM
    wasmInstance = wasm;
    return wasm;
  });
  
  return initPromise;
}

export function isWasmLoaded(): boolean {
  return wasmInstance !== null;
}
```

### 5.2 Tool Execution Wrapper

```typescript
// packages/wasm-bindings/executor.ts

import { initWasm } from './loader';
import type { WasmResponse } from './types';

export async function executeWasmTool<T = unknown>(
  toolFunction: string,
  input: string,
  options?: Record<string, unknown>
): Promise<WasmResponse<T>> {
  try {
    const wasm = await initWasm();
    
    // Dynamically call the WASM function
    const fn = (wasm as any)[toolFunction];
    if (typeof fn !== 'function') {
      return {
        success: false,
        error: `WASM function '${toolFunction}' not found`,
      };
    }
    
    // Call with options if provided
    const resultJson = options 
      ? fn(input, JSON.stringify(options))
      : fn(input);
    
    const response: WasmResponse<T> = JSON.parse(resultJson);
    return response;
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WASM error',
    };
  }
}

// Convenience functions
export async function textUppercase(input: string): Promise<WasmResponse<WasmTextResult>> {
  return executeWasmTool('text_uppercase', input);
}

export async function base64Encode(input: string): Promise<WasmResponse<string>> {
  return executeWasmTool('base64_encode', input);
}

export async function jsonPrettify(
  input: string,
  indentSize: number = 2
): Promise<WasmResponse<string>> {
  return executeWasmTool('json_prettify', input, { indentSize });
}
```

---

## 6. Build Configuration

### 6.1 Cargo.toml

```toml
[package]
name = "productivity-wasm-core"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
base64 = "0.21"
urlencoding = "2.1"
htmlescape = "0.3"
md5 = "0.7"
sha2 = "0.10"
quick-xml = "0.31"
regex = "1.10"

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
opt-level = "z"        # Optimize for size
lto = true             # Link-time optimization
codegen-units = 1      # Better optimization
panic = "abort"        # Smaller binary
strip = true           # Strip symbols
```

### 6.2 Build Script

```bash
#!/bin/bash
# scripts/build-wasm.sh

set -e

echo "Building WASM module..."

cd packages/wasm/productivity-wasm-core

# Build with wasm-pack
wasm-pack build \
  --target web \
  --out-dir ../../../packages/wasm-bindings/pkg \
  --release

echo "WASM build complete!"
echo "Output: packages/wasm-bindings/pkg/"
```

### 6.3 Package.json Integration

```json
{
  "name": "@productivity-app/wasm-bindings",
  "version": "1.0.0",
  "type": "module",
  "main": "./pkg/productivity_wasm_core.js",
  "types": "./pkg/productivity_wasm_core.d.ts",
  "files": [
    "pkg/",
    "loader.ts",
    "executor.ts",
    "types.ts"
  ],
  "scripts": {
    "build": "bash ../../scripts/build-wasm.sh",
    "test": "wasm-pack test --node"
  }
}
```

---

## 7. Error Handling Strategy

### 7.1 Never Panic in WASM

```rust
// ❌ BAD - Will crash the entire WASM instance
#[wasm_bindgen]
pub fn bad_function(input: &str) -> String {
    let value: i32 = input.parse().unwrap(); // PANIC if not a number!
    value.to_string()
}

// ✅ GOOD - Returns error in response
#[wasm_bindgen]
pub fn good_function(input: &str) -> String {
    match input.parse::<i32>() {
        Ok(value) => to_json_string(WasmResponse::ok(value)),
        Err(e) => to_json_string(WasmResponse::<i32>::err(e.to_string())),
    }
}
```

### 7.2 TypeScript Error Display

```typescript
// apps/web/components/tools/ToolExecutor.tsx

const result = await executeWasmTool('text_uppercase', userInput);

if (!result.success) {
  // Show error to user
  toast.error(`WASM Error: ${result.error}`);
  return;
}

// Use result
setOutput(result.result.output);
```

---

## 8. Performance Optimization

### 8.1 Lazy Loading WASM

```typescript
// Only load WASM when first TEXT CONVERTER tool is accessed
// Not on app startup

import { lazy } from 'react';

const TextConverterTool = lazy(() => 
  import('./loader').then(async (mod) => {
    await mod.initWasm(); // Preload WASM
    return import('./TextConverterTool');
  })
);
```

### 8.2 WASM Binary Size

Target sizes:
- Development build: ~500KB
- Production build (optimized): ~150-250KB (gzipped: ~50-80KB)

Optimization flags (already in Cargo.toml):
- `opt-level = "z"` - Size optimization
- `lto = true` - Link-time optimization
- `strip = true` - Remove debug symbols

---

## 9. Testing Strategy

### 9.1 Rust Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_text_uppercase() {
        let result = text_uppercase("hello");
        let response: WasmResponse<WasmTextResult> = 
            serde_json::from_str(&result).unwrap();
        
        assert!(response.success);
        assert_eq!(response.result.unwrap().output, "HELLO");
    }
    
    #[test]
    fn test_base64_roundtrip() {
        let input = "Hello, World!";
        let encoded = base64_encode(input);
        let enc_resp: WasmResponse<String> = serde_json::from_str(&encoded).unwrap();
        
        let decoded = base64_decode(&enc_resp.result.unwrap());
        let dec_resp: WasmResponse<String> = serde_json::from_str(&decoded).unwrap();
        
        assert_eq!(dec_resp.result.unwrap(), input);
    }
}
```

### 9.2 WASM Integration Tests

```bash
wasm-pack test --headless --firefox
wasm-pack test --headless --chrome
```

---

## 10. Deployment Checklist

- [ ] Build WASM in release mode (`wasm-pack build --release`)
- [ ] Verify binary size (<250KB uncompressed)
- [ ] Test all 191 tool functions
- [ ] Configure CDN caching for `.wasm` files (1 year TTL)
- [ ] Add `wasm` MIME type to server config
- [ ] Enable Brotli/Gzip compression for WASM files
- [ ] Test offline functionality (WASM caching)
- [ ] Add fallback error handling if WASM fails to load
- [ ] Monitor WASM load times (target: <500ms on 3G)

---

**This specification defines the complete TypeScript ↔ Rust interface for all 191 TEXT CONVERTER tools.**
