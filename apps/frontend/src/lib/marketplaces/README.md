# lib/marketplaces

## Purpose

Framework-agnostic abstraction layer over the OpenSea marketplace. The `MarketPlace`
interface exposes a uniform API (create / read / cancel / update listings, view / accept
offers, fee + currency discovery) so adding a new marketplace later is a matter of
writing a new adapter — the UI in `panels/marketplace/` stays unchanged.

## Context

Built for GitHub issue [#4120](https://github.com/d3servelabs/namefi-astra/issues/4120).
The "Marketplace" tab on the domain detail page uses this module to let domain-NFT
owners list their domains for sale on OpenSea, view incoming offers, and accept them.

## Scope

**v1 adapter**: `OpenSeaAdapter` — hybrid integration:
- `@opensea/sdk/viem` for order construction + EIP-712 signing + off-chain cancel
  + reads (`sdk.api.getBestListing` / `getBestOffer` against OpenSea's slug-based
  v2 endpoints).
- `OpenSeaRestClient` (raw v2 REST + zod) for the one endpoint the SDK doesn't
  wrap: `POST /api/v2/offers/fulfillment_data` — OpenSea returns ready-to-send
  transaction calldata which we forward to viem's `walletClient
  .sendTransaction(...)` for the actual accept-offer tx.
- viem `writeContract` against Seaport's `cancel(OrderComponents[])` as the
  on-chain fallback for cancel when the off-chain path is unavailable.

**API key**: auto-requested via `OpenSeaSDK.requestInstantApiKey(apiBaseUrl)` on
first use, cached in `localStorage` keyed by base URL (mainnet + testnet keys are
separate), refreshed when within 1 day of the API-returned `expires_at`. No
`NEXT_PUBLIC_OPENSEA_API_KEY` env var is required — the key is requested
client-side per-user. If the request fails (rate-limited, offline), the adapter
falls back to an unauthenticated client (still works, just rate-limited reads).

**v1 interface surface** (`marketplace.interface.ts`):
- `getAvailableListingTypes` — `['fixed-price']` (SDK 10.5 doesn't expose Dutch/English)
- `getAvailableListingCurrency` — chain native asset only (SDK 10.5 dropped
  `paymentTokenAddress` from `createListing`)
- `calculateListingFees` — 1.0% OpenSea protocol fee + 0 royalty (estimate; final fees
  computed by the SDK from on-chain ERC-2981 at signing time)
- `createListing` — fixed-price, native currency
- `getExistingListings` — OpenSea v2 REST `/api/v2/orders/{chain}/seaport/listings`
- `cancelListing` — off-chain (gas-free) first, on-chain `Seaport.cancel` fallback
- `updateListing` — cancel + create-new (Seaport has no native update)
- `getOffersForListing` — OpenSea v2 REST `/api/v2/orders/{chain}/seaport/offers`
- `approveOffer` — `/api/v2/offers/fulfillment_data` → viem `sendTransaction`
- `rejectOffer` — throws `MarketplaceUnsupportedOperationError` (Seaport orderbooks
  have no active-rejection primitive)

## Files

- `types.ts` — shared shapes: `Listing`, `Offer`, `ListingInput`, `ListingPrice`,
  `ListingCurrency`, `ListingFees`.
- `marketplace.interface.ts` — the `MarketPlace` interface + error classes.
- `chains.ts` — supported chain allowlist (Ethereum mainnet, Base, Base Sepolia).
  Sepolia is intentionally excluded — OpenSea SDK v10.5's `Chain` enum doesn't include
  it at runtime, so all SDK paths fail. Base Sepolia is the canonical testnet.
- `currencies.ts` — `(chainId → ListingCurrency[])` hardcoded matrix. Includes ERC-20
  entries (WETH/USDC/USDT/DAI/EURC) for future use, but the OpenSea adapter currently
  filters to the native asset only.
- `factory.ts` — `getMarketplace({ id, chainId, publicClient, walletClient })` with a
  dynamic `import('./opensea-adapter')` so the SDK chunk stays out of the app shell.
- `opensea-adapter.ts` — the hybrid adapter described above.
- `opensea/` — OpenSea-specific helpers:
  - `constants.ts` — chain-ID → SDK `Chain` enum + REST path slug map, base URLs
    (+ `getOpenSeaApiBaseUrl(chainId)` helper), protocol fee constant (100 bps as
    of Sep 2025).
  - `api-key.ts` — `getOrRequestApiKey(apiBaseUrl)`: localStorage-cached instant
    API key, auto-refreshed via `OpenSeaSDK.requestInstantApiKey`.
  - `api-schemas.ts` — `zod` schemas for the v2 REST shapes the SDK doesn't
    parse for us (currently just `/offers/fulfillment_data`).
  - `rest-client.ts` — typed `fetch` wrapper for `/offers/fulfillment_data`
    (the only endpoint the SDK doesn't cover).
- `seaport/` — Seaport contract bits used only for the on-chain cancel fallback:
  - `constants.ts` — `SEAPORT_V1_6_ADDRESS` (deterministic across chains).
  - `abi.ts` — minimal Seaport `cancel(OrderComponents[])` + ERC-2981 `royaltyInfo`.

## Architectural notes

- **SDK does the order construction**, we don't. Previous iterations built Seaport
  orders by hand (`order-builder.ts`) and re-implemented EIP-712 signing — both got
  brittle after API/protocol changes. The SDK is the right line of defense for those
  details.
- **SDK serves reads.** Listings/offers go through `sdk.api.getBestListing(slug,
  tokenId)` and `getBestOffer(slug, tokenId)`. The previous direct
  `/api/v2/orders/{chain}/seaport/listings` GET path returned 405 (that endpoint is
  POST-only for order creation). The SDK uses the correct slug-based read paths
  (`/api/v2/listings/collection/{slug}/nfts/{tokenId}/best`).
- **Collection slug lookup** is cached per-adapter via `sdk.api.getNFTCollection`.
  One extra API call on first read for a given contract; subsequent reads are
  cache hits.
- **Status detection** uses the SDK's normalized `OrderStatus` enum (the SDK maps
  v2's boolean flags into `ACTIVE` / `FULFILLED` / `CANCELLED` / `EXPIRED` /
  `INACTIVE` for us).
- **Offer acceptance uses OpenSea's pre-built transaction**, not a manual Seaport
  `fulfillOrder` ABI call. The `/offers/fulfillment_data` endpoint returns
  `{ to, value, input_data }` ready to send via `walletClient.sendTransaction`.
- **Dynamic import** in `factory.ts` keeps the SDK (and its transitive ethers v6
  dependency, ≈250KB gz) out of the app-shell bundle — only loaded when the user
  opens the Marketplace tab.
- **Per-call adapter construction** — viem `publicClient` and `walletClient` are
  captured in the adapter's closure, so individual methods don't take them as args.
  Switching chains means building a new adapter via `getMarketplace`.
