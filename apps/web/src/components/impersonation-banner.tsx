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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f59e0b',
        color: '#000',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}
    >
      <span>
        🔍 Impersonating: {info.name} ({info.email}) — Scoped session
      </span>
      <button
        onClick={handleStop}
        style={{
          padding: '0.25rem 0.75rem',
          backgroundColor: '#000',
          color: '#f59e0b',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      >
        Stop Impersonation
      </button>
    </div>
  );
}
