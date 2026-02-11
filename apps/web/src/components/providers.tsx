'use client';

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
