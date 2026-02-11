# 🛠️ ADMIN PANEL SPECIFICATION

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ APPROVED

> **Purpose:**  
> Complete specification for the admin panel — a separate Next.js application that provides "complete dev maintenance team" capabilities with full RBAC, real-time monitoring, and autonomous control over all platform aspects.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [RBAC System](#3-rbac-system)
4. [Authentication & Security](#4-authentication--security)
5. [Dashboard & Monitoring](#5-dashboard--monitoring)
6. [User Management](#6-user-management)
7. [Subscription Management](#7-subscription-management)
8. [Tool Management](#8-tool-management)
9. [Billing & Transactions](#9-billing--transactions)
10. [System Configuration](#10-system-configuration)
11. [Audit Logging](#11-audit-logging)
12. [Real-Time Updates](#12-real-time-updates)
13. [Feature Breakdown](#13-feature-breakdown)

---

## 1. Overview

### 1.1 Philosophy

The admin panel is designed to be a **"complete dev maintenance team by itself"** — meaning:
- ✅ Full autonomous control over all platform aspects
- ✅ No direct database access needed for routine ops
- ✅ Real-time visibility into system health
- ✅ Complete RBAC for team collaboration
- ✅ Audit trail for all actions
- ✅ 2FA for destructive operations
- ✅ Self-service analytics and reports

### 1.2 Key Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN PANEL CAPABILITIES                       │
└─────────────────────────────────────────────────────────────┘

User Management
  ├─→ View, search, filter users
  ├─→ Edit profiles, change plans
  ├─→ Ban, suspend, delete accounts
  ├─→ Reset passwords, unlock accounts
  └─→ View user activity & usage stats

Subscription Management
  ├─→ View all subscriptions
  ├─→ Manually upgrade/downgrade plans
  ├─→ Pause, resume, cancel subscriptions
  ├─→ Issue refunds, adjust billing
  └─→ View payment history & invoices

Billing & Transactions
  ├─→ Coin transactions (view, filter, export)
  ├─→ Manual coin adjustments (refunds, bonuses)
  ├─→ Payment webhook logs & retries
  ├─→ Reconciliation reports
  └─→ Revenue analytics

Tool Management
  ├─→ Enable/disable tools
  ├─→ Update tool metadata (pricing, limits)
  ├─→ Force browser/server execution mode
  ├─→ View tool usage analytics
  └─→ Tool error rates & performance

System Configuration
  ├─→ Feature flags
  ├─→ Rate limit adjustments
  ├─→ Ad reward settings (coins per ad, daily cap)
  ├─→ Anonymous user limits
  ├─→ Email templates
  ├─→ Theme presets
  └─→ API keys (B2B)

Monitoring & Alerts
  ├─→ Real-time dashboard (errors, traffic, revenue)
  ├─→ Error logs & stack traces
  ├─→ Webhook failure logs
  ├─→ Job queue status
  ├─→ Database & Redis metrics
  └─→ Alert history & acknowledgment

Audit & Security
  ├─→ Complete audit log (all admin actions)
  ├─→ Admin activity tracking
  ├─→ Security incident logs
  ├─→ Failed login attempts
  └─→ API key usage & abuse detection
```

---

## 2. Architecture

### 2.1 Deployment Model

```
┌─────────────────────────────────────────────────────────────┐
│           ADMIN PANEL ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐   ┌─────────────────────────────┐
│   User-Facing Frontend        │   │   Admin Panel Frontend      │
│   (app.hsafx.com)             │   │   (admin.hsafx.com)         │
│                               │   │                             │
│   Next.js 15 / React 19       │   │   Next.js 15 / React 19     │
│   • Tool UI                   │   │   • Admin Dashboard         │
│   • User auth (sessions)      │   │   • Admin auth (sessions)   │
│   • Public pages              │   │   • Real-time WebSocket     │
└─────────────┬─────────────────┘   └─────────────┬───────────────┘
              │                                   │
              │                                   │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   Shared Next.js Backend          │
              │   (API Routes)                    │
              │                                   │
              │   • PostgreSQL access             │
              │   • Redis access                  │
              │   • Stripe/Polar integration      │
              │   • RBAC middleware               │
              │   • Admin-specific API routes     │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   FastAPI (Compute Service)       │
              │   • Tool execution                │
              │   • Job processing                │
              │   • Redis job status updates      │
              └───────────────────────────────────┘
```

### 2.2 Hosting Strategy

| Component | Hosting | URL | Access |
|-----------|---------|-----|--------|
| **User Frontend** | Vercel | `app.hsafx.com` | Public |
| **Admin Frontend** | Vercel | `admin.hsafx.com` | Admin-only (IP whitelist + auth) |
| **Shared Backend** | Vercel (API Routes) | `app.hsafx.com/api` | Both frontends |
| **FastAPI** | Railway/Fly.io | `api.hsafx.com` | Backend only |
| **PostgreSQL** | Neon | N/A | Backend only |
| **Redis** | Upstash | N/A | Backend + FastAPI |

### 2.3 Authentication Separation

**User Frontend:**
- Session-based auth (Better-Auth)
- Google OAuth + email/password
- 7-day session expiry
- Stored in Redis

**Admin Frontend:**
- Separate session-based auth (Better-Auth)
- Email/password only (no OAuth)
- 24-hour session expiry
- Separate Redis namespace: `admin:session:<id>`
- 2FA required for all admin users
- IP whitelist (optional, configurable)

---

## 3. RBAC System

### 3.1 Admin Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Full system access | All permissions |
| **Admin** | General admin | View + manage users, subscriptions, tools |
| **Support** | Customer support | View users, view subscriptions, issue refunds |
| **Developer** | Dev team | View errors, logs, system config, deploy tools |
| **Analyst** | Data team | View-only analytics, reports, export data |
| **Billing** | Finance team | View billing, transactions, issue refunds |

### 3.2 Permission Matrix

| Permission | Super Admin | Admin | Support | Developer | Analyst | Billing |
|------------|-------------|-------|---------|-----------|---------|---------|
| **Users** | | | | | | |
| View users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ban users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ⚠️ (2FA) | ❌ | ❌ | ❌ | ❌ |
| **Subscriptions** | | | | | | |
| View subscriptions | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Upgrade/downgrade | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel subscription | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue refunds | ✅ | ⚠️ (2FA) | ⚠️ (2FA) | ❌ | ❌ | ⚠️ (2FA) |
| **Billing** | | | | | | |
| View transactions | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Manual coin adjust | ✅ | ⚠️ (2FA) | ❌ | ❌ | ❌ | ⚠️ (2FA) |
| Export reports | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Tools** | | | | | | |
| View tools | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Enable/disable | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update metadata | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Force exec mode | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **System** | | | | | | |
| View logs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View errors | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Feature flags | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Rate limits | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Email templates | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Admin** | | | | | | |
| View admins | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add/remove admins | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

### 3.3 RBAC Implementation

```typescript
// Middleware for admin routes
// app/admin/middleware.ts
import { verifyAdminSession } from "@/lib/admin-auth";
import { checkPermission } from "@/lib/rbac";

export async function adminMiddleware(req: NextRequest) {
  // 1. Verify admin session
  const session = await verifyAdminSession(req);
  if (!session) {
    return NextResponse.redirect("/admin/login");
  }

  // 2. Check permission for route
  const route = req.nextUrl.pathname;
  const requiredPermission = getPermissionForRoute(route);
  
  if (!checkPermission(session.role, requiredPermission)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  // 3. Check 2FA for destructive operations
  const requires2FA = destructiveOperations.includes(route);
  if (requires2FA && !session.twoFactorVerified) {
    return NextResponse.json(
      { error: "2FA verification required" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

// RBAC permission checker
// lib/rbac.ts
const permissions = {
  "super_admin": ["*"],  // All permissions
  "admin": [
    "users.view", "users.edit", "users.ban",
    "subscriptions.view", "subscriptions.manage",
    "billing.view", "billing.export",
    "tools.view", "tools.manage",
    "system.view", "system.config",
    "audit.view"
  ],
  "support": [
    "users.view", "users.edit",
    "subscriptions.view", "subscriptions.manage",
    "billing.view"
  ],
  "developer": [
    "tools.view", "tools.manage",
    "system.view", "system.config", "system.logs",
    "audit.view"
  ],
  "analyst": [
    "users.view",
    "subscriptions.view",
    "billing.view", "billing.export",
    "tools.view",
    "system.analytics"
  ],
  "billing": [
    "subscriptions.view",
    "billing.view", "billing.export"
  ]
};

export function checkPermission(role: string, permission: string): boolean {
  const rolePermissions = permissions[role] || [];
  
  // Super admin has all permissions
  if (rolePermissions.includes("*")) return true;
  
  // Check exact permission
  if (rolePermissions.includes(permission)) return true;
  
  // Check wildcard permission (e.g., "users.*" matches "users.view")
  const [category, _] = permission.split(".");
  if (rolePermissions.includes(`${category}.*`)) return true;
  
  return false;
}
```

---

## 4. Authentication & Security

### 4.1 Admin Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│           ADMIN AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

Admin visits admin.hsafx.com
     │
     ├─→ Not logged in → Redirect to /admin/login
     │
     ▼
Login Page
     │
     ├─→ Enter email + password
     │
     ▼
POST /api/admin/auth/login
     │
     ├─→ Verify credentials (PostgreSQL)
     ├─→ Check if admin account active
     ├─→ Create session (Redis: admin:session:<id>)
     │
     ▼
2FA Challenge Page
     │
     ├─→ Enter TOTP code (Google Authenticator)
     │
     ▼
POST /api/admin/auth/verify-2fa
     │
     ├─→ Verify TOTP code
     ├─→ Mark session as 2FA-verified
     │
     ▼
Admin Dashboard
     │
     ├─→ Session valid for 24 hours
     ├─→ Activity extends session by 1 hour
     └─→ Inactivity > 1 hour → Require 2FA re-verification
```

### 4.2 Two-Factor Authentication (2FA)

**2FA Requirements:**
- ✅ **Mandatory** for all admin users
- ✅ TOTP-based (Google Authenticator, Authy, 1Password)
- ✅ Backup codes (10 codes, single-use)
- ✅ Re-verification for destructive operations

**Destructive Operations (Require 2FA):**
- Delete user account
- Ban user permanently
- Issue refund
- Manual coin adjustment
- Delete admin account
- Change admin roles

**2FA Implementation:**
```typescript
// Setup 2FA for admin
// app/api/admin/auth/setup-2fa/route.ts
import { generateSecret, generateQRCode } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const session = await verifyAdminSession(req);
  
  // Generate TOTP secret
  const secret = generateSecret();
  const qrCode = await generateQRCode(secret, session.email);
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  
  // Store secret (encrypted) + backup codes (hashed)
  await db.admin.update({
    where: { id: session.adminId },
    data: {
      totpSecret: encrypt(secret),
      backupCodes: backupCodes.map(code => hash(code))
    }
  });
  
  return NextResponse.json({
    qrCode,
    backupCodes  // Show once, user must save
  });
}

// Verify 2FA for destructive operation
// app/api/admin/users/[id]/delete/route.ts
export async function DELETE(req: NextRequest, { params }) {
  const session = await verifyAdminSession(req);
  
  // Check permission
  if (!checkPermission(session.role, "users.delete")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  
  // Require 2FA verification
  const { totpCode } = await req.json();
  const isValid = await verifyTOTP(session.adminId, totpCode);
  
  if (!isValid) {
    return NextResponse.json({ error: "Invalid 2FA code" }, { status: 403 });
  }
  
  // Perform deletion
  await deleteUser(params.id);
  
  // Log audit trail
  await logAuditEvent({
    adminId: session.adminId,
    action: "user.delete",
    targetId: params.id,
    ip: req.headers.get("x-forwarded-for"),
    userAgent: req.headers.get("user-agent")
  });
  
  return NextResponse.json({ success: true });
}
```

### 4.3 IP Whitelist (Optional)

**For high-security environments:**
```typescript
// Middleware to check IP whitelist
// app/admin/middleware.ts
const allowedIPs = process.env.ADMIN_IP_WHITELIST?.split(",") || [];

export function checkIPWhitelist(req: NextRequest): boolean {
  if (allowedIPs.length === 0) return true;  // No whitelist configured
  
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  return allowedIPs.includes(ip);
}
```

---

## 5. Dashboard & Monitoring

### 5.1 Real-Time Dashboard

**Primary Metrics (Auto-updating):**
```
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN DASHBOARD                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📊 Overview (Last 24 hours)                                 │
├──────────────────────────────────────────────────────────────┤
│  Active Users:         1,247  ↑ 8.3%                        │
│  Total Executions:    12,483  ↑ 12.1%                       │
│  Revenue:             $1,234  ↑ 5.7%                        │
│  Error Rate:            0.4%  ↓ 0.1%                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🚨 Active Alerts (3)                                        │
├──────────────────────────────────────────────────────────────┤
│  [CRITICAL] 500 Errors Spike (12/min) - 3 min ago           │
│  [HIGH] Database connection slow (>500ms) - 8 min ago       │
│  [MEDIUM] Webhook failures (Stripe) - 15 min ago            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📈 Real-Time Metrics (Live)                                 │
├──────────────────────────────────────────────────────────────┤
│  Requests/min:      247/min  [████████░░] 82% capacity      │
│  Job Queue:           12 jobs [███░░░░░░░] 12% full         │
│  Database:         45ms avg  [██░░░░░░░░] Healthy           │
│  Redis:             2ms avg  [█░░░░░░░░░] Healthy           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🔥 Top Tools (Last 1 hour)                                  │
├──────────────────────────────────────────────────────────────┤
│  1. JSON Formatter           1,247 executions               │
│  2. Text Case Converter        892 executions               │
│  3. Base64 Encoder/Decoder     678 executions               │
│  4. Word Counter               543 executions               │
│  5. URL Encoder/Decoder        432 executions               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Recent Errors (Last 10)                                  │
├──────────────────────────────────────────────────────────────┤
│  [S001] Database timeout - 2 min ago                         │
│  [E001] Invalid JSON - 3 min ago                             │
│  [R001] Rate limit exceeded - 5 min ago                      │
│  [F003] Virus detected - 8 min ago                           │
│  [I001] Stripe API error - 12 min ago                        │
│  → View All Errors                                           │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Analytics Reports

**Pre-built Reports:**
1. **Revenue Report**
   - Daily/weekly/monthly revenue
   - Revenue by plan type
   - Revenue by payment method
   - Churn rate & MRR trends

2. **User Activity Report**
   - New signups vs churned users
   - Active users (DAU/MAU)
   - Tool usage distribution
   - User retention cohorts

3. **Tool Performance Report**
   - Most popular tools
   - Tool execution times
   - Error rates per tool
   - Browser vs server execution ratios

4. **Billing Report**
   - Coin purchases vs ad rewards
   - Average coins per user
   - Refund rates
   - Payment failure rates

5. **System Health Report**
   - Error rate trends
   - Database query performance
   - Redis cache hit rates
   - External service uptime (Stripe, Polar, etc.)

---

## 6. User Management

### 6.1 User List View

**Features:**
- Search by email, name, user ID
- Filter by plan type, status, signup date
- Sort by signup date, last active, total spent
- Bulk actions (ban, send email)
- Export to CSV

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| User ID | `USR_abc123` | Copy |
| Email | `user@example.com` | Email user |
| Name | `John Doe` | Edit |
| Plan | `Pro` (badge) | Upgrade/downgrade |
| Status | `Active` / `Suspended` / `Banned` | Change status |
| Coins | `1,234` | Manual adjust |
| Signup Date | `2025-01-15` | Sort |
| Last Active | `2 hours ago` | Sort |
| Total Spent | `$129.99` | View transactions |

### 6.2 User Detail View

**Sections:**
1. **Profile**
   - Basic info (name, email, avatar)
   - Edit button → Edit profile modal
   - Ban button → Ban user modal (2FA)
   - Delete button → Delete user modal (2FA, destructive)

2. **Subscription**
   - Current plan + status
   - Next billing date
   - Payment method
   - Actions: Upgrade, downgrade, cancel, pause

3. **Billing**
   - Coin balance
   - Coin transaction history (table)
   - Manual adjust button (2FA)
   - Payment history (invoices, refunds)

4. **Activity**
   - Recent tool executions (last 50)
   - Login history (last 10)
   - Device/IP info
   - Actions: View full activity log

5. **Security**
   - 2FA status
   - Active sessions
   - Failed login attempts
   - Actions: Force logout, reset password

---

## 7. Subscription Management

### 7.1 Subscription List View

**Features:**
- Search by user email, subscription ID
- Filter by plan type, status, provider (Polar/manual)
- Sort by start date, end date, MRR
- Export to CSV

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| Subscription ID | `SUB_xyz789` | Copy |
| User | `user@example.com` | View user |
| Plan | `Pro` (monthly/yearly) | Change plan |
| Status | `Active` / `Canceled` / `Expired` | View details |
| MRR | `$29.00` | Sort |
| Start Date | `2025-01-01` | Sort |
| Next Billing | `2025-02-01` | Sort |
| Provider | `Polar` / `Manual` | View provider |

### 7.2 Manual Subscription Management

**Actions:**
- **Upgrade Plan**: Change to higher-tier plan
  - Immediate: Apply now, charge prorated amount
  - Next cycle: Apply at next billing date
- **Downgrade Plan**: Change to lower-tier plan
  - Next cycle only (no refund for current period)
- **Cancel Subscription**: Cancel at end of current period
  - Immediate: Cancel now, issue prorated refund (2FA)
- **Pause Subscription**: Temporarily pause billing
  - Duration: 1-3 months
  - Resume automatically or manually
- **Issue Refund**: Refund last payment (2FA)
  - Full refund or partial refund
  - Reason required for audit log

### 7.3 Plan Configuration (✅ Admin-Configurable)

**Purpose:** Define plan features, limits, permissions, and theme access without code changes.

#### 7.3.1 Plan Editor

**Tabs:**

**A. Basic Info**
- Plan code (stable identifier: `free`, `pro`, `advance`)
- Display name
- Price (cents), currency, interval
- Description, is_active, is_popular

**B. Limits (plan_limits table)**
- Add/edit resource limits with live preview
- Resource key dropdown: `image.file_size`, `api.requests`, `tool.executions`
- Value type: Integer, Size, Duration, Boolean, Complex
- Unlimited toggle
- Reset period: Daily, Weekly, Monthly

| Resource Key | Type | Limit | Reset Period | Actions |
|--------------|------|-------|--------------|---------|
| image.file_size | Size | 10 MB | - | Edit / Delete |
| api.requests | Integer | 1000 | Monthly | Edit / Delete |
| tool.pdf_merge | Integer | Unlimited | - | Edit / Delete |

**C. Permissions (plan_permissions table)**
- Tool category access (logistics, bulk, media, etc.)
- Feature access (API, PrioritySupport, etc.)
- Drag-and-drop interface

| Permission Type | Resource Key | Allowed | Actions |
|----------------|--------------|---------|---------|
| tool_category | logistics | ✅ Yes | Toggle / Delete |
| tool_category | bulk | ✅ Yes | Toggle / Delete |
| feature | API | ✅ Yes | Toggle / Delete |
| feature | PrioritySupport | ❌ No | Toggle / Delete |

**D. Theme Access (plan_theme_access table)**
- Drag-and-drop preset assignment
- Bulk enable/disable presets
- Preview preset visually

| Preset Code | Available | Preview | Actions |
|-------------|-----------|---------|---------|
| default | ✅ Yes | [Color] | Toggle / View |
| red | ✅ Yes | [Color] | Toggle / View |
| pro-dark | ❌ No | [Color] | Toggle / View |

**Actions:**
- Save changes → Update database
- Preview plan → Show what users see
- Duplicate plan → Create new plan from template
- Delete plan (2FA) → Soft delete with reassignment

---

## 8. Tool Management

### 8.1 Tool List View

**Features:**
- Search by tool name, ID, category
- Filter by execution mode, status, category
- Sort by usage count, error rate, average execution time
- Bulk actions (enable/disable)

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| Tool ID | `JSON_FORMATTER` | Copy |
| Name | `JSON Formatter` | Edit metadata |
| Category | `Code` | Filter |
| Status | `Enabled` / `Disabled` | Toggle |
| Execution Mode | `Browser` / `Server` / `Both` | Change |
| Usage (24h) | `1,247 executions` | View analytics |
| Error Rate | `0.2%` | View errors |
| Avg Time | `45ms` | View performance |

### 8.2 Tool Detail View

**Sections:**
1. **Metadata**
   - Name, description, category
   - Pricing (coins per execution)
   - Execution mode (browser/server/both)
   - Status (enabled/disabled)
   - Edit button → Edit metadata modal

2. **Usage Analytics**
   - Total executions (7d/30d/all-time)
   - Unique users (7d/30d/all-time)
   - Browser vs server execution ratio
   - Average execution time trend

3. **Error Logs**
   - Recent errors (last 50)
   - Error code distribution
   - Error rate trend
   - Actions: View full error log

4. **Configuration**
   - Force execution mode dropdown:
     - `Auto` (let client decide)
     - `Force Browser` (always browser)
     - `Force Server` (always server)
   - Rate limit override (per-tool)
   - Max file size (for file tools)

---

## 9. Billing & Transactions

### 9.1 Coin Transaction Log

**Features:**
- Search by user email, transaction ID
- Filter by type (purchase/ad reward/deduction/refund)
- Filter by date range
- Export to CSV

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| Transaction ID | `TXN_abc123` | Copy |
| User | `user@example.com` | View user |
| Type | `Purchase` / `Ad Reward` / `Deduction` / `Refund` | Filter |
| Amount | `+500` / `-10` | Sort |
| Balance After | `1,234` | View |
| Description | `JSON Formatter execution` | View |
| Timestamp | `2025-01-15 14:32:05` | Sort |

### 9.2 Manual Coin Adjustment

**Modal (2FA Required):**
```
┌────────────────────────────────────────────────────────┐
│  Manual Coin Adjustment                                │
├────────────────────────────────────────────────────────┤
│  User: user@example.com                                │
│  Current Balance: 1,234 coins                          │
│                                                        │
│  Adjustment Type:                                      │
│    ○ Add Coins    ● Deduct Coins                       │
│                                                        │
│  Amount: [______] coins                                │
│                                                        │
│  Reason: [_____________________________________]       │
│           (Required, will be logged in audit trail)    │
│                                                        │
│  2FA Code: [______]                                    │
│                                                        │
│         [Cancel]          [Confirm Adjustment]         │
└────────────────────────────────────────────────────────┘
```

### 9.3 Payment Webhook Logs

**Features:**
- View all webhook events (Polar, Stripe, Uploadthing)
- Filter by provider, status, event type
- Retry failed webhooks manually

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| Webhook ID | `WH_xyz789` | Copy |
| Provider | `Polar` / `Stripe` / `Uploadthing` | Filter |
| Event Type | `checkout.completed` | View details |
| Status | `Success` / `Failed` / `Retrying` | View |
| Payload | `{...}` (truncated) | View full JSON |
| Response | `200 OK` / `500 Error` | View details |
| Timestamp | `2025-01-15 14:32:05` | Sort |
| Retry | Button (if failed) | Retry webhook |

---

## 10. System Configuration

### 10.1 Feature Flags

**UI:**
```
┌────────────────────────────────────────────────────────┐
│  Feature Flags                                         │
├────────────────────────────────────────────────────────┤
│  [✓] Ad Reward System                  [Toggle]       │
│  [✓] Anonymous User Limits             [Toggle]       │
│  [✓] File Upload Tools                 [Toggle]       │
│  [ ] Multi-language Support            [Toggle]       │
│  [ ] Dark Mode (Admin Panel)           [Toggle]       │
│  [✓] Real-time Dashboard Updates       [Toggle]       │
│  [✓] Email Alerts                      [Toggle]       │
│                                                        │
│  [Save Changes]                                        │
└────────────────────────────────────────────────────────┘
```

### 10.2 Ad Reward Configuration

**UI:**
```
┌────────────────────────────────────────────────────────┐
│  Ad Reward Settings                                    │
├────────────────────────────────────────────────────────┤
│  Coins per ad: [10____] coins                          │
│  Daily ads cap: [100___] ads                           │
│  Daily coins cap: [1000__] coins                       │
│                                                        │
│  Fraud Prevention:                                     │
│    IP rate limit: [10___] ads per hour                │
│    CAPTCHA after: [20___] ads                          │
│                                                        │
│  [Save Changes]                                        │
└────────────────────────────────────────────────────────┘
```

### 10.3 Anonymous User Limits

**UI:**
```
┌────────────────────────────────────────────────────────┐
│  Anonymous User Limits                                 │
├────────────────────────────────────────────────────────┤
│  Text/Calculators: [Unlimited___] per day              │
│  Code Tools:       [10__________] per day              │
│  File Tools:       [3___________] per day              │
│  Generators:       [5___________] per day              │
│                                                        │
│  [✓] Require CAPTCHA for VPN/proxy IPs                │
│                                                        │
│  [Save Changes]                                        │
└────────────────────────────────────────────────────────┘
```

### 10.4 Rate Limit Configuration

**UI (Per-tool or global):**
```
┌────────────────────────────────────────────────────────┐
│  Rate Limits                                           │
├────────────────────────────────────────────────────────┤
│  Global IP Rate Limit:     [100___] requests per min   │
│  Anonymous User:           [20____] requests per min   │
│  Free Plan:                [60____] requests per min   │
│  Pro Plan:                 [300___] requests per min   │
│  Advance Plan:             [1000__] requests per min   │
│                                                        │
│  API Key Rate Limits:                                  │
│    Basic:    [100___] requests per hour                │
│    Pro:      [1000__] requests per hour                │
│    Business: [5000__] requests per hour                │
│    Enterprise: [Custom] (set per key)                  │
│                                                        │
│  [Save Changes]                                        │
└────────────────────────────────────────────────────────┘
```

### 10.5 Email Templates

**UI:**
```
┌────────────────────────────────────────────────────────┐
│  Email Templates                                       │
├────────────────────────────────────────────────────────┤
│  Template: [Welcome Email________________] [Edit]     │
│                                                        │
│  Preview:                                              │
│  ┌────────────────────────────────────────────┐       │
│  │  Hi {{userName}},                          │       │
│  │                                             │       │
│  │  Welcome to HSAFX WORLD! We're excited...  │       │
│  │                                             │       │
│  │  [Get Started]                              │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  Variables: {{userName}}, {{userEmail}}, {{planName}} │
│                                                        │
│  [Save Template]  [Send Test Email]                   │
└────────────────────────────────────────────────────────┘
```

---

## 11. Audit Logging

### 11.1 Audit Log View

**Features:**
- View all admin actions (create, update, delete)
- Search by admin email, action type, target ID
- Filter by date range, admin role, action type
- Export to CSV

**Columns:**
| Column | Data | Actions |
|--------|------|---------|
| Timestamp | `2025-01-15 14:32:05` | Sort |
| Admin | `admin@hsafx.com` | View admin |
| Role | `Super Admin` | Filter |
| Action | `user.delete` | Filter |
| Target | `user@example.com` | View target |
| IP Address | `192.168.1.1` | View |
| User Agent | `Chrome 120 / Windows` | View |
| Details | `{...}` (JSON) | View full details |

### 11.2 Audit Event Types

**User Actions:**
- `user.create` — Created new user
- `user.edit` — Edited user profile
- `user.ban` — Banned user
- `user.unban` — Unbanned user
- `user.delete` — Deleted user (2FA)

**Subscription Actions:**
- `subscription.upgrade` — Upgraded plan
- `subscription.downgrade` — Downgraded plan
- `subscription.cancel` — Canceled subscription
- `subscription.pause` — Paused subscription
- `subscription.resume` — Resumed subscription
- `subscription.refund` — Issued refund (2FA)

**Billing Actions:**
- `coin.adjust` — Manual coin adjustment (2FA)
- `payment.refund` — Issued payment refund (2FA)

**Tool Actions:**
- `tool.enable` — Enabled tool
- `tool.disable` — Disabled tool
- `tool.edit` — Edited tool metadata
- `tool.exec_mode` — Changed execution mode

**System Actions:**
- `config.feature_flag` — Changed feature flag
- `config.rate_limit` — Changed rate limit
- `config.email_template` — Edited email template
- `config.ad_reward` — Changed ad reward settings

**Admin Actions:**
- `admin.create` — Created admin account
- `admin.role_change` — Changed admin role
- `admin.delete` — Deleted admin account (2FA)

---

## 12. Real-Time Updates

### 12.1 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           REAL-TIME DASHBOARD UPDATES                       │
└─────────────────────────────────────────────────────────────┘

Admin Panel Frontend (admin.hsafx.com)
     │
     │ WebSocket connection
     ▼
Next.js WebSocket Server (/api/admin/ws)
     │
     │ Subscribe to Redis Pub/Sub channels
     ▼
Redis (Upstash)
     │
     │ Channels:
     │   • admin:errors (new errors)
     │   • admin:alerts (critical alerts)
     │   • admin:metrics (real-time metrics)
     │   • admin:jobs (job status updates)
     │   • admin:webhooks (webhook events)
     ▼
Backend publishes events to Redis
```

### 12.2 Real-Time Events

**Dashboard Auto-Updates:**
- **Every 5 seconds:**
  - Active users count
  - Requests per minute
  - Job queue length
  - Database/Redis latency

- **Instant (event-driven):**
  - New errors (with toast notification)
  - Critical alerts (with sound + toast)
  - Webhook failures (with badge update)
  - Job completions (with badge update)

**Implementation:**
```typescript
// Admin panel WebSocket client
// app/admin/dashboard/page.tsx
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AdminDashboard() {
  const { messages, sendMessage } = useWebSocket("/api/admin/ws");

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === "error") {
        // Show toast notification
        toast.error(`New error: ${msg.data.code}`);
        // Update error count badge
        setErrorCount((prev) => prev + 1);
      }
      
      if (msg.type === "alert" && msg.data.level === "critical") {
        // Play alert sound
        playAlertSound();
        // Show modal with alert details
        showAlertModal(msg.data);
      }
      
      if (msg.type === "metrics") {
        // Update dashboard metrics
        setMetrics(msg.data);
      }
    });
  }, [messages]);

  return (
    <div>
      {/* Dashboard UI */}
    </div>
  );
}
```

---

## 13. Feature Breakdown

### Complete Admin Panel Feature List

**Dashboard (7 features)**
1. Overview metrics (active users, executions, revenue, error rate)
2. Active alerts panel (critical/high/medium)
3. Real-time metrics (requests/min, job queue, DB/Redis latency)
4. Top tools (most executed in last 1 hour)
5. Recent errors (last 10)
6. Revenue chart (7d/30d/all-time)
7. User activity chart (signups, churn, retention)

**Users (10 features)**
1. User list (search, filter, sort, export)
2. User detail view (profile, subscription, billing, activity, security)
3. Edit user profile
4. Ban user (with reason)
5. Unban user
6. Delete user (2FA)
7. Reset password (send email)
8. Force logout (all sessions)
9. View activity log (full history)
10. Bulk actions (ban multiple users, send email)

**Subscriptions (8 features)**
1. Subscription list (search, filter, sort, export)
2. Subscription detail view
3. Upgrade plan (immediate or next cycle)
4. Downgrade plan (next cycle only)
5. Cancel subscription (immediate or end of period)
6. Pause subscription (1-3 months)
7. Resume subscription
8. Issue refund (2FA, full or partial)

**Billing & Transactions (6 features)**
1. Coin transaction log (search, filter, export)
2. Manual coin adjustment (2FA, add or deduct)
3. Payment webhook logs (view, filter, retry)
4. Revenue report (daily/weekly/monthly)
5. Refund report (reasons, amounts)
6. Reconciliation report (Polar vs our DB)

**Tools (6 features)**
1. Tool list (search, filter, sort)
2. Tool detail view (metadata, analytics, errors, config)
3. Edit tool metadata (name, description, pricing)
4. Enable/disable tool
5. Force execution mode (browser/server/auto)
6. Tool analytics (usage, error rate, performance)

**System Configuration (7 subsections)**
1. Feature flags (toggle on/off)
2. Ad reward settings (coins per ad, daily caps, fraud prevention)
3. Anonymous user limits (per-tool-class limits)
4. Rate limits (global, per-plan, per-API-key)
5. Email templates (edit, preview, send test)
6. Theme presets (add, edit, delete)
7. API keys (create, revoke, view usage)

**Audit & Security (5 features)**
1. Audit log (view all admin actions)
2. Admin activity tracking (who did what when)
3. Security incident logs (virus detected, failed logins)
4. Failed login attempts (by IP, by user)
5. API key abuse detection (rate limit exceeded, suspicious patterns)

**Monitoring & Alerts (5 features)**
1. Error logs (view, filter, search, export)
2. Alert history (view, acknowledge, resolve)
3. Email alert configuration (thresholds, recipients)
4. Real-time dashboard updates (WebSocket)
5. System health metrics (DB, Redis, external services)

**Admin Management (4 features)**
1. Admin list (view all admins)
2. Add admin (invite via email)
3. Change admin role
4. Remove admin (2FA)

---

**End of ADMIN_PANEL_SPECIFICATION.md**
