import { defineConfig } from '@c15t/backend';
import { drizzleAdapter } from '@c15t/backend/db/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { secrets } from './src/lib/env';

const DEFAULT_TRUSTED_ORIGINS = [
  'namefi.io',
  'astra.namefi.io',
  'poweredby.namefi.io',
  'r.namefi.io',
  'namefi.dev',
  'astra.namefi.dev',
  'poweredby.namefi.dev',
  'r.namefi.dev',
  'localhost',
] as const;

function parseTrustedOrigins(value: string | undefined): string[] {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!origins?.length) {
    return [...DEFAULT_TRUSTED_ORIGINS];
  }

  if (origins.includes('*')) {
    throw new Error(
      'C15T_TRUSTED_ORIGINS must list explicit origins; "*" is not allowed.',
    );
  }

  return Array.from(new Set(origins));
}

const db = drizzle(new Pool({ connectionString: secrets.DATABASE_URL }));
const trustedOrigins = parseTrustedOrigins(secrets.C15T_TRUSTED_ORIGINS);

export default defineConfig({
  trustedOrigins,
  adapter: drizzleAdapter({ db, provider: 'postgresql' }),
});
