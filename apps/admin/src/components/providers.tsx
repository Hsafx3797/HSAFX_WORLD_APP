'use client';

import { Toaster } from 'sonner';
import { RBACProvider } from '@/components/rbac/use-rbac';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RBACProvider>
      {children}
      <Toaster richColors position="top-right" />
    </RBACProvider>
  );
}
