/**
 * Plans Management Page
 * CRUD for subscription plans — pricing, coin grants, Polar mapping.
 */

'use client';

import { useState, useCallback } from 'react';
import { DollarSign, Plus, Edit2, CheckCircle, XCircle, Coins } from 'lucide-react';
import { usePlans, usePlanMutations } from '@/lib/hooks';
import type { Plan } from '@/lib/types';
import { Card, CardHeader, CardContent, Button, Modal, FormGroup, Input, Toggle, Badge } from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  priceMonthly: '0.00',
  priceYearly: '0.00',
  coinGrant: 0,
  polarProductId: '',
  isActive: true,
};

export default function PlansPage() {
  const { plans, isLoading, refresh } = usePlans();
  const mutations = usePlanMutations();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      priceMonthly: plan.priceMonthly ?? '0.00',
      priceYearly: plan.priceYearly ?? '0.00',
      coinGrant: plan.coinGrant,
      polarProductId: plan.polarProductId ?? '',
      isActive: plan.isActive,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    try {
      if (editingPlan) {
        await mutations.update(editingPlan.id, form);
        toast.success('Plan updated');
      } else {
        await mutations.create(form);
        toast.success('Plan created');
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save plan');
    }
  }, [editingPlan, form, mutations, refresh]);

  const formatPrice = (price?: string) => {
    if (!price) return '$0.00';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground">Manage subscription tiers and pricing</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader
                title={plan.name}
                description={plan.slug}
                action={
                  <Badge variant={plan.isActive ? 'success' : 'muted'}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPrice(plan.priceMonthly)}/mo</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{formatPrice(plan.priceYearly)}/yr</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.coinGrant} coins/cycle</span>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                )}
                {plan.polarProductId && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    Polar: {plan.polarProductId}
                  </p>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(plan)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          open={showModal}
          title={editingPlan ? 'Edit Plan' : 'Create Plan'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <FormGroup>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Professional" />
            </FormGroup>
            <FormGroup>
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="pro"
                disabled={!!editingPlan}
              />
            </FormGroup>
            <FormGroup>
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Best for professionals" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Monthly Price ($)" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} type="number" />
              </FormGroup>
              <FormGroup>
                <Input label="Yearly Price ($)" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} type="number" />
              </FormGroup>
            </div>
            <FormGroup>
              <Input label="Coin Grant (per cycle)" value={String(form.coinGrant)} onChange={(e) => setForm({ ...form, coinGrant: parseInt(e.target.value) || 0 })} type="number" />
            </FormGroup>
            <FormGroup>
              <Input label="Polar Product ID" value={form.polarProductId} onChange={(e) => setForm({ ...form, polarProductId: e.target.value })} placeholder="Optional" />
            </FormGroup>
            <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={mutations.loading}>
                {editingPlan ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
