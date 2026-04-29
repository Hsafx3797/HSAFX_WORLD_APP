'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { WINDOWS_TIMEZONES } from '@/lib/timezone';
import { toast } from 'sonner';

export default function PreferencesPage() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();
  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences updated');
      utils.user.getProfile.invalidate();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [compactMode, setCompactMode] = useState(false);
  const [autoCopyResults, setAutoCopyResults] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(true);
  const [showToolTips, setShowToolTips] = useState(true);

  useEffect(() => {
    if (data?.preferences) {
      setTheme((data.preferences.theme as 'system' | 'light' | 'dark') ?? 'system');
      setLanguage(data.preferences.language ?? 'en');
      setTimezone(data.preferences.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      const extras = data.preferences.preferences as Record<string, unknown> | undefined;
      if (extras) {
        setCompactMode(extras.compactMode === true);
        setAutoCopyResults(extras.autoCopyResults === true);
        setShowKeyboardShortcuts(extras.showKeyboardShortcuts !== false);
        setShowToolTips(extras.showToolTips !== false);
      }
    }
  }, [data?.preferences]);

  const mutateCol = (val: Record<string, unknown>) => updatePreferences.mutate(val as Parameters<typeof updatePreferences.mutate>[0]);
  const mutateExtra = (key: string, val: unknown) => updatePreferences.mutate({ extras: { [key]: val } });
  const busy = isLoading || updatePreferences.isPending;

  const ToggleButton = ({ checked, onToggle, disabled }: { checked: boolean; onToggle: () => void; disabled?: boolean }) => (
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
            <span>Preferences</span>
          </div>
          <h1 className="text-3xl font-bold">Preferences</h1>
          <p className="text-muted-foreground mt-2">Customize your experience on HSAFX World</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl space-y-8">
          {/* Appearance */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Appearance</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
                </div>
                <select
                  value={theme}
                  disabled={busy}
                  onChange={(e) => { const v = e.target.value as 'system' | 'light' | 'dark'; setTheme(v); mutateCol({ theme: v }); }}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Compact Mode</h3>
                  <p className="text-sm text-muted-foreground">Use smaller spacing and font sizes</p>
                </div>
                <ToggleButton checked={compactMode} disabled={busy} onToggle={() => { setCompactMode(!compactMode); mutateExtra('compactMode', !compactMode); }} />
              </div>
            </div>
          </section>

          {/* Language & Region */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Language & Region</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Language</h3>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                </div>
                <select
                  value={language}
                  disabled={busy}
                  onChange={(e) => { setLanguage(e.target.value); mutateCol({ language: e.target.value }); }}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Timezone</h3>
                  <p className="text-sm text-muted-foreground">Used for timestamps and scheduling</p>
                </div>
                <select
                  value={timezone}
                  disabled={busy}
                  onChange={(e) => { setTimezone(e.target.value); mutateCol({ timezone: e.target.value }); }}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-55"
                >
                  {WINDOWS_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Tool Behavior */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Tool Behavior</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-copy Results</h3>
                  <p className="text-sm text-muted-foreground">Automatically copy tool output to clipboard</p>
                </div>
                <ToggleButton checked={autoCopyResults} disabled={busy} onToggle={() => { setAutoCopyResults(!autoCopyResults); mutateExtra('autoCopyResults', !autoCopyResults); }} />
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Accessibility</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Keyboard Shortcuts</h3>
                  <p className="text-sm text-muted-foreground">Display keyboard shortcut hints</p>
                </div>
                <ToggleButton checked={showKeyboardShortcuts} disabled={busy} onToggle={() => { setShowKeyboardShortcuts(!showKeyboardShortcuts); mutateExtra('showKeyboardShortcuts', !showKeyboardShortcuts); }} />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Show Tooltips</h3>
                  <p className="text-sm text-muted-foreground">Display helpful tooltips on hover</p>
                </div>
                <ToggleButton checked={showToolTips} disabled={busy} onToggle={() => { setShowToolTips(!showToolTips); mutateExtra('showToolTips', !showToolTips); }} />
              </div>
            </div>
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
