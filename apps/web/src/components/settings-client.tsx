'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
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
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

// ─── Profile Section ────────────────────────────────────────
function ProfileSection() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
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

  useEffect(() => {
    if (data?.user) {
      setFullName(data.user.fullName ?? '');
      setUsername(data.user.username ?? '');
    }
  }, [data?.user]);

  const handleSave = () => {
    updateProfile.mutate({
      fullName: fullName || undefined,
      username: username || undefined,
    });
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

  return (
    <section id="security" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Security</h2>
      <div className="space-y-6">
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
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security to your account
          </p>
          <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Enable 2FA
          </button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-medium mb-2">Active Sessions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your active sessions across devices
          </p>
          <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💻</span>
              <div>
                <p className="font-medium text-sm">Current Session</p>
                <p className="text-xs text-muted-foreground">Chrome on Windows</p>
              </div>
            </div>
            <span className="text-xs text-success font-medium">Active now</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── API Access Section ─────────────────────────────────────
function ApiAccessSection() {
  return (
    <section id="api" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">API Access</h2>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Generate API keys to access HSAFX World tools programmatically.
        </p>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Default API Key</span>
            <span className="text-xs text-muted-foreground">Created Jan 1, 2024</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono">
              sk_•••••••••••••••••••••••
            </code>
            <button className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors text-sm">
              Copy
            </button>
            <button className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors text-sm">
              Reveal
            </button>
          </div>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Generate New Key
        </button>
        <Link href="/docs/api" className="block text-sm text-primary hover:underline">
          View API Documentation →
        </Link>
      </div>
    </section>
  );
}

// ─── Billing Section ────────────────────────────────────────
function BillingSection() {
  return (
    <section id="billing" className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Billing</h2>
      <div className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Current Plan</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Free
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You&apos;re on the free plan with limited features.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Upgrade Plan
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
