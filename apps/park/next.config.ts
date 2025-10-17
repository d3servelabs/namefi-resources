import type { NextConfig } from 'next';
import packageJson from './package.json';
import { config as appConfig } from './src/lib/env/load';

const nextConfig: NextConfig = {
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
};

export default nextConfig;
