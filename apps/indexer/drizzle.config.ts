import { defineConfig as defineDrizzleConfig } from 'drizzle-kit';

export default defineDrizzleConfig({
  schema: './ponder.schema.ts',
  dialect: 'postgresql',
  driver: 'pglite',
  dbCredentials: {
    url: './ponder.db',
  },
});
