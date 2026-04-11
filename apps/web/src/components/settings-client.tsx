'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { DangerZone } from '@/components/danger-zone';
import { GdprExportButton } from '@/components/gdpr-export-button';
import { PasswordStrengthMeter, isPasswordValid } from '@/components/password-strength-meter';

// ─── Toggle Switch ──────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

// ─── Profile Section ────────────────────────────────────────
function ProfileSection() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const { data: referralData } = trpc.user.getMyReferralCode.useQuery();
  const utils = trpc.useUtils();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated');
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (data?.user) {
      setFullName(data.user.fullName ?? '');
      setUsername(data.user.username ?? '');
      setPhoneNumber(data.user.phoneNumber ?? '');
    }
  }, [data?.user]);

  const handleSave = () => {
    updateProfile.mutate({
      fullName: fullName || undefined,
      username: username || undefined,
      phoneNumber: phoneNumber || null,
    });
  };

  const handleCopyReferral = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code);
      toast.success('Referral code copied');
    }
  };

  return (
    <section id="profile" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Profile</h2>
      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {data?.user?.avatarUrl ? (
              <Image
                src={data.user.avatarUrl}
                alt={data.user.fullName ?? 'Avatar'}
                width={80}
                height={80}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Avatar is synced from your social login provider
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={data?.user?.email ?? ''}
            readOnly
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email changes require re-verification
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
          <div>
            <label className="block text-sm font-medium mb-2">Member Since</label>
            <p className="text-sm text-muted-foreground">
              {data?.user?.createdAt
                ? new Date(data.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Referral Code</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm font-mono">
                {referralData?.code ?? '—'}
              </code>
              <button
                onClick={handleCopyReferral}
                disabled={!referralData?.code}
                className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors text-sm disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending || isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Preferences Section ────────────────────────────────────
function PreferencesSection() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();
  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences updated');
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (data?.preferences) {
      setTheme(data.preferences.theme ?? 'system');
      setLanguage(data.preferences.language ?? 'en');
    }
  }, [data?.preferences]);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    updatePreferences.mutate({ theme: val as 'light' | 'dark' | 'system' });
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    updatePreferences.mutate({ language: val });
  };

  return (
    <section id="preferences" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Preferences</h2>
      <div className="space-y-6">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
          </div>
          <select
            value={theme}
            disabled={isLoading}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <div>
            <h3 className="font-medium">Language</h3>
            <p className="text-sm text-muted-foreground">Select your preferred language</p>
          </div>
          <select
            value={language}
            disabled={isLoading}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
    </section>
  );
}

// ─── Notifications Section ──────────────────────────────────
function NotificationsSection() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();
  const updateSettings = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Notification settings updated');
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setEmailNotifications(data.settings.emailNotifications ?? true);
      setMarketingEmails(data.settings.marketingEmails ?? false);
    }
  }, [data?.settings]);

  const handleEmailToggle = (val: boolean) => {
    setEmailNotifications(val);
    updateSettings.mutate({ emailNotifications: val });
  };

  const handleMarketingToggle = (val: boolean) => {
    setMarketingEmails(val);
    updateSettings.mutate({ marketingEmails: val });
  };

  return (
    <section id="notifications" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Notifications</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Receive updates about new tools and features
            </p>
          </div>
          <Toggle
            checked={emailNotifications}
            onChange={handleEmailToggle}
            disabled={isLoading || updateSettings.isPending}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <h3 className="font-medium">Marketing Emails</h3>
            <p className="text-sm text-muted-foreground">
              Receive tips, offers, and product news
            </p>
          </div>
          <Toggle
            checked={marketingEmails}
            onChange={handleMarketingToggle}
            disabled={isLoading || updateSettings.isPending}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Security Section ───────────────────────────────────────
interface SessionData {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  isCurrent: boolean;
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' };
  const browser =
    ua.includes('Firefox') ? 'Firefox' :
    ua.includes('Edg') ? 'Edge' :
    ua.includes('Chrome') ? 'Chrome' :
    ua.includes('Safari') ? 'Safari' : 'Other';
  const device =
    /iPhone|iPad/.test(ua) ? 'iOS' :
    /Android/.test(ua) ? 'Android' :
    /Macintosh/.test(ua) ? 'Mac' :
    /Windows/.test(ua) ? 'Windows' :
    /Linux/.test(ua) ? 'Linux' : 'Unknown';
  return { device, browser };
}

function SecuritySection() {
  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => toast.error(err.message),
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'backup' | 'verify'>('idle');
  const [totpQRDataUrl, setTotpQRDataUrl] = useState('');
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Check 2FA status on mount
  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res.data?.user) {
        const u = res.data.user as Record<string, unknown>;
        setTwoFactorEnabled(!!u.twoFactorEnabled);
      }
    }).catch(() => {});
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await authClient.listSessions();
      if (res.data) {
        setSessions(res.data as unknown as SessionData[]);
      }
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast.error('Password does not meet all requirements');
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  // 2FA handlers
  const handleEnable2FA = async () => {
    if (!twoFAPassword) { toast.error('Enter your password'); return; }
    setTwoFALoading(true);
    try {
      const res = await authClient.twoFactor.enable({ password: twoFAPassword });
      if (res.error) { toast.error(res.error.message ?? 'Failed to enable 2FA'); return; }
      const data = res.data as { totpURI: string; backupCodes: string[] };
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);
      const QRCode = (await import('qrcode')).default;
      const qr = await QRCode.toDataURL(data.totpURI, { width: 200, margin: 2 });
      setTotpQRDataUrl(qr);
      setTwoFAStep('setup');
    } catch { toast.error('Failed to enable 2FA'); } finally { setTwoFALoading(false); }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) { toast.error('Enter a valid 6-digit code'); return; }
    setTwoFALoading(true);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: verificationCode });
      if (res.error) { toast.error(res.error.message ?? 'Invalid code'); return; }
      setTwoFactorEnabled(true);
      setTwoFAStep('idle');
      setVerificationCode('');
      setTwoFAPassword('');
      toast.success('Two-factor authentication enabled');
    } catch { toast.error('Verification failed'); } finally { setTwoFALoading(false); }
  };

  const handleDisable2FA = async () => {
    if (!twoFAPassword) { toast.error('Enter your password'); return; }
    setTwoFALoading(true);
    try {
      const res = await authClient.twoFactor.disable({ password: twoFAPassword });
      if (res.error) { toast.error(res.error.message ?? 'Failed to disable 2FA'); return; }
      setTwoFactorEnabled(false);
      setTwoFAPassword('');
      toast.success('Two-factor authentication disabled');
    } catch { toast.error('Failed to disable 2FA'); } finally { setTwoFALoading(false); }
  };

  const handleCancelSetup = () => {
    setTwoFAStep('idle');
    setVerificationCode('');
    setTwoFAPassword('');
    setTotpQRDataUrl('');
    setTotpURI('');
    setBackupCodes([]);
  };

  // Session handlers
  const handleRevokeSession = async (token: string) => {
    try {
      await authClient.revokeSession({ token });
      toast.success('Session revoked');
      fetchSessions();
    } catch { toast.error('Failed to revoke session'); }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authClient.revokeSessions();
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch { toast.error('Failed to revoke sessions'); }
  };

  const manualSecret = totpURI ? new URL(totpURI).searchParams.get('secret') ?? '' : '';

  return (
    <section id="security" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Security</h2>
      <div className="space-y-6">
        {/* ── Change Password ── */}
        <div>
          <h3 className="font-medium mb-4">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <PasswordStrengthMeter password={newPassword} />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleChangePassword}
              disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* ── Two-Factor Authentication ── */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            {twoFactorEnabled && (
              <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">Enabled</span>
            )}
          </div>

          {/* Idle — not enabled: show enable form */}
          {!twoFactorEnabled && twoFAStep === 'idle' && (
            <div className="space-y-3 max-w-md">
              <input
                type="password"
                placeholder="Enter your password"
                value={twoFAPassword}
                onChange={(e) => setTwoFAPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleEnable2FA}
                disabled={twoFALoading || !twoFAPassword}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            </div>
          )}

          {/* Step 1: QR code */}
          {twoFAStep === 'setup' && (
            <div className="space-y-4 max-w-md">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app.
              </p>
              {totpQRDataUrl && (
                <div className="flex justify-center">
                  <img src={totpQRDataUrl} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Or enter manually:</p>
                <code className="px-3 py-1 bg-muted rounded font-mono text-xs select-all">{manualSecret}</code>
              </div>
              <button onClick={() => setTwoFAStep('backup')} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Next: Backup Codes
              </button>
              <button onClick={handleCancelSetup} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          )}

          {/* Step 2: Backup codes */}
          {twoFAStep === 'backup' && (
            <div className="space-y-4 max-w-md">
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm font-medium text-warning">Save these backup codes securely</p>
                <p className="text-xs text-muted-foreground mt-1">Each code can only be used once.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                {backupCodes.map((code, i) => (
                  <code key={i} className="font-mono text-xs text-center py-1 select-all">{code}</code>
                ))}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(backupCodes.join('\n')); toast.success('Codes copied'); }}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Copy All Codes
              </button>
              <button onClick={() => setTwoFAStep('verify')} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                I&apos;ve Saved My Codes
              </button>
              <button onClick={handleCancelSetup} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          )}

          {/* Step 3: Verify */}
          {twoFAStep === 'verify' && (
            <div className="space-y-3 max-w-md">
              <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {twoFALoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button onClick={handleCancelSetup} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          )}

          {/* Enabled — show disable form */}
          {twoFactorEnabled && twoFAStep === 'idle' && (
            <div className="space-y-3 max-w-md">
              <input
                type="password"
                placeholder="Enter your password to disable"
                value={twoFAPassword}
                onChange={(e) => setTwoFAPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleDisable2FA}
                disabled={twoFALoading || !twoFAPassword}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          )}
        </div>

        {/* ── Active Sessions ── */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
            </div>
            {sessions.length > 1 && (
              <button onClick={handleRevokeAllSessions} className="text-sm text-destructive hover:text-destructive/80">
                Revoke all others
              </button>
            )}
          </div>
          <div className="space-y-3">
            {sessionsLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active sessions found.</p>
            ) : (
              sessions.map((session) => {
                const { device, browser } = parseUserAgent(session.userAgent);
                return (
                  <div key={session.id} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{/iOS|Android/.test(device) ? '📱' : '💻'}</span>
                      <div>
                        <p className="font-medium text-sm">{device} &bull; {browser}</p>
                        <p className="text-xs text-muted-foreground">{session.ipAddress ?? 'Unknown IP'}</p>
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
        </div>
      </div>
    </section>
  );
}

// ─── Social Accounts Section ────────────────────────────────
const PROVIDERS = [
  { id: 'google', name: 'Google', icon: '🔵' },
  { id: 'github', name: 'GitHub', icon: '⚫' },
  { id: 'facebook', name: 'Facebook', icon: '🔷' },
] as const;

function SocialAccountsSection() {
  const { data: linked, isLoading } = trpc.user.getLinkedAccounts.useQuery();
  const utils = trpc.useUtils();
  const unlinkMutation = trpc.user.unlinkAccount.useMutation({
    onSuccess: () => {
      toast.success('Account unlinked');
      utils.user.getLinkedAccounts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const linkedProviders = new Set(linked?.map((a) => a.provider) ?? []);

  const handleLink = (provider: string) => {
    authClient.signIn.social({
      provider: provider as 'google' | 'github' | 'facebook',
      callbackURL: '/settings#social',
    });
  };

  const handleUnlink = (provider: string) => {
    unlinkMutation.mutate({ provider });
  };

  return (
    <section id="social" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-2">Connected Accounts</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Link social accounts for easier sign-in. You must keep at least one authentication method active.
      </p>
      <div className="space-y-4">
        {PROVIDERS.map((p) => {
          const isLinked = linkedProviders.has(p.id);
          const account = linked?.find((a) => a.provider === p.id);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  {isLinked && account?.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {isLoading ? (
                <span className="text-xs text-muted-foreground">Loading...</span>
              ) : isLinked ? (
                <button
                  onClick={() => handleUnlink(p.id)}
                  disabled={unlinkMutation.isPending}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                >
                  {unlinkMutation.isPending ? 'Unlinking...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleLink(p.id)}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── API Access Section ─────────────────────────────────────
function ApiAccessSection() {
  const utils = trpc.useUtils();
  const { data: keys, isLoading } = trpc.apiKeys.list.useQuery();
  const generateKey = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key);
      toast.success('API key generated');
      utils.apiKeys.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const revokeKey = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      toast.success('API key revoked');
      utils.apiKeys.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');

  const handleGenerate = () => {
    generateKey.mutate({ name: keyName || 'Default' });
    setKeyName('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const activeKeys = keys?.filter((k) => k.isActive) ?? [];

  return (
    <section id="api" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">API Access</h2>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Generate API keys to access HSAFX World tools programmatically.
        </p>

        {/* New key reveal (shown once after generation) */}
        {newKey && (
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-sm font-medium mb-2">
              Save this key now — you won&apos;t see it again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono break-all">
                {newKey}
              </code>
              <button
                onClick={() => handleCopy(newKey)}
                className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors text-sm"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Existing keys */}
        {isLoading ? (
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">Loading keys...</div>
        ) : activeKeys.length === 0 ? (
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">No active API keys.</div>
        ) : (
          activeKeys.map((key) => (
            <div key={key.id} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{key.name}</span>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono">
                  {key.keyPrefix}•••••••••••••••••••
                </code>
                <button
                  onClick={() => revokeKey.mutate({ id: key.id })}
                  disabled={revokeKey.isPending}
                  className="px-3 py-2 border border-destructive/30 text-destructive rounded hover:bg-destructive/10 transition-colors text-sm"
                >
                  Revoke
                </button>
              </div>
              {key.lastUsed && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last used {new Date(key.lastUsed).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}

        {/* Generate new key */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Key name (optional)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleGenerate}
            disabled={generateKey.isPending || activeKeys.length >= 5}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generateKey.isPending ? 'Generating...' : 'Generate New Key'}
          </button>
        </div>
        {activeKeys.length >= 5 && (
          <p className="text-xs text-muted-foreground">Maximum 5 active keys. Revoke a key to generate a new one.</p>
        )}
        <Link href="/docs/api" className="block text-sm text-primary hover:underline">
          View API Documentation →
        </Link>
      </div>
    </section>
  );
}

// ─── Billing Section ────────────────────────────────────────
function BillingSection() {
  const { data, isLoading } = trpc.billing.getMySubscription.useQuery();

  const planName = data?.plan?.name ?? 'Free';
  const derivedStatus = data?.derivedStatus ?? 'none';

  const statusLabel =
    derivedStatus === 'trialing'
      ? 'Trial'
      : derivedStatus === 'active_canceling'
        ? 'Canceling'
        : derivedStatus === 'active'
          ? 'Active'
          : derivedStatus === 'past_due'
            ? 'Past Due'
            : 'Free';

  return (
    <section id="billing" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Billing</h2>
      <div className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Current Plan</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {isLoading ? '...' : planName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {data?.subscription ? (
              <>
                Status: <span className="font-medium">{statusLabel}</span>
                {data.subscription.currentPeriodEnd && (
                  <> &middot; Renews {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </>
            ) : (
              <>You&apos;re on the free plan with limited features.</>
            )}
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {data?.subscription ? 'Manage Plan' : 'Upgrade Plan'}
        </Link>
      </div>
    </section>
  );
}

// ─── Privacy Section ────────────────────────────────────────
function PrivacySection() {
  return (
    <section id="privacy" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Privacy & Data</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Export Your Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of all your personal data (GDPR compliant). This includes
            your profile, preferences, tool executions, and transaction history.
          </p>
          <GdprExportButton />
        </div>
      </div>
    </section>
  );
}

// ─── Sidebar Navigation ─────────────────────────────────────
function SettingsSidebar() {
  return (
    <nav className="sticky top-8 space-y-1">
      <a href="#profile" className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
        Profile
      </a>
      <a href="#preferences" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Preferences
      </a>
      <a href="#notifications" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Notifications
      </a>
      <a href="#security" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Security
      </a>
      <a href="#social" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Connected Accounts
      </a>
      <a href="#api" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        API Access
      </a>
      <a href="#billing" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Billing
      </a>
      <a href="#privacy" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors">
        Privacy & Data
      </a>
      <a href="#danger" className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors text-destructive">
        Danger Zone
      </a>
    </nav>
  );
}

// ─── Main Client Component ──────────────────────────────────
export function SettingsClient() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SettingsSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <ProfileSection />
            <PreferencesSection />
            <NotificationsSection />
            <SecuritySection />
            <SocialAccountsSection />
            <ApiAccessSection />
            <BillingSection />
            <PrivacySection />
            <DangerZone />
          </div>
        </div>
      </div>
    </div>
  );
}
