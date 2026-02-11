# 🎨 Theme Preset Conversion Template

**Purpose:** Convert simple class-based presets to full OKLCH format  
**Status:** Use this template for remaining 15+ presets

---

## ✅ Conversion Steps

### 1. Identify Primary Color in HEX
Example: RED preset → `#dc2626` (light), `#ef4444` (dark)

### 2. Convert HEX to OKLCH
Use: https://oklch.com or https://colorjs.io/apps/convert/

Example conversions:
- `#dc2626` → `oklch(0.577 0.245 27.325)`
- `#ef4444` → `oklch(0.704 0.191 22.216)`

### 3. Use Full Template Below

---

## 📋 Full Preset Template

```css
## 🔴 [COLOR NAME] PRESET

\`\`\`css
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  
  /* Core Surface Colors */
  --background: oklch(1 0 0);  /* Pure white */
  --foreground: oklch(0.141 0.005 285.823);  /* Near black */
  
  /* Card & Popover */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  
  /* PRIMARY COLOR - Replace with converted OKLCH */
  --primary: oklch(0.577 0.245 27.325);  /* ← CHANGE THIS */
  --primary-foreground: oklch(1 0 0);
  
  /* Neutrals (keep same across presets) */
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  
  /* Destructive (usually red, can vary) */
  --destructive: oklch(0.577 0.245 27.325);
  
  /* Borders & Inputs (neutral gray) */
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  
  /* Ring (focus) - Use primary's hue with adjusted chroma */
  --ring: oklch(0.637 0.237 25.331);  /* ← Match primary hue */
  
  /* Chart Colors - First one should match primary */
  --chart-1: oklch(0.577 0.245 27.325);  /* ← Same as primary */
  --chart-2: oklch(0.646 0.222 41.116);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  
  /* Sidebar (keep neutral) */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.577 0.245 27.325);  /* ← Match primary */
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.637 0.237 25.331);  /* ← Match ring */
  
  /* Shadows (keep same) */
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
  
  --spacing: 0.25rem;
}

.dark {
  /* Dark mode background */
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  
  /* Elevated surfaces */
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  
  /* PRIMARY COLOR DARK - Replace with converted dark OKLCH */
  --primary: oklch(0.704 0.191 22.216);  /* ← CHANGE THIS */
  --primary-foreground: oklch(1 0 0);
  
  /* Neutrals */
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  
  /* Destructive */
  --destructive: oklch(0.704 0.191 22.216);
  
  /* Borders with alpha transparency */
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  
  /* Ring */
  --ring: oklch(0.637 0.237 25.331);  /* ← Match primary hue */
  
  /* Charts */
  --chart-1: oklch(0.704 0.191 22.216);  /* ← Same as primary */
  --chart-2: oklch(0.646 0.222 41.116);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  
  /* Sidebar */
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.704 0.191 22.216);  /* ← Match primary */
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.637 0.237 25.331);  /* ← Match ring */
  
  --shadow-color: oklch(0 0 0);
}

@theme inline {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
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

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
\`\`\`
```

---

## 🎯 Quick Reference: Presets Needing Conversion

| Preset | Old Primary (Light) | Old Primary (Dark) | Status |
|--------|---------------------|---------------------|--------|
| ✅ RED | `#dc2626` | `#ef4444` | ✅ DONE |
| GREEN | `#16a34a` | `#22c55e` | ⏳ TODO |
| BLUE | `#2563eb` | `#3b82f6` | ⏳ TODO |
| PINK | `#db2777` | `#ec4899` | ⏳ TODO |
| ORANGE | `#ea580c` | `#f97316` | ⏳ TODO |
| PURPLE | `#7c3aed` | `#8b5cf6` | ⏳ TODO |
| RWBG | Red/Green/White/Black | - | ⏳ TODO |
| GYRW | Green/Yellow/Red/White | - | ⏳ TODO |
| RWB | Red/White/Blue | - | ⏳ TODO |
| GYR | Green/Yellow/Red | - | ⏳ TODO |
| GWR | Green/White/Red | - | ⏳ TODO |
| RBY | Red/Blue/Yellow | - | ⏳ TODO |
| GYB | Green/Yellow/Blue | - | ⏳ TODO |
| RBYK | Red/Black/Yellow | - | ⏳ TODO |
| BY | Blue/Yellow | - | ⏳ TODO |
| YR | Yellow/Red | - | ⏳ TODO |
| BR | Blue/Red | - | ⏳ TODO |
| RW | Red/White | - | ⏳ TODO |
| BW | Blue/White | - | ⏳ TODO |
| GW | Green/White | - | ⏳ TODO |
| BW-MONO | Black/White | - | ⏳ TODO |

---

## 📝 Conversion Checklist

For each preset:

- [ ] Identify primary color(s) in HEX
- [ ] Convert to OKLCH (light mode)
- [ ] Convert to OKLCH (dark mode)
- [ ] Replace `--primary` in template
- [ ] Replace `--ring` (match primary hue)
- [ ] Replace `--chart-1` (same as primary)
- [ ] Update `--sidebar-primary` (same as primary)
- [ ] Update `--sidebar-ring` (same as ring)
- [ ] For multi-color flags: use primary for main color, secondary for accent
- [ ] Test in light & dark mode
- [ ] Validate contrast ratios

---

## 🔧 Tools for Conversion

1. **OKLCH Converter:** https://oklch.com
2. **Contrast Checker:** https://webaim.org/resources/contrastchecker/
3. **Color.js Converter:** https://colorjs.io/apps/convert/

---

## 💡 Multi-Color Flag Presets

For presets with 3-4 colors (e.g., RWBG = Red/White/Black/Green):

**Strategy:**
- `--primary`: Dominant color (usually first color)
- `--secondary`: Secondary color
- `--accent`: Third color
- `--ring`: Match primary
- Keep neutrals (muted, border, etc.) as standard grays

**Example:** RWBG (Red/White/Black/Green)
```css
--primary: oklch(0.577 0.245 27.325);     /* Red */
--secondary: oklch(0.723 0.219 149.579);  /* Green */
--accent: oklch(1 0 0);                   /* White (keep light surfaces) */
--ring: oklch(0.637 0.237 25.331);        /* Red hue */
```

---

*Use this template to complete remaining preset conversions*
