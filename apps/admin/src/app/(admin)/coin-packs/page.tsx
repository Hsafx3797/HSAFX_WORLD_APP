/**
 * Coin Packs Management Page
 * CRUD for purchasable coin bundles.
 */

'use client';

import { useState, useCallback } from 'react';
import { Coins, Plus, Edit2, Trash2 } from 'lucide-react';
import { useCoinPacks, useCoinPackMutations } from '@/lib/hooks';
import type { CoinPack } from '@/lib/types';
import { Card, CardHeader, CardContent, Button, Modal, FormGroup, Input, Toggle, Badge } from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = { name: '', coins: 0, priceInCents: 0, bonusCoins: 0, isActive: true, sortOrder: 0 };

export default function CoinPacksPage() {
  const { coinPacks, isLoading, refresh } = useCoinPacks();
  const mutations = useCoinPackMutations();
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState<CoinPack | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showDelete, setShowDelete] = useState<CoinPack | null>(null);

  const openCreate = () => {
    setEditingPack(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (pack: CoinPack) => {
    setEditingPack(pack);
    setForm({
      name: pack.name,
      coins: pack.coins,
      priceInCents: pack.priceInCents,
      bonusCoins: pack.bonusCoins,
      isActive: pack.isActive,
      sortOrder: pack.sortOrder,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    try {
      if (editingPack) {
        await mutations.update(editingPack.id, form);
        toast.success('Coin pack updated');
      } else {
        await mutations.create(form);
        toast.success('Coin pack created');
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    }
  }, [editingPack, form, mutations, refresh]);

  const handleDelete = useCallback(async () => {
    if (!showDelete) return;
    try {
      await mutations.remove(showDelete.id);
      toast.success('Coin pack deleted');
      setShowDelete(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }, [showDelete, mutations, refresh]);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coin Packs</h1>
          <p className="text-sm text-muted-foreground">Manage purchasable coin bundles</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Create Coin Pack
        </Button>
      </div>

      {/* Packs Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : coinPacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No coin packs configured. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-right p-3 font-medium">Coins</th>
                <th className="text-right p-3 font-medium">Bonus</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-right p-3 font-medium">Price</th>
                <th className="text-right p-3 font-medium">$/coin</th>
                <th className="text-center p-3 font-medium">Active</th>
                <th className="text-center p-3 font-medium">Order</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coinPacks.map((pack) => (
                <tr key={pack.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{pack.name}</td>
                  <td className="p-3 text-right">{pack.coins}</td>
                  <td className="p-3 text-right text-success">{pack.bonusCoins > 0 ? `+${pack.bonusCoins}` : '—'}</td>
                  <td className="p-3 text-right font-medium">{pack.coins + pack.bonusCoins}</td>
                  <td className="p-3 text-right">{formatPrice(pack.priceInCents)}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {formatPrice(Math.round(pack.priceInCents / (pack.coins + pack.bonusCoins)))}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={pack.isActive ? 'success' : 'muted'}>
                      {pack.isActive ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{pack.sortOrder}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(pack)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowDelete(pack)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          open={showModal}
          title={editingPack ? 'Edit Coin Pack' : 'Create Coin Pack'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <FormGroup>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Starter Pack" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Coins" value={String(form.coins)} onChange={(e) => setForm({ ...form, coins: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
              <FormGroup>
                <Input label="Bonus Coins" value={String(form.bonusCoins)} onChange={(e) => setForm({ ...form, bonusCoins: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Price (cents)" value={String(form.priceInCents)} onChange={(e) => setForm({ ...form, priceInCents: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
              <FormGroup>
                <Input label="Sort Order" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
            </div>
            <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={mutations.loading}>
                {editingPack ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <Modal
          open={!!showDelete}
          title="Delete Coin Pack"
          onClose={() => setShowDelete(null)}
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{showDelete.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={mutations.loading}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
