import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';
import { secrets } from '#lib/env';

export default defineDrizzleConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: secrets.DATABASE_URL,
  },
});
