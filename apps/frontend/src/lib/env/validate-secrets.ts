/**
 * Frontend Secrets Validator
 *
 * This script validates that all required server-side secrets are present.
 * Used by the dev runner preflight check.
 */

import '@namefi-astra/env/preload';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '@namefi-astra/env';
import { loadSecrets } from '@namefi-astra/env/client';
import { configSchema, serverSideSecretsSchema } from './schema';

// Load and validate config
const baseDir = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig({
  configPath: path.join(baseDir, 'configs'),
  configSchema,
});

// Load and validate secrets - this will throw if secrets are missing
const secrets = loadSecrets({
  secretsSchema: serverSideSecretsSchema,
  secrets: process.env,
});

console.log('Frontend secrets validated successfully');
