/**
 * B2B Plans Management Page
 * CRUD for B2B subscription plans — pricing, active status.
 */

'use client';

import { useState, useCallback } from 'react';
import { DollarSign, Plus, Edit2 } from 'lucide-react';
import { useB2bPlans, useB2bPlanMutations } from '@/lib/hooks';
import type { B2bPlan } from '@/lib/types';
import { Card, CardHeader, CardContent, Button, Modal, FormGroup, Input, Toggle, Badge } from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  priceMonthlyCents: 0,
  priceYearlyCents: 0,
  isActive: true,
};

export default function B2bPlansPage() {
  const { plans, isLoading, refresh } = useB2bPlans();
  const mutations = useB2bPlanMutations();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<B2bPlan | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (plan: B2bPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      priceMonthlyCents: plan.priceMonthlyCents ?? 0,
      priceYearlyCents: plan.priceYearlyCents ?? 0,
      isActive: plan.isActive,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    try {
      if (editingPlan) {
        await mutations.update(editingPlan.id, form);
        toast.success('B2B plan updated');
      } else {
        await mutations.create(form);
        toast.success('B2B plan created');
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save B2B plan');
    }
  }, [editingPlan, form, mutations, refresh]);

  const formatPrice = (cents?: number | null) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">B2B Plans</h1>
          <p className="text-sm text-muted-foreground">Manage B2B subscription plans and pricing</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span>{formatPrice(plan.priceMonthlyCents)}/mo</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{formatPrice(plan.priceYearlyCents)}/yr</span>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                )}
                {plan.quotas && plan.quotas.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {plan.quotas.length} suite quota{plan.quotas.length > 1 ? 's' : ''}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(plan)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No B2B plans yet. Create your first plan to get started.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal
          open={showModal}
          title={editingPlan ? 'Edit B2B Plan' : 'Create B2B Plan'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <FormGroup>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enterprise" />
            </FormGroup>
            <FormGroup>
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="enterprise"
                disabled={!!editingPlan}
              />
            </FormGroup>
            <FormGroup>
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="For enterprise customers" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Input label="Monthly Price (cents)" value={String(form.priceMonthlyCents)} onChange={(e) => setForm({ ...form, priceMonthlyCents: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
              <FormGroup>
                <Input label="Yearly Price (cents)" value={String(form.priceYearlyCents)} onChange={(e) => setForm({ ...form, priceYearlyCents: parseInt(e.target.value) || 0 })} type="number" />
              </FormGroup>
            </div>
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
