import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import { config } from '#lib/config';

neonConfig.webSocketConstructor = ws;

const client = neon(config.DATABASE_URL);

export const db = drizzle({ client });
