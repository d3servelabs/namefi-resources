/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import { createJiti } from 'jiti';
import packageJson from './package.json' with { type: 'json' };

/** @type {import('jiti').Jiti} */
const jiti = createJiti(import.meta.url, { tryNative: false });

/** @type {{ config: import('./src/lib/env/schema').Config }} */
const { config: appConfig } = await jiti.import('./src/lib/env/load');

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
      'process.env.LOADED_SECRETS': JSON.stringify(
        Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            key.startsWith('NEXT_PUBLIC_'),
          ),
        ),
      ),
    },
  },
  experimental: {
    authInterrupts: true,
  },
  env: {
    version: packageJson.version,
    name: packageJson.name,
    ENVIRONMENT: process.env.ENVIRONMENT,
  },
  eslint: {
    // Note: validate is run on CI with build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Note: validate is run on CI with build
    ignoreBuildErrors: true,
  },
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/r/:path*',
        destination: 'https://r.namefi.io/r/:path*',
      },
      {
        source: '/my-domains',
        destination: '/domains',
      },
      {
        source: '/domain/:path*',
        destination: '/domains/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/b/:path*',
        permanent: false,
        destination: 'https://namefi.io/r/:path*',
      },
    ];
  },
};

export default nextConfig;
