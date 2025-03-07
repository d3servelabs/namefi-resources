import { config } from '@/lib/config';
import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';

export default defineDrizzleConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
