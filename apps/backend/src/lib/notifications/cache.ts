import type { NotificationResourceType } from '@namefi-astra/common/shared-schemas';
import { getRedisClient } from '#lib/redis';
import { createLogger } from '#lib/logger';

/**
 * Redis-backed cache for unread notification counts.
 *
 * The base key holds the global unread count for a user; per-resource
 * variant keys hold filtered counts (e.g. unread notifications related to
 * a specific domain). Both share the same short TTL — the in-app bell can
 * tolerate up to a minute of staleness, and writes invalidate eagerly.
 *
 * Cache failures are non-fatal: the router falls back to a database count
 * and the badge stays accurate, just slower.
 */

const logger = createLogger({ module: 'notifications-cache' });

const UNREAD_TTL_SECONDS = 60;

const baseKey = (userId: string) => `notif:unread:${userId}`;

const resourceKey = (
  userId: string,
  type: NotificationResourceType,
  identifier: string,
) => `notif:unread:${userId}:${type}:${identifier}`;

export type UnreadResourceFilter = {
  type: NotificationResourceType;
  identifier: string;
};

export async function getCachedUnreadCount(
  userId: string,
  filter?: UnreadResourceFilter,
): Promise<number | null> {
  try {
    const redis = await getRedisClient();
    const key = filter
      ? resourceKey(userId, filter.type, filter.identifier)
      : baseKey(userId);
    const raw = await redis.get(key);
    if (raw === null || raw === undefined) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch (error) {
    logger.warn({ error, userId }, 'Failed to read unread count from cache');
    return null;
  }
}

export async function setCachedUnreadCount(
  userId: string,
  count: number,
  filter?: UnreadResourceFilter,
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = filter
      ? resourceKey(userId, filter.type, filter.identifier)
      : baseKey(userId);
    await redis.set(key, String(count), { EX: UNREAD_TTL_SECONDS });
  } catch (error) {
    logger.warn({ error, userId }, 'Failed to write unread count to cache');
  }
}

/**
 * Drop every cached count for a user — global and all per-resource variants.
 * Called after any write that could change a count (create / archive /
 * mark-as-seen). Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export async function invalidateUnreadCountForUser(
  userId: string,
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const prefix = `${baseKey(userId)}`;
    const matchPattern = `${prefix}*`;

    const keysToDelete: string[] = [];
    for await (const key of redis.scanIterator({ MATCH: matchPattern })) {
      if (Array.isArray(key)) {
        keysToDelete.push(...key);
      } else {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  } catch (error) {
    logger.warn(
      { error, userId },
      'Failed to invalidate unread notification cache',
    );
  }
}
