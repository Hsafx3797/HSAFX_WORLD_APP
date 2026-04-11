/**
 * B2B Suites Management Page
 * CRUD for B2B engine suites — slug, name, categories, active status.
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit2, Package } from 'lucide-react';
import { useB2bSuites, useB2bSuiteMutations } from '@/lib/hooks';
import type { B2bSuite } from '@/lib/types';
import { Card, CardHeader, CardContent, Button, Modal, FormGroup, Input, Toggle, Badge } from '@/components/ui';
import { toast } from 'sonner';

const emptyForm = {
  slug: '',
  name: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

export default function B2bSuitesPage() {
  const { suites, isLoading, refresh } = useB2bSuites();
  const mutations = useB2bSuiteMutations();
  const [showModal, setShowModal] = useState(false);
  const [editingSuite, setEditingSuite] = useState<B2bSuite | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingSuite(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (suite: B2bSuite) => {
    setEditingSuite(suite);
    setForm({
      slug: suite.slug,
      name: suite.name,
      description: suite.description ?? '',
      isActive: suite.isActive,
      sortOrder: suite.sortOrder,
    });
    setShowModal(true);
  };

  const handleSave = useCallback(async () => {
    try {
      if (editingSuite) {
        await mutations.update(editingSuite.id, form);
        toast.success('Suite updated');
      } else {
        await mutations.create(form);
        toast.success('Suite created');
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save suite');
    }
  }, [editingSuite, form, mutations, refresh]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">B2B Suites</h1>
          <p className="text-sm text-muted-foreground">Manage engine suites — groups of engines for quota tracking</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Create Suite
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suites.map((suite) => (
            <Card key={suite.id} className="relative">
              <CardHeader
                title={suite.name}
                description={suite.slug}
                action={
                  <Badge variant={suite.isActive ? 'success' : 'muted'}>
                    {suite.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Sort: {suite.sortOrder}</span>
                </div>
                {suite.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{suite.description}</p>
                )}
                {suite.categories && suite.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suite.categories.map((cat) => (
                      <Badge key={cat} variant="default">{cat}</Badge>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(suite)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
          {suites.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No B2B suites yet. Create your first suite to get started.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal
          open={showModal}
          title={editingSuite ? 'Edit Suite' : 'Create Suite'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <FormGroup>
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Text Processing" />
            </FormGroup>
            <FormGroup>
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="text"
                disabled={!!editingSuite}
              />
            </FormGroup>
            <FormGroup>
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Text processing engines" />
            </FormGroup>
            <FormGroup>
              <Input label="Sort Order" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} type="number" />
            </FormGroup>
            <Toggle label="Active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={mutations.loading}>
                {editingSuite ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
