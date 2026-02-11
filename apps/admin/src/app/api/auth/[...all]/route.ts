/**
 * BetterAuth Catch-All Route for Admin Panel
 * Handles /api/auth/* endpoints (sign-in, sign-out, session)
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
