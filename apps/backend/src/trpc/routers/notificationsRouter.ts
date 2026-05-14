import {
  db,
  notificationsTable,
  type NotificationMetadata,
  type NotificationRelatedResource,
} from '@namefi-astra/db';
import {
  notificationsContract,
  type NotificationDto,
} from '@namefi-astra/common/contract/notifications-contract';
import type { NotificationResourceType } from '@namefi-astra/common/shared-schemas';
import { and, eq, inArray, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import {
  getCachedUnreadCount,
  invalidateUnreadCountForUser,
  setCachedUnreadCount,
} from '#lib/notifications/cache';
import { protectedProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

/**
 * User-facing in-app notifications router.
 *
 * Every procedure is scoped to `ctx.user.id` — list/count queries only see
 * the caller's rows, and mutations only act on rows whose `user_id`
 * matches. Hot reads (unread count) are cached in Redis; writes invalidate.
 */

const DEFAULT_LIMIT = 25;

type Row = typeof notificationsTable.$inferSelect;

function toDto(row: Row): NotificationDto {
  return {
    ...row,
    relatedResources:
      (row.relatedResources as NotificationRelatedResource[] | null) ?? [],
    metadata: (row.metadata as NotificationMetadata | null) ?? {},
    isSeen: row.seenAt !== null,
    isArchived: row.archivedAt !== null,
  };
}

function decodeCursor(
  cursor: string | null | undefined,
): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [ts, id] = decoded.split('|');
    if (!ts || !id) return null;
    const createdAt = new Date(ts);
    if (Number.isNaN(createdAt.valueOf())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString(
    'base64url',
  );
}

function resourceFilterClause(
  type?: NotificationResourceType,
  identifier?: string,
): SQL | undefined {
  if (!type && !identifier) return undefined;
  const fragment: Array<Record<string, unknown>> = [{}];
  if (type) fragment[0].type = type;
  if (identifier) fragment[0].identifier = identifier;
  return sql`${notificationsTable.relatedResources} @> ${JSON.stringify(fragment)}::jsonb`;
}

export const notificationsRouter = createContractTRPCRouter<
  typeof notificationsContract
>({
  list: protectedProcedure
    .input(notificationsContract.list.input)
    .output(notificationsContract.list.output)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_LIMIT;
      const cursor = decodeCursor(input.cursor);

      const where: Array<SQL | undefined> = [
        eq(notificationsTable.userId, ctx.user.id),
      ];
      if (!input.includeArchived) {
        where.push(isNull(notificationsTable.archivedAt));
      }
      if (!input.includeSeen) {
        where.push(isNull(notificationsTable.seenAt));
      }
      const resourceClause = resourceFilterClause(
        input.relatedResourceType,
        input.relatedResourceIdentifier,
      );
      if (resourceClause) where.push(resourceClause);
      if (cursor) {
        // Keyset pagination on (createdAt desc, id desc).
        where.push(
          or(
            lt(notificationsTable.createdAt, cursor.createdAt),
            and(
              eq(notificationsTable.createdAt, cursor.createdAt),
              lt(notificationsTable.id, cursor.id),
            ),
          ),
        );
      }

      const rows = await db
        .select()
        .from(notificationsTable)
        .where(and(...where))
        .orderBy(
          sql`${notificationsTable.createdAt} DESC`,
          sql`${notificationsTable.id} DESC`,
        )
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const tail = pageRows[pageRows.length - 1];
      const nextCursor =
        hasMore && tail ? encodeCursor(tail.createdAt, tail.id) : null;

      return {
        items: pageRows.map(toDto),
        nextCursor,
      };
    }),

  getUnreadCount: protectedProcedure
    .input(notificationsContract.getUnreadCount.input)
    .output(notificationsContract.getUnreadCount.output)
    .query(async ({ ctx, input }) => {
      const filter =
        input.relatedResourceType && input.relatedResourceIdentifier
          ? {
              type: input.relatedResourceType,
              identifier: input.relatedResourceIdentifier,
            }
          : undefined;

      // Only the unscoped (no filter) count and the fully-specified
      // (type + identifier) count have stable cache keys. Partial filters
      // (type only / identifier only) skip the cache.
      const cacheable =
        !input.relatedResourceType ||
        (input.relatedResourceType && input.relatedResourceIdentifier);
      if (cacheable) {
        const cached = await getCachedUnreadCount(ctx.user.id, filter);
        if (cached !== null) return { count: cached };
      }

      const where: Array<SQL | undefined> = [
        eq(notificationsTable.userId, ctx.user.id),
        isNull(notificationsTable.seenAt),
        isNull(notificationsTable.archivedAt),
      ];
      const resourceClause = resourceFilterClause(
        input.relatedResourceType,
        input.relatedResourceIdentifier,
      );
      if (resourceClause) where.push(resourceClause);

      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(and(...where));

      const count = result?.count ?? 0;
      if (cacheable) {
        await setCachedUnreadCount(ctx.user.id, count, filter);
      }
      return { count };
    }),

  markAsSeen: protectedProcedure
    .input(notificationsContract.markAsSeen.input)
    .output(notificationsContract.markAsSeen.output)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const updated = await db
        .update(notificationsTable)
        .set(
          input.autoMarked
            ? {
                seenAt: now,
                metadata: sql`jsonb_set(
                  coalesce(${notificationsTable.metadata}, '{}'::jsonb),
                  '{autoMarkedAsSeen}',
                  'true'::jsonb,
                  true
                )`,
              }
            : { seenAt: now },
        )
        .where(
          and(
            eq(notificationsTable.userId, ctx.user.id),
            inArray(notificationsTable.id, input.ids),
            isNull(notificationsTable.seenAt),
          ),
        )
        .returning({ id: notificationsTable.id });

      if (updated.length > 0) {
        await invalidateUnreadCountForUser(ctx.user.id);
      }
      return { updated: updated.length };
    }),

  markAsUnseen: protectedProcedure
    .input(notificationsContract.markAsUnseen.input)
    .output(notificationsContract.markAsUnseen.output)
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(notificationsTable)
        .set({ seenAt: null })
        .where(
          and(
            eq(notificationsTable.userId, ctx.user.id),
            inArray(notificationsTable.id, input.ids),
          ),
        )
        .returning({ id: notificationsTable.id });

      if (updated.length > 0) {
        await invalidateUnreadCountForUser(ctx.user.id);
      }
      return { updated: updated.length };
    }),

  archive: protectedProcedure
    .input(notificationsContract.archive.input)
    .output(notificationsContract.archive.output)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const updated = await db
        .update(notificationsTable)
        .set({ archivedAt: now })
        .where(
          and(
            eq(notificationsTable.userId, ctx.user.id),
            inArray(notificationsTable.id, input.ids),
            isNull(notificationsTable.archivedAt),
          ),
        )
        .returning({ id: notificationsTable.id });

      if (updated.length > 0) {
        await invalidateUnreadCountForUser(ctx.user.id);
      }
      return { updated: updated.length };
    }),

  unarchive: protectedProcedure
    .input(notificationsContract.unarchive.input)
    .output(notificationsContract.unarchive.output)
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(notificationsTable)
        .set({ archivedAt: null })
        .where(
          and(
            eq(notificationsTable.userId, ctx.user.id),
            inArray(notificationsTable.id, input.ids),
          ),
        )
        .returning({ id: notificationsTable.id });

      if (updated.length > 0) {
        await invalidateUnreadCountForUser(ctx.user.id);
      }
      return { updated: updated.length };
    }),

  markAllAsSeen: protectedProcedure
    .input(notificationsContract.markAllAsSeen.input)
    .output(notificationsContract.markAllAsSeen.output)
    .mutation(async ({ ctx, input }) => {
      const where: Array<SQL | undefined> = [
        eq(notificationsTable.userId, ctx.user.id),
        isNull(notificationsTable.seenAt),
        isNull(notificationsTable.archivedAt),
      ];
      const resourceClause = resourceFilterClause(
        input.relatedResourceType,
        input.relatedResourceIdentifier,
      );
      if (resourceClause) where.push(resourceClause);

      const now = new Date();
      const updated = await db
        .update(notificationsTable)
        .set({ seenAt: now })
        .where(and(...where))
        .returning({ id: notificationsTable.id });

      if (updated.length > 0) {
        await invalidateUnreadCountForUser(ctx.user.id);
      }
      return { updated: updated.length };
    }),
});
