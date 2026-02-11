'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { ProtectedRoute } from '@/components/rbac/protected-route';
import { useRBAC, useAdminRole } from '@/components/rbac/use-rbac';
import type { Permission } from '@/lib/types';
import { signOut } from '@/lib/auth-client';

const navItems: { href: string; label: string; icon: string; permission?: Permission }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥', permission: 'users.view' },
  { href: '/tools', label: 'Tools', icon: '🛠️', permission: 'tools.view' },
  { href: '/categories', label: 'Categories', icon: '📁', permission: 'tools.view' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '💳', permission: 'subscriptions.view' },
  { href: '/billing', label: 'Billing', icon: '💰', permission: 'billing.view' },
  { href: '/plans', label: 'Plans', icon: '📋', permission: 'system.config' },
  { href: '/coin-packs', label: 'Coin Packs', icon: '🪙', permission: 'system.config' },
  { href: '/api-keys', label: 'API Keys', icon: '🔑', permission: 'system.config' },
  { href: '/feature-flags', label: 'Feature Flags', icon: '🚩', permission: 'system.config' },
  { href: '/admins', label: 'Admin Users', icon: '🛡️', permission: 'admin.view' },
  { href: '/activity', label: 'Activity Logs', icon: '📜', permission: 'audit.view' },
  { href: '/settings', label: 'Settings', icon: '⚙️', permission: 'system.config' },
];

// Menu icon for mobile
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

// Navigation content - reused in both desktop sidebar and mobile sheet
function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useRBAC();
  
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        // Hide items the user can't access
        if (item.permission && !hasPermission(item.permission)) return null;

        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-accent text-foreground/80 hover:text-foreground'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const router = useRouter();
  const { session } = useRBAC();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden md:flex md:w-64 md:flex-col bg-card border-r p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold">HSAFX Admin</h1>
            <p className="text-sm text-muted-foreground">Management Panel</p>
          </div>
          <NavContent />
          {/* User info + sign out */}
          <div className="mt-auto pt-4 border-t space-y-2">
            {session && (
              <div className="px-3 py-1">
                <p className="text-sm font-medium text-foreground truncate">{session.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{session.role.replace('_', ' ')}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
        
        {/* Mobile Header with Sheet trigger */}
        <div className="flex flex-col flex-1">
          <header className="md:hidden flex items-center gap-4 p-4 border-b bg-card">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  className="p-2 rounded-md hover:bg-accent"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>HSAFX Admin</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavContent onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">HSAFX Admin</h1>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
