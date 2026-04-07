/**
 * User Detail Page
 * View and manage individual user: profile, subscription, coins, activity, actions
 */

'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Shield,
  Coins,
  Clock,
  Activity,
  Ban,
  CheckCircle,
  Key,
  Hash,
  AlertTriangle,
  Trash2,
  UserCheck,
  UserCheck,
} from 'lucide-react';
import * as api from '@/lib/api';
import { useUser, useUserMutations, useUserActivity } from '@/lib/hooks';
import * as api from '@/lib/api';
import type { UserActivity } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Badge,
  StatusBadge,
  TierBadge,
  Modal,
  ConfirmModal,
  TotpModal,
  FormGroup,
  Textarea,
} from '@/components/ui';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, isLoading, error, refresh } = useUser(id);
  const mutations = useUserMutations();
  const { activity, isLoading: activityLoading } = useUserActivity(id);

  // Modal states
  const [showBanModal, setShowBanModal] = useState(false);
  const [showAdjustCoinsModal, setShowAdjustCoinsModal] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonating, setImpersonating] = useState(false);

  // Form states
  const [banReason, setBanReason] = useState('');
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinReason, setCoinReason] = useState('');

  const handleBan = useCallback(async () => {
    if (!user) return;
    await mutations.ban(user.id, banReason);
    setBanReason('');
    setShowBanModal(false);
    refresh();
  }, [user, banReason, mutations, refresh]);

  const handleUnban = useCallback(async () => {
    if (!user) return;
    await mutations.unban(user.id);
    refresh();
  }, [user, mutations, refresh]);

  const handleResetPassword = useCallback(async () => {
    if (!user)Impersonate = useCallback(async () => {
    if (!user || !impersonateReason.trim()) return;
    setImpersonating(true);
    try {
      const res = await api.startImpersonation(user.id, impersonateReason.trim());
      if (!res.success) throw new Error(res.error?.message || 'Failed to start impersonation');
      setShowImpersonateModal(false);
      setImpersonateReason('');
      window.open('/', '_blank');
    } catch {
      // Error handled by API response
    } finally {
      setImpersonating(false);
    }
  }, [user, impersonateReason]);

  const handle return;
    await mutations.resetPassword(user.id);
    setShowResetPasswordModal(false);
  }, [user, mutations]);

  const handleImpersonate = useCallback(async () => {
    if (!user || !impersonateReason.trim()) return;
    setImpersonating(true);
    try {
      const res = await api.startImpersonation(user.id, impersonateReason.trim());
      if (!res.success) throw new Error(res.error?.message || 'Failed to start impersonation');
      setShowImpersonateModal(false);
      setImpersonateReason('');
      window.open('/', '_blank');
    } catch {
      // Error handled by API response
    } finally {
      setImpersonating(false);
    }
  }, [user, impersonateReason]);

  const handleAdjustCoins = useCallback(async (totpCode: string) => {
    if (!user) return;
    await mutations.adjustCoins(user.id, coinAmount, coinReason, totpCode);
    setCoinAmount(0);
    setCoinReason('');
    setShowAdjustCoinsModal(false);
    refresh();
  }, [user, coinAmount, coinReason, mutations, refresh]);

  const handleDelete = useCallback(async (totpCode: string) => {
    if (!user) return;
    await mutations.remove(user.id, totpCode);
    router.push('/users');
  }, [user, mutations, router]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium text-foreground">User not found</p>
            <p className="text-sm text-muted-foreground mt-1">The user may have been deleted or the ID is invalid.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/users')}>
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/users')}>
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <UserIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name || user.email}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={user.status} />
                <TierBadge tier={user.tier} />
                {user.emailVerified && <Badge variant="success" dot>Verified</Badge>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 'banned' ? (
            <Button variant="outline" icon={<CheckCircle className="h-4 w-4" />} onClick={handleUnban} loading={mutations.loading}>
              Unban User
            </Button>
          ) : (
            <Button variant="destructive" icon={<Ban className="h-4 w-4" />} onClick={() => setShowBanModal(true)}>
              Ban User
            </Button>
          )}
          <Button variant="outline" icon={<Key className="h-4 w-4" />} onClick={() => setShowResetPasswordModal(true)}>
            Reset Password
          </Button>
          <Button variant="outline" icon={<UserCheck className="h-4 w-4" />} onClick={() => setShowImpersonateModal(true)}>
            Impersonate
          </Button>
        </div>
      </div>

      {/* Profile + Subscription */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Profile Information" action={<UserIcon className="h-5 w-5 text-muted-foreground" />} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="text-foreground font-mono text-sm">{user.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <TierBadge tier={user.tier} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {user.lastActiveAt && (
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Active</p>
                    <p className="text-foreground">{new Date(user.lastActiveAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Subscription & Billing" action={<Coins className="h-5 w-5 text-chart-3" />} />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-bold text-foreground capitalize">{user.subscription?.plan || 'Free'}</p>
                </div>
                {user.subscription && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/subscriptions?search=${user.email}`)}>
                    View Subscription
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Coin Balance</p>
                  <p className="text-2xl font-bold text-chart-3">{user.coinBalance.toLocaleString()} 🪙</p>
                </div>
                <div className="p-3 border border-border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">{user.totalSpent.toLocaleString()} 🪙</p>
                </div>
              </div>
              <div className="p-3 border border-border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold text-primary">{user.totalExecutions.toLocaleString()}</p>
              </div>
              <Button
                variant="outline"
                icon={<Coins className="h-4 w-4" />}
                fullWidth
                onClick={() => setShowAdjustCoinsModal(true)}
              >
                Adjust Coin Balance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader title="Recent Activity" description="Last 50 actions" action={<Activity className="h-5 w-5 text-muted-foreground" />} />
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !activity?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activity.map((item: UserActivity) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    {item.toolName && (
                      <p className="text-xs text-muted-foreground">Tool: {item.toolName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                    {item.ip && <p className="text-xs text-muted-foreground font-mono">{item.ip}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader title="Danger Zone" action={<AlertTriangle className="h-5 w-5 text-destructive" />} />
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-foreground">Delete User Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently remove this user and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" icon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteModal(true)}>
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ban Modal */}
      <Modal
        open={showBanModal}
        onClose={() => setShowBanModal(false)}
        title="Ban User"
        description={`Are you sure you want to ban ${user.email}?`}
      >
        <FormGroup>
          <Textarea
            label="Ban Reason"
            placeholder="Enter reason for banning this user..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={3}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowBanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} loading={mutations.loading} disabled={!banReason.trim()}>
              Ban User
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Reset Password Confirm */}
      <ConfirmModal
        open={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Send a password reset email to ${user.email}?`}
        confirmText="Send Reset Email"
        loading={mutations.loading}
      />

      {/* Adjust Coins Modal */}
      <Modal
        open={showAdjustCoinsModal}
        onClose={() => {
          setShowAdjustCoinsModal(false);
          setCoinAmount(0);
          setCoinReason('');
        }}
        title="Adjust Coin Balance"
        description={`Current balance: ${user.coinBalance.toLocaleString()} coins`}
      >
        <FormGroup>
          <Input
            label="Amount (positive to add, negative to deduct)"
            type="number"
            value={coinAmount}
            onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Reason"
            placeholder="Reason for adjustment..."
            value={coinReason}
            onChange={(e) => setCoinReason(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            New balance: {(user.coinBalance + coinAmount).toLocaleString()} coins
          </p>
          <p className="text-xs text-muted-foreground">
            Requires 2FA verification to complete.
          </p>
        </FormGroup>
      </Modal>

      {/* TOTP modal for coin adjustment — triggered from Adjust Coins */}
      {showAdjustCoinsModal && coinAmount !== 0 && coinReason.trim() && (
        <TotpModal
          open={showAdjustCoinsModal}
          onClose={() => setShowAdjustCoinsModal(false)}
          onSubmit={handleAdjustCoins}
          title="Verify 2FA"
          message="Enter your 2FA code to confirm the coin adjustment."
          loading={mutations.loading}
        />
      )}

      {/* Delete User TOTP */}
      <TotpModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSubmit={handleDelete}
        title="Delete User"
        message={`This will permanently delete ${user.email}. Enter your 2FA code to confirm.`}
        loading={mutations.loading}
      />

      {/* Impersonate Modal */}
      <Modal
        open={showImpersonateModal}
        onClose={() => { setShowImpersonateModal(false); setImpersonateReason(''); }}
        title="Impersonate User"
        description={`You are about to impersonate ${user.name || user.email}. This action will be audited.`}
      >
        <FormGroup>
          <Textarea
            label="Reason (required, min 10 characters)"
            placeholder="Enter the reason for impersonation..."
            value={impersonateReason}
            onChange={(e) => setImpersonateReason(e.target.value)}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground">
            Requires 2FA verification. Session expires after 1 hour. Write actions are restricted.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowImpersonateModal(false); setImpersonateReason(''); }}>Cancel</Button>
            <Button onClick={handleImpersonate} loading={impersonating} disabled={impersonateReason.trim().length < 10}>
              Start Impersonation
            </Button>
          </div>
        </FormGroup>
      </Modal>
    </div>
  );
}
