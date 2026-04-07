# 72 — State Management Spec

> **Status**: ✅ BUILT — Zustand stores in `apps/web/src/stores/`

---

## Implemented Stores

| Store                  | File                           | Purpose                                                        |
| ---------------------- | ------------------------------ | -------------------------------------------------------------- |
| `useToolStore`         | `stores/tool-store.ts`         | Current tool, favorites, recents (persisted to localStorage)   |
| `useExecutionStore`    | `stores/execution-store.ts`    | Execution lifecycle, undo/redo, history (ring buffer, last 50) |
| `useUIStore`           | `stores/ui-store.ts`           | Sidebar, modals, loading states                                |
| `useUserStore`         | `stores/user-store.ts`         | Auth user, coins, permissions                                  |
| `useNotificationStore` | `stores/notification-store.ts` | Toast notifications                                            |

## Key Design Decisions

- **Separate tool-store from execution-store**: Favorites/recents persist, execution state is ephemeral
- **Undo/redo**: Only for text/code tools (IDs 1-297). Generators, calculators, file tools skip it
- **Output NOT persisted**: Only input + options saved to localStorage
- **Zustand + immer** middleware for immutable updates
- **Zustand + persist** middleware for localStorage sync

## State Categories

1. **Tool State** — Input/output/options per tool → `execution-store.ts`
2. **User State** — Auth, coins, permissions → `user-store.ts`
3. **Theme State** — Dark/light/system → handled by `next-themes` (not custom Zustand)
4. **UI State** — Sidebar, modals → `ui-store.ts`
