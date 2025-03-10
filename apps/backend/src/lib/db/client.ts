import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import { secrets } from '#lib/env';

neonConfig.webSocketConstructor = ws;

const client = neon(secrets.DATABASE_URL);

export const db = drizzle({ client });
