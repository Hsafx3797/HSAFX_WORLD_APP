# 62 — Form Validation Spec

> **Status**: PARTIALLY BUILT — Generic schemas exist in `packages/schemas/src/tool.ts` and `packages/schemas/src/api.ts`. Per-tool schemas NOT yet built.

---

## What Exists

- `packages/schemas/src/tool.ts` — Generic `ToolExecutionRequestSchema`, `ToolInputSchema`, `ToolOutputSchema` (Zod)
- `packages/schemas/src/api.ts` — API request/response schemas
- React Hook Form + `@hookform/resolvers` + Zod resolver pattern documented

## Planned Per-Tool Schemas (not built)

### Text Tools
- Case converter: `input` (required string), `preserveAcronyms`, `delimiter`
- Base64: `input`, `urlSafe`, `encoding`
- Hash: `input`, `algorithm` (enum), `uppercase`, `includePrefix`

### Generators
- Password: `length` (4-128), `includeUppercase/Lowercase/Numbers/Symbols`, `quantity`
- UUID: `version` (v1/v4/v5), `quantity`, `uppercase`, `namespace` (v5 only)
- Lorem: `count`, `unit` (words/sentences/paragraphs)
- QR Code: `content` (max 2953), `size`, `errorCorrection` (L/M/Q/H), `format`

### Calculators
- Age: `birthDate`, `targetDate`, `timezone`
- BMI: `weight`, `weightUnit`, `height`, `heightUnit`
- GPA: `courses[]` with grade/credits, `gradingSystem`
- Zakat: `cash`, `gold`, `silver`, `investments`, `debts`, `nisabStandard`
- Inheritance: `estate`, `heirs[]` with relation/count, `debts`, `willBequests` (max 33.33%)

### File Converters (server-side validation)
- Image: `fileKey`, `targetFormat`, `quality` (1-100), `resize`, `rotate`, `flip`
- PDF: `fileKey`, `targetFormat`, `pageRange`, `imageDPI`
- Document: `fileKey`, `fromFormat`, `toFormat`

## Integration Pattern

```typescript
// React Hook Form + Zod
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(toolSchema),
  defaultValues: { ... }
});
```

## Error Display
- Field-level: red text under input
- Form-level: `Alert` component with destructive variant + ZodError path mapping
