import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔄 Running migrations...');

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('✅ Migrations completed successfully');
  process.exit(0);
};

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
