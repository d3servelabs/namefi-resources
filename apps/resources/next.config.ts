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
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
    },
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
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
};

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for the config file.
export default withMDX(nextConfig);
