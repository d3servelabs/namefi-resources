import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/lib/env/configs/development.ts',
    'src/lib/env/configs/staging.ts',
    'src/lib/env/configs/production.ts',
  ],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: false,
  outDir: 'dist',
  target: 'node22',
  minify: process.env.NODE_ENV === 'production',
  shims: true,
  skipNodeModulesBundle: true,
  treeshake: true,
  esbuildOptions(options) {
    options.conditions = ['node'];
  },
  noExternal: (() => {
    const noExternal: (string | RegExp)[] = [/@namefi-astra\/.*/];
    const pkg = require('./package.json');
    const imports = pkg.imports || {};
    // Convert import paths like "#services/*": "./src/services/*" to regex patterns like /#services\/.*/
    return noExternal.concat(
      Object.keys(imports)
        .map((key) => key.replace('/*', '/.*'))
        .filter((pattern) => pattern.startsWith('#'))
        .map((pattern) => new RegExp(pattern)),
    );
  })(),
});
