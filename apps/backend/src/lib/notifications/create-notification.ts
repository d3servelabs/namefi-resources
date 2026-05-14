import {
  db,
  notificationsTable,
  type NotificationMetadata,
} from '@namefi-astra/db';
import type {
  NotificationBodyType,
  NotificationRelatedResource,
} from '@namefi-astra/common/shared-schemas';
import { createLogger } from '#lib/logger';
import { invalidateUnreadCountForUser } from './cache';

/**
 * Single entry point for creating in-app notifications.
 *
 * Used by:
 * - the admin tRPC mutation (`admin.notifications.adminCreate`)
 * - the Temporal activity wrapper (so workflows can fan out)
 * - any in-process backend code that wants to surface a UI event
 *
 * Returns the inserted row so callers can attach it to other state
 * (audit logs, workflow returns, etc.). Cache invalidation is
 * best-effort — a Redis hiccup only causes the bell to lag by the
 * TTL, never blocks the insert.
 */

const logger = createLogger({ module: 'create-notification' });

export type CreateNotificationInput = {
  userId: string;
  title: string;
  subtitle?: string | null;
  body: string;
  bodyType?: NotificationBodyType;
  relatedResources?: NotificationRelatedResource[];
  metadata?: NotificationMetadata;
};

export type NotificationRow = typeof notificationsTable.$inferSelect;

/**
 * Email subjects in this codebase commonly carry a `[Namefi]` /
 * `[Namefi.io]` prefix for inbox recognition. In-app notifications
 * already live inside the Namefi UI, so the brand prefix is redundant
 * noise — strip it at the boundary so callers can pass an email-style
 * title verbatim without needing to remember.
 */
const BRAND_PREFIX_REGEX = /^\s*\[Namefi(?:\.io)?\]\s*/i;

function stripBrandPrefix(title: string): string {
  return title.replace(BRAND_PREFIX_REGEX, '').trim();
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow> {
  const [row] = await db
    .insert(notificationsTable)
    .values({
      userId: input.userId,
      title: stripBrandPrefix(input.title),
      subtitle: input.subtitle ?? null,
      body: input.body,
      bodyType: input.bodyType ?? 'plain',
      relatedResources: input.relatedResources ?? [],
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!row) {
    // Defensive: a returning() on a successful insert should always yield a
    // row; if it ever doesn't, something is very wrong upstream.
    throw new Error('notification insert returned no row');
  }

  // Cache invalidation must NEVER fail the write path — the helper
  // already swallows Redis errors internally, but a defensive try/catch
  // here keeps that contract intact even if its implementation changes.
  try {
    await invalidateUnreadCountForUser(input.userId);
  } catch (error) {
    logger.warn(
      { error, userId: input.userId },
      'Unread-count cache invalidation failed after notification insert',
    );
  }

  logger.debug(
    { userId: input.userId, id: row.id, source: input.metadata?.source },
    'Created in-app notification',
  );

  return row;
}

/**
 * Declarative recipe for deriving an in-app notification from the same
 * props that drive an email template. Define one of these next to each
 * email-sending site so the title / body / related-resources logic is
 * colocated with the email and can't drift.
 *
 * Use the `createNotificationFromTemplate` helper below to write the row.
 */
export type NotificationTemplate<P> = {
  /** Source label written to `metadata.source` for traceability. */
  source: string;
  /** Title — stripped of the `[Namefi]` brand prefix at write time. */
  title: (props: P) => string;
  subtitle?: (props: P) => string | null | undefined;
  body: (props: P) => string;
  /** Defaults to `markdown` since most template bodies use bullets / emphasis. */
  bodyType?: NotificationBodyType;
  relatedResources?: (props: P) => NotificationRelatedResource[];
};

/**
 * Write a notification using a template plus its props. Equivalent to
 * `createNotification` with the title/body/resources computed from the
 * template's callbacks. Optional `extraMetadata` is merged on top of
 * the template's `source` label so callers can pin per-invocation
 * details (e.g. campaign keys) without rewriting the template.
 */
export async function createNotificationFromTemplate<P>(args: {
  template: NotificationTemplate<P>;
  userId: string;
  props: P;
  extraMetadata?: Omit<NotificationMetadata, 'source'> & { source?: string };
}): Promise<NotificationRow> {
  const { template, userId, props, extraMetadata } = args;
  const subtitle = template.subtitle?.(props) ?? undefined;
  return createNotification({
    userId,
    title: template.title(props),
    subtitle,
    body: template.body(props),
    bodyType: template.bodyType ?? 'markdown',
    relatedResources: template.relatedResources?.(props) ?? [],
    metadata: {
      ...extraMetadata,
      source: extraMetadata?.source ?? template.source,
    },
  });
}
