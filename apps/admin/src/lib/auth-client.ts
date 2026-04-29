/**
 * Admin Auth Client — BetterAuth React client for admin panel
 */

import { createAuthClient } from 'better-auth/react';

const baseURL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002');

export const authClient = createAuthClient({ baseURL });

export const {
  signIn,
  signOut,
  useSession,
} = authClient;
