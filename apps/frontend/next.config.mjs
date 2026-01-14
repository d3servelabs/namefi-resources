/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import createMdx from '@next/mdx';
import { createJiti } from 'jiti';
import packageJson from './package.json' with { type: 'json' };

/** @type {import('jiti').Jiti} */
const jiti = createJiti(import.meta.url, { tryNative: false });

/** @type {{ loadInfisicalSecretsIfConfigured: import('@namefi-astra/env/infisical').loadInfisicalSecretsIfConfigured }} */
const { loadInfisicalSecretsIfConfigured } = await jiti.import(
  '@namefi-astra/env/infisical',
);
await loadInfisicalSecretsIfConfigured({ allowEnvPassthrough: true });

const withMDX = createMdx({
  extension: /\.mdx?$/,
});

/** @type {{ config: import('./src/lib/env/schema').ConfigInput }} */
const { config: appConfig } = await jiti.import('./src/lib/env/load');

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: false,
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
      'process.env.LOADED_CLIENT_SIDE_ENV': JSON.stringify(
        Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            key.startsWith('NEXT_PUBLIC_'),
          ),
        ),
      ),
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'pino-elasticsearch',
    'thread-stream',
    '@walletconnect/*',
  ],
  experimental: {
    authInterrupts: true,
    turbopackFileSystemCacheForDev: true,
    // Favor per-module imports for large libraries to reduce dev compile time.
    optimizePackageImports: ['date-fns', 'ramda', 'lucide-react'],
  },
  env: {
    version: packageJson.version,
    name: packageJson.name,
    ENVIRONMENT: process.env.ENVIRONMENT,
  },
  typescript: {
    // Note: validate is run on CI with build
    ignoreBuildErrors: true,
  },
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/r',
        destination: `${appConfig.RESOURCES_URL}/r`,
      },
      {
        source: '/r/:path*',
        destination: `${appConfig.RESOURCES_URL}/r/:path*`,
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
        source: '/b/:lang/blog/:path*',
        destination: '/r/:lang/:path*',
        permanent: true,
      },
      {
        source: '/b/:path*',
        permanent: false,
        destination: 'https://namefi.io/r/:path*',
      },
      {
        source: '/discord',
        destination:
          process.env.DISCORD_REDIRECT_URL || 'https://discord.gg/namefi',
        permanent: false,
      },
    ];
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default withMDX(nextConfig);
