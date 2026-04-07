/**
 * B2B Subscriptions Management Page
 * DataTable with search, status filter, and create/edit.
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { useB2bSubscriptions, useB2bSubscriptionMutations, useB2bPlans } from '@/lib/hooks';
import type { B2bSubscription } from '@/lib/types';
import {
  DataTable, Button, Modal, FormGroup, Input, Select, Badge,
  type Column, type Action,
} from '@/components/ui';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['active', 'canceled', 'expired', 'past_due', 'trialing'] as const;

export default function B2bSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { subscriptions, total, totalPages, isLoading, refresh } = useB2bSubscriptions({ page, limit: 20, status: statusFilter || undefined, search: search || undefined });
  const mutations = useB2bSubscriptionMutations();
  const { plans } = useB2bPlans();

  const [showCreate, setShowCreate] = useState(false);
  const [editingSub, setEditingSub] = useState<B2bSubscription | null>(null);
  const [form, setForm] = useState({
    userId: '',
    b2bPlanId: '',
    billingCycle: 'monthly',
    currentPeriodStart: '',
    currentPeriodEnd: '',
    resetDayOfMonth: 1,
  });
  const [editForm, setEditForm] = useState({
    status: '' as string,
    b2bPlanId: '' as string,
    cancelAtPeriodEnd: false,
  });

  const openCreate = () => {
    setForm({ userId: '', b2bPlanId: '', billingCycle: 'monthly', currentPeriodStart: '', currentPeriodEnd: '', resetDayOfMonth: 1 });
    setShowCreate(true);
  };

  const openEdit = (sub: B2bSubscription) => {
    setEditingSub(sub);
    setEditForm({
      status: sub.status,
      b2bPlanId: sub.b2bPlanId,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });
  };

  const handleCreate = useCallback(async () => {
    try {
      await mutations.create(form);
      toast.success('B2B subscription created');
      setShowCreate(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create subscription');
    }
  }, [form, mutations, refresh]);

  const handleUpdate = useCallback(async () => {
    if (!editingSub) return;
    try {
      await mutations.update(editingSub.id, editForm as Partial<B2bSubscription>);
      toast.success('Subscription updated');
      setEditingSub(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update subscription');
    }
  }, [editingSub, editForm, mutations, refresh]);

  const statusVariant = (s: string) => {
    switch (s) {
      case 'active': return 'success';
      case 'canceled': case 'expired': return 'muted';
      case 'past_due': return 'warning';
      case 'trialing': return 'default';
      default: return 'default';
    }
  };

  const columns: Column<B2bSubscription>[] = [
    { key: 'userName', header: 'User', render: (s) => <div><div className="font-medium">{s.userName}</div><div className="text-xs text-muted-foreground">{s.userEmail}</div></div> },
    { key: 'planName', header: 'Plan', render: (s) => <span className="font-mono text-xs">{s.planSlug}</span> },
    { key: 'status', header: 'Status', render: (s) => <Badge variant={statusVariant(s.status) as 'success' | 'muted' | 'warning' | 'default'}>{s.status}</Badge> },
    { key: 'billingCycle', header: 'Cycle' },
    { key: 'currentPeriodEnd', header: 'Period End', render: (s) => new Date(s.currentPeriodEnd).toLocaleDateString() },
    { key: 'createdAt', header: 'Created', sortable: true, render: (s) => new Date(s.createdAt).toLocaleDateString() },
  ];

  const actions: Action<B2bSubscription>[] = [
    { label: 'Edit', icon: <Edit2 className="h-3 w-3" />, onClick: openEdit },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">B2B Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{total} subscription{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Create Subscription
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable
        data={subscriptions}
        columns={columns}
        actions={actions}
        loading={isLoading}
        searchable
        searchPlaceholder="Search by user name or email..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        pagination={{ page, limit: 20, total, totalPages, onPageChange: setPage }}
        emptyMessage="No B2B subscriptions found"
      />

      {/* Create Modal */}
      {showCreate && (
        <Modal open={showCreate} title="Create B2B Subscription" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <FormGroup>
              <Input label="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="user_..." />
            </FormGroup>
            <FormGroup>
              <Select
                label="Plan"
                value={form.b2bPlanId}
                onChange={(e) => setForm({ ...form, b2bPlanId: e.target.value })}
                options={plans.map((p) => ({ value: p.id, label: `${p.name} (${p.slug})` }))}
              />
            </FormGroup>
            <FormGroup>
              <Select
                label="Billing Cycle"
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]}
              />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Period Start" type="date" value={form.currentPeriodStart} onChange={(e) => setForm({ ...form, currentPeriodStart: e.target.value })} />
              </FormGroup>
              <FormGroup>
                <Input label="Period End" type="date" value={form.currentPeriodEnd} onChange={(e) => setForm({ ...form, currentPeriodEnd: e.target.value })} />
              </FormGroup>
            </div>
            <FormGroup>
              <Input label="Reset Day of Month" type="number" value={String(form.resetDayOfMonth)} onChange={(e) => setForm({ ...form, resetDayOfMonth: parseInt(e.target.value) || 1 })} />
            </FormGroup>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} loading={mutations.loading}>Create</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingSub && (
        <Modal open={!!editingSub} title="Edit Subscription" onClose={() => setEditingSub(null)}>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              User: {editingSub.userName} ({editingSub.userEmail})
            </div>
            <FormGroup>
              <Select
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              />
            </FormGroup>
            <FormGroup>
              <Select
                label="Plan"
                value={editForm.b2bPlanId}
                onChange={(e) => setEditForm({ ...editForm, b2bPlanId: e.target.value })}
                options={plans.map((p) => ({ value: p.id, label: `${p.name} (${p.slug})` }))}
              />
            </FormGroup>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.cancelAtPeriodEnd}
                onChange={(e) => setEditForm({ ...editForm, cancelAtPeriodEnd: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label className="text-sm text-foreground">Cancel at period end</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingSub(null)}>Cancel</Button>
              <Button onClick={handleUpdate} loading={mutations.loading}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
