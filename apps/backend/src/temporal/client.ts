import { Connection, Client as TemporalClient } from '@temporalio/client';
import { secrets } from '#lib/env';

const apiKey = secrets.TEMPORAL_API_KEY;
const authOptions = apiKey
  ? {
      apiKey,
      tls: true,
    }
  : {};

export const temporalClient = new TemporalClient({
  namespace: secrets.TEMPORAL_NAMESPACE,
  connection: Connection.lazy({
    ...authOptions,
    address: secrets.TEMPORAL_API_URL,
    metadata: {
      'temporal-namespace': secrets.TEMPORAL_NAMESPACE,
    },
  }),
});
