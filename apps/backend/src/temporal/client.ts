import { Connection, Client as TemporalClient } from '@temporalio/client';
import { config, secrets } from '#lib/env';

const apiKey = secrets.TEMPORAL_API_KEY;
const authOptions = apiKey
  ? {
      apiKey,
      tls: true,
    }
  : {};

export const temporalClient = new TemporalClient({
  namespace: config.TEMPORAL_NAMESPACE,
  connection: Connection.lazy({
    ...authOptions,
    address: config.TEMPORAL_API_URL,
    metadata: {
      'temporal-namespace': config.TEMPORAL_NAMESPACE,
    },
  }),
});
