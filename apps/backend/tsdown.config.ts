import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

const config = defineConfig({
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: false,
  target: 'node22',
  minify: process.env.NODE_ENV === 'production',
  shims: true,
  treeshake: true,
  outExtensions(ctx) {
    return {
      js: '.js',
      dts: '.d.ts',
    };
  },
  deps: {
    neverBundle: [/^sharp(?:\/.*)?$/],
    alwaysBundle: (() => {
      const noExternal: (string | RegExp)[] = [/@namefi-astra\/.*/];
      const imports = pkg.imports || {};
      // Convert import paths like "#services/*": "./src/services/*" to regex patterns like /#services\/.*/
      return noExternal.concat(
        Object.keys(imports)
          .map((key) => key.replace('/*', '/.*'))
          .filter((pattern) => pattern.startsWith('#'))
          .map((pattern) => new RegExp(pattern)),
      );
    })(),
  },
  outputOptions: {
    keepNames: true,
    codeSplitting: true,
  },
});

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/temporal/main.temporal.ts'],
    outDir: 'dist',
    ...config,
  },
  {
    entry: ['src/lib/env/configs/*.ts'],
    outDir: 'dist/configs',
    ...config,
  },
]);
