import createMdx from '@next/mdx';
import type { NextConfig } from 'next';
// biome-ignore lint/correctness/noNodejsModules: next.config runs in Node and needs createRequire
import { createRequire } from 'node:module';
import packageJson from './package.json';
import { config as appConfig } from './src/lib/env/load';

const require = createRequire(import.meta.url);
const remarkStaticImageImportsPath = require.resolve(
  './mdx-plugins/remark-static-image-imports',
);

const withMDX = createMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      'remark-frontmatter',
      'remark-mdx-frontmatter',
      'remark-gfm',
      'remark-reading-time',
      'remark-reading-time/mdx',
      remarkStaticImageImportsPath,
    ],
  },
});

const nextConfig: NextConfig = {
  basePath: '/r',
  transpilePackages: ['@namefi-astra/ui'],
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
    },
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT,
    version: packageJson.version,
    name: packageJson.name,
  },
  typescript: {
    // Note: validate is run on CI with build
    ignoreBuildErrors: true,
  },
  // 308 redirect legacy r.namefi.{io,dev} hosts to their canonical
  // namefi.{io,dev}/r/* equivalents. Guarded on `missing: x-forwarded-host`
  // so the frontend's internal proxy fetch (which sets that header) does not
  // redirect-loop. Only direct browser/Googlebot hits to r.namefi.* trigger.
  // `basePath: false` opts out of the /r basePath being prefixed onto sources,
  // so we can match paths that legacy Google-indexed URLs use (no /r prefix).
  async redirects() {
    const buildRules = (legacyHost: string, canonicalHost: string) => [
      {
        source: '/r/:path*',
        has: [{ type: 'host' as const, value: legacyHost }],
        missing: [{ type: 'header' as const, key: 'x-forwarded-host' }],
        destination: `https://${canonicalHost}/r/:path*`,
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: legacyHost }],
        missing: [{ type: 'header' as const, key: 'x-forwarded-host' }],
        destination: `https://${canonicalHost}/r/:path*`,
        permanent: true,
        basePath: false as const,
      },
    ];
    return [
      ...buildRules('r.namefi.io', 'namefi.io'),
      ...buildRules('r.namefi.dev', 'namefi.dev'),
    ];
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for the config file.
export default withMDX(nextConfig);
