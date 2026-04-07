# 32 — Theme System (Compacted)

> Full implementation: `packages/theme/src/` (types.ts, derive.ts, presets.ts, index.ts)
> **Status:** ✅ Core system BUILT — types, derivation engine, presets, exports all implemented.

## Core Concept

Theme = constrained decision system. Users express **intent** (3-5 values), system **derives** ~47 CSS variables.

- Users NEVER edit raw tokens/CSS vars
- Derivation engine guarantees WCAG AA contrast (≥4.5:1)
- Mode switch (light/dark) is atomic — flips entire palette
- Components are theme-agnostic (use semantic Tailwind classes: `bg-primary`, `text-foreground`, etc.)

## Architecture

```
User Intent (ThemeIntent) → Derivation Engine (OKLCH) → CSS Variables → Tailwind v4 @theme inline → Components
```

- **Color space:** OKLCH (perceptually uniform) via `culori` library
- **Contrast:** `wcag-contrast` library for WCAG 2.1 compliance
- **Persistence:** `user_preferences.preferences` JSONB column (stores intent only, never resolved vars)
- **Runtime:** React Context + CSS custom properties, SSR pre-derived in layout.tsx

## ThemeIntent Schema (✅ Built in `packages/theme/src/types.ts`)

| Field                 | Type                             | User Control |
| --------------------- | -------------------------------- | ------------ |
| `brand.primary`       | HEX string                       | Color picker |
| `brand.accent`        | HEX string (optional)            | Color picker |
| `surface.contrast`    | soft/medium/high                 | 3-way toggle |
| `surface.neutralBias` | warm/cool/true                   | 3-way toggle |
| `mode`                | light/dark/system                | 3-way toggle |
| `typography.font`     | system/geist/inter/space-grotesk | Dropdown     |
| `typography.scale`    | 0.9-1.1                          | Slider       |
| `shape.roundness`     | 0-1 (sharp→pill)                 | Slider       |
| `elevation.intensity` | 0-1                              | Slider       |
| `spacing.density`     | 0.8-1.2                          | Slider       |

## Derivation Rules (✅ Built in `packages/theme/src/derive.ts`)

- **Background:** Light=white, Dark=near-black with subtle hue tint
- **Foreground:** Iteratively adjusted luminance until contrast ≥ 4.5:1
- **Muted:** Primary hue with reduced chroma + adjusted luminance
- **Surfaces:** background → card (+7% L in dark) → popover (+9% L in dark) → sidebar
- **Border:** Muted with higher luminance
- **Ring:** Primary at reduced chroma
- **Charts:** 5-color auto-generated accessible palette
- **Radius:** Single `roundness` value → `--radius` + sm/md/lg/xl computed
- **Shadows:** Intensity × softness → mode-aware shadow layers

## CSS Variable Contract

~47 variables in `:root` / `.dark`: background, foreground, card, popover, primary, secondary, muted, accent, destructive (+ foreground variants), border, input, ring, sidebar-\* (8 vars), chart-1 through chart-5, radius, spacing, font-sans/mono/serif, shadow layers.

Consumed via Tailwind v4 `@theme inline` block mapping `--color-*` to CSS vars.

## Preset Library (✅ Built in `packages/theme/src/presets.ts`)

| Category      | Examples                                               |
| ------------- | ------------------------------------------------------ |
| Default       | `default` (neutral grayscale)                          |
| Solid Colors  | `red`, `green`, `blue`, `pink`, `orange`, `purple`     |
| Flag-Inspired | `rwbg`, `gyrw`, `rwb`, `gyr`, `gwr`, `rby`, etc.       |
| Stylized      | `cyberpunk`, `claude`, `retro-arcade`, `neo-brutalism` |

Preset = ThemeIntent override object. Applied via `applyPreset(presetId)` → deep-merges with DEFAULT_INTENT.

## Plan-Based Access

| Plan    | Access                                                            |
| ------- | ----------------------------------------------------------------- |
| Free    | Default + solid color presets, light/dark mode                    |
| Pro     | All presets + custom primary color + typography                   |
| Advance | Full customization (accent, surface contrast, elevation, density) |

## Key Rules

1. **Never hard-code colors** — always use semantic tokens (`bg-primary`, not `bg-blue-500`)
2. **Never store resolved CSS vars** — only store ThemeIntent, re-derive on load
3. **Never bypass theme system** — no inline `style={{ color: '#000' }}`
4. Full CSS preset reference in [33_THEME_PRESETS.md](33_THEME_PRESETS.md)
