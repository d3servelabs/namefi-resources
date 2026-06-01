import { TRPCError } from '@trpc/server';
import {
  getMlsListingSellerDomainCount,
  getMlsSellerTierDomainCount,
} from '@namefi-astra/common/mls-seller-tiers';
import {
  MAX_MLS_FEED_LIMIT,
  type MlsDomainSearchResponse,
  type MlsFeedPage,
  type MlsHandleListingsPage,
  type MlsListing,
  type MlsSellerDirectoryRow,
  type MlsSellerDirectorySortBy,
  type MlsSellerDirectorySortOrder,
  mlsContract,
  mlsDomainSearchResponseSchema,
  mlsFeedPageSchema,
  mlsHandleListingsPageSchema,
  mlsReportResponseSchema,
} from '@namefi-astra/common/contract/mls-contract';
import { db, namefiNftOwnersCte, namefiNftOwnersView } from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { inArray, sql } from 'drizzle-orm';
import { config } from '#lib/env';
import { ensurePrivyTableFresh } from '../../services/admin/privy-user-cache';
import { adminProcedure, publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_FILTERED_FEED_UPSTREAM_PAGES = 8;
const MAX_SELLER_DIRECTORY_UPSTREAM_PAGES = 100;
const SELLER_DIRECTORY_SOURCE_CACHE_TTL_MS = 5 * 60 * 1_000;
const TRAILING_SLASHES_PATTERN = /\/+$/;
const LEADING_AT_SYMBOL = /^@/;
const HANDLE_PATTERN = /^[a-z0-9_]+$/i;
const EDGE_DOTS_PATTERN = /^\.+|\.+$/g;
const TLD_FILTER_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const DAY_MS = 24 * 60 * 60 * 1_000;

let sellerDirectorySourceCache: {
  rows: MlsListing[];
  fetchedAt: number;
} | null = null;

interface SellerDirectoryCursor {
  offset: number;
  snapshotId: number;
}

export const mlsRouter = createContractTRPCRouter<typeof mlsContract>({
  getFeed: publicProcedure
    .input(mlsContract.getFeed.input)
    .output(mlsContract.getFeed.output)
    .query(async ({ input }) => {
      const limit = clamp(input.limit, 1, MAX_MLS_FEED_LIMIT);
      const query = normalizeFeedSearchQuery(input.query);
      const requestedTld = input.tld?.trim() ?? '';
      const tld = normalizeTldFilter(input.tld);

      if (requestedTld && !tld) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid TLD filter.',
        });
      }

      if (!tld) {
        return fetchUpstreamFeedPage({
          cursor: input.cursor ?? null,
          limit,
          query,
          tld,
        });
      }

      const rows: MlsListing[] = [];
      let cursor = input.cursor ?? null;
      let lastPage: MlsFeedPage | null = null;
      let fetchedPages = 0;

      while (
        rows.length < limit &&
        fetchedPages < MAX_FILTERED_FEED_UPSTREAM_PAGES
      ) {
        const page = await fetchUpstreamFeedPage({
          cursor,
          limit: limit - rows.length,
          query,
          tld,
        });
        fetchedPages += 1;
        lastPage = page;
        // Upstream TLD filtering narrows the page; this suffix check keeps the response exact.
        const matchingRows = page.rows
          .filter((listing) => domainMatchesTld(listing.domain, tld))
          .slice(0, limit - rows.length);
        rows.push(...matchingRows);
        cursor = page.nextCursor;

        if (!page.hasMore || !cursor) {
          break;
        }
      }

      return {
        rows,
        nextCursor: lastPage?.nextCursor ?? null,
        hasMore: Boolean(lastPage?.hasMore && lastPage.nextCursor),
        limit,
      };
    }),

  getSellers: adminProcedure
    .input(mlsContract.getSellers.input)
    .output(mlsContract.getSellers.output)
    .query(async ({ input }) => {
      const limit = clamp(input.limit, 1, MAX_MLS_FEED_LIMIT);
      const minSalePosts = clamp(input.minSalePosts, 1, 500);
      const query = normalizeFeedSearchQuery(input.query);
      const requestedTld = input.tld?.trim() ?? '';
      const tld = normalizeTldFilter(input.tld);
      const cursor = decodeSellerDirectoryCursor(input.cursor);
      const sortBy = input.sortBy ?? 'salePosts';
      const sortOrder = input.sortOrder ?? 'desc';

      if (cursor === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid seller directory cursor.',
        });
      }

      if (requestedTld && !tld) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid TLD filter.',
        });
      }

      const source = await fetchSellerDirectorySourceRows(
        cursor?.snapshotId ?? null,
      );

      if (!source) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Seller directory cursor has expired.',
        });
      }

      const filteredRows = source.rows.filter(
        (row) =>
          (!tld || domainMatchesTld(row.domain, tld)) &&
          listingMatchesSellerDirectoryQuery(row, query),
      );
      const generatedAt = new Date().toISOString();
      const sellerPortfolios = await getNamefiPortfoliosBySellerHandles(
        filteredRows.map((row) => row.seller.username),
      );
      const sellersWithPortfolio = aggregateSellerDirectoryRows(
        filteredRows,
        generatedAt,
        sellerPortfolios,
      );
      const sellers = sellersWithPortfolio
        .filter(
          (seller) =>
            seller.salePostCount >= minSalePosts &&
            (!input.activeWithinDays ||
              seller.daysSinceLastPost <= input.activeWithinDays),
        )
        .sort((left, right) =>
          compareSellerDirectoryRows(left, right, sortBy, sortOrder),
        );

      const start = cursor?.offset ?? 0;
      const end = start + limit;
      const rows = sellers.slice(start, end);
      const nextCursor =
        end < sellers.length
          ? encodeSellerDirectoryCursor(end, source.fetchedAt)
          : null;

      return {
        rows,
        nextCursor,
        hasMore: Boolean(nextCursor),
        limit,
        total: sellers.length,
        generatedAt,
      };
    }),

  getHandleListings: publicProcedure
    .input(mlsContract.getHandleListings.input)
    .output(mlsContract.getHandleListings.output)
    .query(async ({ input }) => {
      const normalizedHandle = normalizeMlsHandleSlug(input.handle);
      if (!normalizedHandle) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid MLS handle.',
        });
      }

      const upstreamUrl = buildUpstreamHandleUrl(normalizedHandle);
      upstreamUrl.searchParams.set(
        'limit',
        String(clamp(input.limit, 1, MAX_MLS_FEED_LIMIT)),
      );
      if (input.cursor) {
        upstreamUrl.searchParams.set('cursor', input.cursor);
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
        },
      }).catch(() => null);

      if (!upstreamResponse) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to load MLS handle listings right now.',
        });
      }

      if (!upstreamResponse.ok) {
        const errorMessage = await extractErrorMessage(upstreamResponse);

        if (upstreamResponse.status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage ?? 'Invalid MLS handle.',
          });
        }

        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message:
            errorMessage ?? 'Failed to fetch upstream MLS handle listings.',
        });
      }

      const payload = await upstreamResponse.json();
      const parsed = mlsHandleListingsPageSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Upstream MLS handle listings returned an invalid payload.',
        });
      }

      return enrichMlsHandleListingsPageSellerPortfolio(parsed.data);
    }),

  reportListing: publicProcedure
    .input(mlsContract.reportListing.input)
    .output(mlsContract.reportListing.output)
    .mutation(async ({ input }) => {
      const details = input.details?.trim();
      const upstreamBody = {
        listingId: input.listingId,
        reason: input.reason,
        ...(details ? { details } : {}),
      };
      const upstreamUrl = buildUpstreamListingReportUrl();

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upstreamBody),
      }).catch(() => null);

      if (!upstreamResponse) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Unable to submit MLS listing report right now.',
        });
      }

      if (!upstreamResponse.ok) {
        const errorMessage = await extractErrorMessage(upstreamResponse);
        if (upstreamResponse.status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage ?? 'Invalid MLS listing report payload.',
          });
        }
        if (upstreamResponse.status === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: errorMessage ?? 'MLS listing not found.',
          });
        }
        if (upstreamResponse.status === 409) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: errorMessage ?? 'MLS listing is already suppressed.',
          });
        }

        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message:
            errorMessage ?? 'Failed to submit MLS listing report upstream.',
        });
      }

      const upstreamPayload = await upstreamResponse.json();
      const parsedUpstreamPayload =
        mlsReportResponseSchema.safeParse(upstreamPayload);

      if (!parsedUpstreamPayload.success) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: 'Upstream MLS report API returned an invalid payload.',
        });
      }

      return parsedUpstreamPayload.data;
    }),

  searchDomainOffers: publicProcedure
    .input(mlsContract.searchDomainOffers.input)
    .output(mlsContract.searchDomainOffers.output)
    .query(async ({ input }) => {
      const upstreamUrl = buildUpstreamListingSearchUrl();
      const domains = uniqueLowercaseStrings(input.domains);

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains,
        }),
      }).catch(() => null);

      if (!upstreamResponse?.ok) {
        return {
          offersByDomain: {},
          generatedAt: new Date().toISOString(),
        };
      }

      const payload = await upstreamResponse.json();
      const parsed = mlsDomainSearchResponseSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          offersByDomain: {},
          generatedAt: new Date().toISOString(),
        };
      }

      return normalizeDomainSearchResponse(parsed.data);
    }),
});

async function fetchUpstreamFeedPage({
  cursor,
  enrichSellerPortfolio = true,
  limit,
  query,
  tld,
}: {
  cursor: string | null;
  enrichSellerPortfolio?: boolean;
  limit: number;
  query: string | null;
  tld: string | null;
}) {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  upstreamUrl.searchParams.set(
    'limit',
    String(clamp(limit, 1, MAX_MLS_FEED_LIMIT)),
  );
  if (cursor) {
    upstreamUrl.searchParams.set('cursor', cursor);
  }
  if (query) {
    upstreamUrl.searchParams.set('q', query);
  }
  if (tld) {
    upstreamUrl.searchParams.set('tld', tld);
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
    },
  }).catch(() => null);

  if (!upstreamResponse) {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: 'Unable to load MLS feed right now.',
    });
  }

  if (!upstreamResponse.ok) {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: 'Failed to fetch the upstream MLS feed.',
    });
  }

  const payload = await upstreamResponse.json();
  const parsed = mlsFeedPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: 'Upstream MLS feed returned an invalid payload.',
    });
  }

  return enrichSellerPortfolio
    ? enrichMlsFeedPageSellerPortfolio(parsed.data)
    : parsed.data;
}

async function enrichMlsFeedPageSellerPortfolio(
  page: MlsFeedPage,
): Promise<MlsFeedPage> {
  const portfolios = await getNamefiPortfoliosBySellerHandles(
    page.rows.map((row) => row.seller.username),
  );

  return {
    ...page,
    rows: page.rows.map((listing) =>
      enrichMlsListingSellerPortfolio(listing, portfolios),
    ),
  };
}

async function enrichMlsHandleListingsPageSellerPortfolio(
  page: MlsHandleListingsPage,
): Promise<MlsHandleListingsPage> {
  const sellerHandle =
    normalizeMlsSellerHandle(page.seller.username ?? page.handle) ??
    normalizeMlsSellerHandle(page.handle);
  const portfolios = await getNamefiPortfoliosBySellerHandles([
    sellerHandle?.slug ?? page.handle,
  ]);
  const namefiPortfolio = sellerHandle
    ? getSellerNamefiPortfolio(portfolios, sellerHandle.slug)
    : null;
  const namefiDomainsCount = namefiPortfolio?.count ?? 0;
  const tierDomainCount = getMlsSellerTierDomainCount({
    feedDomainsCount: page.totalDomains,
    namefiDomainsCount,
    overlappingDomainsCount: countMlsListingNamefiOverlaps(
      page.rows,
      namefiPortfolio?.domains,
    ),
  });

  return {
    ...page,
    seller: {
      ...page.seller,
      namefiDomainsCount,
      tierDomainCount,
    },
    rows: page.rows.map((listing) =>
      enrichMlsListingSellerPortfolio(listing, portfolios),
    ),
  };
}

function enrichMlsListingSellerPortfolio(
  listing: MlsListing,
  portfolios: Map<string, SellerNamefiPortfolio>,
): MlsListing {
  const sellerHandle = normalizeMlsSellerHandle(listing.seller.username);
  const namefiPortfolio = sellerHandle
    ? getSellerNamefiPortfolio(portfolios, sellerHandle.slug)
    : null;
  const namefiDomainsCount = namefiPortfolio?.count ?? 0;
  const feedDomainsCount = getMlsListingSellerDomainCount(
    listing.otherDomainsCount,
  );

  return {
    ...listing,
    seller: {
      ...listing.seller,
      namefiDomainsCount,
      tierDomainCount: getMlsSellerTierDomainCount({
        feedDomainsCount,
        namefiDomainsCount,
        overlappingDomainsCount: namefiPortfolio?.domains.has(
          normalizePortfolioDomain(listing.domain),
        )
          ? 1
          : 0,
      }),
    },
  };
}

async function getNamefiPortfoliosBySellerHandles(
  handles: Array<string | null | undefined>,
): Promise<Map<string, SellerNamefiPortfolio>> {
  const normalizedHandles = Array.from(
    new Set(
      handles
        .map((handle) => normalizeMlsSellerHandle(handle)?.slug)
        .filter((handle): handle is string => Boolean(handle)),
    ),
  );

  if (normalizedHandles.length === 0) {
    return new Map();
  }

  try {
    await ensurePrivyTableFresh();

    const rows = await db
      .with(namefiNftOwnersCte)
      .select({
        handle: sql<string>`LOWER(${privyUsersTableSchema.twitterUsername})`,
        domain: sql<string>`LOWER(${namefiNftOwnersView.normalizedDomainName})`,
      })
      .from(privyUsersTableSchema)
      .innerJoin(
        namefiNftOwnersView,
        sql`LOWER(${namefiNftOwnersView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
      )
      .where(
        inArray(
          sql<string>`LOWER(${privyUsersTableSchema.twitterUsername})`,
          normalizedHandles,
        ),
      );

    const portfolios = new Map<string, SellerNamefiPortfolio>();
    for (const row of rows) {
      const handle = row.handle?.trim().toLowerCase();
      const domain = row.domain?.trim().toLowerCase();
      if (!handle || !domain) {
        continue;
      }

      const portfolio = portfolios.get(handle) ?? {
        domains: new Set<string>(),
        count: 0,
      };

      portfolio.domains.add(domain);
      portfolio.count = portfolio.domains.size;
      portfolios.set(handle, portfolio);
    }

    return portfolios;
  } catch {
    return new Map();
  }
}

function getSellerNamefiPortfolio(
  portfolios: Map<string, SellerNamefiPortfolio>,
  sellerSlug: string,
) {
  return portfolios.get(sellerSlug.toLowerCase()) ?? null;
}

function countMlsListingNamefiOverlaps(
  listings: MlsListing[],
  namefiDomains: Set<string> | null | undefined,
) {
  if (!namefiDomains?.size) {
    return 0;
  }

  const overlappingDomains = new Set<string>();
  for (const listing of listings) {
    const domain = normalizePortfolioDomain(listing.domain);
    if (namefiDomains.has(domain)) {
      overlappingDomains.add(domain);
    }
  }

  return overlappingDomains.size;
}

function countSetIntersection(left: Set<string>, right: Set<string>) {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) {
      count += 1;
    }
  }
  return count;
}

function normalizePortfolioDomain(domain: string) {
  return domain.trim().toLowerCase();
}

function buildUpstreamHandleUrl(handle: string) {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );
  const withoutListings = normalizedPath.endsWith('/listings')
    ? normalizedPath.slice(0, -'/listings'.length)
    : normalizedPath;

  upstreamUrl.pathname = `${withoutListings}/handles/${encodeURIComponent(handle)}/listings`;
  return upstreamUrl;
}

function buildUpstreamListingReportUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  upstreamUrl.pathname = normalizedPath.endsWith('/listings')
    ? `${normalizedPath}/report`
    : `${normalizedPath}/listings/report`;

  return upstreamUrl;
}

function buildUpstreamListingSearchUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );
  upstreamUrl.pathname = `${normalizedPath}/search`;
  return upstreamUrl;
}

function normalizeMlsHandleSlug(value: string) {
  const normalized = value.trim().replace(LEADING_AT_SYMBOL, '');
  if (!normalized || !HANDLE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

function normalizeMlsSellerHandle(value: string | null | undefined) {
  const rawHandle = value?.trim().replace(LEADING_AT_SYMBOL, '');
  if (!rawHandle || !HANDLE_PATTERN.test(rawHandle)) {
    return null;
  }

  return {
    handle: `@${rawHandle}`,
    slug: rawHandle.toLowerCase(),
  };
}

function normalizeFeedSearchQuery(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : null;
}

function normalizeTldFilter(value?: string | null) {
  const normalized = value?.trim().toLowerCase().replace(EDGE_DOTS_PATTERN, '');

  if (!normalized || !TLD_FILTER_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function domainMatchesTld(domain: string, tld: string) {
  return domain
    .trim()
    .toLowerCase()
    .replace(EDGE_DOTS_PATTERN, '')
    .endsWith(`.${tld}`);
}

function uniqueLowercaseStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  );
}

async function fetchSellerDirectorySourceRows(snapshotId: number | null) {
  if (snapshotId !== null) {
    return sellerDirectorySourceCache?.fetchedAt === snapshotId
      ? sellerDirectorySourceCache
      : null;
  }

  const now = Date.now();
  if (
    sellerDirectorySourceCache &&
    now - sellerDirectorySourceCache.fetchedAt <
      SELLER_DIRECTORY_SOURCE_CACHE_TTL_MS
  ) {
    return sellerDirectorySourceCache;
  }

  const rows: MlsListing[] = [];
  let cursor: string | null = null;
  let fetchedPages = 0;

  do {
    const page = await fetchUpstreamFeedPage({
      cursor,
      enrichSellerPortfolio: false,
      limit: MAX_MLS_FEED_LIMIT,
      query: null,
      tld: null,
    });
    rows.push(...page.rows);
    cursor = page.nextCursor;
    fetchedPages += 1;

    if (!page.hasMore || !cursor) {
      break;
    }
  } while (fetchedPages < MAX_SELLER_DIRECTORY_UPSTREAM_PAGES);

  sellerDirectorySourceCache = {
    rows,
    fetchedAt: now,
  };

  return sellerDirectorySourceCache;
}

function listingMatchesSellerDirectoryQuery(
  listing: MlsListing,
  query: string | null,
) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  const sellerHandle = normalizeMlsSellerHandle(listing.seller.username);
  const searchableValues = [
    listing.domain,
    listing.messageText,
    listing.seller.username,
    listing.seller.displayName,
    sellerHandle?.handle,
    sellerHandle?.slug,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedQuery),
  );
}

interface SellerDirectoryAggregate {
  handle: string;
  slug: string;
  displayName: string | null;
  domainSet: Set<string>;
  sourceTweetSet: Set<string>;
  sourceTweetUrls: string[];
  sampleDomains: string[];
  purchaseUrlCount: number;
  firstPostedAt: string;
  firstPostedTime: number;
  lastPostedAt: string;
  lastPostedTime: number;
  latestSourceTweetUrl: string;
}

interface SellerNamefiPortfolio {
  domains: Set<string>;
  count: number;
}

function aggregateSellerDirectoryRows(
  listings: MlsListing[],
  generatedAt: string,
  portfolios: Map<string, SellerNamefiPortfolio> = new Map(),
): MlsSellerDirectoryRow[] {
  const generatedTime = parseDateTime(generatedAt) ?? Date.now();
  const aggregates = new Map<string, SellerDirectoryAggregate>();

  for (const listing of listings) {
    const sellerHandle = normalizeMlsSellerHandle(listing.seller.username);
    if (!sellerHandle) {
      continue;
    }

    const postedTime =
      parseDateTime(listing.postedAt) ??
      parseDateTime(listing.listedAt) ??
      generatedTime;
    const normalizedDomain = listing.domain.trim().toLowerCase();
    const aggregate =
      aggregates.get(sellerHandle.slug) ??
      createSellerDirectoryAggregate(
        listing,
        sellerHandle,
        normalizedDomain,
        postedTime,
      );

    aggregates.set(sellerHandle.slug, aggregate);
    updateSellerDirectoryAggregate(
      aggregate,
      listing,
      normalizedDomain,
      postedTime,
    );
  }

  return Array.from(aggregates.values()).map((aggregate) =>
    toSellerDirectoryRow(aggregate, generatedTime, portfolios),
  );
}

function createSellerDirectoryAggregate(
  listing: MlsListing,
  sellerHandle: { handle: string; slug: string },
  normalizedDomain: string,
  postedTime: number,
): SellerDirectoryAggregate {
  return {
    handle: sellerHandle.handle,
    slug: sellerHandle.slug,
    displayName: normalizeNullableText(listing.seller.displayName),
    domainSet: new Set([normalizedDomain]),
    sourceTweetSet: new Set([listing.sourceTweetUrl]),
    sourceTweetUrls: [listing.sourceTweetUrl],
    sampleDomains: [normalizedDomain],
    purchaseUrlCount: 0,
    firstPostedAt: listing.postedAt,
    firstPostedTime: postedTime,
    lastPostedAt: listing.postedAt,
    lastPostedTime: postedTime,
    latestSourceTweetUrl: listing.sourceTweetUrl,
  };
}

function updateSellerDirectoryAggregate(
  aggregate: SellerDirectoryAggregate,
  listing: MlsListing,
  normalizedDomain: string,
  postedTime: number,
) {
  aggregate.displayName ??= normalizeNullableText(listing.seller.displayName);
  addUniqueValue(
    aggregate.domainSet,
    aggregate.sampleDomains,
    normalizedDomain,
    10,
  );
  addUniqueValue(
    aggregate.sourceTweetSet,
    aggregate.sourceTweetUrls,
    listing.sourceTweetUrl,
    5,
  );

  if (listing.purchaseUrl) {
    aggregate.purchaseUrlCount += 1;
  }

  if (postedTime < aggregate.firstPostedTime) {
    aggregate.firstPostedAt = listing.postedAt;
    aggregate.firstPostedTime = postedTime;
  }

  if (postedTime > aggregate.lastPostedTime) {
    aggregate.lastPostedAt = listing.postedAt;
    aggregate.lastPostedTime = postedTime;
    aggregate.latestSourceTweetUrl = listing.sourceTweetUrl;
  }
}

function addUniqueValue<T>(
  valueSet: Set<T>,
  samples: T[],
  value: T,
  sampleLimit: number,
) {
  if (valueSet.has(value)) {
    return;
  }

  valueSet.add(value);
  if (samples.length < sampleLimit) {
    samples.push(value);
  }
}

function toSellerDirectoryRow(
  aggregate: SellerDirectoryAggregate,
  generatedTime: number,
  portfolios: Map<string, SellerNamefiPortfolio>,
): MlsSellerDirectoryRow {
  const salePostCount = aggregate.sourceTweetSet.size;
  const domainCount = aggregate.domainSet.size;
  const namefiPortfolio = getSellerNamefiPortfolio(portfolios, aggregate.slug);
  const namefiDomainsCount = namefiPortfolio?.count ?? 0;
  const overlappingDomainsCount = namefiPortfolio
    ? countSetIntersection(aggregate.domainSet, namefiPortfolio.domains)
    : 0;
  const activeDays = Math.max(
    1,
    Math.ceil((aggregate.lastPostedTime - aggregate.firstPostedTime) / DAY_MS) +
      1,
  );
  const daysSinceLastPost = Math.max(
    0,
    Math.floor((generatedTime - aggregate.lastPostedTime) / DAY_MS),
  );

  return {
    priority: resolveSellerPriority(salePostCount, daysSinceLastPost),
    handle: aggregate.handle,
    displayName: aggregate.displayName,
    profileUrl: `https://x.com/${aggregate.slug}`,
    listingUrl: `/feed/users/${encodeURIComponent(aggregate.slug)}`,
    salePostCount,
    domainCount,
    namefiDomainsCount,
    tierDomainCount: getMlsSellerTierDomainCount({
      feedDomainsCount: domainCount,
      namefiDomainsCount,
      overlappingDomainsCount,
    }),
    postsPerWeek: round(salePostCount / (activeDays / 7), 2),
    domainsPerPost: round(domainCount / salePostCount, 2),
    purchaseUrlCount: aggregate.purchaseUrlCount,
    daysSinceLastPost,
    activeDays,
    firstPostedAt: aggregate.firstPostedAt,
    lastPostedAt: aggregate.lastPostedAt,
    latestSourceTweetUrl: aggregate.latestSourceTweetUrl,
    sampleDomains: aggregate.sampleDomains,
    sourceTweetUrls: aggregate.sourceTweetUrls,
  };
}

function resolveSellerPriority(
  salePostCount: number,
  daysSinceLastPost: number,
) {
  const activeWithin7Days = daysSinceLastPost <= 7;
  const activeWithin30Days = daysSinceLastPost <= 30;

  if (
    (activeWithin7Days && salePostCount >= 5) ||
    (activeWithin30Days && salePostCount >= 10)
  ) {
    return 'P0';
  }

  if (salePostCount >= 10 || (activeWithin30Days && salePostCount >= 3)) {
    return 'P1';
  }

  return 'P2';
}

function compareSellerDirectoryRows(
  left: MlsSellerDirectoryRow,
  right: MlsSellerDirectoryRow,
  sortBy: MlsSellerDirectorySortBy,
  sortOrder: MlsSellerDirectorySortOrder,
) {
  const direction = sortOrder === 'asc' ? 1 : -1;
  const primaryComparison =
    getSellerDirectorySortValue(left, sortBy) -
    getSellerDirectorySortValue(right, sortBy);

  if (primaryComparison !== 0) {
    return primaryComparison * direction;
  }

  return (
    right.salePostCount - left.salePostCount ||
    right.domainCount - left.domainCount ||
    getSellerDirectorySortValue(right, 'recent') -
      getSellerDirectorySortValue(left, 'recent') ||
    left.handle.localeCompare(right.handle)
  );
}

function getSellerDirectorySortValue(
  row: MlsSellerDirectoryRow,
  sortBy: MlsSellerDirectorySortBy,
) {
  switch (sortBy) {
    case 'domains':
      return row.domainCount;
    case 'recent':
      return parseDateTime(row.lastPostedAt) ?? 0;
    case 'cadence':
      return row.postsPerWeek;
    case 'salePosts':
      return row.salePostCount;
  }
}

function encodeSellerDirectoryCursor(offset: number, snapshotId: number) {
  return Buffer.from(JSON.stringify({ offset, snapshotId }), 'utf8').toString(
    'base64url',
  );
}

function decodeSellerDirectoryCursor(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as { offset?: unknown; snapshotId?: unknown };

    if (
      typeof payload.offset !== 'number' ||
      !Number.isInteger(payload.offset) ||
      payload.offset < 0 ||
      typeof payload.snapshotId !== 'number' ||
      !Number.isSafeInteger(payload.snapshotId) ||
      payload.snapshotId < 0
    ) {
      return null;
    }

    return {
      offset: payload.offset,
      snapshotId: payload.snapshotId,
    } satisfies SellerDirectoryCursor;
  } catch {
    return null;
  }
}

function parseDateTime(value: string) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeDomainSearchResponse(
  payload: MlsDomainSearchResponse,
): MlsDomainSearchResponse {
  const offersByDomain: Record<string, MlsListing> = {};
  for (const [domain, offer] of Object.entries(payload.offersByDomain)) {
    const normalizedDomain = domain.toLowerCase();
    offersByDomain[normalizedDomain] = {
      ...offer,
      domain: offer.domain.toLowerCase(),
    };
  }

  return {
    offersByDomain,
    generatedAt: payload.generatedAt,
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

async function extractErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    const normalized = payload.error?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}
