/**
 * Users Management Page
 * Full CRUD for user management with search, filter, and actions
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Download,
  Ban,
  Trash2,
  Key,
  Coins,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useUsers, useUserMutations } from '@/lib/hooks';
import type { User, UserFilters } from '@/lib/types';
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
  TotpModal,
  FormGroup,
} from '@/components/ui';
import type { Column, Action } from '@/components/ui';

export default function UsersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 25 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [coinAdjustment, setCoinAdjustment] = useState({ amount: 0, reason: '' });

  const { users, pagination, isLoading, refresh } = useUsers(filters);
  const mutations = useUserMutations();

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof UserFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleViewUser = useCallback((user: User) => {
    router.push(`/users/${user.id}`);
  }, [router]);

  const handleBanUser = useCallback(async () => {
    if (!selectedUser || !banReason) return;
    await mutations.ban(selectedUser.id, banReason);
    setShowBanModal(false);
    setBanReason('');
    setSelectedUser(null);
    refresh();
  }, [selectedUser, banReason, mutations, refresh]);

  const handleUnbanUser = useCallback(async (user: User) => {
    await mutations.unban(user.id);
    refresh();
  }, [mutations, refresh]);

  const handleDeleteUser = useCallback(async (totpCode: string) => {
    if (!selectedUser) return;
    await mutations.remove(selectedUser.id, totpCode);
    setShowDeleteModal(false);
    setSelectedUser(null);
    refresh();
  }, [selectedUser, mutations, refresh]);

  const handleResetPassword = useCallback(async (user: User) => {
    await mutations.resetPassword(user.id);
  }, [mutations]);

  const handleAdjustCoins = useCallback(async (totpCode: string) => {
    if (!selectedUser) return;
    await mutations.adjustCoins(
      selectedUser.id,
      coinAdjustment.amount,
      coinAdjustment.reason,
      totpCode
    );
    setShowCoinsModal(false);
    setCoinAdjustment({ amount: 0, reason: '' });
    setSelectedUser(null);
    refresh();
  }, [selectedUser, coinAdjustment, mutations, refresh]);

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: 'User',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-foreground">{user.displayName || 'No name'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'subscription.plan',
      header: 'Plan',
      sortable: true,
      width: '100px',
      render: (user) => <PlanBadge plan={user.subscription?.plan || 'free'} />,
    },
    {
      key: 'coinBalance',
      header: 'Coins',
      sortable: true,
      width: '100px',
      render: (user) => (
        <span className="font-mono text-sm">{(user.coinBalance ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'usageCount',
      header: 'Usage',
      sortable: true,
      width: '100px',
      render: (user) => <span>{(user.usageCount ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      width: '120px',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Last Active',
      sortable: true,
      width: '120px',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
  ];

  const actions: Action<User>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewUser,
    },
    {
      label: 'Adjust Coins',
      icon: <Coins className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setShowCoinsModal(true);
      },
    },
    {
      label: 'Reset Password',
      icon: <Key className="h-4 w-4" />,
      onClick: handleResetPassword,
    },
    {
      label: 'Ban User',
      icon: <Ban className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setShowBanModal(true);
      },
      variant: 'danger',
      disabled: (user) => user.status === 'banned',
    },
    {
      label: 'Unban User',
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: handleUnbanUser,
      disabled: (user) => user.status !== 'banned',
    },
    {
      label: 'Delete User',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
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
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts, subscriptions, and access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email, name, or ID..."
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
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'banned', label: 'Banned' },
                  { value: 'pending', label: 'Pending' },
                ]}
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
              <Select
                label="Plan"
                options={[
                  { value: '', label: 'All Plans' },
                  { value: 'free', label: 'Free' },
                  { value: 'starter', label: 'Starter' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
                value={filters.plan || ''}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
              />
              <Select
                label="Auth Provider"
                options={[
                  { value: '', label: 'All Providers' },
                  { value: 'email', label: 'Email' },
                  { value: 'google', label: 'Google' },
                  { value: 'github', label: 'GitHub' },
                ]}
                value={filters.authProvider || ''}
                onChange={(e) => handleFilterChange('authProvider', e.target.value)}
              />
              <Select
                label="Sort By"
                options={[
                  { value: 'createdAt', label: 'Join Date' },
                  { value: 'lastActiveAt', label: 'Last Active' },
                  { value: 'usageCount', label: 'Usage Count' },
                  { value: 'coinBalance', label: 'Coin Balance' },
                ]}
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent noPadding>
          <DataTable
            data={users}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage="No users found"
            onRowClick={handleViewUser}
            pagination={pagination ? {
              ...pagination,
              onPageChange: handlePageChange,
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* Ban User Modal */}
      <Modal
        open={showBanModal}
        onClose={() => {
          setShowBanModal(false);
          setBanReason('');
          setSelectedUser(null);
        }}
        title="Ban User"
        description={`Are you sure you want to ban ${selectedUser?.email}?`}
      >
        <FormGroup>
          <Input
            label="Ban Reason"
            placeholder="Enter reason for banning..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleBanUser}
              loading={mutations.loading}
              disabled={!banReason}
            >
              Ban User
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Delete User Modal */}
      <TotpModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleDeleteUser}
        title="Delete User"
        message={`This action cannot be undone. Enter your 2FA code to confirm deletion of ${selectedUser?.email}.`}
        loading={mutations.loading}
      />

      {/* Adjust Coins Modal */}
      <Modal
        open={showCoinsModal}
        onClose={() => {
          setShowCoinsModal(false);
          setCoinAdjustment({ amount: 0, reason: '' });
          setSelectedUser(null);
        }}
        title="Adjust Coins"
        description={`Current balance: ${(selectedUser?.coinBalance ?? 0).toLocaleString()} coins`}
      >
        <FormGroup>
          <Input
            label="Amount"
            type="number"
            placeholder="Enter amount (negative to deduct)"
            value={coinAdjustment.amount}
            onChange={(e) =>
              setCoinAdjustment((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
            }
            required
          />
          <Input
            label="Reason"
            placeholder="Enter reason for adjustment"
            value={coinAdjustment.reason}
            onChange={(e) =>
              setCoinAdjustment((prev) => ({ ...prev, reason: e.target.value }))
            }
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCoinsModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAdjustCoins('')}
              disabled={!coinAdjustment.amount || !coinAdjustment.reason}
            >
              Adjust Coins
            </Button>
          </div>
        </FormGroup>
      </Modal>
    </div>
  );
}
