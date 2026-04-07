# 31 — Tools Classification Guide (Compacted)

> Derived from [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md). Provides complexity scoring and technology assignment for all tools.
> **Status:** Classification metadata NOT yet added to `ToolMetadata` interface — remains planning reference.

## Classification Axes

| Axis             | Values | Meaning                                |
| ---------------- | ------ | -------------------------------------- |
| Global Level     | 0–11   | Processing & semantic depth            |
| Engineering Tier | A–D    | Build & ops difficulty (trivial→heavy) |
| Deterministic    | Yes/No | Same input → same output               |
| Cacheable        | Yes/No | Safe to cache output                   |
| Async            | Yes/No | Requires background processing         |
| Primary Risk     | Text   | Most common failure point              |

### Global Levels

- **0:** UI-only, **1:** Pure text/byte, **2:** Syntax-aware formatting, **3:** Structured data conversion
- **4:** Binary/projection formats, **5:** Validation/static analysis, **6:** Schema/contract transformation
- **7:** Language/code generation, **8:** Platform/infra translation, **9:** Runtime/protocol inspection
- **10:** Diffing/change intelligence, **11:** Visualization/graph modeling

## Technology Assignment Rules

| Runtime               | Best For                                                       | Criteria                              |
| --------------------- | -------------------------------------------------------------- | ------------------------------------- |
| **Rust→WASM**         | Ultra-fast, deterministic, pure functions                      | Level 0-2, Tier A, stateless, no I/O  |
| **Node.js (Next.js)** | Orchestration, APIs, schema-heavy, glue                        | Level 2-5, Tier A-B, API/auth context |
| **Python (FastAPI)**  | Semantic logic, AI/ML, heuristics                              | Level 2-6, Tier B-C, partial determ.  |
| **Native binaries**   | Heavy I/O, media, documents (FFmpeg/libvips/Poppler/Tesseract) | Level 4-5, Tier B-C                   |

**Hybrid rule:** Browser-first when cheap (<100ms). API when state/billing/scale needed. Same tool can have multiple runtimes.

## UI Pattern Groups

| Pattern              | Layout                                       | Tool Ranges                |
| -------------------- | -------------------------------------------- | -------------------------- |
| Text Converter       | Textarea→Options→Output Textarea             | #001-191 (text tools)      |
| Code Editor (Monaco) | Monaco Input ⇄ Monaco Output (bidirectional) | #192-297 (data converters) |
| File Converter       | Dropzone→Settings→Preview→Download           | #298-379 (media/file)      |
| Form Generator       | Form Fields→Generate→Output                  | #380-414 (generators)      |
| Calculator           | Form Fields→Calculate→Result                 | #415-419 (calculators)     |
| Unit Converter       | Value+Unit→Convert→Result                    | #420-442 (unit converters) |
| Specialized          | Custom UI per tool                           | #443-446 (specialized)     |

## Technology Distribution Summary

| Technology | Tool IDs                                                           | Approx Count |
| ---------- | ------------------------------------------------------------------ | ------------ |
| WASM       | #001-108, #110-115, #121-154, #156-158, #162-191, #380, #383       | ~191         |
| Node.js    | #192-297 (excl #203,#204,#276), #381-382, #384, #386-391, #392-409 | ~130+        |
| Python     | #109, #116-120, #155, #159-161, #203-204, #276, #319, #415-419     | ~20          |
| Native     | #298-318, #320-379, #385, #389, #410-414                           | ~83          |

## Key Classification Patterns

- **All text tools (#001-191):** Level 1, Tier A, Deterministic, Cacheable → WASM
- **Exceptions:** Emoji Translator (#109), Pirate/UwU/Yoda/Shakespeare (#116-120), Pig Latin (#155), Caesar Bruteforce (#161) → **Python** (heuristic/semantic)
- **Data converters (#192-297):** Level 3-10, Tier A-C → Node.js (parsing ecosystem)
- **Schema tools (#209-220):** Level 6, Tier B-C → Node.js
- **Diff tools (#284-288):** Level 10, Tier B-C → Node.js
- **Media/file (#298-379):** Level 4, Tier A-C → Native binaries
- **Generators (#380-414):** Mixed WASM/Node.js depending on determinism
- **Speech-to-text (#319):** Only Level 9, Tier D, Async tool → Python + Whisper
