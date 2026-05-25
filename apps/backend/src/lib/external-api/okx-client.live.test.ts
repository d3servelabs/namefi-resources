import { describe, expect, it } from 'vitest';
import okxClient from './okx-client';

/**
 * Live integration tests for the OKX NFT marketplace API client.
 *
 * OKX HMAC-signs every request, so these are gated behind
 * `RUN_LIVE_MARKETPLACE_TESTS` *and* the OKX credentials being present. Run
 * them with the credentials injected (e.g. via Infisical):
 *
 *   RUN_LIVE_MARKETPLACE_TESTS=1 infisical run --token=$INFISICAL_SERVICE_TOKEN \
 *     -- bun --cwd apps/backend run test src/lib/external-api/okx-client.live.test.ts
 *
 * Scope: the READ endpoints. As of 2026-05 OKX's `create-listing` endpoint
 * returns `{ code: -1, msg: "No longer available" }` — OKX has disabled
 * programmatic listing on its own order book. Whether the read endpoints
 * still serve data is the open question these tests answer: if `getListings`
 * / `getOffers` resolve, OKX reads are alive; if they throw "No longer
 * available", OKX's NFT API is fully retired.
 */
const runLive = process.env.RUN_LIVE_MARKETPLACE_TESTS === '1';
const hasOkxCreds = okxClient.isConfigured();

/** A well-known NFT collection on Ethereum mainnet (Pudgy Penguins). */
const SAMPLE = {
  chain: 'eth',
  collectionAddress: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
  tokenId: '1',
};

describe.skipIf(!runLive || !hasOkxCreds)('OKX client (live)', () => {
  it('fetches listings for an NFT', async () => {
    const { orders } = await okxClient.getListings(SAMPLE);
    expect(Array.isArray(orders)).toBe(true);
  });

  it('fetches offers for an NFT', async () => {
    const { orders } = await okxClient.getOffers(SAMPLE);
    expect(Array.isArray(orders)).toBe(true);
  });
});
