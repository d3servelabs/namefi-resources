import { db, feedbackResponsesTable } from '@namefi-astra/db';
import { feedbackContract } from '@namefi-astra/common/contract/feedback-contract';
import {
  protectedProcedure,
  publicProcedure,
  type TrpcContextWithUserOrNull,
} from '../base';
import { createContractTRPCRouter } from '../contract';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'feedback-router' });

function getIdentity(ctx: TrpcContextWithUserOrNull) {
  const userId = ctx.user?.id ?? null;
  const ipAddress = ctx.honoVars?.connInfo.remote.address ?? 'unknown';

  return { userId, ipAddress };
}

export const feedbackRouter = createContractTRPCRouter<typeof feedbackContract>(
  {
    submit: publicProcedure
      .input(feedbackContract.submit.input)
      .output(feedbackContract.submit.output)
      .mutation(async ({ ctx, input }) => {
        const { userId, ipAddress } = getIdentity(ctx);

        if (input.feedbackId) {
          const whereClause = and(
            eq(feedbackResponsesTable.id, input.feedbackId),
            userId
              ? eq(feedbackResponsesTable.userId, userId)
              : eq(feedbackResponsesTable.ipAddress, ipAddress),
          );

          const updateValues: Partial<
            typeof feedbackResponsesTable.$inferInsert
          > = {
            rating: input.rating,
          };

          if (typeof input.message === 'string') {
            updateValues.message = input.message;
          }

          const [updated] = await db
            .update(feedbackResponsesTable)
            .set(updateValues)
            .where(whereClause)
            .returning();

          if (!updated) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Feedback entry not found for this user',
            });
          }

          logger.debug(
            {
              userId,
              ipAddress,
              feedbackId: updated.id,
              mode: 'update',
            },
            'Feedback updated',
          );

          return {
            id: updated.id,
            createdAt: updated.createdAt,
            rating: updated.rating,
            message: updated.message,
          };
        }

        const [inserted] = await db
          .insert(feedbackResponsesTable)
          .values({
            userId,
            ipAddress,
            rating: input.rating,
            message: input.message,
            metadata: {
              path: input.path,
              poweredByNamefiDomain: ctx.poweredByNamefiDomain,
              sessionId: ctx.sessionId ?? null,
              userAgent: ctx.req.header('user-agent') ?? undefined,
              referer: ctx.req.header('referer') ?? undefined,
            },
          })
          .returning();

        logger.debug(
          {
            userId,
            ipAddress,
            feedbackId: inserted?.id,
            mode: 'create',
          },
          'Feedback submitted',
        );

        if (!inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to insert feedback',
          });
        }

        return {
          id: inserted.id,
          createdAt: inserted.createdAt,
          rating: inserted.rating,
          message: inserted.message,
        };
      }),

    claimAnonymous: protectedProcedure
      .input(feedbackContract.claimAnonymous.input)
      .output(feedbackContract.claimAnonymous.output)
      .mutation(async ({ ctx, input }) => {
        const ipAddress = ctx.honoVars?.connInfo.remote.address ?? 'unknown';

        const updated = await db
          .update(feedbackResponsesTable)
          .set({
            userId: ctx.user.id,
          })
          .where(
            and(
              inArray(feedbackResponsesTable.id, input.feedbackIds),
              isNull(feedbackResponsesTable.userId),
            ),
          )
          .returning({
            id: feedbackResponsesTable.id,
            rating: feedbackResponsesTable.rating,
            message: feedbackResponsesTable.message,
            createdAt: feedbackResponsesTable.createdAt,
          });

        logger.debug(
          {
            userId: ctx.user.id,
            ipAddress,
            claimedIds: updated.map((f) => f.id),
          },
          'Claimed anonymous feedback rows',
        );

        return {
          updated,
          ipAddress,
        };
      }),
  },
);
