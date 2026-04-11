'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface SessionData {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown device', browser: 'Unknown browser' };
  const browser =
    ua.includes('Firefox') ? 'Firefox' :
    ua.includes('Edg') ? 'Edge' :
    ua.includes('Chrome') ? 'Chrome' :
    ua.includes('Safari') ? 'Safari' :
    'Other';
  const device =
    /iPhone|iPad/.test(ua) ? 'iPhone/iPad' :
    /Android/.test(ua) ? 'Android' :
    /Macintosh/.test(ua) ? 'Mac' :
    /Windows/.test(ua) ? 'Windows PC' :
    /Linux/.test(ua) ? 'Linux' :
    'Unknown';
  return { device, browser };
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type TwoFAStep = 'idle' | 'setup' | 'backup' | 'verify';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('idle');
  const [totpQRDataUrl, setTotpQRDataUrl] = useState('');
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Fetch 2FA status from session
  useEffect(() => {
    async function check2FAStatus() {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          const u = session.data.user as Record<string, unknown>;
          setTwoFactorEnabled(!!u.twoFactorEnabled);
        }
      } catch {
        // ignore
      }
    }
    check2FAStatus();
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await authClient.listSessions();
      if (res.data) {
        setSessions(
          (res.data as unknown as SessionData[]).map((s) => ({
            ...s,
            isCurrent: s.isCurrent ?? false,
          }))
        );
      }
    } catch {
      // silently fail — will show empty
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ─── Password Change ────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (res.error) {
        setMessage({ type: 'error', text: res.error.message ?? 'Failed to change password.' });
      } else {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── 2FA Enable Flow ───────────────────────────────────────
  const handleEnable2FA = async () => {
    if (!twoFAPassword) {
      setMessage({ type: 'error', text: 'Please enter your password to enable 2FA.' });
      return;
    }

    setTwoFALoading(true);
    setMessage(null);

    try {
      const res = await authClient.twoFactor.enable({
        password: twoFAPassword,
      });
      if (res.error) {
        setMessage({ type: 'error', text: res.error.message ?? 'Failed to enable 2FA.' });
        setTwoFALoading(false);
        return;
      }

      const data = res.data as { totpURI: string; backupCodes: string[] };
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);

      // Generate QR code from TOTP URI
      const qrDataUrl = await QRCode.toDataURL(data.totpURI, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setTotpQRDataUrl(qrDataUrl);
      setTwoFAStep('setup');
    } catch {
      setMessage({ type: 'error', text: 'Failed to enable 2FA. Please try again.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleShowBackupCodes = () => {
    setTwoFAStep('backup');
  };

  const handleProceedToVerify = () => {
    setTwoFAStep('verify');
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    setTwoFALoading(true);
    setMessage(null);

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
      });
      if (res.error) {
        setMessage({ type: 'error', text: res.error.message ?? 'Invalid verification code.' });
        setTwoFALoading(false);
        return;
      }

      setTwoFactorEnabled(true);
      setTwoFAStep('idle');
      setVerificationCode('');
      setTwoFAPassword('');
      setTotpQRDataUrl('');
      setTotpURI('');
      setBackupCodes([]);
      setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Invalid verification code. Please try again.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFAPassword) {
      setMessage({ type: 'error', text: 'Please enter your password to disable 2FA.' });
      return;
    }

    setTwoFALoading(true);
    setMessage(null);

    try {
      const res = await authClient.twoFactor.disable({
        password: twoFAPassword,
      });
      if (res.error) {
        setMessage({ type: 'error', text: res.error.message ?? 'Failed to disable 2FA.' });
        setTwoFALoading(false);
        return;
      }

      setTwoFactorEnabled(false);
      setTwoFAPassword('');
      setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disable 2FA. Please try again.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleCancelSetup = () => {
    setTwoFAStep('idle');
    setVerificationCode('');
    setTwoFAPassword('');
    setTotpQRDataUrl('');
    setTotpURI('');
    setBackupCodes([]);
  };

  // ─── Sessions ──────────────────────────────────────────────
  const handleRevokeSession = async (sessionToken: string) => {
    try {
      await authClient.revokeSession({ token: sessionToken });
      toast.success('Session revoked successfully.');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke session.');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authClient.revokeSessions();
      toast.success('All other sessions have been revoked.');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke sessions.');
    }
  };

  // Extract manual entry secret from TOTP URI
  const manualSecret = totpURI ? new URL(totpURI).searchParams.get('secret') ?? '' : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Security</span>
          </div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security and authentication methods
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl space-y-8">
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Change Password */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Must be at least 8 characters with a mix of letters and numbers.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </section>

          {/* Two-Factor Authentication */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              {twoFactorEnabled && (
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                  Enabled
                </span>
              )}
            </div>

            {/* Idle state — not enabled */}
            {!twoFactorEnabled && twoFAStep === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter your password to enable 2FA
                  </label>
                  <input
                    type="password"
                    value={twoFAPassword}
                    onChange={(e) => setTwoFAPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your account password"
                  />
                </div>
                <button
                  onClick={handleEnable2FA}
                  disabled={twoFALoading || !twoFAPassword}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              </div>
            )}

            {/* Step 1: QR code setup */}
            {twoFAStep === 'setup' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div className="flex justify-center">
                  {totpQRDataUrl ? (
                    <img src={totpQRDataUrl} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Loading...</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or enter this code manually:
                  </p>
                  <code className="px-4 py-2 bg-muted rounded font-mono text-sm select-all">
                    {manualSecret}
                  </code>
                </div>

                <button
                  onClick={handleShowBackupCodes}
                  className="w-full px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Next: View Backup Codes
                </button>

                <button
                  onClick={handleCancelSetup}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Step 2: Backup codes */}
            {twoFAStep === 'backup' && (
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm font-medium text-warning">
                    Save these backup codes in a secure location
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each code can only be used once. You won&apos;t be able to see them again.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="font-mono text-sm text-center py-1 select-all">
                      {code}
                    </code>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    toast.success('Backup codes copied to clipboard.');
                  }}
                  className="w-full px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                >
                  Copy All Codes
                </button>

                <button
                  onClick={handleProceedToVerify}
                  className="w-full px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  I&apos;ve Saved My Codes — Continue
                </button>

                <button
                  onClick={handleCancelSetup}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Step 3: Verify TOTP code */}
            {twoFAStep === 'verify' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify setup.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-center tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerify2FA}
                      disabled={twoFALoading || verificationCode.length !== 6}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {twoFALoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCancelSetup}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Enabled state — option to disable */}
            {twoFactorEnabled && twoFAStep === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter your password to disable 2FA
                  </label>
                  <input
                    type="password"
                    value={twoFAPassword}
                    onChange={(e) => setTwoFAPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your account password"
                  />
                </div>
                <button
                  onClick={handleDisable2FA}
                  disabled={twoFALoading || !twoFAPassword}
                  className="px-6 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            )}
          </section>

          {/* Active Sessions */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Active Sessions</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your active sessions across devices
                </p>
              </div>
              <button
                onClick={handleRevokeAllSessions}
                className="text-sm text-destructive hover:text-destructive/80"
              >
                Revoke all others
              </button>
            </div>

            <div className="space-y-4">
              {sessionsLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No active sessions found.</div>
              ) : (
                sessions.map((session) => {
                  const { device, browser } = parseUserAgent(session.userAgent);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">
                          {device.includes('iPhone') || device.includes('iPad') || device.includes('Android')
                            ? '📱'
                            : '💻'}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {device} &bull; {browser}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.ipAddress ?? 'Unknown IP'} &bull; {timeAgo(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      {session.isCurrent ? (
                        <span className="text-xs text-success font-medium">Current</span>
                      ) : (
                        <button
                          onClick={() => handleRevokeSession(session.token)}
                          className="text-sm text-destructive hover:text-destructive/80"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
