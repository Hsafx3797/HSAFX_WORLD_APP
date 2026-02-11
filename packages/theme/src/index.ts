/**
 * Theme System
 * 
 * Intent-driven theming with WCAG-compliant color derivation.
 * 
 * @example
 * ```tsx
 * import { ThemeProvider, useTheme, deriveTheme } from '@/lib/theme';
 * 
 * // Get current theme intent
 * const { intent, setIntent, resolvedTheme } = useTheme();
 * 
 * // Apply a preset
 * setIntent(applyPreset('cyberpunk'));
 * 
 * // Manually derive theme from intent
 * const theme = deriveTheme(intent);
 * ```
 */

// Types
export type {
  ThemeIntent,
  ResolvedTheme,
  ResolvedColors,
  ResolvedRadius,
  ResolvedShadows,
  ResolvedTypography,
  ThemePreset,
  OklchColor,
  FontOption,
  ContrastLevel,
  NeutralBias,
  ColorMode,
  PresetCategory,
  PlanTier,
} from './types';

// Derivation Engine
export {
  deriveTheme,
  deriveColors,
  deriveRadius,
  deriveShadows,
  deriveTypography,
  resolveColorMode,
  themeToCssVars,
  derivePreviewColors,
} from './derive';

// Presets
export {
  DEFAULT_INTENT,
  ALL_PRESETS,
  PRIMARY_COLOR_PRESETS,
  FLAG_PRESETS,
  STYLIZED_PRESETS,
  getPreset,
  getPresetsByCategory,
  getPresetsForTier,
  canAccessPreset,
  applyPreset,
  mergeIntent,
  getCategories,
  getCategoryName,
  getTierName,
} from './presets';

// Access Control
export {
  getCapabilities,
  hasFeature,
  getAccessiblePresets,
  getUpgradeSuggestion,
  canPerformAction,
  filterIntentByTier,
} from './access';
export type { ThemeCapabilities } from './access';

// Utils
export {
  parseToOklch,
  createOklch,
  oklchToCss,
  clampOklch,
  getContrastRatio,
  ensureContrast,
  adjustLightness,
  adjustChroma,
  generateChartPalette,
  OKLCH_COLORS,
} from './utils';
