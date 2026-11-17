---
applyTo: 'packages/tools/src/engines/**'
description: 'Engine authoring rules for the 30 HSAFX engines across Rust, Node.js, and FastAPI backends.'
---

# Engine Authoring Rules

## Core Contract

Every engine exports a single `execute(input, options)` entry point. No presets. No tool IDs. No client-side execution. All 30 engines run server-side.

## Execution Backends

| Backend | Engines (count) | Engine names |
|---------|-----------------|--------------|
| Rust HTTP service | 9 | case, wrap, filter, transform, encode, hash, counter, unicode, generate-data |
| Node.js (direct import) | 11 | comment, markup, convert, format, schema, diff, api, generate-web, validate, calculate, unit |
| FastAPI HTTP service | 10 | image, video, audio, pdf, document, archive, file, font, tracking, cheque |

## Graph-Verified Architecture Facts

These facts come from AST extraction across 352 source files (2116 nodes, 3128 edges):

### Generator split (Community 7)
`runDataGenerator()` in `engines/generate-data.ts` calls functions from **both** `generators/index.ts` AND `generators/web.ts`. UUID functions (`generateUUID`, `generateUuidV1`, `generateUuidV5`, `generateUuidV7`) live in `generators/web.ts`, not just in `generators/index.ts`. Do not assume all generator functions are in `index.ts`.

### Hash engine coupling (Community 13)
`rgbToHex()` in `data-converters/utilities.ts` has an inferred call to `toHex()` in `engines/hash.ts`. These two modules are unexpectedly coupled. When modifying `hash.ts` exports, verify `data-converters/utilities.ts` is not broken.

### Rust engines (Communities 53, 58, 61, 99)
Each Rust engine lives in its own `src/engines/<name>.rs` file in the engine-service crate. Pattern:
- `execute()` — main entry point called by the HTTP handler
- `resolve_style()` / `resolve_pattern()` / `generic_case()` — internal dispatch helpers
- `get_opt_str()`, `get_opt_bool()`, `get_opt_i64()`, `get_opt_u64()` — option extraction helpers

### Web generator bridges (Community 3 → Community 30)
`runWebGenerator()` is a high-betweenness bridge node (betweenness: 0.076) connecting the generate-web engine to the QR code generation community. `generateQrSvg()` and `createMatrix()` are in Community 30 and are reached via `runWebGenerator()`. Changes to `generate-web.ts` that touch QR generation can break the isolated `generateQrSvg` cluster.

### Schema engine (Community 26)
`inferSchema()` / `inferJsonSchema()` / `generateZodSchema()` / `generateTypeScriptInterface()` / `generateJoiSchema()` / `jsonSchemaToJoi()` are all in the same tight community — do not split them across files.

### Calculate engine (Community 54)
Expression evaluation uses a shunting-yard algorithm: `tokenize()` → `shuntingYard()` → `evaluateRPN()` → `evaluateExpression()`. All in Community 54 (cohesion 0.60). Do not add shortcut paths that bypass `shuntingYard()`.

### Unit conversion (Communities 16 and 29)
Two separate unit communities exist:
- Community 16 (cohesion 0.16): `convertUnit()`, `convertAngle()`, `convertArea()`, `convertCurrency()`, `convertDensity()`, `convertDigital()`, `convertElectric()`, `convertEnergy()` — the main unit engine
- Community 29 (cohesion 0.25): `celsiusToFahrenheit()`, `convertUnit()`, `feetToMeters()`, `gallonsToLiters()`, etc. — legacy/raw converters

## What Not to Do

- Do not add `presets` or `toolId` fields to engine options — the tool-definitions package is deleted
- Do not import from `@hsafx/tool-definitions` — package does not exist
- Do not add a client-side execution path — there is no WASM or browser execution
- Do not create category grouping routes — `/text`, `/data`, `/generate` routes are deleted
- Do not reference `executor.ts` — it is deleted
