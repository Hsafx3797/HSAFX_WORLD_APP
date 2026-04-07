# 50 — Definition of Done

> Quality gates and acceptance criteria for production readiness.

---

## Code Quality

- Zero ESLint errors, zero TypeScript errors, Prettier formatted
- Python: Black + Ruff. Rust: Clippy
- No dead code, no unused imports, no console.log (use logger)
- Code review required for PRs, schema changes, API changes, security changes

## Test Coverage Thresholds

- **Critical paths**: 80% — auth, billing, plan limits, API keys, subscriptions
- **Tools**: 60% — all tool categories
- **Utilities**: 70% — error handling, retry logic, Redis, DB queries
- Each tool: ≥3 test cases (happy path, error, edge case)
- Current: 68 test files, 4,758 tests, 0 failures ✅

## Performance Thresholds

| Metric                 | Target |
| ---------------------- | ------ |
| WASM tool p95          | <50ms  |
| API tool p95           | <150ms |
| DB query p95           | <50ms  |
| Auth p95               | <200ms |
| Lighthouse Performance | >90    |
| FCP                    | <1.5s  |
| LCP                    | <2.5s  |
| CLS                    | <0.1   |
| Initial JS (gzipped)   | <200KB |
| WASM (gzipped)         | <1MB   |

## Browser Support

Last 2 versions: Chrome, Firefox, Safari, Edge. Mobile responsive 375px–1920px.

## Accessibility

WCAG 2.1 AA: keyboard nav, ARIA labels, contrast ≥4.5:1, Lighthouse Accessibility >90.

## Security

OWASP Top 10 addressed: parameterized queries (Drizzle), better-auth sessions, input validation (Zod), CSP headers, rate limiting, CORS config, zero critical vulns in npm audit.

## Phase Sign-Off Criteria

| Phase            | Key Gate                                               | Status                          |
| ---------------- | ------------------------------------------------------ | ------------------------------- |
| 1: Tools + API   | All 454 tools implemented, API endpoints, 3 tests/tool | ✅ Done                         |
| 2: DB + Auth     | Auth flows, API keys, rate limiting, 80% coverage      | ✅ Done                         |
| 3: Admin Panel   | 55+ admin features, 2FA, audit logging                 | ✅ Done                         |
| 4: User Frontend | Tool UIs, auth/billing integration, Lighthouse >90     | 🟡 Partial (tool UI pages TODO) |
| 5: Finalization  | Load testing, security audit, monitoring, backups      | ⬜ Not started                  |
