/**
 * Targeted migration script for 3 specific production-readiness changes:
 * 1. Add dispute_frozen column to user_coin_wallets
 * 2. Add composite index on coin_transactions(user_id, type, created_at)
 * 3. Ensure tool_coin_costs.tool_id FK has ON DELETE CASCADE
 *
 * Usage: DATABASE_URL=... node packages/db/migrate-targeted.mjs
 * Or: tsx packages/db/migrate-targeted.mjs (will load from root .env)
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Always load DATABASE_URL from root .env (to ensure clean parsing)
try {
  const envPath = resolve(__dirname, '../../.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match) {
    // Strip whitespace (including \r from CRLF), then quotes
    process.env.DATABASE_URL = match[1].trim().replace(/^['"]/, '').replace(/['"]$/, '');
  }
} catch {
  // ignore - fall through to check
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found');
  process.exit(1);
}

// Debug: show URL info without exposing credentials
const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  console.log('Connected to Neon database.\n');

  try {
    // ─── 1. Check & add dispute_frozen column ───
    console.log('=== Migration 1: dispute_frozen column ===');
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_coin_wallets' AND column_name = 'dispute_frozen'
    `);
    if (colCheck.rows.length > 0) {
      console.log('  SKIP: dispute_frozen column already exists\n');
    } else {
      const tableCheck = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'user_coin_wallets'
      `);
      if (tableCheck.rows.length === 0) {
        console.log('  SKIP: user_coin_wallets table does not exist yet\n');
      } else {
        await client.query(`
          ALTER TABLE user_coin_wallets 
          ADD COLUMN dispute_frozen BOOLEAN NOT NULL DEFAULT false
        `);
        console.log('  DONE: Added dispute_frozen column\n');
      }
    }

    // ─── 2. Check & add composite index ───
    console.log('=== Migration 2: coin_tx_user_type_created_idx ===');
    const idxCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE indexname = 'coin_tx_user_type_created_idx'
    `);
    if (idxCheck.rows.length > 0) {
      console.log('  SKIP: coin_tx_user_type_created_idx already exists\n');
    } else {
      const tableCheck2 = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'coin_transactions'
      `);
      if (tableCheck2.rows.length === 0) {
        console.log('  SKIP: coin_transactions table does not exist yet\n');
      } else {
        await client.query(`
          CREATE INDEX coin_tx_user_type_created_idx 
          ON coin_transactions(user_id, type, created_at)
        `);
        console.log('  DONE: Created composite index\n');
      }
    }

    // ─── 3. Check & fix tool_coin_costs FK cascade ───
    console.log('=== Migration 3: tool_coin_costs.tool_id ON DELETE CASCADE ===');
    const fkCheck = await client.query(`
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
    if (fkCheck.rows.length === 0) {
      const tableCheck3 = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'tool_coin_costs'
      `);
      if (tableCheck3.rows.length === 0) {
        console.log('  SKIP: tool_coin_costs table does not exist yet\n');
      } else {
        console.log('  SKIP: No FK found on tool_coin_costs.tool_id (table exists but no FK)\n');
      }
    } else {
      const { constraint_name, delete_rule } = fkCheck.rows[0];
      if (delete_rule === 'CASCADE') {
        console.log(`  SKIP: FK ${constraint_name} already has ON DELETE CASCADE\n`);
      } else {
        console.log(`  Current FK: ${constraint_name} with ON DELETE ${delete_rule}`);
        await client.query(`ALTER TABLE tool_coin_costs DROP CONSTRAINT "${constraint_name}"`);
        await client.query(`ALTER TABLE tool_coin_costs ADD CONSTRAINT "${constraint_name}" FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE`);
        console.log(`  DONE: Replaced FK with ON DELETE CASCADE\n`);
      }
    }

    // ─── Summary: show current DB tables ───
    console.log('=== DB Tables Summary ===');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`Total tables: ${tables.rows.length}`);
    tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

    console.log('\nMigration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  pool.end();
  process.exit(1);
});
