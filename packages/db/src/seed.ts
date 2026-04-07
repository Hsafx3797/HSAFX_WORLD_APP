/**
 * Database Seed Script
 *
 * Seeds essential data for a fresh HSAFX World App deployment:
 * - Admin roles & permissions
 * - Subscription plans & limits
 * - Coin packs
 * - Feature flags
 * - Tool categories
 * - B2B plans, suites, engine→suite mappings, and plan quotas
 *
 * Usage: DATABASE_URL=... pnpm --filter @hsafx/db seed
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const {
  roles,
  permissions,
  rolePermissions,
  plans,
  planLimits,
  planFeatures,
  planCoinRules,
  coinPacks,
  featureFlags,
  toolCategories,
  b2bPlans,
  b2bSuites,
  b2bSuiteCategories,
  b2bPlanQuotas,
} = schema;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log('🌱 Seeding database...\n');

  const roleData = [
    { name: 'super_admin', description: 'Full system access — all permissions' },
    { name: 'admin', description: 'Everything except system configuration' },
    { name: 'support', description: 'Read users, view tickets, small coin adjustments' },
    { name: 'developer', description: 'Tools management, API access, logs' },
    { name: 'analyst', description: 'Read-only analytics, reports, exports' },
    { name: 'billing', description: 'Billing management, refunds, plan changes' },
  ];

  const permissionData = [
    { name: 'users.list', description: 'List all users', category: 'users' },
    { name: 'users.read', description: 'View user details', category: 'users' },
    { name: 'users.update', description: 'Edit user profiles', category: 'users' },
    { name: 'users.delete', description: 'Delete users', category: 'users' },
    { name: 'users.impersonate', description: 'Impersonate users', category: 'users' },
    { name: 'tools.list', description: 'List all tools', category: 'tools' },
    { name: 'tools.create', description: 'Create new tools', category: 'tools' },
    { name: 'tools.update', description: 'Edit tool settings', category: 'tools' },
    { name: 'tools.delete', description: 'Delete/archive tools', category: 'tools' },
    { name: 'tools.toggle', description: 'Enable/disable tools', category: 'tools' },
    { name: 'billing.view', description: 'View billing data', category: 'billing' },
    { name: 'billing.manage', description: 'Manage plans and packs', category: 'billing' },
    { name: 'billing.refund', description: 'Issue refunds', category: 'billing' },
    { name: 'billing.adjust_coins', description: 'Adjust user coin balances', category: 'billing' },
    { name: 'admin.dashboard', description: 'View admin dashboard', category: 'admin' },
    { name: 'admin.audit_log', description: 'View audit logs', category: 'admin' },
    { name: 'admin.manage_roles', description: 'Manage roles and permissions', category: 'admin' },
    { name: 'admin.manage_admins', description: 'Add/remove admin users', category: 'admin' },
    { name: 'system.config', description: 'Modify system configuration', category: 'system' },
    { name: 'system.feature_flags', description: 'Toggle feature flags', category: 'system' },
    { name: 'system.api_keys', description: 'Manage API keys', category: 'system' },
    { name: 'analytics.view', description: 'View analytics dashboards', category: 'analytics' },
    { name: 'analytics.export', description: 'Export analytics data', category: 'analytics' },
  ];

  const planData = [
    { name: 'Free', slug: 'free', description: 'Basic access with daily coin grant', priceMonthlyCents: 0, priceYearlyCents: 0, coinGrant: 50 },
    { name: 'Pro', slug: 'pro', description: 'Professional tier with 20% discount on tool costs', priceMonthlyCents: 999, priceYearlyCents: 9999, coinGrant: 500 },
    { name: 'Advance', slug: 'advance', description: 'Enterprise-grade with priority execution and 40% discount', priceMonthlyCents: 2999, priceYearlyCents: 29999, coinGrant: 2000 },
  ];

  const coinPackData = [
    { name: 'Starter', coins: 100, priceInCents: 199, bonusCoins: 0, sortOrder: 1 },
    { name: 'Popular', coins: 500, priceInCents: 799, bonusCoins: 50, sortOrder: 2 },
    { name: 'Pro Pack', coins: 1000, priceInCents: 1499, bonusCoins: 150, sortOrder: 3 },
    { name: 'Mega Pack', coins: 5000, priceInCents: 5999, bonusCoins: 1000, sortOrder: 4 },
    { name: 'Enterprise', coins: 20000, priceInCents: 19999, bonusCoins: 5000, sortOrder: 5 },
  ];

  const flagData = [
    { name: 'kill_all_tools', description: 'Emergency: disable all tool execution', flagType: 'kill_switch', isEnabled: false },
    { name: 'kill_payments', description: 'Emergency: disable all payment processing', flagType: 'kill_switch', isEnabled: false },
    { name: 'kill_signups', description: 'Emergency: disable new user registration', flagType: 'kill_switch', isEnabled: false },
    { name: 'kill_file_uploads', description: 'Emergency: disable file upload processing', flagType: 'kill_switch', isEnabled: false },
    { name: 'enable_login_rewards', description: 'Allow users to earn coins via daily/hourly login rewards', flagType: 'toggle', isEnabled: true },
    { name: 'enable_oauth_google', description: 'Google OAuth login', flagType: 'toggle', isEnabled: true },
    { name: 'enable_oauth_github', description: 'GitHub OAuth login', flagType: 'toggle', isEnabled: true },
    { name: 'enable_oauth_facebook', description: 'Facebook OAuth login', flagType: 'toggle', isEnabled: false },
    { name: 'enable_api_access', description: 'Allow external API access for paid tiers', flagType: 'toggle', isEnabled: false },
    { name: 'enable_bulk_operations', description: 'Allow batch tool execution', flagType: 'toggle', isEnabled: false },
    { name: 'maintenance_mode', description: 'Show maintenance page to all users', flagType: 'toggle', isEnabled: false },
    { name: 'experiment_new_dashboard', description: 'A/B test: new dashboard layout', flagType: 'experiment', isEnabled: false, rolloutPercentage: 0 },
    { name: 'experiment_ai_suggestions', description: 'A/B test: AI-powered tool suggestions', flagType: 'experiment', isEnabled: false, rolloutPercentage: 0 },
  ];

  const categoryData = [
    { name: 'Text Tools', slug: 'text', description: 'Text manipulation, formatting, and analysis tools', icon: 'type', sortOrder: 1 },
    { name: 'Data Tools', slug: 'data', description: 'JSON, CSV, XML, and data format converters', icon: 'database', sortOrder: 2 },
    { name: 'Converters', slug: 'converters', description: 'Unit, number, and format conversion tools', icon: 'repeat', sortOrder: 3 },
    { name: 'Encoders & Decoders', slug: 'encoders', description: 'Base64, URL, HTML encoding/decoding', icon: 'code', sortOrder: 4 },
    { name: 'Calculators', slug: 'calculators', description: 'Math, finance, and utility calculators', icon: 'calculator', sortOrder: 5 },
    { name: 'Formatters', slug: 'formatters', description: 'Code, date, and text formatters', icon: 'align-left', sortOrder: 6 },
    { name: 'Validators', slug: 'validators', description: 'Email, URL, JSON, and data validators', icon: 'check-circle', sortOrder: 7 },
    { name: 'Generators', slug: 'generators', description: 'UUID, password, lorem ipsum generators', icon: 'zap', sortOrder: 8 },
    { name: 'Media Tools', slug: 'media', description: 'Image, audio, and video processing', icon: 'image', sortOrder: 9 },
    { name: 'Code Tools', slug: 'code', description: 'Minifiers, beautifiers, and code utilities', icon: 'terminal', sortOrder: 10 },
    { name: 'Network Tools', slug: 'network', description: 'DNS, IP, and HTTP utilities', icon: 'globe', sortOrder: 11 },
    { name: 'Security Tools', slug: 'security', description: 'Hash, encrypt, and security utilities', icon: 'shield', sortOrder: 12 },
    { name: 'Color Tools', slug: 'color', description: 'Color pickers, palettes, and converters', icon: 'palette', sortOrder: 13 },
    { name: 'PDF Tools', slug: 'pdf', description: 'PDF merge, split, convert, and extract', icon: 'file-text', sortOrder: 14 },
    { name: 'Specialized Tools', slug: 'specialized', description: 'Islamic finance, GPA, timezone, and other specialized tools', icon: 'star', sortOrder: 15 },
  ];

  await db.transaction(async (tx) => {
    // ── 1. Roles ──────────────────────────────────────────────
    console.log('  → Roles');
    const insertedRoles = await tx
      .insert(roles)
      .values(roleData)
      .onConflictDoNothing({ target: roles.name })
      .returning();
    console.log(`    ✓ ${insertedRoles.length} roles`);

    // ── 2. Permissions ────────────────────────────────────────
    console.log('  → Permissions');
    const insertedPerms = await tx
      .insert(permissions)
      .values(permissionData)
      .onConflictDoNothing({ target: permissions.name })
      .returning();
    console.log(`    ✓ ${insertedPerms.length} permissions`);

    // ── 3. Role → Permission mappings ─────────────────────────
    console.log('  → Role-Permission mappings');
    const allRoles = await tx.select().from(roles);
    const allPerms = await tx.select().from(permissions);
    const roleMap = Object.fromEntries(allRoles.map((r) => [r.name, r.id]));
    const permMap = Object.fromEntries(allPerms.map((p) => [p.name, p.id]));
    const allPermNames = allPerms.map((p) => p.name);

    const rolePermMap: Record<string, string[]> = {
      super_admin: allPermNames,
      admin: allPermNames.filter((p) => !p.startsWith('system.')),
      support: ['users.list', 'users.read', 'billing.view', 'billing.adjust_coins', 'admin.dashboard', 'admin.audit_log'],
      developer: ['tools.list', 'tools.create', 'tools.update', 'tools.toggle', 'admin.dashboard', 'admin.audit_log', 'system.api_keys'],
      analyst: ['analytics.view', 'analytics.export', 'admin.dashboard', 'users.list', 'billing.view', 'tools.list'],
      billing: ['billing.view', 'billing.manage', 'billing.refund', 'billing.adjust_coins', 'admin.dashboard', 'users.list', 'users.read'],
    };

    const rpValues: { roleId: string; permissionId: string }[] = [];
    for (const [roleName, permNames] of Object.entries(rolePermMap)) {
      for (const permName of permNames) {
        if (roleMap[roleName] && permMap[permName]) {
          rpValues.push({ roleId: roleMap[roleName], permissionId: permMap[permName] });
        }
      }
    }

    if (rpValues.length > 0) {
      await tx.insert(rolePermissions).values(rpValues).onConflictDoNothing();
    }
    console.log(`    ✓ ${rpValues.length} role-permission mappings`);

    // ── 4. Plans ──────────────────────────────────────────────
    console.log('  → Plans');
    const insertedPlans = await tx
      .insert(plans)
      .values(planData)
      .onConflictDoNothing({ target: plans.slug })
      .returning();
    console.log(`    ✓ ${insertedPlans.length} plans`);

    const allPlans = await tx.select().from(plans);
    const planMap = Object.fromEntries(allPlans.map((p) => [p.slug, p.id]));

    const planLimitData = [
      // General limits
      { planId: planMap['free'], limitKey: 'max_file_size', limitValue: 10, unit: 'MB', description: 'Max upload file size' },
      { planId: planMap['free'], limitKey: 'api_rate_limit', limitValue: 30, unit: 'requests/min', description: 'API rate limit' },
      { planId: planMap['free'], limitKey: 'daily_executions', limitValue: 100, unit: 'executions/day', description: 'Max daily tool executions' },
      { planId: planMap['free'], limitKey: 'max_ads_per_day', limitValue: 5, unit: 'ads/day', description: 'Max ad reward claims per day' },
      // Per-category tool limits (daily, -1 = unlimited)
      { planId: planMap['free'], limitKey: 'daily_text', limitValue: -1, unit: 'executions/day', description: 'Daily text tool executions' },
      { planId: planMap['free'], limitKey: 'daily_code', limitValue: 50, unit: 'executions/day', description: 'Daily code tool executions' },
      { planId: planMap['free'], limitKey: 'daily_file', limitValue: 10, unit: 'executions/day', description: 'Daily file tool executions' },
      { planId: planMap['free'], limitKey: 'daily_generator', limitValue: 25, unit: 'executions/day', description: 'Daily generator tool executions' },
      { planId: planMap['free'], limitKey: 'daily_calculator', limitValue: -1, unit: 'executions/day', description: 'Daily calculator tool executions' },
      { planId: planMap['free'], limitKey: 'daily_visualizer', limitValue: 10, unit: 'executions/day', description: 'Daily visualizer tool executions' },
      { planId: planMap['free'], limitKey: 'daily_intelligence', limitValue: 5, unit: 'executions/day', description: 'Daily intelligence tool executions' },
      // Pro limits
      { planId: planMap['pro'], limitKey: 'max_file_size', limitValue: 50, unit: 'MB', description: 'Max upload file size' },
      { planId: planMap['pro'], limitKey: 'api_rate_limit', limitValue: 120, unit: 'requests/min', description: 'API rate limit' },
      { planId: planMap['pro'], limitKey: 'daily_executions', limitValue: 1000, unit: 'executions/day', description: 'Max daily tool executions' },
      { planId: planMap['pro'], limitKey: 'max_ads_per_day', limitValue: 10, unit: 'ads/day', description: 'Max ad reward claims per day' },
      { planId: planMap['pro'], limitKey: 'daily_text', limitValue: -1, unit: 'executions/day', description: 'Daily text tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_code', limitValue: -1, unit: 'executions/day', description: 'Daily code tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_file', limitValue: -1, unit: 'executions/day', description: 'Daily file tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_generator', limitValue: -1, unit: 'executions/day', description: 'Daily generator tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_calculator', limitValue: -1, unit: 'executions/day', description: 'Daily calculator tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_visualizer', limitValue: -1, unit: 'executions/day', description: 'Daily visualizer tool executions' },
      { planId: planMap['pro'], limitKey: 'daily_intelligence', limitValue: 20, unit: 'executions/day', description: 'Daily intelligence tool executions' },
      // Advance limits
      { planId: planMap['advance'], limitKey: 'max_file_size', limitValue: 200, unit: 'MB', description: 'Max upload file size' },
      { planId: planMap['advance'], limitKey: 'api_rate_limit', limitValue: 600, unit: 'requests/min', description: 'API rate limit' },
      { planId: planMap['advance'], limitKey: 'daily_executions', limitValue: 10000, unit: 'executions/day', description: 'Max daily tool executions' },
      { planId: planMap['advance'], limitKey: 'max_ads_per_day', limitValue: 0, unit: 'ads/day', description: 'No ads for Advance tier' },
      { planId: planMap['advance'], limitKey: 'daily_text', limitValue: -1, unit: 'executions/day', description: 'Daily text tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_code', limitValue: -1, unit: 'executions/day', description: 'Daily code tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_file', limitValue: -1, unit: 'executions/day', description: 'Daily file tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_generator', limitValue: -1, unit: 'executions/day', description: 'Daily generator tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_calculator', limitValue: -1, unit: 'executions/day', description: 'Daily calculator tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_visualizer', limitValue: -1, unit: 'executions/day', description: 'Daily visualizer tool executions' },
      { planId: planMap['advance'], limitKey: 'daily_intelligence', limitValue: -1, unit: 'executions/day', description: 'Daily intelligence tool executions' },
    ];
    await tx.insert(planLimits).values(planLimitData.filter((l): l is typeof l & { planId: string } => !!l.planId)).onConflictDoNothing();
    console.log(`    ✓ ${planLimitData.length} plan limits`);

    const planFeatureData = [
      { planId: planMap['free'], featureKey: 'api_access', enabled: false },
      { planId: planMap['free'], featureKey: 'priority_execution', enabled: false },
      { planId: planMap['free'], featureKey: 'bulk_operations', enabled: false },
      { planId: planMap['free'], featureKey: 'export_formats', enabled: true, limitValue: 2 },
      { planId: planMap['pro'], featureKey: 'api_access', enabled: true },
      { planId: planMap['pro'], featureKey: 'priority_execution', enabled: false },
      { planId: planMap['pro'], featureKey: 'bulk_operations', enabled: true },
      { planId: planMap['pro'], featureKey: 'export_formats', enabled: true, limitValue: 5 },
      { planId: planMap['advance'], featureKey: 'api_access', enabled: true },
      { planId: planMap['advance'], featureKey: 'priority_execution', enabled: true },
      { planId: planMap['advance'], featureKey: 'bulk_operations', enabled: true },
      { planId: planMap['advance'], featureKey: 'export_formats', enabled: true, limitValue: 10 },
    ];
    await tx.insert(planFeatures).values(planFeatureData.filter((f): f is typeof f & { planId: string } => !!f.planId)).onConflictDoNothing();
    console.log(`    ✓ ${planFeatureData.length} plan features`);

    const planCoinRuleData = [
      { planId: planMap['free'], toolClass: 'text', discountPercent: 0 },
      { planId: planMap['free'], toolClass: 'media', discountPercent: 0 },
      { planId: planMap['free'], toolClass: 'data', discountPercent: 0 },
      { planId: planMap['pro'], toolClass: 'text', discountPercent: 20 },
      { planId: planMap['pro'], toolClass: 'media', discountPercent: 20 },
      { planId: planMap['pro'], toolClass: 'data', discountPercent: 20 },
      { planId: planMap['advance'], toolClass: 'text', discountPercent: 40 },
      { planId: planMap['advance'], toolClass: 'media', discountPercent: 40 },
      { planId: planMap['advance'], toolClass: 'data', discountPercent: 40 },
    ];
    await tx.insert(planCoinRules).values(planCoinRuleData.filter((r): r is typeof r & { planId: string } => !!r.planId)).onConflictDoNothing();
    console.log(`    ✓ ${planCoinRuleData.length} plan coin rules`);

    // ── 5. Coin Packs ────────────────────────────────────────
    console.log('  → Coin Packs');
    const insertedPacks = await tx
      .insert(coinPacks)
      .values(coinPackData)
      .onConflictDoNothing()
      .returning();
    console.log(`    ✓ ${insertedPacks.length} coin packs`);

    // ── 6. Feature Flags ──────────────────────────────────────
    console.log('  → Feature Flags');
    const insertedFlags = await tx
      .insert(featureFlags)
      .values(flagData)
      .onConflictDoNothing({ target: featureFlags.name })
      .returning();
    console.log(`    ✓ ${insertedFlags.length} feature flags`);

    // ── 7. Tool Categories ────────────────────────────────────
    console.log('  → Tool Categories');
    const insertedCategories = await tx
      .insert(toolCategories)
      .values(categoryData)
      .onConflictDoNothing({ target: toolCategories.slug })
      .returning();
    console.log(`    ✓ ${insertedCategories.length} tool categories`);

    // ── 8. B2B Plans ─────────────────────────────────────────
    console.log('  → B2B Plans');
    const b2bPlanData = [
      { name: 'Basic', slug: 'basic', description: 'Starter API plan', priceMonthlyCents: 4900, priceYearlyCents: 49000 },
      { name: 'Pro', slug: 'pro', description: 'Professional API plan', priceMonthlyCents: 14900, priceYearlyCents: 149000 },
      { name: 'Enterprise', slug: 'enterprise', description: 'Enterprise API plan', priceMonthlyCents: 49900, priceYearlyCents: 499000 },
    ];
    await tx.insert(b2bPlans).values(b2bPlanData).onConflictDoNothing({ target: b2bPlans.slug });
    const allB2bPlans = await tx.select().from(b2bPlans);
    const b2bPlanMap = Object.fromEntries(allB2bPlans.map((p) => [p.slug, p.id]));
    console.log(`    ✓ ${allB2bPlans.length} B2B plans`);

    // ── 9. B2B Suites ────────────────────────────────────────
    console.log('  → B2B Suites');
    const b2bSuiteData = [
      { slug: 'text-processing', name: 'Text Processing', description: 'Case, wrap, filter, transform, comment, markup', sortOrder: 1 },
      { slug: 'data-encoding', name: 'Data & Encoding', description: 'Encode, hash, counter, unicode', sortOrder: 2 },
      { slug: 'data-conversion', name: 'Data Conversion', description: 'Convert, format, schema, diff, api', sortOrder: 3 },
      { slug: 'generation', name: 'Generation & Validation', description: 'Generate-data, generate-web, calculate, unit, validate', sortOrder: 4 },
      { slug: 'media-processing', name: 'Media Processing', description: 'Image, video, audio, pdf, document, archive, file, font', sortOrder: 5 },
    ];
    await tx.insert(b2bSuites).values(b2bSuiteData).onConflictDoNothing({ target: b2bSuites.slug });
    const allB2bSuites = await tx.select().from(b2bSuites);
    const suiteMap = Object.fromEntries(allB2bSuites.map((s) => [s.slug, s.id]));
    console.log(`    ✓ ${allB2bSuites.length} B2B suites`);

    // ── 10. B2B Suite Categories (engine → suite mapping) ────
    console.log('  → B2B Suite Categories');
    const engineSuiteMapping: Record<string, string[]> = {
      'text-processing': ['case', 'wrap', 'filter', 'transform', 'comment', 'markup'],
      'data-encoding': ['encode', 'hash', 'counter', 'unicode'],
      'data-conversion': ['convert', 'format', 'schema', 'diff', 'api'],
      'generation': ['generate-data', 'generate-web', 'calculate', 'unit', 'validate'],
      'media-processing': ['image', 'video', 'audio', 'pdf', 'document', 'archive', 'file', 'font'],
    };
    const suiteCategoryValues: { b2bSuiteId: string; category: string }[] = [];
    for (const [suiteSlug, engines] of Object.entries(engineSuiteMapping)) {
      for (const engine of engines) {
        if (suiteMap[suiteSlug]) {
          suiteCategoryValues.push({ b2bSuiteId: suiteMap[suiteSlug], category: engine });
        }
      }
    }
    await tx.insert(b2bSuiteCategories).values(suiteCategoryValues).onConflictDoNothing({ target: b2bSuiteCategories.category });
    console.log(`    ✓ ${suiteCategoryValues.length} engine→suite mappings`);

    // ── 11. B2B Plan Quotas (suite × plan) ───────────────────
    console.log('  → B2B Plan Quotas');
    // monthlyLimit: -1 = unlimited (enforced as MAX_SAFE_INTEGER in quota service)
    const quotaGrid: Record<string, Record<string, number>> = {
      basic:      { 'text-processing': 5000, 'data-encoding': 3000, 'data-conversion': 2000, 'generation': 1000, 'media-processing': 500 },
      pro:        { 'text-processing': 50000, 'data-encoding': 30000, 'data-conversion': 20000, 'generation': 10000, 'media-processing': 5000 },
      enterprise: { 'text-processing': 999999999, 'data-encoding': 999999999, 'data-conversion': 999999999, 'generation': 999999999, 'media-processing': 50000 },
    };
    const quotaValues: { b2bPlanId: string; b2bSuiteId: string; monthlyLimit: number }[] = [];
    for (const [planSlug, suites] of Object.entries(quotaGrid)) {
      for (const [suiteSlug, limit] of Object.entries(suites)) {
        if (b2bPlanMap[planSlug] && suiteMap[suiteSlug]) {
          quotaValues.push({ b2bPlanId: b2bPlanMap[planSlug], b2bSuiteId: suiteMap[suiteSlug], monthlyLimit: limit });
        }
      }
    }
    await tx.insert(b2bPlanQuotas).values(quotaValues).onConflictDoNothing();
    console.log(`    ✓ ${quotaValues.length} plan-suite quotas`);
  });

  // ── Done ──────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log(`   Roles: ${roleData.length}`);
  console.log(`   Permissions: ${permissionData.length}`);
  console.log(`   Plans: ${planData.length}`);
  console.log(`   Coin Packs: ${coinPackData.length}`);
  console.log(`   Feature Flags: ${flagData.length}`);
  console.log(`   Tool Categories: ${categoryData.length}`);
  console.log(`   B2B Plans: 3`);
  console.log(`   B2B Suites: 5`);
  console.log(`   B2B Engine→Suite Mappings: 28`);
  console.log(`   B2B Plan Quotas: 15`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
