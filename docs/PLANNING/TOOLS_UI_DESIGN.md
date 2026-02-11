# TOOLS UI DESIGN

## CORE UX PHILOSOPHY

### GLOBAL RULES

#### 1. Privacy & Data Sovereignty

* **Local-First Execution:** All processing must occur in the client’s browser (WASM/JS). If a server-side call is required (Python Tier), it must be explicitly badged.
* **Zero-Storage Default:** No user data (input or output) shall ever be sent to a telemetry service or cloud database.
* **Opt-in Persistence:** LocalStorage is used only for UI preferences (themes, layout) and never for sensitive input data unless the user explicitly toggles "Persistent Session."

#### 2. The "No-Friction" Interface

* **Zero Modals:** No tool shall ever spawn a modal, popup, or wizard. All configurations must be inline or in a sidebar.
* **No Login Walls:** Every tool must be fully functional without an account or "Pro" upgrade.
* **Instant-On:** The application must be interactive within <1.5s. Tool logic should be lazy-loaded to keep the initial bundle small.

#### 3. Interaction Consistency

* **Keyboard First:** Every action (Convert, Copy, Swap, Clear) must have a documented, global hotkey (e.g., `Ctrl+Enter` to Convert).
* **Predictable Undo:** The `Ctrl+Z` / `Ctrl+Y` contract is sacred. A tool application that doesn't support undo is considered broken.
* **Non-Destructive Errors:** If a conversion fails, the input must remain intact. Never "clear" a buffer on a 500 or Parsing Error.

#### 4. Visual Language & Feedback

* **Monospace by Default:** All text inputs/outputs use monospace fonts to preserve indentation and character alignment.
* **Subtle Animation:** Use transitions (max 200ms) for expanding/collapsing tool groups, but never for critical data transformations.
* **Status Hierarchy:**
* **Toasts:** For transient events (Copied to clipboard).
* **Inline Chips:** For tool-specific metadata (WASM, PY, Speed).
* **Banners:** For high-risk warnings (Non-deterministic output).

#### 5. Performance Contract

* **Main Thread Protection:** Any operation expected to take >16ms must be moved to a Web Worker to prevent UI jank.
* **Large Data Handling:** Tools must implement a "Stream" or "Chunk" warning if the input exceeds 5MB, offering to process in the background.

---

## TEXT CONVERTER

Contain tools 1-191 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

### UI PATTERN
`[Textarea] → [Options/Buttons] → [Save Input State] → [Converter Text] → [Display Output in Textarea]`

### PAGE LAYOUT DESIGN

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              TEXT CONVERTER                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                              [COPY TEXT]  │   │
│  │                                                TEXTAREA                                                   │   │
│  │                               (single source of truth for INPUT / OUTPUT)                                 │   │
│  │                                                                                                           │   │
│  │  • User pastes or types text                                                                              │   │
│  │  • Input state is preserved in memory (and optionally localStorage)                                       │   │
│  │  • On conversion → output REPLACES content (single-pane model)                                            │   │
│  │  • Undo stack enabled                                                                                     │   │
│  │  • Scrollable                                                                                             │   │
│  │  • Monospace toggle                                                                                       │   │
│  │  • Line numbers (optional)                                                                                │   │
│  │  • IME safe / Unicode aware                                                                               │   │
│  │                                                                                                           │   │
│  │                                                                                                           │   │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│   ANALYSIS:                                                                                                      │
│       Count Words | Count Lines | Count Characters | Count Sentences | Count Paragraphs | Reading Time           │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  CONVERTERS PALETTE                                               (Tool search • Settings • Reset • Undo/Redo)   │
│                                                                                                                  │
│  (Grouped + Collapsible e.g "accordion")                                                                         │
│                                                                                                                  │
│                                                                                                                  │
│                                                                                                                  │
│                                                                                                                  │
│                                                                                                                  │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR TEXT CONVERTER

#### 1. SINGLE-PANE TRANSFORMATION RULE (SPT)

1. There is **exactly one textarea**.
2. The textarea is the **single source of truth** for:
   * Input
   * Output
   * Selection
3. Every tool **mutates the same buffer**.
4. There is **no preview**, **no split view**, and **no shadow output state**.

#### 2. SELECTION-SCOPED EXECUTION

**Rule**
* If a selection exists → tool applies **only to selection**
* If no selection → tool applies to **entire buffer**

**Post-Transform**
* Selection range is updated to match transformed content
* Cursor position is preserved when possible
* Line-based tools respect original line boundaries

📌 **Multi-output tools**
* Replace the **same scope** they operate on
* Outputs are **joined using tool-defined separator** (default: `\n`)

#### 3. UNDO / REDO CONTRACT (NON-NEGOTIABLE)

1. **Every successful tool application pushes exactly ONE undo frame**
2. Async tools:
   * Push undo **only on successful completion**
   * Never on start
3. Failed tools:
   * Push **no undo frame**
4. Undo stack is **linear** (no branching)
5. Copy action:
   * **Never mutates state**
   * Respects selection if present

#### 4. TOOL ACTIVATION MODEL

**Deterministic Tools**
* Apply immediately
* No UI feedback required

**Partial Tools**
* Apply immediately
* Show subtle info hint (ⓘ)

**Non-Deterministic Tools**
* Apply immediately
* Show warning toast:

  ```
  ⚠ This tool produces non-deterministic output
  ```

**Async Tools** (e.g. Caesar Bruteforce)

* Bind to **input snapshot hash**
* Show progress indicator
* If text changes during execution:
  * Result is discarded
  * No undo frame
  * Optional info toast shown

#### 5. PARAMETERIZED TOOL RULES

1. **No modals. Ever.**
2. Parameters are rendered **inline** beside tool button
3. Tool is **disabled** until required parameters are valid
4. Changing a parameter:
   * Immediately re-applies tool
   * Pushes **one undo frame per apply**
5. Last used parameter values:
   * Stored in session
   * Reused on next activation

#### 6. TOOL GROUPING & DISCOVERY

* Tools are:
  * Grouped
  * Collapsible
  * Keyboard navigable
* Global search:
  * Fuzzy
  * Matches name + aliases
* Search never alters tool behavior
* Escape clears search and collapses groups

#### 7. TECHNOLOGY-AWARE EXECUTION RULES

**WASM Tools**
* Run locally
* No network dependency
* Must complete <5ms (Level-1 contract)

**Python Tools**
* Server-side
* May be tier-gated
* UI remains responsive
* Failures are non-blocking

Badges are **derived automatically**:

* `WASM`
* `PY`
* `⚠` (Risky)
* `⟳` (Non-deterministic)

#### 8. ERROR & EDGE-CASE HANDLING

| Condition        | Behavior                   |
| ---------------- | -------------------------- |
| Empty input      | Tool disabled              |
| Invalid encoding | Inline error chip          |
| Unicode loss     | Warning toast              |
| Runtime failure  | Non-blocking error toast   |
| Huge input       | Performance notice         |
| Partial failure  | Output applied with caveat |

Severity rules:

* **Info** → no mutation
* **Warning** → mutation allowed
* **Error** → no mutation, undo untouched

#### 9. ANALYSIS BAR CONSISTENCY RULE

* Analysis metrics are:
  * Always-on
  * Derived only (never editable)
* Metrics update:
  * After every mutation
  * After undo / redo
* Clicking a metric copies its value
* Metrics never affect undo history

#### 10. PERSISTENCE RULES (TEXT CONVERTER ONLY)

| Item         | Scope                 |
| ------------ | --------------------- |
| Text content | Session               |
| Last tool    | Session               |
| Tool params  | Session               |
| UI prefs     | LocalStorage (opt-in) |

📌 No cloud sync. Ever.

#### 11. PERFORMANCE & SAFETY CONTRACT

* No main-thread blocking
* No memory growth per transform
* Max text size handled gracefully (>1MB)
* Deterministic tools must be cacheable
* Random tools must never pretend determinism

#### 12. INTENTIONAL LIMITATIONS

The Text Converter **will not**:
* Auto-save to cloud
* Require login
* Use previews
* Spawn wizards
* Fork output panes

### TOOL OPTIONS LIST

**Caesar Cipher:**
* **Option:** `Shift`
* **Type:** Integer selector
* **Range:** `-25 … +25`
* **Default:** `+3`
> “Cipher tools: always require key/shift”

**Caesar Bruteforce:**
* **Option:** `Shift Range`
* **Type:** Multi-output toggle
* **Values:** `All shifts (-25 … +25)` or `Positive only`
> Multi-output tools join results using a tool-defined separator (default: newline).

**Vigenère Cipher:**
* **Option:** `Key`
* **Type:** Text input
* **Required:** Yes

**Rail Fence Cipher:**
* **Option:** `Rails`
* **Type:** Integer
* **Range:** `2 … n`

**Playfair Cipher:**
* **Option:** `Key`
* **Type:** Text input
* **Optional Toggles:**
  * `I/J merge`
  * `Remove duplicates`

**Bacon Cipher:**
* **Option:** `Encoding Variant`
* **Type:** Select
* **Values:** `A/B`, `0/1`

**Base64 Encode / Decode:**
* **Option:** `Variant`
* **Type:** Select
* **Values:** `Standard`, `URL-safe`
* **Optional Toggle:** `Line wrapping`

**Base32 Encode / Decode:**
* **Option:** `Alphabet Variant`
* **Type:** Select
* **Values:** `RFC 4648`, `Crockford`

**Base58 Encode / Decode:**
* **Option:** `Alphabet`
* **Type:** Select
* **Values:** `Bitcoin`, `Ripple`, `Flickr`

**Binary Encode:**
* **Option:** `Bit Grouping`
* **Type:** Select
* **Values:** `8-bit`, `16-bit`
* **Optional Toggle:** `Space-separated`
```
But Binary Encode/Decode was earlier marked **Deterministic + Cacheable**
⚠ Grouping affects output format, but still deterministic — that’s fine.
No correction needed, just confirming consistency ✔
```

**Hex Encode:**
* **Option:** `Letter Case`
* **Type:** Select
* **Values:** `Upper`, `Lower`

**Octal Encode:**
* **Option:** `Padding`
* **Type:** Toggle
* **Values:** `Pad to 3 digits`

**ASCII Code:**
* **Option:** `Output Format`
* **Type:** Select
* **Values:** `Decimal`, `Hex`, `Binary`

**URL Encode:**
* **Option:** `Encoding Mode`
* **Type:** Select
* **Values:** `RFC 3986`, `Form encoding (+)`

**URL Decode:**
* **Option:** `Decode Plus`
* **Type:** Toggle
* **Meaning:** `+ → space`

**HTML Escape:**
* **Option:** `Escape Mode`
* **Type:** Select
* **Values:** `Minimal`, `Full entities`

**Unicode Escape:**
* **Option:** `Format`
* **Type:** Select
* **Values:** `\uXXXX`, `\UXXXXXXXX`

**JSON String Escape:**
* **Option:** `Strict Mode`
* **Type:** Toggle

**Random Case:**
* **Option:** `Randomness Level`
* **Type:** Select
* **Values:** `Per-character`, `Per-word`

**Studly Case:**
* **Option:** `Pattern`
* **Type:** Select
* **Values:** `Random`, `Alternating`

**Mocking SpongeBob Case:**
* **Option:** `Intensity`
* **Type:** Slider
* **Range:** `Low → Extreme`

**Emoji Case:**
* **Option:** `Emoji Set`
* **Type:** Select
* **Values:** `Faces`, `Objects`, `Mixed`

**Yoda Speak:**
* **Option:** `Reordering Strength`
* **Type:** Slider

**UwU Speak:**
* **Option:** `Cuteness Level`
* **Type:** Slider
* **Optional Toggle:** `Emojis`

**Pirate Speak:**
* **Option:** `Dialect`
* **Type:** Select
* **Values:** `Classic`, `Comic`

**Shakespearean English:**
* **Option:** `Formality Level`
* **Type:** Select
* **Values:** `Light`, `Heavy`

**Circled Letters:**
* **Option:** `Style`
* **Type:** Select
* **Values:** `Black`, `White`

**Squared Letters:**
* **Option:** `Fill`
* **Type:** Select
* **Values:** `Outlined`, `Filled`

**Bubble Text:**
* **Option:** `Emoji Style`
* **Type:** Select

**Math Bold / Math Italic:**
* **Option:** `Alphabet Range`
* **Type:** Select
* **Values:** `A-Z`, `a-z`, `0-9`

**Rotated Text:**
* **Option:** `Rotation Angle`
* **Type:** Select
* **Values:** `90°`, `180°`, `270°`

**Shuffle Text:**
* **Option:** `Unit`
* **Type:** Select
* **Values:** `Characters`, `Words`, `Lines`

**Scramble Words:**
* **Option:** `Preserve First/Last`
* **Type:** Toggle

**Pick Random Line:**
* **Option:** `Count`
* **Type:** Integer
* **Default:** `1`

**Pad Lines:**
* **Options:**
  * `Target Length` (integer)
  * `Padding Character` (char)
  * `Alignment` (`Left | Right | Center`)

**Indent Text:**
* **Options:**
  * `Indent Size`
  * `Indent Character` (`Space | Tab`)

**Split Lines by Length:**
* **Option:** `Max Line Length`
* **Type:** Integer

**Line Length Normalizer:**
* **Option:** `Target Length`
* **Type:** Integer

**Wrap with HTML Tag:**
* **Option:** `Tag Name`
* **Type:** Text input
* **Optional:** `Attributes`

**Wrap with Markdown Code Block:**
* **Option:** `Language`
* **Type:** Select / Text

**Line Number Wrapper:**
* **Options:**
  * `Start Number`
  * `Separator`

**Prefix Each Line / Suffix Each Line:**
* **Option:** `Prefix/Suffix Text`
* **Type:** Text input

**Zalgo Text:**
* **Option:** `Intensity`
* **Type:** Slider
* **Axes:** `Up`, `Mid`, `Down`

**Clap Text:**
* **Option:** `Separator`
* **Type:** Select (`👏`, `✨`, custom)

**Sparkle Text:**
* **Option:** `Emoji`
* **Type:** Select

---

## CODE EDITOR (Monaco-based)

Contain tools 1-191 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

### UI PATTERN
`[Monaco Editor (Input)] ⇄ [Monaco Editor (Output)]` *(bidirectional)*

### PAGE LAYOUT DESIGN

#### TOOL LISTING: (Grid layout)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                CODE EDITOR                                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  CSV ⇄ JSON (toggle)            │  │  TSV ⇄ JSON (toggle)            │  │  TSV ⇄ CSV (toggle)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  XML ⇄ JSON (toggle)            │  │  YAML ⇄ JSON (toggle)          │  │  TOML ⇄ JSON (toggle)           │   │
│  │                                 │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Avro (binary) → JSON           │  │  HOCON ⇄ JSON (toggle)         │  │  Properties ⇄ JSON (toggle)     │   │
│  │                                 │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  JSON Validator                 │  │  JSON Formatter                 │  │  Dockerfile Lint & Normalize    │   │
│  │                                 │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### CONVERSION DIALOG POPUP:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                     │
│  CSV ⇄ JSON (toggle)                                                                               │
│  (description)                                                                                      │
│                                                                                                     │
│ CSV (dynamic)                   [FILE UPLOAD]    JSON (dynamic)                                     │
│ ┌─────────────────────────────────────────────┐  ┌────────────────────────────────────────────────┐ │
│ │                                             │  │                                   [COPY TEXT]  │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │ *                                           │  │ * Editing is disable for output section        │ │
│ │ *                                           │  │ * User can toggle to edit output               │ │
│ │ *                                           │  │                                                │ │
│ │ *                                           │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ │                                             │  │                                                │ │
│ └─────────────────────────────────────────────┘  └────────────────────────────────────────────────┘ │
│                                                                                                     │
│                                             [ CONVERT ]                                             │
│                                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOOL OPTIONS                                                                                        │
│                                                                                                     │
│ *                                                                                                   │
│ *                                                                                                   │
│ *                                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR CODE EDITOR

#### 1. Editor Ownership & Source of Truth

* **Two Monaco editors exist**: `Input` and `Output`
* At any moment, **exactly one editor is the source of truth**
* Source editor is:
  * Editable
  * Owns undo/redo stack
  * Drives conversion
* Target editor is:
  * Read-only by default
  * Derived state
  * Does **NOT** affect undo history

> Toggle tools (⇄) can swap source/target roles explicitly.

#### 2. Conversion Trigger Rules

* **NO auto-conversion**
* Conversion occurs **only** when user clicks `[CONVERT]`
* Changing:
  * Options
  * Toggle direction
  * Uploading a file
    does **not** auto-run conversion

Rationale:

* Prevents expensive recomputation
* Preserves Monaco undo semantics
* Avoids accidental destructive edits

#### 3. Undo / Redo Semantics

* Undo stack applies **only to the active source editor**
* Conversion:
  * Replaces entire content of target editor
  * Does **NOT** push entries into source undo stack
* Swapping source/target:
  * Preserves independent undo stacks
  * No history merging

#### 4. Bidirectional (⇄) Tool Rules

For tools marked `⇄`:

* Direction toggle:
  * Swaps labels
  * Swaps source/target editor roles
  * Does **not** transform content automatically
* User must click `[CONVERT]` again after toggle
* Validation rules re-bind to new source editor

#### 5. Read-only Output Locking

* Output editor defaults to **read-only**
* Optional “Edit Output” toggle:
  * Promotes output editor to source
  * Demotes previous source to read-only
  * No implicit conversion happens

This ensures:

* Explicit user intent
* Predictable state transitions

#### 6. File Upload Integration

* File upload:
  * Injects content into **current source editor**
  * Replaces its content fully
  * Pushes **one** undo checkpoint
* Binary formats (Avro, Parquet, BSON):
  * File upload **required**
  * Text input disabled until file present

#### 7. Determinism & Cacheability Rules

* Deterministic tools:
  * Same input + same options → same output
  * Safe for memoization
* Cache key includes:
  * Source content hash
  * Tool ID
  * Direction
  * All option values
* Non-deterministic tools (very rare in Code Editor):
  * Explicitly marked
  * Cache disabled

#### 8. Async Execution Rules

* Tools marked `Async = Yes`:
  * Run in background worker
  * UI shows progress / spinner
  * Editor remains editable
* Cancellation:
  * New `[CONVERT]` cancels in-flight job
* Partial output streaming:
  * **Not allowed**
  * Output editor updates only on completion

#### 9. Error Handling & Diagnostics

* Parsing or conversion errors:
  * Never overwrite source editor
  * Target editor remains unchanged
* Errors are surfaced via:
  * Monaco diagnostics (red squiggles)
  * Or diagnostics panel (validator pattern)
* Error output is **non-destructive**

#### 10. Validator Pattern (Non-destructive)

Applies to:

* JSON / YAML / XML / SQL / OpenAPI / GraphQL validators

Rules:

* Input editor editable
* Diagnostics panel read-only
* No output editor mutation
* No undo stack impact
* Diagnostics auto-clear on input change

#### 11. Diff Pattern Rules

Applies to:

* JSON Diff
* Schema Diff
* OpenAPI Diff
* Line-by-Line Diff

Rules:

* Two independent editable inputs
* Diff view:
  * Derived
  * Read-only
  * No cursor
* Diff does not affect undo history
* Diff recalculated only on explicit action

#### 12. Formatting vs Conversion Distinction

* **Formatters**:
  * Operate on same language
  * Preserve semantic meaning
  * Replace target editor content
* **Converters**:
  * Change representation / schema / language
  * May lose fidelity (documented as Primary Risk)

UI must visually distinguish:

* Formatter tools
* Converter tools
* Validator tools
* Diff tools

#### 13. Language Mode & Syntax Binding

* Monaco language mode:
  * Auto-detected from tool
  * Overrides file extension heuristics
* Output editor language updates **after** conversion
* Invalid language → fallback to plaintext

#### 14. Security & Sandbox Rules

* No tool executes user code
* No network access unless explicitly required (e.g., schema registry)
* Uploaded files processed in sandbox
* Max input size enforced per tool tier

#### 15. State Persistence

* Editor content persists:
  * In-memory always
  * Optionally localStorage (opt-in)
* Tool options persist per tool
* Direction toggle state persists per session

#### 16. Accessibility & UX Guarantees

* Keyboard-first navigation
* Editor focus never stolen after conversion
* Errors announced via ARIA
* Large files:
  * Soft warning
  * Conversion still allowed unless hard limit exceeded

### TOOL OPTIONS LIST

**CSV ⇄ JSON:**
**Options:**
* `Header Row` → `Yes | No`
* `Delimiter` → `, | ; | Tab | Custom`
* `Quote Character` → `" | ' | None`
* `Null Handling` → `Empty → null | Omit`
* `Type Inference` → `On | Off`

**TSV ⇄ JSON:**
**Options:**
* `Header Row`
* `Null Handling`
* `Type Inference`

**TSV ⇄ CSV:**
**Options:**
* `Target Delimiter`
* `Quote Character`

**XML ⇄ JSON:**
**Options:**
* `Attribute Handling` → `@attr | attr`
* `Text Node Key` → `#text | value`
* `Array Detection` → `Repeat tags | Explicit`
* `Namespace Handling` → `Strip | Preserve`

**YAML ⇄ JSON:**
**Options:**
* `Schema Mode` → `JSON Schema | YAML native`
* `Anchor Handling` → `Resolve | Preserve`

**TOML ⇄ JSON:**
**Options:**
* `Datetime Format`
* `Inline Tables` → `Expand | Preserve`

**INI ⇄ JSON:**
**Options:**
* `Section Strategy` → `Nested | Flat`
* `Duplicate Keys` → `Override | Array`

**HOCON ⇄ JSON:**
**Options:**
* `Resolve Substitutions` → `Yes | No`
* `Include Handling` → `Inline | Ignore`

**Properties ⇄ JSON:**
**Options:**
* `Dot-notation Expansion` → `a.b.c → nested`
* `Encoding` → `UTF-8 | ISO-8859-1`

**BSON ⇄ JSON:**
**Options:**
* `Extended JSON Mode` → `Canonical | Relaxed`

**MessagePack ⇄ JSON:**
**Options:**
* `Binary Handling` → `Base64 | Omit`
* `Timestamp Mode`

**Avro (binary) → JSON:**
**Options:**
* `Schema Source` → `Inline | Upload | Registry`
* `Preview Depth`

**Parquet ⇄ JSON:**
**Options:**
* `Table Projection` → `Rows | Columns`
* `Row Limit`
* `Nested Strategy` → `Flatten | Preserve`

**NDJSON ⇄ JSON Array:**
**Options:**
* `Error Handling` → `Skip invalid | Fail`
* `Trailing Newline Policy`

**JSON ⇄ URL Query Params:**
**Options:**
* `Array Strategy` → `repeat | comma | bracket`
* `Nested Strategy` → `Dot | Bracket`

**JSON ⇄ Form-Data:**
**Options:**
* `File Field Detection`
* `Boundary Mode`

**Avro ⇄ JSON Schema:**
**Options:**
* `Logical Type Mapping`
* `Union Handling`

**Protobuf ⇄ JSON:**
**Options:**
* `Descriptor Source`
* `Enum Style` → `String | Number`

**OpenAPI 2 ⇄ OpenAPI 3:**
**Options:**
* `Security Scheme Mapping`
* `Ref Strategy` → `Inline | $ref`

**OpenAPI ⇄ TypeScript:**
**Options:**
* `Client Style` → `Fetch | Axios`
* `Nullability Mode`
* `Readonly Models`

**OpenAPI ⇄ GraphQL:**
**Options:**
* `Operation Mapping Strategy`
* `Pagination Style`

**GraphQL Schema ⇄ TypeScript:**
**Options:**
* `Resolver Signature Style`
* `Maybe Type` → `T | T | null`

**JSON Schema ⇄ TypeScript:**
**Options:**
* `Strictness Level`
* `AdditionalProperties Handling`

**JSON Schema ⇄ Zod / Joi:**
**Options:**
* `Validation Strictness`
* `Default Value Injection`

**SQL DDL ⇄ JSON Schema:**
**Options:**
* `Dialect` → `MySQL | PostgreSQL | SQLite`
* `Relationship Handling` → `Ignore | $ref`

**JSON Formatter (Minifier):**
**Options:**
* `Indent Size`
* `Sort Keys`

**XML Formatter:**
**Options:**
* `Indent Size`
* `Attribute Line Breaks`

**SQL Formatter:**
**Options:**
* `Dialect`
* `Keyword Case`
* `Line Wrapping`

**Markdown Formatter:**
**Options:**
* `Line Length`
* `List Style`

**Code Formatter (Prettier-style):**
**Options:**
* `Language`
* `Print Width`
* `Semicolons`
* `Quote Style`

**Indentation Converter:**
**Options:**
* `From` → `Tabs | Spaces`
* `To` → `Tabs | Spaces`
* `Spaces per Tab`

**Line Ending Normalizer:**
**Options:**
* `Target` → `LF | CRLF | CR`

**Key Sorter:**
**Options:**
* `Sort Order` → `ASC | DESC`
* `Deep Sort` → `Yes | No`

**JSONPath Tester:**
**Options:**
* `Engine` → `Jayway | Goessner`
* `Result Mode` → `First | All`

**XPath Tester:**
**Options:**
* `XPath Version` → `1.0 | 2.0`
* `Namespace Map`

**Regex Tester:**
**Options:**
* `Regex Flavor` → `PCRE | JS | RE2`
* `Flags` → `g i m s`

**Cron Expression Validator:**
**Options:**
* `Cron Type` → `UNIX | Quartz`
* `Timezone`

**TypeScript ⇄ JavaScript:**
**Options:**
* `Target ECMAScript`
* `Module System`

**Flow ⇄ TypeScript:**
**Options:**
* `Exact Types Strategy`
* `Unsupported Feature Handling`

**Kotlin / Swift / Java / C# → TypeScript:**
**Options:**
* `Nullability Mapping`
* `Collection Mapping`
* `Naming Convention`

**SCSS / Less / Stylus ⇄ CSS:**
**Options:**
* `Minify`
* `Source Maps`
* `Variable Strategy`

**Docker Compose ⇄ Kubernetes:**
**Options:**
* `Service Mapping Strategy`
* `Ingress Generation`

**Terraform → CloudFormation:**
**Options:**
* `Provider Mapping`
* `State Handling`

**ENV ⇄ Docker Compose:**
**Options:**
* `Service Target`
* `Secret Handling`

**JWT Decoder:**
**Options:**
* `Clock Skew`
* `Claim Highlighting`

**JWT ⇄ JSON Claims:**
**Options:**
* `Signing Algorithm`
* `Secret / Public Key`

**JSON Diff / Schema Diff / OpenAPI Diff:**
**Options:**
* `Diff Mode` → `Structural | Semantic`
* `Ignore Order`
* `Path Filters`

**Line-by-Line Diff:**
**Options:**
* `Whitespace Sensitivity`
* `Ignore Case`

**Unicode Normalizer:**
**Options:**
* `Form` → `NFC | NFD | NFKC | NFKD`

**Unicode Category Filter:**
**Options:**
* `Categories` → `Letter | Mark | Symbol`

**Text Direction Normalizer:**
**Options:**
* `Target Direction` → `LTR | RTL`
* `Override Marks`

> Option changes do NOT auto-trigger conversion.
> User must explicitly click [CONVERT].

#### Validator Pattern

`[Monaco Editor (Input)] → [Diagnostics Panel (Output)]`

- Input Editor: editable
- Diagnostics Panel: read-only, non-destructive
- No output editor mutation
- No undo stack impact

#### Diff Pattern

`[2 Monaco Editor (Input)] → [Diff (Output)]`

- Both inputs editable
- Diff view is derived, read-only
- Diff does NOT participate in undo history

---

## FILE CONVERTER (Upload & Processing)

Contain tools 298-379 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Dropzone / Upload] → [Settings / Options] → ([Canvas / Preview / Controls] optional) → [Download]`

### PAGE LAYOUT DESIGN

#### TOOL LISTING: (Grid layout)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             FILE CONVERTOR                                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Raster ⇄ Raster                │  │  Camera RAW → Standard Images   │  │  Image ⇄ Base64                │   │
│  │    (PNG, JPG, BMP, TIFF, GIF)   │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Audio ⇄ Audio                  │  │  Audio Cutter / Trimmer         │  │  Extract Audio from Video       │   │
│  │    (PNG, JPG, BMP, TIFF, GIF)   │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Video ⇄ Video                  │  │  Video Compressor / Resizer     │  │  Video ⇄ GIF                   │   │
│  │    (PNG, JPG, BMP, TIFF, GIF)   │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  DOCX ⇄ PDF                     │  │  EPUB ⇄ MOBI                   │  │  PDF Page: Merge                │   │
│  │    (PNG, JPG, BMP, TIFF, GIF)   │  │                                 │  │                                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  │                                 │  │                                 │  │                                 │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### CONVERSION DIALOG POPUP:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│       CSV ⇄ JSON                                                     │
│       (description)                                                  │
│                                                                      │
│                ┌───────────────────────────────────────────┐         │
│                │                                           │         │
│                │              [FILE UPLOAD]                │         │
│                │                                           │         │
│                │              TOOL OPTIONS                 │         │
│                │                                           │         │
│                │              *                            │         │
│                │              *                            │         │
│                │                                           │         │
│                └───────────────────────────────────────────┘         │
│                                                                      │
│                                   [ CONVERT ]                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR FILE CONVERTER

#### 1. FILE-FIRST EXECUTION MODEL

1. File Converters **do not operate on text buffers**
2. **At least one file upload is mandatory** to enable conversion
3. Tools remain disabled until:

   * Required file(s) uploaded
   * Mandatory options validated
4. Clipboard / paste input is **not supported**

#### 2. DROPZONE & FILE INGEST RULES

* Supported input types are **tool-defined**
* Multiple files allowed only if tool explicitly supports batching
* Uploaded files are:

  * Fully loaded into memory
  * Never streamed
* Encoding auto-detection:

  * UTF-8 default
  * Binary-safe fallback

### File Replacement

* Uploading a new file **replaces previous input**
* No implicit history is kept

#### 3. MULTI-FILE & BATCH BEHAVIOR

| Tool Type    | Rule                                    |
| ------------ | --------------------------------------- |
| Single-input | Exactly one file required               |
| Multi-input  | All required files must be present      |
| Batch tools  | Order preserved unless option overrides |

Batch tools must provide:

* File list preview
* Deterministic processing order

#### 4. CONVERSION LIFECYCLE

```
UPLOAD → OPTIONS VALIDATED → CONVERT → PROCESSING → DOWNLOAD
```

Rules:

* Conversion starts **only** on `[CONVERT]`
* No auto-processing on option change
* `[CONVERT]` disabled during processing
* Re-run requires explicit user action

#### 5. ASYNC & LONG-RUNNING JOB RULES

Applies to:

* Video
* Audio
* Large documents
* Speech-to-Text

Rules:

1. All async tools bind to an **immutable input snapshot**
2. Changing:

   * Files
   * Options
     cancels the pending job
3. Partial results are **never rendered**
4. Output becomes available **only on success**

UI:

* Spinner / progress indicator
* Non-blocking
* Cancel occurs implicitly on input change

#### 6. PREVIEW & CANVAS RULES

Preview is **optional** and tool-specific.

If present:

* Preview is **derived state**
* Editing preview does **not** modify source file
* Preview never affects output determinism

Examples:

* Image thumbnail
* PDF page viewer
* Audio waveform
* Video frame scrubber

#### 7. OUTPUT & DOWNLOAD CONTRACT

* Output is generated as:

  * Single file, or
  * ZIP archive (for multi-file output)
* Download button appears **only after successful conversion**
* No auto-download
* Output filename rules:

  * Deterministic
  * Sanitized
  * Collision-safe

#### 8. DETERMINISM & CACHE RULES

* Deterministic tools:

  * Same input + same options → same output
  * Eligible for caching
* Cache key includes:

  * File hash(es)
  * Tool ID
  * All option values
* Non-deterministic tools:

  * Explicitly marked
  * Cache disabled

#### 9. ERROR HANDLING & FAILURE MODES

| Failure Type       | Behavior                 |
| ------------------ | ------------------------ |
| Invalid file       | Inline error             |
| Unsupported format | Tool-level error         |
| Decode failure     | Non-blocking error toast |
| Option conflict    | Inline validation        |
| Runtime failure    | No output, retry allowed |

Rules:

* Failed jobs produce **no output**
* Previous successful outputs remain downloadable
* Errors never corrupt uploaded files

#### 10. SAFETY & LIMITS

* Max file size: tool-tier dependent
* Max output expansion:

  * 10× input (hard cap)
* Hard abort on:

  * Memory pressure
  * Archive bombs
  * Infinite media duration

User receives:

* Warning toast
* No partial output

#### 11. SECURITY & PRIVACY

* Files processed in sandbox
* No file contents logged
* No background persistence
* Temporary files destroyed after job completion

#### 12. ACCESSIBILITY & UX GUARANTEES

* Full keyboard navigation
* Screen reader labels for:

  * Dropzone
  * Options
  * Convert button
* Errors announced via ARIA
* Mobile-safe upload handling

#### 13. INTENTIONAL LIMITATIONS

File Converter **does not**:

* Edit files in place
* Stream partial outputs
* Auto-save results
* Require accounts
* Modify original uploads

### TOOL OPTIONS LIST

**Raster ⇄ Raster**
**Options:**
* `Output Format`
* `Quality / Compression`
* `Color Profile` → `sRGB | Preserve`
* `DPI / Resolution`

---

**HEIC / HEIF → Standard Formats**
**Options:**
* `Output Format`
* `Quality`
* `HDR Handling` → `Tone map | Flatten`

---

**Camera RAW → Standard Images**
**Options:**
* `White Balance` → `Auto | Preset | Custom`
* `Exposure Compensation`
* `Color Space`
* `Output Bit Depth`

---

**PSD / PSB → Standard Formats**
**Options:**
* `Layer Handling` → `Flatten | Export layers`
* `Color Profile`
* `Transparency`

---

**AI / EPS → Raster & Vector Outputs**
**Options:**
* `Output Type` → `Raster | SVG | PDF`
* `Raster DPI`
* `Artboard Selection`

---

**SVG → Raster & Vector**
**Options:**
* `Target Format`
* `Viewport Size`
* `Scale Factor`
* `Font Handling` → `Embed | Outline`

---

**Image ⇄ Base64**
**Options:**
* `Encoding Variant` → `Standard | Data URI`
* `Line Wrapping`

---

**Image ⇄ ASCII Art**
**Options:**
* `Character Set`
* `Output Width`
* `Invert Brightness`
* `Color Mode` → `Mono | ANSI`

---

**Image: Resize**
**Options:**
* `Width / Height`
* `Aspect Ratio Lock`
* `Resampling Method`

---

**Image: Crop**
**Options:**
* `Crop Area` → `Manual | Preset`
* `Anchor Point`

---

**Image: Rotate**
**Options:**
* `Angle`
* `Auto-correct Orientation`

---

**Image: Flip**
**Options:**
* `Direction` → `Horizontal | Vertical`

---

**Image: Canvas Resize**
**Options:**
* `Canvas Size`
* `Background Color`
* `Anchor Position`

---

**Image: Convert Color Mode**
**Options:**
* `Target Mode`
* `ICC Profile Handling`
* `Black Point Compensation`

---

**Image: Batch Filters**
**Options:**
* `Brightness`
* `Contrast`
* `Saturation`
* `Apply Order`

---

**Video ⇄ Video**
**Options:**
* `Codec`
* `Container`
* `Resolution`
* `Frame Rate`
* `Bitrate`

---

**Video Compressor / Resizer**
**Options:**
* `Target Size | Bitrate`
* `Resize Mode`
* `Quality Preset`

---

**Video ⇄ GIF**
**Options:**
* `Frame Rate`
* `Scale`
* `Color Palette`
* `Loop Mode`

---

**Extract Audio from Video**
**Options:**
* `Audio Format`
* `Channels`
* `Bitrate`

---

**Audio ⇄ Audio**
**Options:**
* `Codec`
* `Bitrate`
* `Sample Rate`
* `Channels`

---

**Audio Cutter / Trimmer**
**Options:**
* `Start Time`
* `End Time`
* `Fade In/Out`

---

**Audio ⇄ Text (Speech-to-Text)**
**Options:**
* `Language`
* `Model / Accuracy Tier`
* `Speaker Diarization`
* `Timestamp Mode`

---

**TXT ⇄ PDF**
**Options:**
* `Page Size`
* `Font`
* `Margins`
* `Encoding`

---

**TXT ⇄ DOCX**
**Options:**
* `Font`
* `Paragraph Handling`
* `Line Wrapping`

---

**DOCX ⇄ PDF**
**Options:**
* `Layout Fidelity`
* `Embed Fonts`
* `Image Compression`

---

**DOCX ⇄ ODT / RTF**
**Options:**
* `Style Mapping`
* `Compatibility Mode`

---

**PPTX ⇄ PDF**
**Options:**
* `Slide Scaling`
* `Include Notes`
* `Image Quality`

---

**EPUB ⇄ PDF**
**Options:**
* `Page Size`
* `Font Embedding`
* `Flow Mode` → `Reflow | Fixed`

---

**Markdown ⇄ PDF**
**Options:**
* `Theme`
* `Code Highlighting`
* `Page Size`
* `TOC Generation`

---

**Markdown ⇄ HTML**
**Options:**
* `Markdown Flavor`
* `HTML Sanitization`
* `CSS Injection`

---

**PDF ⇄ HTML**
**Options:**
* `Layout Mode` → `Exact | Reflow`
* `Image Handling`
* `Font Strategy`

---

**XLSX / XLS ⇄ CSV**
**Options:**
* `Sheet Selection`
* `Delimiter`
* `Date Format`
* `Encoding`

---

**ODS ⇄ XLSX**
**Options:**
* `Formula Handling`
* `Style Preservation`

---

**ZIP / RAR / 7z / TAR / GZ / TGZ / BZ2 / XZ**
**Options:**
* `Compression Level`
* `Password`
* `Encryption Method`
* `Preserve Permissions`

---

**Rename Files in Bulk**
**Options:**
* `Pattern`
* `Counter Style`
* `Preview Mode`

---

**Change File Extensions**
**Options:**
* `Target Extension`
* `Recursive Mode`

---

**Flatten / Merge Folders**
**Options:**
* `Conflict Resolution`
* `Depth Limit`

---

**Font ⇄ TTF / OTF / WOFF / WOFF2**
**Options:**
* `Subset Characters`
* `Hinting`
* `Compression`
* `Metadata Preservation`

---

**PDF Page: Merge**
**Options:**
* `Order`
* `Interleave Mode`

---

**PDF Page: Split**
**Options:**
* `Split Rule` → `By page | Range | Size`

---

**PDF Page: Extract / Delete / Reorder**
**Options:**
* `Page Ranges`

---

**PDF Page: Rotate**
**Options:**
* `Angle`
* `Scope` → `All | Selected`

---

**PDF Page: Crop / Resize**
**Options:**
* `Box Type` → `Media | Crop`
* `Dimensions`

---

**PDF Page: N-Up**
**Options:**
* `Rows x Columns`
* `Spacing`

---

**PDF Page: Alternate Mix**
**Options:**
* `Mix Pattern`
* `Start Page`

---

**Compress PDF**
**Options:**
* `Compression Level`
* `Image Downsampling`

---

**PDF: Header & Footer**
**Options:**
* `Content`
* `Position`
* `Page Range`

---

**PDF: Page Numbers**
**Options:**
* `Format`
* `Start Number`
* `Position`

---

**PDF: Watermark**
**Options:**
* `Text | Image`
* `Opacity`
* `Rotation`
* `Scope`

---

**PDF: Bates Numbering**
**Options:**
* `Prefix`
* `Start Number`
* `Placement`

---

**PDF: Protect PDF**
**Options:**
* `Password`
* `Permissions`
* `Encryption Strength`

---

**PDF: Unlock PDF**
**Options:**
* `Password`

---

**PDF: Redact**
**Options:**
* `Redaction Mode`
* `Pattern / Area`
* `Burn-in Confirmation`

---

**PDF: Edit Metadata**
**Options:**
* `Fields to Modify`

---

**PDF: Rename by Content**
**Options:**
* `Extraction Rule`
* `Sanitization Rules`

---

**PDF → PDF/A**
**Options:**
* `PDF/A Level` → `A-1 | A-2 | A-3`
* `Color Profile`

---

**Metadata Viewer & Editor**
**Options:**
* `Metadata Standard`
* `Write Mode`
* `Strip Sensitive Fields`

---

**File Hash Generator**
**Options:**
* `Hash Algorithm`
* `Chunk Size (large files)`

---

## GENERATORS (Form-based)

Contain tools 380-414 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Form Fields] → [Generate Button] → [Output]`

### PAGE LAYOUT DESIGN

#### TOOL LISTING: (Grid layout)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             GENERATORS                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  UUID GENERATOR                 │  │  Password Generator             │  │  Random Number Generator        │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Sitemap Generator              │  │  Favicon Generator              │  │  Color Palette Generator        │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Timestamp Converter            │  │  CSS Filter Generator           │  │  Grid Generator                 │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### CONVERSION DIALOG POPUP:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│       UUID GENERATOR                                                 │
│       (description)                                                  │
│                                                                      │
│                ┌───────────────────────────────────────────┐         │
│                │                                           │         │
│                │              TOOL OPTIONS                 │         │
│                │                                           │         │
│                │              *                            │         │
│                │              *                            │         │
│                │                                           │         │
│                └───────────────────────────────────────────┘         │
│                                                                      │
│                                 [ GENERATE ]                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR GENERATOR

#### 1. FORM-DRIVEN EXECUTION MODEL

1. Generators operate on **form input only**
2. No shared text buffer (SPT model does NOT apply)
3. Output is **derived**, never editable
4. Tool execution occurs **only** on explicit `[GENERATE]`

#### 2. FORM & OPTION VALIDATION

* `[GENERATE]` remains disabled until:
  * All required fields are valid
* Validation is:
  * Inline
  * Non-blocking
* Invalid fields:
  * Highlighted
  * Error message shown near field
* No modal confirmations

#### 3. DETERMINISM & RANDOMNESS HANDLING

| Tool Type         | Behavior                         |
| ----------------- | -------------------------------- |
| Deterministic     | Silent generation                |
| Partial           | Info hint explaining determinism |
| Non-deterministic | ⚠ warning toast                  |

Non-deterministic warning:

```
⚠ This generator produces random output.
```

Rules:

* Toast appears on each generate
* No caching for non-deterministic tools
* Random seed is internal and opaque

#### 4. GENERATION LIFECYCLE

```
FILL FORM → VALIDATE → GENERATE → OUTPUT
```

Rules:

* Re-clicking `[GENERATE]`:
  * Replaces output
  * Does NOT append
* Option changes do not auto-regenerate
* Output refresh is atomic

#### 5. OUTPUT CONTRACT

* Output is:
  * Text
  * Structured data
  * Visual artifact (SVG / Image)
* Output panel is:
  * Read-only
  * Copyable
* Copy action:
  * Never mutates state
  * Respects selected output when applicable

#### 6. MULTI-OUTPUT GENERATORS

If multiple outputs are produced:

* Outputs are grouped
* Deterministic order guaranteed
* Download / copy applies per output block

#### 7. ASYNC & HEAVY GENERATORS

Applies to:

* Sitemap Generator
* Image / Favicon generators
* External-resource generators

Rules:

1. Async job binds to:
   * Form snapshot
2. Changing any field:
   * Cancels pending job
3. Partial output is never rendered
4. Output appears only on success

#### 8. ERROR HANDLING

| Error Type          | UI Response        |
| ------------------- | ------------------ |
| Invalid params      | Inline error       |
| Runtime failure     | Non-blocking toast |
| External fetch fail | Retry hint         |

Rules:

* Failed generation produces no output
* Previous output remains visible
* No undo history

#### 9. CACHING RULES

* Cacheable generators:
  * Deterministic only
* Cache key:
  * Tool ID
  * Version
  * Full parameter set
* Random generators:
  * Cache disabled

#### 10. SECURITY & MISUSE SAFEGUARDS

* Sensitive generators (JWT, API Key):
  * Warning note displayed
  * No persistence
* Generated secrets:
  * Never logged
  * Never stored

#### 11. ACCESSIBILITY & UX

* Keyboard navigable forms
* Screen reader labels
* No color-only validation
* Mobile-safe controls

#### 12. INTENTIONAL LIMITATIONS

Generators do **not**:

* Auto-save output
* Sync across sessions
* Require accounts
* Modify user files

### TOOL OPTIONS LIST

**UUID Generator**

* `Version` → v1 | v4 | v5
* `Namespace` (v5)
* `Output Count`

**Password Generator**

* `Length`
* `Character Sets`
* `Exclude Ambiguous`
* `Require Symbols / Numbers`

**JWT Generator**

* `Algorithm`
* `Payload Claims`
* `Expiry`
* `Secret / Key`

**Hash Generator**

* `Algorithm`
* `Encoding`
* `Uppercase Output`

**Lorem Ipsum Generator**

* `Unit` → Words | Sentences | Paragraphs
* `Count`

**QR Code / Barcode Generator**

* `Format`
* `Error Correction Level`
* `Size`
* `Foreground / Background`

**Username / Name Generator**

* `Style`
* `Length`
* `Separator`
* `Randomness Level`

**Random Quote Generator**

* `Category`
* `Length Preference`

**Random Number Generator**

* `Min`
* `Max`
* `Distribution`
* `Count`

**Signature / Monogram Generator**

* `Font Style`
* `Initials`
* `Stroke Width`

**Color Scheme / Palette Generator**

* `Base Color`
* `Harmony Rule`
* `Palette Size`

**API Key Generator**

* `Length`
* `Encoding`
* `Prefix`

**Meta Tags Generator**

* `Page Type`
* `SEO Preset`
* `Include Social Tags`

**Sitemap Generator**

* `Base URL`
* `Change Frequency`
* `Priority`
* `Include Images`

**Robots.txt Generator**

* `User Agents`
* `Allow / Disallow Rules`

**.htaccess Generator**

* `Use Case`
* `Redirect Type`
* `Security Presets`

**Open Graph / Twitter Card Generator**

* `Card Type`
* `Image URL`
* `Metadata Fields`

**Favicon Generator**

* `Source Image`
* `Sizes`
* `Background`

**Canonical URL Generator**

* `Base URL`
* `Normalization Rules`

**SEO Slug Generator**

* `Delimiter`
* `Lowercase`
* `Locale`

**Gradient Generator**

* `Type`
* `Colors`
* `Angle`

**Box Shadow Generator**

* `Offset`
* `Blur`
* `Spread`
* `Color`

**Flexbox Generator**

* `Direction`
* `Alignment`
* `Wrap`

**Grid Generator**

* `Columns`
* `Rows`
* `Gap`

**Border Radius Generator**

* `Corners`
* `Unit`

**CSS Clip-Path Generator**

* `Shape`
* `Coordinates`

**CSS Filter Generator**

* `Filter Types`
* `Intensity`

**CSS Transform / Animation Generator**

* `Transform Type`
* `Duration`
* `Timing Function`

**Typography / Text Shadow Generator**

* `Font`
* `Shadow Layers`

**Timestamp Converter**

* `Input Format`
* `Timezone`
* `Output Format`

**Placeholder Image Generator**

* `Width`
* `Height`
* `Theme`

**Password Strength Analyzer**

* `Ruleset`
* `Scoring Model`

**Emoji / Symbol Picker**

* `Category`
* `Skin Tone`

**QR Code with vCard**

* `Contact Fields`
* `QR Size`
* `Error Correction`

---

## CALCULATORS (Form-to-Result)

Contain tools 415-442 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Form Fields] → [Calculate Button] → [Result Panel]`

### PAGE LAYOUT DESIGN

#### TOOL LISTING: (Grid layout)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             CALCULATOR                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  BMI Calculator                 │  │  Grade & GPA Calculator         │  │  Zakat Calculator               │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Time Zone Date-Time Conversion │  │  Temperature Conversions        │  │  Pressure Measurements          │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  Electric Current & Voltage     │  │  Torque Measurements            │  │  Density Measurements           │   │
│  │  (small description)            │  │  (small description)            │  │  (small description)            │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### CONVERSION DIALOG POPUP:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│       BMI Calculator                                                 │
│       (description)                                                  │
│                                                                      │
│                ┌───────────────────────────────────────────┐         │
│                │                                           │         │
│                │              TOOL OPTIONS                 │         │
│                │                                           │         │
│                │              *                            │         │
│                │              *                            │         │
│                │                                           │         │
│                └───────────────────────────────────────────┘         │
│                                                                      │
│                                 [ CALCULATE ]                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR CALCULATORS

#### 1. FORM-TO-RESULT EXECUTION MODEL

1. Calculators operate strictly on **numeric / structured form inputs**
2. No free-text processing
3. Result is **computed**, not generated
4. Calculation occurs **only** on explicit `[CALCULATE]`

#### 2. INPUT VALIDATION & CONSTRAINTS

* All inputs must:

  * Match expected unit type
  * Respect min / max constraints
* `[CALCULATE]` button:

  * Disabled until form is valid
* Validation is:

  * Inline
  * Deterministic
* Invalid inputs block execution

#### 3. DETERMINISM GUARANTEE

* All calculators are:

  * Fully deterministic
  * Same input → same result
* No randomness
* No side effects
* Results are reproducible across sessions (same version)

#### 4. CALCULATION LIFECYCLE

```
INPUT → VALIDATE → CALCULATE → RESULT
```

Rules:

* Re-clicking `[CALCULATE]`:

  * Replaces result
* Changing any field:

  * Marks result as stale
* No auto-recalculation unless explicitly triggered

#### 5. RESULT PANEL CONTRACT

* Result panel:

  * Read-only
  * Clearly formatted
* Supports:

  * Primary result
  * Derived values (optional)
* Units are:

  * Explicit
  * Never implicit

#### 6. UNIT HANDLING RULES

* Unit selection:

  * Explicit dropdowns
* Conversion constants:

  * Fixed
  * Versioned
* Mixed-unit input:

  * Either normalized
  * Or explicitly rejected (tool-specific)

#### 7. PRECISION & ROUNDING

* Default precision:

  * Tool-defined
* Rounding rules:

  * Clearly stated
* No silent truncation
* Scientific notation allowed when necessary

#### 8. CACHING & PERFORMANCE

* Cacheable:

  * Yes (deterministic)
* Cache key:

  * Tool ID
  * Version
  * Full normalized input
* Cached results:

  * Never user-visible as “cached”

#### 9. ERROR HANDLING

| Error Type           | Behavior       |
| -------------------- | -------------- |
| Invalid input        | Inline error   |
| Calculation overflow | Result warning |
| Unsupported combo    | Hard block     |

Rules:

* Errors never crash UI
* Previous valid result remains visible
* No partial results rendered

#### 10. DOMAIN-SENSITIVE CALCULATORS

Applies to:

* Islamic Inheritance
* Zakat
* Radiation
* Medical / scientific units

Rules:

* Assumptions disclosed
* Legal / religious disclaimer shown
* User responsibility notice included

#### 11. ACCESSIBILITY & UX

* Keyboard navigable
* Screen-reader friendly labels
* No reliance on color alone
* Mobile-friendly numeric inputs

#### 12. INTENTIONAL LIMITATIONS

Calculators do **not**:

* Store user inputs
* Auto-convert contextually
* Guess units
* Sync results across tools

### TOOL OPTIONS LIST

**BMI Calculator**

* `Height`
* `Weight`
* `Unit System` (Metric / Imperial)

**Grade & GPA Calculator**

* `Grading Scale`
* `Course Credits`
* `Weighting Method`

**Islamic Inheritance Calculator**

* `Heirs`
* `Estate Value`
* `School of Jurisprudence`

**Zakat Calculator**

* `Asset Categories`
* `Liabilities`
* `Nisab Standard`

**Time Zone Date-Time Converter**

* `Source Timezone`
* `Target Timezone`
* `Date & Time`

**Length / Distance Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Weight / Mass Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Temperature Conversions**

* `Input Temperature`
* `Scale From`
* `Scale To`

**Area Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Volume Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Time Duration Conversions**

* `Input Duration`
* `From Unit`
* `To Unit`

**Speed / Velocity Measurements**

* `Value`
* `Distance Unit`
* `Time Unit`

**Energy Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Pressure Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Power Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Frequency Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Data / Digital Storage Units**

* `Input Size`
* `Binary / Decimal`
* `Target Unit`

**Electric Current & Voltage**

* `Known Values`
* `Ohm’s Law Mode`

**Angle Measurements**

* `Input Value`
* `Degree / Radian`

**Force Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Torque Measurements**

* `Input Value`
* `Lever Arm`
* `Force Unit`

**Fuel Consumption**

* `Distance`
* `Fuel Used`
* `Consumption Format`

**Radiation Measurements**

* `Input Value`
* `Radiation Type`
* `Target Unit`

**Density Measurements**

* `Mass`
* `Volume`
* `Unit System`

**Illumination Measurements**

* `Input Value`
* `From Unit`
* `To Unit`

**Magnetic Field Measurements**

* `Input Value`
* `Field Type`
* `Target Unit`

**Cooking & Recipe Units**

* `Ingredient`
* `From Unit`
* `To Unit`

**Paper & Printing Sizes**

* `Standard`
* `Orientation`
* `Dimensions Output`

---

## DATABASE SCHEMA VISUALIZATION (Schema/DB Diagrams)

Contain tools 443 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Monaco (DBML / SQL)] → [Parsed Model] → [Diagram Panel]`

### PAGE LAYOUT DESIGN

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATABASE SCHEMA VISUALIZER                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐  ┌───────────────────────────────────────────────────────────────────────┐ │
│ │                                   │  │                                                                       │ │
│ │ INPUT TABLE HERE                  │  │  INSTENT TABLE DIAGRAM HERE                                           │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ └───────────────────────────────────┘  └───────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR DATABASE SCHEMA VISUALIZER

#### 1. TEXT-TO-MODEL EXECUTION MODEL

1. Tool operates on **structured schema text** only
2. Accepted inputs:
   * DBML
   * SQL DDL
   * Other supported schema syntaxes
3. Free-form prose is not allowed
4. Diagram generation is derived from parsed schema, never manual

#### 2. PARSING & NORMALIZATION

* Input text is parsed into:
  * Abstract Syntax Tree (AST)
  * Normalized internal schema model
* All supported syntaxes must map to a **single canonical model**
* Parsing errors:
  * Do not crash UI
  * Are reported inline with location hints

#### 3. DETERMINISM GUARANTEE

* Same input schema → same parsed model
* Same parsed model → same diagram structure
* Layout may vary visually but:
  * Relationship topology must remain identical

#### 4. LIVE UPDATE & SYNC RULES

```
TEXT CHANGE → PARSE → MODEL UPDATE → LAYOUT → RENDER
```

Rules:

* Diagram updates automatically on valid parse
* Invalid schema:
  * Blocks re-render
  * Preserves last valid diagram
* No background auto-saving

#### 5. DIAGRAM GENERATION CONTRACT

* Diagram elements:
  * Tables as nodes
  * Relationships as edges
* Each table node includes:
  * Table name
  * Columns
  * Primary key indicators
  * Foreign key indicators
* Relationships must encode:
  * Direction
  * Cardinality (1:1, 1:N, N:M)

#### 6. LAYOUT ENGINE RULES

* Layout is automatic by default
* Supported layout strategies:
  * Force-directed
  * Hierarchical / DAG
* Manual repositioning:
  * Allowed
  * Does not alter schema semantics

#### 7. INTERACTION RULES

Users can:

* Drag tables
* Zoom and pan canvas
* Collapse / expand table columns
* Inspect table and relationship metadata

Users cannot:

* Create or delete schema entities visually
* Modify schema semantics via diagram

#### 8. ERROR HANDLING

| Error Type          | UI Behavior        |
| ------------------- | ------------------ |
| Syntax error        | Inline marker      |
| Unsupported feature | Warning badge      |
| Graph conflict      | Non-blocking toast |

Rules:

* Errors never partially render diagrams
* Diagram always reflects last valid model

#### 9. CACHING RULES

* Cacheable:
  * Yes (deterministic)
* Cache key:
  * Tool ID
  * Input hash
  * Parser version
* Cache stores:
  * Parsed model
  * Layout metadata

#### 10. EXPORT & OUTPUT RULES

* Diagram can be exported as:
  * SVG
  * PNG
* Exported output is:
  * Read-only
  * Detached from live editor
* No embedded execution logic

#### 11. PERFORMANCE & SCALE LIMITS

* Soft limits applied for:
  * Table count
  * Relationship density
* Large schemas may:
  * Degrade layout quality
  * Trigger performance warnings

#### 12. INTENTIONAL LIMITATIONS

This tool does **not**:

* Execute SQL
* Validate database engines
* Enforce naming conventions
* Auto-optimize schema design

### TOOL OPTIONS LIST

**Input & Parsing**

* `Input Language` (DBML / SQL / Other)
* `Strict Parsing Mode`
* `Ignore Unsupported Syntax`

**Diagram Layout**

* `Layout Strategy` (Force / Hierarchical)
* `Auto-Layout on Change`
* `Spacing Density`

**Table Display**

* `Show Columns`
* `Show Data Types`
* `Show Primary Keys`
* `Show Foreign Keys`

**Relationship Rendering**

* `Show Cardinality`
* `Edge Style` (Straight / Curved)
* `Arrow Direction`

**Interaction**

* `Enable Dragging`
* `Enable Zoom & Pan`
* `Snap to Grid`

**Styling**

* `Theme` (Light / Dark)
* `Table Color Scheme`
* `Relationship Line Style`

**Export**

* `Export Format` (SVG / PNG)
* `Include Metadata`
* `Resolution / Scale`

---

## FILE TREE VISUALIZATION

Contain tools 444 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Text / FS Input] → [Tree Renderer]`

### PAGE LAYOUT DESIGN

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FILE STRUCTURE VISUALIZER                                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐  ┌───────────────────────────────────────────────────────────────────────┐ │
│ │                                   │  │                                                                       │ │
│ │ INPUT HERE                        │  │  INSTENT FILE STRUCTURE TREE                                          │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ │                                   │  │                                                                       │ │
│ └───────────────────────────────────┘  └───────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                                         │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR FILE TREE VISUALIZER

#### 1. INPUT-TO-TREE EXECUTION MODEL

1. Tool accepts:
   * Plain text file/folder listings
   * Virtual tree definitions
   * Optional filesystem-derived structures (where supported)
2. Input is treated as **structural data**, not free prose
3. Rendering is derived strictly from parsed hierarchy

#### 2. CANONICAL TREE DATA MODEL

All inputs must normalize into a single internal structure:

```
Node {
  id: String
  name: String
  type: 'file' | 'folder'
  children?: Node[]
}
```

Rules:

* Files are always leaf nodes
* Only folders may contain children
* Order is preserved from input

#### 3. PARSING & NORMALIZATION RULES

* Input parser:
  * Builds a hierarchical tree
  * Resolves nesting by indentation, delimiters, or explicit paths
* Invalid structure:
  * Does not partially render
  * Preserves last valid tree
* Duplicate names allowed only if paths differ

#### 4. DETERMINISM GUARANTEE

* Same input → same tree structure
* Same tree → same rendered hierarchy
* UI interactions (expand/collapse) do not mutate tree data

#### 5. TREE RENDERING CONTRACT

* Tree rendered as:
  * Indented hierarchy
  * Expandable/collapsible nodes
* Visual distinction:
  * Folder vs file icons
  * Depth-based indentation
* Root node is always visible

#### 6. INTERACTION RULES

Users may:

* Expand / collapse folders
* Select nodes
* Copy tree representation

Users may not:

* Execute filesystem operations
* Implicitly rename or delete nodes (unless tool variant supports editing)

#### 7. STATE MANAGEMENT RULES

Maintained UI state includes:

```
{
  tree,
  expandedNodes,
  selectedNode
}
```

Rules:

* Expanded/collapsed state is UI-only
* Tree data remains immutable unless explicitly edited

#### 8. PERFORMANCE & DEPTH LIMITS

* Soft limits on:
  * Maximum depth
  * Total node count
* Excessive depth triggers:
  * Performance warning
  * Optional lazy rendering

#### 9. ERROR HANDLING

| Error Type        | UI Behavior                |
| ----------------- | -------------------------- |
| Invalid hierarchy | Inline error               |
| Depth overflow    | Warning toast              |
| Parse failure     | No render, state preserved |

Rules:

* Errors never corrupt last valid tree
* No partial tree rendering

#### 10. EXPORT & OUTPUT RULES

* Tree may be exported as:
  * Plain text
  * JSON
* Export is:
  * Read-only snapshot
  * Detached from live state

#### 11. SECURITY & SAFETY

* No real filesystem mutation
* No background directory access
* Virtual trees are sandboxed

#### 12. INTENTIONAL LIMITATIONS

This tool does **not**:

* Modify real files
* Sync with live directories
* Execute scripts
* Auto-detect project semantics

### TOOL OPTIONS LIST

**Input Handling**

* `Input Mode` (Text / Virtual Tree / FS)
* `Path Delimiter Style` (/, )
* `Indentation Type` (Spaces / Tabs)

**Rendering**

* `Show Root Node`
* `Show File Extensions`
* `Icon Style` (Minimal / Detailed)
* `Indent Size`

**Interaction**

* `Expand All`
* `Collapse All`
* `Enable Node Selection`

**Sorting**

* `Sort Folders First`
* `Alphabetical Order`
* `Preserve Input Order`

**Depth Control**

* `Max Render Depth`
* `Lazy Load Children`

**Export**

* `Export Format` (Text / JSON)
* `Include File Types`
* `Include Empty Folders`

**Styling**

* `Theme` (Light / Dark)
* `Line Guides` (On / Off)

---

## DOCUMENT GENERATION (Cheque/Layout-sensitive)

Contain tools 445 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Form / CSV Upload] → [Template Selector] → [PDF Preview] → [Download]`

### PAGE LAYOUT DESIGN

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      CHEQUE GENERATOR                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│ COUNTRY: [select country]                    BANK: [select bank]                            │
│                                                                                             │
│ ORIENTATION: [landscape/portrait]                                                           │
│                                                                                             │
│  Prefix          Payee                                                             Suffix   │
│ [ input ]  [ input                                                             ]  [ input ] │
│                                                                                             │
│  Prefix     Amount              Suffix                                    Date              │
│ [ input ]  [ input          ]  [ input ]                                 [ select date    ] │
│                                                                                             │
│  Prefix     Amount                                                                 Suffix   │
│ [ input ]  [ display in words                                                  ]  [ input ] │
│                                                                                             │
│ A/C payee [toggle]           Not Negotiable [toggle]             Or Bearer [toggle]         │
│                                                                                             │
│ Date Format [select date]    Text Case [select case]             Number System [select]     │
│                                                                                             │
│ Currency Format [select]                                                                    │
│                                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ CHEQUE PREVIEW                                                                          │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│                                [ UPLOAD CSV ] [ GENERATE ]                                  │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                    │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR DOCUMENT GENERATOR

#### 1. Layout Determinism Rules

* All rendered text **must fit within predefined bounding boxes** defined by the selected bank template.
* No dynamic resizing, wrapping, or auto-scaling is allowed unless explicitly defined in the template.
* Overflow behavior:

  * Text exceeding its bounding box is **clipped**, not wrapped.
  * The UI must show a **pre-generation warning** if overflow is detected.
* Font family, font size, and line height are **template-owned**, not user-configurable.

#### 2. Coordinate-Based Rendering Rules

* Every printable field maps to **absolute coordinates**:
  ```
  { x, y, width, height, font, fontSize, align }
  ```
* Units are template-defined (`pt`, `mm`, or `px`) and must not be mixed.
* Rendering origin is always **top-left** of the page.
* Orientation (`Portrait` / `Landscape`) swaps page dimensions but **does not recompute field coordinates**—templates must explicitly support orientation.

#### 3. Text Normalization Rules (Cheque-Specific)

* All printable strings must pass through:
  ```
  trim → normalizeSpaces → unicodeNormalize(NFC)
  ```
* Disallowed characters:
  * Newlines (`\n`)
  * Tabs (`\t`)
  * Control characters
* Replaced with a single space before rendering.

#### 4. Legal & Banking Constraint Rules

* `A/C Payee`, `Not Negotiable`, `Or Bearer`:
  * Are **mutually non-exclusive** unless restricted by the selected country template.
  * Rendering style (cross lines, watermark text, stamps) is **template-driven**.
* Amount in words **must align horizontally** and **must not wrap** under any condition.
* Date must be rendered **exactly once**; duplicate date rendering is forbidden.

#### 5. Template Resolution Rules

* Template resolution key:
  ```
  templates/{country}/{bank}/{orientation}.json
  ```
* If orientation-specific template is missing:
  * Fallback to default orientation template **only if explicitly allowed**
  * Otherwise → hard error
* Templates are immutable at runtime.

#### 6. Preview vs Final PDF Rules

* Preview rendering:
  * Rasterized (canvas / SVG)
  * May differ slightly in DPI
* Final PDF:
  * Vector-based (PDF primitives)
  * Must match preview **positionally** within ±1px tolerance
* Preview discrepancies beyond tolerance must block download.

#### 7. CSV → Document Rules (Bulk Mode)

* CSV-imported values:
  * Are **never auto-corrected silently**
  * Invalid rows are skipped with indexed error reporting
* Bulk generation uses:
  * The **same template**
  * The **same formatting rules**
  * The **same coordinate system**
* Per-row layout variance is not allowed.

#### 8. Printer Safety Rules

* Minimum printable margin:
  * 5mm on all sides unless overridden by template
* No content may be placed outside printable bounds.
* Background images must be optional (printer-ink safe mode).

#### 9. Determinism Guarantees (Document-Level)

* Given:
  * Same input data
  * Same template
  * Same version
* Output PDF **must be byte-identical**
* Time, locale, timezone, and OS must not influence rendering.

### TOOL OPTIONS LIST

#### A. Template & Layout Options

| Option           | Type   | Description                         |
| ---------------- | ------ | ----------------------------------- |
| Country          | Select | Determines available bank templates |
| Bank             | Select | Selects cheque layout template      |
| Orientation      | Select | Portrait / Landscape                |
| Template Version | Auto   | Locked to template metadata         |

#### B. Payee Options

| Option          | Type   | Constraints           |
| --------------- | ------ | --------------------- |
| Payee Prefix    | Input  | Max 10 chars          |
| Payee Name      | Input  | Max 35 chars          |
| Payee Suffix    | Input  | Max 10 chars          |
| Payee Text Case | Select | UpperCase / TitleCase |

#### C. Amount (Number) Options

| Option           | Type    | Constraints            |
| ---------------- | ------- | ---------------------- |
| Amount           | Numeric | Max 9 digits           |
| Number Prefix    | Input   | Currency symbol        |
| Number Suffix    | Input   | e.g. `/-`              |
| Numbering System | Select  | International / Indian |

#### D. Amount (Words) Options

| Option        | Type   | Constraints           |
| ------------- | ------ | --------------------- |
| Words Prefix  | Input  | e.g. `RUPEES`         |
| Words Suffix  | Input  | e.g. `ONLY`           |
| Amount Format | Select | UK / US               |
| Words Case    | Select | UpperCase / TitleCase |

#### E. Date Options

| Option      | Type        | Description           |
| ----------- | ----------- | --------------------- |
| Date        | Date Picker | ISO internally        |
| Date Format | Select      | Rendering format only |

#### F. Cheque Marking Options

| Option         | Type   | Behavior         |
| -------------- | ------ | ---------------- |
| A/C Payee      | Toggle | Renders crossing |
| Not Negotiable | Toggle | Template-stamp   |
| Or Bearer      | Toggle | Inline text      |

#### G. Input Mode Options

| Option              | Type     | Description     |
| ------------------- | -------- | --------------- |
| Single Entry        | Default  | Manual form     |
| CSV Upload          | Optional | Bulk generation |
| CSV Validation Mode | Auto     | Strict          |

#### H. Output Options

| Option       | Type         | Description  |
| ------------ | ------------ | ------------ |
| Preview      | Auto         | Live preview |
| Download PDF | Action       | Final output |
| Filename     | Auto / Input | Sanitized    |

#### I. Safety / Enforcement (Implicit Options)

* Disable Generate if:
  * Required fields missing
  * Overflow detected
  * Template unresolved
* Show warnings (non-blocking):
  * Long payee names
  * Large amounts
  * Printer margin risks

---

## ASYNC INTELLIGENCE SYSTEM (Scraping/Aggregation)

Contain tools 446 [30_TOOLS_CATALOG.md](30_TOOLS_CATALOG.md)

**UI Pattern:**
`[Identifiers / CSV] → [Async Jobs] → [Normalized Results Table / Export]`

### PAGE LAYOUT DESIGN

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                TRACK CONTAINER ACTIVITY                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  CONTAINER NO: [Input]                             TERMINAL: [Select Terminal]              │
│                                                                                             │
│                                [ Track Container ]                                          │
│                                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Tracked Result                                                                          │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ │                                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  FOOTER:                                                                                    │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SPECIFIC RULE FOR ASYNC INTELLIGENCE SYSTEM

#### 1. Identifier Normalization Rules

* All identifiers (container numbers, vessel names):
  * Are trimmed
  * Uppercased
  * Unicode-normalized (NFC)
* Whitespace, dashes, and special characters are removed unless explicitly required by a terminal.
* Invalid identifier formats:
  * Do **not** block job creation
  * Are flagged per-result as `INVALID_IDENTIFIER`

#### 2. Async Job Lifecycle Rules

Each tracking request creates an **immutable async job**.

**Job states:**

```
QUEUED → RUNNING → PARTIAL | COMPLETED | FAILED
```
* Jobs never mutate input identifiers.
* Jobs are **append-only**: results accumulate as terminals respond.
* A job may complete successfully even if:
  * One or more terminals fail
  * One or more containers are not found

#### 3. Partial Success & Degraded Completion Rules

* Partial data is considered a **valid outcome**
* Terminal-level failures:
  * Are isolated
  * Do not cancel the job
* UI must surface:
  * Which terminals were queried
  * Which terminals failed
  * Failure reasons (timeout, parse error, blocked, etc.)

#### 4. Source Volatility & Freshness Rules

* Scraped data is **time-sensitive**
* Each result row must include:
  ```
  fetched_at (UTC ISO timestamp)
  source_terminal
  source_url (optional)
  ```
* Cached responses:
  * Are allowed only within TTL
  * Must be marked as `cached: true`
* Cache bypass (`nocache=true`) forces live fetch and invalidates prior result for that job.

#### 5. Determinism Boundary Rules

* The system is **explicitly non-deterministic**
* Determinism applies only to:
  * Input normalization
  * Result schema
  * Aggregation logic
* External variance (terminal downtime, delays, data changes) is expected and accepted.

#### 6. Concurrency & Throttling Rules

* Max concurrency is controlled by:
  ```
  min(user_requested, system_limit, terminal_limit)
  ```
* Per-terminal rate limits are enforced independently.
* If rate limit is hit:
  * Terminal is skipped
  * Job continues
  * Result flagged as `RATE_LIMITED`

#### 7. Result Normalization Rules

All terminal-specific responses are normalized into a **canonical result shape**.

* Missing fields are:
  * Explicitly `null`
  * Never inferred
* Field names are consistent across terminals.
* No terminal-specific fields leak into the UI layer.

#### 8. Result Ordering Rules

* Results are ordered by:
  1. Input identifier order
  2. Terminal priority (if specified)
  3. Fetch completion time
* Ordering is stable and repeatable for a given job execution.

#### 9. Export & Persistence Rules

* Exports (CSV / JSON):
  * Reflect **exactly** what is visible in UI
  * Include metadata:
    ```
    job_id
    generated_at
    terminals_searched
    ```
* No background re-fetch occurs after export generation.

#### 10. Failure & Retry Rules

* Automatic retries:
  * Network failures only
  * Max 2 retries per terminal
* Logical failures (invalid HTML, schema mismatch):
  * No retries
  * Mark terminal as `UNSUPPORTED_RESPONSE`

#### 11. Security & Sanitization Rules

* Scraped content:
  * Treated as untrusted
  * Never rendered as HTML
* All output is plain text or structured JSON.
* User cannot inject headers, URLs, or scraper parameters.

#### TOOL OPTIONS LIST

#### A. Identifier Input Options

| Option           | Type  | Description        |
| ---------------- | ----- | ------------------ |
| Container Number | Input | Single identifier  |
| Vessel Name      | Input | Optional           |
| CSV Upload       | File  | Bulk identifiers   |
| Identifier Type  | Auto  | Container / Vessel |

#### B. Terminal Selection Options

| Option               | Type      | Description                 |
| -------------------- | --------- | --------------------------- |
| Terminal             | Select    | KICT, KGTL, QICT, SAPT      |
| Auto-Detect Terminal | Toggle    | Query all enabled terminals |
| Enabled Terminals    | Read-only | From system config          |

#### C. Async Job Options

| Option              | Type   | Description              |
| ------------------- | ------ | ------------------------ |
| Max Concurrency     | Number | Upper bound per job      |
| Include Vessel Data | Toggle | Enrich container results |
| Bypass Cache        | Toggle | Live fetch only          |
| Job Timeout         | Auto   | System-controlled        |

#### D. Bulk Processing Options

| Option              | Type     | Constraints |
| ------------------- | -------- | ----------- |
| Max Containers      | Auto     | 100/job     |
| CSV Validation Mode | Auto     | Strict      |
| Skip Invalid Rows   | Auto     | Enabled     |
| Stop-on-Error       | Disabled | Never       |

#### E. Result Display Options

| Option               | Type    | Description           |
| -------------------- | ------- | --------------------- |
| Normalized Table     | Default | Canonical schema      |
| Show Partial Results | Always  | Progressive rendering |
| Highlight Failures   | Auto    | Row-level             |
| Search / Filter      | UI      | Client-side           |

#### F. Export Options

| Option      | Type   | Description   |
| ----------- | ------ | ------------- |
| Export CSV  | Action | Normalized    |
| Export JSON | Action | Full metadata |
| Filename    | Auto   | Sanitized     |

#### G. Observability & Metadata (Implicit)

* Job ID (UUID)
* Execution duration
* Terminal response times
* Cache hit/miss indicators