'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin:global-error]', error);
  }, [error]);

  // global-error replaces the entire <html>, so the layout's globals.css
  // (and its CSS variables) are NOT loaded. Hardcoded colors are intentional.
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#fafafa] font-sans antialiased">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="mt-4 text-[#a1a1a1]">
            An unexpected error occurred in the admin panel.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-[#666]">
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-[#3b82f6] px-6 py-2 text-sm font-medium text-[#fafafa] hover:bg-[#2563eb] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
