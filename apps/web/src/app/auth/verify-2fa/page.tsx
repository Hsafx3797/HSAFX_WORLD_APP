'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!useBackupCode && code.length !== 6) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    if (useBackupCode && !code.trim()) {
      toast.error('Please enter a backup code.');
      return;
    }

    setIsLoading(true);

    try {
      if (useBackupCode) {
        const res = await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
        });
        if (res.error) {
          toast.error(res.error.message ?? 'Invalid backup code.');
          setIsLoading(false);
          return;
        }
      } else {
        const res = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice,
        });
        if (res.error) {
          toast.error(res.error.message ?? 'Invalid verification code.');
          setIsLoading(false);
          return;
        }
      }

      toast.success('Verified successfully!');
      router.push('/dashboard');
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold">Two-Factor Verification</h1>
            <p className="text-muted-foreground mt-2">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                {useBackupCode ? 'Backup Code' : 'Verification Code'}
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) =>
                  useBackupCode
                    ? setCode(e.target.value)
                    : setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-center tracking-widest text-lg"
                placeholder={useBackupCode ? 'Enter backup code' : '000000'}
                maxLength={useBackupCode ? 20 : 6}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            {!useBackupCode && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded border-border"
                />
                Trust this device for 30 days
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              className="text-sm text-primary hover:underline"
            >
              {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
