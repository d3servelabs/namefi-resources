import '@namefi-astra/env/preload';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { secrets } from './lib/env';
import * as relations from './relations';
import * as schema from './schema';
import { InMemoryDrizzleCache } from '@samyx/drizzler-utils/cache';

type Schema = typeof schema & typeof relations;

let db: NeonDatabase<Schema> | NodePgDatabase<Schema>;

switch (secrets.DATABASE_DRIVER) {
  case 'neon': {
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');

    neonConfig.webSocketConstructor = ws.default;
    const pool = new Pool({ connectionString: secrets.DATABASE_URL });
    db = drizzle(pool, {
      schema: { ...schema, ...relations },
      cache: new InMemoryDrizzleCache(
        30_000,
        process.env.LOG_LEVEL === 'trace',
      ),
    });
    break;
  }
  case 'pg': {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');

    const pool = new Pool({ connectionString: secrets.DATABASE_URL });
    db = drizzle(pool, {
      schema: { ...schema, ...relations },
      cache: new InMemoryDrizzleCache(
        30_000,
        process.env.LOG_LEVEL === 'trace',
      ),
    });
    break;
  }
  default: {
    throw new Error('Invalid database driver');
  }
}

export { db };
export type DB = typeof db;

type TransactionConfig = Parameters<typeof db.transaction>[1];

/**
 * Execute a function within a database transaction if none is already active
 * If a transaction context is passed, uses that instead of creating a new one
 */
export async function $withTransaction<T>(
  callback: (tx: DB) => Promise<T>,
  config?: TransactionConfig,
  existingTx?: DB,
): Promise<T> {
  return (existingTx ?? db).transaction(callback, config);
}
