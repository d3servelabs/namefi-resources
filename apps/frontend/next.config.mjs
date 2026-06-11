/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import createMdx from '@next/mdx';
import { createJiti } from 'jiti';
import {
  resolveDeployCommitSha,
  withDatadogConfig,
} from './build/with-datadog-config.mjs';
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
const deployCommitSha = resolveDeployCommitSha() || 'unknown';
const loadedClientConfig = {
  ...appConfig,
  APP_VERSION: packageJson.version,
  DEPLOY_COMMIT_SHA: deployCommitSha,
};
// `/r` rewrites proxy to a dedicated resources upstream.
const resourcesProxyOrigin =
  process.env.RESOURCES_PROXY_ORIGIN ||
  (appConfig.TYPE === 'production'
    ? 'https://r.namefi.io'
    : appConfig.RESOURCES_URL);

const imageRemotePatternFromUrl = (
  origin,
  { pathname = '/**', search } = {},
) => {
  try {
    const url = new URL(origin);
    const protocol = url.protocol.replace(':', '');
    if (protocol !== 'http' && protocol !== 'https') {
      return null;
    }

    const configuredPathname =
      url.pathname && url.pathname !== '/'
        ? url.pathname.includes('*')
          ? url.pathname
          : `${url.pathname.replace(/\/$/, '')}/**`
        : pathname;
    const configuredSearch = search !== undefined ? search : url.search || null;

    return {
      protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: configuredPathname,
      ...(configuredSearch !== null ? { search: configuredSearch } : {}),
    };
  } catch {
    return null;
  }
};

const imageRemotePatterns = Array.from(
  new Map(
    [
      // Backend endpoints can emit image assets and OG/static files referenced
      // by API-driven UI. Restrict query strings for predictable cache keys.
      imageRemotePatternFromUrl(appConfig.BACKEND_URL, { search: '' }),
      // The active frontend deployment may reference its own absolute URLs,
      // especially in preview environments and generated metadata.
      imageRemotePatternFromUrl(appConfig.FIRST_PARTY_DEPLOYMENT_URL, {
        search: '',
      }),
      // Production CloudFront distribution for generated AI assets returned by
      // the backend.
      imageRemotePatternFromUrl('https://d37hwq656n7huw.cloudfront.net', {
        search: '',
      }),
      // Development/default CloudFront distribution for generated AI assets.
      imageRemotePatternFromUrl('https://d3pajj40uywidf.cloudfront.net', {
        search: '',
      }),
      // CV testimonial avatars. Components currently bypass optimization for
      // these tiny generated avatars to avoid cache churn, but keep the host
      // explicit if a future use does opt in.
      imageRemotePatternFromUrl('https://avatar.vercel.sh', { search: '' }),
      // Bespoke testimonial SVG avatars from DiceBear v7 endpoints.
      imageRemotePatternFromUrl('https://api.dicebear.com', {
        pathname: '/7.x/**',
      }),
      // Effigy wallet SVG avatars used in admin NFT known-issue cards.
      imageRemotePatternFromUrl('https://effigy.im', {
        pathname: '/a/**',
        search: '',
      }),
    ]
      .filter(Boolean)
      .map((pattern) => [
        [
          pattern.protocol,
          pattern.hostname,
          pattern.port,
          pattern.pathname,
          pattern.search ?? '*',
        ].join(':'),
        pattern,
      ]),
  ).values(),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages that export TypeScript sources directly.
  // This enables better Turbopack caching and more consistent compilation.
  transpilePackages: [
    '@namefi-astra/ai',
    '@namefi-astra/common',
    '@namefi-astra/env',
    '@namefi-astra/registrars',
    '@namefi-astra/ui',
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
      // Statically inlined so the preview-gate component and its imports are
      // dead-code-eliminated from production builds. See
      // apps/frontend/src/app/layout.tsx.
      __NAMEFI_PREVIEW_GATE_BUNDLED__:
        appConfig.TYPE === 'production' ? false : true,
      // TanStack Query Devtools are useful during focused debugging, but they
      // add a large root-layout compile edge. Keep them out of the default dev
      // graph; opt in before starting Next with NEXT_PUBLIC_REACT_QUERY_DEVTOOLS=1.
      __NAMEFI_REACT_QUERY_DEVTOOLS_BUNDLED__:
        appConfig.TYPE !== 'production' &&
        process.env.NEXT_PUBLIC_REACT_QUERY_DEVTOOLS === '1'
          ? true
          : false,
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
  images: {
    remotePatterns: imageRemotePatterns,
    qualities: [75, 90],
    minimumCacheTTL: 86_400,
    maximumRedirects: 0,
    maximumDiskCacheSize: 500_000_000,
    maximumResponseBody: 20_000_000,
    dangerouslyAllowLocalIP: appConfig.TYPE === 'local',
  },
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
        source: '/api/c15t/:path*',
        destination: `${appConfig.BACKEND_URL}/c15t/:path*`,
      },
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
        source: '/api-auth',
        destination: '/profile?tab=security',
      },
      {
        source: '/api-key',
        destination: '/profile?tab=security',
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
        source: '/ai-brand-generator/:path*',
        destination: '/studio/:path*',
        permanent: true,
      },
      {
        source: '/leadgen/:path*',
        destination: '/outbound/:path*',
        permanent: true,
      },
      {
        source: '/mls',
        destination: '/feed',
        permanent: true,
      },
      {
        source: '/mls/feed/rss.xml',
        destination: `${appConfig.BACKEND_URL}/feed/rss.xml`,
        permanent: true,
      },
      {
        source: '/mls/feed',
        destination: '/feed',
        permanent: true,
      },
      {
        source: '/mls/feed/:path*',
        destination: '/feed/:path*',
        permanent: true,
      },
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
      {
        source: '/api/x402/:path*',
        destination: `${appConfig.BACKEND_URL || 'https://api.namefi.io'}/x402/:path*`,
        permanent: false,
      },
    ];
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default withDatadogConfig(withMDX(nextConfig));
