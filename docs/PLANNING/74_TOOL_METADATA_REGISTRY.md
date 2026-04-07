# 74 — Tool Metadata Registry

> **Status**: ✅ BUILT — `packages/tool-definitions/` with 7 category files, types, and registry index.

---

## Package Structure

```
packages/tool-definitions/src/
  types.ts          — ToolMetadata, ToolOption, ToolCategory, ToolTier, etc.
  registry/
    index.ts        — Combined exports, toolRegistry array (454 tools)
    text-tools.ts   — 191 text tool definitions
    data-tools.ts   — 106 data tool definitions
    media-tools.ts  — 83 media tool definitions
    generator-tools.ts — 37 generator definitions
    calculator-tools.ts — 9 calculator definitions
    converter-tools.ts  — 23 converter definitions
    specialized-tools.ts — 4 specialized definitions
```

## ToolMetadata Interface (actual)

```typescript
interface ToolMetadata {
  id: string; // slug e.g. 'text-uppercase'
  name: string; // display name
  description: string;
  category: ToolCategory; // 'Text' | 'Data' | 'Media' | 'Generator' | 'Calculator' | 'Converter' | 'Validator' | 'Specialized'
  subcategory?: string;
  tier: 'free' | 'pro' | 'advance';
  costType: 'free' | 'coin' | 'subscription';
  coinCost: number;
  execution: 'client' | 'server' | 'hybrid';
  inputType: 'text' | 'file' | 'url' | 'json' | 'multiple';
  outputType: 'text' | 'file' | 'json' | 'preview';
  options: ToolOption[];
  examples: ToolExample[];
  tags: string[];
  relatedTools?: string[];
}
```

## Registry Access

```typescript
import { toolRegistry, textToolsRegistry } from '@hsafx/tool-definitions';

// toolRegistry = [...textToolsRegistry, ...dataToolsRegistry, ...mediaTools, ...]
// 454 total tool definitions
```

## Note on Generation Script

Doc originally proposed auto-generating registry from markdown docs. Actual implementation uses hand-crafted TypeScript definitions in registry files — these ARE the source of truth, not generated from docs.
