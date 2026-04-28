import { TRPCError } from '@trpc/server';
import pMap from 'p-map';
import { z } from 'zod';
import {
  cartItemsTable,
  emailCampaignSendsTable,
  indexedDomainsTable,
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
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminEmailCampaignsContract } from '@namefi-astra/common/contract/admin/admin-email-campaigns-contract';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../../utils';
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
import { resolve } from '../../../utils/resolve';

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
  ownedDomains?: string[];
  trafficDomainCount?: number;
  trafficDomains?: DomainTrafficCandidate['domains'];
  trafficTopDomain?: string | null;
  trafficTopWeeklyQueries?: number | null;
};

type DomainTrafficSurgeFunnelDebugRow = {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  ownedDomainCount: number;
  namefiNameserverDomainCount: number;
  thresholdDomainCount: number;
  thresholdTopDomain: string | null;
  thresholdTopWeeklyQueries: number | null;
  alreadySentThisCycle: boolean;
  sendRecordStatus: string | null;
  dropOffStage:
    | 'ownership'
    | 'nameservers'
    | 'threshold'
    | 'already_sent'
    | 'eligible';
};

type LiveOwnershipStats = {
  ownedDomains: string[];
  ownedDomainCount: number;
  namefiNameserverDomainCount: number;
};

async function getLiveOwnershipStatsByUser({
  users,
}: {
  users: Array<{ userId: string; privyUserId: string | null }>;
}): Promise<Map<string, LiveOwnershipStats>> {
  const entries = await pMap(
    users,
    async ({ userId, privyUserId }) => {
      if (!privyUserId) {
        return {
          userId,
          stats: {
            ownedDomains: [],
            ownedDomainCount: 0,
            namefiNameserverDomainCount: 0,
          },
        };
      }

      const [privyError, privyUser] = await resolve(
        privyClient.getUserById(privyUserId),
      );
      if (privyError || !privyUser) {
        logger.warn(
          { userId, privyUserId, error: privyError },
          'Failed to load Privy user while computing ownership stats',
        );
        return {
          userId,
          stats: {
            ownedDomains: [],
            ownedDomainCount: 0,
            namefiNameserverDomainCount: 0,
          },
        };
      }

      let walletAddresses: string[] = [];
      try {
        walletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        });
      } catch (error) {
        logger.warn(
          { userId, privyUserId, error },
          'Failed to parse Privy wallets while computing ownership stats',
        );
        return {
          userId,
          stats: {
            ownedDomains: [],
            ownedDomainCount: 0,
            namefiNameserverDomainCount: 0,
          },
        };
      }

      if (walletAddresses.length === 0) {
        return {
          userId,
          stats: {
            ownedDomains: [],
            ownedDomainCount: 0,
            namefiNameserverDomainCount: 0,
          },
        };
      }

      const ownedDomainRows = await db
        .with(namefiNftOwnersCte)
        .select({
          normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
          isUsingNamefiNameservers:
            indexedDomainsTable.isUsingNamefiNameservers,
        })
        .from(namefiNftOwnersView)
        .leftJoin(
          indexedDomainsTable,
          eq(
            indexedDomainsTable.normalizedDomainName,
            namefiNftOwnersView.normalizedDomainName,
          ),
        )
        .where(inArray(namefiNftOwnersView.ownerAddress, walletAddresses));

      const ownedDomainSet = new Set(
        ownedDomainRows.map((row) => row.normalizedDomainName),
      );
      const nameserverDomainSet = new Set(
        ownedDomainRows
          .filter((row) => row.isUsingNamefiNameservers === true)
          .map((row) => row.normalizedDomainName),
      );

      return {
        userId,
        stats: {
          ownedDomains: Array.from(ownedDomainSet).sort(),
          ownedDomainCount: ownedDomainSet.size,
          namefiNameserverDomainCount: nameserverDomainSet.size,
        },
      };
    },
    { concurrency: 10 },
  );

  return new Map(entries.map((entry) => [entry.userId, entry.stats]));
}

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

export const emailCampaignsRouter = createContractTRPCRouter<
  typeof adminEmailCampaignsContract
>({
  getScheduleStatus: adminProcedureWithPermissions(Permission.READ_SCHEDULES)
    .input(adminEmailCampaignsContract.getScheduleStatus.input)
    .output(adminEmailCampaignsContract.getScheduleStatus.output)
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
    .input(adminEmailCampaignsContract.pauseSchedule.input)
    .output(adminEmailCampaignsContract.pauseSchedule.output)
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
    .input(adminEmailCampaignsContract.resumeSchedule.input)
    .output(adminEmailCampaignsContract.resumeSchedule.output)
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
    .input(adminEmailCampaignsContract.getEligibleUsers.input)
    .output(adminEmailCampaignsContract.getEligibleUsers.output)
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
          privyUserId: usersTable.privyUserId,
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
        {
          hasOwnedDomains: boolean;
          ownedDomainCount: number;
          ownedDomains: string[];
        }
      >();

      if (campaignKey === EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) {
        const cartItemMinAgeDays =
          config.EMAIL_CART_DOMAINS_POPULAR_ITEM_MIN_AGE_DAYS;
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
              lte(
                cartItemsTable.createdAt,
                sql`now() - (${cartItemMinAgeDays} * interval '1 day')`,
              ),
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

        const liveOwnershipStatsByUser = await getLiveOwnershipStatsByUser({
          users: users.map((user) => ({
            userId: user.userId,
            privyUserId: user.privyUserId ?? null,
          })),
        });

        for (const [userId, stats] of liveOwnershipStatsByUser.entries()) {
          domainStatsByUser.set(userId, {
            ownedDomainCount: stats.ownedDomainCount,
            hasOwnedDomains: stats.ownedDomainCount > 0,
            ownedDomains: stats.ownedDomains,
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
            trafficDomains: trafficCandidate?.domains ?? [],
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
          ownedDomains: domainStats?.ownedDomains ?? [],
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

  getDomainTrafficSurgeFunnelDebug: adminProcedureWithPermissions(
    Permission.READ_USERS,
  )
    .input(adminEmailCampaignsContract.getDomainTrafficSurgeFunnelDebug.input)
    .output(adminEmailCampaignsContract.getDomainTrafficSurgeFunnelDebug.output)
    .query(async ({ input }) => {
      const searchTerm = input.searchTerm?.trim() || undefined;
      const searchTermLike = searchTerm ? `%${searchTerm}%` : undefined;
      const now = new Date();
      const periodStart = getWeeklyPeriodStartUtc(now);
      const trafficDateRange = getRollingWeeklyTrafficDateRange(now);
      const trafficWeeklyThreshold =
        config.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD;
      const hasEmailCondition = sql<boolean>`NULLIF(TRIM(${privyUsersTableSchema.email}), '') IS NOT NULL`;

      const users = await db
        .select({
          userId: usersTable.id,
          privyUserId: usersTable.privyUserId,
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
            eq(usersTable.subscribeToEmails, true),
            hasEmailCondition,
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
        )
        .orderBy(desc(usersTable.createdAt))
        .limit(input.limit);

      if (users.length === 0) {
        return {
          periodStart,
          trafficWeeklyThreshold,
          trafficWindowStartUtc: trafficDateRange.startDate,
          trafficWindowEndUtc: trafficDateRange.endDate,
          summary: {
            totalUsers: 0,
            droppedAtOwnership: 0,
            droppedAtNameservers: 0,
            droppedAtThreshold: 0,
            droppedAtAlreadySent: 0,
            fullyEligible: 0,
          },
          users: [] as DomainTrafficSurgeFunnelDebugRow[],
        };
      }

      const userIds = users.map((user) => user.userId);

      const [liveOwnershipStatsByUser, thresholdCandidates, sentRows] =
        await Promise.all([
          getLiveOwnershipStatsByUser({
            users: users.map((user) => ({
              userId: user.userId,
              privyUserId: user.privyUserId ?? null,
            })),
          }),
          getDomainTrafficCampaignCandidates({
            periodStart,
            userIdFilter: userIds,
            asOf: now,
            skipAlreadySentCheck: true,
          }),
          db
            .select({
              userId: emailCampaignSendsTable.userId,
              status: emailCampaignSendsTable.status,
            })
            .from(emailCampaignSendsTable)
            .where(
              and(
                eq(
                  emailCampaignSendsTable.campaignKey,
                  EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
                ),
                eq(emailCampaignSendsTable.periodStart, periodStart),
                inArray(emailCampaignSendsTable.userId, userIds),
                inArray(emailCampaignSendsTable.status, ['SENT', 'PENDING']),
              ),
            ),
        ]);

      const ownedDomainsByUser = new Map<string, number>();
      const nameserverDomainsByUser = new Map<string, number>();
      for (const [userId, stats] of liveOwnershipStatsByUser.entries()) {
        ownedDomainsByUser.set(userId, stats.ownedDomainCount);
        nameserverDomainsByUser.set(userId, stats.namefiNameserverDomainCount);
      }

      const thresholdCandidatesByUser = new Map<
        string,
        DomainTrafficCandidate
      >();
      for (const candidate of thresholdCandidates) {
        thresholdCandidatesByUser.set(candidate.userId, candidate);
      }

      const sentByUser = new Map<string, string>();
      for (const row of sentRows) {
        sentByUser.set(row.userId, row.status);
      }

      const funnelRows: DomainTrafficSurgeFunnelDebugRow[] = users.map(
        (user) => {
          const ownedDomainCount = ownedDomainsByUser.get(user.userId) ?? 0;
          const namefiNameserverDomainCount =
            nameserverDomainsByUser.get(user.userId) ?? 0;
          const thresholdCandidate = thresholdCandidatesByUser.get(user.userId);
          const thresholdDomainCount = thresholdCandidate?.domains.length ?? 0;
          const topThresholdDomain = thresholdCandidate?.domains[0];
          const sendRecordStatus = sentByUser.get(user.userId) ?? null;
          const alreadySentThisCycle = Boolean(sendRecordStatus);

          let dropOffStage: DomainTrafficSurgeFunnelDebugRow['dropOffStage'];
          if (ownedDomainCount === 0) {
            dropOffStage = 'ownership';
          } else if (namefiNameserverDomainCount === 0) {
            dropOffStage = 'nameservers';
          } else if (thresholdDomainCount === 0) {
            dropOffStage = 'threshold';
          } else if (alreadySentThisCycle) {
            dropOffStage = 'already_sent';
          } else {
            dropOffStage = 'eligible';
          }

          return {
            userId: user.userId,
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            createdAt: user.createdAt,
            ownedDomainCount,
            namefiNameserverDomainCount,
            thresholdDomainCount,
            thresholdTopDomain: topThresholdDomain?.domain ?? null,
            thresholdTopWeeklyQueries:
              topThresholdDomain?.weeklyQueries ?? null,
            alreadySentThisCycle,
            sendRecordStatus,
            dropOffStage,
          };
        },
      );

      const summary = {
        totalUsers: funnelRows.length,
        droppedAtOwnership: funnelRows.filter(
          (row) => row.dropOffStage === 'ownership',
        ).length,
        droppedAtNameservers: funnelRows.filter(
          (row) => row.dropOffStage === 'nameservers',
        ).length,
        droppedAtThreshold: funnelRows.filter(
          (row) => row.dropOffStage === 'threshold',
        ).length,
        droppedAtAlreadySent: funnelRows.filter(
          (row) => row.dropOffStage === 'already_sent',
        ).length,
        fullyEligible: funnelRows.filter(
          (row) => row.dropOffStage === 'eligible',
        ).length,
      };

      return {
        periodStart,
        trafficWeeklyThreshold,
        trafficWindowStartUtc: trafficDateRange.startDate,
        trafficWindowEndUtc: trafficDateRange.endDate,
        summary,
        users: funnelRows,
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
    .input(adminEmailCampaignsContract.sendNow.input)
    .output(adminEmailCampaignsContract.sendNow.output)
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
