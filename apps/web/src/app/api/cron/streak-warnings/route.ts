import { NextRequest, NextResponse } from 'next/server';

/**
 * T3.4 — Streak Break Warning Emails
 *
 * Cron endpoint: check users whose streak is about to break (last active = yesterday)
 * and send a warning email via Resend.
 *
 * Call externally:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://app/api/cron/streak-warnings
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await import('@hsafx/db');
    const { userStreaks, users, userSettings, eq, and, sql } = await import('@hsafx/db/schema');
    const { sendRawEmail } = await import('@/lib/email');

    // Find users whose lastActiveDate is yesterday (UTC) — their streak breaks today if they don't log in.
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const atRiskUsers = await db
      .select({
        userId: userStreaks.userId,
        currentStreak: userStreaks.currentStreak,
        email: users.email,
        fullName: users.fullName,
      })
      .from(userStreaks)
      .innerJoin(users, eq(userStreaks.userId, users.id))
      .where(
        and(
          sql`${userStreaks.lastActiveDate} >= ${yesterday}`,
          sql`${userStreaks.lastActiveDate} < ${today}`,
          sql`${userStreaks.currentStreak} >= 3`, // Only warn users with streaks >= 3 days
        ),
      );

    let sentCount = 0;

    for (const user of atRiskUsers) {
      // Check if user has email notifications enabled
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.userId))
        .limit(1);

      if (settings && settings.emailNotifications === false) continue;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const name = user.fullName || user.email.split('@')[0];

      try {
        await sendRawEmail({
          to: user.email,
          subject: `🔥 Your ${user.currentStreak}-day streak is about to break!`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hey ${name}!</h2>
              <p>Your <strong>${user.currentStreak}-day</strong> login streak is about to break! 😱</p>
              <p>Log in today to keep your streak alive and maintain your coin multiplier bonus.</p>
              <a href="${appUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                Keep My Streak 🔥
              </a>
              <p style="color: #666; font-size: 13px; margin-top: 24px;">
                You can disable streak emails in your <a href="${appUrl}/settings#notifications">notification settings</a>.
              </p>
            </div>
          `,
          text: `Your ${user.currentStreak}-day streak is about to break! Log in today: ${appUrl}/dashboard`,
          userId: user.userId,
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`[Cron] Failed to send streak warning to ${user.email}:`, emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      atRiskCount: atRiskUsers.length,
      emailsSent: sentCount,
    });
  } catch (err) {
    console.error('[Cron] streak-warnings failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
