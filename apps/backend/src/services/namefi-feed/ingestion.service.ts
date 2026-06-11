import { createHash } from 'node:crypto';
import {
  analyseNamefiFeedPostForDomainSale,
  type NamefiFeedDomainSaleOpportunity,
} from '@namefi-astra/ai';
import {
  db,
  namefiFeedIngestionRunsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
  namefiFeedSettingsTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Json } from 'drizzle-zod';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  lt,
  lte,
  sql,
} from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import {
  buildSaleSearchQuery,
  buildTweetUrl,
  clamp,
  DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
  extractDomainsFromText,
  extractTweetId,
  isBlockedSaleDomain,
  mergeDomains,
  normalizeOptionalText,
  normalizePriceAndCurrency,
  normalizePublicHttpUrl,
  normalizeSaleDomain,
} from './normalization';
import {
  getNamefiFeedSettingsRow,
  readNamefiFeedMaxPostsProcessedPerRunFromMetadata,
  readNamefiFeedSourceSettingsFromSettingsRow,
  touchNamefiFeedLastRunAt,
  updateNamefiFeedLastAutoScanCursorAt,
} from './admin.service';
import {
  DEFAULT_NAMEFI_FEED_ENABLED_SOURCES,
  readNamefiFeedEnabledSourcesFromMetadata,
  type NamefiFeedAutoScanSource,
} from './sources';
import {
  NAMEFI_FEED_MARKETPLACE_RSS_FEEDS,
  parseNamefiFeedMarketplaceRss,
  shouldQueueNamefiFeedMarketplaceRssItem,
  type NamefiFeedMarketplaceRssFeed,
  type NamefiFeedMarketplaceRssItem,
  type NamefiFeedMarketplaceRssSource,
} from './marketplace-rss';

const logger = createLogger({ module: 'namefi-feed-ingestion' });

const X_API_BASE_URL = 'https://api.x.com/2';
const X_REQUEST_TIMEOUT_MS = 15_000;
const X_MAX_REQUEST_ATTEMPTS = 3;
const X_RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const X_DEFAULT_RETRY_DELAY_MS = 1_000;
const X_MAX_RETRY_DELAY_MS = 30_000;
const X_MANUAL_REPLIES_MAX_PAGES = 10;
const MARKETPLACE_RSS_REQUEST_TIMEOUT_MS = 15_000;
const MARKETPLACE_RSS_MAX_REQUEST_ATTEMPTS = 3;
const MARKETPLACE_RSS_DEFAULT_RETRY_DELAY_MS = 1_000;
const MARKETPLACE_RSS_MAX_RETRY_DELAY_MS = 15_000;
const MARKETPLACE_RSS_MAX_POST_AGE_MINUTES = 24 * 60;
const PROCESSING_POST_STALE_MS = 45 * 60 * 1000;
const ACTIVE_INGESTION_RUN_STALE_MS = 3 * 60 * 60 * 1000;
const INGESTION_RUN_CREATION_LOCK_KEY = 'namefi-feed-ingestion-run';
const X_TWEET_FIELDS = [
  'author_id',
  'conversation_id',
  'created_at',
  'entities',
  'in_reply_to_user_id',
  'referenced_tweets',
].join(',');
const X_USER_FIELDS = ['username', 'name', 'profile_image_url'].join(',');
const REQUEUEABLE_POST_STATUSES = ['processed', 'skipped', 'failed'] as const;

export type { NamefiFeedAutoScanSource } from './sources';

export interface NamefiFeedScanResult {
  skipped: boolean;
  reason: string | null;
  scannedPostCount: number;
  queuedPostCount: number;
  alreadyExistingCount: number;
  latestCursorAt: string | null;
  sourceResults?: NamefiFeedScanSourceResult[];
}

export interface NamefiFeedScanSourceResult {
  source: NamefiFeedAutoScanSource;
  feedId?: string;
  feedUrl?: string;
  skipped: boolean;
  reason: string | null;
  scannedPostCount: number;
  queuedPostCount: number;
  alreadyExistingCount: number;
  skippedPostCount: number;
  latestCursorAt: string | null;
  errorMessage?: string;
}

export interface NamefiFeedManualIngestResult {
  queuedPostCount: number;
  rootPostsQueued: number;
  replyPostsQueued: number;
  alreadyExistingCount: number;
  issues: Array<{ tweet: string; reason: string }>;
}

export interface NamefiFeedProcessResult {
  processedPostCount: number;
  listingUpsertedCount: number;
  logoCandidateDomains: NamefiNormalizedDomain[];
  skippedPostCount: number;
  failedPostCount: number;
  remainingPostCount: number;
  budgetExhausted: boolean;
  maxPostsProcessedPerRun: number;
  budgetRemaining: number;
}

interface XTweet {
  id: string;
  text?: string;
  author_id?: string;
  conversation_id?: string;
  created_at?: string;
  in_reply_to_user_id?: string;
  entities?: {
    urls?: Array<{
      url?: string;
      expanded_url?: string;
      display_url?: string;
      unwound_url?: string;
    }>;
  };
  referenced_tweets?: Array<{ type: string; id: string }>;
}

type XUrlEntity = NonNullable<NonNullable<XTweet['entities']>['urls']>[number];

interface XUser {
  id: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
}

interface XApiResponse<T> {
  data?: T;
  includes?: {
    users?: XUser[];
  };
  meta?: {
    result_count?: number;
    next_token?: string;
  };
  errors?: Array<{ title?: string; detail?: string }>;
}

type PostInsertResult =
  | { status: 'inserted'; id: string }
  | { status: 'existing' }
  | { status: 'skipped'; reason: string };

interface ScanCounters {
  scannedPostCount: number;
  queuedPostCount: number;
  alreadyExistingCount: number;
  skippedPostCount: number;
  latestCursorAt: Date | null;
}

type NamefiFeedPostQueueSource = 'auto_scan' | 'manual' | 'system';

interface ManualIngestState {
  seenTweetIds: Set<string>;
  issues: NamefiFeedManualIngestResult['issues'];
  queuedPostCount: number;
  rootPostsQueued: number;
  replyPostsQueued: number;
  alreadyExistingCount: number;
}

export class NamefiFeedXConfigurationError extends Error {
  constructor(message = 'Namefi Feed X bearer token is not configured.') {
    super(message);
    this.name = 'NamefiFeedXConfigurationError';
  }
}

export class NamefiFeedXApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NamefiFeedXApiError';
  }
}

export async function createNamefiFeedIngestionRun(input: {
  temporalRunId?: string | null;
  workflowId: string;
  trigger: 'scheduled' | 'manual';
  requestedByUserId?: string | null;
}) {
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${INGESTION_RUN_CREATION_LOCK_KEY}))`,
    );

    const staleBefore = new Date(Date.now() - ACTIVE_INGESTION_RUN_STALE_MS);
    const staleRetiredAt = new Date();
    await tx
      .update(namefiFeedIngestionRunsTable)
      .set({
        errorMessage:
          'Namefi feed ingestion run exceeded the active-run stale timeout.',
        finishedAt: staleRetiredAt,
        metadata: sql`${namefiFeedIngestionRunsTable.metadata} || ${JSON.stringify(
          {
            staleAfterMs: ACTIVE_INGESTION_RUN_STALE_MS,
            staleReason: 'stale_after_timeout',
            staleRetiredAt: staleRetiredAt.toISOString(),
          },
        )}::jsonb`,
        status: 'failed',
        updatedAt: staleRetiredAt,
      })
      .where(
        and(
          eq(namefiFeedIngestionRunsTable.status, 'running'),
          lte(namefiFeedIngestionRunsTable.startedAt, staleBefore),
        ),
      );

    const [activeRun] = await tx
      .select({
        id: namefiFeedIngestionRunsTable.id,
        workflowId: namefiFeedIngestionRunsTable.workflowId,
        startedAt: namefiFeedIngestionRunsTable.startedAt,
      })
      .from(namefiFeedIngestionRunsTable)
      .where(
        and(
          eq(namefiFeedIngestionRunsTable.status, 'running'),
          gt(namefiFeedIngestionRunsTable.startedAt, staleBefore),
        ),
      )
      .orderBy(desc(namefiFeedIngestionRunsTable.startedAt))
      .limit(1);

    if (activeRun) {
      const [run] = await tx
        .insert(namefiFeedIngestionRunsTable)
        .values({
          metadata: {
            ...buildTemporalRunMetadata(input.temporalRunId),
            skipReason: 'ingestion_already_running',
            activeRunId: activeRun.id,
            activeWorkflowId: activeRun.workflowId,
            activeRunStartedAt: activeRun.startedAt.toISOString(),
          },
          workflowId: input.workflowId,
          trigger: input.trigger,
          requestedByUserId: input.requestedByUserId ?? null,
          status: 'skipped',
          finishedAt: new Date(),
        })
        .returning({ id: namefiFeedIngestionRunsTable.id });

      if (!run) {
        throw new Error('Failed to create skipped Namefi feed ingestion run.');
      }

      await tx
        .update(namefiFeedSettingsTable)
        .set({ lastRunAt: new Date() })
        .where(eq(namefiFeedSettingsTable.id, 'default'));

      return {
        runId: run.id,
        skipped: true,
        reason: 'ingestion_already_running',
      };
    }

    const [run] = await tx
      .insert(namefiFeedIngestionRunsTable)
      .values({
        metadata: buildTemporalRunMetadata(input.temporalRunId),
        workflowId: input.workflowId,
        trigger: input.trigger,
        requestedByUserId: input.requestedByUserId ?? null,
      })
      .returning({ id: namefiFeedIngestionRunsTable.id });

    if (!run) {
      throw new Error('Failed to create Namefi feed ingestion run.');
    }

    return { runId: run.id };
  });
}

export async function scanAndQueueNamefiFeedAutoPosts(input: {
  runId: string;
  bearerToken?: string | null;
  ignoreAutoScanEnabled?: boolean;
  sources?: NamefiFeedAutoScanSource[];
}): Promise<NamefiFeedScanResult> {
  const settings = await getNamefiFeedSettingsRow();
  if (!settings.autoScanEnabled && !input.ignoreAutoScanEnabled) {
    const result: NamefiFeedScanResult = {
      skipped: true,
      reason: 'auto_scan_disabled',
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      latestCursorAt: null,
      sourceResults: [],
    };
    await persistScanCounts(input.runId, result);
    return result;
  }

  const enabledSourceSet = new Set(
    readNamefiFeedEnabledSourcesFromMetadata(settings.metadata),
  );
  const requestedSources = input.sources ?? DEFAULT_NAMEFI_FEED_ENABLED_SOURCES;
  const sources = new Set<NamefiFeedAutoScanSource>(
    requestedSources.filter((source) => enabledSourceSet.has(source)),
  );
  const counters = createScanCounters();
  const sourceResults: NamefiFeedScanSourceResult[] = requestedSources
    .filter((source) => !enabledSourceSet.has(source))
    .map((source) => createSkippedSourceResult(source, 'source_disabled'));

  if (sources.size === 0) {
    const result: NamefiFeedScanResult = {
      skipped: true,
      reason: 'all_sources_disabled',
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      latestCursorAt: null,
      sourceResults,
    };
    await persistScanCounts(input.runId, result);
    return result;
  }

  if (sources.has('x')) {
    if (input.bearerToken) {
      const xResult = await scanAndQueueNamefiFeedXPostsForSettings({
        runId: input.runId,
        bearerToken: input.bearerToken,
        settings,
      });
      mergeScanCounters(counters, xResult.counters);
      sourceResults.push(xResult.sourceResult);
      if (xResult.counters.latestCursorAt) {
        await updateNamefiFeedLastAutoScanCursorAt(
          xResult.counters.latestCursorAt,
        );
      }
    } else {
      sourceResults.push(
        createSkippedSourceResult('x', 'x_bearer_token_missing'),
      );
    }
  }

  const marketplaceRssSources = Array.from(sources).filter(
    (source): source is NamefiFeedMarketplaceRssSource =>
      source === 'namepros' || source === 'dnforum',
  );
  if (marketplaceRssSources.length > 0) {
    const sourceSettings =
      readNamefiFeedSourceSettingsFromSettingsRow(settings);
    const marketplaceRssResult =
      await scanAndQueueNamefiFeedMarketplaceRssPosts({
        runId: input.runId,
        maxPostAgeMinutesBySource: {
          dnforum: sourceSettings.dnforum.maxPostAgeMinutes,
          namepros: sourceSettings.namepros.maxPostAgeMinutes,
        },
        sources: marketplaceRssSources,
      });
    mergeScanCounters(counters, marketplaceRssResult.counters);
    sourceResults.push(...marketplaceRssResult.sourceResults);
  }

  if (didSkipEveryRequestedSource(sourceResults, counters)) {
    const result: NamefiFeedScanResult = {
      skipped: true,
      reason: resolveSkippedScanReason(sourceResults),
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      latestCursorAt: null,
      sourceResults,
    };
    await persistScanCounts(input.runId, result);
    return result;
  }

  const result: NamefiFeedScanResult = {
    skipped: false,
    reason: null,
    scannedPostCount: counters.scannedPostCount,
    queuedPostCount: counters.queuedPostCount,
    alreadyExistingCount: counters.alreadyExistingCount,
    latestCursorAt: counters.latestCursorAt?.toISOString() ?? null,
    sourceResults,
  };
  await persistScanCounts(input.runId, result);
  return result;
}

export async function scanAndQueueNamefiFeedXPosts(input: {
  runId: string;
  bearerToken?: string | null;
  ignoreAutoScanEnabled?: boolean;
}): Promise<NamefiFeedScanResult> {
  const settings = await getNamefiFeedSettingsRow();
  if (!settings.autoScanEnabled && !input.ignoreAutoScanEnabled) {
    const result: NamefiFeedScanResult = {
      skipped: true,
      reason: 'auto_scan_disabled',
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      latestCursorAt: null,
    };
    await persistScanCounts(input.runId, result);
    return result;
  }

  const enabledSources = readNamefiFeedEnabledSourcesFromMetadata(
    settings.metadata,
  );
  if (!enabledSources.includes('x')) {
    const result: NamefiFeedScanResult = {
      skipped: true,
      reason: 'all_sources_disabled',
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      latestCursorAt: null,
      sourceResults: [createSkippedSourceResult('x', 'source_disabled')],
    };
    await persistScanCounts(input.runId, result);
    return result;
  }

  if (!input.bearerToken) {
    throw new NamefiFeedXConfigurationError();
  }

  const xResult = await scanAndQueueNamefiFeedXPostsForSettings({
    runId: input.runId,
    bearerToken: input.bearerToken,
    settings,
  });
  if (xResult.counters.latestCursorAt) {
    await updateNamefiFeedLastAutoScanCursorAt(xResult.counters.latestCursorAt);
  }

  const result: NamefiFeedScanResult = {
    skipped: false,
    reason: null,
    scannedPostCount: xResult.counters.scannedPostCount,
    queuedPostCount: xResult.counters.queuedPostCount,
    alreadyExistingCount: xResult.counters.alreadyExistingCount,
    latestCursorAt: xResult.counters.latestCursorAt?.toISOString() ?? null,
    sourceResults: [xResult.sourceResult],
  };
  await persistScanCounts(input.runId, result);
  return result;
}

async function scanAndQueueNamefiFeedXPostsForSettings(input: {
  runId: string;
  bearerToken: string;
  settings: Awaited<ReturnType<typeof getNamefiFeedSettingsRow>>;
}): Promise<{
  counters: ScanCounters;
  sourceResult: NamefiFeedScanSourceResult;
}> {
  const { settings } = input;
  const xSettings = readNamefiFeedSourceSettingsFromSettingsRow(settings).x;

  const startTime = resolveStartTime({
    sinceAt: settings.lastAutoScanCursorAt,
    maxTweetAgeMinutes: xSettings.maxTweetAgeMinutes,
    overlapMinutes: xSettings.overlapMinutes,
  });
  const queries = (
    settings.searchQueries.length > 0
      ? settings.searchQueries
      : DEFAULT_NAMEFI_FEED_SEARCH_QUERIES
  )
    .slice(0, xSettings.maxQueries)
    .map((query) => buildSaleSearchQuery(query))
    .filter((query): query is string => Boolean(query));

  const counters = createScanCounters();

  for (const query of queries) {
    mergeScanCounters(
      counters,
      await scanNamefiFeedQueryPages({
        runId: input.runId,
        bearerToken: input.bearerToken,
        query,
        startTime,
        maxPages: xSettings.maxPagesPerQuery,
        maxResults: xSettings.maxTweetsPerQuery,
        maxTweetAgeMinutes: xSettings.maxTweetAgeMinutes,
      }),
    );
  }

  return {
    counters,
    sourceResult: {
      source: 'x',
      skipped: false,
      reason: null,
      scannedPostCount: counters.scannedPostCount,
      queuedPostCount: counters.queuedPostCount,
      alreadyExistingCount: counters.alreadyExistingCount,
      skippedPostCount: counters.skippedPostCount,
      latestCursorAt: counters.latestCursorAt?.toISOString() ?? null,
    },
  };
}

async function scanAndQueueNamefiFeedMarketplaceRssPosts(input: {
  runId: string;
  maxPostAgeMinutesBySource: Record<NamefiFeedMarketplaceRssSource, number>;
  sources: NamefiFeedMarketplaceRssSource[];
}): Promise<{
  counters: ScanCounters;
  sourceResults: NamefiFeedScanSourceResult[];
}> {
  const counters = createScanCounters();
  const sourceResults: NamefiFeedScanSourceResult[] = [];
  const sources = new Set(input.sources);

  for (const feed of NAMEFI_FEED_MARKETPLACE_RSS_FEEDS) {
    if (!sources.has(feed.source)) {
      continue;
    }

    const feedCounters = createScanCounters();
    try {
      const xml = await fetchMarketplaceRssXml(feed);
      const items = parseNamefiFeedMarketplaceRss(xml, feed);
      const maxPostAgeMinutes =
        input.maxPostAgeMinutesBySource[feed.source] ??
        MARKETPLACE_RSS_MAX_POST_AGE_MINUTES;

      for (const item of items) {
        feedCounters.scannedPostCount += 1;
        feedCounters.latestCursorAt = resolveLatestDate(
          feedCounters.latestCursorAt,
          item.postedAt.toISOString(),
        );

        if (!isPostDateFresh(item.postedAt, maxPostAgeMinutes)) {
          feedCounters.skippedPostCount += 1;
          continue;
        }
        if (!shouldQueueNamefiFeedMarketplaceRssItem(item)) {
          feedCounters.skippedPostCount += 1;
          continue;
        }

        const result = await queueMarketplaceRssItem({
          runId: input.runId,
          item,
        });
        if (result.status === 'inserted') {
          feedCounters.queuedPostCount += 1;
        } else if (result.status === 'existing') {
          feedCounters.alreadyExistingCount += 1;
        } else {
          feedCounters.skippedPostCount += 1;
        }
      }

      mergeScanCounters(counters, feedCounters);
      sourceResults.push({
        source: feed.source,
        feedId: feed.id,
        feedUrl: feed.url,
        skipped: false,
        reason: null,
        scannedPostCount: feedCounters.scannedPostCount,
        queuedPostCount: feedCounters.queuedPostCount,
        alreadyExistingCount: feedCounters.alreadyExistingCount,
        skippedPostCount: feedCounters.skippedPostCount,
        latestCursorAt: feedCounters.latestCursorAt?.toISOString() ?? null,
      });
    } catch (error) {
      const message = describeError(
        error,
        'Failed to scan marketplace RSS feed.',
      );
      logger.warn({ error, feed }, 'Namefi feed marketplace RSS scan failed');
      sourceResults.push({
        source: feed.source,
        feedId: feed.id,
        feedUrl: feed.url,
        skipped: true,
        reason: 'feed_scan_failed',
        scannedPostCount: feedCounters.scannedPostCount,
        queuedPostCount: feedCounters.queuedPostCount,
        alreadyExistingCount: feedCounters.alreadyExistingCount,
        skippedPostCount: feedCounters.skippedPostCount,
        latestCursorAt: feedCounters.latestCursorAt?.toISOString() ?? null,
        errorMessage: message,
      });
    }
  }

  return { counters, sourceResults };
}

async function queueMarketplaceRssItem(input: {
  runId: string;
  item: NamefiFeedMarketplaceRssItem;
}): Promise<PostInsertResult> {
  const { item } = input;

  return insertNamefiFeedPostRecord({
    runId: input.runId,
    externalSource: item.feed.source,
    externalPostId: item.externalPostId,
    externalConversationId: item.guid || item.externalPostId,
    externalAuthorId:
      item.authorRaw ?? item.authorUsername ?? `${item.feed.source}:unknown`,
    authorUsername: item.authorUsername,
    authorDisplayName: item.authorDisplayName,
    text: item.text,
    source: 'auto_scan',
    rawPayload: buildMarketplaceRssRawPayload(item) as Json,
    postedAt: item.postedAt,
    requeueExistingContentHash: item.contentHash,
  });
}

async function fetchMarketplaceRssXml(
  feed: NamefiFeedMarketplaceRssFeed,
): Promise<string> {
  for (
    let attempt = 1;
    attempt <= MARKETPLACE_RSS_MAX_REQUEST_ATTEMPTS;
    attempt += 1
  ) {
    const response = await fetch(feed.url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(MARKETPLACE_RSS_REQUEST_TIMEOUT_MS),
      headers: {
        Accept:
          'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
        'User-Agent': 'NamefiFeedBot/1.0 (+https://namefi.io)',
      },
    }).catch((error) => {
      if (attempt < MARKETPLACE_RSS_MAX_REQUEST_ATTEMPTS) {
        return null;
      }
      throw error;
    });

    if (!response) {
      await sleep(resolveMarketplaceRssRetryDelayMs(null, attempt));
      continue;
    }

    if (response.ok) {
      return await response.text();
    }

    const body = await response.text().catch(() => '');
    if (
      attempt < MARKETPLACE_RSS_MAX_REQUEST_ATTEMPTS &&
      X_RETRYABLE_STATUS_CODES.has(response.status)
    ) {
      await sleep(resolveMarketplaceRssRetryDelayMs(response, attempt));
      continue;
    }

    throw new Error(
      `Marketplace RSS request for ${feed.id} failed with ${response.status}: ${body.slice(
        0,
        500,
      )}`,
    );
  }

  throw new Error(`Marketplace RSS request for ${feed.id} failed.`);
}

function resolveMarketplaceRssRetryDelayMs(
  response: Response | null,
  attempt: number,
): number {
  const retryAfter = response?.headers.get('retry-after') ?? null;
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return clamp(
      retryAfterSeconds * 1_000,
      0,
      MARKETPLACE_RSS_MAX_RETRY_DELAY_MS,
    );
  }

  return clamp(
    MARKETPLACE_RSS_DEFAULT_RETRY_DELAY_MS * 2 ** (attempt - 1),
    MARKETPLACE_RSS_DEFAULT_RETRY_DELAY_MS,
    MARKETPLACE_RSS_MAX_RETRY_DELAY_MS,
  );
}

function buildMarketplaceRssRawPayload(item: NamefiFeedMarketplaceRssItem) {
  return {
    source: item.feed.source,
    feedId: item.feed.id,
    feedTitle: item.feed.title,
    feedUrl: item.feed.url,
    guid: item.guid,
    link: item.link,
    sourceUrl: item.sourceUrl,
    category: item.category,
    title: item.title,
    description: item.description,
    contentHtml: item.contentHtml,
    author: item.authorRaw,
    candidateUrls: item.candidateUrls,
    domains: item.domains,
    contentHash: item.contentHash,
  };
}

async function scanNamefiFeedQueryPages(input: {
  runId: string;
  bearerToken: string;
  query: string;
  startTime: string;
  maxPages: number;
  maxResults: number;
  maxTweetAgeMinutes: number;
}): Promise<ScanCounters> {
  const counters = createScanCounters();
  let nextToken: string | null = null;

  for (let pageIndex = 0; pageIndex < input.maxPages; pageIndex += 1) {
    const response = await searchRecentTweets({
      bearerToken: input.bearerToken,
      query: input.query,
      startTime: input.startTime,
      maxResults: input.maxResults,
      nextToken,
    });

    mergeScanCounters(
      counters,
      await queueSearchResponseTweets({
        runId: input.runId,
        response,
        maxTweetAgeMinutes: input.maxTweetAgeMinutes,
      }),
    );

    nextToken = response.meta?.next_token ?? null;
    if (!nextToken) {
      break;
    }
  }

  return counters;
}

async function queueSearchResponseTweets(input: {
  runId: string;
  response: XApiResponse<XTweet[]>;
  maxTweetAgeMinutes: number;
}): Promise<ScanCounters> {
  const counters = createScanCounters();
  const usersById = new Map(
    (input.response.includes?.users ?? []).map(
      (user) => [user.id, user] as const,
    ),
  );

  for (const tweet of input.response.data ?? []) {
    counters.scannedPostCount += 1;
    counters.latestCursorAt = resolveLatestDate(
      counters.latestCursorAt,
      tweet.created_at,
    );
    if (!isTweetFresh(tweet, input.maxTweetAgeMinutes)) {
      counters.skippedPostCount += 1;
      continue;
    }

    const result = await queueAutoScannedTweet({
      runId: input.runId,
      tweet,
      author: usersById.get(tweet.author_id ?? ''),
    });
    if (result.status === 'inserted') {
      counters.queuedPostCount += 1;
    } else if (result.status === 'existing') {
      counters.alreadyExistingCount += 1;
    } else {
      counters.skippedPostCount += 1;
    }
  }

  return counters;
}

async function queueAutoScannedTweet(input: {
  runId: string;
  tweet: XTweet;
  author?: XUser;
}): Promise<PostInsertResult> {
  const content = normalizeXPostContent(input.tweet);
  if (!shouldQueueAutoScannedTweet(content)) {
    return { status: 'skipped', reason: 'No candidate domain found.' };
  }

  return insertNamefiFeedPost({
    runId: input.runId,
    tweet: input.tweet,
    author: input.author,
    source: 'auto_scan',
    normalizedText: content.text,
    candidateUrls: content.candidateUrls,
    domains: content.domains,
  });
}

function createScanCounters(): ScanCounters {
  return {
    scannedPostCount: 0,
    queuedPostCount: 0,
    alreadyExistingCount: 0,
    skippedPostCount: 0,
    latestCursorAt: null,
  };
}

function createSkippedSourceResult(
  source: NamefiFeedAutoScanSource,
  reason: string,
): NamefiFeedScanSourceResult {
  return {
    source,
    skipped: true,
    reason,
    scannedPostCount: 0,
    queuedPostCount: 0,
    alreadyExistingCount: 0,
    skippedPostCount: 0,
    latestCursorAt: null,
  };
}

function didSkipEveryRequestedSource(
  sourceResults: NamefiFeedScanSourceResult[],
  counters: ScanCounters,
) {
  return (
    sourceResults.length > 0 &&
    sourceResults.every((result) => result.skipped) &&
    counters.scannedPostCount === 0 &&
    counters.queuedPostCount === 0 &&
    counters.alreadyExistingCount === 0 &&
    counters.skippedPostCount === 0
  );
}

function resolveSkippedScanReason(sourceResults: NamefiFeedScanSourceResult[]) {
  if (sourceResults.length === 1) {
    return sourceResults[0]?.reason ?? 'all_sources_unavailable';
  }

  return 'all_sources_unavailable';
}

function mergeScanCounters(target: ScanCounters, source: ScanCounters) {
  target.scannedPostCount += source.scannedPostCount;
  target.queuedPostCount += source.queuedPostCount;
  target.alreadyExistingCount += source.alreadyExistingCount;
  target.skippedPostCount += source.skippedPostCount;
  if (
    source.latestCursorAt &&
    (!target.latestCursorAt || source.latestCursorAt > target.latestCursorAt)
  ) {
    target.latestCursorAt = source.latestCursorAt;
  }
}

export async function ingestManualNamefiFeedXPosts(input: {
  runId: string;
  bearerToken?: string | null;
  tweets: string[];
  includeReplies?: boolean;
}): Promise<NamefiFeedManualIngestResult> {
  const settings = await getNamefiFeedSettingsRow();
  if (
    !readNamefiFeedEnabledSourcesFromMetadata(settings.metadata).includes('x')
  ) {
    throw new Error('Namefi Feed X source is disabled.');
  }

  if (!input.bearerToken) {
    throw new NamefiFeedXConfigurationError();
  }

  const state: ManualIngestState = {
    seenTweetIds: new Set<string>(),
    issues: [],
    queuedPostCount: 0,
    rootPostsQueued: 0,
    replyPostsQueued: 0,
    alreadyExistingCount: 0,
  };

  for (const tweetInput of input.tweets) {
    await ingestManualTweetInput({
      runId: input.runId,
      bearerToken: input.bearerToken,
      tweetInput,
      includeReplies: Boolean(input.includeReplies),
      state,
    });
  }

  const result: NamefiFeedManualIngestResult = {
    queuedPostCount: state.queuedPostCount,
    rootPostsQueued: state.rootPostsQueued,
    replyPostsQueued: state.replyPostsQueued,
    alreadyExistingCount: state.alreadyExistingCount,
    issues: state.issues,
  };
  await persistManualCounts(input.runId, result);
  return result;
}

async function ingestManualTweetInput(input: {
  runId: string;
  bearerToken: string;
  tweetInput: string;
  includeReplies: boolean;
  state: ManualIngestState;
}) {
  const tweetId = reserveManualTweetId(input.tweetInput, input.state);
  if (!tweetId) {
    return;
  }

  let fetchIssueRecorded = false;
  const root = await fetchTweetWithAuthor(input.bearerToken, tweetId).catch(
    (error) => {
      fetchIssueRecorded = true;
      input.state.issues.push({
        tweet: input.tweetInput,
        reason: describeError(error, 'Failed to fetch tweet.'),
      });
      return null;
    },
  );
  if (!root) {
    if (!fetchIssueRecorded) {
      input.state.issues.push({
        tweet: input.tweetInput,
        reason: 'Tweet was not found.',
      });
    }
    return;
  }

  await queueManualTweet({
    runId: input.runId,
    tweet: root.tweet,
    author: root.author,
    issueTweet: input.tweetInput,
    countAs: 'root',
    state: input.state,
  });

  if (input.includeReplies) {
    await queueManualReplies({
      runId: input.runId,
      bearerToken: input.bearerToken,
      root,
      issueTweet: input.tweetInput,
      state: input.state,
    });
  }
}

function reserveManualTweetId(
  tweetInput: string,
  state: ManualIngestState,
): string | null {
  const tweetId = extractTweetId(tweetInput);
  if (!tweetId) {
    state.issues.push({
      tweet: tweetInput,
      reason: 'Invalid tweet URL or ID.',
    });
    return null;
  }
  if (state.seenTweetIds.has(tweetId)) {
    return null;
  }

  state.seenTweetIds.add(tweetId);
  return tweetId;
}

async function queueManualReplies(input: {
  runId: string;
  bearerToken: string;
  root: { tweet: XTweet; author?: XUser };
  issueTweet: string;
  state: ManualIngestState;
}) {
  const conversationId =
    input.root.tweet.conversation_id ?? input.root.tweet.id;
  const replies = await fetchConversationReplies(
    input.bearerToken,
    conversationId,
  ).catch((error) => {
    input.state.issues.push({
      tweet: input.issueTweet,
      reason: describeError(error, 'Failed to fetch replies.'),
    });
    return [];
  });

  for (const reply of replies) {
    if (
      reply.tweet.id === input.root.tweet.id ||
      input.state.seenTweetIds.has(reply.tweet.id)
    ) {
      continue;
    }
    input.state.seenTweetIds.add(reply.tweet.id);

    await queueManualTweet({
      runId: input.runId,
      tweet: reply.tweet,
      author: reply.author,
      issueTweet: reply.tweet.id,
      countAs: 'reply',
      state: input.state,
    });
  }
}

async function queueManualTweet(input: {
  runId: string;
  tweet: XTweet;
  author?: XUser;
  issueTweet: string;
  countAs: 'root' | 'reply';
  state: ManualIngestState;
}) {
  const insert = await insertNamefiFeedPostFromX({
    runId: input.runId,
    tweet: input.tweet,
    author: input.author,
    source: 'manual',
  });

  if (insert.status === 'inserted') {
    input.state.queuedPostCount += 1;
    if (input.countAs === 'root') {
      input.state.rootPostsQueued += 1;
    } else {
      input.state.replyPostsQueued += 1;
    }
  } else if (insert.status === 'existing') {
    input.state.alreadyExistingCount += 1;
  } else {
    input.state.issues.push({
      tweet: input.issueTweet,
      reason: insert.reason,
    });
  }
}

export async function processPendingNamefiFeedPosts(input: {
  runId: string;
  limit?: number;
}): Promise<NamefiFeedProcessResult> {
  await resetStaleProcessingPosts(input.runId);
  const settings = await getNamefiFeedSettingsRow();
  const maxPostsProcessedPerRun =
    readNamefiFeedMaxPostsProcessedPerRunFromMetadata(settings.metadata);
  const alreadyAttemptedPostCount = await countPostsForRunByStatuses(
    input.runId,
    ['processed', 'skipped', 'failed'],
  );
  const budgetRemaining = Math.max(
    0,
    maxPostsProcessedPerRun - alreadyAttemptedPostCount,
  );

  const result: NamefiFeedProcessResult = {
    processedPostCount: 0,
    listingUpsertedCount: 0,
    logoCandidateDomains: [],
    skippedPostCount: 0,
    failedPostCount: 0,
    remainingPostCount: 0,
    budgetExhausted: budgetRemaining === 0,
    maxPostsProcessedPerRun,
    budgetRemaining,
  };

  if (budgetRemaining === 0) {
    result.remainingPostCount = await countPostsForRunByStatus(
      input.runId,
      'pending',
    );
    await persistProcessCounts(input.runId);
    return result;
  }

  const posts = await db
    .select()
    .from(namefiFeedPostsTable)
    .where(
      and(
        eq(namefiFeedPostsTable.ingestionRunId, input.runId),
        eq(namefiFeedPostsTable.status, 'pending'),
      ),
    )
    .orderBy(asc(namefiFeedPostsTable.createdAt))
    .limit(clamp(Math.min(input.limit ?? 50, budgetRemaining), 1, 100));

  for (const post of posts) {
    const [claimed] = await db
      .update(namefiFeedPostsTable)
      .set({ status: 'processing' })
      .where(
        and(
          eq(namefiFeedPostsTable.id, post.id),
          eq(namefiFeedPostsTable.status, 'pending'),
        ),
      )
      .returning({ id: namefiFeedPostsTable.id });

    if (!claimed) {
      continue;
    }

    try {
      const opportunity = await analyseNamefiFeedPostForDomainSale({
        postText: post.text,
        authorUsername: post.authorUsername,
        candidateUrls: extractCandidateUrlsFromRawPayload(post.rawPayload),
      });
      const upsertResult = await upsertListingsFromOpportunity({
        post,
        opportunity,
      });

      if (upsertResult.upsertedCount === 0) {
        await markPostSkipped(
          post.id,
          opportunity.summary ?? 'No listing found.',
        );
        result.skippedPostCount += 1;
        continue;
      }

      await db
        .update(namefiFeedPostsTable)
        .set({
          status: 'processed',
          processedAt: new Date(),
          skipReason: null,
          failureReason: null,
        })
        .where(eq(namefiFeedPostsTable.id, post.id));
      result.processedPostCount += 1;
      result.listingUpsertedCount += upsertResult.upsertedCount;
      for (const domain of upsertResult.logoCandidateDomains) {
        if (!result.logoCandidateDomains.includes(domain)) {
          result.logoCandidateDomains.push(domain);
        }
      }
    } catch (error) {
      const message = describeError(error, 'Failed to process post.');
      logger.warn({ error, postId: post.id }, 'Namefi feed post failed');
      await db
        .update(namefiFeedPostsTable)
        .set({
          status: 'failed',
          failureReason: message,
          processedAt: new Date(),
        })
        .where(eq(namefiFeedPostsTable.id, post.id));
      result.failedPostCount += 1;
    }
  }

  result.remainingPostCount = await countPostsForRunByStatus(
    input.runId,
    'pending',
  );
  const attemptedPostCount =
    alreadyAttemptedPostCount +
    result.processedPostCount +
    result.skippedPostCount +
    result.failedPostCount;
  result.budgetRemaining = Math.max(
    0,
    maxPostsProcessedPerRun - attemptedPostCount,
  );
  result.budgetExhausted = result.budgetRemaining === 0;
  await persistProcessCounts(input.runId);
  return result;
}

export async function completeNamefiFeedIngestionRun(input: {
  runId: string;
  status?: 'completed' | 'skipped';
  metadata?: Record<string, Json>;
}) {
  const metadata = input.metadata
    ? mergeNamefiFeedIngestionRunMetadata(input.metadata)
    : undefined;
  const [updated] = await db
    .update(namefiFeedIngestionRunsTable)
    .set({
      status: input.status ?? 'completed',
      finishedAt: new Date(),
      ...(metadata ? { metadata } : {}),
    })
    .where(eq(namefiFeedIngestionRunsTable.id, input.runId))
    .returning({ id: namefiFeedIngestionRunsTable.id });
  if (!updated) {
    throw new Error('Namefi feed ingestion run not found.');
  }
  await touchNamefiFeedLastRunAt();
}

export async function failNamefiFeedIngestionRun(input: {
  runId: string;
  errorMessage: string;
}) {
  const [updated] = await db
    .update(namefiFeedIngestionRunsTable)
    .set({
      status: 'failed',
      finishedAt: new Date(),
      errorMessage: input.errorMessage,
    })
    .where(eq(namefiFeedIngestionRunsTable.id, input.runId))
    .returning({ id: namefiFeedIngestionRunsTable.id });
  if (!updated) {
    throw new Error('Namefi feed ingestion run not found.');
  }
  await touchNamefiFeedLastRunAt();
}

function buildTemporalRunMetadata(
  temporalRunId?: string | null,
): Record<string, Json> {
  const normalizedTemporalRunId = temporalRunId?.trim();
  return normalizedTemporalRunId
    ? { temporalRunId: normalizedTemporalRunId }
    : {};
}

function mergeNamefiFeedIngestionRunMetadata(metadata: Record<string, Json>) {
  return sql`${namefiFeedIngestionRunsTable.metadata} || ${JSON.stringify(
    metadata,
  )}::jsonb`;
}

async function insertNamefiFeedPostFromX(input: {
  runId: string;
  tweet: XTweet;
  author?: XUser;
  source: 'auto_scan' | 'manual';
}): Promise<PostInsertResult> {
  const content = normalizeXPostContent(input.tweet);
  return insertNamefiFeedPost({
    ...input,
    normalizedText: content.text,
    candidateUrls: content.candidateUrls,
    domains: content.domains,
    requeueExisting: input.source === 'manual',
  });
}

async function insertNamefiFeedPost(input: {
  runId: string;
  tweet: XTweet;
  author?: XUser;
  source: 'auto_scan' | 'manual';
  normalizedText: string;
  candidateUrls: string[];
  domains: string[];
  requeueExisting?: boolean;
}): Promise<PostInsertResult> {
  const tweetText = normalizeOptionalText(input.normalizedText);
  if (!tweetText) {
    return { status: 'skipped', reason: 'Tweet has no text.' };
  }

  const postedAt = input.tweet.created_at
    ? new Date(input.tweet.created_at)
    : new Date();
  if (Number.isNaN(postedAt.getTime())) {
    return { status: 'skipped', reason: 'Tweet has an invalid created_at.' };
  }

  return insertNamefiFeedPostRecord({
    runId: input.runId,
    externalSource: 'x',
    externalPostId: input.tweet.id,
    externalConversationId: input.tweet.conversation_id ?? null,
    externalAuthorId: resolveTweetExternalAuthorId(input.tweet),
    authorUsername: input.author?.username ?? null,
    authorDisplayName: input.author?.name ?? null,
    text: tweetText,
    source: input.source,
    rawPayload: buildRawPayload({
      ...input,
      normalizedText: tweetText,
    }) as Json,
    postedAt,
    requeueExisting: input.requeueExisting,
    requeueExistingContentHash: input.requeueExisting
      ? hashNamefiFeedPostContent({
          candidateUrls: input.candidateUrls,
          domains: input.domains,
          text: tweetText,
        })
      : null,
  });
}

async function insertNamefiFeedPostRecord(input: {
  runId: string;
  externalSource: 'x' | NamefiFeedMarketplaceRssSource;
  externalPostId: string;
  externalConversationId: string | null;
  externalAuthorId: string;
  authorUsername: string | null;
  authorDisplayName: string | null;
  text: string;
  source: NamefiFeedPostQueueSource;
  rawPayload: Json;
  postedAt: Date;
  requeueExisting?: boolean;
  requeueExistingContentHash?: string | null;
}): Promise<PostInsertResult> {
  const postText = normalizeOptionalText(input.text);
  if (!postText) {
    return { status: 'skipped', reason: 'Post has no text.' };
  }
  if (Number.isNaN(input.postedAt.getTime())) {
    return { status: 'skipped', reason: 'Post has an invalid postedAt.' };
  }

  const values = {
    ingestionRunId: input.runId,
    externalSource: input.externalSource,
    externalPostId: input.externalPostId,
    externalConversationId: input.externalConversationId,
    externalAuthorId: input.externalAuthorId,
    authorUsername: input.authorUsername,
    authorDisplayName: input.authorDisplayName,
    text: postText,
    source: input.source,
    rawPayload: input.rawPayload,
    postedAt: input.postedAt,
  };

  const insertBuilder = db.insert(namefiFeedPostsTable).values(values);
  const conflictUpdateWhere = input.requeueExistingContentHash
    ? and(
        inArray(namefiFeedPostsTable.status, REQUEUEABLE_POST_STATUSES),
        sql`(${namefiFeedPostsTable.rawPayload}->>'contentHash' IS DISTINCT FROM ${input.requeueExistingContentHash} OR ${namefiFeedPostsTable.text} IS DISTINCT FROM ${postText})`,
      )
    : input.requeueExisting
      ? inArray(namefiFeedPostsTable.status, REQUEUEABLE_POST_STATUSES)
      : null;
  const [inserted] = conflictUpdateWhere
    ? await insertBuilder
        .onConflictDoUpdate({
          target: [
            namefiFeedPostsTable.externalSource,
            namefiFeedPostsTable.externalPostId,
          ],
          setWhere: conflictUpdateWhere,
          set: {
            ingestionRunId: input.runId,
            externalConversationId: values.externalConversationId,
            externalAuthorId: values.externalAuthorId,
            authorUsername: values.authorUsername,
            authorDisplayName: values.authorDisplayName,
            text: values.text,
            source: values.source,
            status: 'pending',
            rawPayload: values.rawPayload,
            postedAt: values.postedAt,
            processedAt: null,
            failureReason: null,
            skipReason: null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: namefiFeedPostsTable.id })
    : await insertBuilder.onConflictDoNothing().returning({
        id: namefiFeedPostsTable.id,
      });

  return inserted
    ? { status: 'inserted', id: inserted.id }
    : { status: 'existing' };
}

async function upsertListingsFromOpportunity({
  post,
  opportunity,
}: {
  post: typeof namefiFeedPostsTable.$inferSelect;
  opportunity: NamefiFeedDomainSaleOpportunity;
}): Promise<{
  upsertedCount: number;
  logoCandidateDomains: NamefiNormalizedDomain[];
}> {
  if (
    opportunity.status !== 'domain_sale_detected' ||
    opportunity.domains.length === 0
  ) {
    return { upsertedCount: 0, logoCandidateDomains: [] };
  }

  const values = buildListingUpsertValues({ post, opportunity });
  if (values.length === 0) {
    return { upsertedCount: 0, logoCandidateDomains: [] };
  }

  const now = new Date();
  const rows = await db
    .insert(namefiFeedListingsTable)
    .values(values)
    .onConflictDoUpdate({
      target: [namefiFeedListingsTable.postId, namefiFeedListingsTable.domain],
      set: {
        askingPrice: sql`excluded.asking_price`,
        askingCurrency: sql`excluded.asking_currency`,
        purchaseUrl: sql`excluded.purchase_url`,
        sellerUsername: sql`excluded.seller_username`,
        sellerDisplayName: sql`excluded.seller_display_name`,
        sourceUrl: sql`excluded.source_url`,
        messageText: sql`excluded.message_text`,
        listedAt: sql`excluded.listed_at`,
        postedAt: sql`excluded.posted_at`,
        endedAt: null,
        endReason: null,
        updatedAt: now,
      },
    })
    .returning({ id: namefiFeedListingsTable.id });

  return {
    upsertedCount: rows.length,
    logoCandidateDomains: values.map((value) => value.domain),
  };
}

function buildListingUpsertValues({
  post,
  opportunity,
}: {
  post: typeof namefiFeedPostsTable.$inferSelect;
  opportunity: NamefiFeedDomainSaleOpportunity;
}) {
  const valuesByDomain = new Map<
    string,
    typeof namefiFeedListingsTable.$inferInsert
  >();

  for (const domain of opportunity.domains) {
    const normalizedDomain = normalizeSaleDomain(domain.domain);
    if (!normalizedDomain) {
      continue;
    }
    const price = normalizePriceAndCurrency({
      askingPrice: domain.askingPrice,
      askingCurrency: domain.askingCurrency,
    });

    const value: typeof namefiFeedListingsTable.$inferInsert = {
      postId: post.id,
      domain: normalizedDomain,
      askingPrice: price.askingPrice,
      askingCurrency: price.askingCurrency,
      purchaseUrl: normalizePublicHttpUrl(domain.purchaseUrl),
      sellerUsername: post.authorUsername,
      sellerDisplayName: post.authorDisplayName,
      sourceUrl: resolvePostSourceUrl(post),
      messageText: post.text,
      listedAt: new Date(),
      postedAt: post.postedAt,
    };
    const current = valuesByDomain.get(normalizedDomain);
    if (!current) {
      valuesByDomain.set(normalizedDomain, value);
      continue;
    }

    valuesByDomain.set(normalizedDomain, {
      ...current,
      askingPrice: value.askingPrice ?? current.askingPrice,
      askingCurrency: value.askingCurrency ?? current.askingCurrency,
      purchaseUrl: value.purchaseUrl ?? current.purchaseUrl,
    });
  }

  return Array.from(valuesByDomain.values());
}

function resolvePostSourceUrl(
  post: typeof namefiFeedPostsTable.$inferSelect,
): string {
  if (post.externalSource === 'x') {
    return buildTweetUrl(post.externalPostId);
  }

  const sourceUrl = extractStringFromRawPayload(post.rawPayload, 'sourceUrl');
  const link = extractStringFromRawPayload(post.rawPayload, 'link');
  return (
    normalizePublicHttpUrl(sourceUrl) ??
    normalizePublicHttpUrl(link) ??
    'https://namefi.io/feed'
  );
}

async function markPostSkipped(postId: string, reason: string) {
  await db
    .update(namefiFeedPostsTable)
    .set({
      status: 'skipped',
      skipReason: reason,
      processedAt: new Date(),
    })
    .where(eq(namefiFeedPostsTable.id, postId));
}

async function persistScanCounts(runId: string, result: NamefiFeedScanResult) {
  await db
    .update(namefiFeedIngestionRunsTable)
    .set({
      scannedPostCount: result.scannedPostCount,
      queuedPostCount: result.queuedPostCount,
      skippedPostCount: 0,
    })
    .where(eq(namefiFeedIngestionRunsTable.id, runId));
}

async function persistManualCounts(
  runId: string,
  result: NamefiFeedManualIngestResult,
) {
  await db
    .update(namefiFeedIngestionRunsTable)
    .set({
      scannedPostCount:
        result.queuedPostCount +
        result.alreadyExistingCount +
        result.issues.length,
      queuedPostCount: result.queuedPostCount,
    })
    .where(eq(namefiFeedIngestionRunsTable.id, runId));
}

async function persistProcessCounts(runId: string) {
  const [
    processedPostCount,
    skippedPostCount,
    failedPostCount,
    listingUpsertedCount,
  ] = await Promise.all([
    countPostsForRunByStatus(runId, 'processed'),
    countPostsForRunByStatus(runId, 'skipped'),
    countPostsForRunByStatus(runId, 'failed'),
    countListingsForRun(runId),
  ]);

  await db
    .update(namefiFeedIngestionRunsTable)
    .set({
      processedPostCount,
      listingUpsertedCount,
      skippedPostCount,
      failedPostCount,
    })
    .where(eq(namefiFeedIngestionRunsTable.id, runId));
}

async function resetStaleProcessingPosts(runId: string) {
  const staleBefore = new Date(Date.now() - PROCESSING_POST_STALE_MS);
  await db
    .update(namefiFeedPostsTable)
    .set({
      status: 'pending',
      processedAt: null,
      failureReason: null,
      skipReason: null,
    })
    .where(
      and(
        eq(namefiFeedPostsTable.ingestionRunId, runId),
        eq(namefiFeedPostsTable.status, 'processing'),
        lt(namefiFeedPostsTable.updatedAt, staleBefore),
      ),
    );
}

async function countPostsForRunByStatus(
  runId: string,
  status: 'pending' | 'processed' | 'skipped' | 'failed',
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedPostsTable)
    .where(
      and(
        eq(namefiFeedPostsTable.ingestionRunId, runId),
        eq(namefiFeedPostsTable.status, status),
      ),
    );
  return Number(row?.value ?? 0);
}

async function countPostsForRunByStatuses(
  runId: string,
  statuses: Array<'processed' | 'skipped' | 'failed'>,
): Promise<number> {
  if (statuses.length === 0) {
    return 0;
  }

  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedPostsTable)
    .where(
      and(
        eq(namefiFeedPostsTable.ingestionRunId, runId),
        inArray(namefiFeedPostsTable.status, statuses),
      ),
    );
  return Number(row?.value ?? 0);
}

async function countListingsForRun(runId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(namefiFeedListingsTable)
    .innerJoin(
      namefiFeedPostsTable,
      eq(namefiFeedPostsTable.id, namefiFeedListingsTable.postId),
    )
    .where(eq(namefiFeedPostsTable.ingestionRunId, runId));
  return Number(row?.value ?? 0);
}

function normalizeXPostContent(tweet: XTweet) {
  const originalText = tweet.text ?? '';
  let text = originalText;
  const entityDomains = new Set<string>();
  const candidateUrls = new Set<string>();

  for (const entity of tweet.entities?.urls ?? []) {
    const signals = collectXUrlEntitySignals(entity);
    for (const domain of signals.domains) {
      entityDomains.add(domain);
    }
    for (const url of signals.candidateUrls) {
      candidateUrls.add(url);
    }

    if (signals.replacement && entity.url && text.includes(entity.url)) {
      text = text.split(entity.url).join(signals.replacement);
    }
  }

  const textDomains = extractDomainsFromText(text);
  return {
    text,
    domains: mergeDomains(Array.from(entityDomains), textDomains),
    textDomains,
    candidateUrls: Array.from(candidateUrls),
  };
}

function collectXUrlEntitySignals(entity: XUrlEntity): {
  replacement: string | null;
  domains: string[];
  candidateUrls: string[];
} {
  const displayUrl = sanitizeDisplayUrl(entity.display_url);
  const candidates = [
    entity.expanded_url,
    entity.unwound_url,
    displayUrl,
    entity.url,
  ];
  const domains = new Set<string>();
  const candidateUrls = new Set<string>();

  for (const candidate of candidates) {
    const normalizedDomain = candidate ? normalizeSaleDomain(candidate) : null;
    if (normalizedDomain && !isBlockedSaleDomain(normalizedDomain)) {
      domains.add(normalizedDomain);
    }

    const normalizedUrl = normalizeCandidateUrl(candidate);
    if (normalizedUrl) {
      candidateUrls.add(normalizedUrl);
    }
  }

  return {
    replacement:
      entity.expanded_url ?? entity.unwound_url ?? displayUrl ?? null,
    domains: Array.from(domains),
    candidateUrls: Array.from(candidateUrls),
  };
}

function shouldQueueAutoScannedTweet(
  content: ReturnType<typeof normalizeXPostContent>,
) {
  return content.domains.length > 0;
}

function buildRawPayload(input: {
  tweet: XTweet;
  author?: XUser;
  normalizedText: string;
  candidateUrls: string[];
  domains: string[];
}) {
  return {
    source: 'x',
    tweet: input.tweet,
    author: input.author ?? null,
    candidateUrls: input.candidateUrls,
    domains: input.domains,
    contentHash: hashNamefiFeedPostContent({
      candidateUrls: input.candidateUrls,
      domains: input.domains,
      text: input.normalizedText,
    }),
  };
}

function hashNamefiFeedPostContent(input: {
  candidateUrls: string[];
  domains: string[];
  text: string;
}) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        candidateUrls: [...input.candidateUrls].sort(),
        domains: [...input.domains].sort(),
        text: input.text.trim(),
      }),
    )
    .digest('hex');
}

function extractCandidateUrlsFromRawPayload(rawPayload: Json): string[] {
  if (
    !rawPayload ||
    typeof rawPayload !== 'object' ||
    Array.isArray(rawPayload)
  ) {
    return [];
  }
  const value = (rawPayload as Record<string, unknown>).candidateUrls;
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((url): url is string => typeof url === 'string');
}

function extractStringFromRawPayload(
  rawPayload: Json,
  key: string,
): string | null {
  if (
    !rawPayload ||
    typeof rawPayload !== 'object' ||
    Array.isArray(rawPayload)
  ) {
    return null;
  }

  const value = (rawPayload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

async function searchRecentTweets(input: {
  bearerToken: string;
  query: string;
  startTime: string;
  maxResults: number;
  nextToken?: string | null;
}): Promise<XApiResponse<XTweet[]>> {
  const url = new URL(`${X_API_BASE_URL}/tweets/search/recent`);
  url.searchParams.set('query', input.query);
  url.searchParams.set('max_results', String(clamp(input.maxResults, 10, 100)));
  url.searchParams.set('tweet.fields', X_TWEET_FIELDS);
  url.searchParams.set('expansions', 'author_id');
  url.searchParams.set('user.fields', X_USER_FIELDS);
  url.searchParams.set('start_time', input.startTime);
  if (input.nextToken) {
    url.searchParams.set('next_token', input.nextToken);
  }

  return fetchXJson<XApiResponse<XTweet[]>>(input.bearerToken, url);
}

async function fetchTweetWithAuthor(
  bearerToken: string,
  tweetId: string,
): Promise<{ tweet: XTweet; author?: XUser } | null> {
  const url = new URL(`${X_API_BASE_URL}/tweets/${tweetId}`);
  url.searchParams.set('tweet.fields', X_TWEET_FIELDS);
  url.searchParams.set('expansions', 'author_id');
  url.searchParams.set('user.fields', X_USER_FIELDS);

  const response = await fetchXJson<XApiResponse<XTweet>>(bearerToken, url);
  if (!response.data) {
    return null;
  }

  return {
    tweet: response.data,
    author: response.includes?.users?.find(
      (user) => user.id === response.data?.author_id,
    ),
  };
}

async function fetchConversationReplies(
  bearerToken: string,
  conversationId: string,
): Promise<Array<{ tweet: XTweet; author?: XUser }>> {
  const usersById = new Map<string, XUser>();
  const replies: Array<{ tweet: XTweet; author?: XUser }> = [];
  const query = `conversation_id:${conversationId} is:reply`;
  const startTime = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  let nextToken: string | null = null;

  for (
    let pageIndex = 0;
    pageIndex < X_MANUAL_REPLIES_MAX_PAGES;
    pageIndex += 1
  ) {
    const response = await searchRecentTweets({
      bearerToken,
      query,
      startTime,
      maxResults: 100,
      nextToken,
    });

    for (const user of response.includes?.users ?? []) {
      usersById.set(user.id, user);
    }

    for (const tweet of response.data ?? []) {
      replies.push({
        tweet,
        author: usersById.get(tweet.author_id ?? ''),
      });
    }

    nextToken = response.meta?.next_token ?? null;
    if (!nextToken) {
      break;
    }
  }

  return replies;
}

async function fetchXJson<T>(bearerToken: string, url: URL): Promise<T> {
  for (let attempt = 1; attempt <= X_MAX_REQUEST_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(X_REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
    }).catch((error) => {
      if (attempt < X_MAX_REQUEST_ATTEMPTS) {
        return null;
      }
      throw error;
    });

    if (!response) {
      await sleep(resolveXRetryDelayMs(null, attempt));
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    const body = await response.text().catch(() => '');
    if (
      attempt < X_MAX_REQUEST_ATTEMPTS &&
      X_RETRYABLE_STATUS_CODES.has(response.status)
    ) {
      await sleep(resolveXRetryDelayMs(response, attempt));
      continue;
    }

    throw new NamefiFeedXApiError(
      `X API request failed with ${response.status}: ${body.slice(0, 500)}`,
    );
  }

  throw new NamefiFeedXApiError('X API request failed.');
}

function resolveXRetryDelayMs(
  response: Response | null,
  attempt: number,
): number {
  const retryAfter = response?.headers.get('retry-after') ?? null;
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return clamp(retryAfterSeconds * 1_000, 0, X_MAX_RETRY_DELAY_MS);
  }

  const retryAfterDate = retryAfter ? Date.parse(retryAfter) : Number.NaN;
  if (!Number.isNaN(retryAfterDate)) {
    return clamp(retryAfterDate - Date.now(), 0, X_MAX_RETRY_DELAY_MS);
  }

  return clamp(
    X_DEFAULT_RETRY_DELAY_MS * 2 ** (attempt - 1),
    X_DEFAULT_RETRY_DELAY_MS,
    X_MAX_RETRY_DELAY_MS,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveStartTime(input: {
  sinceAt: Date | null;
  maxTweetAgeMinutes: number;
  overlapMinutes: number;
}): string {
  const now = Date.now();
  const fallbackMs = now - input.maxTweetAgeMinutes * 60 * 1000;
  if (!input.sinceAt) {
    return new Date(fallbackMs).toISOString();
  }

  const candidateMs =
    input.sinceAt.getTime() - input.overlapMinutes * 60 * 1000;
  return new Date(Math.max(candidateMs, fallbackMs)).toISOString();
}

function isTweetFresh(tweet: XTweet, maxTweetAgeMinutes: number): boolean {
  if (!tweet.created_at) {
    return false;
  }
  return (
    Date.now() - new Date(tweet.created_at).getTime() <=
    maxTweetAgeMinutes * 60 * 1000
  );
}

function isPostDateFresh(postedAt: Date, maxPostAgeMinutes: number): boolean {
  return Date.now() - postedAt.getTime() <= maxPostAgeMinutes * 60 * 1000;
}

function resolveLatestDate(
  current: Date | null,
  candidate: string | undefined,
) {
  if (!candidate) {
    return current;
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return current;
  }
  return !current || parsed > current ? parsed : current;
}

function resolveTweetExternalAuthorId(tweet: XTweet): string {
  return (
    tweet.author_id ??
    tweet.in_reply_to_user_id ??
    tweet.conversation_id ??
    tweet.id
  );
}

function sanitizeDisplayUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && !trimmed.includes('...') && !trimmed.includes('…')
    ? trimmed
    : null;
}

function normalizeCandidateUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes('...') || trimmed.includes('…')) {
    return null;
  }

  try {
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}
