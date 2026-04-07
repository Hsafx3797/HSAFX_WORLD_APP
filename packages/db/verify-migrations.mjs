/**
 * Verify the 3 migration changes were applied correctly.
 * Usage: node packages/db/verify-migrations.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from root .env
try {
  const envPath = resolve(__dirname, '../../.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match) {
    process.env.DATABASE_URL = match[1].trim().replace(/^['"]/, '').replace(/['"]$/, '');
  }
} catch { /* ignore */ }

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
  const client = await pool.connect();
  let allPassed = true;

  try {
    // ─── 1. Verify dispute_frozen column ───
    console.log('=== Verify 1: dispute_frozen column ===');
    const col = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_coin_wallets' AND column_name = 'dispute_frozen'
    `);
    if (col.rows.length === 1) {
      const r = col.rows[0];
      console.log(`  PASS: type=${r.data_type}, default=${r.column_default}, nullable=${r.is_nullable}`);
      if (r.data_type !== 'boolean') { console.log('  FAIL: Expected boolean type'); allPassed = false; }
      if (r.is_nullable !== 'NO') { console.log('  FAIL: Expected NOT NULL'); allPassed = false; }
    } else {
      console.log('  FAIL: Column not found');
      allPassed = false;
    }

    // ─── 2. Verify composite index ───
    console.log('\n=== Verify 2: coin_tx_user_type_created_idx ===');
    const idx = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE indexname = 'coin_tx_user_type_created_idx'
    `);
    if (idx.rows.length === 1) {
      console.log(`  PASS: ${idx.rows[0].indexdef}`);
    } else {
      console.log('  FAIL: Index not found');
      allPassed = false;
    }

    // ─── 3. Verify FK cascade ───
    console.log('\n=== Verify 3: tool_coin_costs.tool_id ON DELETE CASCADE ===');
    const fk = await client.query(`
      SELECT 
        tc.constraint_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'tool_coin_costs' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'tool_id'
    `);
    if (fk.rows.length === 1 && fk.rows[0].delete_rule === 'CASCADE') {
      console.log(`  PASS: ${fk.rows[0].constraint_name} has ON DELETE CASCADE`);
    } else if (fk.rows.length === 1) {
      console.log(`  FAIL: FK delete rule is ${fk.rows[0].delete_rule}, expected CASCADE`);
      allPassed = false;
    } else {
      console.log('  FAIL: FK not found');
      allPassed = false;
    }

    // ─── 4. Extra: verify schema matches code (spot check) ───
    console.log('\n=== Extra: Schema spot checks ===');
    
    // Check user_coin_wallets has all expected columns
    const walletCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_coin_wallets' ORDER BY ordinal_position
    `);
    console.log(`  user_coin_wallets columns: ${walletCols.rows.map(r => r.column_name).join(', ')}`);

    // Check tool_coin_costs has all expected columns
    const tccCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'tool_coin_costs' ORDER BY ordinal_position
    `);
    console.log(`  tool_coin_costs columns: ${tccCols.rows.map(r => r.column_name).join(', ')}`);

    // Check coin_transactions indexes
    const ctIdx = await client.query(`
      SELECT indexname FROM pg_indexes WHERE tablename = 'coin_transactions'
    `);
    console.log(`  coin_transactions indexes: ${ctIdx.rows.map(r => r.indexname).join(', ')}`);

    console.log(`\n${'='.repeat(50)}`);
    console.log(allPassed ? 'ALL VERIFICATIONS PASSED' : 'SOME VERIFICATIONS FAILED');
    console.log('='.repeat(50));
  } finally {
    client.release();
    await pool.end();
  }

  if (!allPassed) process.exit(1);
}

verify().catch(err => {
  console.error('Verification failed:', err.message);
  pool.end();
  process.exit(1);
});
