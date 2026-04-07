# 12 — File Structure

> Compacted. Original ~230 lines. This doc is LARGELY OUTDATED — written pre-scaffolding. Verified against actual codebase.

---

## Core Principle

**One backend → Multiple frontends.** Backend = authority, Admin = control plane, Web = execution plane.

## Actual Root Structure (Verified ✅)

```
.github/            → CI/CD, copilot-instructions
docs/               → Planning & specs
apps/web/           → User-facing Next.js SaaS
apps/admin/         → Internal Admin Panel (Next.js)
backend/fastapi/    → FastAPI compute runtime (media/binary tools)
backend/rust/       → Rust → WASM crates (text-tools)
packages/api/       → tRPC routers + middleware + services
packages/db/        → Drizzle ORM schema + migrations
packages/schemas/   → Zod schemas
packages/shared/    → Constants, types, utilities, CASL permissions
packages/theme/     → Theme types, derivation helpers, presets
packages/tool-definitions/ → Tool metadata registry (454 tool IDs)
packages/tools/     → 19 engine implementations (@hsafx/tool-execution)
packages/ui/        → Shared shadcn components
infra/              → Docker, K8s configs, scripts
scripts/            → Dev/setup scripts
```

## Doc Discrepancies (What Doc Said vs Reality)

| Doc Claim                                                 | Reality                                                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `backend/api/` (Next.js API routes at root)               | API logic is in `packages/api/src/routers/`, routes in `apps/web/src/app/api/`                                                |
| `backend/shared/`                                         | Shared code is `packages/shared/`                                                                                             |
| `packages/permissions/` separate package                  | Permissions live in `packages/shared/src/permissions/`                                                                        |
| `packages/config/`                                        | No such package                                                                                                               |
| `packages/tool-definitions/group-1/` through `group-5/`   | Flat registry: `packages/tool-definitions/src/registry/{text,data,generator,calculator,converter,specialized,media}-tools.ts` |
| `apps/web/src/app/(tools)/` routes exist                  | ❌ No tool pages route group built (G9 gap)                                                                                   |
| FastAPI has `services/text_transform/`, `calculator/` etc | Actual: `backend/fastapi/src/{api/v1, core, middleware, schemas, scrapers, services, tools}`                                  |

## Architecture Rules (Still Valid)

- **Next.js** owns ALL database writes (auth, users, subscriptions, billing, usage)
- **FastAPI** is stateless compute-only (no DATABASE_URL, no DB access)
- Both `apps/web` and `apps/admin` talk to same `packages/api` tRPC routers
- Tools are data-driven via registry, not hardcoded
- Admin manages tool metadata, Web renders tool UIs

## Source of Truth

- Architecture: `10_SYSTEM_ARCHITECTURE.md`
- DB schema: `packages/db/src/schema/` (Drizzle, NOT the .dbml file)
- Engine architecture: `50_TOOL_ENGINE_ARCHITECTURE.md`
- Tool registry: `packages/tool-definitions/src/registry/`
