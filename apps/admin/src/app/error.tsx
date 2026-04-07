'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin:error-boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-bold text-[#fafafa]">Something went wrong</h2>
        <p className="mt-3 text-[#a1a1a1]">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-[#666]">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-[#3b82f6] px-6 py-2 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
