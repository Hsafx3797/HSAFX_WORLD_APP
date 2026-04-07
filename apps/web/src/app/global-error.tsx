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
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="mt-4 text-neutral-400">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-neutral-500">
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
