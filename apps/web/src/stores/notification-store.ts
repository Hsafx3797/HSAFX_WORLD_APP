/**
 * Notification Store — in-app notification state, unread count, bell UI
 * Server-side notification router will be added later;
 * this store manages client-side state and optimistic updates.
 */

import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'billing' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Bell dropdown
  bellOpen: boolean;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  setBellOpen: (open: boolean) => void;
  toggleBell: () => void;

  // Bulk set (for hydrating from server)
  setNotifications: (notifications: Notification[]) => void;
}

const MAX_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationState>()((set, _get) => ({
  notifications: [],
  unreadCount: 0,
  bellOpen: false,

  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        createdAt: Date.now(),
      };
      const updated = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setBellOpen: (open) => set({ bellOpen: open }),
  toggleBell: () => set((state) => ({ bellOpen: !state.bellOpen })),

  setNotifications: (notifications) =>
    set({
      notifications: notifications.slice(0, MAX_NOTIFICATIONS),
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
}));
