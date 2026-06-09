import {
  MAX_MLS_FEED_LIMIT,
  type MlsDomainSearchResponse,
  type MlsFeedPage,
  type MlsHandleListingsPage,
  type MlsListing,
} from '@namefi-astra/common/contract/mls-contract';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  db,
  namefiFeedListingReportsTable,
  namefiFeedListingsTable,
  namefiFeedPostsTable,
} from '@namefi-astra/db';
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  clamp,
  coerceDate,
  decodeListingCursor,
  domainMatchesTld,
  encodeListingCursor,
  normalizeCurrencyCode,
  normalizeHandle,
  normalizeHandleLookup,
  normalizeOptionalText,
  normalizePublicHttpUrl,
  normalizeSaleDomain,
  normalizeTldFilter,
  trimLeadingAt,
} from './normalization';
import {
  getActiveNamefiFeedListingWhereClauses,
  isNamefiFeedListingActive,
} from './listing-visibility';
import { resolveNamefiFeedSource } from './sources';

type ListingRow = {
  listingId: string;
  domain: string;
  logo: { url?: string | null } | null;
  askingPrice: string | null;
  askingCurrency: string | null;
  purchaseUrl: string | null;
  sellerUsername: string | null;
  sellerDisplayName: string | null;
  sourceUrl: string;
  messageText: string | null;
  listedAt: Date | string | null;
  postedAt: Date | string | null;
  externalSource: string;
  externalPostId: string;
  externalAuthorId: string;
};

type NormalizedListingRow = Omit<ListingRow, 'listedAt' | 'postedAt'> & {
  listedAt: Date;
  postedAt: Date;
};

export type HasPurchaseUrlFilter = 'all' | 'yes' | 'no';

export interface PublicListingsQuery {
  limit?: number;
  cursor?: string | null;
  search?: string | null;
  tld?: string | null;
  hasPurchaseUrl?: HasPurchaseUrlFilter;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface HandleListingsQuery {
  handle: string;
  limit?: number;
  cursor?: string | null;
}

const SELLER_DIRECTORY_LISTING_PAGE_SIZE = 1_000;
const FALLBACK_LISTING_CURRENCY_PATTERN = /^[A-Z0-9]{2,24}$/;

export class NamefiFeedInvalidCursorError extends Error {
  constructor(message = 'Invalid cursor') {
    super(message);
    this.name = 'NamefiFeedInvalidCursorError';
  }
}

export class NamefiFeedInvalidHandleError extends Error {
  constructor(message = 'Invalid handle') {
    super(message);
    this.name = 'NamefiFeedInvalidHandleError';
  }
}

export class NamefiFeedListingNotFoundError extends Error {
  constructor(message = 'Namefi feed listing not found') {
    super(message);
    this.name = 'NamefiFeedListingNotFoundError';
  }
}

export class NamefiFeedListingConflictError extends Error {
  constructor(message = 'Namefi feed listing is suppressed') {
    super(message);
    this.name = 'NamefiFeedListingConflictError';
  }
}

export class NamefiFeedReportNotFoundError extends Error {
  constructor(message = 'Namefi feed listing report not found') {
    super(message);
    this.name = 'NamefiFeedReportNotFoundError';
  }
}

export async function getPublicNamefiFeedListings(
  query: PublicListingsQuery = {},
): Promise<MlsFeedPage> {
  const pageSize = clamp(query.limit ?? 20, 1, MAX_MLS_FEED_LIMIT);
  const activeAt = new Date();
  const cursor = decodeListingCursor(query.cursor);
  if (query.cursor && !cursor) {
    throw new NamefiFeedInvalidCursorError();
  }

  const whereClauses = buildBasePublicListingWhereClauses(activeAt);
  appendPublicListingFilters(whereClauses, query);

  if (cursor) {
    whereClauses.push(
      sql`(${namefiFeedListingsTable.postedAt} < ${cursor.sortAt} OR (${namefiFeedListingsTable.postedAt} = ${cursor.sortAt} AND ${namefiFeedListingsTable.id} < ${cursor.id}))`,
    );
  }

  const rows = await selectListingRows(whereClauses, pageSize + 1);
  const visibleRows = rows.slice(0, pageSize);
  const normalizedRows = normalizeListingRows(visibleRows);
  const domainCountsByAuthorId = await getDomainCountsByAuthorId(
    normalizedRows.map((row) => row.externalAuthorId),
  );
  const lastRow = normalizedRows.at(-1);
  const hasMore = rows.length > pageSize;

  return {
    rows: normalizedRows.map((row) =>
      toMlsListing(row, resolveOtherDomainsCount(row, domainCountsByAuthorId)),
    ),
    nextCursor:
      hasMore && lastRow
        ? encodeListingCursor(lastRow.postedAt, lastRow.listingId)
        : null,
    hasMore,
    limit: pageSize,
  };
}

export async function getNamefiFeedListingsForSellerDirectory({
  search,
  tld,
  limit,
}: Pick<PublicListingsQuery, 'search' | 'tld'> & {
  limit?: number | null;
}): Promise<MlsListing[]> {
  const activeAt = new Date();
  const whereClauses = buildBasePublicListingWhereClauses(activeAt);
  appendPublicListingFilters(whereClauses, { search, tld });
  const rows: NormalizedListingRow[] = [];
  const maxRows = typeof limit === 'number' ? Math.max(1, limit) : null;
  let cursor: ReturnType<typeof decodeListingCursor> = null;

  while (maxRows === null || rows.length < maxRows) {
    const remainingRows =
      maxRows === null
        ? SELLER_DIRECTORY_LISTING_PAGE_SIZE
        : maxRows - rows.length;
    const pageSize = Math.min(
      SELLER_DIRECTORY_LISTING_PAGE_SIZE,
      remainingRows,
    );
    const pageWhereClauses = [...whereClauses];
    if (cursor) {
      pageWhereClauses.push(
        sql`(${namefiFeedListingsTable.postedAt} < ${cursor.sortAt} OR (${namefiFeedListingsTable.postedAt} = ${cursor.sortAt} AND ${namefiFeedListingsTable.id} < ${cursor.id}))`,
      );
    }

    const pageRows = normalizeListingRows(
      await selectListingRows(pageWhereClauses, pageSize + 1),
    );
    const visibleRows = pageRows.slice(0, pageSize);
    rows.push(...visibleRows);

    const lastRow = visibleRows.at(-1);
    if (pageRows.length <= pageSize || !lastRow) {
      break;
    }
    cursor = { sortAt: lastRow.postedAt, id: lastRow.listingId };
  }

  const domainCountsByAuthorId = await getDomainCountsByAuthorId(
    rows.map((row) => row.externalAuthorId),
  );

  return rows.map((row) =>
    toMlsListing(row, resolveOtherDomainsCount(row, domainCountsByAuthorId)),
  );
}

export async function getPublicNamefiFeedListingsByHandle(
  query: HandleListingsQuery,
): Promise<MlsHandleListingsPage> {
  const normalizedHandleLookup = normalizeHandleLookup(query.handle);
  if (!normalizedHandleLookup) {
    throw new NamefiFeedInvalidHandleError();
  }

  const pageSize = clamp(query.limit ?? 20, 1, MAX_MLS_FEED_LIMIT);
  const activeAt = new Date();
  const cursor = decodeListingCursor(query.cursor);
  if (query.cursor && !cursor) {
    throw new NamefiFeedInvalidCursorError();
  }

  const sellerMatch = await findSellerMatchByHandle(normalizedHandleLookup);
  const fallbackHandle = `@${normalizedHandleLookup}`;
  const sellerUsername = normalizeHandle(sellerMatch?.sellerUsername);
  const resolvedHandle = sellerUsername ?? fallbackHandle;
  const sellerDisplayName = normalizeOptionalText(
    sellerMatch?.sellerDisplayName,
  );
  const sellerAuthorId = sellerMatch?.externalAuthorId ?? null;

  if (!sellerAuthorId) {
    return {
      handle: resolvedHandle,
      seller: {
        authorId: null,
        username: resolvedHandle,
        displayName: null,
        namefiDomainsCount: 0,
        tierDomainCount: 0,
      },
      rows: [],
      nextCursor: null,
      hasMore: false,
      limit: pageSize,
      totalDomains: 0,
    };
  }

  const whereClauses = [
    ...buildBasePublicListingWhereClauses(activeAt),
    eq(namefiFeedPostsTable.externalAuthorId, sellerAuthorId),
  ];
  if (cursor) {
    whereClauses.push(
      sql`(${namefiFeedListingsTable.postedAt} < ${cursor.sortAt} OR (${namefiFeedListingsTable.postedAt} = ${cursor.sortAt} AND ${namefiFeedListingsTable.id} < ${cursor.id}))`,
    );
  }

  const totalDomainsByAuthorId = await getDomainCountsByAuthorId([
    sellerAuthorId,
  ]);
  const totalDomains = totalDomainsByAuthorId.get(sellerAuthorId) ?? 0;
  const rows = await selectListingRows(whereClauses, pageSize + 1);
  const normalizedRows = normalizeListingRows(rows.slice(0, pageSize));
  const lastRow = normalizedRows.at(-1);
  const hasMore = rows.length > pageSize;
  const otherDomainsCount = Math.max(0, totalDomains - 1);

  return {
    handle: resolvedHandle,
    seller: {
      authorId: sellerAuthorId,
      username: resolvedHandle,
      displayName: sellerDisplayName,
      namefiDomainsCount: 0,
      tierDomainCount: 0,
    },
    rows: normalizedRows.map((row) => toMlsListing(row, otherDomainsCount)),
    nextCursor:
      hasMore && lastRow
        ? encodeListingCursor(lastRow.postedAt, lastRow.listingId)
        : null,
    hasMore,
    limit: pageSize,
    totalDomains,
  };
}

export async function searchNamefiFeedListingsByDomain(
  domains: string[],
): Promise<MlsDomainSearchResponse> {
  const normalizedDomains = Array.from(
    new Set(
      domains
        .map((domain) => normalizeSaleDomain(domain))
        .filter((domain): domain is NamefiNormalizedDomain => Boolean(domain)),
    ),
  );

  if (normalizedDomains.length === 0) {
    return { offersByDomain: {}, generatedAt: new Date().toISOString() };
  }

  const activeAt = new Date();
  const rows = normalizeListingRows(
    await selectListingRows(
      [
        ...buildBasePublicListingWhereClauses(activeAt),
        inArray(namefiFeedListingsTable.domain, normalizedDomains),
        latestActiveListingPerDomainClause(activeAt),
      ],
      normalizedDomains.length,
    ),
  );

  const latestRowsByDomain = new Map<string, NormalizedListingRow>();
  for (const row of rows) {
    if (!latestRowsByDomain.has(row.domain)) {
      latestRowsByDomain.set(row.domain, row);
    }
  }

  const domainCountsByAuthorId = await getDomainCountsByAuthorId(
    Array.from(latestRowsByDomain.values()).map((row) => row.externalAuthorId),
  );
  const offersByDomain: MlsDomainSearchResponse['offersByDomain'] = {};

  for (const domain of normalizedDomains) {
    const row = latestRowsByDomain.get(domain);
    if (!row) {
      continue;
    }
    const listing = toMlsListing(
      row,
      resolveOtherDomainsCount(row, domainCountsByAuthorId),
    );
    offersByDomain[domain] = {
      ...listing,
      seller: {
        ...listing.seller,
        username: trimLeadingAt(listing.seller.username),
      },
    };
  }

  return {
    offersByDomain,
    generatedAt: new Date().toISOString(),
  };
}

export async function createNamefiFeedListingReport(input: {
  listingId: string;
  reason:
    | 'already_sold'
    | 'inaccurate_price'
    | 'not_for_sale'
    | 'duplicate_listing'
    | 'other';
  details?: string | null;
}) {
  return await db.transaction(async (tx) => {
    const [listing] = await tx
      .select({
        id: namefiFeedListingsTable.id,
        suppressedAt: namefiFeedListingsTable.suppressedAt,
        endedAt: namefiFeedListingsTable.endedAt,
        expiresAt: namefiFeedListingsTable.expiresAt,
      })
      .from(namefiFeedListingsTable)
      .where(eq(namefiFeedListingsTable.id, input.listingId))
      .limit(1)
      .for('update');

    if (!listing) {
      throw new NamefiFeedListingNotFoundError();
    }
    if (!isNamefiFeedListingActive(listing)) {
      throw new NamefiFeedListingConflictError(
        'Namefi feed listing is no longer active',
      );
    }

    const [report] = await tx
      .insert(namefiFeedListingReportsTable)
      .values({
        listingId: input.listingId,
        reason: input.reason,
        details: normalizeOptionalText(input.details),
      })
      .returning({
        id: namefiFeedListingReportsTable.id,
        status: namefiFeedListingReportsTable.status,
      });

    if (!report) {
      throw new Error('Failed to create Namefi feed listing report.');
    }

    return report;
  });
}

export async function setNamefiFeedListingSuppressed(input: {
  listingId: string;
  suppressed: boolean;
}) {
  const listing = await db.transaction(async (tx) => {
    const now = new Date();
    const [updatedListing] = await tx
      .update(namefiFeedListingsTable)
      .set({
        suppressedAt: input.suppressed ? now : null,
      })
      .where(eq(namefiFeedListingsTable.id, input.listingId))
      .returning({
        id: namefiFeedListingsTable.id,
        suppressedAt: namefiFeedListingsTable.suppressedAt,
      });

    if (updatedListing && input.suppressed) {
      await tx
        .update(namefiFeedListingReportsTable)
        .set({
          status: 'resolved',
          resolution: 'suppressed_listing',
          resolvedAt: now,
        })
        .where(
          and(
            eq(namefiFeedListingReportsTable.listingId, input.listingId),
            eq(namefiFeedListingReportsTable.status, 'active'),
          ),
        );
    }

    return updatedListing;
  });

  if (!listing) {
    throw new NamefiFeedListingNotFoundError();
  }

  return {
    id: listing.id,
    suppressed: Boolean(listing.suppressedAt),
  };
}

export async function resolveNamefiFeedListingReport(input: {
  reportId: string;
  resolution: 'suppressed_listing' | 'dismissed';
}) {
  return await db.transaction(async (tx) => {
    const [report] = await tx
      .select({
        id: namefiFeedListingReportsTable.id,
        listingId: namefiFeedListingReportsTable.listingId,
        status: namefiFeedListingReportsTable.status,
      })
      .from(namefiFeedListingReportsTable)
      .where(eq(namefiFeedListingReportsTable.id, input.reportId))
      .limit(1)
      .for('update');

    if (!report) {
      throw new NamefiFeedReportNotFoundError();
    }
    if (report.status !== 'active') {
      throw new NamefiFeedListingConflictError(
        'Namefi feed listing report is already resolved',
      );
    }

    const now = new Date();
    if (input.resolution === 'suppressed_listing') {
      await tx
        .update(namefiFeedListingsTable)
        .set({ suppressedAt: now })
        .where(eq(namefiFeedListingsTable.id, report.listingId));

      const resolvedReports = await tx
        .update(namefiFeedListingReportsTable)
        .set({
          status: 'resolved',
          resolution: input.resolution,
          resolvedAt: now,
        })
        .where(
          and(
            eq(namefiFeedListingReportsTable.listingId, report.listingId),
            eq(namefiFeedListingReportsTable.status, 'active'),
          ),
        )
        .returning({
          id: namefiFeedListingReportsTable.id,
          status: namefiFeedListingReportsTable.status,
          resolution: namefiFeedListingReportsTable.resolution,
        });

      const updatedReport = resolvedReports.find(({ id }) => id === report.id);
      if (!updatedReport) {
        throw new NamefiFeedReportNotFoundError();
      }

      return updatedReport;
    }

    const [updatedReport] = await tx
      .update(namefiFeedListingReportsTable)
      .set({
        status: 'resolved',
        resolution: input.resolution,
        resolvedAt: now,
      })
      .where(
        and(
          eq(namefiFeedListingReportsTable.id, report.id),
          eq(namefiFeedListingReportsTable.status, 'active'),
        ),
      )
      .returning({
        id: namefiFeedListingReportsTable.id,
        status: namefiFeedListingReportsTable.status,
        resolution: namefiFeedListingReportsTable.resolution,
      });

    if (!updatedReport) {
      throw new NamefiFeedReportNotFoundError();
    }

    return updatedReport;
  });
}

function buildBasePublicListingWhereClauses(
  activeAt: Date = new Date(),
): SQL[] {
  return [
    ...getActiveNamefiFeedListingWhereClauses(activeAt),
    latestActiveListingPerSourceDomainClause(activeAt),
  ];
}

function appendPublicListingFilters(
  whereClauses: SQL[],
  query: PublicListingsQuery,
) {
  const normalizedSearch = normalizeOptionalText(query.search);
  if (normalizedSearch) {
    const likeQuery = `%${normalizedSearch}%`;
    const searchClause = or(
      ilike(namefiFeedListingsTable.domain, likeQuery),
      ilike(namefiFeedListingsTable.messageText, likeQuery),
      ilike(namefiFeedListingsTable.sellerUsername, likeQuery),
      ilike(namefiFeedListingsTable.sellerDisplayName, likeQuery),
    );
    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const normalizedTld = normalizeTldFilter(query.tld);
  if (normalizedTld) {
    whereClauses.push(
      sql`(${namefiFeedListingsTable.domain} = ${normalizedTld} OR ${namefiFeedListingsTable.domain} LIKE ${`%.${normalizedTld}`})`,
    );
  }

  if (query.hasPurchaseUrl === 'yes') {
    whereClauses.push(isNotNull(namefiFeedListingsTable.purchaseUrl));
  } else if (query.hasPurchaseUrl === 'no') {
    whereClauses.push(isNull(namefiFeedListingsTable.purchaseUrl));
  }

  if (query.dateFrom) {
    whereClauses.push(gte(namefiFeedListingsTable.postedAt, query.dateFrom));
  }
  if (query.dateTo) {
    whereClauses.push(lte(namefiFeedListingsTable.postedAt, query.dateTo));
  }
}

async function selectListingRows(
  whereClauses: SQL[],
  limit: number,
): Promise<ListingRow[]> {
  return await db
    .select({
      listingId: namefiFeedListingsTable.id,
      domain: namefiFeedListingsTable.domain,
      logo: namefiFeedListingsTable.logo,
      askingPrice: namefiFeedListingsTable.askingPrice,
      askingCurrency: namefiFeedListingsTable.askingCurrency,
      purchaseUrl: namefiFeedListingsTable.purchaseUrl,
      sellerUsername: namefiFeedListingsTable.sellerUsername,
      sellerDisplayName: namefiFeedListingsTable.sellerDisplayName,
      sourceUrl: namefiFeedListingsTable.sourceUrl,
      messageText: namefiFeedListingsTable.messageText,
      listedAt: namefiFeedListingsTable.listedAt,
      postedAt: namefiFeedListingsTable.postedAt,
      externalSource: namefiFeedPostsTable.externalSource,
      externalPostId: namefiFeedPostsTable.externalPostId,
      externalAuthorId: namefiFeedPostsTable.externalAuthorId,
    })
    .from(namefiFeedListingsTable)
    .innerJoin(
      namefiFeedPostsTable,
      eq(namefiFeedPostsTable.id, namefiFeedListingsTable.postId),
    )
    .where(and(...whereClauses))
    .orderBy(
      desc(namefiFeedListingsTable.postedAt),
      desc(namefiFeedListingsTable.id),
    )
    .limit(limit);
}

async function findSellerMatchByHandle(normalizedHandleLookup: string) {
  const [row] = await selectListingRows(
    [
      ...buildBasePublicListingWhereClauses(),
      sql`LOWER(TRIM(LEADING '@' FROM COALESCE(${namefiFeedListingsTable.sellerUsername}, ''))) = ${normalizedHandleLookup}`,
    ],
    1,
  );

  return row ?? null;
}

async function getDomainCountsByAuthorId(
  authorIds: string[],
): Promise<Map<string, number>> {
  const normalizedAuthorIds = Array.from(
    new Set(authorIds.map((authorId) => authorId.trim()).filter(Boolean)),
  );
  if (normalizedAuthorIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      authorId: namefiFeedPostsTable.externalAuthorId,
      listingCount: sql<number>`count(distinct ${namefiFeedListingsTable.domain})`,
    })
    .from(namefiFeedListingsTable)
    .innerJoin(
      namefiFeedPostsTable,
      eq(namefiFeedPostsTable.id, namefiFeedListingsTable.postId),
    )
    .where(
      and(
        ...buildBasePublicListingWhereClauses(),
        inArray(namefiFeedPostsTable.externalAuthorId, normalizedAuthorIds),
      ),
    )
    .groupBy(namefiFeedPostsTable.externalAuthorId);

  const countsByAuthorId = new Map<string, number>();
  for (const row of rows) {
    countsByAuthorId.set(row.authorId, Number(row.listingCount));
  }

  return countsByAuthorId;
}

function normalizeListingRows(rows: ListingRow[]): NormalizedListingRow[] {
  return rows.flatMap((row) => {
    const listedAt = coerceDate(row.listedAt);
    const postedAt = coerceDate(row.postedAt);
    if (!listedAt || !postedAt) {
      return [];
    }
    return [{ ...row, listedAt, postedAt }];
  });
}

function resolveOtherDomainsCount(
  row: NormalizedListingRow,
  domainCountsByAuthorId: Map<string, number>,
): number {
  const totalDomains = domainCountsByAuthorId.get(row.externalAuthorId) ?? 1;
  return Math.max(0, totalDomains - 1);
}

function toMlsListing(
  row: NormalizedListingRow,
  otherDomainsCount: number,
): MlsListing {
  const source = resolveNamefiFeedSource({
    externalSource: row.externalSource,
    sourceUrl: row.sourceUrl,
    externalPostId: row.externalPostId,
  });

  return {
    id: row.listingId,
    domain: row.domain,
    logoUrl: normalizeOptionalText(row.logo?.url),
    askingPrice: normalizeOptionalText(row.askingPrice),
    askingCurrency: normalizeListingCurrency(row.askingCurrency),
    purchaseUrl: normalizePublicHttpUrl(row.purchaseUrl),
    messageText: normalizeOptionalText(row.messageText),
    seller: {
      username: normalizeHandle(row.sellerUsername),
      displayName: normalizeOptionalText(row.sellerDisplayName),
      namefiDomainsCount: 0,
      tierDomainCount: 0,
    },
    otherDomainsCount,
    source,
    sourceTweetUrl: source.url,
    postedAt: row.postedAt.toISOString(),
    listedAt: row.listedAt.toISOString(),
  };
}

export function listingMatchesTld(listing: MlsListing, tld: string | null) {
  return domainMatchesTld(listing.domain, tld);
}

function latestActiveListingPerSourceDomainClause(
  activeAt: Date = new Date(),
): SQL {
  return sql`NOT EXISTS (
    SELECT 1
    FROM "namefi_feed_listings" AS "newer_listing"
    INNER JOIN "namefi_feed_posts" AS "newer_post"
      ON "newer_post"."id" = "newer_listing"."post_id"
    WHERE "newer_listing"."domain" = ${namefiFeedListingsTable.domain}
      AND "newer_post"."external_source" = ${namefiFeedPostsTable.externalSource}
      AND "newer_listing"."suppressed_at" IS NULL
      AND "newer_listing"."ended_at" IS NULL
      AND ("newer_listing"."expires_at" IS NULL OR "newer_listing"."expires_at" > ${activeAt})
      AND (
        "newer_listing"."posted_at" > ${namefiFeedListingsTable.postedAt}
        OR (
          "newer_listing"."posted_at" = ${namefiFeedListingsTable.postedAt}
          AND "newer_listing"."id" > ${namefiFeedListingsTable.id}
        )
      )
  )`;
}

function latestActiveListingPerDomainClause(activeAt: Date = new Date()): SQL {
  return sql`NOT EXISTS (
    SELECT 1
    FROM "namefi_feed_listings" AS "newer_listing"
    WHERE "newer_listing"."domain" = ${namefiFeedListingsTable.domain}
      AND "newer_listing"."suppressed_at" IS NULL
      AND "newer_listing"."ended_at" IS NULL
      AND ("newer_listing"."expires_at" IS NULL OR "newer_listing"."expires_at" > ${activeAt})
      AND (
        "newer_listing"."posted_at" > ${namefiFeedListingsTable.postedAt}
        OR (
          "newer_listing"."posted_at" = ${namefiFeedListingsTable.postedAt}
          AND "newer_listing"."id" > ${namefiFeedListingsTable.id}
        )
      )
  )`;
}

function normalizeListingCurrency(value: string | null | undefined) {
  const normalized = normalizeCurrencyCode(value);
  if (normalized) {
    return normalized;
  }

  const fallback = normalizeOptionalText(value)?.toUpperCase() ?? null;
  return fallback && FALLBACK_LISTING_CURRENCY_PATTERN.test(fallback)
    ? fallback
    : null;
}
