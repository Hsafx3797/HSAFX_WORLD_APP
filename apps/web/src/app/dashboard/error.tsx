'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard-error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Error</h2>
        <p className="mt-3 text-muted-foreground">
          Something went wrong loading your dashboard. Your data is safe.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
