/**
 * System Settings Page
 * Configure rate limits, coin rewards, maintenance mode, and integrations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Zap,
  Coins,
  Globe,
  Server,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  UserX,
} from 'lucide-react';
import { useSystemConfig, use2FAStatus, use2FAMutations } from '@/lib/hooks';
import type { SystemConfig } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Toggle,
  FormGroup,
  FormSection,
  Badge,
} from '@/components/ui';

export default function SettingsPage() {
  const { config, isLoading, update, refresh } = useSystemConfig();
  const { enabled: is2FAEnabled, refresh: refresh2FA } = use2FAStatus();
  const { loading: twoFALoading, error: twoFAError, setup, enable, disable } = use2FAMutations();
  const [localConfig, setLocalConfig] = useState<Partial<SystemConfig>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [qrData, setQrData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  // Initialize local config when data loads
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Track changes
  useEffect(() => {
    if (config && localConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(localConfig));
    }
  }, [config, localConfig]);

  const updateField = useCallback(<K extends keyof SystemConfig>(
    field: K,
    value: SystemConfig[K]
  ) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNestedField = useCallback((
    section: 'rateLimits' | 'coinRewards' | 'notifications' | 'anonymousLimits',
    field: string,
    value: number | boolean
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await update(localConfig);
    } finally {
      setSaving(false);
    }
  }, [localConfig, update]);

  const handleReset = useCallback(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure system settings and integrations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="warning" dot>Unsaved changes</Badge>
          )}
          <Button variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refresh()}>
            Refresh
          </Button>
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader title="General Settings" action={<Globe className="h-5 w-5 text-muted-foreground" />} />
          <CardContent>
            <FormGroup>
              <Input
                label="Site Name"
                value={localConfig.siteName || ''}
                onChange={(e) => updateField('siteName', e.target.value)}
              />
              <Input
                label="Support Email"
                type="email"
                value={localConfig.supportEmail || ''}
                onChange={(e) => updateField('supportEmail', e.target.value)}
              />
              <Input
                label="Admin Email"
                type="email"
                value={localConfig.adminEmail || ''}
                onChange={(e) => updateField('adminEmail', e.target.value)}
              />
              {/* Maintenance mode: synced to Redis via feature-flags PATCH → Edge Middleware returns 503 */}
              <Toggle
                label="Maintenance Mode"
                description="Temporarily disable access to the platform"
                checked={localConfig.maintenanceMode || false}
                onChange={(checked) => updateField('maintenanceMode', checked)}
              />
              {localConfig.maintenanceMode && (
                <Input
                  label="Maintenance Message"
                  placeholder="We'll be back soon..."
                  value={localConfig.maintenanceMessage || ''}
                  onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                />
              )}
            </FormGroup>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader 
            title="Rate Limits" 
            description="Requests per minute by plan"
            action={<Zap className="h-5 w-5 text-warning" />} 
          />
          <CardContent>
            <FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Guest"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.guest || 10}
                  onChange={(e) => updateNestedField('rateLimits', 'guest', parseInt(e.target.value))}
                />
                <Input
                  label="Free"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.free || 30}
                  onChange={(e) => updateNestedField('rateLimits', 'free', parseInt(e.target.value))}
                />
                <Input
                  label="Starter"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.starter || 100}
                  onChange={(e) => updateNestedField('rateLimits', 'starter', parseInt(e.target.value))}
                />
                <Input
                  label="Pro"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.pro || 300}
                  onChange={(e) => updateNestedField('rateLimits', 'pro', parseInt(e.target.value))}
                />
                <Input
                  label="Enterprise"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.enterprise || 1000}
                  onChange={(e) => updateNestedField('rateLimits', 'enterprise', parseInt(e.target.value))}
                />
                <Input
                  label="Lifetime"
                  type="number"
                  min={1}
                  value={localConfig.rateLimits?.lifetime || 500}
                  onChange={(e) => updateNestedField('rateLimits', 'lifetime', parseInt(e.target.value))}
                />
              </div>
            </FormGroup>
          </CardContent>
        </Card>

        {/* Coin Rewards */}
        <Card>
          <CardHeader 
            title="Coin Rewards" 
            description="Configure ad reward amounts"
            action={<Coins className="h-5 w-5 text-chart-3" />} 
          />
          <CardContent>
            <FormGroup>
              <Toggle
                label="Enable Ad Rewards"
                description="Allow users to earn coins by watching ads"
                checked={localConfig.coinRewards?.enabled || false}
                onChange={(checked) => updateNestedField('coinRewards', 'enabled', checked)}
              />
              {localConfig.coinRewards?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Reward per Ad"
                    type="number"
                    min={1}
                    value={localConfig.coinRewards?.rewardPerAd || 5}
                    onChange={(e) => updateNestedField('coinRewards', 'rewardPerAd', parseInt(e.target.value))}
                  />
                  <Input
                    label="Daily Limit"
                    type="number"
                    min={1}
                    value={localConfig.coinRewards?.dailyLimit || 50}
                    onChange={(e) => updateNestedField('coinRewards', 'dailyLimit', parseInt(e.target.value))}
                  />
                  <Input
                    label="Cooldown (seconds)"
                    type="number"
                    min={0}
                    value={localConfig.coinRewards?.cooldownSeconds || 300}
                    onChange={(e) => updateNestedField('coinRewards', 'cooldownSeconds', parseInt(e.target.value))}
                  />
                  <Input
                    label="Sign-up Bonus"
                    type="number"
                    min={0}
                    value={localConfig.coinRewards?.signupBonus || 100}
                    onChange={(e) => updateNestedField('coinRewards', 'signupBonus', parseInt(e.target.value))}
                  />
                </div>
              )}
            </FormGroup>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader 
            title="Notifications" 
            description="System notification settings"
            action={<Bell className="h-5 w-5 text-primary" />} 
          />
          <CardContent>
            <FormGroup>
              <Toggle
                label="Email Notifications"
                description="Send email notifications to admins"
                checked={localConfig.notifications?.email || false}
                onChange={(checked) => updateNestedField('notifications', 'email', checked)}
              />
              <Toggle
                label="Slack Notifications"
                description="Send notifications to Slack channel"
                checked={localConfig.notifications?.slack || false}
                onChange={(checked) => updateNestedField('notifications', 'slack', checked)}
              />
              <Toggle
                label="Error Alerts"
                description="Get notified about system errors"
                checked={localConfig.notifications?.errorAlerts || false}
                onChange={(checked) => updateNestedField('notifications', 'errorAlerts', checked)}
              />
              <Toggle
                label="New User Alerts"
                description="Get notified when new users sign up"
                checked={localConfig.notifications?.newUserAlerts || false}
                onChange={(checked) => updateNestedField('notifications', 'newUserAlerts', checked)}
              />
            </FormGroup>
          </CardContent>
        </Card>

        {/* Anonymous Limits */}
        <Card>
          <CardHeader 
            title="Anonymous Limits" 
            description="Daily limits for unauthenticated users"
            action={<UserX className="h-5 w-5 text-chart-3" />} 
          />
          <CardContent>
            <FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Text Tools"
                  type="number"
                  min={0}
                  value={localConfig.anonymousLimits?.textTools || 5}
                  onChange={(e) => updateNestedField('anonymousLimits', 'textTools', parseInt(e.target.value))}
                />
                <Input
                  label="Code Tools"
                  type="number"
                  min={0}
                  value={localConfig.anonymousLimits?.codeTools || 3}
                  onChange={(e) => updateNestedField('anonymousLimits', 'codeTools', parseInt(e.target.value))}
                />
                <Input
                  label="File Tools"
                  type="number"
                  min={0}
                  value={localConfig.anonymousLimits?.fileTools || 2}
                  onChange={(e) => updateNestedField('anonymousLimits', 'fileTools', parseInt(e.target.value))}
                />
                <Input
                  label="Generators"
                  type="number"
                  min={0}
                  value={localConfig.anonymousLimits?.generators || 3}
                  onChange={(e) => updateNestedField('anonymousLimits', 'generators', parseInt(e.target.value))}
                />
              </div>
              <Toggle
                label="Require CAPTCHA for VPN"
                description="Show CAPTCHA to users connecting via known VPN IPs"
                checked={localConfig.anonymousLimits?.requireCaptchaForVPN || false}
                onChange={(checked) => updateNestedField('anonymousLimits', 'requireCaptchaForVPN', checked)}
              />
            </FormGroup>
          </CardContent>
        </Card>
      </div>

      {/* External Services */}
      <Card>
        <CardHeader 
          title="External Services" 
          description="Connected integrations and services"
          action={<Server className="h-5 w-5 text-muted-foreground" />} 
        />
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Polar */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Polar</h3>
                <Badge variant="success" dot>Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Billing & subscription management</p>
              <Button variant="outline" size="sm" fullWidth>Configure</Button>
            </div>

            {/* Cloudflare R2 */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Cloudflare R2</h3>
                <Badge variant="success" dot>Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">File storage</p>
              <Button variant="outline" size="sm" fullWidth>Configure</Button>
            </div>

            {/* Redis */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Redis (Upstash)</h3>
                <Badge variant="success" dot>Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Caching & rate limiting</p>
              <Button variant="outline" size="sm" fullWidth>Configure</Button>
            </div>

            {/* BetterAuth */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">BetterAuth</h3>
                <Badge variant="success" dot>Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Authentication</p>
              <Button variant="outline" size="sm" fullWidth>Configure</Button>
            </div>

            {/* OpenPanel */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">OpenPanel</h3>
                <Badge variant="muted" dot>Not Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Analytics</p>
              <Button variant="outline" size="sm" fullWidth>Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader 
          title="Security" 
          description="Access control and security settings"
          action={<Shield className="h-5 w-5 text-destructive" />} 
        />
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <FormGroup>
              <Toggle
                label="Require 2FA for Admins"
                description="All admin users must enable two-factor authentication"
                checked={localConfig.security?.require2FA || true}
                onChange={(checked) => setLocalConfig((prev) => ({
                  ...prev,
                  security: { ...prev.security, require2FA: checked },
                }))}
              />
              <Toggle
                label="IP Allowlist"
                description="Restrict admin access to specific IP addresses"
                checked={localConfig.security?.ipAllowlist || false}
                onChange={(checked) => setLocalConfig((prev) => ({
                  ...prev,
                  security: { ...prev.security, ipAllowlist: checked },
                }))}
              />
            </FormGroup>
            <FormGroup>
              <Input
                label="Session Timeout (minutes)"
                type="number"
                min={5}
                value={localConfig.security?.sessionTimeout || 60}
                onChange={(e) => setLocalConfig((prev) => ({
                  ...prev,
                  security: { ...prev.security, sessionTimeout: parseInt(e.target.value) },
                }))}
              />
              <Input
                label="Max Login Attempts"
                type="number"
                min={1}
                value={localConfig.security?.maxLoginAttempts || 5}
                onChange={(e) => setLocalConfig((prev) => ({
                  ...prev,
                  security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) },
                }))}
              />
            </FormGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            Save All Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Personal 2FA Setup */}
      <Card>
        <CardHeader
          title="Two-Factor Authentication"
          description="Protect your admin account with TOTP-based 2FA. Required for destructive operations."
          action={
            is2FAEnabled
              ? <Badge variant="success" dot>Enabled</Badge>
              : <Badge variant="warning" dot>Disabled</Badge>
          }
        />
        <CardContent>
          {is2FAEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                <Lock className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">2FA is active</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with a time-based one-time password.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Disable 2FA</p>
                <p className="text-sm text-muted-foreground">
                  Enter your current 2FA code to disable two-factor authentication.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="6-digit code"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-40"
                  />
                  <Button
                    variant="destructive"
                    icon={<Unlock className="h-4 w-4" />}
                    loading={twoFALoading}
                    disabled={disableCode.length !== 6}
                    onClick={async () => {
                      try {
                        await disable(disableCode);
                        setDisableCode('');
                        refresh2FA();
                      } catch {}
                    }}
                  >
                    Disable 2FA
                  </Button>
                </div>
                {twoFAError && (
                  <p className="text-sm text-destructive">{twoFAError}</p>
                )}
              </div>
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <img src={qrData.qrDataUrl} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Or enter this secret manually:</p>
                  <code className="text-xs text-foreground bg-background px-2 py-1 rounded break-all">
                    {qrData.secret}
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Verify Setup</p>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator to confirm setup.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="6-digit code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-40"
                  />
                  <Button
                    icon={<CheckCircle className="h-4 w-4" />}
                    loading={twoFALoading}
                    disabled={totpCode.length !== 6}
                    onClick={async () => {
                      try {
                        await enable(totpCode);
                        setTotpCode('');
                        setQrData(null);
                        refresh2FA();
                      } catch {}
                    }}
                  >
                    Verify & Enable
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setQrData(null); setTotpCode(''); }}
                  >
                    Cancel
                  </Button>
                </div>
                {twoFAError && (
                  <p className="text-sm text-destructive">{twoFAError}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">2FA is not enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Enable two-factor authentication to perform destructive operations like deleting users, refunding subscriptions, or adjusting billing.
                  </p>
                </div>
              </div>
              <Button
                icon={<Shield className="h-4 w-4" />}
                loading={twoFALoading}
                onClick={async () => {
                  try {
                    const data = await setup();
                    setQrData({ secret: data.secret, qrDataUrl: data.qrDataUrl });
                  } catch {}
                }}
              >
                Setup Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
