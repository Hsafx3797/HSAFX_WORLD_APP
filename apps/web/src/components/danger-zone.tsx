'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function DangerZone() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const statusQuery = trpc.user.getDeletionStatus.useQuery(undefined, {
    retry: false,
  });

  const requestDeletion = trpc.user.requestDeletion.useMutation({
    onSuccess: () => {
      toast.success('Account deletion scheduled. Check your email for details.');
      setShowModal(false);
      setPassword('');
      setConfirmText('');
      statusQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => setLoading(false),
  });

  const cancelDeletion = trpc.user.cancelDeletion.useMutation({
    onSuccess: () => {
      toast.success('Account deletion cancelled. Your account is active again.');
      statusQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const status = statusQuery.data;

  function handleRequestDeletion() {
    if (confirmText !== 'DELETE') return;
    if (!password) return;
    setLoading(true);
    requestDeletion.mutate({ password });
  }

  return (
    <section id="danger" className="bg-card border border-destructive/30 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-destructive">Danger Zone</h2>

      <div className="space-y-4">
        {/* Export Data */}
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

        {/* Delete Account */}
        <div className="border-t border-border pt-4">
          {status?.isPending ? (
            /* ── Pending deletion banner ── */
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="font-medium text-destructive">Account Deletion Scheduled</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account will be permanently deleted on{' '}
                    <strong>
                      {status.deletionDate
                        ? new Date(status.deletionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '—'}
                    </strong>
                    .{' '}
                    {status.daysRemaining !== null && (
                      <span>({status.daysRemaining} days remaining)</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => cancelDeletion.mutate()}
                disabled={cancelDeletion.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {cancelDeletion.isPending ? 'Cancelling...' : 'Cancel Deletion'}
              </button>
            </div>
          ) : (
            /* ── Normal delete button ── */
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-5">
            <div className="text-center">
              <span className="text-4xl">🗑️</span>
              <h3 className="text-lg font-semibold mt-2 text-destructive">Delete Your Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This will schedule your account for permanent deletion. You have{' '}
                <strong>14 days</strong> to change your mind.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Enter your password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>

            {/* Confirm text */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPassword('');
                  setConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={loading || confirmText !== 'DELETE' || !password}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
