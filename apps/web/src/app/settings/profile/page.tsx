'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const { data, isLoading } = trpc.user.getProfile.useQuery();
  const { data: referralData } = trpc.user.getMyReferralCode.useQuery();
  const utils = trpc.useUtils();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (data?.user) {
      setFullName(data.user.fullName ?? '');
      setUsername(data.user.username ?? '');
      setPhoneNumber(data.user.phoneNumber ?? '');
    }
  }, [data?.user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      fullName: fullName || undefined,
      username: username || undefined,
      phoneNumber: phoneNumber || null,
    });
  };

  const handleCopyReferral = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code);
      toast.success('Referral code copied');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Profile</span>
          </div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and public profile
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {data?.user?.avatarUrl ? (
                    <Image
                      src={data.user.avatarUrl}
                      alt={data.user.fullName ?? 'Avatar'}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">
                      {data?.user?.fullName?.charAt(0).toUpperCase() || '👤'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avatar is synced from your social login provider
                  </p>
                </div>
              </div>
            </section>

            {/* Basic Info Section */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="your_username"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lowercase letters, numbers, and underscores only
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={data?.user?.email ?? ''}
                    readOnly
                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email changes require re-verification
                  </p>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </section>

            {/* Account Info Section */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Member Since</label>
                    <p className="text-sm text-muted-foreground px-4 py-2">
                      {data?.user?.createdAt
                        ? new Date(data.user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Referral Code</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm font-mono">
                        {referralData?.code ?? '—'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        disabled={!referralData?.code}
                        className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors text-sm disabled:opacity-50"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/settings"
                className="px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
