#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const nativePreviewPackageJson = require.resolve(
  '@typescript/native-preview/package.json',
);
const tsgoEntrypoint = pathToFileURL(
  join(dirname(nativePreviewPackageJson), 'bin/tsgo.js'),
).href;

await import(tsgoEntrypoint);
