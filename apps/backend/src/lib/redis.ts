import { createClient, type RedisClientType } from 'redis';
import { secrets } from '#lib/env';

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
  return createClient({
    url: secrets.MAIN_REDIS_URL,
  });
}
