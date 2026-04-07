/**
 * Subscriptions Management Page
 * Full CRUD for subscription management with upgrade/downgrade/cancel/pause
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  XCircle,
  PlayCircle,
  PauseCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useSubscriptions, useSubscriptionMutations } from '@/lib/hooks';
import type { Subscription, SubscriptionFilters } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  StatusBadge,
  PlanBadge,
  Modal,
  ConfirmModal,
  TotpModal,
  FormGroup,
} from '@/components/ui';
import type { Column, Action } from '@/components/ui';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SubscriptionFilters>({ page: 1, limit: 25 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [totpAction, setTotpAction] = useState<'refund' | 'cancel' | null>(null);
  
  // Form states
  const [upgradePlan, setUpgradePlan] = useState('');
  const [immediateUpgrade, setImmediateUpgrade] = useState(true);
  const [downgradePlan, setDowngradePlan] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [pauseMonths, setPauseMonths] = useState(1);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const { subscriptions, pagination, isLoading, refresh } = useSubscriptions(filters);
  const mutations = useSubscriptionMutations();

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof SubscriptionFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleViewSubscription = useCallback((sub: Subscription) => {
    router.push(`/subscriptions/${sub.id}`);
  }, [router]);

  const handleUpgrade = useCallback(async () => {
    if (!selectedSubscription || !upgradePlan) return;
    await mutations.upgrade(selectedSubscription.id, upgradePlan, immediateUpgrade);
    setShowUpgradeModal(false);
    setSelectedSubscription(null);
    setUpgradePlan('');
    refresh();
  }, [selectedSubscription, upgradePlan, immediateUpgrade, mutations, refresh]);

  const handleDowngrade = useCallback(async () => {
    if (!selectedSubscription || !downgradePlan) return;
    await mutations.downgrade(selectedSubscription.id, downgradePlan);
    setShowDowngradeModal(false);
    setSelectedSubscription(null);
    setDowngradePlan('');
    refresh();
  }, [selectedSubscription, downgradePlan, mutations, refresh]);

  const handleCancel = useCallback(async (totpCode?: string) => {
    if (!selectedSubscription) return;
    await mutations.cancel(selectedSubscription.id, cancelImmediate, totpCode);
    setShowCancelModal(false);
    setSelectedSubscription(null);
    refresh();
  }, [selectedSubscription, cancelImmediate, mutations, refresh]);

  const handlePause = useCallback(async () => {
    if (!selectedSubscription) return;
    await mutations.pause(selectedSubscription.id, pauseMonths);
    setShowPauseModal(false);
    setSelectedSubscription(null);
    refresh();
  }, [selectedSubscription, pauseMonths, mutations, refresh]);

  const handleResume = useCallback(async (sub: Subscription) => {
    await mutations.resume(sub.id);
    refresh();
  }, [mutations, refresh]);

  const handleRefund = useCallback(async (totpCode: string) => {
    if (!selectedSubscription) return;
    await mutations.refund(selectedSubscription.id, refundAmount, refundReason, totpCode);
    setShowRefundModal(false);
    setSelectedSubscription(null);
    setRefundAmount(0);
    setRefundReason('');
    refresh();
  }, [selectedSubscription, refundAmount, refundReason, mutations, refresh]);

  // Stats calculations
  const stats = {
    active: subscriptions.filter((s) => s.status === 'active').length,
    cancelled: subscriptions.filter((s) => s.status === 'canceled').length,
    pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
    trialing: subscriptions.filter((s) => s.status === 'trialing').length,
    paused: subscriptions.filter((s) => s.status === 'paused').length,
  };

  const columns: Column<Subscription>[] = [
    {
      key: 'userId',
      header: 'User',
      sortable: true,
      render: (sub) => (
        <div>
          <p className="font-medium text-foreground">{sub.user?.email || sub.userId}</p>
          <p className="text-xs text-muted-foreground">ID: {sub.id.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      width: '120px',
      render: (sub) => <PlanBadge plan={sub.plan} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (sub) => <StatusBadge status={sub.status} />,
    },
    {
      key: 'billingCycle',
      header: 'Cycle',
      sortable: true,
      width: '100px',
      render: (sub) => (
        <span className="text-sm capitalize">{sub.billingCycle}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '100px',
      render: (sub) => (
        <span className="font-mono text-sm">
          ${(sub.amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'currentPeriodEnd',
      header: 'Next Billing',
      sortable: true,
      width: '130px',
      render: (sub) => (
        <span className="text-sm text-muted-foreground">
          {sub.currentPeriodEnd 
            ? new Date(sub.currentPeriodEnd).toLocaleDateString() 
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Started',
      sortable: true,
      width: '120px',
      render: (sub) => (
        <span className="text-sm text-muted-foreground">
          {new Date(sub.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<Subscription>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewSubscription,
    },
    {
      label: 'Upgrade',
      icon: <ArrowUp className="h-4 w-4" />,
      onClick: (sub) => {
        setSelectedSubscription(sub);
        setShowUpgradeModal(true);
      },
      disabled: (sub) => sub.status !== 'active' || sub.plan === 'enterprise',
    },
    {
      label: 'Downgrade',
      icon: <ArrowDown className="h-4 w-4" />,
      onClick: (sub) => {
        setSelectedSubscription(sub);
        setShowDowngradeModal(true);
      },
      disabled: (sub) => sub.status !== 'active' || sub.plan === 'free',
    },
    {
      label: 'Pause',
      icon: <PauseCircle className="h-4 w-4" />,
      onClick: (sub) => {
        setSelectedSubscription(sub);
        setShowPauseModal(true);
      },
      disabled: (sub) => sub.status !== 'active',
    },
    {
      label: 'Resume',
      icon: <PlayCircle className="h-4 w-4" />,
      onClick: handleResume,
      disabled: (sub) => sub.status !== 'paused',
    },
    {
      label: 'Cancel',
      icon: <XCircle className="h-4 w-4" />,
      onClick: (sub) => {
        setSelectedSubscription(sub);
        setShowCancelModal(true);
      },
      variant: 'danger',
      disabled: (sub) => sub.status === 'canceled',
    },
    {
      label: 'Refund',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: (sub) => {
        setSelectedSubscription(sub);
        setRefundAmount(sub.amount);
        setShowRefundModal(true);
      },
      variant: 'danger',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <CreditCard className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">
              Manage user subscriptions and billing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Trialing</p>
            <p className="text-2xl font-bold text-primary">{stats.trialing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paused</p>
            <p className="text-2xl font-bold text-warning">{stats.paused}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Past Due</p>
            <p className="text-2xl font-bold text-chart-3">{stats.pastDue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user email or subscription ID..."
                icon={<Search className="h-4 w-4" />}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
              <Select
                label="Status"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'trialing', label: 'Trialing' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'past_due', label: 'Past Due' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
              <Select
                label="Plan"
                options={[
                  { value: '', label: 'All Plans' },
                  { value: 'starter', label: 'Starter' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
                value={filters.plan || ''}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
              />
              <Select
                label="Billing Cycle"
                options={[
                  { value: '', label: 'All Cycles' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
                value={filters.billingCycle || ''}
                onChange={(e) => handleFilterChange('billingCycle', e.target.value)}
              />
              <Select
                label="Sort By"
                options={[
                  { value: 'createdAt', label: 'Start Date' },
                  { value: 'currentPeriodEnd', label: 'Next Billing' },
                  { value: 'amount', label: 'Amount' },
                ]}
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={subscriptions}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No subscriptions found"
            onRowClick={handleViewSubscription}
            pagination={pagination ? {
              ...pagination,
              onPageChange: handlePageChange,
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Modal
        open={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setSelectedSubscription(null);
          setUpgradePlan('');
        }}
        title="Upgrade Subscription"
        description={`Current plan: ${selectedSubscription?.plan}`}
      >
        <FormGroup>
          <Select
            label="New Plan"
            options={[
              { value: 'starter', label: 'Starter', disabled: selectedSubscription?.plan === 'starter' },
              { value: 'pro', label: 'Pro', disabled: selectedSubscription?.plan === 'pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={upgradePlan}
            onChange={(e) => setUpgradePlan(e.target.value)}
            required
          />
          <Select
            label="When to Apply"
            options={[
              { value: 'true', label: 'Immediately (prorate)' },
              { value: 'false', label: 'At next billing cycle' },
            ]}
            value={immediateUpgrade.toString()}
            onChange={(e) => setImmediateUpgrade(e.target.value === 'true')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} loading={mutations.loading} disabled={!upgradePlan}>
              Upgrade
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Downgrade Modal */}
      <Modal
        open={showDowngradeModal}
        onClose={() => {
          setShowDowngradeModal(false);
          setSelectedSubscription(null);
          setDowngradePlan('');
        }}
        title="Downgrade Subscription"
        description={`Current plan: ${selectedSubscription?.plan}. Downgrade takes effect at end of billing period.`}
      >
        <FormGroup>
          <Select
            label="New Plan"
            options={[
              { value: 'free', label: 'Free' },
              { value: 'starter', label: 'Starter', disabled: selectedSubscription?.plan === 'starter' },
              { value: 'pro', label: 'Pro', disabled: selectedSubscription?.plan === 'pro' },
            ]}
            value={downgradePlan}
            onChange={(e) => setDowngradePlan(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDowngradeModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDowngrade} loading={mutations.loading} disabled={!downgradePlan}>
              Downgrade
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Cancel Modal */}
      <ConfirmModal
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={() => handleCancel()}
        title="Cancel Subscription"
        message={`Are you sure you want to cancel this subscription? ${
          cancelImmediate 
            ? 'The subscription will end immediately.' 
            : 'The subscription will remain active until the end of the billing period.'
        }`}
        confirmText="Cancel Subscription"
        variant="danger"
        loading={mutations.loading}
      />

      {/* Pause Modal */}
      <Modal
        open={showPauseModal}
        onClose={() => {
          setShowPauseModal(false);
          setSelectedSubscription(null);
          setPauseMonths(1);
        }}
        title="Pause Subscription"
        description="Temporarily pause billing. The subscription will automatically resume after the pause period."
      >
        <FormGroup>
          <Select
            label="Pause Duration"
            options={[
              { value: '1', label: '1 month' },
              { value: '2', label: '2 months' },
              { value: '3', label: '3 months' },
            ]}
            value={pauseMonths.toString()}
            onChange={(e) => setPauseMonths(parseInt(e.target.value))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPauseModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePause} loading={mutations.loading}>
              Pause Subscription
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Refund Modal */}
      <Modal
        open={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedSubscription(null);
          setRefundAmount(0);
          setRefundReason('');
        }}
        title="Process Refund"
        description="Issue a refund for this subscription."
      >
        <FormGroup>
          <Input
            label="Refund Amount (cents)"
            type="number"
            min={0}
            max={selectedSubscription?.amount || 0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(parseInt(e.target.value) || 0)}
            hint={`Max: $${((selectedSubscription?.amount || 0) / 100).toFixed(2)}`}
            required
          />
          <Input
            label="Reason"
            placeholder="Enter reason for refund"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRefundModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowRefundModal(false);
                setTotpAction('refund');
                setShowTotpModal(true);
              }}
              disabled={!refundAmount || !refundReason}
            >
              Process Refund
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* TOTP Verification Modal */}
      <TotpModal
        open={showTotpModal}
        onClose={() => {
          setShowTotpModal(false);
          setTotpAction(null);
        }}
        onSubmit={async (code) => {
          if (totpAction === 'refund') {
            await handleRefund(code);
          } else if (totpAction === 'cancel') {
            await handleCancel(code);
          }
          setShowTotpModal(false);
          setTotpAction(null);
        }}
        title={totpAction === 'refund' ? 'Confirm Refund' : 'Confirm Cancellation'}
        message={totpAction === 'refund'
          ? 'Enter your 2FA code to confirm the refund for this subscription.'
          : 'Enter your 2FA code to confirm the cancellation of this subscription.'}
        loading={mutations.loading}
      />
    </div>
  );
}
