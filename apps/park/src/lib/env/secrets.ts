import 'server-only';

import { loadSecrets } from '@namefi-astra/env/client';

import type { z } from 'zod';
import { serverSideSecretsSchema } from './schema';

export const secrets: z.output<typeof serverSideSecretsSchema> = loadSecrets({
  secretsSchema: serverSideSecretsSchema,
  secrets: process.env,
});
