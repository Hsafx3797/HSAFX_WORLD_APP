> 📝 **Adding New Presets?**  
> Use [PRESET_CONVERSION_TEMPLATE.md](PRESET_CONVERSION_TEMPLATE.md) to ensure consistency.

---

# App Presets

## ⚠️ CRITICAL: Theme Architecture Philosophy

### Two-Tier Theme System

> **Base Theme = Semantic token definitions**  
> **Presets = FULL variable snapshots (not overrides)**  
> **Overrides are NOT supported**

### Why Full Definitions?

1. **Single Source of Truth**: Each preset is self-contained and complete
2. **No Inheritance Confusion**: What you see is what you get
3. **Portable**: Copy-paste any preset without dependencies
4. **Derivation Integrity**: All tokens derived together maintain consistency

### Preset Format Standard

All presets MUST include:
- `:root` block (light mode) with ALL tokens
- `.dark` block (dark mode) with ALL tokens
- `@theme inline` block for Tailwind v4 integration
- Font definitions, radius, shadows, spacing

**Simple class-based overrides (e.g., `.theme-red { --primary: red; }`) are DEPRECATED.**

---

## DEFAULT PRESET

### Philosophy

* No brand color
* Neutral grayscale
* Maximum legibility
* Zero opinion beyond structure
* Everything derives cleanly later

---

### 1️⃣ Root (Light Mode)

```css
:root {
  /* Core surfaces */
  --background: #ffffff;
  --foreground: #0a0a0a;

  --card: #ffffff;
  --card-foreground: #0a0a0a;

  --popover: #ffffff;
  --popover-foreground: #0a0a0a;

  /* Neutral UI */
  --muted: #f5f5f5;
  --muted-foreground: #737373;

  --accent: #f5f5f5;
  --accent-foreground: #171717;

  --secondary: #f5f5f5;
  --secondary-foreground: #171717;

  /* Borders & inputs */
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #a1a1a1;

  /* Semantic actions */
  --primary: #171717;
  --primary-foreground: #fafafa;

  --destructive: #e7000b;
  --destructive-foreground: #ffffff;

  /* Sidebar (same neutral logic) */
  --sidebar: #fafafa;
  --sidebar-foreground: #0a0a0a;
  --sidebar-primary: #171717;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #171717;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #a1a1a1;

  /* Charts (safe default blues) */
  --chart-1: #91c5ff;
  --chart-2: #3a81f6;
  --chart-3: #2563ef;
  --chart-4: #1a4eda;
  --chart-5: #1f3fad;

  /* Shape & layout */
  --radius: 0.625rem;
  --spacing: 0.25rem;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;

  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
```

---

### 2️⃣ Dark Mode

```css
.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;

  --card: #0a0a0a;
  --card-foreground: #fafafa;

  --popover: #0a0a0a;
  --popover-foreground: #fafafa;

  --muted: #262626;
  --muted-foreground: #a1a1a1;

  --accent: #262626;
  --accent-foreground: #fafafa;

  --secondary: #262626;
  --secondary-foreground: #fafafa;

  --border: #262626;
  --input: #262626;
  --ring: #525252;

  --primary: #fafafa;
  --primary-foreground: #0a0a0a;

  --destructive: #e7000b;
  --destructive-foreground: #ffffff;

  --sidebar: #0a0a0a;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #fafafa;
  --sidebar-primary-foreground: #0a0a0a;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #262626;
  --sidebar-ring: #525252;

  /* Charts stay same for consistency */
  --chart-1: #91c5ff;
  --chart-2: #3a81f6;
  --chart-3: #2563ef;
  --chart-4: #1a4eda;
  --chart-5: #1f3fad;
}
```

---

### 3️⃣ Tailwind v4 Theme Contract (Correct Usage)

```css
@theme inline {
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

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-md: var(--radius);
}
```

---

## 🔴 RED PRESET

```css
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.577 0.245 27.325);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.577 0.245 27.325);
  --chart-2: oklch(0.646 0.222 41.116);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.577 0.245 27.325);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.637 0.237 25.331);
  
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
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.704 0.191 22.216);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.704 0.191 22.216);
  --chart-2: oklch(0.646 0.222 41.116);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.704 0.191 22.216);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.637 0.237 25.331);
  
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
```
OR
```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.637 0.237 25.331);
  --primary-foreground: oklch(0.971 0.013 17.38);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.637 0.237 25.331);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.637 0.237 25.331);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.637 0.237 25.331);
  --primary-foreground: oklch(0.971 0.013 17.38);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.637 0.237 25.331);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.637 0.237 25.331);
  --sidebar-primary-foreground: oklch(0.971 0.013 17.38);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.637 0.237 25.331);
  
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
```

---

## 🟢 GREEN PRESET

```css
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.723 0.219 149.579);
  --primary-foreground: oklch(0.982 0.018 155.826);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.723 0.219 149.579);
  --chart-1: oklch(0.723 0.219 149.579);
  --chart-2: oklch(0.646 0.222 41.116);
  --chart-3: oklch(0.6 0.118 184.704);
  --chart-4: oklch(0.398 0.07 227.392);
  --chart-5: oklch(0.828 0.189 84.429);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.723 0.219 149.579);
  --sidebar-primary-foreground: oklch(0.982 0.018 155.826);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.723 0.219 149.579);
  
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
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.696 0.17 162.48);
  --primary-foreground: oklch(0.266 0.065 152.934);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.527 0.154 150.069);
  --chart-1: oklch(0.696 0.17 162.48);
  --chart-2: oklch(0.488 0.243 264.376);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.696 0.17 162.48);
  --sidebar-primary-foreground: oklch(0.266 0.065 152.934);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.527 0.154 150.069);
  
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
```

**Note:** The existing `:root` + `.dark` GREEN preset that follows is identical and can be used as-is.

---

**Alternative Full GREEN Preset (Already Exists Below):**
OR
```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.723 0.219 149.579);
  --primary-foreground: oklch(0.982 0.018 155.826);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.723 0.219 149.579);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.723 0.219 149.579);
  --sidebar-primary-foreground: oklch(0.982 0.018 155.826);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.723 0.219 149.579);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.696 0.17 162.48);
  --primary-foreground: oklch(0.266 0.065 152.934);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.527 0.154 150.069);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.696 0.17 162.48);
  --sidebar-primary-foreground: oklch(0.266 0.065 152.934);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.527 0.154 150.069);
  
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
```
---

## 🔵 BLUE (Royal) PRESET

**Intent Philosophy:**
- Blue evokes trust, professionalism, and focus
- Ideal for productivity, documentation, and analytical tools
- Lower chroma in dark mode ensures long-session comfort

**Simple Override (DEPRECATED):** Use full OKLCH format below instead.

```css
/* DEPRECATED: Simple format does not support intent-driven derivation */
.theme-blue {
  --primary: #2563eb;
  --primary-foreground: #ffffff;

  --accent: #dbeafe;
  --accent-foreground: #1e3a8a;

  --secondary: #dbeafe;
  --secondary-foreground: #1e3a8a;

  --ring: #60a5fa;
}

.theme-blue.dark {
  --primary: #3b82f6;
  --primary-foreground: #0a0a0a;

  --accent: #111d33;
  --accent-foreground: #bfdbfe;

  --secondary: #111d33;
  --secondary-foreground: #bfdbfe;

  --ring: #1d4ed8;
}
```

**Full OKLCH Format (RECOMMENDED):**
OR
```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.623 0.214 259.815);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.623 0.214 259.815);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.623 0.214 259.815);
  --sidebar-primary-foreground: oklch(0.97 0.014 254.604);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.623 0.214 259.815);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.488 0.243 264.376);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.546 0.245 262.881);
  --sidebar-primary-foreground: oklch(0.97 0.014 254.604);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.488 0.243 264.376);
  
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
```
---

## 🌸 PINK PRESET

**Intent Philosophy:**
- Pink evokes playfulness, approachability, and modern aesthetics
- Ideal for lifestyle apps, social features, and youth-oriented products
- Balanced warmth without sacrificing legibility

**Simple Override (DEPRECATED):** Use full OKLCH format below instead.

```css
/* DEPRECATED: Simple format does not support intent-driven derivation */
.theme-pink {
  --primary: #db2777;
  --primary-foreground: #ffffff;

  --accent: #fce7f3;
  --accent-foreground: #831843;

  --secondary: #fce7f3;
  --secondary-foreground: #831843;

  --ring: #f472b6;
}

.theme-pink.dark {
  --primary: #ec4899;
  --primary-foreground: #0a0a0a;

  --accent: #2b1220;
  --accent-foreground: #fbcfe8;

  --secondary: #2b1220;
  --secondary-foreground: #fbcfe8;

  --ring: #be185d;
}
```

**Full OKLCH Format (RECOMMENDED):**
OR
```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.645 0.246 16.439);
  --primary-foreground: oklch(0.969 0.015 12.422);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.645 0.246 16.439);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.645 0.246 16.439);
  --sidebar-primary-foreground: oklch(0.969 0.015 12.422);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.645 0.246 16.439);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.645 0.246 16.439);
  --primary-foreground: oklch(0.969 0.015 12.422);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.645 0.246 16.439);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.645 0.246 16.439);
  --sidebar-primary-foreground: oklch(0.969 0.015 12.422);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.645 0.246 16.439);
  
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
```
---

## 🟠 ORANGE PRESET

**Intent Philosophy:**
- Orange evokes energy, enthusiasm, and action-oriented thinking
- Ideal for fitness apps, notification systems, and call-to-action heavy interfaces
- Maintains warmth while ensuring sufficient contrast

**Simple Override (DEPRECATED):** Use full OKLCH format below instead.

```css
/* DEPRECATED: Simple format does not support intent-driven derivation */
.theme-orange {
  --primary: #ea580c;
  --primary-foreground: #ffffff;

  --accent: #ffedd5;
  --accent-foreground: #7c2d12;

  --secondary: #ffedd5;
  --secondary-foreground: #7c2d12;

  --ring: #fb923c;
}

.theme-orange.dark {
  --primary: #f97316;
  --primary-foreground: #0a0a0a;

  --accent: #2a170c;
  --accent-foreground: #fed7aa;

  --secondary: #2a170c;
  --secondary-foreground: #fed7aa;

  --ring: #c2410c;
}
```

**Full OKLCH Format (RECOMMENDED):**
OR
```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.705 0.213 47.604);
  --primary-foreground: oklch(0.98 0.016 73.684);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.213 47.604);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.705 0.213 47.604);
  --sidebar-primary-foreground: oklch(0.98 0.016 73.684);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.705 0.213 47.604);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.646 0.222 41.116);
  --primary-foreground: oklch(0.98 0.016 73.684);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.646 0.222 41.116);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.646 0.222 41.116);
  --sidebar-primary-foreground: oklch(0.98 0.016 73.684);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.646 0.222 41.116);
  
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
```
---

## 🟣 PURPLE PRESET

**Intent Philosophy:**
- Purple evokes creativity, innovation, and premium quality
- Ideal for design tools, creative platforms, and brand-focused applications
- Mid-to-high chroma maintains energy without overwhelming

**Simple Override (DEPRECATED):** Use full OKLCH format below instead.

```css
/* DEPRECATED: Simple format does not support intent-driven derivation */
.theme-purple {
  --primary: #7c3aed;
  --primary-foreground: #ffffff;

  --accent: #ede9fe;
  --accent-foreground: #3b0764;

  --secondary: #ede9fe;
  --secondary-foreground: #3b0764;

  --ring: #a78bfa;
}

.theme-purple.dark {
  --primary: #8b5cf6;
  --primary-foreground: #0a0a0a;

  --accent: #1e1333;
  --accent-foreground: #ddd6fe;

  --secondary: #1e1333;
  --secondary-foreground: #ddd6fe;

  --ring: #6d28d9;
}
```

**Full OKLCH Format (RECOMMENDED):**
OR

```
:root {
  --font-sans: Geist, ui-sans-serif, sans-serif;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: Geist Mono, ui-monospace, monospace;

  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.606 0.25 292.717);
  --primary-foreground: oklch(0.969 0.016 293.756);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.606 0.25 292.717);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.606 0.25 292.717);
  --sidebar-primary-foreground: oklch(0.969 0.016 293.756);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.606 0.25 292.717);
  
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
  --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
  --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.541 0.281 293.009);
  --primary-foreground: oklch(0.969 0.016 293.756);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.541 0.281 293.009);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.21 0.006 285.885);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.541 0.281 293.009);
  --sidebar-primary-foreground: oklch(0.969 0.016 293.756);
  --sidebar-accent: oklch(0.274 0.006 286.033);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.541 0.281 293.009);
  
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
```
---

# 🏴 FLAG COMBINATION PRESETS

**Philosophy:**
Flag-inspired presets celebrate cultural identity and global diversity. These multi-color themes distribute brand colors across semantic tokens (`primary`, `secondary`, `accent`, `ring`) to create balanced, culturally-resonant interfaces.

**Strategy:**
- **Patriotic/Regional Apps:** Automatically apply region-based themes
- **User Personalization:** Let users select their cultural color palette
- **Global Products:** Offer inclusive theme options reflecting diverse user base
- **Event Campaigns:** Switch themes for international holidays, sports events

**Implementation:**
All flag presets use the **simple override format** (not full OKLCH derivation) because:
- Multiple distinct hues don't benefit from intent-driven lightness/chroma adjustments
- Each color should remain close to its flag-accurate representation
- The theme system will still derive surfaces and guarantee contrast

**Contrast Guarantee:**
While these presets use HEX for cultural accuracy, the theme system will:
- Convert to OKLCH internally for perceptual uniformity
- Enforce WCAG AA 4.5:1 contrast ratios
- Derive surface hierarchy for cards, popovers, and sidebars

---

## 🔴⚪⚫🟢 Red · White · Black · Green

**(Jordan, Palestine, UAE, etc.)**

```css
.theme-rwbg {
  --primary: #dc2626;     /* red */
  --secondary: #16a34a;   /* green */
  --accent: #f5f5f5;      /* white */
  --ring: #171717;        /* black */
}

.theme-rwbg.dark {
  --primary: #ef4444;
  --secondary: #22c55e;
  --accent: #262626;
  --ring: #fafafa;
}
```

---

## 🟢🟡🔴⚪ Green · Yellow · Red · White

**(Kenya, South Africa, etc.)**

```css
.theme-gyrw {
  --primary: #16a34a;
  --secondary: #eab308;
  --accent: #dc2626;
  --ring: #ffffff;
}

.theme-gyrw.dark {
  --primary: #22c55e;
  --secondary: #facc15;
  --accent: #ef4444;
  --ring: #fafafa;
}
```

---

## 🔴⚪🔵 Red · White · Blue

(USA, UK, France, etc.)

```css
.theme-rwb {
  --primary: #2563eb;
  --secondary: #dc2626;
  --accent: #ffffff;
  --ring: #3b82f6;
}

.theme-rwb.dark {
  --primary: #3b82f6;
  --secondary: #ef4444;
  --accent: #262626;
  --ring: #93c5fd;
}
```

---

## 🟢🟡🔴 Green · Yellow · Red

(Ethiopia, Ghana, etc.)

```css
.theme-gyr {
  --primary: #16a34a;
  --secondary: #eab308;
  --accent: #dc2626;
  --ring: #84cc16;
}

.theme-gyr.dark {
  --primary: #22c55e;
  --secondary: #facc15;
  --accent: #ef4444;
  --ring: #bbf7d0;
}
```

---

## 🟢⚪🔴 Green · White · Red

(Italy, Mexico, etc.)

```css
.theme-gwr {
  --primary: #16a34a;
  --secondary: #dc2626;
  --accent: #ffffff;
  --ring: #4ade80;
}

.theme-gwr.dark {
  --primary: #22c55e;
  --secondary: #ef4444;
  --accent: #262626;
  --ring: #bbf7d0;
}
```

---

## 🔴🔵🟡 Red · Blue · Yellow

(Colombia, Romania, etc.)

```css
.theme-rby {
  --primary: #2563eb;
  --secondary: #dc2626;
  --accent: #eab308;
  --ring: #60a5fa;
}

.theme-rby.dark {
  --primary: #3b82f6;
  --secondary: #ef4444;
  --accent: #facc15;
  --ring: #fde68a;
}
```

---

## 🟢🟡🔵 Green · Yellow · Blue

(Brazil, Jamaica)

```css
.theme-gyb {
  --primary: #16a34a;
  --secondary: #2563eb;
  --accent: #eab308;
  --ring: #4ade80;
}

.theme-gyb.dark {
  --primary: #22c55e;
  --secondary: #3b82f6;
  --accent: #facc15;
  --ring: #bbf7d0;
}
```

---

## 🔴⚫🟡 Red · Black · Yellow

(Germany, Belgium)

```css
.theme-rbyk {
  --primary: #dc2626;
  --secondary: #eab308;
  --accent: #171717;
  --ring: #facc15;
}

.theme-rbyk.dark {
  --primary: #ef4444;
  --secondary: #facc15;
  --accent: #262626;
  --ring: #fde047;
}
```

---

## 🔵🟡 Blue · Yellow

(Ukraine, Sweden)

```css
.theme-by {
  --primary: #2563eb;
  --secondary: #eab308;
  --accent: #dbeafe;
  --ring: #facc15;
}

.theme-by.dark {
  --primary: #3b82f6;
  --secondary: #facc15;
  --accent: #1e293b;
  --ring: #fde68a;
}
```

---

## 🟡🔴 Yellow · Red

(Spain, China)

```css
.theme-yr {
  --primary: #dc2626;
  --secondary: #eab308;
  --accent: #fef3c7;
  --ring: #facc15;
}

.theme-yr.dark {
  --primary: #ef4444;
  --secondary: #facc15;
  --accent: #451a03;
  --ring: #fde047;
}
```

---

## 🔵🔴 Blue · Red

(Haiti, Laos)

```css
.theme-br {
  --primary: #2563eb;
  --secondary: #dc2626;
  --accent: #fee2e2;
  --ring: #3b82f6;
}

.theme-br.dark {
  --primary: #3b82f6;
  --secondary: #ef4444;
  --accent: #1e293b;
  --ring: #93c5fd;
}
```

---

## 🔴⚪ Red · White

```css
.theme-rw {
  --primary: #dc2626;
  --secondary: #ffffff;
  --accent: #fee2e2;
  --ring: #ef4444;
}

.theme-rw.dark {
  --primary: #ef4444;
  --secondary: #262626;
  --accent: #450a0a;
  --ring: #fecaca;
}
```

---

## 🔵⚪ Blue · White

```css
.theme-bw {
  --primary: #2563eb;
  --secondary: #ffffff;
  --accent: #dbeafe;
  --ring: #3b82f6;
}

.theme-bw.dark {
  --primary: #3b82f6;
  --secondary: #262626;
  --accent: #1e293b;
  --ring: #93c5fd;
}
```

---

## 🟢⚪ Green · White

```css
.theme-gw {
  --primary: #16a34a;
  --secondary: #ffffff;
  --accent: #dcfce7;
  --ring: #22c55e;
}

.theme-gw.dark {
  --primary: #22c55e;
  --secondary: #262626;
  --accent: #052e16;
  --ring: #bbf7d0;
}
```

---

## ⚫⚪ Black · White

```css
.theme-bw-mono {
  --primary: #171717;
  --secondary: #ffffff;
  --accent: #f5f5f5;
  --ring: #737373;
}

.theme-bw-mono.dark {
  --primary: #fafafa;
  --secondary: #0a0a0a;
  --accent: #262626;
  --ring: #a1a1a1;
}
```

---

## 🌃 CYBERPUNK PRESET

**Intent Philosophy:**
- Neon pink-magenta primary (#FF2A6D) evokes 80s cyberpunk aesthetic
- High chroma colors (0.29+ in OKLCH) create electric, futuristic vibe
- Ideal for tech products, gaming platforms, and creative tools targeting Gen Z/Millennials
- Green accent (#10B981) provides complementary contrast (pink-green opposition)
- Dark mode leverages deep purples and magentas for immersive night-time experience

**Full OKLCH Format:**
```
:root {
  --background: oklch(0.9816 0.0017 247.8390);
  --foreground: oklch(0.1649 0.0352 281.8285);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1649 0.0352 281.8285);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1649 0.0352 281.8285);
  --primary: oklch(0.6726 0.2904 341.4084);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9595 0.0200 286.0164);
  --secondary-foreground: oklch(0.1649 0.0352 281.8285);
  --muted: oklch(0.9595 0.0200 286.0164);
  --muted-foreground: oklch(0.1649 0.0352 281.8285);
  --accent: oklch(0.8903 0.1739 171.2690);
  --accent-foreground: oklch(0.1649 0.0352 281.8285);
  --destructive: oklch(0.6535 0.2348 34.0370);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9205 0.0086 225.0878);
  --input: oklch(0.9205 0.0086 225.0878);
  --ring: oklch(0.6726 0.2904 341.4084);
  --chart-1: oklch(0.6726 0.2904 341.4084);
  --chart-2: oklch(0.5488 0.2944 299.0954);
  --chart-3: oklch(0.8442 0.1457 209.2851);
  --chart-4: oklch(0.8903 0.1739 171.2690);
  --chart-5: oklch(0.9168 0.1915 101.4070);
  --sidebar: oklch(0.9595 0.0200 286.0164);
  --sidebar-foreground: oklch(0.1649 0.0352 281.8285);
  --sidebar-primary: oklch(0.6726 0.2904 341.4084);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.8903 0.1739 171.2690);
  --sidebar-accent-foreground: oklch(0.1649 0.0352 281.8285);
  --sidebar-border: oklch(0.9205 0.0086 225.0878);
  --sidebar-ring: oklch(0.6726 0.2904 341.4084);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -2px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -2px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -2px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 1px 2px -3px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 1px 2px -3px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 2px 4px -3px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 4px 6px -3px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 8px 10px -3px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -2px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1649 0.0352 281.8285);
  --foreground: oklch(0.9513 0.0074 260.7315);
  --card: oklch(0.2542 0.0611 281.1423);
  --card-foreground: oklch(0.9513 0.0074 260.7315);
  --popover: oklch(0.2542 0.0611 281.1423);
  --popover-foreground: oklch(0.9513 0.0074 260.7315);
  --primary: oklch(0.6726 0.2904 341.4084);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.2542 0.0611 281.1423);
  --secondary-foreground: oklch(0.9513 0.0074 260.7315);
  --muted: oklch(0.2123 0.0522 280.9917);
  --muted-foreground: oklch(0.6245 0.0500 278.1046);
  --accent: oklch(0.8903 0.1739 171.2690);
  --accent-foreground: oklch(0.1649 0.0352 281.8285);
  --destructive: oklch(0.6535 0.2348 34.0370);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3279 0.0832 280.7890);
  --input: oklch(0.3279 0.0832 280.7890);
  --ring: oklch(0.6726 0.2904 341.4084);
  --chart-1: oklch(0.6726 0.2904 341.4084);
  --chart-2: oklch(0.5488 0.2944 299.0954);
  --chart-3: oklch(0.8442 0.1457 209.2851);
  --chart-4: oklch(0.8903 0.1739 171.2690);
  --chart-5: oklch(0.9168 0.1915 101.4070);
  --sidebar: oklch(0.1649 0.0352 281.8285);
  --sidebar-foreground: oklch(0.9513 0.0074 260.7315);
  --sidebar-primary: oklch(0.6726 0.2904 341.4084);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.8903 0.1739 171.2690);
  --sidebar-accent-foreground: oklch(0.1649 0.0352 281.8285);
  --sidebar-border: oklch(0.3279 0.0832 280.7890);
  --sidebar-ring: oklch(0.6726 0.2904 341.4084);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 8px;
  --shadow-spread: -2px;
  --shadow-opacity: 0.1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 4px 8px -2px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -2px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 1px 2px -3px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 1px 2px -3px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 2px 4px -3px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 4px 6px -3px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -2px hsl(0 0% 0% / 0.10), 0px 8px 10px -3px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -2px hsl(0 0% 0% / 0.25);
}

@theme inline {
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

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

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

## 🤖 CLAUDE (Anthropic-Inspired) PRESET

**Intent Philosophy:**
- Warm beige (#CC785C) primary evokes Anthropic's brand identity
- Low chroma (0.13-0.15) creates calming, approachable AI assistant aesthetic
- Extremely subtle backgrounds (L=0.98, C=0.005) prioritize content readability
- Ideal for conversational AI, documentation platforms, and educational tools
- Muted palette reduces cognitive load during extended reading sessions

**Full OKLCH Format:**
```
:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9818 0.0054 95.0986);
  --card-foreground: oklch(0.1908 0.0020 106.5859);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.9390);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --secondary-foreground: oklch(0.4334 0.0177 98.6048);
  --muted: oklch(0.9341 0.0153 90.2390);
  --muted-foreground: oklch(0.6059 0.0075 97.4233);
  --accent: oklch(0.9245 0.0138 92.9892);
  --accent-foreground: oklch(0.2671 0.0196 98.9390);
  --destructive: oklch(0.1908 0.0020 106.5859);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8847 0.0069 97.3627);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.8816 0.0276 93.1280);
  --chart-4: oklch(0.8822 0.0403 298.1792);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.9663 0.0080 98.8792);
  --sidebar-foreground: oklch(0.3590 0.0051 106.6524);
  --sidebar-primary: oklch(0.6171 0.1375 39.0427);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.9245 0.0138 92.9892);
  --sidebar-accent-foreground: oklch(0.3250 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.8074 0.0142 93.0137);
  --card: oklch(0.2679 0.0036 106.6427);
  --card-foreground: oklch(0.9818 0.0054 95.0986);
  --popover: oklch(0.3085 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.0040 106.4781);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9818 0.0054 95.0986);
  --secondary-foreground: oklch(0.3085 0.0035 106.6039);
  --muted: oklch(0.2213 0.0038 106.7070);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.2130 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.0080 98.8792);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.2130 0.0078 95.4245);
  --chart-4: oklch(0.3074 0.0516 289.3230);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.2357 0.0024 67.7077);
  --sidebar-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-primary: oklch(0.3250 0 0);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.1680 0.0020 106.6177);
  --sidebar-accent-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
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

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

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

## 🕹️ RETRO ARCADE PRESET

**Intent Philosophy:**
- Hot pink primary (#E91E63) channels 1980s arcade cabinets and CRT glow
- Mid-range chroma (0.17-0.20) balances nostalgia with modern usability
- Cyan/teal secondary (#0891B2) provides classic arcade color pairing
- Ideal for gaming platforms, creative tools, and entertainment apps
- Warm yellow/orange accents (#F97316) add arcade cabinet button aesthetic

**Full OKLCH Format:**
```
:root {
  --background: oklch(0.9735 0.0261 90.0953);
  --foreground: oklch(0.3092 0.0518 219.6516);
  --card: oklch(0.9306 0.0260 92.4020);
  --card-foreground: oklch(0.3092 0.0518 219.6516);
  --popover: oklch(0.9306 0.0260 92.4020);
  --popover-foreground: oklch(0.3092 0.0518 219.6516);
  --primary: oklch(0.5924 0.2025 355.8943);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.6437 0.1019 187.3840);
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.6979 0.0159 196.7940);
  --muted-foreground: oklch(0.3092 0.0518 219.6516);
  --accent: oklch(0.5808 0.1732 39.5003);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0.5863 0.2064 27.1172);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.6537 0.0197 205.2618);
  --input: oklch(0.6537 0.0197 205.2618);
  --ring: oklch(0.5924 0.2025 355.8943);
  --chart-1: oklch(0.6149 0.1394 244.9273);
  --chart-2: oklch(0.6437 0.1019 187.3840);
  --chart-3: oklch(0.5924 0.2025 355.8943);
  --chart-4: oklch(0.5808 0.1732 39.5003);
  --chart-5: oklch(0.5863 0.2064 27.1172);
  --sidebar: oklch(0.9735 0.0261 90.0953);
  --sidebar-foreground: oklch(0.3092 0.0518 219.6516);
  --sidebar-primary: oklch(0.5924 0.2025 355.8943);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.6437 0.1019 187.3840);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0.6537 0.0197 205.2618);
  --sidebar-ring: oklch(0.5924 0.2025 355.8943);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0.25rem;
  --shadow-x: 2px;
  --shadow-y: 2px;
  --shadow-blur: 4px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.15;
  --shadow-color: hsl(196 83% 10%);
  --shadow-2xs: 2px 2px 4px 0px hsl(196 83% 10% / 0.07);
  --shadow-xs: 2px 2px 4px 0px hsl(196 83% 10% / 0.07);
  --shadow-sm: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 1px 2px -1px hsl(196 83% 10% / 0.15);
  --shadow: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 1px 2px -1px hsl(196 83% 10% / 0.15);
  --shadow-md: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 2px 4px -1px hsl(196 83% 10% / 0.15);
  --shadow-lg: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 4px 6px -1px hsl(196 83% 10% / 0.15);
  --shadow-xl: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 8px 10px -1px hsl(196 83% 10% / 0.15);
  --shadow-2xl: 2px 2px 4px 0px hsl(196 83% 10% / 0.38);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2673 0.0486 219.8169);
  --foreground: oklch(0.6979 0.0159 196.7940);
  --card: oklch(0.3092 0.0518 219.6516);
  --card-foreground: oklch(0.6979 0.0159 196.7940);
  --popover: oklch(0.3092 0.0518 219.6516);
  --popover-foreground: oklch(0.6979 0.0159 196.7940);
  --primary: oklch(0.5924 0.2025 355.8943);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.6437 0.1019 187.3840);
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.5230 0.0283 219.1365);
  --muted-foreground: oklch(0.6979 0.0159 196.7940);
  --accent: oklch(0.5808 0.1732 39.5003);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0.5863 0.2064 27.1172);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.5230 0.0283 219.1365);
  --input: oklch(0.5230 0.0283 219.1365);
  --ring: oklch(0.5924 0.2025 355.8943);
  --chart-1: oklch(0.6149 0.1394 244.9273);
  --chart-2: oklch(0.6437 0.1019 187.3840);
  --chart-3: oklch(0.5924 0.2025 355.8943);
  --chart-4: oklch(0.5808 0.1732 39.5003);
  --chart-5: oklch(0.5863 0.2064 27.1172);
  --sidebar: oklch(0.2673 0.0486 219.8169);
  --sidebar-foreground: oklch(0.6979 0.0159 196.7940);
  --sidebar-primary: oklch(0.5924 0.2025 355.8943);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.6437 0.1019 187.3840);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0.5230 0.0283 219.1365);
  --sidebar-ring: oklch(0.5924 0.2025 355.8943);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0.25rem;
  --shadow-x: 2px;
  --shadow-y: 2px;
  --shadow-blur: 4px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.15;
  --shadow-color: hsl(196 83% 10%);
  --shadow-2xs: 2px 2px 4px 0px hsl(196 83% 10% / 0.07);
  --shadow-xs: 2px 2px 4px 0px hsl(196 83% 10% / 0.07);
  --shadow-sm: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 1px 2px -1px hsl(196 83% 10% / 0.15);
  --shadow: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 1px 2px -1px hsl(196 83% 10% / 0.15);
  --shadow-md: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 2px 4px -1px hsl(196 83% 10% / 0.15);
  --shadow-lg: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 4px 6px -1px hsl(196 83% 10% / 0.15);
  --shadow-xl: 2px 2px 4px 0px hsl(196 83% 10% / 0.15), 2px 8px 10px -1px hsl(196 83% 10% / 0.15);
  --shadow-2xl: 2px 2px 4px 0px hsl(196 83% 10% / 0.38);
}

@theme inline {
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

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

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

## 🟧 NEO BRUTALISM PRESET

**Intent Philosophy:**
- Pure black borders (L=0) and stark contrast embody brutalist design principles
- High chroma accents (0.24+) against pure white backgrounds create bold, unapologetic interfaces
- Orange primary (#EA580C), neon yellow secondary (#FDE047), and purple accent (#7C3AED) provide maximum visual impact
- Ideal for portfolio sites, design agencies, and brands prioritizing bold statements over subtlety
- Rejects gradients, shadows, and soft UI paradigms in favor of hard edges and flat colors

**Full OKLCH Format:**
```
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-x: 4px;
  --shadow-y: 4px;
  --shadow-blur: 0px;
  --shadow-spread: 0px;
  --shadow-opacity: 1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(1.0000 0 0);
  --card: oklch(0.3211 0 0);
  --card-foreground: oklch(1.0000 0 0);
  --popover: oklch(0.3211 0 0);
  --popover-foreground: oklch(1.0000 0 0);
  --primary: oklch(0.7044 0.1872 23.1858);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.9691 0.2005 109.6228);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.2178 0 0);
  --muted-foreground: oklch(0.8452 0 0);
  --accent: oklch(0.6755 0.1765 252.2592);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(1.0000 0 0);
  --destructive-foreground: oklch(0 0 0);
  --border: oklch(1.0000 0 0);
  --input: oklch(1.0000 0 0);
  --ring: oklch(0.7044 0.1872 23.1858);
  --chart-1: oklch(0.7044 0.1872 23.1858);
  --chart-2: oklch(0.9691 0.2005 109.6228);
  --chart-3: oklch(0.6755 0.1765 252.2592);
  --chart-4: oklch(0.7395 0.2268 142.8504);
  --chart-5: oklch(0.6131 0.2458 328.0714);
  --sidebar: oklch(0 0 0);
  --sidebar-foreground: oklch(1.0000 0 0);
  --sidebar-primary: oklch(0.7044 0.1872 23.1858);
  --sidebar-primary-foreground: oklch(0 0 0);
  --sidebar-accent: oklch(0.6755 0.1765 252.2592);
  --sidebar-accent-foreground: oklch(0 0 0);
  --sidebar-border: oklch(1.0000 0 0);
  --sidebar-ring: oklch(0.7044 0.1872 23.1858);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-x: 4px;
  --shadow-y: 4px;
  --shadow-blur: 0px;
  --shadow-spread: 0px;
  --shadow-opacity: 1;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
}

@theme inline {
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

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

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