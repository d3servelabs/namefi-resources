import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { lazy } from '@namefi-astra/utils/lazy';
import { logger } from './logger';
import { secrets } from './env';

/**
 * Lazily-constructed shared `@keyv/postgres` store (one connection pool for the
 * process). Deferred so the pool isn't built at import time.
 */
export const getKeyvPostgres = lazy(
  () =>
    new KeyvPostgres({
      uri: secrets.DATABASE_URL,
      schema: '__keyv',
      table: 'default',
      useUnloggedTable: true,
    }),
);

const keyvByNamespace = new Map<string, Keyv>();

export interface GetKeyvOptions {
  /** Default TTL (ms) applied to entries that don't specify one. */
  ttl?: number;
  /**
   * Custom error handler for the instance's `'error'` event. Defaults to an
   * `error`-level log. Bound at first construction of the namespace.
   */
  onError?: (error: unknown) => void;
}

/**
 * Memoized factory for namespaced Keyv instances. Centralizes the
 * `new Keyv(getKeyvPostgres(), { namespace })` + error-listener boilerplate and
 * returns one shared instance per namespace for the process lifetime.
 *
 * `options` are bound when the namespace is first constructed; each namespace
 * should be created from a single place, so there is no ambiguity about
 * differing options for the same namespace.
 */
export function getKeyv<T = unknown>(
  namespace: string,
  options?: GetKeyvOptions,
): Keyv<T> {
  const existing = keyvByNamespace.get(namespace);
  if (existing) return existing as Keyv<T>;

  const kv = new Keyv<T>(getKeyvPostgres(), { namespace, ttl: options?.ttl });
  const onError =
    options?.onError ??
    ((error: unknown) => logger.error({ error }, 'Keyv error'));
  kv.on('error', onError);
  keyvByNamespace.set(namespace, kv as Keyv);
  return kv;
}

/** Convenience getter for the historical `default` namespace. */
export const getDefaultKeyv = (): Keyv => getKeyv('default');
