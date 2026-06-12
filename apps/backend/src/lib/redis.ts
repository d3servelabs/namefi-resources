import { createClient } from 'redis';
import { secrets } from '#lib/env';
import { logger } from './logger';

let client: ReturnType<typeof _createClient> | undefined;
let _promise: Promise<ReturnType<typeof _createClient>> | undefined;

export async function getRedisClient(): Promise<
  ReturnType<typeof _createClient>
> {
  // Reuse the cached client even when it is momentarily not ready: redis v5
  // auto-reconnects on transient drops (queuing commands until it recovers), so
  // rebuilding on `!isReady` would churn during normal reconnects. The cache is
  // instead invalidated on a TERMINAL 'end' event (see below), which is the
  // non-recoverable state where a fresh connect is actually needed.
  if (client) return client;

  if (!_promise) {
    _promise = new Promise<ReturnType<typeof _createClient>>(
      (resolve, reject) => {
        const c = _createClient();
        // Log (and absorb) runtime 'error' events; the connect() promise below
        // is what signals a connection FAILURE.
        c.on('error', (err) => logger.error({ err }, '[REDIS] client error'));
        // A TERMINAL close (e.g. `client.destroy()` or a non-recoverable end)
        // makes the cached singleton unusable — drop it so the NEXT caller
        // rebuilds and reconnects. Guarded by `client === c` so a stale client's
        // 'end' can't clobber a newer cached one. Transient disconnects do NOT
        // emit 'end' (redis auto-reconnects), so this never fires on a blip.
        c.on('end', () => {
          if (client === c) {
            logger.warn('[REDIS] client ended; clearing cached singleton');
            client = undefined;
            _promise = undefined;
          }
        });
        c.connect()
          .then(() => {
            client = c;
            resolve(c);
          })
          .catch(reject);
      },
    ).catch((err) => {
      // NEVER cache a rejected connection: clear the cache so the next call
      // reconnects instead of poisoning every redis consumer (rate-limit, auth,
      // notifications, the nonce-lock, …) until the process restarts.
      _promise = undefined;
      throw err;
    });
  }
  return _promise;
}

function _createClient() {
  logger.info(`[REDIS] creating client [${new Date()}]`);
  const client = createClient({
    url: secrets.MAIN_REDIS_URL,
    socket: {
      // Bounded so a connect attempt to a down redis can't outlast the callers'
      // activity timeouts (and so a failed connect clears the cache promptly).
      connectTimeout: 10_000,
    },
  });
  logger.info(`[REDIS] created client [${new Date()}]`);
  return client;
}
