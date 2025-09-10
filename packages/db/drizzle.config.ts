import '@namefi-astra/env/preload-sync';
import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';
import { secrets } from './src/lib/env';

export default defineDrizzleConfig({
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: secrets.DATABASE_URL,
  },
});
