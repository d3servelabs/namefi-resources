import { z } from 'zod';

import { createContract } from './create-contract';

/**
 * Contract for the NFT-marketplace proxy router.
 *
 * The router (`apps/backend/src/trpc/routers/nftMarketplacesRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof nftMarketplacesContract>`.
 *
 * Why this router exists: the OKX marketplace adapters
 * (`apps/frontend/src/lib/marketplaces/okx-adapter.ts`) cannot
 * call those vendor APIs directly from the browser. OKX HMAC-signs every
 * request with a secret. Secrets must not ship in the client bundle, so the
 * adapters call this router and the backend attaches the credentials.
 *
 * The router is a **thin passthrough** — it adds auth, forwards the request,
 * and returns the vendor response shape mostly untouched. All
 * vendor->internal translation lives in the frontend adapters, so the
 * outputs here are intentionally loose (`z.unknown()` for opaque order
 * blobs).
 *
 * Auth (see `nftMarketplacesRouter`): reads are `publicProcedure` (they
 * only expose what's already public on the OKX website); writes are
 * `protectedProcedure` so the backend isn't an unauthenticated relay that
 * burns the shared OKX quota.
 */

/** An opaque vendor response blob — parsed by the frontend marketplace adapter. */
const opaqueJsonSchema = z.unknown();

// ---------------------------------------------------------------------------
// OKX
// ---------------------------------------------------------------------------

/**
 * Query OKX listings/offers for a single NFT. `chain` is an OKX chain key
 * (e.g. "eth", "base") — see the OKX adapter's chain map.
 */
const okxOrdersQueryInputSchema = z.object({
  chain: z.string().min(1),
  collectionAddress: z.string().min(1),
  tokenId: z.string().min(1),
});

const okxOrdersOutputSchema = z.object({
  /** OKX pagination cursor; null/absent on the last page. */
  cursor: z.string().nullish(),
  /** Raw OKX order objects — parsed by the OKX adapter. */
  orders: z.array(z.unknown()),
});

const okxCreateListingInputSchema = z.object({
  chain: z.string().min(1),
  walletAddress: z.string().min(1),
  items: z
    .array(
      z.object({
        collectionAddress: z.string().min(1),
        tokenId: z.string().min(1),
        /** Price in the currency's smallest unit (wei for ETH), decimal string. */
        price: z.string().min(1),
        currencyAddress: z.string().min(1),
        /** NFT quantity — 1 for ERC-721. */
        count: z.number().int().positive(),
        /** Listing expiration, unix seconds. */
        validTime: z.number().int().positive(),
        /** Target listing platform key (e.g. "okx"). */
        platform: z.string().min(1),
      }),
    )
    .min(1),
});

/**
 * Args for OKX's website-internal `/priapi/v1/nft/trading/createListing` — the
 * working alternative to the now-dead public `okx.createListing`. Keyed by
 * OKX's internal `nftId` (resolve via `okx.getNftDetailInfo`) and uses the
 * numeric chain id as a string (e.g. `"8453"`).
 */
const okxCreateListingPriapiInputSchema = z.object({
  chain: z.string().min(1),
  walletAddress: z.string().min(1),
  items: z
    .array(
      z.object({
        nftId: z.string().min(1),
        price: z.string().min(1),
        currencyAddress: z.string().min(1),
        count: z.number().int().positive(),
        validTime: z.number().int().positive(),
        source: z.number().int(),
        royaltyFeePoints: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

/**
 * Submit a signed OKX order. `createListing` returns the Seaport
 * `OrderComponents` to sign; the adapter signs them and posts the result
 * here. `endpoint` + `body` come straight from the create-listing response's
 * `SignOrders` step `post` instruction — the backend validates `endpoint`
 * against an allowlist of OKX path prefixes before forwarding.
 */
const okxSubmitListingInputSchema = z.object({
  chain: z.string().min(1),
  endpoint: z.string().min(1),
  body: z.unknown(),
});

const okxBuyInputSchema = z.object({
  chain: z.string().min(1),
  walletAddress: z.string().min(1),
  items: z
    .array(
      z.object({
        orderId: z.string().min(1),
        takeCount: z.number().int().positive(),
      }),
    )
    .min(1),
});

/**
 * OKX marketplace trade fees. `tradeFees` is a percentage (`0.00` = 0%); the
 * endpoint is the source of truth as OKX's fee schedule shifts.
 */
const okxGetTradeFeesInputSchema = z.object({
  chain: z.number().int().positive().optional(),
  nftId: z.string().min(1).optional(),
});

const okxTradeFeesOutputSchema = z.object({
  /** OKX marketplace fee as a percentage (e.g. `0.00` = 0%, `2.5` = 2.5%). */
  tradeFees: z.number().nonnegative(),
  /** Address that receives the marketplace fee. */
  tradeFeesAddress: z.string().min(1),
});

/**
 * Look up OKX's internal `nftId` for a given (chain, contractAddress, tokenId).
 * Resolves to OKX's website-internal `/priapi/v1/nft/detail-info` payload — the
 * `id` field in the response IS the `nftId` the `/priapi/.../createListing`
 * flow requires.
 */
const okxGetNftDetailInfoInputSchema = z.object({
  /** Numeric chain id (e.g. `8453` for Base) — NOT the `/api/v5/` chain key string. */
  chain: z.number().int().positive(),
  contractAddress: z.string().min(1),
  tokenId: z.string().min(1),
});

const okxNftDetailInfoOutputSchema = z
  .object({
    /** OKX's internal NFT id — the `nftId` the create-listing flow needs. */
    id: z.string().min(1),
    /** Whether OKX supports trading this NFT — if `false`, listing will fail. */
    supportTrade: z.boolean(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const nftMarketplacesContract = createContract(
  { softOutput: false },
  {
    okx: {
      getListings: {
        type: 'query',
        input: okxOrdersQueryInputSchema,
        output: okxOrdersOutputSchema,
      },
      getOffers: {
        type: 'query',
        input: okxOrdersQueryInputSchema,
        output: okxOrdersOutputSchema,
      },
      createListing: {
        type: 'mutation',
        input: okxCreateListingInputSchema,
        output: opaqueJsonSchema,
      },
      submitListing: {
        type: 'mutation',
        input: okxSubmitListingInputSchema,
        output: opaqueJsonSchema,
      },
      buy: {
        type: 'mutation',
        input: okxBuyInputSchema,
        output: opaqueJsonSchema,
      },
      createListingPriapi: {
        type: 'mutation',
        input: okxCreateListingPriapiInputSchema,
        output: opaqueJsonSchema,
      },
      getNftDetailInfo: {
        type: 'query',
        input: okxGetNftDetailInfoInputSchema,
        output: okxNftDetailInfoOutputSchema,
      },
      getTradeFees: {
        type: 'query',
        input: okxGetTradeFeesInputSchema,
        output: okxTradeFeesOutputSchema,
      },
    },
  },
);

export type NftMarketplacesContract = typeof nftMarketplacesContract;
