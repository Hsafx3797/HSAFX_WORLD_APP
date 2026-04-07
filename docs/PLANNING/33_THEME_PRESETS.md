# 33 — Theme Presets (Compacted)

> **Status:** ✅ ALL PRESETS BUILT in `packages/theme/src/presets.ts`
> Original doc: 2276 lines of raw CSS per preset. All moved to code.

## Preset Format Standard

Each preset is a **full variable snapshot** (not an override). Includes:

- `:root` block (light mode) with ALL ~47 tokens
- `.dark` block (dark mode) with ALL tokens
- `@theme inline` block for Tailwind v4
- Font, radius, shadow, spacing definitions

**Overrides are NOT supported** — each preset is self-contained.

## Implemented Presets (`packages/theme/src/presets.ts`)

| Category          | Preset IDs                                                                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default**       | `default`                                                                                                                                                                                                                   |
| **Solid Colors**  | `red`, `rose`, `orange`, `green`, `blue`, `yellow`, `violet`                                                                                                                                                                |
| **Flag-Inspired** | `flag-japan`, `flag-usa`, `flag-uk`, `flag-france`, `flag-germany`, `flag-brazil`, `flag-italy`, `flag-spain`, `flag-india`, `flag-saudi`, `flag-uae`, `flag-australia`, `flag-canada`, `flag-south-korea`, `flag-pakistan` |
| **Stylized**      | `cyberpunk`, `claude`, `retro-arcade`, `neo-brutalism`                                                                                                                                                                      |

## Adding New Presets

Use conversion template: [41_PRESET_CONVERSION_TEMPLATE.md](41_PRESET_CONVERSION_TEMPLATE.md)

Each preset object in code contains: `id`, `name`, `description`, `category`, `tier` (plan access), and `intent` (partial ThemeIntent override merged with DEFAULT_INTENT via `applyPreset()`).
