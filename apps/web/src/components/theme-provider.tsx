'use client';

/**
 * Custom ThemeProvider
 * 
 * Wraps next-themes with intent-based theming.
 * Manages theme intent state and applies derived CSS variables.
 * 
 * @see docs/planning/32_THEME_SYSTEM.md Section 7
 */

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeIntent, ResolvedTheme, PlanTier } from '@hsafx/theme';
import { deriveTheme, resolveColorMode } from '@hsafx/theme';
import { DEFAULT_INTENT, applyPreset, mergeIntent } from '@hsafx/theme';
import { filterIntentByTier } from '@hsafx/theme';

/**
 * Theme context value
 */
export interface ThemeContextValue {
  /** Current theme intent */
  intent: ThemeIntent;
  /** Set entire theme intent */
  setIntent: (intent: ThemeIntent) => void;
  /** Partially update intent */
  updateIntent: (partial: Partial<ThemeIntent>) => void;
  /** Apply a preset by ID */
  applyPresetById: (presetId: string) => void;
  /** Reset to default intent */
  resetIntent: () => void;
  /** Resolved theme (derived from intent) */
  resolvedTheme: ResolvedTheme | null;
  /** Current effective color mode */
  effectiveMode: 'light' | 'dark';
  /** Toggle light/dark mode */
  toggleMode: () => void;
  /** Set specific mode */
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  /** User's plan tier (affects access control) */
  tier: PlanTier;
  /** Set the user's plan tier */
  setTier: (tier: PlanTier) => void;
  /** Is theme system mounted/ready */
  mounted: boolean;
  /** System prefers dark mode */
  systemPrefersDark: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/**
 * Storage key for persisting theme intent
 */
const STORAGE_KEY = 'hsafx-theme-intent';
const TIER_STORAGE_KEY = 'hsafx-user-tier';

/**
 * Load intent from localStorage
 */
function loadStoredIntent(): ThemeIntent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate version
      if (parsed.version === DEFAULT_INTENT.version) {
        return parsed as ThemeIntent;
      }
    }
  } catch {
    // Invalid stored data, ignore
  }
  return null;
}

/**
 * Load tier from localStorage
 */
function loadStoredTier(): PlanTier {
  if (typeof window === 'undefined') return 'free';

  try {
    const stored = localStorage.getItem(TIER_STORAGE_KEY);
    if (stored && ['guest', 'free', 'pro', 'advance'].includes(stored)) {
      return stored as PlanTier;
    }
  } catch {
    // Invalid stored data
  }
  return 'free';
}

/**
 * Save intent to localStorage
 */
function saveIntent(intent: ThemeIntent): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // Storage unavailable
  }
}

/**
 * Save tier to localStorage
 */
function saveTier(tier: PlanTier): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TIER_STORAGE_KEY, tier);
  } catch {
    // Storage unavailable
  }
}

/**
 * Apply CSS variables to document
 */
function applyCssVariables(cssVars: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Mark theme as ready (triggers opacity transition)
  root.setAttribute('data-theme-ready', 'true');
}

interface IntentThemeProviderProps {
  children: React.ReactNode;
  /** Default tier if not stored */
  defaultTier?: PlanTier;
}

/**
 * Internal provider that handles intent state and CSS variable application
 */
function IntentThemeProvider({ children, defaultTier = 'free' }: IntentThemeProviderProps) {
  const { theme, setTheme, resolvedTheme: nextResolvedTheme, systemTheme } = useNextTheme();

  const [mounted, setMounted] = React.useState(false);
  const [intent, setIntentState] = React.useState<ThemeIntent>(DEFAULT_INTENT);
  const [tier, setTierState] = React.useState<PlanTier>(defaultTier);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme | null>(null);

  // Determine system preference
  const systemPrefersDark = systemTheme === 'dark';

  // Load stored values on mount
  React.useEffect(() => {
    const storedIntent = loadStoredIntent();
    const storedTier = loadStoredTier();

    if (storedIntent) {
      setIntentState(storedIntent);
    }
    setTierState(storedTier || defaultTier);
    setMounted(true);
  }, [defaultTier]);

  // Derive theme whenever intent or mode changes
  React.useEffect(() => {
    if (!mounted) return;

    // Filter intent by tier (reset features not available)
    const filteredIntent = filterIntentByTier(intent, tier);

    // Derive the theme
    const derived = deriveTheme(filteredIntent, systemPrefersDark);
    setResolvedTheme(derived);

    // Apply CSS variables
    applyCssVariables(derived.cssVars);

    // Sync mode with next-themes if intent changes mode
    if (intent.mode !== theme) {
      setTheme(intent.mode);
    }
  }, [intent, tier, mounted, systemPrefersDark, theme, setTheme]);

  // Set intent with persistence
  const setIntent = React.useCallback((newIntent: ThemeIntent) => {
    setIntentState(newIntent);
    saveIntent(newIntent);
  }, []);

  // Partially update intent
  const updateIntent = React.useCallback((partial: Partial<ThemeIntent>) => {
    setIntentState((prev) => {
      const updated = mergeIntent(prev, partial);
      saveIntent(updated);
      return updated;
    });
  }, []);

  // Apply preset by ID
  const applyPresetById = React.useCallback((presetId: string) => {
    const presetIntent = applyPreset(presetId);
    const updated = { ...presetIntent, preset: presetId };
    setIntentState(updated);
    saveIntent(updated);
  }, []);

  // Reset to defaults
  const resetIntent = React.useCallback(() => {
    setIntentState(DEFAULT_INTENT);
    saveIntent(DEFAULT_INTENT);
  }, []);

  // Set tier with persistence
  const setTier = React.useCallback((newTier: PlanTier) => {
    setTierState(newTier);
    saveTier(newTier);
  }, []);

  // Toggle mode (light <-> dark, system uses opposite of current)
  const toggleMode = React.useCallback(() => {
    const currentEffective = resolveColorMode(intent.mode, systemPrefersDark);
    const newMode = currentEffective === 'light' ? 'dark' : 'light';
    updateIntent({ mode: newMode });
  }, [intent.mode, systemPrefersDark, updateIntent]);

  // Set specific mode
  const setMode = React.useCallback((mode: 'light' | 'dark' | 'system') => {
    updateIntent({ mode });
    setTheme(mode);
  }, [updateIntent, setTheme]);

  // Effective mode from resolved theme or computed
  const effectiveMode = resolvedTheme?.effectiveMode || 
    (nextResolvedTheme as 'light' | 'dark') || 
    'light';

  const value: ThemeContextValue = {
    intent,
    setIntent,
    updateIntent,
    applyPresetById,
    resetIntent,
    resolvedTheme,
    effectiveMode,
    toggleMode,
    setMode,
    tier,
    setTier,
    mounted,
    systemPrefersDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default color mode */
  defaultTheme?: 'light' | 'dark' | 'system';
  /** Default user tier */
  defaultTier?: PlanTier;
  /** Force a specific mode (for storybook, etc.) */
  forcedTheme?: 'light' | 'dark';
  /** Storage key for next-themes */
  storageKey?: string;
  /** Disable transitions when switching themes */
  disableTransitionOnChange?: boolean;
}

/**
 * Theme Provider - wraps next-themes with intent-based theming
 * 
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="system" defaultTier="pro">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultTier = 'free',
  forcedTheme,
  storageKey = 'hsafx-theme-mode',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      storageKey={storageKey}
      disableTransitionOnChange={disableTransitionOnChange}
      enableSystem
      enableColorScheme
    >
      <IntentThemeProvider defaultTier={defaultTier}>
        {children}
      </IntentThemeProvider>
    </NextThemesProvider>
  );
}

/**
 * Use the theme context
 * 
 * @example
 * ```tsx
 * const { intent, setMode, applyPresetById } = useTheme();
 * 
 * // Change primary color
 * updateIntent({ brand: { primary: '#ff0000' } });
 * 
 * // Apply cyberpunk preset
 * applyPresetById('cyberpunk');
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to safely use theme in SSR context
 * Returns partial context that won't cause hydration mismatch
 */
export function useThemeSafe(): Pick<ThemeContextValue, 'mounted' | 'effectiveMode' | 'setMode' | 'toggleMode'> {
  const context = React.useContext(ThemeContext);

  if (!context) {
    return {
      mounted: false,
      effectiveMode: 'light',
      setMode: () => {},
      toggleMode: () => {},
    };
  }

  return {
    mounted: context.mounted,
    effectiveMode: context.effectiveMode,
    setMode: context.setMode,
    toggleMode: context.toggleMode,
  };
}
