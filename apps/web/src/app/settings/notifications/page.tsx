'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NotificationSettings {
  email: {
    toolUpdates: boolean;
    newFeatures: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
    billingAlerts: boolean;
    tips: boolean;
    newsletter: boolean;
  };
  push: {
    enabled: boolean;
    toolCompletion: boolean;
    mentions: boolean;
    systemAlerts: boolean;
  };
  inApp: {
    enabled: boolean;
    newTools: boolean;
    announcements: boolean;
    tips: boolean;
  };
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      toolUpdates: true,
      newFeatures: true,
      weeklyDigest: false,
      securityAlerts: true,
      billingAlerts: true,
      tips: false,
      newsletter: false,
    },
    push: {
      enabled: true,
      toolCompletion: true,
      mentions: true,
      systemAlerts: true,
    },
    inApp: {
      enabled: true,
      newTools: true,
      announcements: true,
      tips: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = (category: keyof NotificationSettings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof typeof prev[typeof category]],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Notification settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = () => {
    setSettings({
      email: {
        toolUpdates: false,
        newFeatures: false,
        weeklyDigest: false,
        securityAlerts: true, // Keep security alerts on
        billingAlerts: true, // Keep billing alerts on
        tips: false,
        newsletter: false,
      },
      push: {
        enabled: false,
        toolCompletion: false,
        mentions: false,
        systemAlerts: true,
      },
      inApp: {
        enabled: true,
        newTools: false,
        announcements: true,
        tips: false,
      },
    });
    setMessage({ type: 'success', text: 'Unsubscribed from optional notifications. Security and billing alerts remain active.' });
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Notifications</span>
          </div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Control how and when you receive notifications
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

          {/* Email Notifications */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📧</span>
              <div>
                <h2 className="text-lg font-semibold">Email Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Manage what emails you receive
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Tool Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    When tools you use are updated or improved
                  </p>
                </div>
                <Toggle
                  checked={settings.email.toolUpdates}
                  onChange={() => handleToggle('email', 'toolUpdates')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">New Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Announcements about new tools and features
                  </p>
                </div>
                <Toggle
                  checked={settings.email.newFeatures}
                  onChange={() => handleToggle('email', 'newFeatures')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Weekly Digest</h3>
                  <p className="text-sm text-muted-foreground">
                    Summary of your weekly activity and popular tools
                  </p>
                </div>
                <Toggle
                  checked={settings.email.weeklyDigest}
                  onChange={() => handleToggle('email', 'weeklyDigest')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Security Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications (recommended)
                  </p>
                </div>
                <Toggle
                  checked={settings.email.securityAlerts}
                  onChange={() => handleToggle('email', 'securityAlerts')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Billing Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment receipts and subscription updates
                  </p>
                </div>
                <Toggle
                  checked={settings.email.billingAlerts}
                  onChange={() => handleToggle('email', 'billingAlerts')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Tips & Tutorials</h3>
                  <p className="text-sm text-muted-foreground">
                    Helpful tips to get the most out of HSAFX World
                  </p>
                </div>
                <Toggle
                  checked={settings.email.tips}
                  onChange={() => handleToggle('email', 'tips')}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Newsletter</h3>
                  <p className="text-sm text-muted-foreground">
                    Monthly newsletter with updates and insights
                  </p>
                </div>
                <Toggle
                  checked={settings.email.newsletter}
                  onChange={() => handleToggle('email', 'newsletter')}
                />
              </div>
            </div>
          </section>

          {/* Push Notifications */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h2 className="text-lg font-semibold">Push Notifications</h2>
                  <p className="text-sm text-muted-foreground">
                    Browser and mobile push notifications
                  </p>
                </div>
              </div>
              <Toggle
                checked={settings.push.enabled}
                onChange={() => handleToggle('push', 'enabled')}
              />
            </div>

            {settings.push.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Tool Completion</h3>
                    <p className="text-sm text-muted-foreground">
                      Notify when long-running tools complete
                    </p>
                  </div>
                  <Toggle
                    checked={settings.push.toolCompletion}
                    onChange={() => handleToggle('push', 'toolCompletion')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Mentions</h3>
                    <p className="text-sm text-muted-foreground">
                      When someone mentions you in comments
                    </p>
                  </div>
                  <Toggle
                    checked={settings.push.mentions}
                    onChange={() => handleToggle('push', 'mentions')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">System Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      Important system and maintenance notifications
                    </p>
                  </div>
                  <Toggle
                    checked={settings.push.systemAlerts}
                    onChange={() => handleToggle('push', 'systemAlerts')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* In-App Notifications */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h2 className="text-lg font-semibold">In-App Notifications</h2>
                  <p className="text-sm text-muted-foreground">
                    Notifications shown within the app
                  </p>
                </div>
              </div>
              <Toggle
                checked={settings.inApp.enabled}
                onChange={() => handleToggle('inApp', 'enabled')}
              />
            </div>

            {settings.inApp.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Show banner when new tools are added
                    </p>
                  </div>
                  <Toggle
                    checked={settings.inApp.newTools}
                    onChange={() => handleToggle('inApp', 'newTools')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Announcements</h3>
                    <p className="text-sm text-muted-foreground">
                      Important announcements and updates
                    </p>
                  </div>
                  <Toggle
                    checked={settings.inApp.announcements}
                    onChange={() => handleToggle('inApp', 'announcements')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      Helpful tips and feature suggestions
                    </p>
                  </div>
                  <Toggle
                    checked={settings.inApp.tips}
                    onChange={() => handleToggle('inApp', 'tips')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleUnsubscribeAll}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Unsubscribe from all optional notifications
            </button>
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
