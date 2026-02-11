/**
 * POST /api/auth/revoke-all — Revoke all sessions for the current user
 *
 * Requires an active session. Deletes all sessions from the database
 * for the authenticated user and clears the current session cookie.
 *
 * Use case: user wants to log out from all devices (e.g., after password change).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@hsafx/db';
import { sessions, eq } from '@hsafx/db/schema';
import { getAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify the current session via better-auth
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Delete all sessions for this user from the database
    const result = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ id: sessions.id });

    const revokedCount = result.length;

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: `Revoked ${revokedCount} session(s)`,
      revokedCount,
    });

    // Clear both possible cookie names
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');

    return response;
  } catch (error) {
    console.error('[revoke-all] Error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500 },
    );
  }
}
