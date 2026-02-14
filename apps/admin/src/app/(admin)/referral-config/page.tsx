/**
 * Referral Config Management Page
 * Key-value editor for referral reward settings.
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, Save } from 'lucide-react';
import { useReferralConfig } from '@/lib/hooks';
import type { ReferralConfigEntry } from '@/lib/types';
import {
  Card, CardContent,
  Button, Modal, FormGroup, Input, Toggle, Badge,
  DataTable,
  type Column,
} from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = {
  key: '',
  value: 0,
  description: '',
  isActive: true,
};

export default function ReferralConfigPage() {
  const { config, isLoading, refresh, upsert } = useReferralConfig();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ReferralConfigEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (entry: ReferralConfigEntry) => {
    setEditing(entry);
    setForm({
      key: entry.key,
      value: entry.value,
      description: entry.description ?? '',
      isActive: entry.isActive,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await upsert({
        key: form.key,
        value: form.value,
        description: form.description || null,
        isActive: form.isActive,
      } as Partial<ReferralConfigEntry>);
      toast.success(editing ? 'Config updated' : 'Config created');
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [editing, form, upsert, refresh]);

  const columns: Column<ReferralConfigEntry>[] = [
    { key: 'key', header: 'Key', render: (e) => <span className="font-mono text-sm">{e.key}</span> },
    { key: 'value', header: 'Value', render: (e) => <span className="font-mono">{e.value}</span> },
    { key: 'description', header: 'Description', render: (e) => (
      <span className="text-muted-foreground text-sm">{e.description ?? '—'}</span>
    )},
    { key: 'isActive', header: 'Status', render: (e) => (
      <Badge variant={e.isActive ? 'success' : 'muted'}>{e.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'updatedAt', header: 'Updated', render: (e) => (
      <span className="text-sm text-muted-foreground">{new Date(e.updatedAt).toLocaleDateString()}</span>
    )},
    { key: 'actions' as keyof ReferralConfigEntry, header: '', render: (e) => (
      <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
        <Save className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Config</h1>
          <p className="text-sm text-muted-foreground">Manage referral reward values — signup bonuses, invite coins, etc.</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Add Entry</Button>
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={config} loading={isLoading} emptyMessage="No referral config entries" />
        </CardContent>
      </Card>

      {showModal && (
        <Modal open={showModal} title={editing ? 'Edit Referral Config' : 'New Referral Config'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <FormGroup>
              <Input
                label="Key"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="referral_bonus_coins"
                disabled={!!editing}
              />
            </FormGroup>
            <FormGroup>
              <Input
                label="Value"
                type="number"
                value={String(form.value)}
                onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
              />
            </FormGroup>
            <FormGroup>
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Coins awarded to referrer when invitee signs up"
              />
            </FormGroup>
            <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>{editing ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
