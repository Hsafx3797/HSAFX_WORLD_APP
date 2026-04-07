'use client';

// TODO [G13]: Feature flags are defined in DB and managed in admin panel but NEVER consumed in the web app.
// Create a useFeatureFlag() hook or FeatureFlagProvider that reads flags from tRPC/API and
// conditionally enables features (e.g., maintenance_mode, new_billing_ui, beta_tools).

import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth'; // better-auth wrapper (Phase 0)
import { TRPCProvider } from '@/lib/trpc-provider';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ThemeProvider 
        defaultTheme="system" 
        defaultTier="free"
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </TRPCProvider>
  );
}
