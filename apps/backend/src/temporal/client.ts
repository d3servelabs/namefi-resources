import { Connection, Client as TemporalClient } from '@temporalio/client';
import { createLogger } from '#lib/logger';
import { config, secrets } from '#lib/env';

const logger = createLogger({ module: 'temporal/client', context: 'Temporal' });

const apiKey = secrets.TEMPORAL_API_KEY;
const authOptions = apiKey
  ? {
      apiKey,
      tls: true,
    }
  : {};

export const temporalConnection = Connection.lazy({
  ...authOptions,
  address: config.TEMPORAL_API_URL,
  metadata: {
    'temporal-namespace': config.TEMPORAL_NAMESPACE,
  },
});

export const temporalClient = new TemporalClient({
  namespace: config.TEMPORAL_NAMESPACE,
  connection: temporalConnection,
});

export const createTemporalEphemeralConnection =
  async (): Promise<Connection> => {
    logger.info('Creating temporal ephemeral connection');
    const connection = await Connection.connect({
      ...authOptions,
      address: config.TEMPORAL_API_URL,
      metadata: {
        'temporal-namespace': config.TEMPORAL_NAMESPACE,
      },
    });
    logger.info('Temporal ephemeral connection created');
    return connection;
  };
