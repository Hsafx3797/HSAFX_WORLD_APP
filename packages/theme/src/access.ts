/**
 * Theme Access Control
 * 
 * Plan-based access control for theme features and presets.
 * Defines feature gates per plan tier.
 * 
 * @see docs/planning/32_THEME_SYSTEM.md Section 5
 */

import type { PlanTier, ThemePreset, FontOption, ThemeIntent } from './types';
import { canAccessPreset, getPresetsForTier } from './presets';

/**
 * Theme feature capabilities by plan tier
 */
export interface ThemeCapabilities {
  /** Can change the primary brand color */
  canChangePrimaryColor: boolean;
  /** Can use custom color picker (vs preset selection only) */
  canUseCustomColorPicker: boolean;
  /** Can toggle light/dark/system mode */
  canChangeMode: boolean;
  /** Can customize roundness slider */
  canCustomizeRoundness: boolean;
  /** Can customize shadow intensity/softness */
  canCustomizeShadows: boolean;
  /** Can select fonts */
  canSelectFonts: boolean;
  /** Available font options */
  availableFonts: FontOption[];
  /** Can adjust spacing density */
  canAdjustSpacing: boolean;
  /** Can adjust contrast level */
  canAdjustContrast: boolean;
  /** Can adjust neutral bias */
  canAdjustNeutralBias: boolean;
  /** Can save as custom preset (teams+ only) */
  canSaveCustomPreset: boolean;
  /** Maximum custom presets allowed */
  maxCustomPresets: number;
  /** Can access preset categories */
  accessibleCategories: ('default' | 'flags' | 'stylized')[];
}

/**
 * Get theme capabilities for a plan tier
 */
export function getCapabilities(tier: PlanTier): ThemeCapabilities {
  switch (tier) {
    case 'guest':
      return {
        canChangePrimaryColor: false,
        canUseCustomColorPicker: false,
        canChangeMode: true,
        canCustomizeRoundness: false,
        canCustomizeShadows: false,
        canSelectFonts: false,
        availableFonts: ['system'],
        canAdjustSpacing: false,
        canAdjustContrast: false,
        canAdjustNeutralBias: false,
        canSaveCustomPreset: false,
        maxCustomPresets: 0,
        accessibleCategories: ['default'],
      };

    case 'free':
      return {
        canChangePrimaryColor: true,
        canUseCustomColorPicker: false,
        canChangeMode: true,
        canCustomizeRoundness: false,
        canCustomizeShadows: false,
        canSelectFonts: false,
        availableFonts: ['system'],
        canAdjustSpacing: false,
        canAdjustContrast: false,
        canAdjustNeutralBias: false,
        canSaveCustomPreset: false,
        maxCustomPresets: 0,
        accessibleCategories: ['default'],
      };

    case 'pro':
      return {
        canChangePrimaryColor: true,
        canUseCustomColorPicker: true,
        canChangeMode: true,
        canCustomizeRoundness: true,
        canCustomizeShadows: false,
        canSelectFonts: true,
        availableFonts: ['system', 'inter', 'geist'],
        canAdjustSpacing: true,
        canAdjustContrast: true,
        canAdjustNeutralBias: false,
        canSaveCustomPreset: false,
        maxCustomPresets: 0,
        accessibleCategories: ['default', 'flags'],
      };

    case 'advance':
      return {
        canChangePrimaryColor: true,
        canUseCustomColorPicker: true,
        canChangeMode: true,
        canCustomizeRoundness: true,
        canCustomizeShadows: true,
        canSelectFonts: true,
        availableFonts: ['system', 'inter', 'geist', 'space-grotesk'],
        canAdjustSpacing: true,
        canAdjustContrast: true,
        canAdjustNeutralBias: true,
        canSaveCustomPreset: true,
        maxCustomPresets: 20,
        accessibleCategories: ['default', 'flags', 'stylized'],
      };

    default:
      // Default to guest tier
      return getCapabilities('guest');
  }
}

/**
 * Check if a specific feature is available for a tier
 */
export function hasFeature(
  tier: PlanTier,
  feature: keyof Omit<ThemeCapabilities, 'availableFonts' | 'maxCustomPresets' | 'accessibleCategories'>
): boolean {
  const capabilities = getCapabilities(tier);
  return capabilities[feature] as boolean;
}

/**
 * Get all accessible presets for a tier (filtered by category access)
 */
export function getAccessiblePresets(tier: PlanTier): ThemePreset[] {
  const capabilities = getCapabilities(tier);
  const availablePresets = getPresetsForTier(tier);

  return availablePresets.filter(
    (preset) => capabilities.accessibleCategories.includes(preset.category)
  );
}

/**
 * Get upgrade suggestion for a locked feature
 */
export function getUpgradeSuggestion(
  currentTier: PlanTier,
  feature: keyof ThemeCapabilities
): { requiredTier: PlanTier; message: string } | null {
  const tierOrder: PlanTier[] = ['guest', 'free', 'pro', 'advance'];
  const currentIndex = tierOrder.indexOf(currentTier);

  // Check each higher tier for this feature
  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const tier = tierOrder[i]!; // Non-null as we're iterating within bounds
    const capabilities = getCapabilities(tier);

    // Handle boolean features
    if (typeof capabilities[feature] === 'boolean' && capabilities[feature]) {
      return {
        requiredTier: tier,
        message: getUpgradeMessage(tier, feature),
      };
    }

    // Handle array and numeric features
    if (feature === 'availableFonts' && (capabilities.availableFonts as string[]).length > 1) {
      return {
        requiredTier: tier,
        message: getUpgradeMessage(tier, feature),
      };
    }

    if (feature === 'maxCustomPresets' && capabilities.maxCustomPresets > 0) {
      return {
        requiredTier: tier,
        message: getUpgradeMessage(tier, feature),
      };
    }

    if (feature === 'accessibleCategories' && capabilities.accessibleCategories.length > 1) {
      return {
        requiredTier: tier,
        message: getUpgradeMessage(tier, feature),
      };
    }
  }

  return null;
}

/**
 * Get human-readable upgrade message
 */
function getUpgradeMessage(tier: PlanTier, feature: keyof ThemeCapabilities): string {
  const tierNames: Record<PlanTier, string> = {
    guest: 'Guest',
    free: 'Free',
    pro: 'Pro',
    advance: 'Advance',
  };

  const featureNames: Record<keyof ThemeCapabilities, string> = {
    canChangePrimaryColor: 'custom primary colors',
    canUseCustomColorPicker: 'the color picker',
    canChangeMode: 'theme mode switching',
    canCustomizeRoundness: 'roundness customization',
    canCustomizeShadows: 'shadow customization',
    canSelectFonts: 'font selection',
    availableFonts: 'additional fonts',
    canAdjustSpacing: 'spacing adjustment',
    canAdjustContrast: 'contrast adjustment',
    canAdjustNeutralBias: 'neutral bias customization',
    canSaveCustomPreset: 'save custom presets',
    maxCustomPresets: 'additional custom presets',
    accessibleCategories: 'additional preset categories',
  };

  return `Upgrade to ${tierNames[tier]} to unlock ${featureNames[feature]}`;
}

/**
 * Check if user can perform a theme action
 */
export function canPerformAction(
  tier: PlanTier,
  action: 'selectPreset' | 'customizeColor' | 'savePreset' | 'changeMode',
  context?: { presetId?: string; currentCustomPresets?: number }
): { allowed: boolean; reason?: string } {
  const capabilities = getCapabilities(tier);

  switch (action) {
    case 'selectPreset':
      if (context?.presetId && !canAccessPreset(context.presetId, tier)) {
        return {
          allowed: false,
          reason: 'This preset requires a higher plan tier',
        };
      }
      return { allowed: true };

    case 'customizeColor':
      if (!capabilities.canUseCustomColorPicker) {
        return {
          allowed: false,
          reason: 'Custom color picker is not available on your plan',
        };
      }
      return { allowed: true };

    case 'savePreset':
      if (!capabilities.canSaveCustomPreset) {
        return {
          allowed: false,
          reason: 'Saving custom presets requires an Advance plan',
        };
      }
      if (
        context?.currentCustomPresets !== undefined &&
        context.currentCustomPresets >= capabilities.maxCustomPresets
      ) {
        return {
          allowed: false,
          reason: `You have reached the maximum of ${capabilities.maxCustomPresets} custom presets`,
        };
      }
      return { allowed: true };

    case 'changeMode':
      if (!capabilities.canChangeMode) {
        return {
          allowed: false,
          reason: 'Mode switching is not available on your plan',
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

/**
 * Filter theme intent to only include features allowed by tier
 */
export function filterIntentByTier(
  intent: ThemeIntent,
  tier: PlanTier
): ThemeIntent {
  const capabilities = getCapabilities(tier);
  const filtered: ThemeIntent = { ...intent };

  // For free tier, reset advanced options to defaults
  if (!capabilities.canCustomizeRoundness) {
    filtered.shape = { roundness: 0.625 };
  }

  if (!capabilities.canCustomizeShadows) {
    filtered.elevation = { intensity: 0.5, softness: 0.5 };
  }

  if (!capabilities.canAdjustSpacing) {
    filtered.spacing = { density: 1.0 };
  }

  if (!capabilities.canAdjustContrast) {
    filtered.surface = { ...filtered.surface, contrast: 'medium' };
  }

  if (!capabilities.canAdjustNeutralBias) {
    filtered.surface = { ...filtered.surface, neutralBias: 'cool' };
  }

  if (!capabilities.canSelectFonts) {
    filtered.typography = { ...filtered.typography, font: 'system' };
  }

  return filtered;
}
