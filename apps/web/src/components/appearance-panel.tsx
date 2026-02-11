'use client';

/**
 * Appearance Settings Panel
 * 
 * UI for customizing theme preferences.
 * Respects plan tier access controls.
 * 
 * @see docs/planning/32_THEME_SYSTEM.md Section 8
 */

import * as React from 'react';
import { useTheme } from '@/components/theme-provider';
import { 
  getAccessiblePresets, 
  getCapabilities, 
  getCategoryName,
  getCategories,
  ALL_PRESETS,
} from '@hsafx/theme';
import type { ThemePreset, ContrastLevel, NeutralBias, FontOption } from '@hsafx/theme';

/**
 * Mode Toggle Button
 */
function ModeToggle() {
  const { effectiveMode, setMode, intent, mounted } = useTheme();

  if (!mounted) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  const modes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ] as const;

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setMode(mode.value)}
          className={`
            flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${intent.mode === mode.value 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <span className="mr-1.5">{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Preset Swatch
 */
function PresetSwatch({ 
  preset, 
  selected, 
  locked = false,
  onClick 
}: { 
  preset: ThemePreset; 
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`
        group relative h-12 w-12 rounded-lg border-2 transition-all
        ${selected 
          ? 'border-primary ring-2 ring-primary ring-offset-2' 
          : 'border-transparent hover:border-border'
        }
        ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      title={`${preset.name}${locked ? ' (Upgrade required)' : ''}`}
    >
      <div 
        className="h-full w-full rounded-md"
        style={{ background: preset.preview.primary }}
      />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
          <span className="text-sm">🔒</span>
        </div>
      )}
    </button>
  );
}

/**
 * Preset Category Section
 */
function PresetCategory({ 
  category, 
  presets, 
  selectedPreset, 
  accessibleIds,
  onSelect 
}: {
  category: string;
  presets: ThemePreset[];
  selectedPreset: string | null;
  accessibleIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {getCategoryName(category as 'default' | 'flags' | 'stylized')}
      </h4>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <PresetSwatch
            key={preset.id}
            preset={preset}
            selected={selectedPreset === preset.id}
            locked={!accessibleIds.has(preset.id)}
            onClick={() => onSelect(preset.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Slider Control
 */
function SliderControl({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.1,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

/**
 * Select Control
 */
function SelectControl<T extends string>({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Feature Lock Badge
 */
function FeatureLockBadge({ requiredTier }: { requiredTier: string }) {
  return (
    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
      {requiredTier}+
    </span>
  );
}

/**
 * Main Appearance Panel Component
 */
export function AppearancePanel() {
  const { intent, updateIntent, applyPresetById, tier, mounted } = useTheme();
  const capabilities = React.useMemo(() => getCapabilities(tier), [tier]);
  const accessiblePresets = React.useMemo(() => getAccessiblePresets(tier), [tier]);
  const accessibleIds = React.useMemo(
    () => new Set(accessiblePresets.map((p) => p.id)),
    [accessiblePresets]
  );

  // Group presets by category
  const presetsByCategory = React.useMemo(() => {
    const grouped: Record<string, ThemePreset[]> = {};
    for (const preset of ALL_PRESETS) {
      const category = preset.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(preset);
    }
    return grouped;
  }, []);

  const handlePresetSelect = (presetId: string) => {
    if (accessibleIds.has(presetId)) {
      applyPresetById(presetId);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 p-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Mode Selection */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <ModeToggle />
      </section>

      {/* Color Presets */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Color Theme</h3>
        {getCategories().map((category) => {
          const presets = presetsByCategory[category];
          if (!presets || presets.length === 0) return null;
          
          return (
            <PresetCategory
              key={category}
              category={category}
              presets={presets}
              selectedPreset={intent.preset}
              accessibleIds={accessibleIds}
              onSelect={handlePresetSelect}
            />
          );
        })}
      </section>

      {/* Shape & Radius */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Roundness</h3>
          {!capabilities.canCustomizeRoundness && (
            <FeatureLockBadge requiredTier="Pro" />
          )}
        </div>
        <SliderControl
          label="Border Radius"
          value={intent.shape.roundness}
          min={0}
          max={1}
          step={0.05}
          disabled={!capabilities.canCustomizeRoundness}
          onChange={(roundness) => updateIntent({ shape: { roundness } })}
        />
      </section>

      {/* Contrast */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Contrast</h3>
          {!capabilities.canAdjustContrast && (
            <FeatureLockBadge requiredTier="Pro" />
          )}
        </div>
        <SelectControl<ContrastLevel>
          label="Level"
          value={intent.surface.contrast}
          options={[
            { value: 'soft', label: 'Soft' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          disabled={!capabilities.canAdjustContrast}
          onChange={(contrast) => 
            updateIntent({ surface: { ...intent.surface, contrast } })
          }
        />
      </section>

      {/* Neutral Bias */}
      {capabilities.canAdjustNeutralBias && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Neutral Tone</h3>
          <SelectControl<NeutralBias>
            label="Bias"
            value={intent.surface.neutralBias}
            options={[
              { value: 'warm', label: 'Warm' },
              { value: 'cool', label: 'Cool' },
              { value: 'true', label: 'True Gray' },
            ]}
            onChange={(neutralBias) =>
              updateIntent({ surface: { ...intent.surface, neutralBias } })
            }
          />
        </section>
      )}

      {/* Shadows */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Shadows</h3>
          {!capabilities.canCustomizeShadows && (
            <FeatureLockBadge requiredTier="Teams" />
          )}
        </div>
        <SliderControl
          label="Intensity"
          value={intent.elevation.intensity}
          disabled={!capabilities.canCustomizeShadows}
          onChange={(intensity) =>
            updateIntent({ elevation: { ...intent.elevation, intensity } })
          }
        />
        <SliderControl
          label="Softness"
          value={intent.elevation.softness}
          disabled={!capabilities.canCustomizeShadows}
          onChange={(softness) =>
            updateIntent({ elevation: { ...intent.elevation, softness } })
          }
        />
      </section>

      {/* Typography */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Typography</h3>
          {!capabilities.canSelectFonts && (
            <FeatureLockBadge requiredTier="Pro" />
          )}
        </div>
        <SelectControl<FontOption>
          label="Font Family"
          value={intent.typography.font}
          options={capabilities.availableFonts.map((font) => ({
            value: font,
            label: font.charAt(0).toUpperCase() + font.slice(1).replace('-', ' '),
          }))}
          disabled={!capabilities.canSelectFonts}
          onChange={(font) =>
            updateIntent({ typography: { ...intent.typography, font } })
          }
        />
      </section>

      {/* Spacing Density */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Spacing</h3>
          {!capabilities.canAdjustSpacing && (
            <FeatureLockBadge requiredTier="Pro" />
          )}
        </div>
        <SliderControl
          label="Density"
          value={intent.spacing.density}
          min={0.75}
          max={1.25}
          step={0.05}
          disabled={!capabilities.canAdjustSpacing}
          onChange={(density) => updateIntent({ spacing: { density } })}
        />
      </section>

      {/* Reset Button */}
      <section className="pt-4 border-t">
        <button
          onClick={() => applyPresetById('default')}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Reset to Default
        </button>
      </section>
    </div>
  );
}

/**
 * Compact Mode Toggle (for header/toolbar use)
 */
export function CompactModeToggle() {
  const { effectiveMode, toggleMode, mounted } = useTheme();

  if (!mounted) {
    return <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <button
      onClick={toggleMode}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition-colors"
      title={`Switch to ${effectiveMode === 'light' ? 'dark' : 'light'} mode`}
    >
      {effectiveMode === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
