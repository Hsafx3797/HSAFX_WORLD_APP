/**
 * Impersonation Banner
 *
 * Displayed at the top of the web app when an admin is impersonating a user.
 * Shows impersonation info with a "Stop Impersonation" button.
 */

'use client';

import { useState, useEffect } from 'react';

interface ImpersonationInfo {
  userId: string;
  name: string;
  email: string;
  startedAt: string;
  expiresAt: string;
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);

  useEffect(() => {
    async function checkImpersonation() {
      try {
        const res = await fetch('/api/admin/impersonate', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setInfo(data.impersonating ?? null);
        }
      } catch {
        // Not impersonating or endpoint unavailable
      }
    }

    checkImpersonation();
    // Re-check every 30 seconds in case session expires
    const intervalId = setInterval(checkImpersonation, 30_000);
    return () => clearInterval(intervalId);
  }, []);

  if (!info) return null;

  const handleStop = async () => {
    try {
      await fetch('/api/admin/impersonate', {
        method: 'DELETE',
        credentials: 'include',
      });
      setInfo(null);
      window.location.reload();
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-9999 flex items-center justify-center gap-4 px-4 py-2 bg-warning text-warning-foreground font-semibold text-sm"
    >
      <span>
        🔍 Impersonating: {info.name} ({info.email}) — Scoped session
      </span>
      <button
        onClick={handleStop}
        className="px-3 py-1 bg-foreground text-background border-none rounded-md cursor-pointer font-semibold text-xs hover:opacity-90 transition-opacity"
      >
        Stop Impersonation
      </button>
    </div>
  );
}
