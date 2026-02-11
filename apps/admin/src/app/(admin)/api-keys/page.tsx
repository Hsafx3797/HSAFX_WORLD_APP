/**
 * API Keys Management Page
 * View and revoke B2B API keys.
 */

'use client';

import { useState, useCallback } from 'react';
import { Key, Search, Ban, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApiKeys, useApiKeyMutations } from '@/lib/hooks';
import type { ApiKeyRecord } from '@/lib/types';
import { Card, CardContent, Button, Input, Badge, Modal } from '@/components/ui';
import { toast } from 'sonner';

export default function ApiKeysPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { apiKeys, pagination, isLoading, refresh } = useApiKeys(page, 25, search || undefined);
  const mutations = useApiKeyMutations();
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRecord | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    try {
      await mutations.revoke(revokeTarget.id);
      toast.success(`API key "${revokeTarget.name}" revoked`);
      setRevokeTarget(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke');
    }
  }, [revokeTarget, mutations, refresh]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <p className="text-sm text-muted-foreground">View and manage B2B API keys</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or prefix..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? 'No API keys match your search.' : 'No API keys found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Key Prefix</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Last Used</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{key.name}</td>
                  <td className="p-3 font-mono text-muted-foreground">{key.keyPrefix}...</td>
                  <td className="p-3">
                    <div>
                      <p className="text-sm">{key.userName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{key.userEmail}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="muted">{key.rateLimitTier}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    {key.revokedAt ? (
                      <Badge variant="danger">Revoked</Badge>
                    ) : key.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(key.lastUsed)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(key.createdAt)}</td>
                  <td className="p-3 text-right">
                    {!key.revokedAt && key.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(key)}>
                        <Ban className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Revoke Confirmation */}
      {revokeTarget && (
        <Modal
          open={!!revokeTarget}
          title="Revoke API Key"
          onClose={() => setRevokeTarget(null)}
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to revoke <strong>{revokeTarget.name}</strong> ({revokeTarget.keyPrefix}...)?
            This action is permanent and the key will stop working immediately.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke} loading={mutations.loading}>Revoke</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
