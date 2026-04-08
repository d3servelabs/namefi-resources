/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import createMdx from '@next/mdx';
import { createJiti } from 'jiti';
import { withDatadogConfig } from './build/with-datadog-config.mjs';
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
const deployCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
const loadedClientConfig = {
  ...appConfig,
  APP_VERSION: packageJson.version,
  DEPLOY_COMMIT_SHA: deployCommitSha,
};
// Keep public config rooted on first-party URLs while allowing a dedicated upstream for /r proxying.
const resourcesProxyOrigin =
  process.env.RESOURCES_PROXY_ORIGIN ||
  (appConfig.TYPE === 'production'
    ? 'https://r.namefi.io'
    : appConfig.RESOURCES_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages that export TypeScript sources directly.
  // This enables better Turbopack caching and more consistent compilation.
  transpilePackages: [
    '@namefi-astra/ai',
    '@namefi-astra/common',
    '@namefi-astra/env',
    '@namefi-astra/registrars',
    '@namefi-astra/utils',
    '@namefi-astra/zod-dns',
  ],
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(loadedClientConfig),
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
    turbopackFileSystemCacheForBuild: true,
    // Favor per-module imports for large libraries to reduce dev compile time.
    optimizePackageImports: [
      'date-fns',
      'ramda',
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'motion/react',
    ],
  },
  typedRoutes: true,
  env: {
    version: packageJson.version,
    name: packageJson.name,
    ENVIRONMENT: process.env.ENVIRONMENT,
    VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV,
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
        destination: `${resourcesProxyOrigin}/r`,
      },
      {
        source: '/r/:path*',
        destination: `${resourcesProxyOrigin}/r/:path*`,
      },
      {
        source: '/my-domains',
        destination: '/domains',
      },
      {
        source: '/domain/:path*',
        destination: '/domains/:path*',
      },
      {
        source: '/llms.txt',
        destination: `${appConfig.BACKEND_URL}/llms.txt`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/b/:path*',
        destination: '/r/:path*',
        permanent: true,
      },
      {
        source: '/discord',
        destination:
          process.env.DISCORD_REDIRECT_URL || 'https://discord.gg/namefi',
        permanent: false,
      },
      {
        source: '/docs',
        destination: process.env.API_DOCS_URL || 'https://docs.namefi.io/',
        permanent: false,
      },
    ];
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default withDatadogConfig(withMDX(nextConfig));
