'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type FlagMap = Record<string, boolean>;

interface FeatureFlagContextType {
  flags: FlagMap;
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlagMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags ?? {});
      }
    } catch {
      // Silently fail — features default to off
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (key: string) => flags[key] === true,
    [flags],
  );

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, isEnabled, refresh: fetchFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagContextType {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  return ctx;
}

export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}
