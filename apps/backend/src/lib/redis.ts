import { createClient, type RedisClientType } from 'redis';
import { secrets } from '#lib/env';
import { logger } from './logger';

let client: ReturnType<typeof _createClient>;
let _promise: Promise<typeof client>;

export async function getRedisClient(): Promise<typeof client> {
  if (client) return client;

  if (!_promise) {
    _promise = new Promise((resolve, reject) => {
      _createClient()
        .on('error', (err) => reject(err))
        .connect()
        .then((c) => {
          client = c;
          resolve(client);
        });
    });
  }
  return _promise;
}

function _createClient() {
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
