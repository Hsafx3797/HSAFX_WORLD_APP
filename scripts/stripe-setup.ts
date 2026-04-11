/**
 * Stripe Setup Script
 * Creates products, prices, and configures customer portal for B2B plans and coin packs.
 *
 * Usage:
 *   node node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs scripts/stripe-setup.ts
 *
 * Requires: STRIPE_SECRET_KEY in .env or environment
 *
 * What it does:
 *   1. Creates Stripe products + monthly/yearly prices for each B2B plan
 *   2. Creates Stripe products + one-time prices for each coin pack
 *   3. Updates DB records with Stripe IDs
 *   4. Configures Stripe Customer Portal
 *   5. Creates a Stripe Billing Meter for B2B usage reporting
 *
 * Safe to run multiple times — skips plans/packs that already have Stripe IDs.
 */

import Stripe from 'stripe';
import { db, b2bPlans, coinPacks, eq } from '@hsafx/db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' });

async function setupB2BPlans() {
  console.log('\n=== Setting up B2B Plans ===');

  const plans = await db.select().from(b2bPlans).where(eq(b2bPlans.isActive, true));

  for (const plan of plans) {
    if (plan.stripeProductId && plan.stripePriceIdMonthly && plan.stripePriceIdYearly) {
      console.log(`  ✓ ${plan.name} — already has Stripe IDs, skipping`);
      continue;
    }

    console.log(`  → Creating product for "${plan.name}"...`);

    // Create or reuse product
    let productId = plan.stripeProductId;
    if (!productId) {
      const product = await stripe.products.create({
        name: `HSAFX API — ${plan.name}`,
        description: plan.description ?? `${plan.name} API plan`,
        metadata: { b2bPlanId: plan.id, slug: plan.slug },
      });
      productId = product.id;
      console.log(`    Product created: ${productId}`);
    }

    // Create monthly price if missing
    let monthlyPriceId = plan.stripePriceIdMonthly;
    if (!monthlyPriceId && plan.priceMonthlyCents) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.priceMonthlyCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { b2bPlanId: plan.id, interval: 'monthly' },
      });
      monthlyPriceId = price.id;
      console.log(`    Monthly price: ${monthlyPriceId} ($${(plan.priceMonthlyCents / 100).toFixed(2)}/mo)`);
    }

    // Create yearly price if missing
    let yearlyPriceId = plan.stripePriceIdYearly;
    if (!yearlyPriceId && plan.priceYearlyCents) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.priceYearlyCents,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { b2bPlanId: plan.id, interval: 'yearly' },
      });
      yearlyPriceId = price.id;
      console.log(`    Yearly price:  ${yearlyPriceId} ($${(plan.priceYearlyCents / 100).toFixed(2)}/yr)`);
    }

    // Update DB
    await db.update(b2bPlans).set({
      stripeProductId: productId,
      stripePriceIdMonthly: monthlyPriceId,
      stripePriceIdYearly: yearlyPriceId,
    }).where(eq(b2bPlans.id, plan.id));

    console.log(`    ✓ DB updated for ${plan.name}`);
  }
}

async function setupCoinPacks() {
  console.log('\n=== Setting up Coin Packs ===');

  const packs = await db.select().from(coinPacks).where(eq(coinPacks.isActive, true));

  for (const pack of packs) {
    if (pack.stripeProductId && pack.stripePriceId) {
      console.log(`  ✓ ${pack.name} — already has Stripe IDs, skipping`);
      continue;
    }

    console.log(`  → Creating product for "${pack.name}"...`);

    // Create or reuse product
    let productId = pack.stripeProductId;
    if (!productId) {
      const product = await stripe.products.create({
        name: `HSAFX Coins — ${pack.name}`,
        description: `${pack.coins + pack.bonusCoins} coins`,
        metadata: { coinPackId: pack.id },
      });
      productId = product.id;
      console.log(`    Product created: ${productId}`);
    }

    // Create price if missing
    let priceId = pack.stripePriceId;
    if (!priceId) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: pack.priceInCents,
        currency: 'usd',
        metadata: { coinPackId: pack.id },
      });
      priceId = price.id;
      console.log(`    Price: ${priceId} ($${(pack.priceInCents / 100).toFixed(2)})`);
    }

    // Update DB
    await db.update(coinPacks).set({
      stripeProductId: productId,
      stripePriceId: priceId,
    }).where(eq(coinPacks.id, pack.id));

    console.log(`    ✓ DB updated for ${pack.name}`);
  }
}

async function setupCustomerPortal() {
  console.log('\n=== Configuring Customer Portal ===');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const config = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'HSAFX World — Manage your subscription',
      },
      features: {
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'promotion_code'],
          proration_behavior: 'create_prorations',
        },
        payment_method_update: { enabled: true },
        invoice_history: { list: true },
      },
      default_return_url: `${appUrl}/dashboard/api`,
    });

    console.log(`  ✓ Portal configuration created: ${config.id}`);
    console.log(`  Return URL: ${appUrl}/dashboard/api`);
  } catch (err: unknown) {
    const error = err as { type?: string; message?: string };
    if (error.type === 'StripeInvalidRequestError' && error.message?.includes('already exists')) {
      console.log('  ✓ Portal configuration already exists');
    } else {
      throw err;
    }
  }
}

async function setupUsageMeter() {
  console.log('\n=== Configuring Usage Meter ===');

  const meterName = process.env.STRIPE_USAGE_METER_NAME ?? 'api_calls';

  try {
    const meter = await stripe.billing.meters.create({
      display_name: 'API Calls',
      event_name: meterName,
      default_aggregation: { formula: 'sum' },
    });
    console.log(`  ✓ Billing Meter created: ${meter.id} (event: "${meterName}")`);
  } catch (err: unknown) {
    const error = err as { type?: string; message?: string };
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`  ✓ Billing Meter "${meterName}" already exists`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log('HSAFX World — Stripe Setup Script');
  console.log('='.repeat(50));

  await setupB2BPlans();
  await setupCoinPacks();
  await setupCustomerPortal();
  await setupUsageMeter();

  console.log('\n=== Setup Complete ===');
  console.log('Next steps:');
  console.log('  1. Run drizzle-kit generate + migrate to apply schema changes');
  console.log('  2. Set STRIPE_WEBHOOK_SECRET and configure webhook endpoint in Stripe Dashboard');
  console.log('  3. Set STRIPE_PUBLISHABLE_KEY for client-side billing portal');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSetup failed:', err);
  process.exit(1);
});
