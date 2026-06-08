# Creating a Marketplace Adapter

A step-by-step guide to adding support for a new marketplace (Magic Eden, Blur, …). Read [architecture.md](./architecture.md) first for the contract and types.

## TL;DR

- Adding a marketplace = **one new adapter** implementing `MarketPlace`, plus **three small wiring edits** (`types.ts`, `chains.ts`, `factory.ts`).
- The **panel UI and the hooks need zero changes** — they fan out over whatever `getMarketplacesSupportedOnChain()` returns.
- Translate the vendor's data into the **internal `Listing`/`Offer` types**. No vendor type escapes the adapter.
- Prefer a **hybrid** adapter: raw REST + `zod` for reads, a vendor SDK only where signing/EIP-712 is involved.
- Budget ~80 % of the effort for `getExistingListings` / `getOffersForListing` (read + correctly adapt) and `createListing` (build + sign + post).
- If the vendor needs a **server-held secret** (HMAC signing, a mandatory API key) the adapter can't be client-side — it routes API calls through a backend proxy. See [Proxied Adapters](#proxied-adapters-server-held-secrets).

> **Not the same thing:** external vendor API reference docs (request/response specs) live under `docs/marketplaces/`. *This* guide is about the internal adapter module.

## Golden Rules (Strict)

1. **Implement the entire `MarketPlace` interface.** All 13 members. An operation the marketplace truly can't do throws `MarketplaceUnsupportedOperationError` — it is never omitted.
2. **Reads take no wallet.** `getExistingListings` / `getOffersForListing` must work with only a `publicClient`. The factory passes `walletClient` only for writes.
3. **Adapt to the internal types.** Return `Listing` / `Offer` / `ListingFees` — never a vendor object. Stash vendor data you'll need later in the opaque `raw` field.
4. **Hybrid by default.** Use a vendor SDK *only* for operations where it removes signing/EIP-712 risk. Use raw `fetch` + `zod` schemas for reads. Validate every REST response with `zod`.
5. **Dynamic-import heavy deps inside write methods.** A vendor SDK must not be a static import of the adapter module — that would pull it into the read path. `import()` it where it's used.
6. **Throw the typed errors.** `MarketplaceUnsupportedChainError`, `MarketplaceNotConfiguredError`, `MarketplaceUnsupportedOperationError` — from `marketplace.interface.ts`.
7. **Prices in wei, timestamps in ISO 8601.** `ListingPrice.raw` is a wei decimal string; `expirationTime`/`createdAt` are ISO strings. For "no expiry" use a far-future sentinel, never epoch 0.

## Checklist

For a new marketplace with id `foo`:

1. Add `'foo'` to `MarketplaceId` in `apps/frontend/src/lib/marketplaces/types.ts`.
2. Add a `foo` entry to `ADAPTER_CHAIN_SUPPORT` in `chains.ts`.
3. Add a `foo` entry to `MARKETPLACE_OPTIONS` and a `getMarketplace()` branch in `factory.ts` (plus a `FooAdapterArgs` interface).
4. Create `apps/frontend/src/lib/marketplaces/foo/` — `constants.ts`, `api-schemas.ts` (zod), `rest-client.ts`, and any vendor-SDK/signing bridge.
5. Create `apps/frontend/src/lib/marketplaces/foo-adapter.ts` — `class FooAdapter implements MarketPlace`.
6. If the vendor needs a key: add `NEXT_PUBLIC_FOO_API_KEY` to `clientSideEnvSchema` in `apps/frontend/src/lib/env/schema.ts`. If using a vendor SDK: add the dep to `apps/frontend/package.json`.
7. Adapt every vendor response into `Listing` / `Offer` (wei prices, ISO timestamps, `OrderStatus`, `externalUrl`, `raw`).
8. Validate: `bun run typecheck`, `bun run check`, and add a story arg to `marketplace-panel.stories.tsx`.

Done — the panel now shows `foo` listings/offers and lists `foo` in the create-listing modal automatically.

## Steps in Detail

### 1. Register the id

`types.ts`:

```ts
export type MarketplaceId = 'opensea' | 'rarible' | 'okx' | 'looksrare' | 'foo';
```

`tsc` will now flag every exhaustive switch / `Record<MarketplaceId, …>` that's
missing `foo` — a useful checklist of what to wire.

### 2. Declare chain support

`chains.ts` — add `foo` to `ADAPTER_CHAIN_SUPPORT` with the chains it supports
(reuse `MARKETPLACE_SUPPORTED_CHAINS`, or a subset):

```ts
const ADAPTER_CHAIN_SUPPORT: Record<MarketplaceId, readonly number[]> = {
  opensea: MARKETPLACE_SUPPORTED_CHAINS,
  rarible: MARKETPLACE_SUPPORTED_CHAINS,
  okx: [ETHEREUM_MAINNET_CHAIN_ID, BASE_MAINNET_CHAIN_ID],
  looksrare: [ETHEREUM_MAINNET_CHAIN_ID],
  foo: [BASE_MAINNET_CHAIN_ID],
};
```

If `foo` works on a chain not yet in `MARKETPLACE_SUPPORTED_CHAINS`, add the
chain there too. From this point the hooks will *try* to call `foo` on those
chains — so the adapter must exist before this lands.

### 3. Wire the factory

`factory.ts`:

```ts
export interface FooAdapterArgs extends GetMarketplaceArgs {
  apiKey: string; // or `string | undefined` if the key is optional
}

// inside getMarketplace(), after the chain-support check:
if (args.id === 'foo') {
  const apiKey = clientSideEnv.NEXT_PUBLIC_FOO_API_KEY;
  if (!apiKey) {
    throw new MarketplaceNotConfiguredError('foo', 'NEXT_PUBLIC_FOO_API_KEY');
  }
  const { FooAdapter } = await import('./foo-adapter');
  return new FooAdapter({ ...args, apiKey });
}
```

And add to `MARKETPLACE_OPTIONS`:

```ts
{ id: 'foo', label: 'Foo', description: 'Post directly to the Foo orderbook.' },
```

The `import('./foo-adapter')` is what keeps the adapter (and its deps) out of the
app-shell bundle.

### 4. Build the `foo/` subdirectory

Mirror the existing `opensea/` and `rarible/` folders:

- **`constants.ts`** — chain-id → vendor chain identifier maps, API base URLs (prod/testnet), a site base URL for `externalUrl`, the protocol-fee constant. Provide a `getFooEnv(chainId)` style helper that **throws on an unsupported chain** rather than defaulting silently.
- **`api-schemas.ts`** — `zod` schemas for every vendor REST response you parse. This is the single source of truth for the vendor's API contract; a vendor shape change throws here instead of producing garbage.
- **`rest-client.ts`** — a thin typed `fetch` wrapper. One method per endpoint. Validate responses with the `zod` schemas. Add an `AbortSignal.timeout(...)` to every request so a stalled connection can't hang the panel.
- **A signing bridge, if needed** — if the vendor SDK isn't viem-native, add a bridge (Rarible's `viem-ethers-signer.ts` wraps the viem wallet as an ethers v5 signer).
- **A retry helper, if the vendor rate-limits** — see `rarible/retry.ts` (`withRaribleRetry`).

### 5. Write the adapter

`foo-adapter.ts` — `class FooAdapter implements MarketPlace`. Skeleton:

```ts
export class FooAdapter implements MarketPlace {
  readonly id = 'foo' as const;
  readonly displayName = 'Foo';
  readonly chainId: number;

  private readonly rest: FooRestClient;
  private readonly walletClient: FooAdapterArgs['walletClient'];
  // …publicClient, apiKey, chain-specific config…

  constructor(args: FooAdapterArgs) {
    // Validate the chain; throw MarketplaceUnsupportedChainError if unmapped.
    this.chainId = args.chainId;
    this.walletClient = args.walletClient;
    this.rest = new FooRestClient({ chainId: args.chainId, apiKey: args.apiKey });
  }

  // discovery
  getAvailableListingTypes() { return ['fixed-price'] as const; }
  getAvailableListingCurrency() {
    return getListingCurrenciesForChain(this.chainId).filter((c) => c.isNative);
  }
  async calculateListingFees(input) { /* FOO_PROTOCOL_FEE_BPS, isEstimate: true */ }

  // reads — REST, no wallet
  async getExistingListings(query) {
    const orders = await this.rest.getListings(query);
    return orders.map((o) => this.adaptToListing(o, query));
  }
  async getOffersForListing(query) { /* …adaptToOffer… */ }

  // writes — need a wallet; dynamic-import the SDK here
  async createListing(input) {
    if (!this.walletClient) throw new Error('Wallet not connected.');
    const { createFooSdk } = await import('@foo/sdk');
    // …build + sign + post, then return a Listing…
  }
  async cancelListing(listing) { /* … */ }
  async approveOffer(offer) { /* … */ }

  async updateListing(listing, input) {
    await this.cancelListing(listing);
    return this.createListing(input);
  }
  rejectOffer(): Promise<never> {
    throw new MarketplaceUnsupportedOperationError(
      'foo', 'reject an offer',
      "orderbook marketplaces don't support active rejection.",
    );
  }
}
```

`updateListing` = cancel + create is the standard implementation (orderbooks have
no native update). `rejectOffer` throwing `MarketplaceUnsupportedOperationError`
is also standard — copy it.

### 6. Env & dependencies

If the vendor requires an API key, add it to `clientSideEnvSchema`
(`apps/frontend/src/lib/env/schema.ts`) as
`NEXT_PUBLIC_FOO_API_KEY: z.string().optional()`, and read it in the factory.
Mark it optional — the panel must degrade gracefully (the hooks'
`Promise.allSettled` tolerates one adapter being unconfigured).

If you add a vendor SDK, add it to `apps/frontend/package.json`. Pin
deliberately and prefer the last stable version. If it bundles awkwardly in
Next.js, `transpilePackages` in `next.config.ts` is the escape hatch.

### 7. Adapt vendor data → internal types

This is where most bugs live. For every `Listing`/`Offer` you return:

- **`id`** — the vendor's stable order hash/id.
- **`price`** — build a `ListingPrice`: `raw` is the wei amount as a **decimal string**, `decimal` is `Number(formatUnits(...))` **for display only**, `currency` resolved via `findCurrencyByAddress`.
- **`createdAt` / `expirationTime`** — ISO 8601 strings. Convert vendor unix seconds with `new Date(s * 1000).toISOString()`. For an order with no expiry, use a **far-future sentinel** (see Rarible's `NO_EXPIRATION_ISO`), never `new Date(0)`.
- **`status`** — map the vendor's status into `OrderStatus` (`'active' | 'filled' | 'cancelled' | 'expired'`).
- **`externalUrl`** — a link to view/manage the order on the marketplace site.
- **`raw`** — stash whatever the *write* methods will need (the vendor order object, a protocol address). Nothing else reads it.

### 8. Validate

```bash
cd apps/frontend && bun run typecheck
bun run check          # biome (run from repo root)
```

Add an arg/story to `apps/frontend/src/stories/pages/marketplace-panel.stories.tsx`
so the new marketplace has visual-regression coverage. Then test live behind the
OpenFeature `marketplace-listings` flag (`?skip_auth=1` for local auth bypass).

## Reference Implementations

Study these four — they bracket the design space.

| Adapter | Demonstrates |
|---|---|
| `opensea-adapter.ts` + `opensea/` | Client-side, SDK-centric. The vendor SDK builds/signs/posts orders **and** serves reads. REST covers a single SDK gap. On-chain `Seaport.cancel` fallback. Auto-requested API key (no env var). |
| `rarible-adapter.ts` + `rarible/` | Client-side. REST for **all** reads (no SDK on the read path); SDK only for writes, dynamic-imported inside the write methods. A viem→ethers v5 signing bridge. Rate-limit middleware + `withRaribleRetry` backoff. Request timeouts. `NEXT_PUBLIC_*` key. |
| `okx-adapter.ts` + `okx/` | **Proxied** + **Seaport-based** (see both sections below). Extends `SeaportMarketplace` — the base builds/signs/cancels/fulfils the Seaport order client-side; the adapter only supplies OKX reads (proxied) and the orderbook hooks. `legacy-okx-adapter.ts` preserves the prior OKX-API-driven adapter as a reference. |
| `looksrare-adapter.ts` + `looksrare/` | **Proxied** (see below). `@looksrare/sdk-v2` (ethers v5) builds/signs/cancels/fulfills; reads + the order POST go through the proxy. Reuses Rarible's viem→ethers bridge. Ethereum-mainnet only. |

If the vendor has a viem-native SDK and a clean read API, you'll look like
OpenSea. If the SDK is ethers-only / heavy and the REST API is good, you'll look
like Rarible. If the vendor needs a server-held secret, you'll be **proxied** —
read on.

## Proxied Adapters (Server-Held Secrets)

Some marketplaces shouldn't run fully client-side. If a vendor **HMAC-signs
every request with a secret** (OKX), that secret cannot ship in the browser
bundle — a `NEXT_PUBLIC_*` var is world-readable — so the adapter **must** be
proxied. A marketplace with an *optional* server-side key (LooksRare — its key
only raises rate limits) is also routed through the proxy, so the key stays
server-side when set. Proxied adapters route their vendor API calls through a
**backend tRPC proxy**.

The proxy is `nftMarketplacesRouter`
(`apps/backend/src/trpc/routers/nftMarketplacesRouter.ts`), backed by the
contract `packages/common/src/contract/nft-marketplaces-contract.ts`. It is a
**thin passthrough** — it attaches credentials, forwards the request, and
returns the vendor's response shape mostly untouched. All vendor→internal
translation still happens in the frontend adapter, exactly as for a client-side
one.

What differs from a client-side adapter:

- **The secret lives in the backend.** Add it to `secretsSchema` in
  `apps/backend/src/lib/env/schema.ts` — optional, so the backend still boots
  without it — *not* to `clientSideEnvSchema`. A backend HTTP client under
  `apps/backend/src/lib/external-api/` holds it and signs / authenticates the
  vendor request.
- **The adapter calls the proxy, not the vendor.** It imports
  `marketplaceProxyClient` (`lib/marketplaces/proxy/trpc-client.ts`) — a vanilla
  (non-React) browser tRPC client — and calls e.g.
  `marketplaceProxyClient.nftMarketplaces.okx.getListings.query(...)`. There is
  no `rest-client.ts`, no `NEXT_PUBLIC_*` key, and no key on the constructor.
- **The factory branch takes no `apiKey`.** `getMarketplace()` just
  dynamic-imports the adapter and constructs it with `GetMarketplaceArgs`
  directly — credential resolution happens server-side.
- **Wallet work stays client-side.** EIP-712 signing, on-chain approvals,
  cancels, and fulfillment transactions still run in the adapter against the
  `walletClient`. Only the vendor *API* calls are proxied.
- **Each vendor API call needs a contract procedure.** Add it to the nested
  `okx` / `looksrare` (or a new `<vendor>`) block of the contract, implement it
  in the router, and back it with a method on the backend HTTP client. Keep
  procedure outputs loose (`z.unknown()`) — the adapter parses them.

Reads in a proxied adapter still degrade gracefully: catch the
"not configured" error and return `[]`, so an unprovisioned marketplace simply
contributes nothing instead of failing the whole panel.

## Seaport-Based Adapters

Most NFT marketplaces (OpenSea, OKX, Blur, …) are **Seaport** marketplaces —
they share one on-chain protocol and differ only in their *orderbook* (where
orders are stored and discovered). For these, extend the `SeaportMarketplace`
abstract base (`seaport/seaport-marketplace.ts`) instead of implementing
`MarketPlace` from scratch.

The base builds, signs, cancels and fulfils Seaport orders **client-side** via
`@opensea/seaport-js`'s `Seaport` class — instantiated **per marketplace**, so a
subclass sets its own Seaport `contractAddress` + `conduitKey` and the adapter
never depends on a vendor's order-builder API. The `Seaport` client runs on an
ethers v6 signer bridged from the viem wallet (`seaport/viem-ethers-v6.ts`;
ethers v6 is aliased as `ethers-v6` in `package.json`, alongside the repo's
ethers v5). The base implements `createListing`, `cancelListing`,
`updateListing`, `approveOffer`, `rejectOffer` and the discovery/fee methods
concretely. A subclass supplies only identity + the orderbook:

- `id` / `displayName` — identity.
- `seaportContractAddress` / `seaportConduitKey` — the Seaport deployment.
- `getExistingListings` / `getOffersForListing` — the vendor read API.
- `submitOrder(order, input)` — publish a built + signed order to the vendor's
  orderbook.
- `toSeaportOrder(order)` — recover the Seaport order from a `Listing`/`Offer`
  `raw` blob, so the base can cancel / fulfil it.
- `buildExternalUrl(tokenAddress, tokenId)`.

`okx-adapter.ts` is the reference: it extends `SeaportMarketplace`, configures
OKX's Seaport deployment, reads through the OKX proxy, and `submitOrder` POSTs
the client-built order to OKX's `submitOrder` endpoint via the backend
`okx.submitListing` proxy. `legacy-okx-adapter.ts` is the prior OKX-API-driven
adapter, preserved as a reference and not wired into the factory.

Use this base only when the marketplace is genuinely Seaport-based; a
non-Seaport marketplace implements `MarketPlace` directly, per the checklist
above.

## Common Pitfalls

- **Envelope-key mismatches.** Vendor list endpoints wrap their array under a key. Get it wrong and `zod` (if you used `.default([])`) silently yields `[]` — orders "fetch fine" but never render. OpenSea's offers endpoint keys the array under `offers`, not `orders` — exactly this bug bit once. Validate the *real* response shape; make the schema strict enough to fail loudly.
- **Epoch-0 expiration.** Falling back to `new Date(0)` for a missing end time makes a no-expiry order read as already-expired (and sort first). Use a far-future sentinel — Rarible's `NO_EXPIRATION_ISO`.
- **Field-shape drift.** A wrong field path (`current_price` vs `price.current.value`) yields `0` amounts / `1970` dates. Adapt against the *actual* response, not a guess.
- **Rate limits.** Free vendor tiers 429 aggressively, and one SDK call can burst several HTTP calls. Defenses: pace SDK calls (Rarible's 2 s `apiClientParams.middleware`) and retry with backoff (`withRaribleRetry`). A 429 means the key *is* recognized — that's throttling, not auth failure.
- **The viem↔ethers boundary.** This app is viem/wagmi. An ethers-only SDK needs a bridge (`rarible/viem-ethers-signer.ts`). ethers v5 and v6 can coexist (different majors, isolated) — pin to whatever the vendor SDK expects.
- **Bundle size.** Vendor SDKs are large. Keep them behind `import()` — in the factory (the adapter module) and inside the adapter's write methods (the SDK). Reads must never pull an SDK.
- **Storybook / Chromatic.** The marketplace panel story has no `TRPCProvider` and primes the React Query cache directly. Don't make the panel call tRPC; keep panel inputs prop-driven (that's why `isReadyForExport` is a prop). Adding a `useTRPC()` to the panel would break the stories.

## For AI Agents

Execute in this exact order. Replace `foo` with the lowercase marketplace id;
paths are repo-relative from the repo root.

1. **Read first:** `apps/frontend/src/lib/marketplaces/marketplace.interface.ts`, `types.ts`, `factory.ts`, `chains.ts`, and the existing adapters (`opensea-adapter.ts` / `rarible-adapter.ts` for client-side; `okx-adapter.ts` / `looksrare-adapter.ts` for proxied) with their subdirs. The new adapter must match these patterns.
2. `apps/frontend/src/lib/marketplaces/types.ts` — add `'foo'` to `MarketplaceId`.
3. `apps/frontend/src/lib/marketplaces/chains.ts` — add `foo` to `ADAPTER_CHAIN_SUPPORT`.
4. Create `apps/frontend/src/lib/marketplaces/foo/constants.ts`, `foo/api-schemas.ts`, `foo/rest-client.ts` (+ a signing bridge / retry helper if the vendor needs one).
5. Create `apps/frontend/src/lib/marketplaces/foo-adapter.ts` — `class FooAdapter implements MarketPlace`, all 13 members. `updateListing` = cancel+create; `rejectOffer` throws `MarketplaceUnsupportedOperationError`.
6. `apps/frontend/src/lib/marketplaces/factory.ts` — add `FooAdapterArgs`, a `getMarketplace()` branch (dynamic `import('./foo-adapter')`), and a `MARKETPLACE_OPTIONS` entry.
7. If a key is needed: add `NEXT_PUBLIC_FOO_API_KEY` to `clientSideEnvSchema` in `apps/frontend/src/lib/env/schema.ts`. If a vendor SDK is used: add it to `apps/frontend/package.json` and run `bun install`.
8. Do **not** edit `use-listings.ts` or any `panels/marketplace/` component — the fan-out is automatic. The only panel-adjacent edit is an optional story arg in `apps/frontend/src/stories/pages/marketplace-panel.stories.tsx`.
9. Validate: `cd apps/frontend && bun run typecheck`, then `bun run check` from the repo root. Fix every error and warning in the files you touched.
10. Re-read your `getExistingListings` / `getOffersForListing` adaptation against the *real* vendor response shape — confirm `price.raw` is wei, timestamps are ISO, status maps to `OrderStatus`, and the list envelope key is correct (see [Common Pitfalls](#common-pitfalls)).
