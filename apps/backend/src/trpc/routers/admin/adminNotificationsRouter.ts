import { db, usersTable } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { adminNotificationsContract } from '@namefi-astra/common/contract/admin/admin-notifications-contract';
import { Permission } from '@namefi-astra/utils';
import { eq, inArray, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import pMap from 'p-map';
import { createNotification } from '#lib/notifications/create-notification';
import { temporalClient } from '../../../temporal/client';
import { TEMPORAL_QUEUES } from '../../../temporal/shared';
import { broadcastNotificationWorkflow } from '../../../temporal/workflows/broadcast-notification.workflow';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Admin-only procedures for in-app notifications.
 *
 * `adminCreate` pushes a notification to one user; `adminCreateBulk` to a
 * chosen set (synchronous, capped at 500); `adminBroadcast` to every user
 * (via `broadcastNotificationWorkflow`). Every mutation is audited and
 * gated on `NOTIFICATIONS;;WRITE` — notifications surface in a user's UI
 * and are a phishing vector if misused. `lookupUsersByEmail` /
 * `getBroadcastAudienceSize` back the admin compose page and only need
 * `NOTIFICATIONS;;READ`.
 */

const BULK_USER_CAP = 500;

export const adminNotificationsRouter = createContractTRPCRouter<
  typeof adminNotificationsContract
>({
  adminCreate: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_NOTIFICATIONS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'create_in_app_notification',
      extraInput: input,
    }),
  )
    .input(adminNotificationsContract.adminCreate.input)
    .output(adminNotificationsContract.adminCreate.output)
    .mutation(async ({ input, ctx }) => {
      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.userId),
        columns: { id: true },
      });
      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const row = await createNotification({
        userId: input.userId,
        title: input.title,
        subtitle: input.subtitle,
        body: input.body,
        bodyType: input.bodyType,
        relatedResources: input.relatedResources,
        metadata: {
          ...(input.metadata ?? {}),
          source: input.metadata?.source ?? `admin:${ctx.user.id}`,
        },
      });

      return { id: row.id };
    }),

  adminCreateBulk: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_NOTIFICATIONS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: `bulk:${input.userIds.length}`,
      action: 'create_in_app_notification_bulk',
      // Keep the recipient list + title in the audit log; the body is
      // already in `input` but the list is the interesting part.
      extraInput: {
        title: input.title,
        userIds: input.userIds,
        userCount: input.userIds.length,
      },
    }),
  )
    .input(adminNotificationsContract.adminCreateBulk.input)
    .output(adminNotificationsContract.adminCreateBulk.output)
    .mutation(async ({ input, ctx }) => {
      // Defense-in-depth cap — the contract already declares `.max(500)`,
      // but a clear runtime error beats a raw Zod failure if anything
      // bypasses the wire validator.
      if (input.userIds.length > BULK_USER_CAP) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot notify more than ${BULK_USER_CAP} users at once (got ${input.userIds.length}).`,
        });
      }

      const source = `admin:bulk:${ctx.user.id}`;
      const results = await pMap(
        input.userIds,
        async (userId) => {
          try {
            await createNotification({
              userId,
              title: input.title,
              subtitle: input.subtitle,
              body: input.body,
              bodyType: input.bodyType,
              metadata: { source },
            });
            return { userId, status: 'created' as const, error: null };
          } catch (error) {
            // A bad userId trips the `notifications_user_id_users_id_fk`
            // FK constraint — surface it per-row instead of failing the
            // whole batch.
            return {
              userId,
              status: 'failed' as const,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
        { concurrency: 5 },
      );

      const created = results.filter((r) => r.status === 'created').length;
      return {
        results,
        summary: {
          total: results.length,
          created,
          failed: results.length - created,
        },
      };
    }),

  adminBroadcast: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_NOTIFICATIONS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'workflow',
      resourceId: 'broadcast-notification',
      action: 'broadcast_in_app_notification',
      extraInput: { title: input.title, subtitle: input.subtitle },
    }),
  )
    .input(adminNotificationsContract.adminBroadcast.input)
    .output(adminNotificationsContract.adminBroadcast.output)
    .mutation(async ({ input, ctx }) => {
      const [audienceRow] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(usersTable);
      const audienceSize = audienceRow?.value ?? 0;

      const workflowId = broadcastNotificationWorkflow.generateId();
      await temporalClient.workflow.start(broadcastNotificationWorkflow, {
        taskQueue: TEMPORAL_QUEUES.NOTIFY,
        workflowId,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        args: [
          {
            title: input.title,
            subtitle: input.subtitle,
            body: input.body,
            bodyType: input.bodyType,
            source: `admin:broadcast:${ctx.user.id}`,
          },
        ],
      });

      return { workflowId, audienceSize };
    }),

  lookupUsersByEmail: adminProcedureWithPermissions(
    Permission.READ_NOTIFICATIONS,
  )
    .input(adminNotificationsContract.lookupUsersByEmail.input)
    .output(adminNotificationsContract.lookupUsersByEmail.output)
    .query(async ({ input }) => {
      // Dedupe + normalize to lowercase for the DB lookup, but remember
      // the original casing so the frontend can key chips by the email
      // it displays verbatim. (Mirrors `emailCampaigns.lookupUsersByEmail`.)
      const originalsByNormalized = new Map<string, string[]>();
      for (const email of input.emails) {
        const normalized = email.trim().toLowerCase();
        if (!normalized) continue;
        const bucket = originalsByNormalized.get(normalized);
        if (bucket) {
          bucket.push(email);
        } else {
          originalsByNormalized.set(normalized, [email]);
        }
      }

      const normalizedList = Array.from(originalsByNormalized.keys());
      const results: Record<
        string,
        {
          userId: string | null;
          privyUserId: string | null;
          displayName: string | null;
        } | null
      > = {};
      for (const email of input.emails) {
        results[email] = null;
      }

      if (normalizedList.length === 0) {
        return { results };
      }

      const rows = await db
        .select({
          userId: usersTable.id,
          privyUserId: usersTable.privyUserId,
          primaryEmail: usersTable.primaryEmail,
          privyEmail: privyUsersTableSchema.email,
          privyDisplayName: privyUsersTableSchema.displayName,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .where(
          or(
            inArray(
              sql<string>`lower(${usersTable.primaryEmail})`,
              normalizedList,
            ),
            inArray(
              sql<string>`lower(${privyUsersTableSchema.email})`,
              normalizedList,
            ),
          ),
        );

      for (const row of rows) {
        const candidates = [row.primaryEmail, row.privyEmail].filter(
          (value): value is string => Boolean(value),
        );
        for (const candidate of candidates) {
          const normalized = candidate.trim().toLowerCase();
          const originals = originalsByNormalized.get(normalized);
          if (!originals) continue;
          for (const original of originals) {
            if (results[original]) continue; // already resolved
            results[original] = {
              userId: row.userId,
              privyUserId: row.privyUserId ?? null,
              displayName: row.privyDisplayName ?? null,
            };
          }
        }
      }

      return { results };
    }),

  getBroadcastAudienceSize: adminProcedureWithPermissions(
    Permission.READ_NOTIFICATIONS,
  )
    .input(adminNotificationsContract.getBroadcastAudienceSize.input)
    .output(adminNotificationsContract.getBroadcastAudienceSize.output)
    .query(async () => {
      const [row] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(usersTable);
      return { count: row?.value ?? 0 };
    }),
});
