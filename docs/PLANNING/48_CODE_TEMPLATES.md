# 48 — Code Templates & Conventions

> Reference for coding patterns used across the monorepo. All conventions verified in codebase.

---

## File Naming

| Element          | Convention      | Example                     |
| ---------------- | --------------- | --------------------------- |
| Files            | kebab-case      | `onboarding-wizard.tsx`     |
| Components       | PascalCase      | `OnboardingWizard`          |
| Functions/hooks  | camelCase       | `useAuth`, `formatCurrency` |
| Constants        | SCREAMING_SNAKE | `MAX_FILE_SIZE`             |
| Types/Interfaces | PascalCase      | `ToolMetadata`              |

## Import Order (enforced across all TS files)

1. React / React DOM
2. Next.js (`next/navigation`, `next/image`)
3. External packages (`zod`, `drizzle-orm`, `sonner`)
4. Internal aliases (`@/components`, `@/lib`, `@hsafx/*`)
5. Types (`import type { ... }`)
6. Styles (if any)

## Component Pattern

- Functional components only, no class components
- `'use client'` directive at top for client components
- Props via TypeScript interface (not inline)
- Hooks: `useState`, `useCallback`, `useMemo` from React; `useRouter` from Next

## API Route Pattern (Next.js App Router)

```
app/api/[resource]/route.ts → export async function GET/POST/PUT/DELETE(req)
```

- Use `apiErrorResponse()` from `@/lib/api-v1-auth.ts` for error responses
- Validate with Zod schemas
- Return `NextResponse.json()`

## FastAPI Route Pattern

```python
router = APIRouter(prefix="/tools", tags=["tools"])
@router.post("/endpoint")
async def handler(file: UploadFile, request: PydanticModel):
    # validate → process → return
```

## Tool Implementation

- **Client-side**: All tools → engine presets in `packages/tools/src/engines/`
- **WASM (Rust)**: `#[wasm_bindgen]` functions in `backend/rust/text-tools/src/`
- **Server-side**: FastAPI endpoints for media tools in `backend/fastapi/`

## Database Queries

- Drizzle ORM with `select()`, `from()`, `where()`, `leftJoin()` chain pattern
- Schema in `packages/db/src/schema/` (~50 tables across 8 files)

## Test Pattern

- Vitest with `describe`/`it`/`expect`
- Real inputs and real outputs (no mocks unless external service)
- 68 test files, 4,758 tests, 0 failures ✅
