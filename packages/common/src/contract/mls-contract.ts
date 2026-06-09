import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';

/**
 * Contract for the MLS (Marketplace Listing Service) router.
 *
 * The router (`apps/backend/src/trpc/routers/mlsRouter.ts`) is type-checked
 * against this contract via `createContractTRPCRouter<typeof mlsContract>`.
 *
 * The contract knows nothing about authentication or middleware — those
 * decisions stay at the procedure-definition site in the router file. This
 * file lives in `@namefi-astra/common` so the same contract types can be
 * consumed by the frontend (e.g. via `ContractRouter<typeof mlsContract>`
 * for `inferRouterInputs`).
 *
 * Schemas were lifted directly from the original `mlsRouter.ts` (which had
 * already been written in the contract style with explicit
 * `.input(...).output(...)` chains).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_MLS_FEED_LIMIT = 20;
export const MAX_MLS_FEED_LIMIT = 50;
export const DEFAULT_MLS_SELLER_MIN_POSTS = 10;

export const mlsListingReportReasons = [
  'already_sold',
  'inaccurate_price',
  'not_for_sale',
  'duplicate_listing',
  'other',
] as const;

// ---------------------------------------------------------------------------
// Shared row schema
// ---------------------------------------------------------------------------

const mlsSellerPortfolioFieldsSchema = {
  namefiDomainsCount: z.number().int().nonnegative().optional().default(0),
  tierDomainCount: z.number().int().nonnegative().optional().default(0),
};

export const mlsListingSourceSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  kind: z.enum(['social', 'internal_marketplace', 'external']),
  url: z.string().trim().min(1),
});

export const mlsListingSchema = z.object({
  id: z.string().min(1),
  domain: z.string().min(1),
  logoUrl: z.string().nullable().optional().default(null),
  askingPrice: z.string().nullable(),
  askingCurrency: z.string().nullable(),
  purchaseUrl: z.string().nullable(),
  messageText: z.string().nullable(),
  seller: z.object({
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    ...mlsSellerPortfolioFieldsSchema,
  }),
  otherDomainsCount: z.number().int().nonnegative().optional().default(0),
  source: mlsListingSourceSchema,
  sourceTweetUrl: z.string().min(1),
  postedAt: z.string().min(1),
  listedAt: z.string().min(1),
});

export type MlsListingSource = z.infer<typeof mlsListingSourceSchema>;
export type MlsListing = z.infer<typeof mlsListingSchema>;

// ---------------------------------------------------------------------------
// getFeed
// ---------------------------------------------------------------------------

export const mlsFeedInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_MLS_FEED_LIMIT)
    .optional()
    .default(DEFAULT_MLS_FEED_LIMIT),
  cursor: z.string().trim().min(1).nullish(),
  query: z.string().trim().max(120).nullish(),
  tld: z.string().trim().max(191).nullish(),
});

export const mlsFeedPageSchema = z.object({
  rows: z.array(mlsListingSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
});

export type MlsFeedPage = z.infer<typeof mlsFeedPageSchema>;

// ---------------------------------------------------------------------------
// getSellers
// ---------------------------------------------------------------------------

export const mlsSellerDirectorySortBySchema = z.enum([
  'salePosts',
  'domains',
  'recent',
  'cadence',
]);

export const mlsSellerDirectorySortOrderSchema = z.enum(['asc', 'desc']);

export const mlsSellerPrioritySchema = z.enum(['P0', 'P1', 'P2']);

export const mlsSellerDirectoryInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_MLS_FEED_LIMIT)
    .optional()
    .default(DEFAULT_MLS_FEED_LIMIT),
  cursor: z.string().trim().min(1).nullish(),
  query: z.string().trim().max(120).nullish(),
  tld: z.string().trim().max(191).nullish(),
  minSalePosts: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .default(DEFAULT_MLS_SELLER_MIN_POSTS),
  activeWithinDays: z.number().int().min(1).max(365).nullish(),
  sortBy: mlsSellerDirectorySortBySchema.optional().default('salePosts'),
  sortOrder: mlsSellerDirectorySortOrderSchema.optional().default('desc'),
});

export const mlsSellerDirectoryRowSchema = z.object({
  priority: mlsSellerPrioritySchema,
  handle: z.string().min(1),
  displayName: z.string().nullable(),
  profileUrl: z.string().min(1),
  listingUrl: z.string().min(1),
  salePostCount: z.number().int().nonnegative(),
  domainCount: z.number().int().nonnegative(),
  namefiDomainsCount: z.number().int().nonnegative().default(0),
  tierDomainCount: z.number().int().nonnegative().default(0),
  postsPerWeek: z.number().nonnegative(),
  domainsPerPost: z.number().nonnegative(),
  purchaseUrlCount: z.number().int().nonnegative(),
  daysSinceLastPost: z.number().int().nonnegative(),
  activeDays: z.number().int().positive(),
  firstPostedAt: z.string().min(1),
  lastPostedAt: z.string().min(1),
  latestSourceTweetUrl: z.string().min(1),
  sampleDomains: z.array(z.string().min(1)),
  sourceTweetUrls: z.array(z.string().min(1)),
});

export const mlsSellerDirectoryPageSchema = z.object({
  rows: z.array(mlsSellerDirectoryRowSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  generatedAt: z.string().min(1),
});

export type MlsSellerDirectorySortBy = z.infer<
  typeof mlsSellerDirectorySortBySchema
>;
export type MlsSellerDirectorySortOrder = z.infer<
  typeof mlsSellerDirectorySortOrderSchema
>;
export type MlsSellerPriority = z.infer<typeof mlsSellerPrioritySchema>;
export type MlsSellerDirectoryRow = z.infer<typeof mlsSellerDirectoryRowSchema>;
export type MlsSellerDirectoryPage = z.infer<
  typeof mlsSellerDirectoryPageSchema
>;

// ---------------------------------------------------------------------------
// getHandleListings
// ---------------------------------------------------------------------------

export const mlsHandleListingsInputSchema = z.object({
  handle: z.string().trim().min(1),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_MLS_FEED_LIMIT)
    .optional()
    .default(DEFAULT_MLS_FEED_LIMIT),
  cursor: z.string().trim().min(1).nullish(),
});

export const mlsHandleListingsPageSchema = z.object({
  handle: z.string().min(1),
  seller: z.object({
    authorId: z.string().nullable(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    ...mlsSellerPortfolioFieldsSchema,
  }),
  rows: z.array(mlsListingSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
  totalDomains: z.number().int().nonnegative(),
});

export type MlsHandleListingsPage = z.infer<typeof mlsHandleListingsPageSchema>;

// ---------------------------------------------------------------------------
// reportListing
// ---------------------------------------------------------------------------

export const mlsReportInputSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum(mlsListingReportReasons),
  details: z.string().trim().max(1_000).optional(),
});

export const mlsReportResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['active', 'resolved']),
});

export type MlsReportResponse = z.infer<typeof mlsReportResponseSchema>;

// ---------------------------------------------------------------------------
// searchDomainOffers
// ---------------------------------------------------------------------------

export const mlsDomainSearchInputSchema = z.object({
  domains: z.array(z.string().min(1)).min(1).max(200),
});

export const mlsDomainSearchResponseSchema = z.object({
  offersByDomain: z.record(z.string(), mlsListingSchema),
  generatedAt: z.string().min(1),
});

export type MlsDomainSearchResponse = z.infer<
  typeof mlsDomainSearchResponseSchema
>;

// ---------------------------------------------------------------------------
// getCurrentUserListedDomains
// ---------------------------------------------------------------------------

export const mlsCurrentUserListedDomainSchema = z.object({
  domain: z.string().min(1),
  sourceTweetUrl: z.string().min(1).nullable(),
  listedAt: z.string().min(1).nullable(),
});

export const mlsCurrentUserListedDomainsResponseSchema = z.object({
  twitterHandle: z.string().min(1).nullable(),
  domains: z.array(mlsCurrentUserListedDomainSchema),
});

export type MlsCurrentUserListedDomainsResponse = z.infer<
  typeof mlsCurrentUserListedDomainsResponseSchema
>;

// ---------------------------------------------------------------------------
// Marketplace listing feed lifecycle
// ---------------------------------------------------------------------------

const mlsMarketplaceIdSchema = z.enum(['opensea', 'rarible', 'okx']);

const mlsMarketplaceListingIdentitySchema = z.object({
  domainName: namefiNormalizedDomainSchema,
  marketplaceId: mlsMarketplaceIdSchema,
  chainId: z.number().int().positive(),
  tokenAddress: checksumWalletAddressSchema,
  tokenId: z.string().trim().min(1),
  listingId: z.string().trim().min(1).max(512),
  sellerAddress: checksumWalletAddressSchema,
});

export const mlsRecordNamefiMarketplaceListingCreatedInputSchema =
  mlsMarketplaceListingIdentitySchema.extend({
    priceRaw: z.string().trim().regex(/^\d+$/),
    priceDecimal: z.string().trim().min(1).max(64),
    currencySymbol: z.string().trim().min(1).max(24),
    currencyAddress: checksumWalletAddressSchema,
    listingUrl: z.string().trim().url().max(2048),
    listedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  });

export const mlsRecordNamefiMarketplaceListingCancelledInputSchema =
  mlsMarketplaceListingIdentitySchema.extend({
    listingUrl: z.string().trim().url().max(2048).optional(),
    cancelledAt: z.string().datetime().optional(),
  });

export const mlsRecordNamefiMarketplaceListingLifecycleResponseSchema =
  z.object({
    synced: z.boolean(),
  });

export type MlsRecordNamefiMarketplaceListingCreatedInput = z.infer<
  typeof mlsRecordNamefiMarketplaceListingCreatedInputSchema
>;
export type MlsRecordNamefiMarketplaceListingCancelledInput = z.infer<
  typeof mlsRecordNamefiMarketplaceListingCancelledInputSchema
>;

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const mlsContract = createContract(
  { softOutput: true },
  {
    getFeed: {
      type: 'query',
      input: mlsFeedInputSchema,
      output: mlsFeedPageSchema,
    },

    getSellers: {
      type: 'query',
      input: mlsSellerDirectoryInputSchema,
      output: mlsSellerDirectoryPageSchema,
    },

    getHandleListings: {
      type: 'query',
      input: mlsHandleListingsInputSchema,
      output: mlsHandleListingsPageSchema,
    },

    reportListing: {
      type: 'mutation',
      input: mlsReportInputSchema,
      output: mlsReportResponseSchema,
    },

    searchDomainOffers: {
      type: 'query',
      input: mlsDomainSearchInputSchema,
      output: mlsDomainSearchResponseSchema,
    },

    getCurrentUserListedDomains: {
      type: 'query',
      input: z.void(),
      output: mlsCurrentUserListedDomainsResponseSchema,
    },

    recordNamefiMarketplaceListingCreated: {
      type: 'mutation',
      input: mlsRecordNamefiMarketplaceListingCreatedInputSchema,
      output: mlsRecordNamefiMarketplaceListingLifecycleResponseSchema,
    },

    recordNamefiMarketplaceListingCancelled: {
      type: 'mutation',
      input: mlsRecordNamefiMarketplaceListingCancelledInputSchema,
      output: mlsRecordNamefiMarketplaceListingLifecycleResponseSchema,
    },
  },
);

export type MlsContract = typeof mlsContract;
