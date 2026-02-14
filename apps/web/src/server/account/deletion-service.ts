'use server';

import { db } from '@hsafx/db';
import { users, sessions, eq, and, isNotNull, lt, sql } from '@hsafx/db/schema';
import { sendRawEmail } from '@/lib/email';

const APP_NAME = 'HSAFX World';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const GRACE_PERIOD_DAYS = 14;

/**
 * Soft-delete: set deletedAt + deactivate, send confirmation email.
 */
export async function requestAccountDeletion(userId: string): Promise<{ deletionDate: Date }> {
  const now = new Date();
  const deletionDate = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [user] = await db
    .update(users)
    .set({ deletedAt: now, isActive: false, updatedAt: now })
    .where(and(eq(users.id, userId), sql`${users.deletedAt} IS NULL`))
    .returning({ email: users.email, fullName: users.fullName });

  if (!user) {
    throw new Error('User not found or already scheduled for deletion');
  }

  // Invalidate all sessions
  await db.delete(sessions).where(eq(sessions.userId, userId));

  // Send confirmation email (best-effort)
  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  await sendRawEmail({
    to: user.email,
    subject: `Account deletion scheduled — ${APP_NAME}`,
    html: `<h2>Account deletion scheduled</h2>
<p>Hi ${user.fullName || 'there'},</p>
<p>Your ${APP_NAME} account has been scheduled for deletion.</p>
<p><strong>Your data will be permanently deleted on ${formattedDate}.</strong></p>
<p>If you change your mind, you can cancel the deletion by signing back in and visiting your settings before that date.</p>
<a href="${APP_URL}/settings#danger" style="display:inline-block;padding:12px 24px;background:#0070f3;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">Cancel Deletion</a>
<p style="font-size:13px;color:#999;margin-top:32px;">&copy; ${new Date().getFullYear()} ${APP_NAME}.</p>`,
    text: `Your ${APP_NAME} account is scheduled for deletion on ${formattedDate}. To cancel, sign in and visit ${APP_URL}/settings#danger`,
    userId,
  }).catch(() => {});

  return { deletionDate };
}

/**
 * Cancel pending account deletion within the grace period.
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  const [user] = await db
    .update(users)
    .set({ deletedAt: null, isActive: true, updatedAt: new Date() })
    .where(and(eq(users.id, userId), isNotNull(users.deletedAt)))
    .returning({ email: users.email, fullName: users.fullName });

  if (!user) {
    throw new Error('No pending deletion to cancel');
  }

  await sendRawEmail({
    to: user.email,
    subject: `Account deletion cancelled — ${APP_NAME}`,
    html: `<h2>Deletion cancelled</h2>
<p>Hi ${user.fullName || 'there'},</p>
<p>Your ${APP_NAME} account deletion has been cancelled. Your account is fully active again.</p>
<p style="font-size:13px;color:#999;margin-top:32px;">&copy; ${new Date().getFullYear()} ${APP_NAME}.</p>`,
    text: `Your ${APP_NAME} account deletion has been cancelled. Your account is fully active again.`,
    userId,
  }).catch(() => {});
}

/**
 * Check if the user has a pending deletion and when it will happen.
 */
export async function getDeletionStatus(userId: string): Promise<{
  isPending: boolean;
  deletedAt: Date | null;
  deletionDate: Date | null;
  daysRemaining: number | null;
}> {
  const [user] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.deletedAt) {
    return { isPending: false, deletedAt: null, deletionDate: null, daysRemaining: null };
  }

  const deletionDate = new Date(user.deletedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, Math.ceil((deletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  return { isPending: true, deletedAt: user.deletedAt, deletionDate, daysRemaining };
}

/**
 * Hard-delete users whose grace period has expired.
 * Called by the cron route.
 */
export async function hardDeleteExpiredUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)))
    .returning({ id: users.id });

  return deleted.length;
}
