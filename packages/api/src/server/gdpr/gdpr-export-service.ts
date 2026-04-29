import { db } from '@hsafx/db';
import {
  users, userPreferences, userSettings, toolExecutions, coinTransactions,
  favorites, userOnboarding, apiKeys, referrals,
  eq,
} from '@hsafx/db/schema';

/**
 * T3.3 — GDPR Data Export Service
 * Aggregates all user data into a JSON bundle for compliance.
 */

export async function requestDataExport(userId: string, email: string) {
  // Gather all user data in parallel
  const [
    userRows,
    prefsRows,
    settingsRows,
    executionRows,
    transactionRows,
    favoriteRows,
    onboardingRows,
    apiKeyRows,
    referralRows,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(userPreferences).where(eq(userPreferences.userId, userId)),
    db.select().from(userSettings).where(eq(userSettings.userId, userId)),
    db.select().from(toolExecutions).where(eq(toolExecutions.userId, userId)),
    db.select().from(coinTransactions).where(eq(coinTransactions.userId, userId)),
    db.select().from(favorites).where(eq(favorites.userId, userId)),
    db.select().from(userOnboarding).where(eq(userOnboarding.userId, userId)),
    db.select().from(apiKeys).where(eq(apiKeys.userId, userId)),
    db.select().from(referrals).where(eq(referrals.referrerId, userId)),
  ]);

  const user = userRows[0];
  if (!user) {
    throw new Error('User not found');
  }

  // Redact sensitive fields
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.name,
    avatarUrl: user.image,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    isEmailVerified: user.emailVerified,
    referralCode: user.referralCode,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Redact API key secrets
  const safeApiKeys = apiKeyRows.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    scopes: k.scopes,
    isActive: k.isActive,
    lastUsedAt: k.lastUsed,
    expiresAt: k.expiresAt,
    createdAt: k.createdAt,
  }));

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: safeUser,
    preferences: prefsRows[0] ?? null,
    settings: settingsRows[0] ?? null,
    onboarding: onboardingRows[0] ?? null,
    toolExecutions: executionRows,
    coinTransactions: transactionRows,
    favorites: favoriteRows,
    apiKeys: safeApiKeys,
    referrals: referralRows,
  };

  return {
    success: true,
    data: exportData,
    email,
    message: 'Your data export is ready for download.',
  };
}
