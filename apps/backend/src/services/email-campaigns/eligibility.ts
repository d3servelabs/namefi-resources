import {
  cartItemsTable,
  emailCampaignSendsTable,
  ordersTable,
  usersTable,
} from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { and, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '@namefi-astra/db';
import { config } from '#lib/env';
import { EMAIL_CAMPAIGN_KEYS } from './constants';
import { toDate } from './utils';
import { getDomainTrafficCampaignCandidates } from './domain-traffic';

export async function getCartDomainsPopularEligibleUserIds({
  periodStart,
  userIdFilter,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
}): Promise<string[]> {
  const periodStartDate = toDate(periodStart);
  const cartItemMinAgeDays =
    config.EMAIL_CART_DOMAINS_POPULAR_ITEM_MIN_AGE_DAYS;
  const hasEmailCondition = sql<boolean>`NULLIF(TRIM(${privyUsersTableSchema.email}), '') IS NOT NULL`;
  const conditions = [
    eq(usersTable.subscribeToEmails, true),
    hasEmailCondition,
    lte(
      cartItemsTable.createdAt,
      sql`now() - (${cartItemMinAgeDays} * interval '1 day')`,
    ),
    isNull(emailCampaignSendsTable.id),
  ];

  if (userIdFilter && userIdFilter.length > 0) {
    conditions.push(inArray(cartItemsTable.userId, userIdFilter));
  }

  const rows = await db
    .select({ userId: cartItemsTable.userId })
    .from(cartItemsTable)
    .innerJoin(usersTable, eq(cartItemsTable.userId, usersTable.id))
    .leftJoin(
      privyUsersTableSchema,
      eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
    )
    .leftJoin(
      emailCampaignSendsTable,
      and(
        eq(emailCampaignSendsTable.userId, cartItemsTable.userId),
        eq(
          emailCampaignSendsTable.campaignKey,
          EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
        ),
        eq(emailCampaignSendsTable.periodStart, periodStartDate),
        inArray(emailCampaignSendsTable.status, ['SENT', 'PENDING']),
      ),
    )
    .where(and(...conditions))
    .groupBy(cartItemsTable.userId);

  return rows.map((row) => row.userId);
}

export async function getDreamDomainAwaitsEligibleUserIds({
  periodStart,
  userIdFilter,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
}): Promise<string[]> {
  const periodStartDate = toDate(periodStart);
  const orderLookbackDays =
    config.EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS;
  const hasEmailCondition = sql<boolean>`NULLIF(TRIM(${privyUsersTableSchema.email}), '') IS NOT NULL`;
  const conditions = [
    eq(usersTable.subscribeToEmails, true),
    hasEmailCondition,
    isNull(cartItemsTable.id),
    isNull(ordersTable.id),
    isNull(emailCampaignSendsTable.id),
  ];

  if (userIdFilter && userIdFilter.length > 0) {
    conditions.push(inArray(usersTable.id, userIdFilter));
  }

  const rows = await db
    .select({ userId: usersTable.id })
    .from(usersTable)
    .leftJoin(
      privyUsersTableSchema,
      eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
    )
    .leftJoin(cartItemsTable, eq(cartItemsTable.userId, usersTable.id))
    .leftJoin(
      ordersTable,
      and(
        eq(ordersTable.userId, usersTable.id),
        inArray(ordersTable.status, ['SUCCEEDED', 'PARTIALLY_COMPLETED']),
        gte(
          ordersTable.createdAt,
          sql`now() - (${orderLookbackDays} * interval '1 day')`,
        ),
      ),
    )
    .leftJoin(
      emailCampaignSendsTable,
      and(
        eq(emailCampaignSendsTable.userId, usersTable.id),
        eq(
          emailCampaignSendsTable.campaignKey,
          EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
        ),
        eq(emailCampaignSendsTable.periodStart, periodStartDate),
        inArray(emailCampaignSendsTable.status, ['SENT', 'PENDING']),
      ),
    )
    .where(and(...conditions))
    .groupBy(usersTable.id);

  return rows.map((row) => row.userId);
}

export async function getDomainTrafficSurgeEligibleUserIds({
  periodStart,
  userIdFilter,
  asOf,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
  asOf?: Date | string;
}): Promise<string[]> {
  const candidates = await getDomainTrafficCampaignCandidates({
    periodStart,
    userIdFilter,
    asOf,
  });
  return candidates.map((candidate) => candidate.userId);
}
