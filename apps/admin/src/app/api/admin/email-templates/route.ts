/**
 * Admin Email Templates API
 * GET  /api/admin/email-templates — List all templates
 * POST /api/admin/email-templates — Create or update a template
 *
 * Requires admin session.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { db, eq } from '@hsafx/db';
import { emailTemplates } from '@hsafx/db/schema';
import { requireAdminRole } from '@/lib/require-admin';

// ── GET: List templates ────────────────────────────────────

export async function GET() {
  const authResult = await requireAdminRole();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.slug);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[email-templates] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// ── POST: Create or update template ────────────────────────

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRole();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = (await request.json()) as {
      slug: string;
      name: string;
      subject: string;
      htmlBody: string;
      textBody?: string;
      variables?: string[];
      isActive?: boolean;
    };

    if (!body.slug || !body.name || !body.subject || !body.htmlBody) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, subject, htmlBody' },
        { status: 400 }
      );
    }

    // Check if slug already exists → update
    const existing = await db
      .select({ id: emailTemplates.id })
      .from(emailTemplates)
      .where(eq(emailTemplates.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      const updateData: Record<string, unknown> = {
        name: body.name,
        subject: body.subject,
        htmlBody: body.htmlBody,
        updatedAt: new Date(),
      };
      if (body.textBody !== undefined) updateData.textBody = body.textBody;
      if (body.variables !== undefined) updateData.variables = body.variables;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      await db
        .update(emailTemplates)
        .set(updateData as typeof emailTemplates.$inferInsert)
        .where(eq(emailTemplates.id, existing[0]!.id));

      return NextResponse.json({ success: true, action: 'updated', id: existing[0]!.id });
    }

    // Create new
    const insertData = {
      slug: body.slug,
      name: body.name,
      subject: body.subject,
      htmlBody: body.htmlBody,
      textBody: body.textBody ?? null,
      variables: body.variables ?? [],
      isActive: body.isActive ?? true,
    };

    const inserted = await db
      .insert(emailTemplates)
      .values(insertData as typeof emailTemplates.$inferInsert)
      .returning({ id: emailTemplates.id });

    return NextResponse.json(
      { success: true, action: 'created', id: inserted[0]?.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[email-templates] POST error:', error);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
