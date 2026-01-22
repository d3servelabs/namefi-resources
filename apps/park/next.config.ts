import type { NextConfig } from 'next';
import packageJson from './package.json';
import { config as appConfig } from './src/lib/env/load';

const nextConfig: NextConfig = {
  cacheComponents: true,
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
    },
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT,
    version: packageJson.version,
    name: packageJson.name,
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  typescript: {
    // Note: validate is run on CI with build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
