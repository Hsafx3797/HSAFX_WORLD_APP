# 60 — Component Library Spec

> **Status**: SPEC/PROPOSAL — UI primitives exist in `packages/ui/`, tool-specific wrappers NOT yet built
> **Package location**: `packages/ui/src/components/` (shadcn/ui primitives: card, button, input, textarea, etc.)

---

## Components Defined (not yet built as separate components)

### Layout
- **ToolContainer** — Wraps every tool with breadcrumb, card, badges (coin cost, async), actions
- **InputSection** — Label + description + children (standardized input area)
- **OutputSection** — Read-only textarea with CopyButton + DownloadButton

### Actions
- **CopyButton** — `navigator.clipboard.writeText()` + toast + checkmark feedback
- **DownloadButton** — `Blob` + `URL.createObjectURL()` + anchor click download

### File Upload
- **FileUploader** — `react-dropzone` drag-and-drop + progress bar + file preview
- **FileUploadWithProgress** — Wraps FileUploader with Uploadthing `startUpload()` integration

### Options
- **OptionPanel** — Accordion wrapping OptionField list (auto-renders from `ToolOption[]`)
- **OptionField** — Switch on `option.type` → renders text/number/boolean/select input

### Status
- **ProgressIndicator** — queued/processing/completed/failed states + progress bar
- **ResultDisplay** — Alert with success/error/warning icon + message + optional actions

### Utilities
- **useKeyboardShortcuts** hook — Ctrl+Enter to execute, Ctrl+C to copy, etc.
- **useIsMobile** hook — `window.innerWidth < 768` responsive check

## Implementation Notes

- All components use shadcn/ui primitives from `packages/ui/`
- Composition pattern: small composable components, not monolithic
- Accessibility: ARIA labels, keyboard navigation on all interactive elements
- Tool pages (Task 1000) will compose these when built
