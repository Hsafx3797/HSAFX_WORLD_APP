/**
 * Subscription Detail Page
 * View and manage individual subscription: details, plan management, billing actions
 */

'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  User as UserIcon,
  Play,
  Pause,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useSubscription, useSubscriptionMutations } from '@/lib/hooks';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  StatusBadge,
  Modal,
  ConfirmModal,
  TotpModal,
  FormGroup,
  Textarea,
} from '@/components/ui';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { subscription, isLoading, error, refresh } = useSubscription(id);
  const mutations = useSubscriptionMutations();

  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Form states
  const [targetPlan, setTargetPlan] = useState('');
  const [upgradeImmediate, setUpgradeImmediate] = useState(true);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [pauseMonths, setPauseMonths] = useState(1);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const handleUpgrade = useCallback(async () => {
    if (!subscription || !targetPlan) return;
    await mutations.upgrade(subscription.id, targetPlan, upgradeImmediate);
    setShowUpgradeModal(false);
    setTargetPlan('');
    refresh();
  }, [subscription, targetPlan, upgradeImmediate, mutations, refresh]);

  const handleDowngrade = useCallback(async () => {
    if (!subscription || !targetPlan) return;
    await mutations.downgrade(subscription.id, targetPlan);
    setShowDowngradeModal(false);
    setTargetPlan('');
    refresh();
  }, [subscription, targetPlan, mutations, refresh]);

  const handleCancel = useCallback(async () => {
    if (!subscription) return;
    await mutations.cancel(subscription.id, cancelImmediate);
    setShowCancelModal(false);
    refresh();
  }, [subscription, cancelImmediate, mutations, refresh]);

  const handlePause = useCallback(async () => {
    if (!subscription) return;
    await mutations.pause(subscription.id, pauseMonths);
    setShowPauseModal(false);
    refresh();
  }, [subscription, pauseMonths, mutations, refresh]);

  const handleResume = useCallback(async () => {
    if (!subscription) return;
    await mutations.resume(subscription.id);
    refresh();
  }, [subscription, mutations, refresh]);

  const handleRefund = useCallback(async (totpCode: string) => {
    if (!subscription) return;
    await mutations.refund(subscription.id, refundAmount, refundReason, totpCode);
    setShowRefundModal(false);
    setRefundAmount(0);
    setRefundReason('');
    refresh();
  }, [subscription, refundAmount, refundReason, mutations, refresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'canceled': case 'cancelled': return 'danger';
      case 'past_due': return 'danger';
      case 'trialing': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium text-foreground">Subscription not found</p>
            <p className="text-sm text-muted-foreground mt-1">The subscription may have been deleted or the ID is invalid.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/subscriptions')}>
              Back to Subscriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isPaused = subscription.status === 'paused';
  const isCanceled = subscription.status === 'canceled';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/subscriptions')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Subscription Details</h1>
          <p className="text-sm text-muted-foreground font-mono">{subscription.id}</p>
        </div>
        <Badge variant={getStatusColor(subscription.status) as any}>
          {subscription.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-xl font-bold text-foreground capitalize">{subscription.plan.replace('_', ' ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Billing Cycle</p>
            <p className="text-xl font-bold text-foreground capitalize">{subscription.billingCycle || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-xl font-bold text-success">${((subscription.amount || 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Provider</p>
            <p className="text-xl font-bold text-primary capitalize">{subscription.provider}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Subscription Info */}
        <Card>
          <CardHeader title="Subscription Information" action={<CreditCard className="h-5 w-5 text-muted-foreground" />} />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="text-foreground">{subscription.userName || subscription.userEmail}</p>
                  <p className="text-xs text-muted-foreground">{subscription.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Period</p>
                  <p className="text-foreground">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} — {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-foreground">{new Date(subscription.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {subscription.providerId && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Provider ID</p>
                    <p className="text-foreground font-mono text-sm">{subscription.providerId}</p>
                  </div>
                </div>
              )}
              {subscription.canceledAt && (
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Canceled At</p>
                    <p className="text-destructive">{new Date(subscription.canceledAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {subscription.pausedAt && (
                <div className="flex items-center gap-3">
                  <Pause className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">Paused At</p>
                    <p className="text-warning">{new Date(subscription.pausedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader title="Manage Subscription" action={<RefreshCw className="h-5 w-5 text-muted-foreground" />} />
          <CardContent>
            <div className="space-y-3">
              {isActive && (
                <>
                  <Button
                    variant="outline"
                    icon={<ArrowUpCircle className="h-4 w-4" />}
                    fullWidth
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    icon={<ArrowDownCircle className="h-4 w-4" />}
                    fullWidth
                    onClick={() => setShowDowngradeModal(true)}
                  >
                    Downgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Pause className="h-4 w-4" />}
                    fullWidth
                    onClick={() => setShowPauseModal(true)}
                  >
                    Pause Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    icon={<XCircle className="h-4 w-4" />}
                    fullWidth
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              {isPaused && (
                <Button
                  variant="primary"
                  icon={<Play className="h-4 w-4" />}
                  fullWidth
                  onClick={handleResume}
                  loading={mutations.loading}
                >
                  Resume Subscription
                </Button>
              )}
              {isCanceled && (
                <div className="text-center py-4 text-muted-foreground">
                  <XCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p>This subscription has been canceled.</p>
                </div>
              )}
              <hr className="border-border" />
              <Button
                variant="outline"
                icon={<DollarSign className="h-4 w-4" />}
                fullWidth
                onClick={() => setShowRefundModal(true)}
              >
                Issue Refund
              </Button>
              <Button
                variant="outline"
                icon={<UserIcon className="h-4 w-4" />}
                fullWidth
                onClick={() => router.push(`/users/${subscription.userId}`)}
              >
                View User Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Modal */}
      <Modal
        open={showUpgradeModal}
        onClose={() => { setShowUpgradeModal(false); setTargetPlan(''); }}
        title="Upgrade Subscription"
        description={`Current plan: ${subscription.plan}`}
      >
        <FormGroup>
          <Select
            label="Target Plan"
            options={[
              { value: '', label: 'Select plan...' },
              { value: 'starter', label: 'Starter' },
              { value: 'pro_monthly', label: 'Pro Monthly' },
              { value: 'pro_yearly', label: 'Pro Yearly' },
              { value: 'advance_monthly', label: 'Advance Monthly' },
              { value: 'advance_yearly', label: 'Advance Yearly' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={targetPlan}
            onChange={(e) => setTargetPlan(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="upgradeImmediate"
              checked={upgradeImmediate}
              onChange={(e) => setUpgradeImmediate(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="upgradeImmediate" className="text-sm text-foreground">Apply immediately (prorate)</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
            <Button onClick={handleUpgrade} loading={mutations.loading} disabled={!targetPlan}>
              Upgrade
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Downgrade Modal */}
      <Modal
        open={showDowngradeModal}
        onClose={() => { setShowDowngradeModal(false); setTargetPlan(''); }}
        title="Downgrade Subscription"
        description={`Current plan: ${subscription.plan}`}
      >
        <FormGroup>
          <Select
            label="Target Plan"
            options={[
              { value: '', label: 'Select plan...' },
              { value: 'free', label: 'Free' },
              { value: 'starter', label: 'Starter' },
              { value: 'pro_monthly', label: 'Pro Monthly' },
            ]}
            value={targetPlan}
            onChange={(e) => setTargetPlan(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Downgrade will take effect at the end of the current billing period.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDowngradeModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDowngrade} loading={mutations.loading} disabled={!targetPlan}>
              Downgrade
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Cancel Modal */}
      <ConfirmModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => handleCancel()}
        title="Cancel Subscription"
        message="Are you sure you want to cancel this subscription?"
        confirmText={cancelImmediate ? 'Cancel Immediately' : 'Cancel at Period End'}
        variant="danger"
        loading={mutations.loading}
      />

      {/* Pause Modal */}
      <Modal
        open={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        title="Pause Subscription"
      >
        <FormGroup>
          <Select
            label="Pause Duration"
            options={[
              { value: '1', label: '1 Month' },
              { value: '2', label: '2 Months' },
              { value: '3', label: '3 Months' },
            ]}
            value={String(pauseMonths)}
            onChange={(e) => setPauseMonths(parseInt(e.target.value))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPauseModal(false)}>Cancel</Button>
            <Button onClick={handlePause} loading={mutations.loading}>
              Pause Subscription
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Refund Modal */}
      <Modal
        open={showRefundModal}
        onClose={() => { setShowRefundModal(false); setRefundAmount(0); setRefundReason(''); }}
        title="Issue Refund"
        description="Process a refund for this subscription"
      >
        <FormGroup>
          <Input
            label="Refund Amount (cents)"
            type="number"
            min={1}
            value={refundAmount}
            onChange={(e) => setRefundAmount(parseInt(e.target.value) || 0)}
          />
          <Textarea
            label="Reason"
            placeholder="Reason for refund..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={2}
            required
          />
          <p className="text-sm text-muted-foreground">Requires 2FA verification.</p>
        </FormGroup>
      </Modal>

      {/* TOTP for refund */}
      {showRefundModal && refundAmount > 0 && refundReason.trim() && (
        <TotpModal
          open={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onSubmit={handleRefund}
          title="Verify Refund"
          message={`Refund $${(refundAmount / 100).toFixed(2)} — enter your 2FA code.`}
          loading={mutations.loading}
        />
      )}
    </div>
  );
}
