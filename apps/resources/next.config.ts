import createMdx from '@next/mdx';
import type { NextConfig } from 'next';

const withMDX = createMdx({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  assetPrefix: '/r',
  cacheComponents: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for the config file.
export default withMDX(nextConfig);
