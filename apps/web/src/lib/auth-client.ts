'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const {
  signIn,
  signUp,
  signOut,
} = authClient;

// Re-export password reset and email verification helpers
export const forgotPassword = authClient.resetPassword;
export const resetPassword = authClient.resetPassword;
export const verifyEmail = authClient.verifyEmail;
