# Using Marketplaces

How to consume the marketplace module in a feature — reading listings/offers, creating/cancelling/accepting orders, and rendering the panel. For the architecture behind this, see [architecture.md](./architecture.md); to add a new marketplace, see [creating-an-adapter.md](./creating-an-adapter.md).

## TL;DR

- In React, you use **five hooks** from `apps/frontend/src/components/domain-and-dns-managment/panels/marketplace/use-listings.ts`: `useListings`, `useOffers`, `useCreateListing`, `useCancelListing`, `useAcceptOffer`.
- The hooks fan out over **every** supported marketplace automatically — you pass `{ chainId, tokenAddress, tokenId }`, not a marketplace id (except `useCreateListing`, where the user picks one).
- To render the whole tab, just mount **`<MarketplacePanel>`** — it composes the cards, hooks, and states for you.
- You almost never call `getMarketplace()` directly. Do that only in non-React code.
- Reads work without a wallet; writes need a connected wallet on the NFT's chain (the hooks enforce this).

## Quick Start

**Render the whole Marketplace tab:**

```tsx
import { MarketplacePanel } from '@/components/domain-and-dns-managment/panels/marketplace/marketplace-panel';

<MarketplacePanel domain="alice.com" nftChainId={8453} />;
```

**Or read listings yourself:**

```tsx
import { useListings } from '@/components/domain-and-dns-managment/panels/marketplace/use-listings';

function ListingCount({ chainId, tokenAddress, tokenId }) {
  const { data: listings, isLoading } = useListings({ chainId, tokenAddress, tokenId });
  if (isLoading) return <Spinner />;
  return <span>{listings?.length ?? 0} active listings</span>;
}
```

That is the common case. The rest of this doc is the detail.

## Reading Listings & Offers

**`useListings` and `useOffers` are `useQuery` wrappers — read-only, no wallet needed.**

```ts
useListings(args: {
  chainId: number;
  tokenAddress: Address;   // the NFT contract
  tokenId: string;         // decimal token id
  enabled?: boolean;       // defaults true
}): UseQueryResult<Listing[]>

useOffers(args: { /* identical shape */ }): UseQueryResult<Offer[]>
```

Behaviour:

- Both **fan out over every marketplace** supported on `chainId` and merge the results — you never pick a marketplace for a read.
- Results are **deduped by order `id`**. `useListings` sorts by `expirationTime`; `useOffers` sorts by **price descending** (top bid first).
- **Partial failure is tolerated.** If one marketplace errors (e.g. Rarible without an API key) the other's results still render. The query only rejects if *every* marketplace fails.
- Standard React Query result — use `data`, `isLoading`, `error`, `refetch`.

Each item is a `Listing` / `Offer` (see [architecture.md#domain-types](./architecture.md#domain-types)). Display price with `item.price.decimal` + `item.price.currency.symbol`; never compute with `decimal` — use `price.raw` (wei string) for math.

## Writing

**`useCreateListing` / `useCancelListing` / `useAcceptOffer` are `useMutation` wrappers — they require a connected wallet on the NFT's chain.**

All three take the same args object and fetch a fresh wallet/public client inside the mutation:

```ts
useCreateListing(args: {
  chainId: number;
  tokenAddress: Address;
  tokenId: string;
  onSuccess?: (listing: Listing) => void;
}): UseMutationResult<Listing, Error, { marketplaceId: MarketplaceId; input: ListingInput }>

useCancelListing(args: { /* same args */ }):
  UseMutationResult<Listing, Error, { listing: Listing }>

useAcceptOffer(args: { /* same args */ }):
  UseMutationResult<Offer, Error, { offer: Offer }>
```

Note the **mutation argument shapes**:

- `useCreateListing` → `mutateAsync({ marketplaceId, input })`. The user explicitly picks the marketplace; `input` is a `ListingInput`.
- `useCancelListing` → `mutateAsync({ listing })`. The marketplace is read off `listing.marketplace`.
- `useAcceptOffer` → `mutateAsync({ offer })`. The marketplace is read off `offer.marketplace`.

`ListingInput` (from `types.ts`):

```ts
interface ListingInput {
  tokenAddress: Address;
  tokenId: string;
  priceWei: bigint;        // price in wei
  currency: Address;       // must be one returned by getAvailableListingCurrency()
  durationSeconds: number; // listing lifetime
  listingType: ListingType;// 'fixed-price' in v1
  startTimeSeconds?: number;
  endPriceWei?: bigint;    // dutch-auction only
}
```

Example:

```tsx
const createListing = useCreateListing({
  chainId,
  tokenAddress,
  tokenId,
  onSuccess: (listing) => toast.success(`Listed on ${listing.source}`),
});

await createListing.mutateAsync({
  marketplaceId: 'opensea',
  input: {
    tokenAddress,
    tokenId,
    priceWei: parseEther('0.05'),
    currency: NATIVE_TOKEN_ADDRESS,
    durationSeconds: 7 * 24 * 60 * 60,
    listingType: 'fixed-price',
  },
});
```

Requirements the hooks enforce: a wallet must be connected, and it must be on
`chainId` (switch the chain *before* calling — the mutation reads the client
fresh, so a just-completed switch is picked up). A missing wallet throws
`Error('Connect a wallet to continue.')`.

On success the hooks invalidate the listings/offers query keys, so any mounted
`useListings`/`useOffers` refetches automatically.

## Discovery

Helpers for building marketplace UI:

| Helper | From | Returns |
|---|---|---|
| `MARKETPLACE_OPTIONS` | `lib/marketplaces/factory.ts` | `{ id, label, description }[]` — render this as the marketplace picker. |
| `getMarketplacesSupportedOnChain(chainId)` | `lib/marketplaces/chains.ts` | `MarketplaceId[]` usable on that chain. |
| `isChainSupportedByAnyMarketplace(chainId)` | `lib/marketplaces/chains.ts` | whether the Marketplace tab should render at all. |
| `getListingCurrenciesForChain(chainId)` | `lib/marketplaces/currencies.ts` | `ListingCurrency[]` for a currency picker. |

To list which listing types / currencies a *specific* adapter supports, build it
via `getMarketplace()` and call `getAvailableListingTypes()` /
`getAvailableListingCurrency()`.

## The Panel & Feature Flag

`<MarketplacePanel>` is the drop-in component for the whole tab.

```ts
interface MarketplacePanelProps {
  domain: string;
  nftChainId: number | bigint;
  isReadyForExport?: boolean;       // domain is exportable → blocks listing
  isExportStatusLoading?: boolean;  // export check in flight → show skeleton
}
```

It is mounted in `domain-management.tsx` behind the **`marketplace_listing`**
admin feature flag (`scope: 'page'`, `pageKey: 'users'`, default `false`). When
the flag is off, the tab doesn't render.

`isReadyForExport` / `isExportStatusLoading` are passed down by
`domain-management.tsx` from `trpc.domainConfig.getDomainExportDetails`
(`readyToExport`). A domain that is exportable to another registrar can't be
listed — its NFT may be burned on export — so the panel shows `ExportBlockedCard`
instead of the listings/offers. If you mount `<MarketplacePanel>` somewhere new,
fetch that query and pass the props (don't make the panel query tRPC itself).

## Calling the Factory Directly

Only outside React (scripts, non-component code). In components, use the hooks.

```ts
import { getMarketplace } from '@/lib/marketplaces/factory';

const adapter = await getMarketplace({
  id: 'opensea',
  chainId: 8453,
  publicClient,            // required
  walletClient,            // omit for read-only
});
const listings = await adapter.getExistingListings({ tokenAddress, tokenId });
```

An adapter instance is **bound to one `(id, chainId)` and its clients**. To
switch chains, build a new adapter — don't reuse one across chains.

## Errors, Env & Telemetry

**Errors.** Catch and branch on the typed errors from `marketplace.interface.ts`:

| Error | Surface to the user as |
|---|---|
| `MarketplaceUnsupportedChainError` | "Marketplace listings aren't supported on this network." |
| `MarketplaceNotConfiguredError` | a config gap — usually swallowed for reads (the other marketplace still works). |
| `MarketplaceUnsupportedOperationError` | "This marketplace can't do X." (e.g. rejecting an offer) |

Rate-limit / network errors surface as plain messages — the create-listing modal
maps a `429`/"rate limit" message to a friendly "try again in a minute" notice.

**Env.** `NEXT_PUBLIC_RARIBLE_API_KEY` (in `clientSideEnvSchema`,
`apps/frontend/src/lib/env/schema.ts`) is required for Rarible. Without it,
`getMarketplace('rarible', …)` throws `MarketplaceNotConfiguredError` and the
panel degrades to OpenSea-only. OpenSea needs **no** env var — its key is
auto-requested client-side.

**Telemetry.** Two events in `InteractionLoggingEventName`
(`apps/frontend/src/lib/analytics-events.ts`), logged via `useInteractionLoggers`:

| Event | Payload |
|---|---|
| `MarketplaceListingCreated` | `{ domainName, marketplaceId, chainId, priceWei, currencySymbol }` |
| `MarketplaceListingCancelled` | `{ domainName, marketplaceId, chainId }` |

`CreateListingModal` fires the first on a successful listing; `CurrentListingsCard`
fires the second on a successful cancel. Reuse these events rather than adding new
ones for marketplace actions.

## Testing & Storybook

The panel has stories in `apps/frontend/src/stories/pages/marketplace-panel.stories.tsx`
(`EmptyListings`, `WithActiveListings`, `UnsupportedChain`, `WalletNotConnected`,
`ExportBlocked`).

Two patterns worth copying if you write marketplace stories:

- **Cache-prime instead of mocking the network.** The story seeds React Query directly — `queryClient.setQueryData(['marketplace-listings', chainId, tokenAddress, tokenId], listings)` — with a story `QueryClient` set to `staleTime: Infinity` + `refetchOnMount: false`. The hooks then read cached data and never hit a real adapter.
- **Feed panel inputs as props, not tRPC.** The story has no `TRPCProvider`. `MarketplacePanel` takes `isReadyForExport` as a *prop* precisely so it stays renderable in Storybook/Chromatic without a tRPC mock. Keep new panel inputs prop-driven for the same reason.

See [docs/dev-guides/storybook](../storybook/README.md) for the general story
rules (providers, App Router pitfalls).
