/**
 * Module resolution in next.config.ts is currently limited to CommonJS.
 * This may cause incompatibilities with ESM only packages being loaded in next.config.ts
 * @see https://nextjs.org/docs/pages/api-reference/config/typescript
 */
import createMdx from '@next/mdx';
// biome-ignore lint/correctness/noNodejsModules: next.config runs in Node and needs execSync to read build metadata.
import { execSync } from 'node:child_process';
import { createJiti } from 'jiti';
import createNextIntlPlugin from 'next-intl/plugin';
import {
  resolveDeployCommitSha,
  withDatadogConfig,
} from './build/with-datadog-config.mjs';
import packageJson from './package.json' with { type: 'json' };

// next-intl in "without i18n routing" mode: the locale comes from the
// `NEXT_LOCALE` cookie (see src/i18n/request.ts), not the URL.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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

const git = (args) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

const normalizeCommitDate = (value) => {
  const parsed = new Date(value || '');
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

const resolveCommitUrl = (sha) => {
  if (!sha || sha === 'unknown') return '';
  const repo =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : process.env.GITHUB_REPOSITORY || 'd3servelabs/namefi-astra';
  return `https://github.com/${repo}/commit/${sha}`;
};

/** @type {{ config: import('./src/lib/env/schema').ConfigInput }} */
const { config: appConfig } = await jiti.import('./src/lib/env/load');
const deployCommitSha =
  resolveDeployCommitSha() || git('rev-parse HEAD') || 'unknown';
const deployCommitDate = normalizeCommitDate(
  process.env.DEPLOY_COMMIT_DATE ||
    git(`show -s --format=%cI ${deployCommitSha}`),
);
const loadedClientConfig = {
  ...appConfig,
  APP_VERSION: packageJson.version,
  DEPLOY_COMMIT_SHA: deployCommitSha,
  DEPLOY_COMMIT_DATE: deployCommitDate,
  DEPLOY_COMMIT_URL: resolveCommitUrl(deployCommitSha),
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
      // ENSData wallet avatars. Use the API host directly because the public
      // ensdata.net media URL redirects and image optimization forbids
      // redirects in this app config.
      imageRemotePatternFromUrl('https://api.ensdata.net', {
        pathname: '/media/avatar/**',
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
      // -----------------------------------------------------------------------
      // Legacy resources URLs → `/r/<locale>` prefix.
      //
      // The resources app (blog, glossary, tld, series, topics, watch,
      // partners, careers) was relocated under the `/r` basePath. Old flat
      // locale-prefixed URLs (`/zh/blog`, `/de/tld/ai`) remain indexed by
      // Google and linked externally, and now 404 (see GSC "Not found (404)"
      // crawl report, 2026-06-22). These 301s forward the link equity to the
      // new `/r/...` homes.
      //
      // Scope is deliberately limited to paths that CANNOT collide with a
      // current or future frontend route, so a permanent redirect can never
      // shadow a real page. The frontend uses next-intl cookie-mode (no
      // `/<locale>` path prefix), so:
      //   * `/<locale>/<section>/...` is never a frontend route — the locale
      //     prefix + known resources section make it unambiguously a legacy
      //     resources URL.
      //   * `/<locale>` bare is a two-letter locale root, same reasoning.
      // Bare single-segment paths (`/blog`, `/watch`, `/partners`, ...) are
      // intentionally NOT redirected: each could become a frontend marketing
      // route later, and a permanent 301 would be sticky. They were also
      // negligible in the crawl report (their locale-prefixed forms ARE
      // covered above). When unsure whether a path is legacy, we leave it.
      //
      // TODO(SEO): remove this block after ~2026-09-22 (≈3 months). It is
      // transitional — once GSC stops reporting 404s for these legacy paths
      // (i.e. Google has recrawled and updated its index), it can be dropped.
      // -----------------------------------------------------------------------
      {
        // `/<locale>/<section>/...` → `/r/<locale>/<section>/...`
        source:
          '/:locale(en|es|de|fr|zh|ar|hi)/:section(blog|glossary|tld|series|topics|watch|partners|careers)/:path*',
        destination: '/r/:locale/:section/:path*',
        permanent: true,
      },
      {
        // bare locale root `/<locale>` → `/r/<locale>`
        source: '/:locale(en|es|de|fr|zh|ar|hi)',
        destination: '/r/:locale',
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

export default withNextIntl(withDatadogConfig(withMDX(nextConfig)));
