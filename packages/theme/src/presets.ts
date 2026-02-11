/**
 * Theme Presets Registry
 * 
 * Collection of curated presets organized by category.
 * Each preset defines partial ThemeIntent overrides.
 * 
 * @see docs/planning/33_THEME_PRESETS.md
 */

import type { ThemePreset, ThemeIntent, PlanTier, PresetCategory } from './types';

// ==========================================
// DEFAULT PRESET (System Base)
// ==========================================

export const DEFAULT_INTENT: ThemeIntent = {
  version: 1,
  brand: {
    primary: 'oklch(0.21 0.006 285.75)', // Neutral zinc
  },
  surface: {
    contrast: 'medium',
    neutralBias: 'cool',
  },
  mode: 'system',
  typography: {
    font: 'system',
    scale: 1.0,
    letterSpacing: 0,
  },
  shape: {
    roundness: 0.625, // --radius: 0.625rem per spec
  },
  elevation: {
    intensity: 0.5,
    softness: 0.5,
  },
  spacing: {
    density: 1.0,
  },
  preset: null,
};

// ==========================================
// PRIMARY COLOR PRESETS
// ==========================================

export const PRIMARY_COLOR_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    category: 'default',
    description: 'Clean neutral palette',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.21 0.006 285.75)' },
    },
    preview: {
      primary: 'oklch(0.21 0.006 285.75)',
    },
  },
  {
    id: 'red',
    name: 'Red',
    category: 'default',
    description: 'Bold red accent',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.637 0.237 25.33)' },
    },
    preview: {
      primary: 'oklch(0.637 0.237 25.33)',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    category: 'default',
    description: 'Soft pink-red',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.645 0.246 16.44)' },
    },
    preview: {
      primary: 'oklch(0.645 0.246 16.44)',
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    category: 'default',
    description: 'Warm orange',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.705 0.213 47.60)' },
    },
    preview: {
      primary: 'oklch(0.705 0.213 47.60)',
    },
  },
  {
    id: 'green',
    name: 'Green',
    category: 'default',
    description: 'Fresh green',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.723 0.219 149.58)' },
    },
    preview: {
      primary: 'oklch(0.723 0.219 149.58)',
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    category: 'default',
    description: 'Classic blue',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.623 0.214 259.82)' },
    },
    preview: {
      primary: 'oklch(0.623 0.214 259.82)',
    },
  },
  {
    id: 'yellow',
    name: 'Yellow',
    category: 'default',
    description: 'Bright yellow',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.795 0.184 86.05)' },
    },
    preview: {
      primary: 'oklch(0.795 0.184 86.05)',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    category: 'default',
    description: 'Deep violet',
    minTier: 'free',
    intent: {
      brand: { primary: 'oklch(0.606 0.25 292.72)' },
    },
    preview: {
      primary: 'oklch(0.606 0.25 292.72)',
    },
  },
];

// ==========================================
// FLAG-INSPIRED PRESETS (pro tier)
// ==========================================

export const FLAG_PRESETS: ThemePreset[] = [
  {
    id: 'flag-japan',
    name: 'Japan',
    category: 'flags',
    description: 'Inspired by Japanese flag',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.58 0.22 27)' }, // Crimson red
      surface: { contrast: 'medium', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.58 0.22 27)',
    },
  },
  {
    id: 'flag-usa',
    name: 'United States',
    category: 'flags',
    description: 'Old Glory red, white, blue',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.45 0.19 260)' }, // Navy blue
      surface: { contrast: 'high', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.45 0.19 260)',
    },
  },
  {
    id: 'flag-uk',
    name: 'United Kingdom',
    category: 'flags',
    description: 'Union Jack colors',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.35 0.2 264)' }, // Royal blue
      surface: { contrast: 'medium', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.35 0.2 264)',
    },
  },
  {
    id: 'flag-france',
    name: 'France',
    category: 'flags',
    description: 'Tricolore inspired',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.42 0.2 264)' }, // French blue
      surface: { contrast: 'medium', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.42 0.2 264)',
    },
  },
  {
    id: 'flag-germany',
    name: 'Germany',
    category: 'flags',
    description: 'Black, red, gold',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.55 0.22 35)' }, // German red
      surface: { contrast: 'high', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.55 0.22 35)',
    },
  },
  {
    id: 'flag-brazil',
    name: 'Brazil',
    category: 'flags',
    description: 'Verde e amarelo',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.65 0.2 145)' }, // Brazilian green
      surface: { contrast: 'medium', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.65 0.2 145)',
    },
  },
  {
    id: 'flag-italy',
    name: 'Italy',
    category: 'flags',
    description: 'Il Tricolore',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.55 0.2 145)' }, // Italian green
      surface: { contrast: 'soft', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.55 0.2 145)',
    },
  },
  {
    id: 'flag-spain',
    name: 'Spain',
    category: 'flags',
    description: 'La Rojigualda',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.7 0.2 65)' }, // Spanish gold
      surface: { contrast: 'high', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.7 0.2 65)',
    },
  },
  {
    id: 'flag-india',
    name: 'India',
    category: 'flags',
    description: 'Tiranga saffron',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.7 0.2 50)' }, // Indian saffron
      surface: { contrast: 'medium', neutralBias: 'warm' },
    },
    preview: {
      primary: 'oklch(0.7 0.2 50)',
    },
  },
  {
    id: 'flag-saudi',
    name: 'Saudi Arabia',
    category: 'flags',
    description: 'Kingdom green',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.5 0.18 150)' }, // Saudi green
      surface: { contrast: 'high', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.5 0.18 150)',
    },
  },
  {
    id: 'flag-uae',
    name: 'United Arab Emirates',
    category: 'flags',
    description: 'Emirates colors',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.55 0.2 145)' }, // UAE green
      surface: { contrast: 'medium', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.55 0.2 145)',
    },
  },
  {
    id: 'flag-australia',
    name: 'Australia',
    category: 'flags',
    description: 'Southern Cross blue',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.35 0.2 253)' }, // Australian blue
      surface: { contrast: 'medium', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.35 0.2 253)',
    },
  },
  {
    id: 'flag-canada',
    name: 'Canada',
    category: 'flags',
    description: 'Maple leaf red',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.55 0.22 27)' }, // Canadian red
      surface: { contrast: 'high', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.55 0.22 27)',
    },
  },
  {
    id: 'flag-south-korea',
    name: 'South Korea',
    category: 'flags',
    description: 'Taegukgi inspired',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.55 0.22 27)' }, // Korean red
      surface: { contrast: 'high', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.55 0.22 27)',
    },
  },
  {
    id: 'flag-pakistan',
    name: 'Pakistan',
    category: 'flags',
    description: 'Pakistan green',
    minTier: 'pro',
    intent: {
      brand: { primary: 'oklch(0.45 0.18 155)' }, // Pakistan green
      surface: { contrast: 'medium', neutralBias: 'cool' },
    },
    preview: {
      primary: 'oklch(0.45 0.18 155)',
    },
  },
];

// ==========================================
// STYLIZED PRESETS (advance tier)
// ==========================================

export const STYLIZED_PRESETS: ThemePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'stylized',
    description: 'Neon-drenched futuristic aesthetic',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.7 0.25 330)' }, // Hot magenta
      surface: { contrast: 'high', neutralBias: 'cool' },
      shape: { roundness: 0.2 },
      elevation: { intensity: 0.9, softness: 0.3 },
    },
    preview: {
      primary: 'oklch(0.7 0.25 330)',
    },
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'stylized',
    description: 'Warm, thoughtful, Anthropic-inspired',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.7 0.15 50)' }, // Warm terracotta
      surface: { contrast: 'soft', neutralBias: 'warm' },
      shape: { roundness: 0.75 },
      elevation: { intensity: 0.3, softness: 0.7 },
    },
    preview: {
      primary: 'oklch(0.7 0.15 50)',
    },
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    category: 'stylized',
    description: '80s arcade game nostalgia',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.8 0.25 140)' }, // Electric green
      surface: { contrast: 'high', neutralBias: 'cool' },
      shape: { roundness: 0.1 },
      elevation: { intensity: 0.7, softness: 0.2 },
      typography: { font: 'space-grotesk', scale: 1.1, letterSpacing: 0.05 },
    },
    preview: {
      primary: 'oklch(0.8 0.25 140)',
    },
  },
  {
    id: 'neo-brutalism',
    name: 'Neo Brutalism',
    category: 'stylized',
    description: 'Bold, stark, no-nonsense design',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.6 0.27 60)' }, // High-contrast yellow-orange
      surface: { contrast: 'high', neutralBias: 'true' },
      shape: { roundness: 0 },
      elevation: { intensity: 1.0, softness: 0 },
    },
    preview: {
      primary: 'oklch(0.6 0.27 60)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    category: 'stylized',
    description: 'Deep woodland greens',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.5 0.15 150)' }, // Forest green
      surface: { contrast: 'soft', neutralBias: 'warm' },
      shape: { roundness: 0.6 },
      elevation: { intensity: 0.4, softness: 0.6 },
    },
    preview: {
      primary: 'oklch(0.5 0.15 150)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    category: 'stylized',
    description: 'Deep sea blues and teals',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.55 0.18 220)' }, // Deep ocean blue
      surface: { contrast: 'medium', neutralBias: 'cool' },
      shape: { roundness: 0.7 },
      elevation: { intensity: 0.5, softness: 0.8 },
    },
    preview: {
      primary: 'oklch(0.55 0.18 220)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    category: 'stylized',
    description: 'Warm gradient inspiration',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.68 0.22 35)' }, // Sunset orange-red
      surface: { contrast: 'soft', neutralBias: 'warm' },
      shape: { roundness: 0.8 },
      elevation: { intensity: 0.4, softness: 0.7 },
    },
    preview: {
      primary: 'oklch(0.68 0.22 35)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    category: 'stylized',
    description: 'Deep dark purple nights',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.45 0.2 290)' }, // Midnight purple
      surface: { contrast: 'medium', neutralBias: 'cool' },
      shape: { roundness: 0.5 },
      elevation: { intensity: 0.6, softness: 0.5 },
    },
    preview: {
      primary: 'oklch(0.45 0.2 290)',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    category: 'stylized',
    description: 'Pure black and white',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.2 0 0)' }, // Pure black
      surface: { contrast: 'high', neutralBias: 'true' },
      shape: { roundness: 0.3 },
      elevation: { intensity: 0.3, softness: 0.4 },
    },
    preview: {
      primary: 'oklch(0.2 0 0)',
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'stylized',
    description: '80s electronic music vibes',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.65 0.28 310)' }, // Synthwave pink
      surface: { contrast: 'high', neutralBias: 'cool' },
      shape: { roundness: 0.4 },
      elevation: { intensity: 0.8, softness: 0.3 },
    },
    preview: {
      primary: 'oklch(0.65 0.28 310)',
    },
  },
  {
    id: 'coffee',
    name: 'Coffee',
    category: 'stylized',
    description: 'Warm coffee shop aesthetic',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.5 0.12 55)' }, // Coffee brown
      surface: { contrast: 'soft', neutralBias: 'warm' },
      shape: { roundness: 0.6 },
      elevation: { intensity: 0.4, softness: 0.6 },
    },
    preview: {
      primary: 'oklch(0.5 0.12 55)',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'stylized',
    description: 'Soft calming purple',
    minTier: 'advance',
    intent: {
      brand: { primary: 'oklch(0.7 0.15 300)' }, // Soft lavender
      surface: { contrast: 'soft', neutralBias: 'cool' },
      shape: { roundness: 0.8 },
      elevation: { intensity: 0.3, softness: 0.8 },
    },
    preview: {
      primary: 'oklch(0.7 0.15 300)',
    },
  },
];

// ==========================================
// ALL PRESETS COMBINED
// ==========================================

export const ALL_PRESETS: ThemePreset[] = [
  ...PRIMARY_COLOR_PRESETS,
  ...FLAG_PRESETS,
  ...STYLIZED_PRESETS,
];

// ==========================================
// PRESET REGISTRY & ACCESS HELPERS
// ==========================================

/**
 * Get a preset by ID
 */
export function getPreset(id: string): ThemePreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

/**
 * Get all presets in a category
 */
export function getPresetsByCategory(category: PresetCategory): ThemePreset[] {
  return ALL_PRESETS.filter((p) => p.category === category);
}

/**
 * Get presets available for a given plan tier
 */
export function getPresetsForTier(tier: PlanTier): ThemePreset[] {
  const tierOrder: Record<PlanTier, number> = {
    guest: 0,
    free: 1,
    pro: 2,
    advance: 3,
  };

  const userTierLevel = tierOrder[tier];

  return ALL_PRESETS.filter((preset) => {
    const presetTierLevel = tierOrder[preset.minTier];
    return presetTierLevel <= userTierLevel;
  });
}

/**
 * Check if a preset is available for a given tier
 */
export function canAccessPreset(presetId: string, tier: PlanTier): boolean {
  const preset = getPreset(presetId);
  if (!preset) return false;

  const tierOrder: Record<PlanTier, number> = {
    guest: 0,
    free: 1,
    pro: 2,
    advance: 3,
  };

  return tierOrder[tier] >= tierOrder[preset.minTier];
}

/**
 * Merge a preset's partial intent with the default intent
 */
export function applyPreset(presetId: string): ThemeIntent {
  const preset = getPreset(presetId);
  if (!preset) {
    return { ...DEFAULT_INTENT };
  }

  return mergeIntent(DEFAULT_INTENT, preset.intent);
}

/**
 * Deep merge two ThemeIntent objects
 */
export function mergeIntent(
  base: ThemeIntent,
  override: Partial<ThemeIntent>
): ThemeIntent {
  return {
    version: override.version ?? base.version,
    brand: { ...base.brand, ...override.brand },
    surface: { ...base.surface, ...override.surface },
    mode: override.mode ?? base.mode,
    typography: { ...base.typography, ...override.typography },
    shape: { ...base.shape, ...override.shape },
    elevation: { ...base.elevation, ...override.elevation },
    spacing: { ...base.spacing, ...override.spacing },
    preset: override.preset !== undefined ? override.preset : base.preset,
  };
}

/**
 * Get all unique categories
 */
export function getCategories(): PresetCategory[] {
  return ['default', 'flags', 'stylized'];
}

/**
 * Get category display names
 */
export function getCategoryName(category: PresetCategory): string {
  const names: Record<PresetCategory, string> = {
    default: 'Colors',
    flags: 'Flag-Inspired',
    stylized: 'Stylized',
  };
  return names[category];
}

/**
 * Get tier display names
 */
export function getTierName(tier: PlanTier): string {
  const names: Record<PlanTier, string> = {
    guest: 'Guest',
    free: 'Free',
    pro: 'Pro',
    advance: 'Advance',
  };
  return names[tier];
}
