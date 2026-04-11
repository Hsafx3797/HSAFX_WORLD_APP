'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function NotificationSettingsPage() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();
  const updateSettings = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Notification settings updated');
      utils.user.getProfile.invalidate();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  // Top-level columns
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Granular email prefs (stored in JSONB)
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [newFeatures, setNewFeatures] = useState(true);

  // Granular push prefs (stored in JSONB)
  const [pushToolCompletion, setPushToolCompletion] = useState(true);
  const [pushSystemAlerts, setPushSystemAlerts] = useState(true);

  useEffect(() => {
    if (data?.settings) {
      setEmailNotifications(data.settings.emailNotifications ?? true);
      setPushNotifications(data.settings.pushNotifications ?? false);
      setMarketingEmails(data.settings.marketingEmails ?? false);
      const extras = data.settings.settings as Record<string, unknown> | undefined;
      if (extras) {
        setSecurityAlerts(extras.securityAlerts !== false);
        setBillingAlerts(extras.billingAlerts !== false);
        setWeeklyDigest(extras.weeklyDigest === true);
        setNewFeatures(extras.newFeatures !== false);
        setPushToolCompletion(extras.pushToolCompletion !== false);
        setPushSystemAlerts(extras.pushSystemAlerts !== false);
      }
    }
  }, [data?.settings]);

  const busy = isLoading || updateSettings.isPending;
  const mutateCol = (col: Record<string, boolean>) => updateSettings.mutate(col);
  const mutateExtra = (key: string, val: boolean) => updateSettings.mutate({ extras: { [key]: val } });

  const Toggle = ({ checked, onToggle, disabled }: { checked: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'} disabled:opacity-50`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform ${checked ? 'right-1' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Notifications</span>
          </div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">Control how and when you receive notifications</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl space-y-8">
          {/* Email Notifications */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Email Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage what emails you receive</p>
              </div>
              <Toggle checked={emailNotifications} disabled={busy} onToggle={() => { setEmailNotifications(!emailNotifications); mutateCol({ emailNotifications: !emailNotifications }); }} />
            </div>

            {emailNotifications && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Features</h3>
                    <p className="text-sm text-muted-foreground">Announcements about new tools and features</p>
                  </div>
                  <Toggle checked={newFeatures} disabled={busy} onToggle={() => { setNewFeatures(!newFeatures); mutateExtra('newFeatures', !newFeatures); }} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground">Summary of your weekly activity</p>
                  </div>
                  <Toggle checked={weeklyDigest} disabled={busy} onToggle={() => { setWeeklyDigest(!weeklyDigest); mutateExtra('weeklyDigest', !weeklyDigest); }} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Important security notifications (recommended)</p>
                  </div>
                  <Toggle checked={securityAlerts} disabled={busy} onToggle={() => { setSecurityAlerts(!securityAlerts); mutateExtra('securityAlerts', !securityAlerts); }} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Billing Alerts</h3>
                    <p className="text-sm text-muted-foreground">Payment receipts and subscription updates</p>
                  </div>
                  <Toggle checked={billingAlerts} disabled={busy} onToggle={() => { setBillingAlerts(!billingAlerts); mutateExtra('billingAlerts', !billingAlerts); }} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-muted-foreground">Tips, offers, and product news</p>
                  </div>
                  <Toggle checked={marketingEmails} disabled={busy} onToggle={() => { setMarketingEmails(!marketingEmails); mutateCol({ marketingEmails: !marketingEmails }); }} />
                </div>
              </div>
            )}
          </section>

          {/* Push Notifications */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Push Notifications</h2>
                <p className="text-sm text-muted-foreground">Browser and mobile push notifications</p>
              </div>
              <Toggle checked={pushNotifications} disabled={busy} onToggle={() => { setPushNotifications(!pushNotifications); mutateCol({ pushNotifications: !pushNotifications }); }} />
            </div>

            {pushNotifications && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Tool Completion</h3>
                    <p className="text-sm text-muted-foreground">Notify when long-running tools complete</p>
                  </div>
                  <Toggle checked={pushToolCompletion} disabled={busy} onToggle={() => { setPushToolCompletion(!pushToolCompletion); mutateExtra('pushToolCompletion', !pushToolCompletion); }} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <h3 className="font-medium">System Alerts</h3>
                    <p className="text-sm text-muted-foreground">Important system and maintenance notifications</p>
                  </div>
                  <Toggle checked={pushSystemAlerts} disabled={busy} onToggle={() => { setPushSystemAlerts(!pushSystemAlerts); mutateExtra('pushSystemAlerts', !pushSystemAlerts); }} />
                </div>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end">
            <Link
              href="/settings"
              className="px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              ← Back to Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
