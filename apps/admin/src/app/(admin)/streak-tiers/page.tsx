/**
 * Streak Tiers Management Page
 * CRUD for daily login streak reward tiers.
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useStreakTiers, useStreakTierMutations } from '@/lib/hooks';
import type { StreakTier } from '@/lib/types';
import {
  Card, CardContent,
  Button, Modal, ConfirmModal,
  FormGroup, Input, Toggle, Badge,
  DataTable,
  type Column,
} from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  minDays: 1,
  maxDays: '' as string | number,
  coinsReward: 10,
  badgeIcon: '',
  isActive: true,
  sortOrder: 0,
};

export default function StreakTiersPage() {
  const { tiers, isLoading, refresh } = useStreakTiers();
  const mutations = useStreakTierMutations();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StreakTier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<StreakTier | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: tiers.length });
    setShowModal(true);
  };

  const openEdit = (tier: StreakTier) => {
    setEditing(tier);
    setForm({
      name: tier.name,
      minDays: tier.minDays,
      maxDays: tier.maxDays ?? '',
      coinsReward: tier.coinsReward,
      badgeIcon: tier.badgeIcon ?? '',
      isActive: tier.isActive,
      sortOrder: tier.sortOrder,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    const payload = {
      ...form,
      maxDays: form.maxDays === '' ? null : Number(form.maxDays),
      badgeIcon: form.badgeIcon || null,
    };
    try {
      if (editing) {
        await mutations.update(editing.id, payload);
        toast.success('Streak tier updated');
      } else {
        await mutations.create(payload);
        toast.success('Streak tier created');
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    }
  }, [editing, form, mutations, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await mutations.remove(deleteTarget.id);
      toast.success('Streak tier deleted');
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }, [deleteTarget, mutations, refresh]);

  const columns: Column<StreakTier>[] = [
    { key: 'sortOrder', header: '#', render: (t) => t.sortOrder },
    { key: 'name', header: 'Name', render: (t) => (
      <span className="font-medium">{t.badgeIcon ? `${t.badgeIcon} ` : ''}{t.name}</span>
    )},
    { key: 'minDays', header: 'Days Range', render: (t) => (
      t.maxDays ? `${t.minDays}–${t.maxDays}` : `${t.minDays}+`
    )},
    { key: 'coinsReward', header: 'Coins', render: (t) => (
      <span className="font-mono">{t.coinsReward}</span>
    )},
    { key: 'isActive', header: 'Status', render: (t) => (
      <Badge variant={t.isActive ? 'success' : 'muted'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions' as keyof StreakTier, header: '', render: (t) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Edit2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Streak Tiers</h1>
          <p className="text-sm text-muted-foreground">Configure daily login streak reward tiers</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Add Tier</Button>
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={tiers} loading={isLoading} emptyMessage="No streak tiers configured" />
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal open={showModal} title={editing ? 'Edit Streak Tier' : 'New Streak Tier'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <FormGroup>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bronze Streak" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Min Days" type="number" value={String(form.minDays)} onChange={(e) => setForm({ ...form, minDays: parseInt(e.target.value) || 0 })} />
              </FormGroup>
              <FormGroup>
                <Input label="Max Days (blank = unlimited)" type="number" value={String(form.maxDays)} onChange={(e) => setForm({ ...form, maxDays: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} placeholder="∞" />
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Coins Reward" type="number" value={String(form.coinsReward)} onChange={(e) => setForm({ ...form, coinsReward: parseInt(e.target.value) || 0 })} />
              </FormGroup>
              <FormGroup>
                <Input label="Sort Order" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </FormGroup>
            </div>
            <FormGroup>
              <Input label="Badge Icon (emoji)" value={form.badgeIcon} onChange={(e) => setForm({ ...form, badgeIcon: e.target.value })} placeholder="🔥" />
            </FormGroup>
            <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={mutations.loading}>{editing ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          title="Delete Streak Tier"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
