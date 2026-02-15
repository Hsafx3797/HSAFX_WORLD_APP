'use client';

import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = '/auth/verify-2fa';
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
} = authClient;

// Re-export password reset and email verification helpers
// better-auth uses "forgetPassword" (known naming quirk)
export const forgotPassword = authClient.forgetPassword as typeof authClient.forgetPassword;
export const resetPassword = authClient.resetPassword;
export const verifyEmail = authClient.verifyEmail;
