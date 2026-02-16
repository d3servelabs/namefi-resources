import { Context } from '@temporalio/activity';
import { render } from '@react-email/render';
import React from 'react';
import {
  cartItemsTable,
  emailCampaignSendMetadataSchema,
  emailCampaignSendsTable,
  ordersTable,
  usersTable,
  type EmailCampaignSendMetadata,
} from '@namefi-astra/db';
import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '@namefi-astra/db';
import { sendMail } from '../../../mail/mail-client';
import { CartDomainsPopular } from '../../../mail/templates/cart-domains-popular';
import { DreamDomainAwaits } from '../../../mail/templates/dream-domain-awaits';
import { DomainTrafficSurge } from '../../../mail/templates/domain-traffic-surge';
import {
  CART_DOMAINS_POPULAR_VARIANT_COUNT,
  getCartDomainsPopularVariant,
} from '../../../mail/campaigns/cart-domains-popular-variants';
import {
  DREAM_DOMAIN_AWAITS_VARIANT_COUNT,
  getDreamDomainAwaitsVariant,
} from '../../../mail/campaigns/dream-domain-awaits-variants';
import {
  DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT,
  getDomainTrafficSurgeVariant,
} from '../../../mail/campaigns/domain-traffic-surge-variants';
import { maybeGetUserEmail } from '../notify.activities';
import {
  getCartDomainsPopularEligibleUserIds as getCartDomainsPopularEligibleUserIdsQuery,
  getDreamDomainAwaitsEligibleUserIds as getDreamDomainAwaitsEligibleUserIdsQuery,
} from '../../../services/email-campaigns/eligibility';
import {
  type DomainTrafficCandidate,
  getDomainTrafficCampaignCandidates,
} from '../../../services/email-campaigns/domain-traffic';
import { getDreamDomainAwaitsSuggestions } from '../../../lib/email-campaigns/dream-domain-suggestions';
import { toDate } from '../../../services/email-campaigns/utils';
import { config } from '#lib/env';

const CART_DOMAINS_POPULAR_CAMPAIGN_KEY = 'cart-domains-popular';
const DREAM_DOMAIN_AWAITS_CAMPAIGN_KEY = 'dream-domain-awaits';
const DOMAIN_TRAFFIC_SURGE_CAMPAIGN_KEY = 'domain-traffic-surge';

const ARCHIVE_BCC = ['customer-email-archive@d3serve.xyz'];

export type EmailCampaignSendResult = {
  status: 'SENT' | 'SKIPPED' | 'FAILED' | 'DRY_RUN';
  reason?: string;
};

function parseMetadata(metadata: unknown): EmailCampaignSendMetadata {
  const parsed = emailCampaignSendMetadataSchema.safeParse(metadata ?? {});
  if (!parsed.success) return {};
  return parsed.data;
}

function getVariantIndexFromMetadata(
  metadata: unknown,
  totalVariants: number,
): number | null {
  const parsed = parseMetadata(metadata);
  const value = parsed.variantIndex;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = ((value % totalVariants) + totalVariants) % totalVariants;
  return normalized;
}

async function getNextVariantIndex({
  userId,
  campaignKey,
  totalVariants,
}: {
  userId: string;
  campaignKey: string;
  totalVariants: number;
}): Promise<number> {
  const lastSend = await db.query.emailCampaignSendsTable.findFirst({
    where: and(
      eq(emailCampaignSendsTable.userId, userId),
      eq(emailCampaignSendsTable.campaignKey, campaignKey),
      eq(emailCampaignSendsTable.status, 'SENT'),
    ),
    orderBy: (table) => [desc(table.sentAt), desc(table.createdAt)],
  });

  const lastVariant = getVariantIndexFromMetadata(
    lastSend?.metadata,
    totalVariants,
  );
  if (typeof lastVariant !== 'number') return 0;
  return (lastVariant + 1) % totalVariants;
}

async function ensureCampaignSendRecord({
  userId,
  campaignKey,
  periodStart,
  metadata,
  totalVariants,
}: {
  userId: string;
  campaignKey: string;
  periodStart: Date;
  metadata: EmailCampaignSendMetadata;
  totalVariants: number;
}): Promise<{
  status: 'READY' | 'SKIP';
  recordId?: string;
  variantIndex?: number;
  reason?: string;
}> {
  const existing = await db.query.emailCampaignSendsTable.findFirst({
    where: and(
      eq(emailCampaignSendsTable.userId, userId),
      eq(emailCampaignSendsTable.campaignKey, campaignKey),
      eq(emailCampaignSendsTable.periodStart, periodStart),
    ),
  });

  if (existing) {
    if (existing.status === 'SENT') {
      return { status: 'SKIP', reason: 'already_sent' };
    }
    if (existing.status === 'PENDING') {
      return { status: 'SKIP', reason: 'already_pending' };
    }
    if (existing.status === 'FAILED') {
      const existingVariant =
        getVariantIndexFromMetadata(existing.metadata, totalVariants) ?? 0;
      const existingMetadata = parseMetadata(existing.metadata);
      await db
        .update(emailCampaignSendsTable)
        .set({
          status: 'PENDING',
          attemptCount: (existing.attemptCount ?? 0) + 1,
          lastError: null,
          metadata: {
            ...existingMetadata,
            ...metadata,
            variantIndex: existingVariant,
          },
          updatedAt: new Date(),
        })
        .where(eq(emailCampaignSendsTable.id, existing.id));
      return {
        status: 'READY',
        recordId: existing.id,
        variantIndex: existingVariant,
      };
    }
  }

  const nextVariantIndex = await getNextVariantIndex({
    userId,
    campaignKey,
    totalVariants,
  });

  const inserted = await db
    .insert(emailCampaignSendsTable)
    .values({
      userId,
      campaignKey,
      periodStart,
      status: 'PENDING',
      attemptCount: 1,
      metadata: {
        ...metadata,
        variantIndex: nextVariantIndex,
      },
    })
    .onConflictDoNothing()
    .returning({ id: emailCampaignSendsTable.id });

  if (inserted.length === 0) {
    return { status: 'SKIP', reason: 'already_sent' };
  }

  return {
    status: 'READY',
    recordId: inserted[0].id,
    variantIndex: nextVariantIndex,
  };
}

async function markCampaignSendFailed(recordId: string, error: string) {
  await db
    .update(emailCampaignSendsTable)
    .set({
      status: 'FAILED',
      lastError: error,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaignSendsTable.id, recordId));
}

async function markCampaignSendSent(recordId: string) {
  await db
    .update(emailCampaignSendsTable)
    .set({
      status: 'SENT',
      sentAt: new Date(),
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaignSendsTable.id, recordId));
}

async function isUserSubscribedToEmails(userId: string): Promise<boolean> {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      subscribeToEmails: true,
    },
  });

  return Boolean(user?.subscribeToEmails);
}

async function sendCampaignEmail({
  userId,
  periodStart,
  campaignKey,
  metadata,
  totalVariants,
  getVariant,
  buildEmailContent,
  errorLogMessage,
}: {
  userId: string;
  periodStart: Date;
  campaignKey: string;
  metadata: EmailCampaignSendMetadata;
  totalVariants: number;
  getVariant: (variantIndex: number) => { variant: { subject: string } };
  buildEmailContent: (args: {
    variantIndex: number;
    recipientName: string;
    recipientEmail: string;
  }) => React.ReactElement | Promise<React.ReactElement>;
  errorLogMessage: string;
}): Promise<EmailCampaignSendResult> {
  const ctx = Context.current();

  const record = await ensureCampaignSendRecord({
    userId,
    campaignKey,
    periodStart,
    metadata,
    totalVariants,
  });

  if (record.status === 'SKIP') {
    return { status: 'SKIPPED', reason: record.reason };
  }

  if (!record.recordId) {
    return { status: 'FAILED', reason: 'missing_record' };
  }

  const recordId = record.recordId;
  const variantIndex = record.variantIndex ?? 0;
  const { variant: copyVariant } = getVariant(variantIndex);
  const userEmail = await maybeGetUserEmail(userId);

  if (!userEmail) {
    await markCampaignSendFailed(recordId, 'missing_email');
    return { status: 'FAILED', reason: 'missing_email' };
  }

  const fallbackRecipientName = userEmail.split('@')[0] || 'there';

  try {
    const emailContent = await buildEmailContent({
      variantIndex,
      recipientName: fallbackRecipientName,
      recipientEmail: userEmail,
    });

    const html = await render(emailContent, { pretty: false });
    const plain = await render(emailContent, { plainText: true });

    await sendMail({
      to: [userEmail],
      bcc: ARCHIVE_BCC,
      subject: copyVariant.subject,
      content: { html, plain },
    });

    await markCampaignSendSent(recordId);
    return { status: 'SENT' };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    ctx.log.error(errorLogMessage, {
      userId,
      error: errorMessage,
    });
    await markCampaignSendFailed(recordId, errorMessage);
    throw error;
  }
}

export async function getCartDomainsPopularEligibleUserIds({
  periodStart,
  userIdFilter,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
}): Promise<string[]> {
  return getCartDomainsPopularEligibleUserIdsQuery({
    periodStart,
    userIdFilter,
  });
}

export async function getDreamDomainAwaitsEligibleUserIds({
  periodStart,
  userIdFilter,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
}): Promise<string[]> {
  return getDreamDomainAwaitsEligibleUserIdsQuery({
    periodStart,
    userIdFilter,
  });
}

export async function getDomainTrafficSurgeCandidates({
  periodStart,
  userIdFilter,
  asOf,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
  asOf?: Date | string;
}): Promise<DomainTrafficCandidate[]> {
  return getDomainTrafficCampaignCandidates({
    periodStart,
    userIdFilter,
    asOf,
  });
}

export async function sendCartDomainsPopularEmail({
  userId,
  periodStart,
  dryRun = false,
}: {
  userId: string;
  periodStart: Date | string;
  dryRun?: boolean;
}): Promise<EmailCampaignSendResult> {
  const periodStartDate = toDate(periodStart);

  if (!(await isUserSubscribedToEmails(userId))) {
    return { status: 'SKIPPED', reason: 'opted_out' };
  }

  const cartItems = await db
    .select({
      domainNameLdh: cartItemsTable.normalizedDomainName,
      addedAt: cartItemsTable.createdAt,
      priceInUsdCents: cartItemsTable.amountInUSDCents,
    })
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.userId, userId),
        lte(cartItemsTable.createdAt, sql`now() - interval '1 day'`),
      ),
    )
    .orderBy(cartItemsTable.createdAt);

  if (cartItems.length === 0) {
    return { status: 'SKIPPED', reason: 'no_cart_items' };
  }

  if (dryRun) {
    return { status: 'DRY_RUN' };
  }

  const totalInUsdCents = cartItems.reduce(
    (sum, item) => sum + (item.priceInUsdCents ?? 0),
    0,
  );

  return sendCampaignEmail({
    userId,
    periodStart: periodStartDate,
    campaignKey: CART_DOMAINS_POPULAR_CAMPAIGN_KEY,
    metadata: {
      cartItemCount: cartItems.length,
      cartItemTotalUsdCents: totalInUsdCents,
      cartItemDomains: cartItems.map((item) => item.domainNameLdh),
    },
    totalVariants: CART_DOMAINS_POPULAR_VARIANT_COUNT,
    getVariant: getCartDomainsPopularVariant,
    buildEmailContent: ({ recipientName, recipientEmail, variantIndex }) =>
      React.createElement(CartDomainsPopular, {
        recipientName,
        recipientEmail,
        cartItems: cartItems.map((item) => ({
          domainNameLdh: item.domainNameLdh,
          addedAt: item.addedAt,
          priceInUsdCents: item.priceInUsdCents ?? undefined,
        })),
        variant: variantIndex,
      }),
    errorLogMessage: 'Failed to send cart domains popular email',
  });
}

export async function sendDreamDomainAwaitsEmail({
  userId,
  periodStart,
  dryRun = false,
}: {
  userId: string;
  periodStart: Date | string;
  dryRun?: boolean;
}): Promise<EmailCampaignSendResult> {
  const periodStartDate = toDate(periodStart);
  const orderLookbackDays =
    config.EMAIL_DREAM_DOMAIN_AWAITS_ORDER_LOOKBACK_DAYS;

  if (!(await isUserSubscribedToEmails(userId))) {
    return { status: 'SKIPPED', reason: 'opted_out' };
  }

  const cartItem = await db.query.cartItemsTable.findFirst({
    where: eq(cartItemsTable.userId, userId),
    columns: { id: true },
  });

  if (cartItem) {
    return { status: 'SKIPPED', reason: 'has_cart_items' };
  }

  const recentOrder = await db.query.ordersTable.findFirst({
    where: and(
      eq(ordersTable.userId, userId),
      inArray(ordersTable.status, ['SUCCEEDED', 'PARTIALLY_COMPLETED']),
      gte(
        ordersTable.createdAt,
        sql`now() - (${orderLookbackDays} * interval '1 day')`,
      ),
    ),
    columns: { id: true },
  });

  if (recentOrder) {
    return { status: 'SKIPPED', reason: 'recent_purchase' };
  }

  if (dryRun) {
    return { status: 'DRY_RUN' };
  }

  return sendCampaignEmail({
    userId,
    periodStart: periodStartDate,
    campaignKey: DREAM_DOMAIN_AWAITS_CAMPAIGN_KEY,
    metadata: {},
    totalVariants: DREAM_DOMAIN_AWAITS_VARIANT_COUNT,
    getVariant: getDreamDomainAwaitsVariant,
    buildEmailContent: async ({
      recipientName,
      recipientEmail,
      variantIndex,
    }) => {
      const suggestedDomains = await getDreamDomainAwaitsSuggestions(userId);
      return React.createElement(DreamDomainAwaits, {
        recipientName,
        recipientEmail,
        variant: variantIndex,
        suggestedDomains:
          suggestedDomains.length > 0 ? suggestedDomains : undefined,
      });
    },
    errorLogMessage: 'Failed to send dream domain awaits email',
  });
}

export async function sendDomainTrafficSurgeEmail({
  userId,
  periodStart,
  domains,
  dryRun = false,
}: {
  userId: string;
  periodStart: Date | string;
  domains: DomainTrafficCandidate['domains'];
  dryRun?: boolean;
}): Promise<EmailCampaignSendResult> {
  const periodStartDate = toDate(periodStart);

  if (!(await isUserSubscribedToEmails(userId))) {
    return { status: 'SKIPPED', reason: 'opted_out' };
  }

  const limitedDomains = domains.slice(0, 5);

  if (!limitedDomains || limitedDomains.length === 0) {
    return { status: 'SKIPPED', reason: 'no_high_traffic_domains' };
  }

  if (dryRun) {
    return { status: 'DRY_RUN' };
  }

  return sendCampaignEmail({
    userId,
    periodStart: periodStartDate,
    campaignKey: DOMAIN_TRAFFIC_SURGE_CAMPAIGN_KEY,
    metadata: {},
    totalVariants: DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT,
    getVariant: getDomainTrafficSurgeVariant,
    buildEmailContent: ({ recipientName, recipientEmail, variantIndex }) =>
      React.createElement(DomainTrafficSurge, {
        recipientName,
        recipientEmail,
        variant: variantIndex,
        domains: limitedDomains,
        baselineThreshold: config.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD,
      }),
    errorLogMessage: 'Failed to send domain traffic surge email',
  });
}
