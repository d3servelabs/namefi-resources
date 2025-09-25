import 'server-only';
import { serverSideSecretsSchema } from './schema';
import { loadSecrets } from '@namefi-astra/env/client';

export const secrets = loadSecrets({
  secretsSchema: serverSideSecretsSchema,
  secrets: process.env,
});
