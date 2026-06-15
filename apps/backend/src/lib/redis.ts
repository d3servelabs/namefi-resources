import { createClient } from 'redis';
import { lazyAsync } from '@namefi-astra/utils/lazy';
import { secrets } from '#lib/env';
import { logger } from './logger';

// Lazy async singleton:
//  - concurrent callers before connect share one in-flight promise,
//  - the connected client is cached and reused even when momentarily not ready
//    (redis v5 auto-reconnects on transient drops, queuing commands until it
//    recovers — rebuilding on `!isReady` would churn during normal reconnects),
//  - a REJECTED connect is never cached, so a failed connect can't poison every
//    redis consumer (rate-limit, auth, notifications, the nonce-lock, …),
//  - a TERMINAL 'end' event invalidates the singleton via the generation-guarded
//    `reset` so the NEXT caller rebuilds; the guard means a stale client's 'end'
//    can't clobber a newer cached one. Transient disconnects do NOT emit 'end'.
export const getRedisClient = lazyAsync(async (reset) => {
  const c = _createClient();
  // Log (and absorb) runtime 'error' events; the connect() rejection is what
  // signals a connection FAILURE.
  c.on('error', (err) => logger.error({ err }, '[REDIS] client error'));
  c.on('end', () => {
    logger.warn('[REDIS] client ended; clearing cached singleton');
    reset();
  });
  await c.connect();
  return c;
});

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
