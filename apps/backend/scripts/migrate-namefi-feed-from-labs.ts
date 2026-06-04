#!/usr/bin/env bun
import {
  buildTweetUrl,
  DEFAULT_NAMEFI_FEED_SEARCH_QUERIES,
  extractDomainsFromText,
  normalizePriceAndCurrency,
  normalizePublicHttpUrl,
  normalizeSaleDomain,
} from '#services/namefi-feed/normalization';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const MIGRATION_WORKFLOW_ID = 'labs-sales-agent-namefi-feed-data-migration';
const DEFAULT_BATCH_SIZE = 250;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type NamefiFeedPostStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'skipped'
  | 'failed';
type NamefiFeedListingReportReason =
  | 'already_sold'
  | 'inaccurate_price'
  | 'not_for_sale'
  | 'duplicate_listing'
  | 'other';
type NamefiFeedListingReportStatus = 'active' | 'resolved';
type NamefiFeedListingReportResolution = 'suppressed_listing' | 'dismissed';

interface Args {
  execute: boolean;
  includeSettings: boolean;
  batchSize: number;
  sourceUrl: string | null;
  targetUrl: string | null;
  allowSameDb: boolean;
}

interface CountRow extends QueryResultRow {
  count: string;
}

interface LabsPostRow extends QueryResultRow {
  id: string;
  message_source: string;
  external_chat_id: string;
  external_message_id: string;
  author_id: string;
  author_metadata: unknown;
  text: string | null;
  raw_payload: unknown;
  external_created_at: Date | string | null;
  status: string;
  last_processed_at: Date | string | null;
  metering_reason: string | null;
  completed_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  listing_domains: string[] | null;
  source_listing_count: string | number;
}

interface LabsListingRow extends QueryResultRow {
  id: string;
  channel_message_id: string;
  domain: string;
  asking_price: string | null;
  asking_currency: string | null;
  purchase_url: string | null;
  logo: unknown;
  suppressed_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  external_message_id: string;
  author_id: string;
  author_metadata: unknown;
  message_text: string | null;
  posted_at: Date | string | null;
}

interface LabsReportRow extends QueryResultRow {
  id: string;
  domain_sale_listing_id: string;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  resolved_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface SourceCounts {
  posts: number;
  listings: number;
  reports: number;
}

interface MigrationCounts {
  postsUpserted: number;
  postsSkipped: number;
  listingsUpserted: number;
  listingsSkipped: number;
  reportsUpserted: number;
  reportsSkipped: number;
  settingsUpserted: number;
}

interface PostMigrationResult {
  counts: Pick<MigrationCounts, 'postsUpserted' | 'postsSkipped'>;
  postIdByLabsMessageId: Map<string, string>;
}

interface ListingMigrationResult {
  counts: Pick<MigrationCounts, 'listingsUpserted' | 'listingsSkipped'>;
  listingIdByLabsListingId: Map<string, string>;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    execute: false,
    includeSettings: true,
    batchSize: DEFAULT_BATCH_SIZE,
    sourceUrl: null,
    targetUrl: null,
    allowSameDb: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        return args;
      case '--execute':
        args.execute = true;
        break;
      case '--dry-run':
        args.execute = false;
        break;
      case '--skip-settings':
        args.includeSettings = false;
        break;
      case '--allow-same-db':
        args.allowSameDb = true;
        break;
      case '--batch-size':
        args.batchSize = parsePositiveInteger(readValue(argv, index, arg), arg);
        index += 1;
        break;
      case '--source-url':
        args.sourceUrl = readValue(argv, index, arg);
        index += 1;
        break;
      case '--target-url':
        args.targetUrl = readValue(argv, index, arg);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printUsage() {
  console.log(`
Migrate Namefi feed data from labs-sales-agent Postgres into Astra.

Required env:
  LABS_DATABASE_URL                    Source labs Postgres URL
  DATABASE_URL                         Target Astra Postgres URL

Optional env:
  NAMEFI_FEED_LABS_DATABASE_URL        Source override, preferred over LABS_DATABASE_URL
  NAMEFI_FEED_TARGET_DATABASE_URL      Target override, preferred over DATABASE_URL
  ASTRA_DATABASE_URL                   Target override, used before DATABASE_URL
  NAMEFI_FEED_SEARCH_QUERIES           Comma-separated target feed queries
  TWITTER_SALE_SEED_QUERIES            Labs-style comma-separated sale queries
  NAMEFI_FEED_LAST_AUTO_SCAN_CURSOR_AT Last scan cursor ISO timestamp
  TWITTER_SALE_LAST_PROCESSED_AT       Labs sale Redis cursor, if exported manually

Run:
  bun --cwd=apps/backend tsx scripts/migrate-namefi-feed-from-labs.ts
  bun --cwd=apps/backend tsx scripts/migrate-namefi-feed-from-labs.ts --execute

Flags:
  --execute             Write data. Without this flag the script only reports counts.
  --dry-run             Report counts only. This is the default.
  --source-url <url>    Source labs Postgres URL. Overrides LABS_DATABASE_URL.
  --target-url <url>    Target Astra Postgres URL. Overrides target env vars.
  --batch-size <n>      Source read batch size. Default: ${DEFAULT_BATCH_SIZE}.
  --skip-settings       Do not upsert namefi_feed_settings.
  --allow-same-db       Allow identical source and target URL strings.
`);
}

function readValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function resolveSourceUrl(args: Args): string {
  const value =
    args.sourceUrl ??
    process.env.NAMEFI_FEED_LABS_DATABASE_URL ??
    process.env.LABS_DATABASE_URL;
  if (!value?.trim()) {
    throw new Error(
      'Missing source DB URL. Set LABS_DATABASE_URL or pass --source-url.',
    );
  }
  return value.trim();
}

function resolveTargetUrl(args: Args): string {
  const value =
    args.targetUrl ??
    process.env.NAMEFI_FEED_TARGET_DATABASE_URL ??
    process.env.ASTRA_DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!value?.trim()) {
    throw new Error(
      'Missing target DB URL. Set DATABASE_URL or pass --target-url.',
    );
  }
  return value.trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceUrl = resolveSourceUrl(args);
  const targetUrl = resolveTargetUrl(args);

  if (sourceUrl === targetUrl && !args.allowSameDb) {
    throw new Error(
      'Source and target database URLs are identical. Refusing to run without --allow-same-db.',
    );
  }

  const sourcePool = new Pool({ connectionString: sourceUrl, max: 4 });
  const targetPool = new Pool({ connectionString: targetUrl, max: 4 });

  try {
    await assertRequiredTables(sourcePool, [
      'channels',
      'messages',
      'domain_sale_listings',
      'domain_sale_listing_reports',
    ]);
    await assertRequiredTables(targetPool, [
      'namefi_feed_settings',
      'namefi_feed_ingestion_runs',
      'namefi_feed_posts',
      'namefi_feed_listings',
      'namefi_feed_listing_reports',
    ]);

    const sourceCounts = await getSourceCounts(sourcePool);
    const targetCounts = await getTargetCounts(targetPool);

    console.log('Namefi feed labs -> Astra data migration');
    console.log(`Mode: ${args.execute ? 'execute' : 'dry-run'}`);
    console.log(
      `Source rows: ${sourceCounts.posts} posts, ${sourceCounts.listings} listings, ${sourceCounts.reports} reports`,
    );
    console.log(
      `Target rows before: ${targetCounts.posts} posts, ${targetCounts.listings} listings, ${targetCounts.reports} reports`,
    );

    if (!args.execute) {
      console.log('Dry run only. Re-run with --execute to write data.');
      return;
    }

    const targetClient = await targetPool.connect();
    try {
      await targetClient.query('BEGIN');
      const runId = await startMigrationRun(targetClient, sourceCounts);
      const postResult = await migratePosts({
        source: sourcePool,
        target: targetClient,
        runId,
        batchSize: args.batchSize,
      });
      const listingResult = await migrateListings({
        source: sourcePool,
        target: targetClient,
        postIdByLabsMessageId: postResult.postIdByLabsMessageId,
        batchSize: args.batchSize,
      });
      const reportCounts = await migrateReports({
        source: sourcePool,
        target: targetClient,
        listingIdByLabsListingId: listingResult.listingIdByLabsListingId,
        batchSize: args.batchSize,
      });
      const settingsUpserted = args.includeSettings
        ? await migrateSettings({ source: sourcePool, target: targetClient })
        : 0;
      const counts: MigrationCounts = {
        ...postResult.counts,
        ...listingResult.counts,
        ...reportCounts,
        settingsUpserted,
      };
      await completeMigrationRun(targetClient, runId, sourceCounts, counts);
      await targetClient.query('COMMIT');

      console.log('Migration committed.');
      console.log(
        `Posts upserted: ${counts.postsUpserted}, skipped: ${counts.postsSkipped}`,
      );
      console.log(
        `Listings upserted: ${counts.listingsUpserted}, skipped: ${counts.listingsSkipped}`,
      );
      console.log(
        `Reports upserted: ${counts.reportsUpserted}, skipped: ${counts.reportsSkipped}`,
      );
      console.log(`Settings upserted: ${counts.settingsUpserted}`);
    } catch (error) {
      await targetClient.query('ROLLBACK');
      throw error;
    } finally {
      targetClient.release();
    }
  } finally {
    await Promise.all([sourcePool.end(), targetPool.end()]);
  }
}

async function assertRequiredTables(
  pool: Pick<Pool, 'query'>,
  tableNames: string[],
) {
  const { rows } = await pool.query<{ table_name: string | null }>(
    `
      SELECT table_name
      FROM unnest($1::text[]) AS missing(table_name)
      WHERE to_regclass('public.' || table_name) IS NULL
    `,
    [tableNames],
  );
  if (rows.length === 0) {
    return;
  }
  throw new Error(
    `Missing required table(s): ${rows.map((row) => row.table_name).join(', ')}`,
  );
}

async function getSourceCounts(pool: Pool): Promise<SourceCounts> {
  const [posts, listings, reports] = await Promise.all([
    countRows(pool, sourcePostsCountSql),
    countRows(pool, 'SELECT count(*) FROM domain_sale_listings'),
    countRows(pool, 'SELECT count(*) FROM domain_sale_listing_reports'),
  ]);

  return { posts, listings, reports };
}

async function getTargetCounts(pool: Pool): Promise<SourceCounts> {
  const [posts, listings, reports] = await Promise.all([
    countRows(pool, 'SELECT count(*) FROM namefi_feed_posts'),
    countRows(pool, 'SELECT count(*) FROM namefi_feed_listings'),
    countRows(pool, 'SELECT count(*) FROM namefi_feed_listing_reports'),
  ]);

  return { posts, listings, reports };
}

async function countRows(pool: Pick<Pool, 'query'>, query: string) {
  const { rows } = await pool.query<CountRow>(query);
  return Number(rows[0]?.count ?? 0);
}

const sourcePostsWhereSql = `
  m.channel = 'twitter'
  AND EXISTS (
    SELECT 1
    FROM domain_sale_listings listing
    WHERE listing.channel_message_id = m.id
  )
`;

const sourcePostsCountSql = `
  SELECT count(*)
  FROM messages m
  WHERE ${sourcePostsWhereSql}
`;

async function startMigrationRun(
  target: PoolClient,
  sourceCounts: SourceCounts,
): Promise<string> {
  const existing = await target.query<{ id: string }>(
    `
      SELECT id
      FROM namefi_feed_ingestion_runs
      WHERE workflow_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [MIGRATION_WORKFLOW_ID],
  );
  const existingId = existing.rows[0]?.id;
  if (existingId) {
    await target.query(
      `
        UPDATE namefi_feed_ingestion_runs
        SET
          status = 'running',
          started_at = now(),
          finished_at = NULL,
          error_message = NULL,
          metadata = $2::jsonb,
          updated_at = now()
        WHERE id = $1
      `,
      [existingId, stringifyJson(buildRunMetadata(sourceCounts))],
    );
    return existingId;
  }

  const inserted = await target.query<{ id: string }>(
    `
      INSERT INTO namefi_feed_ingestion_runs (
        workflow_id,
        trigger,
        status,
        started_at,
        metadata,
        created_at,
        updated_at
      )
      VALUES ($1, 'manual', 'running', now(), $2::jsonb, now(), now())
      RETURNING id
    `,
    [MIGRATION_WORKFLOW_ID, stringifyJson(buildRunMetadata(sourceCounts))],
  );
  const runId = inserted.rows[0]?.id;
  if (!runId) {
    throw new Error('Failed to create Namefi feed migration run.');
  }
  return runId;
}

function buildRunMetadata(
  sourceCounts: SourceCounts,
  counts?: MigrationCounts,
): JsonValue {
  return {
    source: 'labs-sales-agent',
    kind: 'one_time_data_migration',
    sourceCounts: toSourceCountsJson(sourceCounts),
    counts: counts ? toMigrationCountsJson(counts) : null,
  };
}

function toSourceCountsJson(counts: SourceCounts): JsonValue {
  return {
    posts: counts.posts,
    listings: counts.listings,
    reports: counts.reports,
  };
}

function toMigrationCountsJson(counts: MigrationCounts): JsonValue {
  return {
    postsUpserted: counts.postsUpserted,
    postsSkipped: counts.postsSkipped,
    listingsUpserted: counts.listingsUpserted,
    listingsSkipped: counts.listingsSkipped,
    reportsUpserted: counts.reportsUpserted,
    reportsSkipped: counts.reportsSkipped,
    settingsUpserted: counts.settingsUpserted,
  };
}

async function migratePosts(input: {
  source: Pool;
  target: PoolClient;
  runId: string;
  batchSize: number;
}): Promise<PostMigrationResult> {
  const total = await countRows(input.source, sourcePostsCountSql);
  const postIdByLabsMessageId = new Map<string, string>();
  let postsUpserted = 0;
  let postsSkipped = 0;

  for (let offset = 0; offset < total; offset += input.batchSize) {
    const { rows } = await input.source.query<LabsPostRow>(
      `
        WITH selected AS (
          SELECT m.*
          FROM messages m
          WHERE ${sourcePostsWhereSql}
          ORDER BY COALESCE(m.external_created_at, m.created_at, m.updated_at), m.id
          LIMIT $1 OFFSET $2
        )
        SELECT
          selected.id,
          selected.message_source,
          selected.external_chat_id,
          selected.external_message_id,
          selected.author_id,
          selected.author_metadata,
          selected.text,
          selected.raw_payload,
          selected.external_created_at,
          selected.status,
          selected.last_processed_at,
          selected.metering_reason,
          selected.completed_at,
          selected.created_at,
          selected.updated_at,
          COALESCE(listings.domains, ARRAY[]::text[]) AS listing_domains,
          COALESCE(listings.source_listing_count, 0) AS source_listing_count
        FROM selected
        LEFT JOIN LATERAL (
          SELECT
            array_agg(DISTINCT listing.domain) AS domains,
            count(*) AS source_listing_count
          FROM domain_sale_listings listing
          WHERE listing.channel_message_id = selected.id
        ) listings ON true
        ORDER BY COALESCE(selected.external_created_at, selected.created_at, selected.updated_at), selected.id
      `,
      [input.batchSize, offset],
    );

    for (const row of rows) {
      const value = buildPostValue(row, input.runId);
      if (!value) {
        postsSkipped += 1;
        continue;
      }

      const inserted = await input.target.query<{ id: string }>(
        `
          INSERT INTO namefi_feed_posts (
            id,
            ingestion_run_id,
            external_source,
            external_post_id,
            external_conversation_id,
            external_author_id,
            author_username,
            author_display_name,
            text,
            source,
            status,
            raw_payload,
            posted_at,
            processed_at,
            failure_reason,
            skip_reason,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, 'x', $3, $4, $5, $6, $7, $8, $9, $10,
            $11::jsonb, $12, $13, $14, $15, $16, $17
          )
          ON CONFLICT (external_source, external_post_id) DO UPDATE
          SET
            ingestion_run_id = excluded.ingestion_run_id,
            external_conversation_id = excluded.external_conversation_id,
            external_author_id = excluded.external_author_id,
            author_username = excluded.author_username,
            author_display_name = excluded.author_display_name,
            text = excluded.text,
            source = excluded.source,
            status = excluded.status,
            raw_payload = excluded.raw_payload,
            posted_at = excluded.posted_at,
            processed_at = excluded.processed_at,
            failure_reason = excluded.failure_reason,
            skip_reason = excluded.skip_reason,
            created_at = LEAST(namefi_feed_posts.created_at, excluded.created_at),
            updated_at = GREATEST(namefi_feed_posts.updated_at, excluded.updated_at)
          RETURNING id
        `,
        [
          value.id,
          value.ingestionRunId,
          value.externalPostId,
          value.externalConversationId,
          value.externalAuthorId,
          value.authorUsername,
          value.authorDisplayName,
          value.text,
          value.source,
          value.status,
          stringifyJson(value.rawPayload),
          value.postedAt,
          value.processedAt,
          value.failureReason,
          value.skipReason,
          value.createdAt,
          value.updatedAt,
        ],
      );
      const targetPostId = inserted.rows[0]?.id;
      if (!targetPostId) {
        postsSkipped += 1;
        continue;
      }
      postIdByLabsMessageId.set(row.id, targetPostId);
      postsUpserted += 1;
    }

    console.log(
      `Posts: ${Math.min(offset + rows.length, total)}/${total} scanned`,
    );
  }

  return {
    counts: { postsUpserted, postsSkipped },
    postIdByLabsMessageId,
  };
}

function buildPostValue(row: LabsPostRow, runId: string) {
  const externalPostId = normalizeRequiredString(row.external_message_id);
  const externalAuthorId =
    normalizeRequiredString(row.author_id) ??
    normalizeRequiredString(row.external_chat_id) ??
    externalPostId;

  if (!externalPostId || !externalAuthorId) {
    return null;
  }

  const tweet = readRawTweetPayload(row.raw_payload, {
    id: externalPostId,
    text: row.text ?? '',
    author_id: externalAuthorId,
    conversation_id: row.external_chat_id,
    created_at: toIsoString(row.external_created_at),
  });
  const author = readAuthorPayload(row.author_metadata);
  const text = normalizeText(row.text) ?? readString(tweet.text) ?? '';
  const listingDomains = (row.listing_domains ?? []).flatMap((domain) => {
    const normalized = normalizeSaleDomain(domain);
    return normalized ? [normalized] : [];
  });
  const domains = uniqueStrings([
    ...listingDomains,
    ...extractDomainsFromText(text),
  ]);
  const candidateUrls = extractCandidateUrls(tweet);
  const status = mapPostStatus(row);
  const postedAt =
    toDateOrNull(row.external_created_at) ??
    toDateOrNull(row.created_at) ??
    new Date();
  const processedAt =
    status === 'processed' || status === 'failed' || status === 'skipped'
      ? (toDateOrNull(row.last_processed_at) ??
        toDateOrNull(row.completed_at) ??
        toDateOrNull(row.updated_at) ??
        postedAt)
      : null;
  const createdAt = toDateOrNull(row.created_at) ?? postedAt;
  const updatedAt = toDateOrNull(row.updated_at) ?? createdAt;

  return {
    id: row.id,
    ingestionRunId: runId,
    externalPostId,
    externalConversationId: normalizeOptionalString(row.external_chat_id),
    externalAuthorId,
    authorUsername: readString(author?.username),
    authorDisplayName: readString(author?.name),
    text,
    source: 'auto_scan',
    status,
    rawPayload: {
      source: 'x',
      tweet: toJsonValue(tweet),
      author: toJsonValue(author),
      candidateUrls,
      domains,
      legacy: {
        source: 'labs-sales-agent',
        messageId: row.id,
        messageSource: row.message_source,
        status: row.status,
        rawPayload: toJsonValue(row.raw_payload),
      },
    } satisfies JsonValue,
    postedAt,
    processedAt,
    failureReason:
      status === 'failed' ? normalizeOptionalString(row.metering_reason) : null,
    skipReason:
      status === 'skipped'
        ? normalizeOptionalString(row.metering_reason)
        : null,
    createdAt,
    updatedAt,
  };
}

function mapPostStatus(row: LabsPostRow): NamefiFeedPostStatus {
  const sourceListingCount = Number(row.source_listing_count);
  if (Number.isFinite(sourceListingCount) && sourceListingCount > 0) {
    return 'processed';
  }
  switch (row.status) {
    case 'pending':
    case 'processing':
    case 'processed':
    case 'failed':
    case 'skipped':
      return row.status;
    default:
      return 'processed';
  }
}

async function migrateListings(input: {
  source: Pool;
  target: PoolClient;
  postIdByLabsMessageId: Map<string, string>;
  batchSize: number;
}): Promise<ListingMigrationResult> {
  const total = await countRows(
    input.source,
    'SELECT count(*) FROM domain_sale_listings',
  );
  const listingIdByLabsListingId = new Map<string, string>();
  let listingsUpserted = 0;
  let listingsSkipped = 0;

  for (let offset = 0; offset < total; offset += input.batchSize) {
    const { rows } = await input.source.query<LabsListingRow>(
      `
        SELECT
          listing.id,
          listing.channel_message_id,
          listing.domain,
          listing.asking_price,
          listing.asking_currency,
          listing.purchase_url,
          listing.logo,
          listing.suppressed_at,
          listing.created_at,
          listing.updated_at,
          message.external_message_id,
          message.author_id,
          message.author_metadata,
          message.text AS message_text,
          COALESCE(message.external_created_at, listing.created_at) AS posted_at
        FROM domain_sale_listings listing
        INNER JOIN messages message ON message.id = listing.channel_message_id
        ORDER BY listing.created_at, listing.id
        LIMIT $1 OFFSET $2
      `,
      [input.batchSize, offset],
    );

    for (const row of rows) {
      const postId = input.postIdByLabsMessageId.get(row.channel_message_id);
      const value = postId ? buildListingValue(row, postId) : null;
      if (!value) {
        listingsSkipped += 1;
        continue;
      }

      const inserted = await input.target.query<{ id: string }>(
        `
          INSERT INTO namefi_feed_listings (
            id,
            post_id,
            domain,
            logo,
            asking_price,
            asking_currency,
            purchase_url,
            seller_username,
            seller_display_name,
            source_url,
            message_text,
            listed_at,
            posted_at,
            suppressed_at,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16
          )
          ON CONFLICT (domain) DO UPDATE
          SET
            post_id = excluded.post_id,
            logo = COALESCE(excluded.logo, namefi_feed_listings.logo),
            asking_price = excluded.asking_price,
            asking_currency = excluded.asking_currency,
            purchase_url = excluded.purchase_url,
            seller_username = excluded.seller_username,
            seller_display_name = excluded.seller_display_name,
            source_url = excluded.source_url,
            message_text = excluded.message_text,
            listed_at = excluded.listed_at,
            posted_at = excluded.posted_at,
            suppressed_at = COALESCE(namefi_feed_listings.suppressed_at, excluded.suppressed_at),
            created_at = LEAST(namefi_feed_listings.created_at, excluded.created_at),
            updated_at = GREATEST(namefi_feed_listings.updated_at, excluded.updated_at)
          RETURNING id
        `,
        [
          value.id,
          value.postId,
          value.domain,
          stringifyJsonOrNull(value.logo),
          value.askingPrice,
          value.askingCurrency,
          value.purchaseUrl,
          value.sellerUsername,
          value.sellerDisplayName,
          value.sourceUrl,
          value.messageText,
          value.listedAt,
          value.postedAt,
          value.suppressedAt,
          value.createdAt,
          value.updatedAt,
        ],
      );
      const targetListingId = inserted.rows[0]?.id;
      if (!targetListingId) {
        listingsSkipped += 1;
        continue;
      }
      listingIdByLabsListingId.set(row.id, targetListingId);
      listingsUpserted += 1;
    }

    console.log(
      `Listings: ${Math.min(offset + rows.length, total)}/${total} scanned`,
    );
  }

  return {
    counts: { listingsUpserted, listingsSkipped },
    listingIdByLabsListingId,
  };
}

function buildListingValue(row: LabsListingRow, postId: string) {
  const domain = normalizeSaleDomain(row.domain);
  if (!domain) {
    return null;
  }

  const price = normalizePriceAndCurrency({
    askingPrice: row.asking_price,
    askingCurrency: row.asking_currency,
  });
  const author = readAuthorPayload(row.author_metadata);
  const listedAt = toDateOrNull(row.created_at) ?? new Date();
  const postedAt = toDateOrNull(row.posted_at) ?? listedAt;

  return {
    id: row.id,
    postId,
    domain,
    logo: normalizeListingLogo(row.logo),
    askingPrice: price.askingPrice,
    askingCurrency: price.askingCurrency,
    purchaseUrl: normalizePublicHttpUrl(row.purchase_url),
    sellerUsername: readString(author?.username),
    sellerDisplayName: readString(author?.name),
    sourceUrl: buildTweetUrl(row.external_message_id),
    messageText: normalizeText(row.message_text),
    listedAt,
    postedAt,
    suppressedAt: toDateOrNull(row.suppressed_at),
    createdAt: listedAt,
    updatedAt: toDateOrNull(row.updated_at) ?? listedAt,
  };
}

async function migrateReports(input: {
  source: Pool;
  target: PoolClient;
  listingIdByLabsListingId: Map<string, string>;
  batchSize: number;
}): Promise<Pick<MigrationCounts, 'reportsUpserted' | 'reportsSkipped'>> {
  const total = await countRows(
    input.source,
    'SELECT count(*) FROM domain_sale_listing_reports',
  );
  let reportsUpserted = 0;
  let reportsSkipped = 0;

  for (let offset = 0; offset < total; offset += input.batchSize) {
    const { rows } = await input.source.query<LabsReportRow>(
      `
        SELECT
          id,
          domain_sale_listing_id,
          reason,
          details,
          status,
          resolution,
          resolved_at,
          created_at,
          updated_at
        FROM domain_sale_listing_reports
        ORDER BY created_at, id
        LIMIT $1 OFFSET $2
      `,
      [input.batchSize, offset],
    );

    for (const row of rows) {
      const listingId = input.listingIdByLabsListingId.get(
        row.domain_sale_listing_id,
      );
      const value = listingId ? buildReportValue(row, listingId) : null;
      if (!value) {
        reportsSkipped += 1;
        continue;
      }

      const inserted = await input.target.query<{ id: string }>(
        `
          INSERT INTO namefi_feed_listing_reports (
            id,
            listing_id,
            reason,
            details,
            status,
            resolution,
            resolved_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE
          SET
            listing_id = excluded.listing_id,
            reason = excluded.reason,
            details = excluded.details,
            status = excluded.status,
            resolution = excluded.resolution,
            resolved_at = excluded.resolved_at,
            created_at = LEAST(namefi_feed_listing_reports.created_at, excluded.created_at),
            updated_at = GREATEST(namefi_feed_listing_reports.updated_at, excluded.updated_at)
          RETURNING id
        `,
        [
          value.id,
          value.listingId,
          value.reason,
          value.details,
          value.status,
          value.resolution,
          value.resolvedAt,
          value.createdAt,
          value.updatedAt,
        ],
      );
      if (inserted.rows[0]?.id) {
        reportsUpserted += 1;
      } else {
        reportsSkipped += 1;
      }
    }

    console.log(
      `Reports: ${Math.min(offset + rows.length, total)}/${total} scanned`,
    );
  }

  return { reportsUpserted, reportsSkipped };
}

function buildReportValue(row: LabsReportRow, listingId: string) {
  const reason = mapReportReason(row.reason);
  const status = mapReportStatus(row.status);
  const resolution = mapReportResolution(row.resolution);
  if (!reason || !status || (row.resolution && !resolution)) {
    return null;
  }

  const createdAt = toDateOrNull(row.created_at) ?? new Date();
  return {
    id: row.id,
    listingId,
    reason,
    details: normalizeOptionalString(row.details),
    status,
    resolution,
    resolvedAt: toDateOrNull(row.resolved_at),
    createdAt,
    updatedAt: toDateOrNull(row.updated_at) ?? createdAt,
  };
}

function mapReportReason(value: string): NamefiFeedListingReportReason | null {
  switch (value) {
    case 'already_sold':
    case 'inaccurate_price':
    case 'not_for_sale':
    case 'duplicate_listing':
    case 'other':
      return value;
    default:
      return null;
  }
}

function mapReportStatus(value: string): NamefiFeedListingReportStatus | null {
  switch (value) {
    case 'active':
    case 'resolved':
      return value;
    default:
      return null;
  }
}

function mapReportResolution(
  value: string | null,
): NamefiFeedListingReportResolution | null {
  switch (value) {
    case null:
    case '':
      return null;
    case 'suppressed_listing':
    case 'dismissed':
      return value;
    default:
      return null;
  }
}

async function migrateSettings(input: {
  source: Pool;
  target: PoolClient;
}): Promise<number> {
  const { rows } = await input.source.query<{ metadata: unknown }>(
    `
      SELECT metadata
      FROM channels
      WHERE channel = 'twitter'
      LIMIT 1
    `,
  );
  const sourceMetadata = readRecord(rows[0]?.metadata);
  const autoScanEnabled =
    typeof sourceMetadata?.saleAutoScanEnabled === 'boolean'
      ? sourceMetadata.saleAutoScanEnabled
      : true;
  const cursor = resolveLastAutoScanCursorAt();
  const settings = {
    autoScanEnabled,
    searchQueries: resolveSearchQueries(),
    maxQueries: resolvePositiveIntegerEnv('NAMEFI_FEED_MAX_QUERIES', 3),
    maxPagesPerQuery: resolvePositiveIntegerEnv(
      'NAMEFI_FEED_MAX_PAGES_PER_QUERY',
      1,
    ),
    maxTweetsPerQuery:
      resolvePositiveIntegerEnv('NAMEFI_FEED_MAX_TWEETS_PER_QUERY', 0) ||
      resolvePositiveIntegerEnv('TWITTER_SALE_MAX_TWEETS_PER_QUERY', 10),
    maxTweetAgeMinutes:
      resolvePositiveIntegerEnv('NAMEFI_FEED_MAX_TWEET_AGE_MINUTES', 0) ||
      resolvePositiveIntegerEnv('TWITTER_SALE_STALE_MINUTES', 60 * 24),
    overlapMinutes:
      resolveNonNegativeIntegerEnv('NAMEFI_FEED_OVERLAP_MINUTES', -1) ??
      resolveNonNegativeIntegerEnv('TWITTER_SALE_OVERLAP_MINUTES', 5) ??
      5,
    lastAutoScanCursorAt: cursor,
    metadata: {
      migratedFromLabs: {
        source: 'labs-sales-agent',
        twitterChannelMetadata: toJsonValue(sourceMetadata),
        cursorSource: cursor ? 'env' : null,
      },
    } satisfies JsonValue,
  };

  const result = await input.target.query(
    `
      INSERT INTO namefi_feed_settings (
        id,
        auto_scan_enabled,
        search_queries,
        max_queries,
        max_pages_per_query,
        max_tweets_per_query,
        max_tweet_age_minutes,
        overlap_minutes,
        last_auto_scan_cursor_at,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        'default', $1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        auto_scan_enabled = excluded.auto_scan_enabled,
        search_queries = excluded.search_queries,
        max_queries = excluded.max_queries,
        max_pages_per_query = excluded.max_pages_per_query,
        max_tweets_per_query = excluded.max_tweets_per_query,
        max_tweet_age_minutes = excluded.max_tweet_age_minutes,
        overlap_minutes = excluded.overlap_minutes,
        last_auto_scan_cursor_at = COALESCE(excluded.last_auto_scan_cursor_at, namefi_feed_settings.last_auto_scan_cursor_at),
        metadata = COALESCE(namefi_feed_settings.metadata, '{}'::jsonb) || excluded.metadata,
        updated_at = now()
    `,
    [
      settings.autoScanEnabled,
      stringifyJson(settings.searchQueries),
      settings.maxQueries,
      settings.maxPagesPerQuery,
      settings.maxTweetsPerQuery,
      settings.maxTweetAgeMinutes,
      settings.overlapMinutes,
      settings.lastAutoScanCursorAt,
      stringifyJson(settings.metadata),
    ],
  );

  return result.rowCount ?? 0;
}

async function completeMigrationRun(
  target: PoolClient,
  runId: string,
  sourceCounts: SourceCounts,
  counts: MigrationCounts,
) {
  await target.query(
    `
      UPDATE namefi_feed_ingestion_runs
      SET
        status = 'completed',
        finished_at = now(),
        scanned_post_count = $2,
        queued_post_count = $3,
        processed_post_count = $3,
        listing_upserted_count = $4,
        skipped_post_count = $5,
        failed_post_count = 0,
        metadata = $6::jsonb,
        updated_at = now()
      WHERE id = $1
    `,
    [
      runId,
      sourceCounts.posts,
      counts.postsUpserted,
      counts.listingsUpserted,
      counts.postsSkipped,
      stringifyJson(buildRunMetadata(sourceCounts, counts)),
    ],
  );
}

function resolveSearchQueries(): string[] {
  return (
    parseListEnv(process.env.NAMEFI_FEED_SEARCH_QUERIES) ??
    parseListEnv(process.env.TWITTER_SALE_SEED_QUERIES) ??
    DEFAULT_NAMEFI_FEED_SEARCH_QUERIES
  );
}

function resolveLastAutoScanCursorAt(): Date | null {
  const raw =
    process.env.NAMEFI_FEED_LAST_AUTO_SCAN_CURSOR_AT ??
    process.env.TWITTER_SALE_LAST_PROCESSED_AT;
  return toDateOrNull(raw);
}

function resolvePositiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveNonNegativeIntegerEnv(
  name: string,
  fallback: number,
): number | null {
  const value = process.env[name];
  if (!value) {
    return fallback >= 0 ? fallback : null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseListEnv(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function readRawTweetPayload(
  rawPayload: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const raw = readRecord(rawPayload);
  const payload = readRecord(raw?.payload);
  if (raw?.channel === 'twitter' && payload) {
    return payload;
  }
  return fallback;
}

function readAuthorPayload(value: unknown): Record<string, unknown> | null {
  const author = readRecord(value);
  const payload = readRecord(author?.payload);
  return author?.channel === 'twitter' && payload ? payload : null;
}

function extractCandidateUrls(tweet: Record<string, unknown>): string[] {
  const entities = readRecord(tweet.entities);
  const urls = Array.isArray(entities?.urls) ? entities.urls : [];
  const candidates: string[] = [];

  for (const entity of urls) {
    const record = readRecord(entity);
    if (!record) {
      continue;
    }
    for (const key of ['expanded_url', 'unwound_url', 'url']) {
      const normalized = normalizePublicHttpUrl(readString(record[key]));
      if (normalized) {
        candidates.push(normalized);
      }
    }
  }

  return uniqueStrings(candidates);
}

function normalizeListingLogo(value: unknown): JsonValue {
  const logo = readRecord(value);
  const url = normalizeOptionalString(readString(logo?.url));
  if (!logo || !url) {
    return null;
  }
  return toJsonValue({ ...logo, url });
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeRequiredString(value: string | null | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function toIsoString(value: unknown): string | undefined {
  return toDateOrNull(value)?.toISOString();
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }
  if (typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toJsonValue(item);
    }
    return result;
  }
  return null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function stringifyJson(value: JsonValue): string {
  return JSON.stringify(value);
}

function stringifyJsonOrNull(value: JsonValue): string | null {
  return value === null ? null : JSON.stringify(value);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
