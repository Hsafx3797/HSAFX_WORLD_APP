/**
 * Email Service — Resend-based email sending with template support
 *
 * PHASE 2 (Task 2.5): Provides a unified interface for sending transactional emails.
 *
 * - Primary provider: Resend (https://resend.com)
 * - Templates: stored in-memory with variable interpolation
 * - Logging: writes to emailLogs table via Drizzle
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email';
 *   await sendEmail({ to: 'user@example.com', template: 'welcome', variables: { userName: 'John' } });
 */

import { Resend } from 'resend';
import { db } from '@hsafx/db';
import { emailLogs, emailTemplates } from '@hsafx/db/schema';
import { eq, and } from '@hsafx/db/schema';

// ─── Configuration ──────────────────────────────────────────────────────────

const FROM_EMAIL = process.env.EMAIL_FROM || 'HSAFX World <noreply@hsafx.world>';
const APP_NAME = 'HSAFX World';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let _resend: Resend | undefined;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for email sending');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ─── Template Types ─────────────────────────────────────────────────────────

export type EmailTemplateName =
  | 'welcome'
  | 'email-verification'
  | 'password-reset'
  | 'invoice-receipt'
  | 'usage-alert';

interface EmailTemplate {
  subject: string;
  html: (vars: Record<string, string>) => string;
  text: (vars: Record<string, string>) => string;
}

// ─── HTML Escape ────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Return a copy of vars with all values HTML-escaped */
function esc(vars: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    out[k] = escapeHtml(v);
  }
  return out;
}

// ─── Templates ──────────────────────────────────────────────────────────────

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 20px 0; border-bottom: 2px solid #0070f3; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #0070f3; }
    .btn { display: inline-block; padding: 12px 24px; background: #0070f3; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 13px; color: #999; }
    .code { background: #f4f4f4; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header"><h1>${APP_NAME}</h1></div>
  ${content}
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    <p>If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>`;
}

const TEMPLATES: Record<EmailTemplateName, EmailTemplate> = {
  'welcome': {
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: (rawVars) => { const vars = esc(rawVars); return wrapHtml(`
      <h2>Welcome, ${vars.userName || 'there'}!</h2>
      <p>Thanks for signing up for ${APP_NAME}. Your account is ready to go.</p>
      <p>Explore hundreds of developer tools — text converters, code formatters, data generators, and more.</p>
      <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
      <p>If you have any questions, just reply to this email.</p>
    `); },
    text: (vars) =>
      `Welcome to ${APP_NAME}, ${vars.userName || 'there'}!\n\nYour account is ready. Visit ${APP_URL}/dashboard to get started.\n\nIf you have questions, reply to this email.`,
  },

  'email-verification': {
    subject: `Verify your email — ${APP_NAME}`,
    html: (rawVars) => { const vars = esc(rawVars); return wrapHtml(`
      <h2>Verify your email address</h2>
      <p>Hi ${vars.userName || 'there'},</p>
      <p>Click the button below to verify your email address and activate your account:</p>
      <a href="${vars.verifyLink}" class="btn">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #666;">${vars.verifyLink}</p>
      <p>This link expires in <strong>24 hours</strong>.</p>
    `); },
    text: (vars) =>
      `Hi ${vars.userName || 'there'},\n\nVerify your email address by visiting:\n${vars.verifyLink}\n\nThis link expires in 24 hours.`,
  },

  'password-reset': {
    subject: `Reset your password — ${APP_NAME}`,
    html: (rawVars) => { const vars = esc(rawVars); return wrapHtml(`
      <h2>Reset your password</h2>
      <p>Hi ${vars.userName || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="${vars.resetLink}" class="btn">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #666;">${vars.resetLink}</p>
      <p>This link expires in <strong>1 hour</strong>. If you didn't request this, no action is needed.</p>
    `); },
    text: (vars) =>
      `Hi ${vars.userName || 'there'},\n\nReset your password by visiting:\n${vars.resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  },

  'invoice-receipt': {
    subject: `Invoice receipt — ${APP_NAME}`,
    html: (rawVars) => { const vars = esc(rawVars); return wrapHtml(`
      <h2>Payment received</h2>
      <p>Hi ${vars.userName || 'there'},</p>
      <p>We've received your payment. Here's your receipt:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Invoice #</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${vars.invoiceNumber || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Plan</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${vars.planName || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${vars.amount || '$0.00'}</td></tr>
        <tr><td style="padding: 8px;"><strong>Date</strong></td><td style="padding: 8px;">${vars.date || new Date().toLocaleDateString()}</td></tr>
      </table>
      <a href="${APP_URL}/billing" class="btn">View Billing</a>
    `); },
    text: (vars) =>
      `Payment received!\n\nInvoice #${vars.invoiceNumber || 'N/A'}\nPlan: ${vars.planName || 'N/A'}\nAmount: ${vars.amount || '$0.00'}\nDate: ${vars.date || new Date().toLocaleDateString()}\n\nView billing: ${APP_URL}/billing`,
  },

  'usage-alert': {
    subject: `Usage limit warning — ${APP_NAME}`,
    html: (rawVars) => { const vars = esc(rawVars); return wrapHtml(`
      <h2>Usage limit approaching</h2>
      <p>Hi ${vars.userName || 'there'},</p>
      <p>You've used <strong>${vars.usagePercent || '80'}%</strong> of your <strong>${vars.limitName || 'daily tool executions'}</strong> limit for the current period.</p>
      <p>Current usage: <span class="code">${vars.currentUsage || '0'} / ${vars.maxUsage || '0'}</span></p>
      <p>To continue using tools without interruption, consider upgrading your plan:</p>
      <a href="${APP_URL}/billing" class="btn">Upgrade Plan</a>
    `); },
    text: (vars) =>
      `Usage Alert: You've used ${vars.usagePercent || '80'}% of your ${vars.limitName || 'daily tool executions'} limit.\n\nCurrent: ${vars.currentUsage || '0'} / ${vars.maxUsage || '0'}\n\nUpgrade: ${APP_URL}/billing`,
  },
};

// ─── Public API ─────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  template: EmailTemplateName;
  variables?: Record<string, string>;
  userId?: string;
}

interface SendRawEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  templateId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── DB Template Layer ──────────────────────────────────────────────────────

/**
 * Interpolates `{{variableName}}` placeholders in a string.
 */
function interpolate(template: string, variables: Record<string, string>, shouldEscape = false): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variables[key] ?? '';
    return shouldEscape ? escapeHtml(val) : val;
  });
}

/**
 * Try to load a template from the database by slug.
 * Returns null if DB is unavailable or template doesn't exist.
 */
async function loadDbTemplate(
  slug: string
): Promise<{ id: string; subject: string; htmlBody: string; textBody: string | null } | null> {
  try {
    const rows = await db
      .select({
        id: emailTemplates.id,
        subject: emailTemplates.subject,
        htmlBody: emailTemplates.htmlBody,
        textBody: emailTemplates.textBody,
      })
      .from(emailTemplates)
      .where(and(eq(emailTemplates.slug, slug), eq(emailTemplates.isActive, true)))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    // DB may not have the table yet — fall back to in-memory
    return null;
  }
}

/**
 * Send a templated email via Resend.
 * Priority: DB template (if exists & active) → in-memory fallback template
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, template, variables = {}, userId } = options;

  // 1. Try DB template first
  const dbTpl = await loadDbTemplate(template);
  if (dbTpl) {
    return sendRawEmail({
      to,
      subject: interpolate(dbTpl.subject, variables),
      html: interpolate(dbTpl.htmlBody, variables, true),
      text: dbTpl.textBody ? interpolate(dbTpl.textBody, variables) : undefined,
      userId,
      templateId: dbTpl.id,
    });
  }

  // 2. Fallback to in-memory template
  const tpl = TEMPLATES[template];
  if (!tpl) {
    return { success: false, error: `Unknown template: ${template}` };
  }

  return sendRawEmail({
    to,
    subject: tpl.subject,
    html: tpl.html(variables),
    text: tpl.text(variables),
    userId,
  });
}

/**
 * Send a raw email (no template) via Resend
 */
export async function sendRawEmail(options: SendRawEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, userId } = options;

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      // Log failure
      await logEmail({
        to,
        subject,
        status: 'failed',
        provider: 'resend',
        errorMessage: result.error.message,
        userId,
      });
      return { success: false, error: result.error.message };
    }

    // Log success
    await logEmail({
      to,
      subject,
      status: 'sent',
      provider: 'resend',
      providerMessageId: result.data?.id,
      userId,
    });

    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown email error';

    // Log error
    await logEmail({
      to,
      subject,
      status: 'failed',
      provider: 'resend',
      errorMessage: errorMsg,
      userId,
    });

    return { success: false, error: errorMsg };
  }
}

// ─── Logging ────────────────────────────────────────────────────────────────

interface LogEmailParams {
  to: string;
  subject: string;
  status: string;
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  userId?: string;
  templateId?: string;
}

async function logEmail(params: LogEmailParams) {
  try {
    await db.insert(emailLogs).values({
      toEmail: params.to,
      subject: params.subject,
      status: params.status,
      provider: params.provider,
      providerMessageId: params.providerMessageId,
      errorMessage: params.errorMessage,
      userId: params.userId,
      templateId: params.templateId,
      sentAt: params.status === 'sent' ? new Date() : undefined,
    });
  } catch (logErr) {
    // Don't let logging failures break email sending
    console.error('[Email] Failed to log email:', logErr);
  }
}
