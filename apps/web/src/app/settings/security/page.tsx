'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 120',
      location: 'Dubai, UAE',
      lastActive: 'Now',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari',
      location: 'Dubai, UAE',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'MacBook Pro',
      browser: 'Firefox 121',
      location: 'Abu Dhabi, UAE',
      lastActive: '1 day ago',
      isCurrent: false,
    },
  ]);

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    setShowQRCode(true);
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      setVerificationCode('');
      setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Invalid verification code. Please try again.' });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTwoFactorEnabled(false);
      setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disable 2FA. Please try again.' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Session revoked successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke session.' });
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'All other sessions have been revoked.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke sessions.' });
    }
  };

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

            {!twoFactorEnabled && !showQRCode && (
              <button
                onClick={handleEnable2FA}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Enable 2FA
              </button>
            )}

            {showQRCode && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-6xl">📱</span>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or enter this code manually:
                  </p>
                  <code className="px-4 py-2 bg-muted rounded font-mono text-sm">
                    JBSWY3DPEHPK3PXP
                  </code>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter verification code
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
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {twoFactorEnabled && (
              <button
                onClick={handleDisable2FA}
                className="px-6 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10 transition-colors"
              >
                Disable 2FA
              </button>
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
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {session.device.includes('iPhone') || session.device.includes('Android')
                        ? '📱'
                        : '💻'}
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {session.device} • {session.browser}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {session.isCurrent ? (
                    <span className="text-xs text-success font-medium">Current</span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-sm text-destructive hover:text-destructive/80"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Security Log */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Security Log</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Password changed</p>
                  <p className="text-xs text-muted-foreground">Chrome on Windows • Dubai, UAE</p>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Successful login</p>
                  <p className="text-xs text-muted-foreground">Safari on iPhone • Dubai, UAE</p>
                </div>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Account created</p>
                  <p className="text-xs text-muted-foreground">Chrome on Windows • Dubai, UAE</p>
                </div>
                <span className="text-xs text-muted-foreground">1 week ago</span>
              </div>
            </div>
            <Link
              href="/dashboard/history"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              View full activity log →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
