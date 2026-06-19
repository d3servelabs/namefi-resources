import type { StorybookConfig } from '@storybook/nextjs-vite';

import { dirname } from 'path';

import { fileURLToPath } from 'url';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

function moveStorybookStylesBeforeEntryScript(html: string) {
  const entryScriptPattern =
    /\n\s*<script type="module"[^>]*src="\.\/[^/]+\/iframe-[^"]+\.js"[^>]*><\/script>/;
  const stylesheetPattern =
    /\n\s*<link rel="stylesheet"[^>]*href="\.\/[^/]+\/iframe-[^"]+\.css"[^>]*>/;
  const entryScriptMatch = html.match(entryScriptPattern);
  const stylesheetMatch = html.match(stylesheetPattern);

  if (!entryScriptMatch || !stylesheetMatch) {
    return html;
  }

  const entryScriptIndex = entryScriptMatch.index ?? 0;
  const stylesheetIndex = stylesheetMatch.index ?? 0;

  if (stylesheetIndex < entryScriptIndex) {
    return html;
  }

  return html
    .replace(stylesheetPattern, '')
    .replace(entryScriptPattern, `${stylesheetMatch[0]}$&`);
}

const shouldCopyStaticDirs = process.env.STORYBOOK_SKIP_STATIC_COPY !== '1';
const mockPrivyLoginAdapter = fileURLToPath(
  new URL('../src/lib/mock/privy-login.ts', import.meta.url),
);
const mockWagmiProviderAdapter = fileURLToPath(
  new URL('../src/stories/utils/storybook-auth-provider.tsx', import.meta.url),
);
// Replaces the real `useWallets()`-backed wallet-address hooks so no real Privy
// SDK runs in stories. See the mock's header for why (Privy-init smoke flake).
const mockUserWalletAddressesAdapter = fileURLToPath(
  new URL('../src/lib/mock/use-user-wallet-addresses.ts', import.meta.url),
);

const config: StorybookConfig = {
  stories: [
    '../src/stories/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding'),
  ],
  framework: getAbsolutePath('@storybook/nextjs-vite'),
  staticDirs: shouldCopyStaticDirs ? ['../public'] : [],
  build: {
    test: {
      disableSourcemaps: false,
    },
  },
  viteFinal: async (config) => {
    const existingAlias = config.resolve?.alias;
    config.resolve = {
      ...(config.resolve ?? {}),
      alias: Array.isArray(existingAlias)
        ? [
            ...existingAlias,
            {
              find: '@/lib/privy-login',
              replacement: mockPrivyLoginAdapter,
            },
            {
              find: '@/components/providers/wagmi',
              replacement: mockWagmiProviderAdapter,
            },
            {
              find: '@/hooks/use-user-wallet-addresses',
              replacement: mockUserWalletAddressesAdapter,
            },
          ]
        : {
            ...(existingAlias ?? {}),
            '@/lib/privy-login': mockPrivyLoginAdapter,
            '@/components/providers/wagmi': mockWagmiProviderAdapter,
            '@/hooks/use-user-wallet-addresses': mockUserWalletAddressesAdapter,
          },
    };
    config.build = {
      ...(config.build ?? {}),
      assetsDir: 'storybook-assets',
      minify: false,
      cssMinify: false,
      sourcemap: 'inline',
    };
    config.plugins = [
      ...(config.plugins ?? []),
      {
        name: 'namefi-storybook-css-before-entry',
        enforce: 'post',
        transformIndexHtml: moveStorybookStylesBeforeEntryScript,
      },
    ];
    return config;
  },
};
export default config;
