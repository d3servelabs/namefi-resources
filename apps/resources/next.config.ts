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
const remarkHeadingIdsPath = require.resolve(
  './mdx-plugins/remark-heading-ids',
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
      remarkHeadingIdsPath,
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
  async rewrites() {
    return [
      {
        source: '/r/api/c15t/:path*',
        destination: `${appConfig.BACKEND_URL}/c15t/:path*`,
        basePath: false,
      },
    ];
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for the config file.
export default withMDX(nextConfig);
