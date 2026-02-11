'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Preferences {
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
  autoCopyResults: boolean;
  showKeyboardShortcuts: boolean;
  compactMode: boolean;
  defaultCategory: string;
  resultsPerPage: number;
  autoSaveHistory: boolean;
  showToolTips: boolean;
}

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoCopyResults: false,
    showKeyboardShortcuts: true,
    compactMode: false,
    defaultCategory: 'all',
    resultsPerPage: 20,
    autoSaveHistory: true,
    showToolTips: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = (key: keyof Preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof Preferences, value: string | number) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // API call to save preferences
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem('preferences', JSON.stringify(preferences));
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'text', label: 'Text Tools' },
    { value: 'converters', label: 'Data Converters' },
    { value: 'media', label: 'Media Processors' },
    { value: 'generators', label: 'Generators' },
    { value: 'calculators', label: 'Calculators' },
    { value: 'validators', label: 'Validators' },
    { value: 'crypto', label: 'Crypto & Security' },
    { value: 'dev', label: 'Developer Tools' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Preferences</span>
          </div>
          <h1 className="text-3xl font-bold">Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Customize your experience on HSAFX World
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

          {/* Appearance */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Appearance</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color theme
                  </p>
                </div>
                <select
                  value={preferences.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
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
                  <p className="text-sm text-muted-foreground">
                    Use smaller spacing and font sizes
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('compactMode')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.compactMode ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.compactMode ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
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
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Timezone</h3>
                  <p className="text-sm text-muted-foreground">
                    Used for timestamps and scheduling
                  </p>
                </div>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
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
                  <h3 className="font-medium">Default Category</h3>
                  <p className="text-sm text-muted-foreground">
                    Start browsing from this category
                  </p>
                </div>
                <select
                  value={preferences.defaultCategory}
                  onChange={(e) => handleChange('defaultCategory', e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Auto-copy Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically copy tool output to clipboard
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('autoCopyResults')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.autoCopyResults ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.autoCopyResults ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Auto-save History</h3>
                  <p className="text-sm text-muted-foreground">
                    Save tool executions to your history
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('autoSaveHistory')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.autoSaveHistory ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.autoSaveHistory ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Results Per Page</h3>
                  <p className="text-sm text-muted-foreground">
                    Number of results to show in lists
                  </p>
                </div>
                <select
                  value={preferences.resultsPerPage}
                  onChange={(e) => handleChange('resultsPerPage', parseInt(e.target.value))}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
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
                  <p className="text-sm text-muted-foreground">
                    Display keyboard shortcut hints
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('showKeyboardShortcuts')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.showKeyboardShortcuts ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.showKeyboardShortcuts ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div>
                  <h3 className="font-medium">Show Tooltips</h3>
                  <p className="text-sm text-muted-foreground">
                    Display helpful tooltips on hover
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('showToolTips')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.showToolTips ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.showToolTips ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
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
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
