/**
 * Theme Derivation Engine
 * 
 * Transforms user intent into resolved CSS variables.
 * Guarantees WCAG AA contrast ratios and mode-aware color derivation.
 * 
 * @see docs/planning/32_THEME_SYSTEM.md Section 6
 */

import type {
  ThemeIntent,
  ResolvedTheme,
  ResolvedColors,
  ResolvedRadius,
  ResolvedShadows,
  ResolvedTypography,
  OklchColor,
  ColorMode,
} from './types';

import {
  parseToOklch,
  createOklch,
  oklchToCss,
  clampOklch,
  adjustLightness,
  adjustChroma,
  ensureContrast,
  generateChartPalette,
  OKLCH_COLORS,
} from './utils';

/**
 * Font stack mappings for each font family preset
 */
const FONT_STACKS = {
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  geist: 'Geist, ui-sans-serif, system-ui, sans-serif',
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  'space-grotesk': '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
} as const;

const FONT_MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const FONT_SERIF_STACK = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

/**
 * Determine effective color mode based on intent and system preference
 */
export function resolveColorMode(
  mode: ColorMode,
  systemPrefersDark: boolean = false
): 'light' | 'dark' {
  if (mode === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Derive all colors from user intent for a specific mode
 */
export function deriveColors(
  intent: ThemeIntent,
  mode: 'light' | 'dark'
): ResolvedColors {
  // Parse primary color from intent
  const primaryOklch = parseToOklch(intent.brand.primary);
  if (!primaryOklch) {
    throw new Error(`Invalid primary color: ${intent.brand.primary}`);
  }

  const isLight = mode === 'light';
  const hue = primaryOklch.h;

  // Surface contrast adjustments based on intent
  const contrastMultiplier = {
    soft: 0.85,
    medium: 1.0,
    high: 1.15,
  }[intent.surface.contrast];

  // Neutral bias adjustments (affects gray tones)
  const neutralHue = {
    warm: 60, // Slight yellow/orange tint
    cool: 260, // Slight blue/purple tint
    true: 0, // Pure gray (no hue)
  }[intent.surface.neutralBias];

  const neutralChroma = intent.surface.neutralBias === 'true' ? 0 : 0.005;

  // === SURFACES ===
  const background = isLight
    ? createOklch(1 * contrastMultiplier, neutralChroma, neutralHue)
    : createOklch(0.141, neutralChroma * 0.8, neutralHue);

  const foreground = isLight
    ? createOklch(0.141 / contrastMultiplier, neutralChroma, neutralHue)
    : createOklch(0.985 * contrastMultiplier, neutralChroma, neutralHue);

  // Ensure foreground meets contrast requirements
  const safeforeground = ensureContrast(foreground, background, 4.5);

  // Card surfaces
  const card = isLight
    ? background // Same as background in light mode
    : adjustLightness(background, 0.07);

  const cardForeground = safeforeground;

  // Popover surfaces
  const popover = isLight
    ? background
    : adjustLightness(background, 0.09);

  const popoverForeground = safeforeground;

  // === PRIMARY ===
  // Adjust primary for the mode to maintain vibrancy
  const primary = isLight
    ? clampOklch({
        l: Math.max(0.3, Math.min(0.7, primaryOklch.l)),
        c: primaryOklch.c,
        h: primaryOklch.h,
      })
    : clampOklch({
        l: Math.max(0.5, Math.min(0.8, primaryOklch.l + 0.1)),
        c: primaryOklch.c * 0.9,
        h: primaryOklch.h,
      });

  const primaryForeground = isLight
    ? createOklch(1, 0, 0) // White on colored background
    : createOklch(0.1, 0, 0); // Near-black on colored background

  // === SECONDARY (Muted version of background) ===
  const secondary = isLight
    ? createOklch(0.967, neutralChroma, neutralHue)
    : createOklch(0.274, neutralChroma, neutralHue);

  const secondaryForeground = safeforeground;

  // === MUTED ===
  const muted = secondary;
  const mutedForeground = isLight
    ? createOklch(0.552, neutralChroma * 2, neutralHue)
    : createOklch(0.705, neutralChroma * 2, neutralHue);

  // === ACCENT (Subtle primary tint) ===
  const accent = isLight
    ? createOklch(0.967, primaryOklch.c * 0.05, hue)
    : createOklch(0.274, primaryOklch.c * 0.1, hue);

  const accentForeground = safeforeground;

  // === DESTRUCTIVE ===
  const destructiveHue = 27; // Red hue in OKLCH
  const destructive = isLight
    ? createOklch(0.577, 0.245, destructiveHue)
    : createOklch(0.704, 0.191, destructiveHue);

  const destructiveForeground = createOklch(1, 0, 0);

  // === SUCCESS ===
  const successHue = 150; // Green hue in OKLCH
  const success = isLight
    ? createOklch(0.6, 0.2, successHue)
    : createOklch(0.7, 0.17, successHue);

  const successForeground = isLight
    ? createOklch(1, 0, 0)
    : createOklch(0.15, 0.03, successHue);

  // === WARNING ===
  const warningHue = 75; // Yellow-orange hue in OKLCH
  const warning = isLight
    ? createOklch(0.75, 0.18, warningHue)
    : createOklch(0.85, 0.17, warningHue);

  const warningForeground = createOklch(0.15, 0.02, warningHue);

  // === INFO ===
  const infoHue = 220; // Blue hue in OKLCH
  const info = isLight
    ? createOklch(0.65, 0.15, infoHue)
    : createOklch(0.75, 0.13, infoHue);

  const infoForeground = isLight
    ? createOklch(1, 0, 0)
    : createOklch(0.15, 0.03, infoHue);

  // === BORDERS & INPUTS ===
  const border = isLight
    ? createOklch(0.92, neutralChroma * 0.5, neutralHue)
    : createOklch(0.33, neutralChroma, neutralHue);

  const input = border;

  // === RING (Focus indicator) ===
  const ring = clampOklch({
    l: primary.l,
    c: primary.c * 0.8,
    h: primary.h,
  });

  // === SIDEBAR ===
  const sidebar = isLight
    ? adjustLightness(background, -0.015)
    : adjustLightness(background, 0.07);

  const sidebarForeground = safeforeground;
  const sidebarPrimary = primary;
  const sidebarPrimaryForeground = primaryForeground;
  const sidebarAccent = accent;
  const sidebarAccentForeground = accentForeground;
  const sidebarBorder = border;
  const sidebarRing = ring;

  // === CHARTS ===
  const chartPalette = generateChartPalette(primary, 5);

  return {
    background: oklchToCss(clampOklch(background)),
    foreground: oklchToCss(clampOklch(safeforeground)),
    card: oklchToCss(clampOklch(card)),
    cardForeground: oklchToCss(clampOklch(cardForeground)),
    popover: oklchToCss(clampOklch(popover)),
    popoverForeground: oklchToCss(clampOklch(popoverForeground)),
    primary: oklchToCss(clampOklch(primary)),
    primaryForeground: oklchToCss(clampOklch(primaryForeground)),
    secondary: oklchToCss(clampOklch(secondary)),
    secondaryForeground: oklchToCss(clampOklch(secondaryForeground)),
    muted: oklchToCss(clampOklch(muted)),
    mutedForeground: oklchToCss(clampOklch(mutedForeground)),
    accent: oklchToCss(clampOklch(accent)),
    accentForeground: oklchToCss(clampOklch(accentForeground)),
    destructive: oklchToCss(clampOklch(destructive)),
    destructiveForeground: oklchToCss(clampOklch(destructiveForeground)),
    success: oklchToCss(clampOklch(success)),
    successForeground: oklchToCss(clampOklch(successForeground)),
    warning: oklchToCss(clampOklch(warning)),
    warningForeground: oklchToCss(clampOklch(warningForeground)),
    info: oklchToCss(clampOklch(info)),
    infoForeground: oklchToCss(clampOklch(infoForeground)),
    border: oklchToCss(clampOklch(border)),
    input: oklchToCss(clampOklch(input)),
    ring: oklchToCss(clampOklch(ring)),
    sidebar: oklchToCss(clampOklch(sidebar)),
    sidebarForeground: oklchToCss(clampOklch(sidebarForeground)),
    sidebarPrimary: oklchToCss(clampOklch(sidebarPrimary)),
    sidebarPrimaryForeground: oklchToCss(clampOklch(sidebarPrimaryForeground)),
    sidebarAccent: oklchToCss(clampOklch(sidebarAccent)),
    sidebarAccentForeground: oklchToCss(clampOklch(sidebarAccentForeground)),
    sidebarBorder: oklchToCss(clampOklch(sidebarBorder)),
    sidebarRing: oklchToCss(clampOklch(sidebarRing)),
    chart1: oklchToCss(chartPalette[0] ?? primary),
    chart2: oklchToCss(chartPalette[1] ?? adjustLightness(primary, 0.1)),
    chart3: oklchToCss(chartPalette[2] ?? adjustLightness(primary, -0.1)),
    chart4: oklchToCss(chartPalette[3] ?? adjustLightness(primary, 0.2)),
    chart5: oklchToCss(chartPalette[4] ?? adjustLightness(primary, -0.2)),
  };
}

/**
 * Derive radius tokens from roundness value
 */
export function deriveRadius(roundness: number): ResolvedRadius {
  // roundness: 0 = sharp (0px), 1 = pill (1rem+)
  const base = roundness * 0.625; // 0 → 0.625rem

  return {
    radius: `${base}rem`,
    radiusSm: `calc(${base}rem - 4px)`,
    radiusMd: `calc(${base}rem - 2px)`,
    radiusLg: `${base}rem`,
    radiusXl: `calc(${base}rem + 4px)`,
  };
}

/**
 * Derive shadow tokens from intensity and softness
 */
export function deriveShadows(
  intensity: number,
  softness: number,
  mode: 'light' | 'dark'
): ResolvedShadows {
  const isLight = mode === 'light';
  const baseOpacity = isLight ? intensity * 0.15 : intensity * 0.25;
  const blur = Math.round(softness * 8);

  // Shadow opacity scales
  const opacity2xs = baseOpacity * 0.2;
  const opacityXs = baseOpacity * 0.33;
  const opacitySm = baseOpacity * 0.67;
  const opacityBase = baseOpacity;
  const opacityMd = baseOpacity * 1.1;
  const opacityLg = baseOpacity * 1.2;
  const opacityXl = baseOpacity * 1.3;
  const opacity2xl = baseOpacity * 1.5;

  return {
    shadowColor: 'oklch(0 0 0)',
    shadow2xs: `0 1px ${blur}px rgba(0,0,0,${opacity2xs.toFixed(3)})`,
    shadowXs: `0 1px ${blur}px rgba(0,0,0,${opacityXs.toFixed(3)})`,
    shadowSm: `0 1px ${blur * 1.5}px rgba(0,0,0,${opacitySm.toFixed(3)}), 0 1px 2px rgba(0,0,0,${(opacitySm * 0.6).toFixed(3)})`,
    shadow: `0 1px ${blur * 1.5}px rgba(0,0,0,${opacityBase.toFixed(3)}), 0 1px 2px rgba(0,0,0,${(opacityBase * 0.6).toFixed(3)})`,
    shadowMd: `0 4px ${blur * 2}px rgba(0,0,0,${opacityMd.toFixed(3)}), 0 2px 4px rgba(0,0,0,${(opacityMd * 0.6).toFixed(3)})`,
    shadowLg: `0 10px ${blur * 3}px rgba(0,0,0,${opacityLg.toFixed(3)}), 0 4px 6px rgba(0,0,0,${(opacityLg * 0.5).toFixed(3)})`,
    shadowXl: `0 20px ${blur * 4}px rgba(0,0,0,${opacityXl.toFixed(3)}), 0 8px 10px rgba(0,0,0,${(opacityXl * 0.4).toFixed(3)})`,
    shadow2xl: `0 25px ${blur * 5}px rgba(0,0,0,${opacity2xl.toFixed(3)})`,
  };
}

/**
 * Derive typography tokens
 */
export function deriveTypography(intent: ThemeIntent): ResolvedTypography {
  const fontKey = intent.typography.font;
  let fontStack: string;
  
  switch (fontKey) {
    case 'geist':
      fontStack = FONT_STACKS.geist;
      break;
    case 'inter':
      fontStack = FONT_STACKS.inter;
      break;
    case 'space-grotesk':
      fontStack = FONT_STACKS['space-grotesk'];
      break;
    case 'system':
    default:
      fontStack = FONT_STACKS.system;
  }

  return {
    fontSans: fontStack,
    fontMono: FONT_MONO_STACK,
    fontSerif: FONT_SERIF_STACK,
    scale: intent.typography.scale,
    letterSpacing: `${intent.typography.letterSpacing}em`,
  };
}

/**
 * Convert resolved theme to CSS variables
 */
export function themeToCssVars(
  colors: ResolvedColors,
  radius: ResolvedRadius,
  shadows: ResolvedShadows,
  typography: ResolvedTypography,
  spacing: number
): Record<string, string> {
  return {
    // Colors
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--popover': colors.popover,
    '--popover-foreground': colors.popoverForeground,
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--destructive': colors.destructive,
    '--destructive-foreground': colors.destructiveForeground,
    '--success': colors.success,
    '--success-foreground': colors.successForeground,
    '--warning': colors.warning,
    '--warning-foreground': colors.warningForeground,
    '--info': colors.info,
    '--info-foreground': colors.infoForeground,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--sidebar': colors.sidebar,
    '--sidebar-foreground': colors.sidebarForeground,
    '--sidebar-primary': colors.sidebarPrimary,
    '--sidebar-primary-foreground': colors.sidebarPrimaryForeground,
    '--sidebar-accent': colors.sidebarAccent,
    '--sidebar-accent-foreground': colors.sidebarAccentForeground,
    '--sidebar-border': colors.sidebarBorder,
    '--sidebar-ring': colors.sidebarRing,
    '--chart-1': colors.chart1,
    '--chart-2': colors.chart2,
    '--chart-3': colors.chart3,
    '--chart-4': colors.chart4,
    '--chart-5': colors.chart5,

    // Radius
    '--radius': radius.radius,

    // Shadows
    '--shadow-color': shadows.shadowColor,
    '--shadow-2xs': shadows.shadow2xs,
    '--shadow-xs': shadows.shadowXs,
    '--shadow-sm': shadows.shadowSm,
    '--shadow': shadows.shadow,
    '--shadow-md': shadows.shadowMd,
    '--shadow-lg': shadows.shadowLg,
    '--shadow-xl': shadows.shadowXl,
    '--shadow-2xl': shadows.shadow2xl,

    // Typography
    '--font-sans': typography.fontSans,
    '--font-mono': typography.fontMono,
    '--font-serif': typography.fontSerif,

    // Spacing
    '--spacing': `${0.25 * spacing}rem`,
  };
}

/**
 * Main derivation function - transforms intent into resolved theme
 */
export function deriveTheme(
  intent: ThemeIntent,
  systemPrefersDark: boolean = false
): ResolvedTheme {
  const effectiveMode = resolveColorMode(intent.mode, systemPrefersDark);

  const colors = deriveColors(intent, effectiveMode);
  const radius = deriveRadius(intent.shape.roundness);
  const shadows = deriveShadows(
    intent.elevation.intensity,
    intent.elevation.softness,
    effectiveMode
  );
  const typography = deriveTypography(intent);
  const spacing = intent.spacing.density;

  const cssVars = themeToCssVars(colors, radius, shadows, typography, spacing);

  return {
    effectiveMode,
    colors,
    radius,
    shadows,
    typography,
    spacing,
    cssVars,
  };
}

/**
 * Quick derive for just colors (used in preset preview)
 */
export function derivePreviewColors(primaryHex: string, mode: 'light' | 'dark'): {
  primary: string;
  background: string;
  foreground: string;
} {
  const primaryOklch = parseToOklch(primaryHex);
  if (!primaryOklch) {
    return {
      primary: primaryHex,
      background: mode === 'light' ? '#ffffff' : '#0a0a0a',
      foreground: mode === 'light' ? '#0a0a0a' : '#fafafa',
    };
  }

  const primary = mode === 'light'
    ? clampOklch({ l: Math.max(0.3, Math.min(0.7, primaryOklch.l)), c: primaryOklch.c, h: primaryOklch.h })
    : clampOklch({ l: Math.max(0.5, Math.min(0.8, primaryOklch.l + 0.1)), c: primaryOklch.c * 0.9, h: primaryOklch.h });

  return {
    primary: oklchToCss(primary),
    background: mode === 'light' ? 'oklch(1 0 0)' : 'oklch(0.141 0.005 286)',
    foreground: mode === 'light' ? 'oklch(0.141 0.005 286)' : 'oklch(0.985 0 0)',
  };
}
