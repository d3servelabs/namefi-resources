import 'server-only';

import { loadSecrets } from '@namefi-astra/env/client';

import { serverSideSecretsSchema } from './schema';

export const secrets = loadSecrets({
  secretsSchema: serverSideSecretsSchema,
  secrets: process.env,
});
