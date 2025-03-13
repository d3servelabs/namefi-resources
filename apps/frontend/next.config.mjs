/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import { createJiti } from 'jiti';

/** @type {import('jiti').Jiti} */
const jiti = createJiti(import.meta.url, { tryNative: false });

/** @type {{ config: import('./src/lib/env/schema').Config }} */
const { config: appConfig } = await jiti.import('./src/lib/env/load');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@namefi-astra/env',
    '@namefi-astra/zod-dns',
    '@namefi-astra/backend',
    '@namefi-astra/db',
  ],
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
    },
  },
};

export default nextConfig;
