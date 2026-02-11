# 🔄 State Management Specification

**State Library:** Zustand + React Context  
**Persistence:** localStorage (inputs only)  
**URL State:** Next.js searchParams  
**Features:** Undo/redo, theme, permissions, tool history

---

## 1. Overview

This specification defines state management patterns for the productivity app, covering per-tool state, global state, and persistence strategies.

**State Categories:**
1. **Tool State** - Input/output/options per tool (localStorage, undo/redo)
2. **User State** - Auth, coins, permissions (Zustand + React Context)
3. **Theme State** - Dark/light/system mode (localStorage + Zustand)
4. **UI State** - Sidebar, modals, notifications (Zustand)
5. **URL State** - Share links with pre-filled inputs (searchParams)

---

## 2. Tool State Management

### 2.1 Tool Store with Undo/Redo

```typescript
// packages/stores/src/tool-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ToolState {
  // Current state per tool
  toolStates: Record<number, {
    input: string;
    output: string;
    options: Record<string, unknown>;
    lastModified: number;
  }>;
  
  // Undo/redo history (text/code tools only)
  history: Record<number, {
    past: string[];
    future: string[];
    maxHistory: number;
  }>;
  
  // Actions
  setInput: (toolId: number, input: string, addToHistory?: boolean) => void;
  setOutput: (toolId: number, output: string) => void;
  setOption: (toolId: number, key: string, value: unknown) => void;
  setOptions: (toolId: number, options: Record<string, unknown>) => void;
  clearTool: (toolId: number) => void;
  
  // Undo/redo actions
  undo: (toolId: number) => void;
  redo: (toolId: number) => void;
  canUndo: (toolId: number) => boolean;
  canRedo: (toolId: number) => boolean;
}

export const useToolStore = create<ToolState>()(
  persist(
    immer((set, get) => ({
      toolStates: {},
      history: {},
      
      setInput: (toolId, input, addToHistory = true) => set((state) => {
        // Initialize tool state if not exists
        if (!state.toolStates[toolId]) {
          state.toolStates[toolId] = {
            input: '',
            output: '',
            options: {},
            lastModified: Date.now()
          };
        }
        
        // Add to undo history for text/code editing tools
        if (addToHistory && isTextOrCodeTool(toolId)) {
          if (!state.history[toolId]) {
            state.history[toolId] = {
              past: [],
              future: [],
              maxHistory: 10
            };
          }
          
          const currentInput = state.toolStates[toolId].input;
          
          // Add current state to past
          state.history[toolId].past.push(currentInput);
          
          // Limit history size
          if (state.history[toolId].past.length > state.history[toolId].maxHistory) {
            state.history[toolId].past.shift();
          }
          
          // Clear future (new change invalidates redo)
          state.history[toolId].future = [];
        }
        
        // Update input
        state.toolStates[toolId].input = input;
        state.toolStates[toolId].lastModified = Date.now();
      }),
      
      setOutput: (toolId, output) => set((state) => {
        if (!state.toolStates[toolId]) {
          state.toolStates[toolId] = {
            input: '',
            output: '',
            options: {},
            lastModified: Date.now()
          };
        }
        
        // Do NOT persist output to localStorage (only input)
        state.toolStates[toolId].output = output;
        state.toolStates[toolId].lastModified = Date.now();
      }),
      
      setOption: (toolId, key, value) => set((state) => {
        if (!state.toolStates[toolId]) {
          state.toolStates[toolId] = {
            input: '',
            output: '',
            options: {},
            lastModified: Date.now()
          };
        }
        
        state.toolStates[toolId].options[key] = value;
      }),
      
      setOptions: (toolId, options) => set((state) => {
        if (!state.toolStates[toolId]) {
          state.toolStates[toolId] = {
            input: '',
            output: '',
            options: {},
            lastModified: Date.now()
          };
        }
        
        state.toolStates[toolId].options = options;
      }),
      
      clearTool: (toolId) => set((state) => {
        delete state.toolStates[toolId];
        delete state.history[toolId];
      }),
      
      undo: (toolId) => set((state) => {
        if (!state.history[toolId] || state.history[toolId].past.length === 0) {
          return;
        }
        
        const currentInput = state.toolStates[toolId]?.input || '';
        const previous = state.history[toolId].past.pop()!;
        
        // Add current to future
        state.history[toolId].future.push(currentInput);
        
        // Restore previous
        if (state.toolStates[toolId]) {
          state.toolStates[toolId].input = previous;
        }
      }),
      
      redo: (toolId) => set((state) => {
        if (!state.history[toolId] || state.history[toolId].future.length === 0) {
          return;
        }
        
        const currentInput = state.toolStates[toolId]?.input || '';
        const next = state.history[toolId].future.pop()!;
        
        // Add current to past
        state.history[toolId].past.push(currentInput);
        
        // Restore next
        if (state.toolStates[toolId]) {
          state.toolStates[toolId].input = next;
        }
      }),
      
      canUndo: (toolId) => {
        const history = get().history[toolId];
        return history ? history.past.length > 0 : false;
      },
      
      canRedo: (toolId) => {
        const history = get().history[toolId];
        return history ? history.future.length > 0 : false;
      }
    })),
    {
      name: 'tool-storage',
      // Only persist inputs and options, NOT outputs
      partialize: (state) => ({
        toolStates: Object.fromEntries(
          Object.entries(state.toolStates).map(([id, tool]) => [
            id,
            {
              input: tool.input,
              options: tool.options,
              lastModified: tool.lastModified,
              output: '' // Don't persist output
            }
          ])
        ),
        history: state.history
      })
    }
  )
);

// Helper: Check if tool supports undo/redo (text/code editing tools)
function isTextOrCodeTool(toolId: number): boolean {
  // TEXT_CONVERTER (1-191): Yes for text editors
  if (toolId >= 1 && toolId <= 191) return true;
  
  // CODE_EDITOR (192-297): Yes
  if (toolId >= 192 && toolId <= 297) return true;
  
  // FILE_CONVERTER (298-379): No (file operations)
  if (toolId >= 298 && toolId <= 379) return false;
  
  // GENERATOR (380-414): No (one-time generation)
  if (toolId >= 380 && toolId <= 414) return false;
  
  // CALCULATOR (415-442): No (calculation results)
  if (toolId >= 415 && toolId <= 442) return false;
  
  // DOCUMENT_GENERATION (445): No (PDF generation)
  if (toolId === 445) return false;
  
  // ASYNC_INTELLIGENCE (446): No (scraping)
  if (toolId === 446) return false;
  
  return false;
}
```

---

### 2.2 Tool State Hook

```typescript
// packages/stores/src/hooks/useToolState.ts

import { useToolStore } from '../tool-store';

export function useToolState(toolId: number) {
  const store = useToolStore();
  
  const toolState = store.toolStates[toolId] || {
    input: '',
    output: '',
    options: {},
    lastModified: 0
  };
  
  return {
    // Current state
    input: toolState.input,
    output: toolState.output,
    options: toolState.options,
    lastModified: toolState.lastModified,
    
    // Actions
    setInput: (input: string, addToHistory = true) => 
      store.setInput(toolId, input, addToHistory),
    setOutput: (output: string) => 
      store.setOutput(toolId, output),
    setOption: (key: string, value: unknown) => 
      store.setOption(toolId, key, value),
    setOptions: (options: Record<string, unknown>) => 
      store.setOptions(toolId, options),
    clear: () => store.clearTool(toolId),
    
    // Undo/redo
    undo: () => store.undo(toolId),
    redo: () => store.redo(toolId),
    canUndo: store.canUndo(toolId),
    canRedo: store.canRedo(toolId)
  };
}
```

---

## 3. User State Management

### 3.1 User Store

```typescript
// packages/stores/src/user-store.ts

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  coins: number;
  isPremium: boolean;
  permissions: string[]; // e.g., ['file-conversion', 'scraping']
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  updateCoins: (coins: number) => void;
  logout: () => void;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  canUseTool: (toolId: number, coinCost: number) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  
  setUser: (user) => set({ user, isLoading: false }),
  
  updateCoins: (coins) => set((state) => ({
    user: state.user ? { ...state.user, coins } : null
  })),
  
  logout: () => set({ user: null }),
  
  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    
    // Premium users have all permissions
    if (user.isPremium) return true;
    
    return user.permissions.includes(permission);
  },
  
  canUseTool: (toolId, coinCost) => {
    const user = get().user;
    if (!user) return false;
    
    // Check coin balance
    if (user.coins < coinCost) return false;
    
    // Check permissions (if tool requires specific permission)
    // FILE_CONVERTER tools require 'file-conversion'
    if (toolId >= 298 && toolId <= 379) {
      return get().hasPermission('file-conversion');
    }
    
    // ASYNC_INTELLIGENCE (scraping) requires 'scraping'
    if (toolId === 446) {
      return get().hasPermission('scraping');
    }
    
    return true;
  }
}));
```

---

## 4. Theme State Management

### 4.1 Theme Store

```typescript
// packages/stores/src/theme-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark'; // Actual theme after system resolution
  
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      
      setTheme: (theme) => {
        set({ theme });
        
        // Resolve theme
        let resolved: 'light' | 'dark' = 'light';
        
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        } else {
          resolved = theme;
        }
        
        set({ resolvedTheme: resolved });
        
        // Apply to document
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      toggleTheme: () => {
        const current = get().resolvedTheme;
        get().setTheme(current === 'light' ? 'dark' : 'light');
      }
    }),
    {
      name: 'theme-storage'
    }
  )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      store.setTheme('system'); // Re-resolve
    }
  });
}
```

---

## 5. UI State Management

### 5.1 UI Store

```typescript
// packages/stores/src/ui-store.ts

import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;
  
  // Notifications
  notifications: Notification[];
  
  // Loading states
  loadingStates: Record<string, boolean>;
  
  // Actions
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: {},
  notifications: [],
  loadingStates: {},
  
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
  
  collapseSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  openModal: (modal, data = {}) => set({
    activeModal: modal,
    modalData: data
  }),
  
  closeModal: () => set({
    activeModal: null,
    modalData: {}
  }),
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}`;
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
  setLoading: (key, loading) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: loading
    }
  }))
}));
```

---

## 6. URL State Synchronization

### 6.1 Shareable Tool Links

```typescript
// packages/stores/src/hooks/useToolURL.ts

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToolState } from './useToolState';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export function useToolURL(toolId: number) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { input, options, setInput, setOptions } = useToolState(toolId);
  
  // Load state from URL on mount
  useEffect(() => {
    const inputParam = searchParams.get('input');
    const optionsParam = searchParams.get('options');
    
    if (inputParam) {
      try {
        const decompressed = decompressFromEncodedURIComponent(inputParam);
        if (decompressed) {
          setInput(decompressed, false); // Don't add to undo history
        }
      } catch (error) {
        console.error('Failed to decompress input from URL:', error);
      }
    }
    
    if (optionsParam) {
      try {
        const decompressed = decompressFromEncodedURIComponent(optionsParam);
        const parsed = JSON.parse(decompressed || '{}');
        setOptions(parsed);
      } catch (error) {
        console.error('Failed to parse options from URL:', error);
      }
    }
  }, []); // Run once on mount
  
  // Generate shareable URL
  const getShareableURL = () => {
    const compressedInput = compressToEncodedURIComponent(input);
    const compressedOptions = compressToEncodedURIComponent(JSON.stringify(options));
    
    const params = new URLSearchParams();
    if (input) params.set('input', compressedInput);
    if (Object.keys(options).length > 0) params.set('options', compressedOptions);
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };
  
  // Copy shareable URL to clipboard
  const copyShareableURL = async () => {
    const url = getShareableURL();
    await navigator.clipboard.writeText(url);
    
    return url;
  };
  
  return {
    getShareableURL,
    copyShareableURL
  };
}
```

---

## 7. Recent Tools History

### 7.1 History Store

```typescript
// packages/stores/src/history-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ToolHistory {
  toolId: number;
  timestamp: number;
  preview?: string; // First 100 chars of input
}

interface HistoryState {
  history: ToolHistory[];
  maxHistory: number;
  
  addToHistory: (toolId: number, preview?: string) => void;
  clearHistory: () => void;
  getRecentTools: (limit?: number) => ToolHistory[];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      maxHistory: 50,
      
      addToHistory: (toolId, preview) => set((state) => {
        // Remove existing entry for this tool
        const filtered = state.history.filter((h) => h.toolId !== toolId);
        
        // Add new entry at front
        const newHistory = [
          { toolId, timestamp: Date.now(), preview },
          ...filtered
        ];
        
        // Limit size
        if (newHistory.length > state.maxHistory) {
          newHistory.length = state.maxHistory;
        }
        
        return { history: newHistory };
      }),
      
      clearHistory: () => set({ history: [] }),
      
      getRecentTools: (limit = 10) => {
        return get().history.slice(0, limit);
      }
    }),
    {
      name: 'tool-history'
    }
  )
);
```

---

## 8. Keyboard Shortcuts State

```typescript
// packages/stores/src/shortcuts-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ShortcutAction = 
  | 'execute-tool'
  | 'copy-output'
  | 'clear-input'
  | 'undo'
  | 'redo'
  | 'toggle-theme'
  | 'open-search';

interface Shortcut {
  action: ShortcutAction;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface ShortcutsState {
  shortcuts: Shortcut[];
  enabled: boolean;
  
  setShortcut: (action: ShortcutAction, shortcut: Omit<Shortcut, 'action'>) => void;
  resetShortcuts: () => void;
  toggleShortcuts: () => void;
}

const defaultShortcuts: Shortcut[] = [
  { action: 'execute-tool', key: 'Enter', ctrl: true },
  { action: 'copy-output', key: 'c', ctrl: true },
  { action: 'clear-input', key: 'l', ctrl: true },
  { action: 'undo', key: 'z', ctrl: true },
  { action: 'redo', key: 'z', ctrl: true, shift: true },
  { action: 'toggle-theme', key: 't', ctrl: true, shift: true },
  { action: 'open-search', key: 'k', ctrl: true }
];

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      shortcuts: defaultShortcuts,
      enabled: true,
      
      setShortcut: (action, shortcut) => set((state) => ({
        shortcuts: state.shortcuts.map((s) =>
          s.action === action ? { ...shortcut, action } : s
        )
      })),
      
      resetShortcuts: () => set({ shortcuts: defaultShortcuts }),
      
      toggleShortcuts: () => set((state) => ({ enabled: !state.enabled }))
    }),
    {
      name: 'shortcuts-storage'
    }
  )
);
```

---

## 9. Global Store Provider

```tsx
// app/providers/StoreProvider.tsx

'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { useThemeStore } from '@/stores/theme-store';
import { trpc } from '@/lib/trpc';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);
  const setTheme = useThemeStore((state) => state.setTheme);
  
  // Load user on mount
  const { data: user } = trpc.auth.getUser.useQuery();
  
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);
  
  // Initialize theme
  useEffect(() => {
    const theme = useThemeStore.getState().theme;
    setTheme(theme);
  }, [setTheme]);
  
  return <>{children}</>;
}
```

---

## 10. State Management Best Practices

### 10.1 When to Use Each Store

| State Type | Store | Persisted | Use Case |
|------------|-------|-----------|----------|
| Tool input/options | `toolStore` | ✅ localStorage | User's work across sessions |
| Tool output | `toolStore` | ❌ Memory only | Generated results (recalculate on refresh) |
| Undo/redo history | `toolStore` | ✅ localStorage | Text/code editing only |
| User data | `userStore` | ❌ Session only | Fetched from API |
| Theme preference | `themeStore` | ✅ localStorage | Persist user preference |
| UI state (sidebar) | `uiStore` | ❌ Memory only | Temporary UI state |
| URL state | searchParams | ✅ URL | Shareable links |

### 10.2 Performance Optimization

```typescript
// Selective subscription (only re-render when specific tool changes)
const input = useToolStore((state) => state.toolStates[toolId]?.input);

// Shallow equality for objects
const options = useToolStore(
  (state) => state.toolStates[toolId]?.options,
  shallow
);

// Memoize selectors
const canUndo = useToolStore(
  useCallback((state) => state.canUndo(toolId), [toolId])
);
```

---

**This specification defines comprehensive state management with undo/redo, persistence, and URL synchronization for all 446 tools.**
