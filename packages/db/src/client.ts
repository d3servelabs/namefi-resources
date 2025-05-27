import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { secrets } from './lib/env';
import * as relations from './relations';
import * as schema from './schema';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: secrets.DATABASE_URL });

export const db = drizzle({
  client: pool,
  schema: { ...schema, ...relations },
});

export type DB = typeof db;
