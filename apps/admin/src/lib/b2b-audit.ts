/**
 * B2B Audit Logger — writes admin B2B mutations to the audit_logs table.
 *
 * Used by all admin B2B routes to track creates, updates, and deletes
 * for compliance and accountability.
 */

import { db, auditLogs } from '@hsafx/db';

type AuditAction = 'create' | 'update' | 'delete';

interface AuditEntry {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  actionDetail?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry for a B2B admin mutation.
 * Fire-and-forget — errors are caught and logged, never bubble up.
 */
export async function logB2bAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      actionDetail: entry.actionDetail,
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: { source: 'admin-b2b' },
    });
  } catch (err) {
    // Never let audit logging break the request
    console.error('[audit] Failed to write B2B audit log:', err);
  }
}
