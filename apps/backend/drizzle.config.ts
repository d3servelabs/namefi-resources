import { secrets } from '@/lib/env';
import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';

export default defineDrizzleConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: secrets.DATABASE_URL,
  },
});
