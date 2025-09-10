import { loadSecrets } from '@namefi-astra/env';
import { secretsSchema } from './schema';

export const secrets = loadSecrets({
  secretsSchema,
});
