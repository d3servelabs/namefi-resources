import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const backendRoot = fileURLToPath(new URL('.', import.meta.url));
const srcRoot = resolve(backendRoot, 'src');

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
      { find: '#lib/env', replacement: resolve(srcRoot, 'lib/env/index.ts') },
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
