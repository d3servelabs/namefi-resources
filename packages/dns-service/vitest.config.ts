import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkgRoot = fileURLToPath(new URL('.', import.meta.url));
const srcRoot = resolve(pkgRoot, 'src');

export default defineConfig({
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
  // The moved DNS code uses Node subpath imports (`#lib/*`, `#services/*`).
  // Mirror the package.json `imports` map here so Vitest resolves them.
  resolve: {
    alias: [
      {
        find: /^#lib\/env$/,
        replacement: resolve(srcRoot, 'lib/env/index.ts'),
      },
      { find: /^#lib\/(.*)$/, replacement: `${srcRoot}/lib/$1` },
      { find: /^#services\/(.*)$/, replacement: `${srcRoot}/services/$1` },
    ],
  },
});
