import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | undefined;

function createDb(): NeonHttpDatabase<typeof schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const sql: NeonQueryFunction<boolean, boolean> = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy getter for db - only connects when accessed at runtime
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// For backwards compatibility - provides a proxy that connects on first use
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export type Database = NeonHttpDatabase<typeof schema>;
