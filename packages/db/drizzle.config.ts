import '@namefi-astra/env/preload-sync';
import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';
import { secrets } from './src/lib/env';

export default defineDrizzleConfig({
  schema: [
    './src/schema.ts',
    './src/schemas/internal.ts',
    './src/schemas/hunt.ts',
    './src/schemas/c15t.ts',
    './src/schemas/managed-indexer-data/index.ts',
  ],
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: secrets.DATABASE_URL,
  },
});
