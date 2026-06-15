import { describe, expect, it } from 'vitest';
import { getOkxClient } from './okx-client';

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
const hasOkxCreds = getOkxClient().isConfigured();

/** A well-known NFT collection on Ethereum mainnet (Pudgy Penguins). */
const SAMPLE = {
  chain: 'eth',
  collectionAddress: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
  tokenId: '1',
};

/**
 * A Namefi NFT on Base — the contract the user actually lists on OKX.
 * Used to probe whether the public read endpoints expose OKX's internal
 * `nftId` (required by `/priapi/.../createListing`) as a passthrough field.
 */
const NAMEFI_BASE = {
  chain: 'base',
  collectionAddress: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
  tokenId:
    '21566448524101138150075329647689973848436879916789281993601523690510645643019',
};

/** Sample wallet known to hold Namefi NFTs (per the example in okx-client.ts). */
const TEST_WALLET = '0xb5856d4598c919834913b8656ebc15a64d3c7836';

describe.skipIf(!runLive || !hasOkxCreds)('OKX client (live)', () => {
  it('fetches listings for an NFT', async () => {
    const { orders } = await getOkxClient().getListings(SAMPLE);
    expect(Array.isArray(orders)).toBe(true);
  });

  it('fetches offers for an NFT', async () => {
    const { orders } = await getOkxClient().getOffers(SAMPLE);
    expect(Array.isArray(orders)).toBe(true);
  });

  // --- nftId probes: dump full responses to inspect for the internal `nftId`
  //     field beyond the documented shape. ---

  it('probes NFT detail for nftId', async () => {
    const data = await getOkxClient().getNftDetail({
      chain: NAMEFI_BASE.chain,
      contractAddress: NAMEFI_BASE.collectionAddress,
      tokenId: NAMEFI_BASE.tokenId,
    });
    console.log('NFT_DETAIL:', JSON.stringify(data, null, 2));
    expect(data).toBeTruthy();
  });

  it('probes owner assets for nftId', async () => {
    const data = await getOkxClient().getOwnerAssets({
      chain: NAMEFI_BASE.chain,
      ownerAddress: TEST_WALLET,
      contractAddress: NAMEFI_BASE.collectionAddress,
      limit: 5,
    });
    console.log('OWNER_ASSETS:', JSON.stringify(data, null, 2));
    expect(data).toBeTruthy();
  });

  it('probes Namefi listings on Base for nftId', async () => {
    const { orders } = await getOkxClient().getListings({
      chain: NAMEFI_BASE.chain,
      collectionAddress: NAMEFI_BASE.collectionAddress,
      tokenId: NAMEFI_BASE.tokenId,
    });
    console.log('NAMEFI_LISTINGS:', JSON.stringify(orders, null, 2));
    expect(Array.isArray(orders)).toBe(true);
  });

  it('fetches OKX trade fees via /priapi/v1/nft/order/tradeFees', async () => {
    const fees = await getOkxClient().getTradeFees({ chain: 8453 });
    console.log('OKX_TRADE_FEES:', fees);
    expect(typeof fees.tradeFees).toBe('number');
    expect(fees.tradeFees).toBeGreaterThanOrEqual(0);
    expect(typeof fees.tradeFeesAddress).toBe('string');
    expect(fees.tradeFeesAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('resolves nftId via /priapi/v1/nft/detail-info', async () => {
    // hqlm.org NFT on Base — unlisted; the SSR HTML doesn't expose nftId
    // for unlisted NFTs, so the `/priapi/` lookup is the only path.
    const info = await getOkxClient().getNftDetailInfo({
      chain: 8453,
      contractAddress: NAMEFI_BASE.collectionAddress,
      tokenId:
        '8680459076598675616260084018453355686055974852740558019738627026083244233991',
    });
    console.log('NFT_ID_LOOKUP:', {
      id: info.id,
      supportTrade: info.supportTrade,
      tokenId: info.tokenId,
      collectionName: info.collectionName,
    });
    // Known value captured from a real browser session against the same NFT.
    expect(info.id).toBe('30008033106992646');
    expect(info.supportTrade).toBe(true);
  });
});
