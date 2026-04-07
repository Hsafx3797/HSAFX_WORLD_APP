'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ApiKeysPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: apiKeys = [], isLoading } = trpc.apiKeys.list.useQuery(undefined, { enabled: !!user });

  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setNewKeyName('');
      setShowCreateModal(false);
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      alert(error.message || 'Failed to create API key');
    },
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      alert(error.message || 'Failed to revoke API key');
    },
  });

  const createApiKey = () => {
    if (!newKeyName.trim()) return;
    generateMutation.mutate({ name: newKeyName, scopes: ['tools:read', 'tools:execute'] });
  };

  const revokeApiKey = (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    revokeMutation.mutate({ id: keyId });
  };

  if (authLoading || !user) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage your API access keys</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create API Key</Button>
      </div>

      {/* Created Key Display */}
      {createdKey && (
        <Card className="mb-8 border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <svg
                className="w-6 h-6 text-success shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-success">API Key Created</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background border rounded font-mono text-sm">
                    {createdKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKey);
                      alert('Copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
              <CardDescription>Generate a new API key for programmatic access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My API Key"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createApiKey} disabled={generateMutation.isPending || !newKeyName.trim()}>
                  {generateMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Use these keys to access the HSAFX Tools API</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 opacity-50"
              >
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              <p>No API keys yet</p>
              <p className="text-sm mt-1">Create an API key to start using the API</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant={key.isActive ? 'success' : 'secondary'}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.keyPrefix}••••••••
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-destructive" onClick={() => revokeApiKey(key.id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Link */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">API Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Learn how to use the HSAFX Tools API in your applications
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/docs/api')}>
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits Dashboard (T3.6) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>Your current API usage and rate limit quotas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Per-Minute Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Requests per Minute</span>
                <span className="text-sm text-muted-foreground">
                  {apiKeys.length > 0 ? '— / 60' : 'No active keys'}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resets every minute. Real-time tracking available via response headers.
              </p>
            </div>

            {/* Daily Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Daily Requests</span>
                <span className="text-sm text-muted-foreground">
                  {apiKeys.length > 0 ? '— / 1,000' : 'No active keys'}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resets at midnight UTC. Upgrade your plan for higher limits.
              </p>
            </div>

            {/* Monthly Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Requests</span>
                <span className="text-sm text-muted-foreground">
                  {apiKeys.length > 0 ? '— / 10,000' : 'No active keys'}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resets on the 1st of each month.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Rate Limit Headers</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Every API response includes rate limit info in headers:
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                <p><span className="text-primary">X-RateLimit-Limit:</span> 60</p>
                <p><span className="text-primary">X-RateLimit-Remaining:</span> 58</p>
                <p><span className="text-primary">X-RateLimit-Reset:</span> 1704067200</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
