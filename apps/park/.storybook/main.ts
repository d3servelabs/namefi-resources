import type { StorybookConfig } from '@storybook/nextjs-vite';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import localConfig from '../src/lib/env/configs/local';

/**
 * Resolve a package's absolute path. Needed in a monorepo so Storybook finds
 * hoisted addon/framework packages regardless of where they were installed.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-docs')],
  framework: getAbsolutePath('@storybook/nextjs-vite'),
  // Serve public assets (logotype.svg, etc.) so the components render fully.
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    // `src/lib/env` throws at import time without LOADED_CONFIG (normally
    // injected by next.config). Storybook runs on Vite and skips next.config,
    // so inject a local-env config here. Double-stringified: the inner JSON is
    // what the runtime `JSON.parse`s, the outer makes it a string literal in
    // the defined source.
    viteConfig.define = {
      ...(viteConfig.define ?? {}),
      'process.env.LOADED_CONFIG': JSON.stringify(JSON.stringify(localConfig)),
    };
    return viteConfig;
  },
};

export default config;
