# lib/marketplaces

## Purpose

Framework-agnostic abstraction layer for listing Namefi domain NFTs for sale on
Web3 marketplaces (OpenSea, Rarible, OKX, LooksRare). A single `MarketPlace`
interface with one adapter per marketplace behind a `getMarketplace()` factory;
the domain-detail
**Marketplace** tab consumes it through the hooks in
`apps/frontend/src/components/domain-and-dns-managment/panels/marketplace/use-listings.ts`.

## Full guide

The detailed developer + LLM guide is **`docs/dev-guides/marketplaces/`** — the
architecture reference, how to use the module, and how to add a new marketplace
adapter. That guide is the single source of truth; keep it updated when this
module changes.

- `docs/dev-guides/marketplaces/README.md` — overview, mental model, golden rules
- `docs/dev-guides/marketplaces/architecture.md` — interface, types, factory, hooks, data flow
- `docs/dev-guides/marketplaces/using-marketplaces.md` — consuming the module
- `docs/dev-guides/marketplaces/creating-an-adapter.md` — adding a marketplace

## Scope

- **Marketplaces:** OpenSea, Rarible (client-side); OKX, LooksRare (backend-proxied via the `nftMarketplaces` tRPC router).
- **Chains:** Ethereum mainnet, Base, Base Sepolia (`chains.ts`). Per-marketplace coverage varies — OKX is Ethereum + Base, LooksRare is Ethereum mainnet only.
- **v1 limits:** fixed-price listings, native currency only.
- **Layout:** `marketplace.interface.ts` (the contract) · `types.ts` (domain
  types) · `factory.ts` (`getMarketplace` + `MARKETPLACE_OPTIONS`) · `chains.ts`
  / `currencies.ts` (config) · `opensea-adapter.ts` + `opensea/` ·
  `rarible-adapter.ts` + `rarible/` · `okx-adapter.ts` + `okx/` ·
  `looksrare-adapter.ts` + `looksrare/` · `seaport/` (on-chain cancel bits) ·
  `proxy/` (browser tRPC client for the backend proxy).
