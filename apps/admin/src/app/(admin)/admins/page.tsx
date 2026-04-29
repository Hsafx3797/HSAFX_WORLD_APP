/**
 * Admin Users Management Page
 * View and manage admin users: invite, change roles, remove
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  UserPlus,
  Search,
  Mail,
  Clock,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react';
import { useAdmins, useAdminMutations } from '@/lib/hooks';
import type { AdminUser, AdminRole } from '@/lib/types';
import {
  DataTable,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  RoleBadge,
  Modal,
  TotpModal,
  FormGroup,
} from '@/components/ui';
import type { Column, Action } from '@/components/ui';

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
  { value: 'developer', label: 'Developer' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'billing', label: 'Billing' },
];

export default function AdminsPage() {
  const { admins, isLoading, refresh } = useAdmins();
  const mutations = useAdminMutations();

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('admin');
  const [newRole, setNewRole] = useState<AdminRole>('admin');

  const handleInvite = useCallback(async () => {
    await mutations.invite(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('admin');
    setShowInviteModal(false);
    refresh();
  }, [inviteEmail, inviteRole, mutations, refresh]);

  const handleUpdateRole = useCallback(async () => {
    if (!selectedAdmin) return;
    await mutations.updateRole(selectedAdmin.id, newRole);
    setShowRoleModal(false);
    setSelectedAdmin(null);
    refresh();
  }, [selectedAdmin, newRole, mutations, refresh]);

  const handleDelete = useCallback(async (totpCode: string) => {
    if (!selectedAdmin) return;
    await mutations.remove(selectedAdmin.id, totpCode);
    setShowDeleteModal(false);
    setSelectedAdmin(null);
    refresh();
  }, [selectedAdmin, mutations, refresh]);

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Admin',
      sortable: true,
      render: (admin) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            {admin.image ? (
              <img src={admin.image} alt={admin.name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <Shield className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{admin.name}</p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      width: '140px',
      render: (admin) => <RoleBadge role={admin.role} />,
    },
    {
      key: 'twoFactorEnabled',
      header: '2FA',
      width: '80px',
      render: (admin) => (
        admin.twoFactorEnabled
          ? <Badge variant="success" dot>On</Badge>
          : <Badge variant="warning" dot>Off</Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      width: '180px',
      render: (admin) => (
        <span className="text-sm text-muted-foreground">
          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      width: '120px',
      render: (admin) => (
        <span className="text-sm text-muted-foreground">
          {new Date(admin.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<AdminUser>[] = [
    {
      label: 'Change Role',
      icon: <Shield className="h-4 w-4" />,
      onClick: (admin) => {
        setSelectedAdmin(admin);
        setNewRole(admin.role);
        setShowRoleModal(true);
      },
    },
    {
      label: 'Remove Admin',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: (admin) => {
        setSelectedAdmin(admin);
        setShowDeleteModal(true);
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage admin access and roles ({admins.length} admins)
            </p>
          </div>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInviteModal(true)}>
          Invite Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Admins</p>
            <p className="text-2xl font-bold text-foreground">{admins.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Super Admins</p>
            <p className="text-2xl font-bold text-primary">
              {admins.filter((a) => a.role === 'super_admin').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">2FA Enabled</p>
            <p className="text-2xl font-bold text-success">
              {admins.filter((a) => a.twoFactorEnabled).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">2FA Disabled</p>
            <p className="text-2xl font-bold text-warning">
              {admins.filter((a) => !a.twoFactorEnabled).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={admins}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No admin users found"
          />
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => { setShowInviteModal(false); setInviteEmail(''); }}
        title="Invite Admin"
        description="Send an invitation to a new admin user"
      >
        <FormGroup>
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminRole)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInvite} loading={mutations.loading} disabled={!inviteEmail.trim()}>
              Send Invitation
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        open={showRoleModal}
        onClose={() => { setShowRoleModal(false); setSelectedAdmin(null); }}
        title="Change Admin Role"
        description={`Update role for ${selectedAdmin?.email}`}
      >
        <FormGroup>
          <Select
            label="New Role"
            options={ROLE_OPTIONS}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AdminRole)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole} loading={mutations.loading}>
              Update Role
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Delete Admin TOTP */}
      <TotpModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedAdmin(null); }}
        onSubmit={handleDelete}
        title="Remove Admin"
        message={`Remove ${selectedAdmin?.email} from admin panel. Enter your 2FA code to confirm.`}
        loading={mutations.loading}
      />
    </div>
  );
}
