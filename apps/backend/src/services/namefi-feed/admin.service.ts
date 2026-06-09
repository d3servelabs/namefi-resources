import type { AdminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import {
  db,
  namefiFeedIngestionRunsTable,
  namefiFeedListingReportsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
  namefiFeedSettingsTable,
} from '@namefi-astra/db';
import { and, count, desc, eq, isNotNull, type SQL } from 'drizzle-orm';
import { getActiveNamefiFeedListingWhereClauses } from './listing-visibility';
import { DEFAULT_NAMEFI_FEED_SEARCH_QUERIES } from './normalization';
import { resolveNamefiFeedSource } from './sources';
import {
  listNamefiFeedSalesDigestTargets,
  listRecentNamefiFeedSalesDigestDeliveries,
} from './digest-targets.service';

type AdminNamefiFeedOutputs = InferContractOutputs<AdminNamefiFeedContract>;
export type AdminNamefiFeedSettings = AdminNamefiFeedOutputs['updateSettings'];
export type AdminNamefiFeedOverview = AdminNamefiFeedOutputs['getOverview'];

const SETTINGS_ID = 'default';

export async function getNamefiFeedSettingsRow() {
  await db
    .insert(namefiFeedSettingsTable)
    .values({
      id: SETTINGS_ID,
      searchQueries: DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
    })
    .onConflictDoNothing();

  const [settings] = await db
    .select()
    .from(namefiFeedSettingsTable)
    .where(eq(namefiFeedSettingsTable.id, SETTINGS_ID))
    .limit(1);

  if (!settings) {
    throw new Error('Namefi feed settings could not be initialized.');
  }

  return settings;
}

export async function getNamefiFeedAdminSettings(): Promise<AdminNamefiFeedSettings> {
  return toAdminSettings(await getNamefiFeedSettingsRow());
}

export async function updateNamefiFeedSettings(input: {
  autoScanEnabled?: boolean;
  searchQueries?: string[];
  maxQueries?: number;
  maxPagesPerQuery?: number;
  maxTweetsPerQuery?: number;
  maxTweetAgeMinutes?: number;
  overlapMinutes?: number;
}): Promise<AdminNamefiFeedSettings> {
  const currentSettings = await getNamefiFeedSettingsRow();
  const updateValues = {
    ...(typeof input.autoScanEnabled === 'boolean'
      ? { autoScanEnabled: input.autoScanEnabled }
      : {}),
    ...(input.searchQueries
      ? {
          searchQueries: input.searchQueries
            .map((query) => query.trim())
            .filter(Boolean),
        }
      : {}),
    ...(typeof input.maxQueries === 'number'
      ? { maxQueries: input.maxQueries }
      : {}),
    ...(typeof input.maxPagesPerQuery === 'number'
      ? { maxPagesPerQuery: input.maxPagesPerQuery }
      : {}),
    ...(typeof input.maxTweetsPerQuery === 'number'
      ? { maxTweetsPerQuery: input.maxTweetsPerQuery }
      : {}),
    ...(typeof input.maxTweetAgeMinutes === 'number'
      ? { maxTweetAgeMinutes: input.maxTweetAgeMinutes }
      : {}),
    ...(typeof input.overlapMinutes === 'number'
      ? { overlapMinutes: input.overlapMinutes }
      : {}),
  };

  if (Object.keys(updateValues).length === 0) {
    return toAdminSettings(currentSettings);
  }

  const [settings] = await db
    .update(namefiFeedSettingsTable)
    .set(updateValues)
    .where(eq(namefiFeedSettingsTable.id, SETTINGS_ID))
    .returning();

  if (!settings) {
    throw new Error('Namefi feed settings update failed.');
  }

  return toAdminSettings(settings);
}

export async function touchNamefiFeedLastRunAt(date = new Date()) {
  await db
    .update(namefiFeedSettingsTable)
    .set({ lastRunAt: date })
    .where(eq(namefiFeedSettingsTable.id, SETTINGS_ID));
}

export async function updateNamefiFeedLastAutoScanCursorAt(date: Date) {
  await db
    .update(namefiFeedSettingsTable)
    .set({ lastAutoScanCursorAt: date })
    .where(eq(namefiFeedSettingsTable.id, SETTINGS_ID));
}

export async function getNamefiFeedAdminOverview(
  xBearerTokenConfigured: boolean,
  digestPublisherConfigured: {
    slack: boolean;
    telegram: boolean;
    discord: boolean;
  },
): Promise<AdminNamefiFeedOverview> {
  const settings = await getNamefiFeedSettingsRow();
  const [
    totalPosts,
    pendingPosts,
    failedPosts,
    activeListings,
    suppressedListings,
    activeReports,
    runningRuns,
    recentRuns,
    recentPosts,
    recentListings,
    recentReports,
    digestTargets,
    recentDigestDeliveries,
  ] = await Promise.all([
    countNamefiFeedPosts(),
    countNamefiFeedPosts(eq(namefiFeedPostsTable.status, 'pending')),
    countNamefiFeedPosts(eq(namefiFeedPostsTable.status, 'failed')),
    countNamefiFeedListings(and(...getActiveNamefiFeedListingWhereClauses())),
    countNamefiFeedListings(isNotNull(namefiFeedListingsTable.suppressedAt)),
    countActiveNamefiFeedListingReports(),
    countNamefiFeedRuns(eq(namefiFeedIngestionRunsTable.status, 'running')),
    listRecentRuns(),
    listRecentPosts(),
    listRecentListings(),
    listRecentReports(),
    listNamefiFeedSalesDigestTargets(),
    listRecentNamefiFeedSalesDigestDeliveries(),
  ]);

  return {
    settings: toAdminSettings(settings),
    xBearerTokenConfigured,
    digestPublisherConfigured,
    stats: {
      totalPosts,
      pendingPosts,
      failedPosts,
      activeListings,
      suppressedListings,
      activeReports,
      runningRuns,
      digestTargets: digestTargets.length,
      enabledDigestTargets: digestTargets.filter((target) => target.enabled)
        .length,
    },
    recentRuns,
    recentPosts,
    recentListings,
    recentReports,
    digestTargets,
    recentDigestDeliveries,
  };
}

async function countNamefiFeedPosts(where?: ReturnType<typeof eq>) {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedPostsTable)
    .where(where);
  return Number(row?.value ?? 0);
}

async function countNamefiFeedListings(where?: SQL) {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedListingsTable)
    .where(where);
  return Number(row?.value ?? 0);
}

async function countActiveNamefiFeedListingReports() {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedListingReportsTable)
    .innerJoin(
      namefiFeedListingsTable,
      eq(namefiFeedListingsTable.id, namefiFeedListingReportsTable.listingId),
    )
    .where(
      and(
        eq(namefiFeedListingReportsTable.status, 'active'),
        ...getActiveNamefiFeedListingWhereClauses(),
      ),
    );

  return Number(row?.value ?? 0);
}

async function countNamefiFeedRuns(where?: ReturnType<typeof eq>) {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedIngestionRunsTable)
    .where(where);
  return Number(row?.value ?? 0);
}

async function listRecentRuns(): Promise<
  AdminNamefiFeedOverview['recentRuns']
> {
  const rows = await db
    .select()
    .from(namefiFeedIngestionRunsTable)
    .orderBy(desc(namefiFeedIngestionRunsTable.startedAt))
    .limit(10);

  return rows.map((row) => ({
    id: row.id,
    workflowId: row.workflowId,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    scannedPostCount: row.scannedPostCount,
    queuedPostCount: row.queuedPostCount,
    processedPostCount: row.processedPostCount,
    listingUpsertedCount: row.listingUpsertedCount,
    skippedPostCount: row.skippedPostCount,
    failedPostCount: row.failedPostCount,
    errorMessage: row.errorMessage,
  }));
}

async function listRecentPosts(): Promise<
  AdminNamefiFeedOverview['recentPosts']
> {
  const rows = await db
    .select()
    .from(namefiFeedPostsTable)
    .orderBy(desc(namefiFeedPostsTable.createdAt))
    .limit(15);

  return rows.map((row) => ({
    id: row.id,
    externalPostId: row.externalPostId,
    authorUsername: row.authorUsername,
    authorDisplayName: row.authorDisplayName,
    status: row.status,
    source: row.source,
    postedAt: row.postedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    failureReason: row.failureReason,
    skipReason: row.skipReason,
    sourceUrl: resolveAdminPostSourceUrl(row),
  }));
}

function resolveAdminPostSourceUrl(
  row: Pick<
    typeof namefiFeedPostsTable.$inferSelect,
    'externalSource' | 'externalPostId' | 'rawPayload'
  >,
) {
  return resolveNamefiFeedSource({
    externalSource: row.externalSource,
    externalPostId: row.externalPostId,
    sourceUrl: extractRawPayloadListingUrl(row.rawPayload),
  }).url;
}

function extractRawPayloadListingUrl(rawPayload: unknown) {
  if (
    !rawPayload ||
    typeof rawPayload !== 'object' ||
    Array.isArray(rawPayload)
  ) {
    return null;
  }

  const payload = rawPayload as {
    listingUrl?: unknown;
    sourceUrl?: unknown;
    link?: unknown;
  };
  const listingUrl = payload.listingUrl ?? payload.sourceUrl ?? payload.link;
  return typeof listingUrl === 'string' ? listingUrl : null;
}

async function listRecentListings(): Promise<
  AdminNamefiFeedOverview['recentListings']
> {
  const rows = await db
    .select()
    .from(namefiFeedListingsTable)
    .orderBy(desc(namefiFeedListingsTable.postedAt))
    .limit(15);

  return rows.map((row) => ({
    id: row.id,
    domain: row.domain,
    askingPrice: row.askingPrice,
    askingCurrency: row.askingCurrency,
    purchaseUrl: row.purchaseUrl,
    sellerUsername: row.sellerUsername,
    sellerDisplayName: row.sellerDisplayName,
    sourceUrl: row.sourceUrl,
    postedAt: row.postedAt.toISOString(),
    listedAt: row.listedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    endReason: row.endReason,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    suppressed: Boolean(row.suppressedAt),
  }));
}

async function listRecentReports(): Promise<
  AdminNamefiFeedOverview['recentReports']
> {
  const rows = await db
    .select({
      id: namefiFeedListingReportsTable.id,
      listingId: namefiFeedListingReportsTable.listingId,
      reason: namefiFeedListingReportsTable.reason,
      details: namefiFeedListingReportsTable.details,
      status: namefiFeedListingReportsTable.status,
      createdAt: namefiFeedListingReportsTable.createdAt,
      domain: namefiFeedListingsTable.domain,
      sourceUrl: namefiFeedListingsTable.sourceUrl,
    })
    .from(namefiFeedListingReportsTable)
    .innerJoin(
      namefiFeedListingsTable,
      eq(namefiFeedListingsTable.id, namefiFeedListingReportsTable.listingId),
    )
    .where(
      and(
        eq(namefiFeedListingReportsTable.status, 'active'),
        ...getActiveNamefiFeedListingWhereClauses(),
      ),
    )
    .orderBy(desc(namefiFeedListingReportsTable.createdAt))
    .limit(15);

  return rows.map((row) => ({
    id: row.id,
    listingId: row.listingId,
    domain: row.domain,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    sourceUrl: row.sourceUrl,
  }));
}

function toAdminSettings(
  settings: typeof namefiFeedSettingsTable.$inferSelect,
): AdminNamefiFeedSettings {
  return {
    autoScanEnabled: settings.autoScanEnabled,
    searchQueries:
      settings.searchQueries.length > 0
        ? settings.searchQueries
        : DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
    maxQueries: settings.maxQueries,
    maxPagesPerQuery: settings.maxPagesPerQuery,
    maxTweetsPerQuery: settings.maxTweetsPerQuery,
    maxTweetAgeMinutes: settings.maxTweetAgeMinutes,
    overlapMinutes: settings.overlapMinutes,
    lastAutoScanCursorAt: settings.lastAutoScanCursorAt?.toISOString() ?? null,
    lastRunAt: settings.lastRunAt?.toISOString() ?? null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
