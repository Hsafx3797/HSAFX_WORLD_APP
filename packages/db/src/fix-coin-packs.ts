/**
 * One-time cleanup: remove duplicate coin_packs rows.
 * The seed had no unique constraint on `name`, so multiple runs inserted duplicates.
 * Keeps only the row with lowest sortOrder per name; deletes the rest.
 *
 * Usage: DATABASE_URL=... pnpm --filter @hsafx/db exec tsx src/fix-coin-packs.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { coinPacks } from './schema';
import { inArray } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

async function main() {
  console.log('Fetching all coin packs...');
  const all = await db.select().from(coinPacks);
  console.log(`Found ${all.length} total coin pack rows`);

  if (all.length <= 3) {
    console.log('No duplicates detected. Nothing to clean up.');
    for (const p of all) {
      console.log(`  ✓ ${p.name} — ${p.coins} coins @ $${p.priceInCents / 100}`);
    }
    return;
  }

  // Group by name, keep the one with lowest sortOrder (ties: take first found)
  const byName = new Map<string, typeof all[number]>();
  for (const pack of all) {
    const existing = byName.get(pack.name);
    if (!existing || pack.sortOrder < existing.sortOrder) {
      byName.set(pack.name, pack);
    }
  }

  const keepIds = new Set(Array.from(byName.values()).map((p) => p.id));
  const deleteIds = all.filter((p) => !keepIds.has(p.id)).map((p) => p.id);

  console.log(`Keeping ${keepIds.size} rows, deleting ${deleteIds.length} duplicates...`);

  await db.delete(coinPacks).where(inArray(coinPacks.id, deleteIds));

  console.log('✅ Cleanup complete.');

  const remaining = await db.select().from(coinPacks);
  console.log(`Remaining rows: ${remaining.length}`);
  for (const p of remaining) {
    console.log(`  ✓ ${p.name} — ${p.coins} coins @ $${p.priceInCents / 100}`);
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
