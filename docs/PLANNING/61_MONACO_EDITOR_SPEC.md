# 61 — Monaco Editor Spec

> **Status**: SPEC/PROPOSAL — No Monaco wrapper built yet. Standard textarea in `packages/ui/`.
> **Package**: `@monaco-editor/react` (planned, not installed)

---

## Planned Components

### MonacoEditor Wrapper
- Props: `value`, `onChange`, `language`, `readOnly`, `height`, `showMinimap`, `autoFormat`, `validate`, `wordWrap`, `fontSize`
- Toolbar: word-wrap toggle, fullscreen toggle
- Auto-format on mount via `editor.action.formatDocument`
- Theme sync: `vs-dark` / `vs-light` via `next-themes`
- Language validation: JSON (built-in), YAML (custom `js-yaml`), JS/TS (built-in)

### MonacoDiffEditor
- Props: `original`, `modified`, `language`, `renderSideBySide`
- Used by diff/compare tools

### Prettier Integration
- Client-side formatting via `prettier/standalone` + language parsers
- Languages: JSON, JS, TS, HTML, XML, CSS, YAML, Markdown

### Keyboard Shortcuts
- Ctrl+S → format document
- Ctrl+Shift+F → find
- Ctrl+D → duplicate line

### Language Mapping
- JSON tools → `json`, YAML → `yaml`, XML → `xml`, HTML → `html`, CSS → `css`, SQL → `sql`
- SQL formatting via `sql-formatter` library

## Note
Tool execution UI pages (Task 1000) will determine when Monaco is actually needed vs textarea.
