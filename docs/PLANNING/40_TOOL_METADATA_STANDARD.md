# 40 — Tool Metadata Standard (Compacted)

> ⚠️ **STALE (April 2026)**: References `packages/tool-definitions` which is DELETED.
> This spec is for future B2C web UI tool pages — not yet implemented.
> Engine metadata is now at `apps/web/src/lib/engines-option-schemas.ts` and `engine-constants.ts`.

> **Status:** ❌ NOT IMPLEMENTED — Future SEO/content spec for tool pages.

## Purpose

Define SEO-safe metadata contract for every tool page. Each tool page should have:

| Field          | Requirement                     | SEO Rule                          |
| -------------- | ------------------------------- | --------------------------------- |
| `slug`         | Kebab-case, unique              | URL path segment                  |
| `h1`           | 40-70 chars                     | "[Tool Name] - [Primary Benefit]" |
| `description`  | 150-160 chars                   | Meta description                  |
| `useCases`     | 3-5 items                       | Long-tail keyword targeting       |
| `examples`     | 2-4 with input/output           | Rich snippet content              |
| `commonErrors` | 3-5 with symptom/cause/solution | Troubleshooting queries           |
| `relatedTools` | 3-5 with relationship type      | Internal linking                  |

## Relationship Types

`alternative` | `next-step` | `complementary` | `prerequisite`

## Structured Data

Each tool page should include JSON-LD: `@type: SoftwareApplication` with name, description, applicationCategory, offers.

## Key Rules

- AI can draft content, humans must verify technical accuracy
- No placeholder/hallucinated examples in production
- All examples must produce correct output when tested
- Related tool slugs must link to existing tools
