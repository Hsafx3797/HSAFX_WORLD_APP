# Theme System — HSAFX WORLD

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ FINAL — Production Reference

> **⚠️ Cross-Reference Note**  
> This document integrates with:  
> - [10_SYSTEM_ARCHITECTURE.md](10_SYSTEM_ARCHITECTURE.md) — Frontend stack (Next.js 15, Tailwind v4)  
> - [13_DATABASE_SCHEMA.md](13_DATABASE_SCHEMA.md) — User preferences storage  
> - [00_PRODUCT_REQUIREMENTS.md](00_PRODUCT_REQUIREMENTS.md) — Plan-based feature access

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [Architecture Integration](#2-architecture-integration)
3. [Design Token System](#3-design-token-system)
4. [Theme Pipeline](#4-theme-pipeline)
5. [User Intent Layer](#5-user-intent-layer)
6. [Derivation Engine](#6-derivation-engine)
7. [CSS Variable Contract](#7-css-variable-contract)
8. [Tailwind v4 Integration](#8-tailwind-v4-integration)
9. [Database Persistence](#9-database-persistence)
10. [Runtime Application](#10-runtime-application)
11. [Preset Library](#11-preset-library)
12. [Plan-Based Access](#12-plan-based-access)
13. [Implementation Guidelines](#13-implementation-guidelines)

---

## 1. Core Philosophy

### 1.1 The Mental Model

> **A theme is NOT a set of colors.**  
> **A theme is a constrained decision system that compiles user intent into CSS variables.**

If users touch raw tokens, your system breaks.  
If users express intent, your system scales.

### 1.2 Non-Negotiable Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Intent-driven, not token-driven** | Users express preferences; system derives tokens |
| 2 | **Single source of truth** | User intent stored once; resolved tokens are computed |
| 3 | **Mode-aware derivation** | Light/dark modes flip luminance, preserve hue automatically |
| 4 | **Accessibility guaranteed** | Contrast ratios enforced by derivation engine, not users |
| 5 | **Runtime application** | Theme changes are instant; no rebuild required |
| 6 | **Component agnostic** | Components consume tokens; never hard-code colors |

### 1.3 What This System Solves

```
❌ WRONG APPROACH:
   User picks 47 colors → System applies them → Broken contrast, broken dark mode

✅ CORRECT APPROACH:
   User picks 3-5 intent values → System derives 47 tokens → Guaranteed correctness
```

---

## 2. Architecture Integration

### 2.1 Stack Alignment

| Layer | Technology | Theme Role |
|-------|------------|------------|
| **Frontend** | Next.js 15, React 19 | Theme provider context |
| **Styling** | Tailwind CSS v4 | Consumes `@theme inline` contract |
| **Components** | shadcn/ui | Theme-agnostic, uses semantic tokens |
| **State** | React Context + Zustand | Client-side theme state |
| **Persistence** | PostgreSQL (Neon) | `user_preferences.preferences` JSONB |
| **Caching** | Redis (Upstash) | Optional theme cache for fast hydration |

### 2.2 Theme Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THEME DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────┐
  │  User Intent  │  ← User edits in Appearance Panel
  │  (JSON)       │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │  Database     │  ← Persisted in user_preferences.preferences
  │  (JSONB)      │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │  Derivation   │  ← Server-side or client-side computation
  │  Engine       │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │  CSS Vars     │  ← Injected into :root / .dark
  │  (Runtime)    │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │  Tailwind v4  │  ← @theme inline reads CSS vars
  │  + shadcn     │
  └───────────────┘
```

---

## 3. Design Token System

### 3.1 Token Categories

| Category | Tokens | User Control |
|----------|--------|--------------|
| **Colors** | primary, secondary, accent, destructive, background, foreground, muted, border, ring, card, popover, sidebar | Partial (via intent) |
| **Typography** | font-sans, font-mono, font-serif | Limited selection |
| **Shape** | radius (sm, md, lg, xl) | Single slider |
| **Elevation** | shadow-2xs through shadow-2xl | Intensity slider |
| **Spacing** | Base unit (0.25rem) | Density slider |
| **Charts** | chart-1 through chart-5 | Auto-derived |

### 3.2 Token Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOKEN HIERARCHY                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  PRIMITIVE TOKENS (System-only, never exposed)
  ├── oklch(0.637 0.237 25.331)   ← Raw color value
  ├── 0.625rem                    ← Raw size value
  └── Geist, ui-sans-serif        ← Raw font stack

         │
         ▼

  SEMANTIC TOKENS (CSS Variables)
  ├── --primary                   ← Meaning-based name
  ├── --radius                    ← Shape abstraction
  └── --font-sans                 ← Typography abstraction

         │
         ▼

  UTILITY TOKENS (Tailwind Classes)
  ├── bg-primary                  ← Component usage
  ├── rounded-md                  ← Shape usage
  └── font-sans                   ← Typography usage
```

---

## 4. Theme Pipeline

### 4.1 Immutable Pipeline

```
User Intent (Editable)
        │
        ▼
Canonical Design Tokens (System Language)
        │
        ▼
Derivation Engine (Rules + Math)
        │
        ▼
Resolved Tokens (OKLCH / rem / px)
        │
        ▼
CSS Variable Contract (Public API)
        │
        ▼
Components (Tailwind / shadcn)
```

**Only the first layer is user-editable.**

### 4.2 Pipeline Invariants

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | Users never see OKLCH values | UI shows HEX or color picker |
| 2 | Users never edit CSS variables | Derivation engine owns output |
| 3 | Resolved tokens are ephemeral | Computed on load, not stored |
| 4 | Mode switch is atomic | Single flag flips entire palette |
| 5 | Preset application is atomic | Replaces all intent values at once |

---

## 5. User Intent Layer

### 5.1 Intent Schema (TypeScript)

```typescript
interface ThemeIntent {
  // Schema version for forward compatibility
  version: 1;
  
  // Color intent
  brand: {
    primary: string;      // HEX color (e.g., "#3b82f6")
    accent?: string;      // Optional accent override
    danger?: string;      // Optional destructive override
  };
  
  // Surface intent
  surface: {
    contrast: "soft" | "medium" | "high";
    neutralBias: "warm" | "cool" | "true";
  };
  
  // Mode control
  mode: "light" | "dark" | "system";
  
  // Typography intent
  typography: {
    font: "system" | "geist" | "inter" | "space-grotesk";
    scale: number;          // 0.9 → 1.1 (multiplier)
    letterSpacing: number;  // -0.01 → 0.05 (em)
  };
  
  // Shape intent
  shape: {
    roundness: number;      // 0 → 1 (0 = sharp, 1 = pill)
  };
  
  // Elevation intent
  elevation: {
    intensity: number;      // 0 → 1 (shadow strength)
    softness: number;       // 0 → 1 (blur amount)
  };
  
  // Density intent
  spacing: {
    density: number;        // 0.8 → 1.2 (compact → spacious)
  };
  
  // Optional preset reference
  preset?: string;          // e.g., "default", "cyberpunk", "neo-brutalism"
}
```

### 5.2 What Users CAN Edit

| Control | Intent Field | UI Widget |
|---------|--------------|-----------|
| Primary Color | `brand.primary` | Color picker |
| Accent Color | `brand.accent` | Color picker |
| Surface Contrast | `surface.contrast` | 3-way toggle |
| Neutral Tone | `surface.neutralBias` | 3-way toggle |
| Color Mode | `mode` | 3-way toggle |
| Font Family | `typography.font` | Dropdown |
| Font Scale | `typography.scale` | Slider |
| Corner Roundness | `shape.roundness` | Slider |
| Shadow Intensity | `elevation.intensity` | Slider |
| UI Density | `spacing.density` | Slider |
| Apply Preset | `preset` | Preset gallery |

### 5.3 What Users CANNOT Edit

| Token | Why Restricted |
|-------|----------------|
| `background` | Derived from mode + surface intent |
| `foreground` | Computed for contrast ratio ≥ 4.5:1 |
| `muted`, `muted-foreground` | Derived from primary with reduced chroma |
| `border`, `input`, `ring` | Derived from surface + primary |
| `card`, `popover` | Derived from background with offset |
| `sidebar-*` | Mirrors main palette with sidebar offset |
| `chart-1` through `chart-5` | Auto-generated accessible palette |
| Individual `radius-*` values | Computed from single `roundness` |
| Shadow layers, spread, direction | Physics-based, mode-aware |

---

## 6. Derivation Engine

### 6.1 Implementation Libraries

**Required Dependencies:**
```json
{
  "culori": "^4.0.1",
  "wcag-contrast": "^3.0.0"
}
```

**Why These Libraries:**
- **culori**: Industry-standard OKLCH color space conversions, perceptually uniform transformations
- **wcag-contrast**: WCAG 2.1 compliant contrast ratio calculations

### 6.2 Color Derivation (OKLCH) - Real Implementation

```typescript
import { oklch, formatHex, formatCss, converter } from 'culori';
import { getContrast } from 'wcag-contrast';

// Convert any color to OKLCH
const toOklch = converter('oklch');

/**
 * Derives all theme colors from user intent
 * Guarantees WCAG AA contrast ratios (4.5:1 minimum)
 */
function deriveColors(intent: ThemeIntent, mode: "light" | "dark"): ResolvedColors {
  // Parse user's primary color (HEX/RGB/etc.) to OKLCH
  const primaryOklch = toOklch(intent.brand.primary);
  
  if (!primaryOklch) {
    throw new Error('Invalid primary color format');
  }

  // Mode-aware background derivation
  const background = mode === "light" 
    ? oklch({ l: 1, c: 0, h: 0 })  // Pure white
    : oklch({ l: 0.141, c: 0.005, h: 285 });  // Near black with slight purple tint

  // Contrast-safe foreground with automatic adjustment
  let foreground = mode === "light"
    ? oklch({ l: 0.2, c: 0.01, h: primaryOklch.h || 0 })
    : oklch({ l: 0.95, c: 0.01, h: primaryOklch.h || 0 });

  // Iteratively adjust luminance until WCAG AA is met
  let iterations = 0;
  const maxIterations = 20;
  
  while (getContrast(formatHex(background), formatHex(foreground)) < 4.5) {
    if (iterations++ > maxIterations) {
      throw new Error('Could not achieve sufficient contrast');
    }
    
    foreground = mode === "light"
      ? { ...foreground, l: Math.max(0, foreground.l - 0.05) }
      : { ...foreground, l: Math.min(1, foreground.l + 0.05) };
  }

  // Derive muted (reduced chroma + adjusted luminance)
  const muted = mode === "light"
    ? oklch({ l: 0.96, c: Math.min(0.02, primaryOklch.c * 0.1), h: primaryOklch.h })
    : oklch({ l: 0.27, c: Math.min(0.02, primaryOklch.c * 0.1), h: primaryOklch.h });

  const mutedForeground = mode === "light"
    ? oklch({ l: 0.55, c: 0.016, h: primaryOklch.h })
    : oklch({ l: 0.70, c: 0.015, h: primaryOklch.h });

  // Derive accent (lighter variation of primary)
  const accent = mode === "light"
    ? oklch({ l: Math.min(1, primaryOklch.l + 0.35), c: primaryOklch.c * 0.2, h: primaryOklch.h })
    : oklch({ l: Math.max(0, primaryOklch.l - 0.15), c: primaryOklch.c * 0.5, h: primaryOklch.h });

  // Surface colors with consistent offsets
  const card = mode === "light"
    ? background  // Same as background in light mode
    : oklch({ l: background.l + 0.07, c: background.c, h: background.h });

  const popover = mode === "light"
    ? background
    : oklch({ l: background.l + 0.09, c: background.c, h: background.h });

  // Border derived from muted with higher luminance
  const border = mode === "light"
    ? oklch({ l: 0.92, c: 0.004, h: primaryOklch.h })
    : oklch({ l: 0.33, c: 0.01, h: primaryOklch.h });

  // Ring (focus indicator) is primary at 60% opacity equivalent
  const ring = oklch({ l: primaryOklch.l, c: primaryOklch.c * 0.8, h: primaryOklch.h });

  // Clamp all values to valid OKLCH ranges
  const clamp = (color: any) => oklch({
    l: Math.max(0, Math.min(1, color.l)),
    c: Math.max(0, Math.min(0.4, color.c)),  // Max chroma for display compatibility
    h: color.h
  });

  return {
    background: formatCss(clamp(background)),
    foreground: formatCss(clamp(foreground)),
    primary: formatCss(clamp(primaryOklch)),
    primaryForeground: mode === "light" ? "oklch(1 0 0)" : "oklch(0.1 0 0)",
    secondary: formatCss(clamp(muted)),
    secondaryForeground: formatCss(clamp(foreground)),
    muted: formatCss(clamp(muted)),
    mutedForeground: formatCss(clamp(mutedForeground)),
    accent: formatCss(clamp(accent)),
    accentForeground: formatCss(clamp(foreground)),
    card: formatCss(clamp(card)),
    cardForeground: formatCss(clamp(foreground)),
    popover: formatCss(clamp(popover)),
    popoverForeground: formatCss(clamp(foreground)),
    border: formatCss(clamp(border)),
    input: formatCss(clamp(border)),
    ring: formatCss(clamp(ring)),
  };
}

// Edge case handling
function validateAndNormalize(color: string): string {
  const parsed = toOklch(color);
  
  if (!parsed) {
    // Fallback to neutral gray if color is invalid
    return 'oklch(0.5 0 0)';
  }
  
  // If chroma is too high for the given lightness, reduce it
  if (parsed.c > 0.4) {
    return formatCss(oklch({ ...parsed, c: 0.4 }));
  }
  
  return color;
}
```

### 6.3 Surface Derivation

The derivation engine uses **OKLCH** color space for perceptually uniform transformations.

```typescript
// Derivation rules (pseudo-code)
function deriveColors(intent: ThemeIntent, mode: "light" | "dark") {
  const primary = parseHex(intent.brand.primary);
  const primaryOKLCH = hexToOKLCH(primary);
  
  // Mode-aware background
  const background = mode === "light"
    ? oklch(0.98, 0.005, primaryOKLCH.h)  // Near-white with hint of hue
    : oklch(0.14, 0.005, primaryOKLCH.h); // Near-black with hint of hue
  
  // Foreground: guaranteed contrast
  const foreground = mode === "light"
    ? oklch(0.14, primaryOKLCH.c * 0.1, primaryOKLCH.h)
    : oklch(0.98, primaryOKLCH.c * 0.1, primaryOKLCH.h);
  
  // Muted: reduced chroma
  const muted = mode === "light"
    ? oklch(0.96, 0.01, primaryOKLCH.h)
    : oklch(0.27, 0.01, primaryOKLCH.h);
  
  // Ring: higher chroma for focus states
  const ring = oklch(primaryOKLCH.l, primaryOKLCH.c * 1.2, primaryOKLCH.h);
  
  return { background, foreground, primary: primaryOKLCH, muted, ring, /* ... */ };
}
```

### 6.3 Surface Derivation

**Surface Hierarchy (Always Maintained):**
```typescript
// Light mode
background     → L = 1.00 (base)
card           → L = 1.00 (same as background)
popover        → L = 1.00 (same as background)
sidebar        → L = 0.985 (slightly darker)

// Dark mode
background     → L = 0.141 (base)
card           → L = 0.21 (elevated +7%)
popover        → L = 0.31 (more elevated +9%)
sidebar        → L = 0.21 (same as card)
```

**Implementation:**
```typescript
function deriveSurfaces(
  baseBackground: OklchColor,
  mode: "light" | "dark"
): SurfaceColors {
  if (mode === "light") {
    return {
      background: formatCss(baseBackground),
      card: formatCss(baseBackground),  // Same in light mode
      popover: formatCss(baseBackground),
      sidebar: formatCss(oklch({ 
        ...baseBackground, 
        l: baseBackground.l - 0.015  // Subtle offset
      }))
    };
  } else {
    return {
      background: formatCss(baseBackground),
      card: formatCss(oklch({ 
        ...baseBackground, 
        l: baseBackground.l + 0.07  // Elevated surface
      })),
      popover: formatCss(oklch({ 
        ...baseBackground, 
        l: baseBackground.l + 0.09  // More elevated
      })),
      sidebar: formatCss(oklch({ 
        ...baseBackground, 
        l: baseBackground.l + 0.07  // Same as card
      }))
    };
  }
}
```

### 6.4 Radius Derivation

```typescript
// Surface hierarchy (always maintained)
background     → L = base
card           → L = base ± 2-3%
popover        → L = card + 2% (more contrast)
sidebar        → L = base - 1% (subtle offset)
```

### 6.3 Radius Derivation

```typescript
function deriveRadius(roundness: number): Record<string, string> {
  // roundness: 0 = sharp (0px), 1 = pill (1rem+)
  const base = roundness * 0.625; // 0 → 0.625rem
  
  return {
    '--radius': `${base}rem`,
    '--radius-sm': `calc(var(--radius) - 4px)`,
    '--radius-md': `calc(var(--radius) - 2px)`,
    '--radius-lg': `var(--radius)`,
    '--radius-xl': `calc(var(--radius) + 4px)`,
  };
}
```

### 6.4 Shadow Derivation

```typescript
function deriveShadow(intensity: number, softness: number, mode: "light" | "dark") {
  const opacity = mode === "light" ? intensity * 0.15 : intensity * 0.25;
  const blur = softness * 8;
  
  return {
    '--shadow-sm': `0 1px ${blur}px rgba(0,0,0,${opacity})`,
    '--shadow-md': `0 4px ${blur * 2}px rgba(0,0,0,${opacity})`,
    // ... etc
  };
}
```

---

## 7. CSS Variable Contract

### 7.1 Core Variables (:root)

```css
:root {
  /* === SURFACES === */
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;

  /* === SEMANTIC COLORS === */
  --primary: #171717;
  --primary-foreground: #fafafa;
  --secondary: #f5f5f5;
  --secondary-foreground: #171717;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f5f5f5;
  --accent-foreground: #171717;
  --destructive: #e7000b;
  --destructive-foreground: #ffffff;

  /* === UI CHROME === */
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #a1a1a1;

  /* === SIDEBAR === */
  --sidebar: #fafafa;
  --sidebar-foreground: #0a0a0a;
  --sidebar-primary: #171717;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #171717;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #a1a1a1;

  /* === CHARTS === */
  --chart-1: #91c5ff;
  --chart-2: #3a81f6;
  --chart-3: #2563ef;
  --chart-4: #1a4eda;
  --chart-5: #1f3fad;

  /* === SHAPE === */
  --radius: 0.625rem;
  --spacing: 0.25rem;

  /* === TYPOGRAPHY === */
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --font-serif: ui-serif, Georgia, serif;

  /* === SHADOWS === */
  --shadow-color: oklch(0 0 0);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
}
```

### 7.2 Dark Mode Override (.dark)

```css
.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #0a0a0a;
  --card-foreground: #fafafa;
  --popover: #0a0a0a;
  --popover-foreground: #fafafa;
  --primary: #fafafa;
  --primary-foreground: #0a0a0a;
  --secondary: #262626;
  --secondary-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a1a1a1;
  --accent: #262626;
  --accent-foreground: #fafafa;
  --destructive: #e7000b;
  --destructive-foreground: #ffffff;
  --border: #262626;
  --input: #262626;
  --ring: #525252;
  --sidebar: #0a0a0a;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #fafafa;
  --sidebar-primary-foreground: #0a0a0a;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #262626;
  --sidebar-ring: #525252;
}
```

---

## 8. Tailwind v4 Integration

### 8.1 Theme Contract (@theme inline)

```css
@theme inline {
  /* === COLORS === */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* === RADIUS === */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* === TYPOGRAPHY === */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  /* === SHADOWS === */
  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

### 8.2 Component Usage

```tsx
// \u2705 CORRECT: Use semantic tokens
export function Button({ variant = "default", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// \u2705 CORRECT: Card component using semantic tokens
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// \u274c WRONG: Hard-coded colors
export function BadButton() {
  return (
    <button className="bg-blue-500 text-white hover:bg-blue-600">
      Click Me
    </button>
  );
}

// \u2705 CORRECT: Accessing CSS variables in JavaScript
const ThemeColorDisplay = () => {
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim();
  
  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();

  return (
    <div>
      <p>Primary: {primaryColor}</p>
      <p>Background: {backgroundColor}</p>
    </div>
  );
};

// \u2705 CORRECT: Dynamic theme-aware styles
export function CustomChart() {
  const chartColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ];

  return (
    <div className="space-y-4">
      {chartColors.map((color, i) => (
        <div
          key={i}
          className="h-8 rounded"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// \u2705 CORRECT: Tailwind utility classes using semantic tokens
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground p-4 rounded-lg border border-border">
    <h2 className="text-primary">Title</h2>
    <p className="text-muted-foreground">Description</p>
    <button className="bg-accent text-accent-foreground">Action</button>
  </div>
</div>

// \u274c WRONG: Bypassing the theme system
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
  This breaks dark mode and theming
</div>
```
// Components are theme-agnostic
<div className="bg-background text-foreground rounded-md shadow-sm" />
<button className="bg-primary text-primary-foreground rounded-lg shadow" />
<Card className="bg-card text-card-foreground border border-border" />
```

---

## 9. Database Persistence

### 9.1 Schema Reference

From `13_DATABASE_SCHEMA.md`:

```sql
Table user_preferences {
  id uuid [pk]
  user_id uuid [not null, unique, ref: > users.id]
  theme text [default: 'system']        -- Mode: light, dark, system
  language text [default: 'en']
  timezone text [default: 'UTC']
  preferences jsonb [default: '{}']     -- Theme intent stored here
}
```

### 9.2 Stored Intent Example

```json
{
  "theme": {
    "version": 1,
    "brand": {
      "primary": "#3b82f6"
    },
    "surface": {
      "contrast": "medium",
      "neutralBias": "cool"
    },
    "mode": "system",
    "typography": {
      "font": "geist",
      "scale": 1.0,
      "letterSpacing": 0
    },
    "shape": {
      "roundness": 0.5
    },
    "elevation": {
      "intensity": 0.5,
      "softness": 0.5
    },
    "spacing": {
      "density": 1.0
    },
    "preset": "blue"
  }
}
```

### 9.3 Storage Rules

| Rule | Description |
|------|-------------|
| **Store intent only** | Never store resolved CSS variables |
| **Version field required** | Enables schema migration |
| **Preset reference optional** | Presets can be re-derived |
| **Mode separate from theme** | `theme` column for quick access |

---

## 10. Runtime Application

### 10.1 Theme Provider

```tsx
// components/theme-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { deriveTheme } from "@/lib/theme/derive";
import type { ThemeIntent, ResolvedTheme } from "@/lib/theme/types";

interface ThemeContextValue {
  intent: ThemeIntent;
  resolved: ResolvedTheme;
  setIntent: (intent: Partial<ThemeIntent>) => void;
  applyPreset: (presetId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ 
  children, 
  initialIntent 
}: { 
  children: React.ReactNode;
  initialIntent: ThemeIntent;
}) {
  const [intent, setIntentState] = useState(initialIntent);
  const [resolved, setResolved] = useState(() => deriveTheme(initialIntent));

  // Apply CSS variables when resolved changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply all resolved variables
    Object.entries(resolved.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Apply mode class
    root.classList.remove("light", "dark");
    root.classList.add(resolved.effectiveMode);
  }, [resolved]);

  const setIntent = (partial: Partial<ThemeIntent>) => {
    const newIntent = { ...intent, ...partial };
    setIntentState(newIntent);
    setResolved(deriveTheme(newIntent));
    // Persist to server...
  };

  return (
    <ThemeContext.Provider value={{ intent, resolved, setIntent, applyPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
```

### 10.2 Hydration Strategy

```tsx
// app/layout.tsx
export default async function RootLayout({ children }) {
  const session = await getSession();
  
  // Fetch user theme intent (or default)
  const intent = session?.user
    ? await getUserThemeIntent(session.user.id)
    : DEFAULT_THEME_INTENT;
  
  // Pre-derive theme for SSR
  const resolved = deriveTheme(intent);
  
  return (
    <html 
      lang="en" 
      className={resolved.effectiveMode}
      style={cssVarsToStyle(resolved.cssVars)}
    >
      <body>
        <ThemeProvider initialIntent={intent}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 11. Preset Library

### 11.1 Preset Categories

| Category | Presets | Description |
|----------|---------|-------------|
| **Default** | `default` | Neutral grayscale, maximum legibility |
| **Solid Colors** | `red`, `green`, `blue`, `pink`, `orange`, `purple` | Single primary color |
| **Flag-Inspired** | `rwbg`, `gyrw`, `rwb`, `gyr`, `gwr`, `rby`, `gyb`, `rbyk`, `by`, `yr`, `br`, `rw`, `bw`, `gw`, `bw-mono` | Multi-color cultural themes |
| **Stylized** | `cyberpunk`, `claude`, `retro-arcade`, `neo-brutalism` | Complete visual identity |

### 11.2 Preset Registry

```typescript
// lib/theme/presets.ts
export const PRESETS: Record<string, ThemeIntent> = {
  default: {
    version: 1,
    brand: { primary: "#171717" },
    surface: { contrast: "medium", neutralBias: "true" },
    mode: "system",
    typography: { font: "system", scale: 1, letterSpacing: 0 },
    shape: { roundness: 0.5 },
    elevation: { intensity: 0.5, softness: 0.5 },
    spacing: { density: 1 },
  },
  
  blue: {
    version: 1,
    brand: { primary: "#2563eb" },
    surface: { contrast: "medium", neutralBias: "cool" },
    mode: "system",
    typography: { font: "geist", scale: 1, letterSpacing: 0 },
    shape: { roundness: 0.5 },
    elevation: { intensity: 0.5, softness: 0.5 },
    spacing: { density: 1 },
  },
  
  cyberpunk: {
    version: 1,
    brand: { primary: "#ec4899", accent: "#06ffa5" },
    surface: { contrast: "high", neutralBias: "cool" },
    mode: "dark",
    typography: { font: "space-grotesk", scale: 1, letterSpacing: 0.02 },
    shape: { roundness: 0.3 },
    elevation: { intensity: 0.8, softness: 0.3 },
    spacing: { density: 1 },
  },
  
  "neo-brutalism": {
    version: 1,
    brand: { primary: "#ff6b35" },
    surface: { contrast: "high", neutralBias: "true" },
    mode: "light",
    typography: { font: "inter", scale: 1.05, letterSpacing: 0 },
    shape: { roundness: 0 },
    elevation: { intensity: 1, softness: 0 },
    spacing: { density: 1.1 },
  },
  
  // ... additional presets
};
```

### 11.3 Complete Preset CSS Reference

The full CSS for all presets is maintained in `docs/THEME_PRESETS.md` and includes:

**Solid Color Presets:**
- 🔴 Red (`theme-red`)
- 🟢 Green (`theme-green`)
- 🔵 Blue (`theme-blue`)
- 🌸 Pink (`theme-pink`)
- 🟠 Orange (`theme-orange`)
- 🟣 Purple (`theme-purple`)

**Flag-Inspired Presets:**
- 🔴⚪⚫🟢 Red/White/Black/Green (`theme-rwbg`)
- 🟢🟡🔴⚪ Green/Yellow/Red/White (`theme-gyrw`)
- 🔴⚪🔵 Red/White/Blue (`theme-rwb`)
- 🟢🟡🔴 Green/Yellow/Red (`theme-gyr`)
- 🟢⚪🔴 Green/White/Red (`theme-gwr`)
- 🔴🔵🟡 Red/Blue/Yellow (`theme-rby`)
- 🟢🟡🔵 Green/Yellow/Blue (`theme-gyb`)
- 🔴⚫🟡 Red/Black/Yellow (`theme-rbyk`)
- 🔵🟡 Blue/Yellow (`theme-by`)
- 🟡🔴 Yellow/Red (`theme-yr`)
- 🔵🔴 Blue/Red (`theme-br`)
- 🔴⚪ Red/White (`theme-rw`)
- 🔵⚪ Blue/White (`theme-bw`)
- 🟢⚪ Green/White (`theme-gw`)
- ⚫⚪ Black/White (`theme-bw-mono`)

**Stylized Presets:**
- CyberPunk (neon pink + cyan, dark mode optimized)
- Claude (warm beige, subtle shadows)
- Retro Arcade (bold colors, pixel-art feel)
- Neo Brutalism (sharp corners, hard shadows)

---

## 12. Plan-Based Access

### 12.1 Theme Feature Matrix

From `01_PRODUCT_REQUIREMENTS.md`, theme access is plan-based:

| Feature               | Guest         | Signed-in Free | Pro       | Advance    |
|---------------------- |-------------- |--------------- |---------- |----------- |
| Light/Dark Mode       | Available     | Available      | Available | Available  |
| Default Preset        | Available     | Available      | Available | Available  |
| Solid Color Presets   | Not Available | Available      | Available | Available  |
| Stylized Presets      | Not Available | Available      | Available | Available  |
| Flag-Inspired Presets | Not Available | Not Available  | Available | Available  |
| Custom Primary Color  | Not Available | Not Available  | Available | Available  |
| Custom Accent Color   | Not Available | Not Available  | Available | Available  |
| Advanced Controls     | Not Available | Not Available  | Available | Available  |

### 12.2 Enforcement

```typescript
// lib/theme/access.ts
// ✅ ADMIN-CONFIGURABLE: Theme preset access managed via admin panel
export async function getAvailablePresets(planId: string): Promise<string[]> {
  // Query database for plan-specific theme access
  const themeAccess = await db.query.plan_theme_access.findMany({
    where: eq(plan_theme_access.plan_id, planId),
    with: {
      preset: true
    }
  });
  
  // Return list of accessible preset codes
  return themeAccess.map(ta => ta.preset.code);
  
  // Example database rows (managed via admin panel):
  // Free plan:    ["default", "red", "green", "blue", "pink", "orange", "purple"]
  // Pro plan:     All SOLID_PRESETS + FLAG_PRESETS + STYLIZED_PRESETS
  // Advance plan: All presets (Object.keys(PRESETS))
  // Guest:        ["default"] only
}

export function canCustomizePrimary(plan: Plan): boolean {
  return plan === "pro" || plan === "advance";
}

export function canCustomizeAdvanced(plan: Plan): boolean {
  return plan === "advance";
}
```

---

## 13. Implementation Guidelines

### 13.1 Component Rules

| Rule | Do | Don't |
|------|----|----|
| **Colors** | `bg-primary text-primary-foreground` | `bg-blue-500 text-white` |
| **Borders** | `border-border` | `border-gray-200` |
| **Radius** | `rounded-md` | `rounded-[8px]` |
| **Shadows** | `shadow-sm` | `shadow-[0_1px_2px_#000]` |
| **Spacing** | Use spacing scale | Hard-coded px values |

### 13.2 File Structure

```
src/
├── lib/
│   └── theme/
│       ├── types.ts          # ThemeIntent, ResolvedTheme types
│       ├── derive.ts         # Derivation engine
│       ├── presets.ts        # Preset registry
│       ├── access.ts         # Plan-based access control
│       └── utils.ts          # OKLCH math, contrast checks
├── components/
│   └── theme-provider.tsx    # React context provider
├── app/
│   └── (settings)/
│       └── appearance/
│           └── page.tsx      # Appearance panel UI
└── styles/
    └── globals.css           # CSS variable definitions
```

### 13.3 Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| **Unit** | Derivation engine math accuracy |
| **Visual** | Preset snapshots in light/dark |
| **Accessibility** | Contrast ratio validation |
| **Integration** | Persistence round-trip |
| **E2E** | Theme change propagation |

---

## Appendix A: Appearance Panel UI Mapping

| UI Control        | Theme Intent Field    | Widget Type                           |
|------------       |-------------------    |-------------                          |
| Theme Preset      | `preset`              | Preset gallery grid                   |
| Primary Color     | `brand.primary`       | Color picker with HEX input           |
| Accent Color      | `brand.accent`        | Color picker (Advance only)           |
| Color Mode        | `mode`                | Segmented control (Light/Dark/System) |
| Surface Contrast  | `surface.contrast`    | Segmented control (Soft/Medium/High)  |
| Neutral Bias      | `surface.neutralBias` | Segmented control (Warm/Cool/True)    |
| Font Family       | `typography.font`     | Dropdown                              |
| Font Scale        | `typography.scale`    | Slider (90%-110%)                     |
| Corner Style      | `shape.roundness`     | Slider with preview                   |
| Shadow Depth      | `elevation.intensity` | Slider with preview                   |
| UI Density        | `spacing.density`     | Slider (Compact/Normal/Spacious)      |
| Reset Button      | —                     | Restores `default` preset             |

---

## Appendix B: OKLCH Quick Reference

OKLCH is used for perceptually uniform color manipulation:

| Component         | Range | Description                   |
|-----------        |-------|-------------                  |
| **L** (Lightness) | 0-1   | 0 = black, 1 = white          |
| **C** (Chroma)    | 0-0.4 | 0 = gray, higher = more vivid |
| **H** (Hue)       | 0-360 | Color wheel angle             |

```css
/* OKLCH example */
--primary: oklch(0.637 0.237 25.331);
/*              L     C     H (red hue) */
```

---

<!-- ## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [00_PRODUCT_REQUIREMENTS](00_PRODUCT_REQUIREMENTS.md) | Feature matrix by plan |
| [10_SYSTEM_ARCHITECTURE](10_SYSTEM_ARCHITECTURE.md) | Frontend stack, Tailwind v4 |
| [13_DATABASE_SCHEMA](13_DATABASE_SCHEMA.md) | user_preferences table |
| [33_THEME_PRESETS](33_THEME_PRESETS.md) | Complete CSS for all presets | -->

---

*This document is the authoritative reference for the HSAFX WORLD theme system. Components, presets, and derivation logic must conform to this specification.*
