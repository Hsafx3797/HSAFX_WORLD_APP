'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { RBACProvider } from '@/components/rbac/use-rbac';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <RBACProvider>
        {children}
        <Toaster richColors position="top-right" />
      </RBACProvider>
    </QueryClientProvider>
  );
}
