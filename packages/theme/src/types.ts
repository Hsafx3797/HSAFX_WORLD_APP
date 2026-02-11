/**
 * Theme System Types
 * 
 * This file defines the TypeScript interfaces for the intent-driven theme system.
 * Users express preferences through ThemeIntent; the system derives CSS variables.
 * 
 * @see docs/planning/32_THEME_SYSTEM.md
 */

/**
 * Surface contrast levels affecting overall UI lightness/darkness contrast
 */
export type SurfaceContrast = 'soft' | 'medium' | 'high';

/**
 * Neutral bias affecting the warmth/coolness of gray tones
 */
export type NeutralBias = 'warm' | 'cool' | 'true';

/**
 * Color mode preference
 */
export type ColorMode = 'light' | 'dark' | 'system';

/**
 * Available font family presets
 */
export type FontFamily = 'system' | 'geist' | 'inter' | 'space-grotesk';

/**
 * Preset categories for access control
 */
export type PresetCategory = 'default' | 'flags' | 'stylized';

/**
 * User subscription plan levels
 */
export type PlanTier = 'guest' | 'free' | 'pro' | 'advance';

/**
 * Font option type
 */
export type FontOption = 'system' | 'inter' | 'geist' | 'space-grotesk';

/**
 * Contrast level type (alias)
 */
export type ContrastLevel = SurfaceContrast;

/**
 * User Intent Layer - What users CAN control
 * 
 * This is the only editable layer in the theme pipeline.
 * All other tokens are derived from these intent values.
 */
export interface ThemeIntent {
  /** Schema version for forward compatibility */
  version: 1;

  /** Brand color intent */
  brand: {
    /** Primary brand color in HEX format (e.g., "#3b82f6") */
    primary: string;
    /** Optional accent color override */
    accent?: string;
    /** Optional destructive/danger color override */
    danger?: string;
  };

  /** Surface appearance intent */
  surface: {
    /** Overall contrast level */
    contrast: SurfaceContrast;
    /** Gray tone bias (warm, cool, or true neutral) */
    neutralBias: NeutralBias;
  };

  /** Color mode preference */
  mode: ColorMode;

  /** Typography intent */
  typography: {
    /** Font family preset */
    font: FontFamily;
    /** Font size scale multiplier (0.9 → 1.1) */
    scale: number;
    /** Letter spacing in em units (-0.01 → 0.05) */
    letterSpacing: number;
  };

  /** Shape intent */
  shape: {
    /** Corner roundness (0 = sharp, 1 = pill) */
    roundness: number;
  };

  /** Elevation/shadow intent */
  elevation: {
    /** Shadow strength (0 → 1) */
    intensity: number;
    /** Shadow blur/softness (0 → 1) */
    softness: number;
  };

  /** Spacing/density intent */
  spacing: {
    /** UI density multiplier (0.8 = compact, 1.0 = normal, 1.2 = spacious) */
    density: number;
  };

  /** Optional preset reference (null = custom, string = preset ID) */
  preset: string | null;
}

/**
 * Resolved color tokens in CSS-compatible format (OKLCH strings)
 */
export interface ResolvedColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

/**
 * Resolved radius tokens
 */
export interface ResolvedRadius {
  radius: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
}

/**
 * Resolved shadow tokens
 */
export interface ResolvedShadows {
  shadowColor: string;
  shadow2xs: string;
  shadowXs: string;
  shadowSm: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadow2xl: string;
}

/**
 * Resolved typography tokens
 */
export interface ResolvedTypography {
  fontSans: string;
  fontMono: string;
  fontSerif: string;
  scale: number;
  letterSpacing: string;
}

/**
 * Complete resolved theme with all derived tokens
 */
export interface ResolvedTheme {
  /** Derived from intent.mode + system preference */
  effectiveMode: 'light' | 'dark';
  /** All resolved color tokens */
  colors: ResolvedColors;
  /** All resolved radius tokens */
  radius: ResolvedRadius;
  /** All resolved shadow tokens */
  shadows: ResolvedShadows;
  /** All resolved typography tokens */
  typography: ResolvedTypography;
  /** Spacing multiplier */
  spacing: number;
  /** CSS variables ready for injection */
  cssVars: Record<string, string>;
}

/**
 * Preset definition with metadata
 */
export interface ThemePreset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category for access control */
  category: PresetCategory;
  /** Minimum plan tier required */
  minTier: PlanTier;
  /** Partial intent values to merge with defaults */
  intent: Partial<ThemeIntent>;
  /** Preview colors for the preset gallery */
  preview: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
}

/**
 * Theme context value exposed by ThemeProvider
 */
export interface ThemeContextValue {
  /** Current user intent */
  intent: ThemeIntent;
  /** Computed resolved theme */
  resolved: ResolvedTheme;
  /** Update part of the intent */
  setIntent: (partial: Partial<ThemeIntent>) => void;
  /** Apply a preset by ID */
  applyPreset: (presetId: string) => void;
  /** Reset to default preset */
  reset: () => void;
  /** Whether theme is loading */
  isLoading: boolean;
  /** Available presets for current plan */
  availablePresets: ThemePreset[];
  /** Whether user can customize primary color */
  canCustomizePrimary: boolean;
  /** Whether user can access advanced controls */
  canCustomizeAdvanced: boolean;
}

/**
 * OKLCH color representation for internal use
 */
export interface OklchColor {
  /** Lightness (0-1) */
  l: number;
  /** Chroma (0-0.4) */
  c: number;
  /** Hue (0-360) */
  h: number;
  /** Optional alpha (0-1) */
  alpha?: number;
}

/**
 * CSS variable mapping for a single theme mode
 */
export type CSSVariableMap = Record<string, string>;

/**
 * Theme persistence data stored in user_preferences
 */
export interface StoredThemeData {
  theme: ThemeIntent;
  lastUpdated: string;
}

/**
 * Default theme intent values
 */
export const DEFAULT_THEME_INTENT: ThemeIntent = {
  version: 1,
  brand: {
    primary: '#171717',
  },
  surface: {
    contrast: 'medium',
    neutralBias: 'true',
  },
  mode: 'system',
  typography: {
    font: 'system',
    scale: 1,
    letterSpacing: 0,
  },
  shape: {
    roundness: 0.5,
  },
  elevation: {
    intensity: 0.5,
    softness: 0.5,
  },
  spacing: {
    density: 1,
  },
  preset: 'default',
};

/**
 * Theme intent validation constraints
 */
export const THEME_CONSTRAINTS = {
  typography: {
    scale: { min: 0.9, max: 1.1 },
    letterSpacing: { min: -0.01, max: 0.05 },
  },
  shape: {
    roundness: { min: 0, max: 1 },
  },
  elevation: {
    intensity: { min: 0, max: 1 },
    softness: { min: 0, max: 1 },
  },
  spacing: {
    density: { min: 0.8, max: 1.2 },
  },
} as const;
