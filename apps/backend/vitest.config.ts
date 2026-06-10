import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const backendRoot = fileURLToPath(new URL('.', import.meta.url));
const srcRoot = resolve(backendRoot, 'src');
const registrarsLibRoot = resolve(
  backendRoot,
  '../../packages/registrars/src/lib',
);

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: /^#lib\/env$/,
        replacement: resolve(srcRoot, 'lib/env/index.ts'),
      },
      {
        find: /^#lib\/abstract-registrar$/,
        replacement: resolve(registrarsLibRoot, 'abstract-registrar/index.ts'),
      },
      {
        find: /^#lib\/abstract-registrar\/(.*)$/,
        replacement: `${resolve(registrarsLibRoot, 'abstract-registrar')}/$1`,
      },
      {
        find: /^#lib\/(data\/validations|dynadot\/common-types|dynadot\/index|get-tld|idn\/idn-language-code|multi-year-pricing|rdap-whois\/rdap_client|sign-message|supports-dnssec)$/,
        replacement: `${registrarsLibRoot}/$1`,
      },
      {
        find: /^#multi-year-pricing$/,
        replacement: resolve(
          backendRoot,
          '../../packages/registrars/src/lib/multi-year-pricing.ts',
        ),
      },
      { find: /^#lib\/(.*)$/, replacement: `${srcRoot}/lib/$1` },
      { find: /^#services\/(.*)$/, replacement: `${srcRoot}/services/$1` },
      {
        find: /^#temporal\/shared$/,
        replacement: resolve(srcRoot, 'temporal/shared/index.ts'),
      },
      {
        find: /^#temporal\/shared\/(.*)$/,
        replacement: `${srcRoot}/temporal/shared/$1`,
      },
      { find: /^#temporal\/(.*)$/, replacement: `${srcRoot}/temporal/$1` },
      { find: /^#trpc$/, replacement: resolve(srcRoot, 'trpc/index.ts') },
      { find: /^#trpc\/(.*)$/, replacement: `${srcRoot}/trpc/$1` },
    ],
  },
});
