import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  cartItemsTable,
  emailCampaignSendsTable,
  ordersTable,
  usersTable,
} from '@namefi-astra/db';
import type { EmailCampaignSendMetadata } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { and, desc, eq, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@namefi-astra/db';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
} from '../../base';
import { Permission } from '@namefi-astra/utils';
import {
  EMAIL_CAMPAIGN_KEYS,
  EMAIL_CAMPAIGN_KEY_LIST,
  EMAIL_CAMPAIGN_SCHEDULE_IDS,
} from '../../../services/email-campaigns/constants';
import type { EmailCampaignKey } from '../../../services/email-campaigns/constants';
import {
  getCartDomainsPopularEligibleUserIds,
  getDreamDomainAwaitsEligibleUserIds,
} from '../../../services/email-campaigns/eligibility';
import {
  getMonthlyPeriodStartUtc,
  getWeeklyPeriodStartUtc,
} from '../../../temporal/workflows/email-campaign-period';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { weeklyCartDomainsPopularWorkflow } from '#temporal/workflows/cart-domains-popular.workflow';
import { monthlyDreamDomainAwaitsWorkflow } from '#temporal/workflows/dream-domain-awaits.workflow';
import { logger } from '#lib/logger';
import { ResourceType } from '#lib/auditor';
import { SCHEDULE_REGISTRY } from '../../../temporal/schedules';

const emailCampaignKeySchema = z.enum(EMAIL_CAMPAIGN_KEY_LIST);

type CampaignSendHistory = {
  id: string;
  userId: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
  periodStart: Date;
  attemptCount: number;
  lastError: string | null;
  metadata: EmailCampaignSendMetadata;
};

type EligibleUserRow = {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  lastSentAt: Date | null;
  lastSendStatus: string | null;
  sendHistory: CampaignSendHistory[];
  cartItemCount?: number;
  cartItemTotalUsdCents?: number;
  cartOldestAddedAt?: Date | null;
  cartNewestAddedAt?: Date | null;
  lastOrderAt?: Date | null;
};

function getPeriodStartForCampaign(
  campaignKey: EmailCampaignKey,
  now: Date,
): Date {
  if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
    return getWeeklyPeriodStartUtc(now);
  }

  return getMonthlyPeriodStartUtc(now);
}

function getScheduleIdForCampaign(campaignKey: EmailCampaignKey): string {
  return EMAIL_CAMPAIGN_SCHEDULE_IDS[campaignKey];
}

function getScheduleForCampaign(campaignKey: EmailCampaignKey) {
  const scheduleId = getScheduleIdForCampaign(campaignKey);
  const schedule = SCHEDULE_REGISTRY[scheduleId];
  if (!schedule) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Schedule ${scheduleId} not found`,
    });
  }
  return { scheduleId, schedule };
}

async function getEligibleUserIds(
  campaignKey: EmailCampaignKey,
  periodStart: Date,
  userIdFilter?: string[],
): Promise<string[]> {
  if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
    return getCartDomainsPopularEligibleUserIds({
      periodStart,
      userIdFilter,
    });
  }

  return getDreamDomainAwaitsEligibleUserIds({
    periodStart,
    userIdFilter,
  });
}

export const emailCampaignsRouter = createTRPCRouter({
  getScheduleStatus: adminProcedureWithPermissions(Permission.READ_SCHEDULES)
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
      }),
    )
    .query(async ({ input }) => {
      const { scheduleId, schedule } = getScheduleForCampaign(
        input.campaignKey,
      );
      const status = await schedule.getStatus();
      return {
        campaignKey: input.campaignKey,
        scheduleId,
        status,
      };
    }),

  pauseSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.SCHEDULED_WORKFLOW,
      resourceId: getScheduleIdForCampaign(input.campaignKey),
      action: 'pause',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId, schedule } = getScheduleForCampaign(
        input.campaignKey,
      );
      await schedule.pause();
      logger.debug({ scheduleId }, 'Campaign schedule paused');
      return {
        success: true,
        message: 'Campaign schedule paused',
        campaignKey: input.campaignKey,
        scheduleId,
      };
    }),

  resumeSchedule: auditedAdminProcedureWithPermissions(
    Permission.WRITE_SCHEDULES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.SCHEDULED_WORKFLOW,
      resourceId: getScheduleIdForCampaign(input.campaignKey),
      action: 'unpause',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { scheduleId, schedule } = getScheduleForCampaign(
        input.campaignKey,
      );
      await schedule.unpause();
      logger.debug({ scheduleId }, 'Campaign schedule resumed');
      return {
        success: true,
        message: 'Campaign schedule resumed',
        campaignKey: input.campaignKey,
        scheduleId,
      };
    }),

  getEligibleUsers: adminProcedureWithPermissions(
    [Permission.READ_USERS, Permission.READ_ORDERS],
    { mode: 'every' },
  )
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
      }),
    )
    .query(async ({ input }) => {
      const { campaignKey } = input;
      const now = new Date();
      const periodStart = getPeriodStartForCampaign(campaignKey, now);

      const eligibleUserIds = await getEligibleUserIds(
        campaignKey,
        periodStart,
      );

      if (eligibleUserIds.length === 0) {
        const users: EligibleUserRow[] = [];
        return {
          campaignKey,
          periodStart,
          users,
        };
      }

      const users = await db
        .select({
          userId: usersTable.id,
          createdAt: usersTable.createdAt,
          email: privyUsersTableSchema.email,
          displayName: privyUsersTableSchema.displayName,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .where(inArray(usersTable.id, eligibleUserIds));

      const sendHistoryRows = await db
        .select({
          id: emailCampaignSendsTable.id,
          userId: emailCampaignSendsTable.userId,
          status: emailCampaignSendsTable.status,
          sentAt: emailCampaignSendsTable.sentAt,
          createdAt: emailCampaignSendsTable.createdAt,
          periodStart: emailCampaignSendsTable.periodStart,
          attemptCount: emailCampaignSendsTable.attemptCount,
          lastError: emailCampaignSendsTable.lastError,
          metadata: emailCampaignSendsTable.metadata,
        })
        .from(emailCampaignSendsTable)
        .where(
          and(
            eq(emailCampaignSendsTable.campaignKey, campaignKey),
            inArray(emailCampaignSendsTable.userId, eligibleUserIds),
          ),
        )
        .orderBy(
          desc(emailCampaignSendsTable.sentAt),
          desc(emailCampaignSendsTable.createdAt),
        );

      const sendHistoryByUser = new Map<string, CampaignSendHistory[]>();
      for (const row of sendHistoryRows) {
        const history = sendHistoryByUser.get(row.userId) ?? [];
        history.push({
          id: row.id,
          userId: row.userId,
          status: row.status,
          sentAt: row.sentAt,
          createdAt: row.createdAt,
          periodStart: row.periodStart,
          attemptCount: row.attemptCount,
          lastError: row.lastError,
          metadata: row.metadata ?? {},
        });
        sendHistoryByUser.set(row.userId, history);
      }

      const cartStatsByUser = new Map<
        string,
        {
          cartItemCount: number;
          cartItemTotalUsdCents: number;
          cartOldestAddedAt: Date | null;
          cartNewestAddedAt: Date | null;
        }
      >();

      const orderStatsByUser = new Map<string, { lastOrderAt: Date | null }>();

      if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
        const cartStats = await db
          .select({
            userId: cartItemsTable.userId,
            cartItemCount: sql<number>`count(*)`.as('cart_item_count'),
            cartItemTotalUsdCents:
              sql<number>`COALESCE(sum(${cartItemsTable.amountInUSDCents}), 0)`.as(
                'cart_item_total_usd_cents',
              ),
            cartOldestAddedAt: sql<Date>`min(${cartItemsTable.createdAt})`.as(
              'cart_oldest_added_at',
            ),
            cartNewestAddedAt: sql<Date>`max(${cartItemsTable.createdAt})`.as(
              'cart_newest_added_at',
            ),
          })
          .from(cartItemsTable)
          .where(
            and(
              inArray(cartItemsTable.userId, eligibleUserIds),
              lte(cartItemsTable.createdAt, sql`now() - interval '1 day'`),
            ),
          )
          .groupBy(cartItemsTable.userId);

        for (const row of cartStats) {
          cartStatsByUser.set(row.userId, {
            cartItemCount: row.cartItemCount ?? 0,
            cartItemTotalUsdCents: row.cartItemTotalUsdCents ?? 0,
            cartOldestAddedAt: row.cartOldestAddedAt ?? null,
            cartNewestAddedAt: row.cartNewestAddedAt ?? null,
          });
        }
      } else {
        const orderStats = await db
          .select({
            userId: ordersTable.userId,
            lastOrderAt: sql<Date>`max(${ordersTable.createdAt})`.as(
              'last_order_at',
            ),
          })
          .from(ordersTable)
          .where(
            and(
              inArray(ordersTable.userId, eligibleUserIds),
              inArray(ordersTable.status, ['SUCCEEDED', 'PARTIALLY_COMPLETED']),
            ),
          )
          .groupBy(ordersTable.userId);

        for (const row of orderStats) {
          orderStatsByUser.set(row.userId, {
            lastOrderAt: row.lastOrderAt ?? null,
          });
        }
      }

      const usersWithDetails = users.map((user) => {
        const sendHistory = sendHistoryByUser.get(user.userId) ?? [];
        const lastSentRecord =
          sendHistory.find((entry) => entry.sentAt) ?? null;
        const lastSentAt = lastSentRecord?.sentAt ?? null;
        const lastSendStatus = sendHistory[0]?.status ?? null;

        const base: EligibleUserRow = {
          userId: user.userId,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          createdAt: user.createdAt,
          lastSentAt,
          lastSendStatus,
          sendHistory,
        };

        if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
          const cartStats = cartStatsByUser.get(user.userId);
          return {
            ...base,
            cartItemCount: cartStats?.cartItemCount ?? 0,
            cartItemTotalUsdCents: cartStats?.cartItemTotalUsdCents ?? 0,
            cartOldestAddedAt: cartStats?.cartOldestAddedAt ?? null,
            cartNewestAddedAt: cartStats?.cartNewestAddedAt ?? null,
          };
        }

        const orderStats = orderStatsByUser.get(user.userId);
        return {
          ...base,
          lastOrderAt: orderStats?.lastOrderAt ?? null,
        };
      });

      usersWithDetails.sort((a, b) => {
        const emailA = a.email ?? '';
        const emailB = b.email ?? '';
        if (emailA === emailB) return a.userId.localeCompare(b.userId);
        return emailA.localeCompare(emailB);
      });

      return {
        campaignKey,
        periodStart,
        users: usersWithDetails,
      };
    }),

  sendNow: auditedAdminProcedureWithPermissions(
    [Permission.READ_USERS, Permission.READ_ORDERS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.WORKFLOW,
      resourceId: `${input.campaignKey}:${input.userId}`,
      action: 'send_campaign_email',
      extraInput: input,
    }),
    { mode: 'every' },
  )
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { campaignKey, userId } = input;
      const now = new Date();
      const periodStart = getPeriodStartForCampaign(campaignKey, now);
      const eligibleUserIds = await getEligibleUserIds(
        campaignKey,
        periodStart,
        [userId],
      );

      if (!eligibleUserIds.includes(userId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is not eligible for this campaign',
        });
      }

      const workflowId = `admin-email-campaign-${campaignKey}-${userId}-${Date.now()}`;

      try {
        const workflow =
          campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR
            ? weeklyCartDomainsPopularWorkflow
            : monthlyDreamDomainAwaitsWorkflow;

        await temporalClient.workflow.start(workflow, {
          args: [
            {
              userIdFilter: [userId],
              periodStartOverride: periodStart.toISOString(),
            },
          ],
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          workflowId,
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          workflowIdConflictPolicy: 'USE_EXISTING',
        });

        return {
          success: true,
          message: 'Campaign email send started',
          campaignKey,
          workflowId,
          periodStart,
        };
      } catch (error) {
        logger.error(
          { error, campaignKey, userId, workflowId },
          'Failed to start campaign email workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start campaign email workflow',
          cause: error,
        });
      }
    }),
});
