import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  cartItemsTable,
  emailCampaignSendsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
  ordersTable,
  usersTable,
} from '@namefi-astra/db';
import type { EmailCampaignSendMetadata } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { and, desc, eq, ilike, inArray, lte, or, sql } from 'drizzle-orm';
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
  getDomainTrafficSurgeEligibleUserIds,
  getDreamDomainAwaitsEligibleUserIds,
} from '../../../services/email-campaigns/eligibility';
import {
  getDomainTrafficCampaignCandidates,
  getRollingWeeklyTrafficDateRange,
  type DomainTrafficCandidate,
} from '../../../services/email-campaigns/domain-traffic';
import {
  getMonthlyPeriodStartUtc,
  getWeeklyPeriodStartUtc,
} from '../../../temporal/workflows/email-campaign-period';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { weeklyCartDomainsPopularWorkflow } from '#temporal/workflows/cart-domains-popular.workflow';
import { monthlyDreamDomainAwaitsWorkflow } from '#temporal/workflows/dream-domain-awaits.workflow';
import { weeklyDomainTrafficSurgeWorkflow } from '#temporal/workflows/domain-traffic-surge.workflow';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
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
  hasOwnedDomains?: boolean;
  ownedDomainCount?: number;
  trafficDomainCount?: number;
  trafficTopDomain?: string | null;
  trafficTopWeeklyQueries?: number | null;
};

function getPeriodStartForCampaign(
  campaignKey: EmailCampaignKey,
  now: Date,
): Date {
  if (
    campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR ||
    campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE
  ) {
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

function isScheduleNotConfiguredError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return message.includes('schedule') && message.includes('not found');
}

async function getEligibleUserIds(
  campaignKey: EmailCampaignKey,
  periodStart: Date,
  userIdFilter?: string[],
  asOf?: Date,
): Promise<string[]> {
  if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
    return getCartDomainsPopularEligibleUserIds({
      periodStart,
      userIdFilter,
    });
  }

  if (campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE) {
    return getDomainTrafficSurgeEligibleUserIds({
      periodStart,
      userIdFilter,
      asOf,
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
      try {
        const status = await schedule.getStatus();
        return {
          campaignKey: input.campaignKey,
          scheduleId,
          isConfigured: true,
          status,
          message: null,
        };
      } catch (error) {
        if (isScheduleNotConfiguredError(error)) {
          logger.info(
            { scheduleId, campaignKey: input.campaignKey },
            'Campaign schedule is not configured in Temporal',
          );
          return {
            campaignKey: input.campaignKey,
            scheduleId,
            isConfigured: false,
            status: null,
            message: 'Schedule is not set up in Temporal yet',
          };
        }

        logger.error(
          { error, scheduleId, campaignKey: input.campaignKey },
          'Failed to get campaign schedule status',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get campaign schedule status',
          cause: error,
        });
      }
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
      try {
        await schedule.pause();
        logger.debug({ scheduleId }, 'Campaign schedule paused');
        return {
          success: true,
          message: 'Campaign schedule paused',
          campaignKey: input.campaignKey,
          scheduleId,
        };
      } catch (error) {
        if (isScheduleNotConfiguredError(error)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message:
              'Schedule is not set up yet. Open Admin > Schedules and click Setup Schedule.',
          });
        }
        logger.error(
          { error, scheduleId, campaignKey: input.campaignKey },
          'Failed to pause campaign schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to pause campaign schedule',
          cause: error,
        });
      }
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
      try {
        await schedule.unpause();
        logger.debug({ scheduleId }, 'Campaign schedule resumed');
        return {
          success: true,
          message: 'Campaign schedule resumed',
          campaignKey: input.campaignKey,
          scheduleId,
        };
      } catch (error) {
        if (isScheduleNotConfiguredError(error)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message:
              'Schedule is not set up yet. Open Admin > Schedules and click Setup Schedule.',
          });
        }
        logger.error(
          { error, scheduleId, campaignKey: input.campaignKey },
          'Failed to resume campaign schedule',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resume campaign schedule',
          cause: error,
        });
      }
    }),

  getEligibleUsers: adminProcedureWithPermissions(
    [Permission.READ_USERS, Permission.READ_ORDERS],
    { mode: 'every' },
  )
    .input(
      z.object({
        campaignKey: emailCampaignKeySchema,
        searchTerm: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { campaignKey } = input;
      const searchTerm = input.searchTerm?.trim() || undefined;
      const searchTermLike = searchTerm ? `%${searchTerm}%` : undefined;
      const now = new Date();
      const periodStart = getPeriodStartForCampaign(campaignKey, now);
      const dreamOrderLookbackDays =
        campaignKey === EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS
          ? config.EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS
          : null;
      const trafficWeeklyThreshold =
        campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE
          ? config.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD
          : null;
      const trafficDateRange =
        campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE
          ? getRollingWeeklyTrafficDateRange(now)
          : null;
      const trafficCandidatesByUser = new Map<string, DomainTrafficCandidate>();

      const eligibleUserIds =
        campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE
          ? (
              await getDomainTrafficCampaignCandidates({
                periodStart,
                asOf: now,
              })
            ).map((candidate) => {
              trafficCandidatesByUser.set(candidate.userId, candidate);
              return candidate.userId;
            })
          : await getEligibleUserIds(campaignKey, periodStart, undefined, now);

      if (eligibleUserIds.length === 0) {
        const users: EligibleUserRow[] = [];
        return {
          campaignKey,
          periodStart,
          dreamOrderLookbackDays,
          trafficWeeklyThreshold,
          trafficWindowStartUtc: trafficDateRange?.startDate ?? null,
          trafficWindowEndUtc: trafficDateRange?.endDate ?? null,
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
        .where(
          and(
            inArray(usersTable.id, eligibleUserIds),
            ...(searchTermLike
              ? [
                  or(
                    ilike(privyUsersTableSchema.email, searchTermLike),
                    ilike(privyUsersTableSchema.displayName, searchTermLike),
                    sql`${usersTable.id}::text ILIKE ${searchTermLike}`,
                  ),
                ]
              : []),
          ),
        );

      const filteredUserIds = users.map((user) => user.userId);

      if (filteredUserIds.length === 0) {
        const users: EligibleUserRow[] = [];
        return {
          campaignKey,
          periodStart,
          dreamOrderLookbackDays,
          trafficWeeklyThreshold,
          trafficWindowStartUtc: trafficDateRange?.startDate ?? null,
          trafficWindowEndUtc: trafficDateRange?.endDate ?? null,
          users,
        };
      }

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
            inArray(emailCampaignSendsTable.userId, filteredUserIds),
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
      const domainStatsByUser = new Map<
        string,
        { hasOwnedDomains: boolean; ownedDomainCount: number }
      >();

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
              inArray(cartItemsTable.userId, filteredUserIds),
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
      } else if (campaignKey === EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS) {
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
              inArray(ordersTable.userId, filteredUserIds),
              inArray(ordersTable.status, ['SUCCEEDED', 'PARTIALLY_COMPLETED']),
            ),
          )
          .groupBy(ordersTable.userId);

        for (const row of orderStats) {
          orderStatsByUser.set(row.userId, {
            lastOrderAt: row.lastOrderAt ?? null,
          });
        }

        const domainStats = await db
          .with(namefiNftOwnersCte)
          .select({
            userId: usersTable.id,
            ownedDomainCount:
              sql<number>`count(distinct ${namefiNftOwnersView.normalizedDomainName})`.as(
                'owned_domain_count',
              ),
          })
          .from(usersTable)
          .innerJoin(
            privyUsersTableSchema,
            eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
          )
          .innerJoin(
            namefiNftOwnersView,
            sql`LOWER(${namefiNftOwnersView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
          )
          .where(inArray(usersTable.id, filteredUserIds))
          .groupBy(usersTable.id);

        for (const row of domainStats) {
          const count = row.ownedDomainCount ?? 0;
          domainStatsByUser.set(row.userId, {
            ownedDomainCount: count,
            hasOwnedDomains: count > 0,
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

        if (campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE) {
          const trafficCandidate = trafficCandidatesByUser.get(user.userId);
          const topTrafficDomain = trafficCandidate?.domains[0];
          return {
            ...base,
            trafficDomainCount: trafficCandidate?.domains.length ?? 0,
            trafficTopDomain: topTrafficDomain?.domain ?? null,
            trafficTopWeeklyQueries: topTrafficDomain?.weeklyQueries ?? null,
          };
        }

        const orderStats = orderStatsByUser.get(user.userId);
        const domainStats = domainStatsByUser.get(user.userId);
        return {
          ...base,
          lastOrderAt: orderStats?.lastOrderAt ?? null,
          hasOwnedDomains: domainStats?.hasOwnedDomains ?? false,
          ownedDomainCount: domainStats?.ownedDomainCount ?? 0,
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
        dreamOrderLookbackDays,
        trafficWeeklyThreshold,
        trafficWindowStartUtc: trafficDateRange?.startDate ?? null,
        trafficWindowEndUtc: trafficDateRange?.endDate ?? null,
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
        now,
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
            : campaignKey === EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE
              ? weeklyDomainTrafficSurgeWorkflow
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
