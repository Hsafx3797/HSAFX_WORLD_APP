# Tools UI Design — Compact Spec

**Status:** NOT BUILT — spec only. Tool execution UI pages are TODO.

---

## Global UX Rules

1. **Local-First:** All text/data processing in browser (WASM/JS). Server-side tools badged `PY`
2. **Zero Modals:** All config inline or sidebar. No popups/wizards
3. **No Login Walls:** Every tool fully functional without account
4. **Keyboard First:** Ctrl+Enter = Convert, Ctrl+Z/Y = Undo/Redo
5. **Non-Destructive Errors:** Failed conversion never clears input
6. **Monospace Default:** All text I/O uses monospace fonts
7. **Main Thread Protection:** Operations >16ms go to Web Worker
8. **Large Data:** >5MB input triggers chunked processing warning

---

## 5 UI Patterns (by tool category)

### 1. TEXT CONVERTER (Tools 1-191)

**Pattern:** Single textarea — input, transform, output all in same buffer

**Key Rules:**
- Single Pane Transformation (SPT): one textarea = single source of truth
- Selection-scoped: if text selected → tool applies only to selection
- Every tool push pushes exactly 1 undo frame on success, 0 on failure
- Deterministic tools apply immediately; async tools bind to input snapshot hash
- Tool options rendered inline beside button, no modals
- Tools grouped, collapsible, keyboard navigable, fuzzy searchable
- Analysis bar always visible: word/char/line/sentence/paragraph count + reading time
- No cloud sync, no auto-save, session persistence only

**Tool Options (parameterized tools):**
- Caesar Cipher: shift (-25..+25, default +3)
- Vigenere: key (text, required)
- Rail Fence: rails (2..n)
- Base64: variant (Standard/URL-safe), line wrapping toggle
- Binary: bit grouping (8/16-bit), space-separated toggle
- URL Encode: mode (RFC 3986 / Form encoding)
- Zalgo: intensity slider (Up/Mid/Down axes)
- Pad Lines: target length, pad char, alignment (L/R/Center)
- Indent: size, char (Space/Tab)
- Wrap HTML Tag: tag name + optional attributes
- All options stored in session, reused on next activation

### 2. CODE EDITOR (Tools 192-297, Monaco-based)

**Pattern:** Two Monaco editors — Input (editable) ⇄ Output (read-only)

**Key Rules:**
- NO auto-conversion. User must click [CONVERT] explicitly
- Toggle tools (⇄) swap source/target roles without auto-transforming
- Undo stack independent per editor, conversion doesn't affect source undo
- Output defaults read-only; optional "Edit Output" toggle promotes it to source
- File upload replaces source content, pushes 1 undo checkpoint
- Binary formats (Avro, Parquet, BSON): file upload required, text input disabled
- Validator pattern: Input → Diagnostics panel (no output mutation)
- Diff pattern: 2 editable inputs → derived read-only diff view
- Monaco language mode auto-detected from tool
- Option changes do NOT auto-trigger conversion

**Tool Options (selected):**
- CSV⇄JSON: header row, delimiter, quote char, null handling, type inference
- XML⇄JSON: attribute handling, text node key, namespace handling
- JSON Formatter: indent size, sort keys
- SQL Formatter: dialect, keyword case, line wrapping
- Regex Tester: flavor (PCRE/JS/RE2), flags (g/i/m/s)
- JSON Diff: diff mode (structural/semantic), ignore order

### 3. FILE CONVERTER (Tools 298-379)

**Pattern:** Dropzone → Options → [CONVERT] → Download

**Key Rules:**
- File upload mandatory — no clipboard/paste input
- Conversion only on explicit [CONVERT] click
- No auto-processing on option change
- Async tools (video/audio/large docs): bind to immutable input snapshot
- Changing files/options cancels pending job; partial results never rendered
- Output: single file or ZIP; download button only after success
- Max output expansion: 10x input (hard cap)
- Hard abort on: memory pressure, archive bombs, infinite media duration
- Preview (thumbnail/waveform/frame scrubber) is optional, derived, read-only

**Tool Options (selected):**
- Raster⇄Raster: output format, quality, color profile, DPI
- Video⇄Video: codec, container, resolution, frame rate, bitrate
- Audio⇄Audio: codec, bitrate, sample rate, channels
- DOCX⇄PDF: layout fidelity, embed fonts, image compression
- PDF Merge: order, interleave mode
- PDF Protect: password, permissions, encryption strength
- Compress PDF: compression level, image downsampling

### 4. GENERATORS (Tools 380-414)

**Pattern:** Form fields → [GENERATE] → Read-only output

**Key Rules:**
- Form-driven only, no shared text buffer
- [GENERATE] disabled until all required fields valid
- Re-clicking replaces output (no append)
- Non-deterministic tools show ⚠ warning toast each time
- Sensitive generators (JWT, API Key): warning note, no persistence, never logged
- Cache only for deterministic tools

**Tool Options (selected):**
- UUID: version (v1/v4/v5), namespace, output count
- Password: length, character sets, exclude ambiguous
- Lorem Ipsum: unit (words/sentences/paragraphs), count
- QR Code: format, error correction, size, colors
- Color Palette: base color, harmony rule, palette size
- Meta Tags: page type, SEO preset, include social tags
- Favicon: source image, sizes, background

### 5. CALCULATORS (Tools 415-442)

**Pattern:** Form fields → [CALCULATE] → Result panel

**Key Rules:**
- Strictly numeric/structured form inputs, no free text
- All calculators are fully deterministic
- Result panel: read-only, clearly formatted, explicit units
- Domain-sensitive tools (Islamic inheritance, Zakat, Radiation): assumptions disclosed, legal/religious disclaimer shown
- Precision/rounding rules clearly stated per tool
- No auto-recalculation unless triggered

**Tool Options:** Each calculator has `Input Value`, `From Unit`, `To Unit` pattern for unit converters. Complex calculators (BMI, GPA, Zakat, Inheritance) have specialized form fields documented in 50_COMPLEX_TOOL_ALGORITHMS.md.

### 6. DB SCHEMA VISUALIZER (Tool 443)

**Pattern:** Monaco (DBML/SQL) → live diagram panel

**Key Rules:**
- Auto-updates diagram on valid parse; invalid schema preserves last valid diagram
- Deterministic: same schema → same topology
- Tables as draggable nodes, relationships as edges with cardinality
- Layout: force-directed or hierarchical; manual repositioning allowed
- Export: SVG, PNG, JSON
