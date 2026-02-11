'use client';

/**
 * Theme Provider Component
 * HSAFX WORLD - React context provider for theme management
 *
 * This is the shared, framework-agnostic ThemeProvider.
 * For Next.js apps, use the app-specific wrapper that adds next-themes SSR support.
 */

import * as React from 'react';
import type { ThemeIntent, ResolvedTheme, PlanTier } from '@hsafx/theme';
import { deriveTheme, resolveColorMode } from '@hsafx/theme';
import { DEFAULT_INTENT, getPreset, canAccessPreset, mergeIntent } from '@hsafx/theme';
import { filterIntentByTier } from '@hsafx/theme';

// ─── Types ─────────────────────────────────────────────────────

export interface ThemeContextValue {
  intent: ThemeIntent;
  resolved: ResolvedTheme;
  effectiveMode: 'light' | 'dark';
  setIntent: (partial: Partial<ThemeIntent>) => void;
  applyPreset: (presetId: string) => void;
  toggleMode: () => void;
  resetToDefault: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'hsafx-theme-intent';
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/** Apply resolved CSS vars to the document root */
function applyCssVariables(cssVars: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(cssVars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme-ready', 'true');
}

function loadStoredIntent(): ThemeIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ThemeIntent;
  } catch {
    // corrupt data
  }
  return null;
}

function saveIntent(intent: ThemeIntent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // full or unavailable
  }
}

// ─── Hooks ─────────────────────────────────────────────────────

function useSystemColorScheme(): 'light' | 'dark' {
  const [scheme, setScheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setScheme(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return scheme;
}

// ─── Provider ──────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultIntent?: Partial<ThemeIntent>;
  userTier?: PlanTier;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultIntent,
  userTier = 'guest',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();

  const [intent, setIntentState] = React.useState<ThemeIntent>(() => {
    const stored = loadStoredIntent();
    if (stored) {
      const sanitized = filterIntentByTier(stored, userTier);
      return mergeIntent(sanitized);
    }
    if (defaultIntent) return mergeIntent(defaultIntent);
    return DEFAULT_INTENT;
  });

  // Derive resolved theme
  const resolved = React.useMemo<ResolvedTheme>(
    () => deriveTheme(intent, systemScheme),
    [intent, systemScheme],
  );

  // Apply CSS vars to DOM
  React.useEffect(() => {
    if (disableTransitionOnChange) {
      const style = document.createElement('style');
      style.textContent = '*, *::before, *::after { transition: none !important; }';
      document.head.appendChild(style);
      applyCssVariables(resolved.cssVars);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => document.head.removeChild(style));
      });
    } else {
      applyCssVariables(resolved.cssVars);
    }
  }, [resolved, disableTransitionOnChange]);

  // Update intent
  const setIntent = React.useCallback(
    (partial: Partial<ThemeIntent>) => {
      setIntentState((current) => {
        const merged = mergeIntent({ ...current, ...partial });
        const sanitized = filterIntentByTier(merged, userTier);
        saveIntent(sanitized);
        return sanitized;
      });
    },
    [userTier],
  );

  // Apply preset
  const applyPreset = React.useCallback(
    (presetId: string) => {
      if (!canAccessPreset(presetId, userTier)) {
        console.warn(`Preset "${presetId}" not available for tier "${userTier}"`);
        return;
      }
      const preset = getPreset(presetId);
      if (preset) {
        saveIntent(preset.intent);
        setIntentState(preset.intent);
      }
    },
    [userTier],
  );

  // Toggle light → dark → system
  const toggleMode = React.useCallback(() => {
    setIntentState((current) => {
      const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const idx = modes.indexOf(current.mode);
      const nextMode = modes[(idx + 1) % modes.length] ?? 'system';
      const next: ThemeIntent = { ...current, mode: nextMode };
      saveIntent(next);
      return next;
    });
  }, []);

  // Reset
  const resetToDefault = React.useCallback(() => {
    const d = getPreset('default');
    if (d) {
      saveIntent(d.intent);
      setIntentState(d.intent);
    }
  }, []);

  const value: ThemeContextValue = React.useMemo(
    () => ({
      intent,
      resolved,
      effectiveMode: resolved.effectiveMode,
      setIntent,
      applyPreset,
      toggleMode,
      resetToDefault,
    }),
    [intent, resolved, setIntent, applyPreset, toggleMode, resetToDefault],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hooks ─────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export function useThemeMode(): 'light' | 'dark' {
  return useTheme().effectiveMode;
}
}

// Hook to get resolved colors
export function useThemeColors() {
  const { resolved, effectiveMode } = useTheme();
  return effectiveMode === 'dark' ? resolved.colors.dark : resolved.colors.light;
}

// Utility to get initial theme script (for SSR flicker prevention)
export function getThemeInitScript(): string {
  return `
    (function() {
      try {
        var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
        var intent = stored ? JSON.parse(stored) : null;
        var mode = intent?.mode || 'system';
        var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      } catch (e) {}
    })();
  `;
}
