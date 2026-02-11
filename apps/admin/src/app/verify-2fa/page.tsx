/**
 * 2FA Verification Page
 * Shown after password login when the admin has 2FA enabled.
 * The user must enter their TOTP code to complete login.
 */

'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/2fa/session-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        setError(data.message || 'Invalid code. Please try again.');
        setLoading(false);
        setCode('');
        inputRef.current?.focus();
        return;
      }

      // 2FA verified — redirect to dashboard (or callback URL)
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/dashboard';
      router.replace(callbackUrl);
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  }

  async function handleSignOut() {
    // Sign out and go back to login
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore errors during sign-out
    }
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="totp-code" className="text-sm font-medium text-foreground">
              Authentication Code
            </label>
            <input
              ref={inputRef}
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(val);
              }}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </form>

        {/* Sign out link */}
        <div className="text-center">
          <button
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
