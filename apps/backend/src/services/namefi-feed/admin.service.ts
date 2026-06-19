import type { AdminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import {
  db,
  namefiFeedIngestionRunsTable,
  namefiFeedListingReportsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
  namefiFeedSettingsTable,
  salesDigestTargetDeliveriesTable,
  salesDigestTargetsTable,
} from '@namefi-astra/db';
import type {
  WorkflowExecutionInfo,
  WorkflowExecutionStatusName,
} from '@temporalio/client';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { getTemporalWorkflowUrl } from '#temporal/activities/default/get-workflow-url';
import { temporalClient } from '#temporal/client';
import { getActiveNamefiFeedListingWhereClauses } from './listing-visibility';
import { DEFAULT_NAMEFI_FEED_SEARCH_QUERIES } from './normalization';
import {
  buildNamefiFeedAdminSources,
  DEFAULT_NAMEFI_FEED_ENABLED_SOURCES,
  normalizeNamefiFeedEnabledSources,
  readNamefiFeedEnabledSourcesFromMetadata,
  resolveNamefiFeedSource,
  type NamefiFeedAutoScanSource,
} from './sources';
import {
  listNamefiFeedSalesDigestTargets,
  listRecentNamefiFeedSalesDigestDeliveries,
} from './digest-targets.service';
import {
  getRollingNamefiFeedSalesDigestBounds,
  resolveNamefiFeedSalesDigestRunAt,
  type NamefiFeedSalesDigestBounds,
  type RunNamefiFeedSalesDigestResult,
} from './digest.service';

type AdminNamefiFeedOutputs = InferContractOutputs<AdminNamefiFeedContract>;
export type AdminNamefiFeedSettings = AdminNamefiFeedOutputs['updateSettings'];
export type AdminNamefiFeedOverview = AdminNamefiFeedOutputs['getOverview'];
type AdminNamefiFeedTableInput = {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sorting?: Array<{ id: string; desc: boolean }>;
  columnFilters?: Array<{ id: string; value: unknown }>;
};

const SETTINGS_ID = 'default';
export const DEFAULT_NAMEFI_FEED_MAX_POSTS_PROCESSED_PER_RUN = 500;
const DAILY_SOURCE_LOOKBACK_MINUTES = 24 * 60;
const RUN_ENQUEUE_SOURCE_RESULTS_SQL = sql`coalesce(${namefiFeedIngestionRunsTable.metadata} #> '{enqueueResult,sourceResults}', '[]'::jsonb)`;
const RUN_ENQUEUE_SKIPPED_POST_COUNT_SQL = sql<number>`coalesce(
  nullif(${namefiFeedIngestionRunsTable.metadata} #>> '{enqueueResult,skippedPostCount}', '')::int,
  (
    select coalesce(
      sum(coalesce(nullif(source_result.value #>> '{skippedPostCount}', '')::int, 0)),
      0
    )
    from jsonb_array_elements(${RUN_ENQUEUE_SOURCE_RESULTS_SQL}) as source_result(value)
  )
)`;
const RUN_ENQUEUE_ALREADY_EXISTING_POST_COUNT_SQL = sql<number>`coalesce(
  nullif(${namefiFeedIngestionRunsTable.metadata} #>> '{enqueueResult,alreadyExistingCount}', '')::int,
  (
    select coalesce(
      sum(coalesce(nullif(source_result.value #>> '{alreadyExistingCount}', '')::int, 0)),
      0
    )
    from jsonb_array_elements(${RUN_ENQUEUE_SOURCE_RESULTS_SQL}) as source_result(value)
  )
)`;
const RUN_AI_ANALYSIS_ATTEMPTED_POST_COUNT_SQL = sql<number>`${namefiFeedIngestionRunsTable.processedPostCount} + ${namefiFeedIngestionRunsTable.skippedPostCount} + ${namefiFeedIngestionRunsTable.failedPostCount}`;
type AdminNamefiFeedSourceSettings = AdminNamefiFeedSettings['sourceSettings'];
type AdminNamefiFeedSourceSettingsInput = Partial<{
  x: Partial<AdminNamefiFeedSourceSettings['x']>;
  namepros: Partial<AdminNamefiFeedSourceSettings['namepros']>;
  dnforum: Partial<AdminNamefiFeedSourceSettings['dnforum']>;
}>;

export async function getNamefiFeedSettingsRow() {
  await db
    .insert(namefiFeedSettingsTable)
    .values({
      id: SETTINGS_ID,
      searchQueries: DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
      metadata: { enabledSources: DEFAULT_NAMEFI_FEED_ENABLED_SOURCES },
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
  enabledSources?: NamefiFeedAutoScanSource[];
  searchQueries?: string[];
  maxQueries?: number;
  maxPagesPerQuery?: number;
  maxTweetsPerQuery?: number;
  maxTweetAgeMinutes?: number;
  maxPostsProcessedPerRun?: number;
  overlapMinutes?: number;
  sourceSettings?: AdminNamefiFeedSourceSettingsInput;
}): Promise<AdminNamefiFeedSettings> {
  const currentSettings = await getNamefiFeedSettingsRow();
  const sourceSettingsMetadata = mergeNamefiFeedSourceSettingsMetadata(
    currentSettings.metadata,
    input.sourceSettings,
  );
  const nextMetadata = {
    ...currentSettings.metadata,
    ...(Array.isArray(input.enabledSources)
      ? {
          enabledSources: normalizeNamefiFeedEnabledSources(
            input.enabledSources,
          ),
        }
      : {}),
    ...(typeof input.maxPostsProcessedPerRun === 'number'
      ? { maxPostsProcessedPerRun: input.maxPostsProcessedPerRun }
      : {}),
    ...(sourceSettingsMetadata
      ? { sourceSettings: sourceSettingsMetadata }
      : {}),
  };
  const xSourceSettings = input.sourceSettings?.x;
  const updateValues = {
    ...(typeof input.autoScanEnabled === 'boolean'
      ? { autoScanEnabled: input.autoScanEnabled }
      : {}),
    ...(Array.isArray(input.enabledSources) ||
    typeof input.maxPostsProcessedPerRun === 'number' ||
    sourceSettingsMetadata
      ? { metadata: nextMetadata }
      : {}),
    ...(input.searchQueries
      ? {
          searchQueries: input.searchQueries
            .map((query) => query.trim())
            .filter(Boolean),
        }
      : {}),
    ...(typeof input.maxQueries === 'number' ||
    typeof xSourceSettings?.maxQueries === 'number'
      ? { maxQueries: input.maxQueries ?? xSourceSettings?.maxQueries }
      : {}),
    ...(typeof input.maxPagesPerQuery === 'number' ||
    typeof xSourceSettings?.maxPagesPerQuery === 'number'
      ? {
          maxPagesPerQuery:
            input.maxPagesPerQuery ?? xSourceSettings?.maxPagesPerQuery,
        }
      : {}),
    ...(typeof input.maxTweetsPerQuery === 'number' ||
    typeof xSourceSettings?.maxTweetsPerQuery === 'number'
      ? {
          maxTweetsPerQuery:
            input.maxTweetsPerQuery ?? xSourceSettings?.maxTweetsPerQuery,
        }
      : {}),
    ...(typeof input.maxTweetAgeMinutes === 'number' ||
    typeof xSourceSettings?.maxTweetAgeMinutes === 'number'
      ? {
          maxTweetAgeMinutes:
            input.maxTweetAgeMinutes ?? xSourceSettings?.maxTweetAgeMinutes,
        }
      : {}),
    ...(typeof input.overlapMinutes === 'number' ||
    typeof xSourceSettings?.overlapMinutes === 'number'
      ? {
          overlapMinutes:
            input.overlapMinutes ?? xSourceSettings?.overlapMinutes,
        }
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
    recentDigestRuns,
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
    listRecentDigestRuns(),
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
    recentDigestRuns,
    recentDigestDeliveries,
  };
}

export async function listNamefiFeedAdminRuns(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listRuns']> {
  const where = combineWhereClauses(
    buildRunsSearchWhere(input.searchTerm),
    buildColumnFiltersWhere(input.columnFilters, {
      status: { column: namefiFeedIngestionRunsTable.status, type: 'select' },
      trigger: { column: namefiFeedIngestionRunsTable.trigger, type: 'select' },
      startedAt: {
        column: namefiFeedIngestionRunsTable.startedAt,
        type: 'date',
      },
      finishedAt: {
        column: namefiFeedIngestionRunsTable.finishedAt,
        type: 'date',
      },
      scannedPostCount: {
        column: namefiFeedIngestionRunsTable.scannedPostCount,
        type: 'number',
      },
      queuedPostCount: {
        column: namefiFeedIngestionRunsTable.queuedPostCount,
        type: 'number',
      },
      processedPostCount: {
        column: namefiFeedIngestionRunsTable.processedPostCount,
        type: 'number',
      },
      listingUpsertedCount: {
        column: namefiFeedIngestionRunsTable.listingUpsertedCount,
        type: 'number',
      },
      skippedPostCount: {
        column: namefiFeedIngestionRunsTable.skippedPostCount,
        type: 'number',
      },
      failedPostCount: {
        column: namefiFeedIngestionRunsTable.failedPostCount,
        type: 'number',
      },
      errorMessage: {
        column: namefiFeedIngestionRunsTable.errorMessage,
        type: 'text',
      },
    }),
  );
  const orderBy = resolveTableSorting(
    input.sorting,
    {
      workflow: namefiFeedIngestionRunsTable.workflowId,
      status: namefiFeedIngestionRunsTable.status,
      trigger: namefiFeedIngestionRunsTable.trigger,
      startedAt: namefiFeedIngestionRunsTable.startedAt,
      finishedAt: namefiFeedIngestionRunsTable.finishedAt,
      scannedPostCount: namefiFeedIngestionRunsTable.scannedPostCount,
      queuedPostCount: namefiFeedIngestionRunsTable.queuedPostCount,
      alreadyExistingPostCount: RUN_ENQUEUE_ALREADY_EXISTING_POST_COUNT_SQL,
      scanSkippedPostCount: RUN_ENQUEUE_SKIPPED_POST_COUNT_SQL,
      aiAnalysisAttemptedPostCount: RUN_AI_ANALYSIS_ATTEMPTED_POST_COUNT_SQL,
      processedPostCount: namefiFeedIngestionRunsTable.processedPostCount,
      listingUpsertedCount: namefiFeedIngestionRunsTable.listingUpsertedCount,
      skippedPostCount: namefiFeedIngestionRunsTable.skippedPostCount,
      failedPostCount: namefiFeedIngestionRunsTable.failedPostCount,
      errorMessage: namefiFeedIngestionRunsTable.errorMessage,
    },
    [desc(namefiFeedIngestionRunsTable.startedAt)],
  );
  const [total, rows] = await Promise.all([
    countRows(namefiFeedIngestionRunsTable, where),
    db
      .select()
      .from(namefiFeedIngestionRunsTable)
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(getOffset(input)),
  ]);

  return paginatedTableResult({
    input,
    rows: rows.map(serializeRunRow),
    totalCount: total,
  });
}

export async function listNamefiFeedAdminPosts(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listPosts']> {
  const where = combineWhereClauses(
    buildPostsSearchWhere(input.searchTerm),
    buildColumnFiltersWhere(input.columnFilters, {
      status: { column: namefiFeedPostsTable.status, type: 'select' },
      source: { column: namefiFeedPostsTable.source, type: 'select' },
      authorUsername: {
        column: namefiFeedPostsTable.authorUsername,
        type: 'text',
      },
      postedAt: { column: namefiFeedPostsTable.postedAt, type: 'date' },
      createdAt: { column: namefiFeedPostsTable.createdAt, type: 'date' },
      processedAt: { column: namefiFeedPostsTable.processedAt, type: 'date' },
      reason: {
        column: sql`coalesce(${namefiFeedPostsTable.failureReason}, ${namefiFeedPostsTable.skipReason})`,
        type: 'text',
      },
    }),
  );
  const orderBy = resolveTableSorting(
    input.sorting,
    {
      workflow: namefiFeedIngestionRunsTable.workflowId,
      status: namefiFeedPostsTable.status,
      source: namefiFeedPostsTable.source,
      authorUsername: namefiFeedPostsTable.authorUsername,
      postedAt: namefiFeedPostsTable.postedAt,
      createdAt: namefiFeedPostsTable.createdAt,
      processedAt: namefiFeedPostsTable.processedAt,
      reason: namefiFeedPostsTable.failureReason,
    },
    [desc(namefiFeedPostsTable.createdAt)],
  );
  const [total, rows] = await Promise.all([
    countNamefiFeedPostRows(where),
    db
      .select({
        ...getTableColumns(namefiFeedPostsTable),
        ingestionRunMetadata: namefiFeedIngestionRunsTable.metadata,
        ingestionWorkflowId: namefiFeedIngestionRunsTable.workflowId,
      })
      .from(namefiFeedPostsTable)
      .leftJoin(
        namefiFeedIngestionRunsTable,
        eq(
          namefiFeedIngestionRunsTable.id,
          namefiFeedPostsTable.ingestionRunId,
        ),
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(getOffset(input)),
  ]);

  return paginatedTableResult({
    input,
    rows: rows.map(serializePostRow),
    totalCount: total,
  });
}

export async function listNamefiFeedAdminListings(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listListings']> {
  const where = combineWhereClauses(
    buildListingsSearchWhere(input.searchTerm),
    buildColumnFiltersWhere(input.columnFilters, {
      domain: { column: namefiFeedListingsTable.domain, type: 'text' },
      sellerUsername: {
        column: namefiFeedListingsTable.sellerUsername,
        type: 'text',
      },
      postedAt: { column: namefiFeedListingsTable.postedAt, type: 'date' },
      listedAt: { column: namefiFeedListingsTable.listedAt, type: 'date' },
      expiresAt: { column: namefiFeedListingsTable.expiresAt, type: 'date' },
      endReason: { column: namefiFeedListingsTable.endReason, type: 'select' },
      asking: {
        column: sql`concat_ws(' ', ${namefiFeedListingsTable.askingPrice}, ${namefiFeedListingsTable.askingCurrency})`,
        type: 'text',
      },
    }),
  );
  const orderBy = resolveTableSorting(
    input.sorting,
    {
      domain: namefiFeedListingsTable.domain,
      sellerUsername: namefiFeedListingsTable.sellerUsername,
      postedAt: namefiFeedListingsTable.postedAt,
      listedAt: namefiFeedListingsTable.listedAt,
      expiresAt: namefiFeedListingsTable.expiresAt,
      status: namefiFeedListingsTable.endedAt,
      asking: namefiFeedListingsTable.askingPrice,
    },
    [desc(namefiFeedListingsTable.postedAt)],
  );
  const [total, rows] = await Promise.all([
    countRows(namefiFeedListingsTable, where),
    db
      .select()
      .from(namefiFeedListingsTable)
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(getOffset(input)),
  ]);

  return paginatedTableResult({
    input,
    rows: rows.map(serializeListingRow),
    totalCount: total,
  });
}

export async function listNamefiFeedAdminReports(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listReports']> {
  const where = combineWhereClauses(
    buildReportsWhere(input.searchTerm),
    buildColumnFiltersWhere(input.columnFilters, {
      domain: { column: namefiFeedListingsTable.domain, type: 'text' },
      reason: { column: namefiFeedListingReportsTable.reason, type: 'select' },
      details: { column: namefiFeedListingReportsTable.details, type: 'text' },
      createdAt: {
        column: namefiFeedListingReportsTable.createdAt,
        type: 'date',
      },
    }),
  );
  const orderBy = resolveTableSorting(
    input.sorting,
    {
      domain: namefiFeedListingsTable.domain,
      reason: namefiFeedListingReportsTable.reason,
      details: namefiFeedListingReportsTable.details,
      createdAt: namefiFeedListingReportsTable.createdAt,
    },
    [desc(namefiFeedListingReportsTable.createdAt)],
  );
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(namefiFeedListingReportsTable)
      .innerJoin(
        namefiFeedListingsTable,
        eq(namefiFeedListingsTable.id, namefiFeedListingReportsTable.listingId),
      )
      .where(where),
    db
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
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(getOffset(input)),
  ]);

  return paginatedTableResult({
    input,
    rows: rows.map(serializeReportRow),
    totalCount: Number(totalRow[0]?.value ?? 0),
  });
}

export async function listNamefiFeedAdminDigestDeliveries(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listDigestDeliveries']> {
  const where = combineWhereClauses(
    buildDigestDeliveriesSearchWhere(input.searchTerm),
    buildColumnFiltersWhere(input.columnFilters, {
      status: {
        column: salesDigestTargetDeliveriesTable.status,
        type: 'select',
      },
      targetType: {
        column: salesDigestTargetsTable.targetType,
        type: 'select',
      },
      targetLabel: { column: salesDigestTargetsTable.label, type: 'text' },
      generatedAt: {
        column: salesDigestTargetDeliveriesTable.generatedAt,
        type: 'date',
      },
      error: { column: salesDigestTargetDeliveriesTable.error, type: 'text' },
      window: {
        column: salesDigestTargetDeliveriesTable.windowStart,
        type: 'date',
      },
      message: {
        column: salesDigestTargetDeliveriesTable.externalMessageId,
        type: 'text',
      },
    }),
  );
  const orderBy = resolveTableSorting(
    input.sorting,
    {
      status: salesDigestTargetDeliveriesTable.status,
      targetType: salesDigestTargetsTable.targetType,
      targetLabel: salesDigestTargetsTable.label,
      generatedAt: salesDigestTargetDeliveriesTable.generatedAt,
      window: salesDigestTargetDeliveriesTable.windowStart,
      message: salesDigestTargetDeliveriesTable.externalMessageId,
      error: salesDigestTargetDeliveriesTable.error,
      createdAt: salesDigestTargetDeliveriesTable.createdAt,
    },
    [desc(salesDigestTargetDeliveriesTable.createdAt)],
  );
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(salesDigestTargetDeliveriesTable)
      .leftJoin(
        salesDigestTargetsTable,
        eq(
          salesDigestTargetsTable.id,
          salesDigestTargetDeliveriesTable.targetId,
        ),
      )
      .where(where),
    db
      .select({
        id: salesDigestTargetDeliveriesTable.id,
        targetId: salesDigestTargetDeliveriesTable.targetId,
        targetKey: salesDigestTargetDeliveriesTable.targetKey,
        status: salesDigestTargetDeliveriesTable.status,
        windowStart: salesDigestTargetDeliveriesTable.windowStart,
        windowEnd: salesDigestTargetDeliveriesTable.windowEnd,
        generatedAt: salesDigestTargetDeliveriesTable.generatedAt,
        externalMessageId: salesDigestTargetDeliveriesTable.externalMessageId,
        externalMessageUrl: salesDigestTargetDeliveriesTable.externalMessageUrl,
        error: salesDigestTargetDeliveriesTable.error,
        createdAt: salesDigestTargetDeliveriesTable.createdAt,
        targetLabel: salesDigestTargetsTable.label,
        targetType: salesDigestTargetsTable.targetType,
      })
      .from(salesDigestTargetDeliveriesTable)
      .leftJoin(
        salesDigestTargetsTable,
        eq(
          salesDigestTargetsTable.id,
          salesDigestTargetDeliveriesTable.targetId,
        ),
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(getOffset(input)),
  ]);

  return paginatedTableResult({
    input,
    rows: rows.map(serializeDigestDeliveryRow),
    totalCount: Number(totalRow[0]?.value ?? 0),
  });
}

export async function listNamefiFeedAdminDigestRuns(
  input: AdminNamefiFeedTableInput,
): Promise<AdminNamefiFeedOutputs['listDigestRuns']> {
  const allRows = await listTemporalNamefiFeedDigestRunRows();
  const filteredRows = filterDigestRunRows(allRows, input);
  const sortedRows = sortDigestRunRows(filteredRows, input.sorting);
  const rows = sortedRows.slice(
    getOffset(input),
    getOffset(input) + input.pageSize,
  );

  return paginatedTableResult({
    input,
    rows,
    totalCount: filteredRows.length,
  });
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

  return rows.map(serializeRunRow);
}

async function listRecentPosts(): Promise<
  AdminNamefiFeedOverview['recentPosts']
> {
  const rows = await db
    .select({
      ...getTableColumns(namefiFeedPostsTable),
      ingestionRunMetadata: namefiFeedIngestionRunsTable.metadata,
      ingestionWorkflowId: namefiFeedIngestionRunsTable.workflowId,
    })
    .from(namefiFeedPostsTable)
    .leftJoin(
      namefiFeedIngestionRunsTable,
      eq(namefiFeedIngestionRunsTable.id, namefiFeedPostsTable.ingestionRunId),
    )
    .orderBy(desc(namefiFeedPostsTable.createdAt))
    .limit(15);

  return rows.map(serializePostRow);
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

  return rows.map(serializeListingRow);
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

  return rows.map(serializeReportRow);
}

async function listRecentDigestRuns(): Promise<
  AdminNamefiFeedOverview['recentDigestRuns']
> {
  return listTemporalNamefiFeedDigestRunRows(10);
}

type AdminDigestRunRow =
  AdminNamefiFeedOutputs['listDigestRuns']['rows'][number];
type AdminDigestRunStatus = AdminDigestRunRow['status'];
type DigestRunTemporalResult = {
  errorMessage: string | null;
  result: RunNamefiFeedSalesDigestResult | null;
};

const DIGEST_WORKFLOW_TYPE = 'namefiFeedSalesDigestWorkflow';

// Admin-only convenience view: digest workflow volume is low enough to filter
// Temporal executions in memory; switch to advanced visibility if that changes.
async function listTemporalNamefiFeedDigestRunRows(
  limit?: number,
): Promise<AdminDigestRunRow[]> {
  const rows: AdminDigestRunRow[] = [];
  const workflows = temporalClient.workflow.list({
    query: `WorkflowType = "${DIGEST_WORKFLOW_TYPE}"`,
  });

  for await (const workflow of workflows) {
    rows.push(await serializeTemporalDigestRunRow(workflow));
    if (typeof limit === 'number' && rows.length >= limit) {
      break;
    }
  }

  return rows;
}

async function serializeTemporalDigestRunRow(
  workflow: WorkflowExecutionInfo,
): Promise<AdminDigestRunRow> {
  const memo = asRecord(workflow.memo);
  const temporalResult = await readDigestWorkflowResult(workflow);
  const result = temporalResult.result;
  const timing = readDigestRunTiming({ memo, result, workflow });
  const deliveryCounts = readDigestRunDeliveryCounts(result);
  const renderDetails = readDigestRunRenderDetails(result);
  const options = readDigestRunOptions(memo, result);
  const workflowId = workflow.workflowId;
  const temporalRunId = workflow.runId;

  return {
    id: workflowId,
    workflowId,
    temporalRunId,
    temporalUiUrl: buildTemporalWorkflowUrl({ temporalRunId, workflowId }),
    trigger: readDigestTrigger(memo.trigger, workflowId),
    status: readDigestStatus(workflow.status.name, result),
    createdByUserId: readOptionalString(memo.requestedByUserId),
    windowStart: timing.bounds.start.toISOString(),
    windowEnd: timing.bounds.end.toISOString(),
    generatedAt: timing.runAt.toISOString(),
    finishedAt: workflow.closeTime?.toISOString() ?? null,
    entriesCount: result?.entriesCount ?? 0,
    ...deliveryCounts,
    ...options,
    ...renderDetails,
    skipReason: result?.skipReason ?? null,
    errorMessage: temporalResult.errorMessage,
    digestTextHash: null,
    createdAt: workflow.startTime.toISOString(),
  };
}

function readDigestRunTiming({
  memo,
  result,
  workflow,
}: {
  memo: Record<string, unknown>;
  result: RunNamefiFeedSalesDigestResult | null;
  workflow: WorkflowExecutionInfo;
}) {
  const runAt =
    readDateValue(memo.at) ??
    readDateValue(result?.bounds.end) ??
    workflow.startTime;
  const bounds =
    readDigestResultBounds(result) ??
    getRollingNamefiFeedSalesDigestBounds(
      resolveNamefiFeedSalesDigestRunAt(runAt),
    );

  return { bounds, runAt };
}

function readDigestRunDeliveryCounts(
  result: RunNamefiFeedSalesDigestResult | null,
) {
  const deliverySummary = result?.deliverySummary;
  return {
    targetCount: deliverySummary?.targetCount ?? 0,
    sentCount: deliverySummary?.sent ?? 0,
    skippedCount: deliverySummary?.skipped ?? 0,
    failedCount: deliverySummary?.failed ?? 0,
  };
}

function readDigestRunRenderDetails(
  result: RunNamefiFeedSalesDigestResult | null,
) {
  const render = result?.render;
  return {
    usedFallback: render?.usedFallback ?? false,
    fallbackReason: render?.fallbackReason ?? null,
    imageGenerated: render?.imageGenerated ?? false,
    animationGenerated: render?.animationGenerated ?? false,
  };
}

function readDigestRunOptions(
  memo: Record<string, unknown>,
  result: RunNamefiFeedSalesDigestResult | null,
) {
  return {
    includeImage: readOptionalBoolean(memo.includeImage) ?? true,
    includeAnimation: readOptionalBoolean(memo.includeAnimation) ?? true,
    enabledOnly: readOptionalBoolean(memo.enabledOnly) ?? true,
    dryRun: readOptionalBoolean(memo.dryRun) ?? result?.status === 'dry_run',
  };
}

async function readDigestWorkflowResult(
  workflow: WorkflowExecutionInfo,
): Promise<DigestRunTemporalResult> {
  if (workflow.status.name === 'RUNNING') {
    return { errorMessage: null, result: null };
  }

  try {
    const result = (await temporalClient.workflow
      .getHandle(workflow.workflowId, workflow.runId)
      .result()) as RunNamefiFeedSalesDigestResult;
    return { errorMessage: null, result };
  } catch (error) {
    return {
      errorMessage: describeAdminError(error, 'Temporal workflow failed.'),
      result: readDigestResultFromFailure(error),
    };
  }
}

function readDigestResultFromFailure(
  error: unknown,
): RunNamefiFeedSalesDigestResult | null {
  const seen = new Set<unknown>();
  const stack: unknown[] = [error];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    const record = asRecord(current);
    const result = readDigestResultFromDetails(record.details);
    if (result) {
      return result;
    }

    const cause = record.cause;
    if (cause) {
      stack.push(cause);
    }
  }

  return null;
}

function readDigestResultFromDetails(
  details: unknown,
): RunNamefiFeedSalesDigestResult | null {
  if (!Array.isArray(details)) {
    return null;
  }

  for (const detail of details) {
    const result = parseDigestRunResult(detail);
    if (result) {
      return result;
    }
  }

  return null;
}

function parseDigestRunResult(
  value: unknown,
): RunNamefiFeedSalesDigestResult | null {
  const record = asRecord(value);
  const bounds = asRecord(record.bounds);
  const status = record.status;

  if (
    typeof record.workflowId !== 'string' ||
    !isDigestRunResultStatus(status) ||
    typeof bounds.start !== 'string' ||
    typeof bounds.end !== 'string' ||
    typeof record.entriesCount !== 'number'
  ) {
    return null;
  }

  return value as RunNamefiFeedSalesDigestResult;
}

function isDigestRunResultStatus(
  status: unknown,
): status is RunNamefiFeedSalesDigestResult['status'] {
  return (
    status === 'dry_run' ||
    status === 'failed' ||
    status === 'partial' ||
    status === 'sent' ||
    status === 'skipped'
  );
}

function readDigestResultBounds(
  result: RunNamefiFeedSalesDigestResult | null,
): NamefiFeedSalesDigestBounds | null {
  const start = readDateValue(result?.bounds.start);
  const end = readDateValue(result?.bounds.end);
  return start && end ? { start, end } : null;
}

function readDigestTrigger(
  value: unknown,
  workflowId: string,
): AdminDigestRunRow['trigger'] {
  if (value === 'scheduled' || value === 'manual') {
    return value;
  }
  return workflowId === 'namefi-feed-digest' ? 'scheduled' : 'manual';
}

function readDigestStatus(
  temporalStatus: WorkflowExecutionStatusName,
  result: RunNamefiFeedSalesDigestResult | null,
): AdminDigestRunStatus {
  if (result?.status) {
    return result.status;
  }

  switch (temporalStatus) {
    case 'RUNNING':
      return 'running';
    case 'COMPLETED':
      return 'sent';
    case 'CONTINUED_AS_NEW':
      return 'running';
    default:
      return 'failed';
  }
}

function filterDigestRunRows(
  rows: AdminDigestRunRow[],
  input: AdminNamefiFeedTableInput,
) {
  return rows.filter(
    (row) =>
      digestRunMatchesSearch(row, input.searchTerm) &&
      digestRunMatchesColumnFilters(row, input.columnFilters),
  );
}

function digestRunMatchesSearch(row: AdminDigestRunRow, searchTerm?: string) {
  const term = searchTerm?.trim().toLowerCase();
  if (!term) {
    return true;
  }

  return [
    row.workflowId,
    row.temporalRunId,
    row.status,
    row.trigger,
    row.skipReason,
    row.fallbackReason,
    row.errorMessage,
  ].some((value) => value?.toLowerCase().includes(term));
}

function digestRunMatchesColumnFilters(
  row: AdminDigestRunRow,
  filters: AdminNamefiFeedTableInput['columnFilters'],
) {
  if (!filters?.length) {
    return true;
  }

  return filters.every((filter) => {
    const config = DIGEST_RUN_FILTERS[filter.id];
    if (!config) {
      return true;
    }
    const parsed = parseColumnFilterValue(filter.value, config.type);
    return parsed
      ? matchesDigestRunFilter(config.value(row), config.type, parsed)
      : true;
  });
}

function sortDigestRunRows(
  rows: AdminDigestRunRow[],
  sorting: AdminNamefiFeedTableInput['sorting'],
) {
  const sort = sorting?.find((candidate) => DIGEST_RUN_SORTS[candidate.id]);
  const sortConfig = sort
    ? DIGEST_RUN_SORTS[sort.id]
    : DIGEST_RUN_SORTS.generatedAt;
  const descSort = sort?.desc ?? true;

  return [...rows].sort((left, right) => {
    const comparison = compareDigestRunSortValues(
      sortConfig.value(left),
      sortConfig.value(right),
    );
    return descSort ? -comparison : comparison;
  });
}

type DigestRunFilterConfig = {
  type: FilterColumnType;
  value: (row: AdminDigestRunRow) => unknown;
};
type DigestRunSortConfig = {
  value: (row: AdminDigestRunRow) => string | number | null;
};

const DIGEST_RUN_FILTERS: Record<string, DigestRunFilterConfig> = {
  status: { type: 'select', value: (row) => row.status },
  trigger: { type: 'select', value: (row) => row.trigger },
  generatedAt: { type: 'date', value: (row) => row.generatedAt },
  entriesCount: { type: 'number', value: (row) => row.entriesCount },
  targetCount: { type: 'number', value: (row) => row.targetCount },
  sentCount: { type: 'number', value: (row) => row.sentCount },
  skippedCount: { type: 'number', value: (row) => row.skippedCount },
  failedCount: { type: 'number', value: (row) => row.failedCount },
  window: { type: 'date', value: (row) => row.windowStart },
  reason: {
    type: 'text',
    value: (row) =>
      row.errorMessage ?? row.skipReason ?? row.fallbackReason ?? '',
  },
};

const DIGEST_RUN_SORTS: Record<string, DigestRunSortConfig> = {
  workflow: { value: (row) => row.workflowId ?? '' },
  status: { value: (row) => row.status },
  trigger: { value: (row) => row.trigger },
  generatedAt: { value: (row) => row.generatedAt },
  window: { value: (row) => row.windowStart },
  entriesCount: { value: (row) => row.entriesCount },
  targetCount: { value: (row) => row.targetCount },
  sentCount: { value: (row) => row.sentCount },
  skippedCount: { value: (row) => row.skippedCount },
  failedCount: { value: (row) => row.failedCount },
  skipReason: { value: (row) => row.skipReason ?? '' },
  errorMessage: { value: (row) => row.errorMessage ?? '' },
};

function matchesDigestRunFilter(
  rowValue: unknown,
  type: FilterColumnType,
  filter: { operator: FilterOperator; value: unknown },
) {
  if (type === 'number') {
    return matchesNumericDigestRunFilter(rowValue, filter);
  }

  if (type === 'date') {
    return matchesDateDigestRunFilter(rowValue, filter);
  }

  return matchesTextDigestRunFilter(rowValue, filter);
}

function matchesNumericDigestRunFilter(
  rowValue: unknown,
  filter: { operator: FilterOperator; value: unknown },
) {
  const left = typeof rowValue === 'number' ? rowValue : Number(rowValue);
  const right =
    typeof filter.value === 'number'
      ? filter.value
      : Number(String(filter.value ?? '').trim());
  return Number.isFinite(left) && Number.isFinite(right)
    ? compareFilterValues(left, filter.operator, right)
    : true;
}

function matchesDateDigestRunFilter(
  rowValue: unknown,
  filter: { operator: FilterOperator; value: unknown },
) {
  const left = readDateValue(rowValue);
  const selectedDate = parseFilterDate(filter.value);
  if (!left || !selectedDate) {
    return true;
  }
  const dayStart = new Date(
    Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
    ),
  );
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return compareDateFilterValues(left, filter.operator, dayStart, nextDay);
}

function matchesTextDigestRunFilter(
  rowValue: unknown,
  filter: { operator: FilterOperator; value: unknown },
) {
  const left = String(rowValue ?? '');
  const right = String(filter.value ?? '').trim();
  if (!right) {
    return true;
  }
  if (filter.operator === 'neq') {
    return left !== right;
  }
  if (filter.operator === 'eq') {
    return left === right;
  }
  return left.toLowerCase().includes(right.toLowerCase());
}

function compareDateFilterValues(
  left: Date,
  operator: FilterOperator,
  dayStart: Date,
  nextDay: Date,
) {
  switch (operator) {
    case 'neq':
      return left < dayStart || left >= nextDay;
    case 'gt':
      return left >= nextDay;
    case 'gte':
      return left >= dayStart;
    case 'lt':
      return left < dayStart;
    case 'lte':
      return left < nextDay;
    default:
      return left >= dayStart && left < nextDay;
  }
}

function compareFilterValues(
  left: number,
  operator: FilterOperator,
  right: number,
) {
  switch (operator) {
    case 'neq':
      return left !== right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
    default:
      return left === right;
  }
}

function compareDigestRunSortValues(
  left: string | number | null,
  right: string | number | null,
) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return String(left ?? '').localeCompare(String(right ?? ''));
}

function serializeRunRow(
  row: typeof namefiFeedIngestionRunsTable.$inferSelect,
): AdminNamefiFeedOutputs['listRuns']['rows'][number] {
  const metadata = asRecord(row.metadata);
  const enqueueResult = asRecord(metadata.enqueueResult);
  const processResult = asRecord(metadata.processResult);
  const sourceResults = parseRunSourceResults(enqueueResult.sourceResults);
  const temporalRunId = readOptionalString(metadata.temporalRunId);
  const scanSkippedPostCount =
    readNonnegativeInteger(enqueueResult.skippedPostCount) ??
    sourceResults.reduce((total, source) => total + source.skippedPostCount, 0);
  const alreadyExistingPostCount =
    readNonnegativeInteger(enqueueResult.alreadyExistingCount) ??
    sourceResults.reduce(
      (total, source) => total + source.alreadyExistingCount,
      0,
    );

  return {
    id: row.id,
    workflowId: row.workflowId,
    temporalRunId,
    temporalUiUrl: buildTemporalWorkflowUrl({
      temporalRunId,
      workflowId: row.workflowId,
    }),
    trigger: row.trigger,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    scannedPostCount: row.scannedPostCount,
    queuedPostCount: row.queuedPostCount,
    alreadyExistingPostCount,
    scanSkippedPostCount,
    processedPostCount: row.processedPostCount,
    aiAnalysisAttemptedPostCount:
      row.processedPostCount + row.skippedPostCount + row.failedPostCount,
    maxPostsProcessedPerRun: readNonnegativeInteger(
      processResult.maxPostsProcessedPerRun,
    ),
    remainingPostCount: readNonnegativeInteger(
      processResult.remainingPostCount,
    ),
    stopReason: readOptionalString(processResult.stopReason),
    listingUpsertedCount: row.listingUpsertedCount,
    skippedPostCount: row.skippedPostCount,
    failedPostCount: row.failedPostCount,
    skipReason:
      readOptionalString(metadata.skipReason) ??
      readOptionalString(enqueueResult.reason),
    errorMessage: row.errorMessage,
    sourceResults,
  };
}

function buildTemporalWorkflowUrl({
  temporalRunId,
  workflowId,
}: {
  temporalRunId?: string | null;
  workflowId: string | null;
}): string | null {
  const normalizedWorkflowId = workflowId?.trim();
  const normalizedTemporalRunId = temporalRunId?.trim();
  return normalizedWorkflowId
    ? getTemporalWorkflowUrl({
        workflowId: normalizedWorkflowId,
        runId: normalizedTemporalRunId || null,
      })
    : null;
}

function describeAdminError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

function serializePostRow(
  row: typeof namefiFeedPostsTable.$inferSelect & {
    ingestionRunMetadata?: Record<string, Json> | null;
    ingestionWorkflowId?: string | null;
  },
): AdminNamefiFeedOutputs['listPosts']['rows'][number] {
  const ingestionRunMetadata = asRecord(row.ingestionRunMetadata);
  const temporalRunId = readOptionalString(ingestionRunMetadata.temporalRunId);
  return {
    id: row.id,
    ingestionRunId: row.ingestionRunId,
    ingestionWorkflowId: row.ingestionWorkflowId ?? null,
    temporalRunId,
    temporalUiUrl: buildTemporalWorkflowUrl({
      temporalRunId,
      workflowId: row.ingestionWorkflowId ?? null,
    }),
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
  };
}

function serializeListingRow(
  row: typeof namefiFeedListingsTable.$inferSelect,
): AdminNamefiFeedOutputs['listListings']['rows'][number] {
  return {
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
  };
}

function serializeReportRow(row: {
  id: string;
  listingId: string;
  domain: string;
  reason: AdminNamefiFeedOutputs['listReports']['rows'][number]['reason'];
  details: string | null;
  status: AdminNamefiFeedOutputs['listReports']['rows'][number]['status'];
  createdAt: Date;
  sourceUrl: string;
}): AdminNamefiFeedOutputs['listReports']['rows'][number] {
  return {
    id: row.id,
    listingId: row.listingId,
    domain: row.domain,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    sourceUrl: row.sourceUrl,
  };
}

function serializeDigestDeliveryRow(row: {
  id: string;
  targetId: string | null;
  targetKey: string;
  targetLabel: string | null;
  targetType: AdminNamefiFeedOutputs['listDigestDeliveries']['rows'][number]['targetType'];
  status: AdminNamefiFeedOutputs['listDigestDeliveries']['rows'][number]['status'];
  windowStart: Date;
  windowEnd: Date;
  generatedAt: Date;
  externalMessageId: string | null;
  externalMessageUrl: string | null;
  error: string | null;
  createdAt: Date;
}): AdminNamefiFeedOutputs['listDigestDeliveries']['rows'][number] {
  return {
    id: row.id,
    targetId: row.targetId,
    targetKey: row.targetKey,
    targetLabel: row.targetLabel,
    targetType: row.targetType,
    status: row.status,
    windowStart: row.windowStart.toISOString(),
    windowEnd: row.windowEnd.toISOString(),
    generatedAt: row.generatedAt.toISOString(),
    externalMessageId: row.externalMessageId,
    externalMessageUrl: row.externalMessageUrl,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  };
}

type SortableColumn = Parameters<typeof asc>[0];
type FilterColumnType = 'text' | 'number' | 'date' | 'select';
type FilterOperator = 'like' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
type FilterableColumn = {
  column: SortableColumn;
  type: FilterColumnType;
};

type CountableNamefiFeedTable =
  | typeof namefiFeedIngestionRunsTable
  | typeof namefiFeedPostsTable
  | typeof namefiFeedListingsTable;

function resolveTableSorting(
  sorting: AdminNamefiFeedTableInput['sorting'],
  columns: Record<string, SortableColumn>,
  fallback: SQL[],
): SQL[] {
  const orderBy =
    sorting
      ?.map((sort) => {
        const column = columns[sort.id];
        if (!column) {
          return null;
        }
        return sort.desc ? desc(column) : asc(column);
      })
      .filter((value): value is SQL => Boolean(value)) ?? [];

  return orderBy.length > 0 ? orderBy : fallback;
}

async function countRows(table: CountableNamefiFeedTable, where?: SQL) {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return Number(row?.value ?? 0);
}

async function countNamefiFeedPostRows(where?: SQL) {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedPostsTable)
    .leftJoin(
      namefiFeedIngestionRunsTable,
      eq(namefiFeedIngestionRunsTable.id, namefiFeedPostsTable.ingestionRunId),
    )
    .where(where);
  return Number(row?.value ?? 0);
}

function combineWhereClauses(
  ...clauses: Array<SQL | undefined | null>
): SQL | undefined {
  const presentClauses = clauses.filter(
    (clause): clause is SQL => clause != null,
  );
  if (presentClauses.length === 0) {
    return undefined;
  }
  return and(...presentClauses);
}

function paginatedTableResult<T>({
  input,
  rows,
  totalCount,
}: {
  input: AdminNamefiFeedTableInput;
  rows: T[];
  totalCount: number;
}) {
  return {
    rows,
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / input.pageSize)),
  };
}

function getOffset(input: AdminNamefiFeedTableInput) {
  return (input.page - 1) * input.pageSize;
}

function searchPattern(searchTerm?: string) {
  const term = searchTerm?.trim();
  return term ? `%${term}%` : null;
}

function textMatches(column: SortableColumn, pattern: string): SQL {
  return sql`${column}::text ILIKE ${pattern}`;
}

function buildColumnFiltersWhere(
  filters: AdminNamefiFeedTableInput['columnFilters'],
  columns: Record<string, FilterableColumn>,
): SQL | undefined {
  if (!filters || filters.length === 0) {
    return undefined;
  }

  const clauses = filters.flatMap((filter) => {
    const config = columns[filter.id];
    if (!config) {
      return [];
    }

    const parsed = parseColumnFilterValue(filter.value, config.type);
    const clause = parsed
      ? buildColumnFilterWhere(config, parsed.operator, parsed.value)
      : undefined;

    return clause ? [clause] : [];
  });

  return combineWhereClauses(...clauses);
}

function parseColumnFilterValue(
  rawValue: unknown,
  type: FilterColumnType,
): { operator: FilterOperator; value: unknown } | null {
  const defaultOperator: FilterOperator = type === 'text' ? 'like' : 'eq';
  if (
    rawValue &&
    typeof rawValue === 'object' &&
    !Array.isArray(rawValue) &&
    'operator' in rawValue &&
    'value' in rawValue
  ) {
    const record = rawValue as Record<string, unknown>;
    const operator = parseFilterOperator(record.operator, defaultOperator);
    return { operator, value: record.value };
  }

  return { operator: defaultOperator, value: rawValue };
}

function parseFilterOperator(
  rawOperator: unknown,
  fallback: FilterOperator,
): FilterOperator {
  return rawOperator === 'like' ||
    rawOperator === 'eq' ||
    rawOperator === 'neq' ||
    rawOperator === 'gt' ||
    rawOperator === 'gte' ||
    rawOperator === 'lt' ||
    rawOperator === 'lte'
    ? rawOperator
    : fallback;
}

function buildColumnFilterWhere(
  config: FilterableColumn,
  operator: FilterOperator,
  value: unknown,
): SQL | undefined {
  if (config.type === 'number') {
    return buildNumericFilterWhere(config.column, operator, value);
  }

  if (config.type === 'date') {
    return buildDateFilterWhere(config.column, operator, value);
  }

  return buildTextFilterWhere(config.column, operator, value);
}

function buildTextFilterWhere(
  column: SortableColumn,
  operator: FilterOperator,
  value: unknown,
): SQL | undefined {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) {
    return undefined;
  }

  if (operator === 'neq') {
    return sql`${column}::text <> ${normalizedValue}`;
  }

  if (operator === 'eq') {
    return sql`${column}::text = ${normalizedValue}`;
  }

  return textMatches(column, `%${normalizedValue}%`);
}

function buildNumericFilterWhere(
  column: SortableColumn,
  operator: FilterOperator,
  value: unknown,
): SQL | undefined {
  const numericValue =
    typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  switch (operator) {
    case 'neq':
      return sql`${column} <> ${numericValue}`;
    case 'gt':
      return sql`${column} > ${numericValue}`;
    case 'gte':
      return sql`${column} >= ${numericValue}`;
    case 'lt':
      return sql`${column} < ${numericValue}`;
    case 'lte':
      return sql`${column} <= ${numericValue}`;
    default:
      return sql`${column} = ${numericValue}`;
  }
}

function buildDateFilterWhere(
  column: SortableColumn,
  operator: FilterOperator,
  value: unknown,
): SQL | undefined {
  const selectedDate = parseFilterDate(value);
  if (!selectedDate) {
    return undefined;
  }

  const dayStart = new Date(
    Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
    ),
  );
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  switch (operator) {
    case 'neq':
      return or(sql`${column} < ${dayStart}`, sql`${column} >= ${nextDay}`);
    case 'gt':
      return sql`${column} >= ${nextDay}`;
    case 'gte':
      return sql`${column} >= ${dayStart}`;
    case 'lt':
      return sql`${column} < ${dayStart}`;
    case 'lte':
      return sql`${column} < ${nextDay}`;
    default:
      return and(sql`${column} >= ${dayStart}`, sql`${column} < ${nextDay}`);
  }
}

function parseFilterDate(value: unknown): Date | null {
  const parsed =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildRunsSearchWhere(searchTerm?: string): SQL | undefined {
  const pattern = searchPattern(searchTerm);
  if (!pattern) {
    return undefined;
  }

  return or(
    textMatches(namefiFeedIngestionRunsTable.workflowId, pattern),
    textMatches(namefiFeedIngestionRunsTable.trigger, pattern),
    textMatches(namefiFeedIngestionRunsTable.status, pattern),
    textMatches(namefiFeedIngestionRunsTable.errorMessage, pattern),
    textMatches(namefiFeedIngestionRunsTable.metadata, pattern),
  );
}

function buildPostsSearchWhere(searchTerm?: string): SQL | undefined {
  const pattern = searchPattern(searchTerm);
  if (!pattern) {
    return undefined;
  }

  return or(
    textMatches(namefiFeedPostsTable.ingestionRunId, pattern),
    textMatches(namefiFeedPostsTable.externalPostId, pattern),
    textMatches(namefiFeedPostsTable.authorUsername, pattern),
    textMatches(namefiFeedPostsTable.authorDisplayName, pattern),
    textMatches(namefiFeedPostsTable.status, pattern),
    textMatches(namefiFeedPostsTable.source, pattern),
    textMatches(namefiFeedPostsTable.failureReason, pattern),
    textMatches(namefiFeedPostsTable.skipReason, pattern),
    textMatches(namefiFeedPostsTable.text, pattern),
    textMatches(namefiFeedIngestionRunsTable.workflowId, pattern),
    textMatches(namefiFeedIngestionRunsTable.metadata, pattern),
  );
}

function buildListingsSearchWhere(searchTerm?: string): SQL | undefined {
  const pattern = searchPattern(searchTerm);
  if (!pattern) {
    return undefined;
  }

  return or(
    textMatches(namefiFeedListingsTable.domain, pattern),
    textMatches(namefiFeedListingsTable.sellerUsername, pattern),
    textMatches(namefiFeedListingsTable.sellerDisplayName, pattern),
    textMatches(namefiFeedListingsTable.askingPrice, pattern),
    textMatches(namefiFeedListingsTable.askingCurrency, pattern),
    textMatches(namefiFeedListingsTable.sourceUrl, pattern),
    textMatches(namefiFeedListingsTable.endReason, pattern),
  );
}

function buildReportsWhere(searchTerm?: string): SQL {
  const clauses: SQL[] = [
    eq(namefiFeedListingReportsTable.status, 'active'),
    ...getActiveNamefiFeedListingWhereClauses(),
  ];
  const pattern = searchPattern(searchTerm);
  if (pattern) {
    const searchWhere = or(
      textMatches(namefiFeedListingsTable.domain, pattern),
      textMatches(namefiFeedListingReportsTable.reason, pattern),
      textMatches(namefiFeedListingReportsTable.details, pattern),
    );
    if (searchWhere) {
      clauses.push(searchWhere);
    }
  }

  return and(...clauses) ?? sql`true`;
}

function buildDigestDeliveriesSearchWhere(
  searchTerm?: string,
): SQL | undefined {
  const pattern = searchPattern(searchTerm);
  if (!pattern) {
    return undefined;
  }

  return or(
    textMatches(salesDigestTargetDeliveriesTable.targetKey, pattern),
    textMatches(salesDigestTargetDeliveriesTable.status, pattern),
    textMatches(salesDigestTargetDeliveriesTable.externalMessageId, pattern),
    textMatches(salesDigestTargetDeliveriesTable.error, pattern),
    textMatches(salesDigestTargetsTable.targetType, pattern),
    textMatches(salesDigestTargetsTable.label, pattern),
  );
}

function parseRunSourceResults(
  value: unknown,
): AdminNamefiFeedOverview['recentRuns'][number]['sourceResults'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const source = asRecord(item);
    const sourceId = readOptionalString(source.source);
    if (sourceId !== 'x' && sourceId !== 'namepros' && sourceId !== 'dnforum') {
      return [];
    }

    return [
      {
        source: sourceId,
        feedId: readOptionalString(source.feedId),
        feedUrl: readOptionalString(source.feedUrl),
        skipped: source.skipped === true,
        reason: readOptionalString(source.reason),
        scannedPostCount: readNonnegativeInteger(source.scannedPostCount) ?? 0,
        queuedPostCount: readNonnegativeInteger(source.queuedPostCount) ?? 0,
        alreadyExistingCount:
          readNonnegativeInteger(source.alreadyExistingCount) ?? 0,
        skippedPostCount: readNonnegativeInteger(source.skippedPostCount) ?? 0,
        latestCursorAt: readOptionalString(source.latestCursorAt),
        errorMessage: readOptionalString(source.errorMessage),
      },
    ];
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readOptionalBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readDateValue(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function readNonnegativeInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function readBoundedInteger(
  value: unknown,
  fallback: number,
  bounds: { min: number; max: number },
) {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < bounds.min ||
    value > bounds.max
  ) {
    return fallback;
  }

  return value;
}

function readSourceSettingsMetadata(metadata: Record<string, unknown>) {
  return asRecord(metadata.sourceSettings);
}

function readSourceMetadata(
  metadata: Record<string, unknown>,
  source: keyof AdminNamefiFeedSourceSettings,
) {
  return asRecord(readSourceSettingsMetadata(metadata)[source]);
}

function mergeNamefiFeedSourceSettingsMetadata(
  metadata: Record<string, unknown>,
  input: AdminNamefiFeedSourceSettingsInput | undefined,
) {
  if (!input) {
    return null;
  }

  const current = readSourceSettingsMetadata(metadata);
  return {
    ...current,
    ...(input.x ? { x: { ...asRecord(current.x), ...input.x } } : {}),
    ...(input.namepros
      ? { namepros: { ...asRecord(current.namepros), ...input.namepros } }
      : {}),
    ...(input.dnforum
      ? { dnforum: { ...asRecord(current.dnforum), ...input.dnforum } }
      : {}),
  };
}

export function readNamefiFeedSourceSettingsFromSettingsRow(settings: {
  metadata: Record<string, Json>;
  maxQueries: number;
  maxPagesPerQuery: number;
  maxTweetsPerQuery: number;
  maxTweetAgeMinutes: number;
  overlapMinutes: number;
}): AdminNamefiFeedSourceSettings {
  const xMetadata = readSourceMetadata(settings.metadata, 'x');
  const nameprosMetadata = readSourceMetadata(settings.metadata, 'namepros');
  const dnforumMetadata = readSourceMetadata(settings.metadata, 'dnforum');

  return {
    x: {
      maxQueries: readBoundedInteger(
        xMetadata.maxQueries,
        settings.maxQueries,
        {
          min: 1,
          max: 12,
        },
      ),
      maxPagesPerQuery: readBoundedInteger(
        xMetadata.maxPagesPerQuery,
        settings.maxPagesPerQuery,
        { min: 1, max: 10 },
      ),
      maxTweetsPerQuery: readBoundedInteger(
        xMetadata.maxTweetsPerQuery,
        settings.maxTweetsPerQuery,
        { min: 10, max: 100 },
      ),
      maxTweetAgeMinutes: readBoundedInteger(
        xMetadata.maxTweetAgeMinutes,
        Math.min(settings.maxTweetAgeMinutes, DAILY_SOURCE_LOOKBACK_MINUTES),
        { min: 15, max: DAILY_SOURCE_LOOKBACK_MINUTES },
      ),
      overlapMinutes: readBoundedInteger(
        xMetadata.overlapMinutes,
        settings.overlapMinutes,
        { min: 0, max: 60 * 24 },
      ),
    },
    namepros: {
      maxPostAgeMinutes: readBoundedInteger(
        nameprosMetadata.maxPostAgeMinutes,
        DAILY_SOURCE_LOOKBACK_MINUTES,
        { min: 15, max: DAILY_SOURCE_LOOKBACK_MINUTES },
      ),
    },
    dnforum: {
      maxPostAgeMinutes: readBoundedInteger(
        dnforumMetadata.maxPostAgeMinutes,
        DAILY_SOURCE_LOOKBACK_MINUTES,
        { min: 15, max: DAILY_SOURCE_LOOKBACK_MINUTES },
      ),
    },
  };
}

function toAdminSettings(
  settings: typeof namefiFeedSettingsTable.$inferSelect,
): AdminNamefiFeedSettings {
  const enabledSources = readNamefiFeedEnabledSourcesFromMetadata(
    settings.metadata,
  );

  return {
    autoScanEnabled: settings.autoScanEnabled,
    enabledSources,
    sources: buildNamefiFeedAdminSources(enabledSources),
    searchQueries:
      settings.searchQueries.length > 0
        ? settings.searchQueries
        : DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
    maxQueries: settings.maxQueries,
    maxPagesPerQuery: settings.maxPagesPerQuery,
    maxTweetsPerQuery: settings.maxTweetsPerQuery,
    maxTweetAgeMinutes: settings.maxTweetAgeMinutes,
    maxPostsProcessedPerRun: readNamefiFeedMaxPostsProcessedPerRunFromMetadata(
      settings.metadata,
    ),
    overlapMinutes: settings.overlapMinutes,
    sourceSettings: readNamefiFeedSourceSettingsFromSettingsRow(settings),
    lastAutoScanCursorAt: settings.lastAutoScanCursorAt?.toISOString() ?? null,
    lastRunAt: settings.lastRunAt?.toISOString() ?? null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function readNamefiFeedMaxPostsProcessedPerRunFromMetadata(
  metadata: Record<string, Json>,
) {
  const value = metadata.maxPostsProcessedPerRun;
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 2_000
    ? value
    : DEFAULT_NAMEFI_FEED_MAX_POSTS_PROCESSED_PER_RUN;
}
