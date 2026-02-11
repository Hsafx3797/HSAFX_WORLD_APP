/**
 * Feature Flags Management Page
 * Toggle features, manage rollouts, and control A/B tests
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Flag,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Percent,
} from 'lucide-react';
import { useFeatureFlags, useFeatureFlagMutations } from '@/lib/hooks';
import type { FeatureFlag } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Toggle,
  Badge,
  Modal,
  ConfirmModal,
  FormGroup,
  Textarea,
} from '@/components/ui';
import type { Column, Action } from '@/components/ui';

export default function FeatureFlagsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 100,
    targetUserIds: '',
    targetPlan: '',
  });

  const { featureFlags, isLoading, refresh } = useFeatureFlags();
  const mutations = useFeatureFlagMutations();

  const filteredFlags = featureFlags.filter(
    (flag) =>
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = useCallback(() => {
    setFormData({
      key: '',
      name: '',
      description: '',
      enabled: false,
      rolloutPercentage: 100,
      targetUserIds: '',
      targetPlan: '',
    });
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description || '',
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage || 100,
      targetUserIds: flag.targetUserIds?.join(', ') || '',
      targetPlan: flag.targetPlan || '',
    });
    setShowEditModal(true);
  }, []);

  const handleCreate = useCallback(async () => {
    await mutations.create({
      key: formData.key,
      name: formData.name,
      description: formData.description,
      enabled: formData.enabled,
      rolloutPercentage: formData.rolloutPercentage,
      targetUserIds: formData.targetUserIds ? formData.targetUserIds.split(',').map((s) => s.trim()) : undefined,
      targetPlan: (formData.targetPlan || undefined) as any,
    });
    setShowCreateModal(false);
    resetForm();
    refresh();
  }, [formData, mutations, resetForm, refresh]);

  const handleUpdate = useCallback(async () => {
    if (!selectedFlag) return;
    await mutations.update(selectedFlag.id, {
      name: formData.name,
      description: formData.description,
      enabled: formData.enabled,
      rolloutPercentage: formData.rolloutPercentage,
      targetUserIds: formData.targetUserIds ? formData.targetUserIds.split(',').map((s) => s.trim()) : undefined,
      targetPlan: (formData.targetPlan || undefined) as any,
    });
    setShowEditModal(false);
    setSelectedFlag(null);
    refresh();
  }, [selectedFlag, formData, mutations, refresh]);

  const handleDelete = useCallback(async () => {
    if (!selectedFlag) return;
    await mutations.remove(selectedFlag.id);
    setShowDeleteModal(false);
    setSelectedFlag(null);
    refresh();
  }, [selectedFlag, mutations, refresh]);

  const handleToggle = useCallback(async (flag: FeatureFlag) => {
    await mutations.update(flag.id, { enabled: !flag.enabled });
    refresh();
  }, [mutations, refresh]);

  const columns: Column<FeatureFlag>[] = [
    {
      key: 'key',
      header: 'Flag',
      sortable: true,
      render: (flag) => (
        <div>
          <p className="font-mono text-sm font-medium text-foreground">{flag.key}</p>
          <p className="text-sm text-muted-foreground">{flag.name}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (flag) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {flag.description || '-'}
        </span>
      ),
    },
    {
      key: 'enabled',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (flag) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(flag);
          }}
          className="flex items-center gap-2"
        >
          {flag.enabled ? (
            <>
              <ToggleRight className="h-6 w-6 text-success" />
              <Badge variant="success">On</Badge>
            </>
          ) : (
            <>
              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              <Badge variant="muted">Off</Badge>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'rolloutPercentage',
      header: 'Rollout',
      sortable: true,
      width: '100px',
      render: (flag) => (
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{flag.rolloutPercentage || 100}%</span>
        </div>
      ),
    },
    {
      key: 'targetPlan',
      header: 'Target',
      width: '120px',
      render: (flag) => {
        if (flag.targetUserIds?.length) {
          return (
            <Badge variant="info">
              <Users className="h-3 w-3 mr-1" />
              {flag.targetUserIds.length} users
            </Badge>
          );
        }
        if (flag.targetPlan) {
          return <Badge variant="primary">{flag.targetPlan}</Badge>;
        }
        return <Badge variant="muted">All Users</Badge>;
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      width: '130px',
      render: (flag) => (
        <span className="text-sm text-muted-foreground">
          {new Date(flag.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<FeatureFlag>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: openEditModal,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (flag) => {
        setSelectedFlag(flag);
        setShowDeleteModal(true);
      },
      variant: 'danger',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chart-3/10 rounded-lg">
            <Flag className="h-6 w-6 text-chart-3" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
            <p className="text-sm text-muted-foreground">
              Control feature rollouts and A/B testing
            </p>
          </div>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Add Flag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Flags</p>
            <p className="text-2xl font-bold text-foreground">{featureFlags.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Enabled</p>
            <p className="text-2xl font-bold text-success">
              {featureFlags.filter((f) => f.enabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Disabled</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {featureFlags.filter((f) => !f.enabled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <Input
            placeholder="Search flags by key or name..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Flags Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={filteredFlags}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No feature flags found"
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Feature Flag"
        size="lg"
      >
        <FormGroup>
          <Input
            label="Key"
            placeholder="ENABLE_NEW_FEATURE"
            value={formData.key}
            onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
            hint="Unique identifier (uppercase with underscores)"
            required
          />
          <Input
            label="Name"
            placeholder="New Feature"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe what this flag controls..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <Toggle
            label="Enabled"
            description="Turn this flag on immediately"
            checked={formData.enabled}
            onChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
          />
          <Input
            label="Rollout Percentage"
            type="number"
            min={0}
            max={100}
            value={formData.rolloutPercentage}
            onChange={(e) => setFormData((prev) => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}
          />
          <Select
            label="Target Plan (Optional)"
            options={[
              { value: '', label: 'All Plans' },
              { value: 'free', label: 'Free' },
              { value: 'starter', label: 'Starter' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={formData.targetPlan}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetPlan: e.target.value }))}
          />
          <Input
            label="Target User IDs (Optional)"
            placeholder="user1, user2, user3"
            value={formData.targetUserIds}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetUserIds: e.target.value }))}
            hint="Comma-separated user IDs for targeted rollout"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={mutations.loading} disabled={!formData.key || !formData.name}>
              Create Flag
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFlag(null);
        }}
        title="Edit Feature Flag"
        description={selectedFlag?.key}
        size="lg"
      >
        <FormGroup>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <Toggle
            label="Enabled"
            checked={formData.enabled}
            onChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
          />
          <Input
            label="Rollout Percentage"
            type="number"
            min={0}
            max={100}
            value={formData.rolloutPercentage}
            onChange={(e) => setFormData((prev) => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}
          />
          <Select
            label="Target Plan"
            options={[
              { value: '', label: 'All Plans' },
              { value: 'free', label: 'Free' },
              { value: 'starter', label: 'Starter' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            value={formData.targetPlan}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetPlan: e.target.value }))}
          />
          <Input
            label="Target User IDs"
            value={formData.targetUserIds}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetUserIds: e.target.value }))}
            hint="Comma-separated user IDs"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={mutations.loading}>Save Changes</Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFlag(null);
        }}
        onConfirm={handleDelete}
        title="Delete Feature Flag"
        message={`Are you sure you want to delete the flag "${selectedFlag?.key}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={mutations.loading}
      />
    </div>
  );
}
