'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { toolRegistry, categories } from '@hsafx/tool-definitions';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Wrench,
  LayoutDashboard,
  History,
  Coins,
  Key,
  Settings,
  FileText,
  DollarSign,
  LogOut,
  LogIn,
  ArrowRight,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  const pages = React.useMemo(() => {
    const base = [
      { name: 'All Tools', href: '/tools', icon: Wrench },
      { name: 'Pricing', href: '/pricing', icon: DollarSign },
      { name: 'API Docs', href: '/api-docs', icon: FileText },
      { name: 'Changelog', href: '/changelog', icon: FileText },
    ];

    if (isAuthenticated) {
      base.push(
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'History', href: '/dashboard/history', icon: History },
        { name: 'Coins', href: '/dashboard/coins', icon: Coins },
        { name: 'API Keys', href: '/settings/api-keys', icon: Key },
        { name: 'Settings', href: '/settings', icon: Settings }
      );
    }

    return base;
  }, [isAuthenticated]);

  // Group tools by category for display
  const toolsByCategory = React.useMemo(() => {
    const map = new Map<string, typeof toolRegistry>();
    for (const cat of categories) {
      const tools = toolRegistry.filter((t) => t.category === cat);
      if (tools.length > 0) map.set(cat, tools);
    }
    return map;
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl top-[20%] translate-y-0">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command label="Command Palette">
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Search 454+ tools, pages, actions..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[min(400px,50vh)] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Pages */}
            <Command.Group heading="Pages" className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.name}
                  onSelect={() => runCommand(() => router.push(page.href))}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{page.name}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground opacity-0 aria-selected:opacity-100" />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions */}
            <Command.Group heading="Actions" className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground">
              {isAuthenticated ? (
                <Command.Item
                  value="Sign Out Logout"
                  onSelect={() =>
                    runCommand(async () => {
                      await logout();
                      router.push('/');
                    })
                  }
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span>Sign Out</span>
                </Command.Item>
              ) : (
                <>
                  <Command.Item
                    value="Sign In Login"
                    onSelect={() => runCommand(() => router.push('/login'))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <LogIn className="h-4 w-4 text-muted-foreground" />
                    <span>Sign In</span>
                  </Command.Item>
                  <Command.Item
                    value="Register Get Started Sign Up"
                    onSelect={() => runCommand(() => router.push('/register'))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <LogIn className="h-4 w-4 text-muted-foreground" />
                    <span>Get Started</span>
                  </Command.Item>
                </>
              )}
            </Command.Group>

            {/* Tools grouped by category */}
            {Array.from(toolsByCategory.entries()).map(([category, tools]) => (
              <Command.Group
                key={category}
                heading={`${category} Tools (${tools.length})`}
                className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground"
              >
                {tools.map((tool) => (
                  <Command.Item
                    key={tool.id}
                    value={`${tool.name} ${tool.description} ${tool.category} ${tool.keywords?.join(' ') ?? ''}`}
                    onSelect={() =>
                      runCommand(() => router.push(`/tools/${tool.id}`))
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{tool.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </div>
                    {tool.tier !== 'free' && (
                      <span className="ml-auto shrink-0 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600">
                        {tool.tier.toUpperCase()}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to open the command palette programmatically
 */
export function useCommandPalette() {
  const open = React.useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
    );
  }, []);
  return { open };
}
