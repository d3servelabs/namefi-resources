import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import { secrets } from './lib/env';
import * as relations from './relations';
import * as schema from './schema';

neonConfig.webSocketConstructor = ws;

const client = neon(secrets.DATABASE_URL);

export const db = drizzle({ client, schema: { ...schema, ...relations } });

export type DB = typeof db;
