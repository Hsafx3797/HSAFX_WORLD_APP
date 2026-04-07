# 41 — Preset Conversion Template

> CSS template for converting theme presets from HEX to OKLCH format.

## Status: ✅ ALL PRESETS CONVERTED

All 27+ presets fully built in `packages/theme/src/presets.ts` using `deriveTheme()` OKLCH pipeline.
No manual CSS conversion needed — the derive engine handles HEX→OKLCH automatically.

## Conversion Steps (Reference for New Presets)

1. Define `ThemeIntent` with primary HEX color
2. Call `deriveTheme(intent)` — auto-generates all OKLCH vars
3. Add to `presets` map in `packages/theme/src/presets.ts`
4. Test light & dark mode, validate WCAG contrast

## CSS Variable Contract

~47 CSS vars per preset (`:root` + `.dark` + `@theme inline`):

- Core: `--background`, `--foreground`, `--primary`, `--primary-foreground`
- Surfaces: `--card`, `--popover`, `--secondary`, `--muted`, `--accent` (+ foregrounds)
- UI: `--destructive`, `--border`, `--input`, `--ring`
- Charts: `--chart-1` through `--chart-5`
- Sidebar: `--sidebar`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` (+ foregrounds)
- Shadows: `--shadow-2xs` through `--shadow-2xl`
- Tailwind v4: `@theme inline` maps `--color-*` → CSS vars, `--radius-*` variants
