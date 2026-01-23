import { defineConfig } from '@c15t/backend/v2';
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { secrets } from './src/lib/env';

const db = drizzle(new Pool({ connectionString: secrets.DATABASE_URL }));

export default defineConfig({
  adapter: drizzleAdapter({ provider: 'postgresql', db }),
});
