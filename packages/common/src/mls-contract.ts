import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

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
  }),
  otherDomainsCount: z.number().int().nonnegative().optional().default(0),
  sourceTweetUrl: z.string().min(1),
  postedAt: z.string().min(1),
  listedAt: z.string().min(1),
});

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
});

export const mlsFeedPageSchema = z.object({
  rows: z.array(mlsListingSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int().positive(),
});

export type MlsFeedPage = z.infer<typeof mlsFeedPageSchema>;

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
// The contract
// ---------------------------------------------------------------------------

export const mlsContract = {
  getFeed: {
    type: 'query',
    input: mlsFeedInputSchema,
    output: mlsFeedPageSchema,
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
} as const satisfies RouterContract;

export type MlsContract = typeof mlsContract;
