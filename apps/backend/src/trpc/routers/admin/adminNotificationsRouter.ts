import { db, usersTable } from '@namefi-astra/db';
import { adminNotificationsContract } from '@namefi-astra/common/contract/admin/admin-notifications-contract';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createNotification } from '#lib/notifications/create-notification';
import { auditedAdminProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Admin-only mutations for in-app notifications.
 *
 * `adminCreate` lets ops/support push a notification to any user. Every
 * call is audited because broadcasts that surface in a user's UI are a
 * sensitive surface area (potential phishing vector if misused).
 */

export const adminNotificationsRouter = createContractTRPCRouter<
  typeof adminNotificationsContract
>({
  adminCreate: auditedAdminProcedure(({ ctx, input, auditActorExtraInfo }) => ({
    actorType: 'admin',
    actorId: ctx.user.id,
    actorExtraInfo: auditActorExtraInfo,
    resourceType: 'user',
    resourceId: input.userId,
    action: 'create_in_app_notification',
    extraInput: input,
  }))
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
});
