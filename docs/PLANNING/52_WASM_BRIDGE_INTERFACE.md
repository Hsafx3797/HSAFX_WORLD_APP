# 52 — WASM Bridge Interface

> **Status**: ✅ WASM crate fully built and compiled.
> **Actual crate name**: `text-tools` (NOT `productivity-wasm-core` as originally planned)
> **Location**: `backend/rust/text-tools/`

---

## Actual Implementation

### Crate Structure (`backend/rust/text-tools/src/`)

| Module                 | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `lib.rs`               | Entry point, wasm_bindgen exports                 |
| `case.rs`              | Basic case conversions (upper, lower, title, etc) |
| `case_extended.rs`     | Extended case conversions (68 case variants)      |
| `counter.rs`           | Character/word/line counting                      |
| `encoding.rs`          | Base64, URL, hex, HTML entity encode/decode       |
| `encoding_extended.rs` | Morse, ROT13, Caesar, Atbash, A1Z26, etc          |
| `format.rs`            | JSON/XML/CSV format/minify                        |
| `generators.rs`        | UUID, password, lorem ipsum generation            |
| `hash.rs`              | MD5, SHA-1/256/512, CRC32                         |
| `manipulation.rs`      | Reverse, sort, shuffle, trim, pad, wrap           |
| `unicode.rs`           | Unicode text decorations (bold, italic, etc)      |
| `wrapper.rs`           | Line/word/sentence wrapping                       |

### Compiled Output (`backend/rust/text-tools/pkg/`)

- `text_tools_bg.wasm` — Compiled WASM binary
- `text_tools.js` — JavaScript glue code
- `text_tools.d.ts` — TypeScript type definitions

### Interface Contract

All WASM functions follow this pattern:

- **Input**: `&str` (text) + optional `&str` (JSON options)
- **Output**: JSON string with `{ success: bool, result?: T, error?: string }`
- **Non-throwing**: Never panics; errors returned in response object

### TypeScript Loader

`apps/web/src/lib/tools/wasm-loader.ts` — Handles lazy WASM loading with fallback to JS engines.

### Build

```bash
cd backend/rust/text-tools
wasm-pack build --target web
```
