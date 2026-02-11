import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Settings - HSAFX World',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
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
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-1">
              <a
                href="#profile"
                className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                Profile
              </a>
              <a
                href="#preferences"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Preferences
              </a>
              <a
                href="#notifications"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Notifications
              </a>
              <a
                href="#security"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Security
              </a>
              <a
                href="#api"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                API Access
              </a>
              <a
                href="#billing"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Billing
              </a>
              <a
                href="#danger"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors text-destructive"
              >
                Danger Zone
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Section */}
            <section id="profile" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Profile</h2>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max 2MB
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    rows={3}
                    placeholder="A short bio about yourself"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section id="preferences" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Preferences</h2>
              
              <div className="space-y-6">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Theme</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <select className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Language</h3>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language
                    </p>
                  </div>
                  <select className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                {/* Default Tool Settings */}
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Auto-copy Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically copy tool results to clipboard
                    </p>
                  </div>
                  <button className="relative w-12 h-6 bg-muted rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                  </button>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
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
                  <button className="relative w-12 h-6 bg-primary rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive tips, offers, and product news
                    </p>
                  </div>
                  <button className="relative w-12 h-6 bg-muted rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                  </button>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section id="security" className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Update Password
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

            {/* API Access Section */}
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

            {/* Billing Section */}
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
                    You're on the free plan with limited features.
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

            {/* Danger Zone */}
            <section id="danger" className="bg-card border border-destructive/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6 text-destructive">Danger Zone</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Export Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Download all your data in JSON format
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Export
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
