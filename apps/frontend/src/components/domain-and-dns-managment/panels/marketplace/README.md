# panels/marketplace

## Purpose

UI panel for the **Marketplace** tab on the domain detail page. Lets the domain-NFT owner
list their domain for sale on OpenSea, view + accept incoming offers, and cancel listings.

## Context

Built for GitHub issue [#4120](https://github.com/d3servelabs/namefi-astra/issues/4120).
Replaces the previous "List for Sale" Coming-Soon dialog on the My Domains page (the icon
there now route-pushes to `/domains/<name>?tab=marketplace`).

Gated behind the OpenFeature `marketplace-listings` flag, backed by LaunchDarkly.
Off by default.

## Scope

- Read current listings (OpenSea v2 REST validated through `zod`, sorted by expiry).
- Create a fixed-price listing in the chain's native asset (ETH).
- View incoming offers and accept them (`/offers/fulfillment_data` → viem
  `sendTransaction`).
- Cancel listings (off-chain via OpenSea SDK first; on-chain `Seaport.cancel`
  fallback).
- Hide entire panel on chains not in `MARKETPLACE_SUPPORTED_CHAINS` (Ethereum mainnet,
  Base, Base Sepolia).

Out of scope for v1:
- ERC-20 listings (USDC, WETH, etc.) — OpenSea SDK 10.5 dropped the
  `paymentTokenAddress` parameter from `createListing`; multi-currency listings need
  manual Seaport order construction (deliberately avoided).
- Dutch / English auctions — same reason.
- Active offer rejection — Seaport orderbooks have no primitive for it (the seller's
  only options are accept, ignore until expiry, or `Seaport.incrementCounter` which
  invalidates **all** of the seller's own outstanding orders).
- Sepolia — OpenSea SDK 10.5's `Chain` enum doesn't include it at runtime; use Base
  Sepolia for testnet.

## Files

- `marketplace-panel.tsx` — entry point, switches between cards or unsupported-chain
  state.
- `current-listings-card.tsx` — table of active listings + per-row cancel button.
- `offers-card.tsx` — table of incoming offers + per-row accept button.
- `create-listing-card.tsx` — form: marketplace selector, price + currency (single
  native option for now), duration, fee preview.
- `unsupported-chain-empty-state.tsx` — friendly empty state for unsupported chains.
- `use-listings.ts` — React Query hooks: `useListings`, `useOffers`,
  `useCreateListing`, `useCancelListing`, `useAcceptOffer`.
- `safe-external-url.ts` — http/https whitelist for marketplace-supplied links.

## Architectural notes

- All leaves are `'use client'`. The adapter is pulled lazily via `getMarketplace()`
  (dynamic import) so the `@opensea/sdk` chunk (with its transitive ethers v6
  dependency, ≈250KB gz) doesn't enter the Next.js app-shell bundle.
- The adapter is reconstructed per mutation call rather than cached. This avoids stale
  wallet/chain state when the user switches wallets mid-session and keeps the React
  Query cache simple.
- All amounts are stored as `bigint` wei; only the display layer touches
  `formatUnits(...)`.
- Fee preview uses a hardcoded 1.0% OpenSea protocol fee + 0 royalty estimate. The
  SDK adds royalties from the collection's on-chain ERC-2981 implementation at signing
  time, so the UI marks the preview as an estimate with a badge.
