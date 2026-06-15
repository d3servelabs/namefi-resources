import { createClient } from 'redis';
import { secrets } from '#lib/env';
import { logger } from './logger';

let client: ReturnType<typeof _createClient>;
let _promise: Promise<typeof client> | undefined;

export async function getRedisClient(): Promise<typeof client> {
  if (client) return client;

  if (!_promise) {
    _promise = (async () => {
      try {
        const redisClient = _createClient();
        redisClient.on('error', (err) => {
          logger.error({ err }, '[REDIS] client error');
        });
        await redisClient.connect();
        client = redisClient;
        return client;
      } catch (err) {
        // Reset so a later call retries with a fresh connection instead of
        // reusing this rejected promise (which would permanently break access).
        _promise = undefined;
        throw err;
      }
    })();
  }
  return _promise;
}

function _createClient() {
  if (!secrets.MAIN_REDIS_URL) {
    throw new Error(
      '[REDIS] MAIN_REDIS_URL is required to initialize the redis client',
    );
  }
  logger.info(`[REDIS] creating client [${new Date()}]`);
  const client = createClient({
    url: secrets.MAIN_REDIS_URL,
    socket: {
      connectTimeout: 300_000,
    },
  });
  logger.info(`[REDIS] created client [${new Date()}]`);
  return client;
}
