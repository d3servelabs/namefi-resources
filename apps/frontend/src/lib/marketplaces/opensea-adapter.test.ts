import { beforeEach, describe, expect, it, vi } from 'vitest';

// Spies for the SDK methods our adapter drives, shared with the module mock.
const { fulfillOrderMock, batchApproveAssetsMock } = vi.hoisted(() => ({
  fulfillOrderMock: vi.fn(),
  batchApproveAssetsMock: vi.fn(),
}));

// fulfillListing/approveOffer hand the order off to the OpenSea SDK (which
// fetches fulfillment data, ABI-encodes the Seaport call, and sends it). We
// mock the SDK so the test asserts our adapter's contract with it — not the
// network or a real chain.
vi.mock('@opensea/sdk/viem', () => ({
  OpenSeaSDK: vi.fn().mockImplementation(() => ({
    fulfillOrder: fulfillOrderMock,
    batchApproveAssets: batchApproveAssetsMock,
    api: {},
  })),
  OrderStatus: {
    ACTIVE: 'ACTIVE',
    FULFILLED: 'FULFILLED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    INACTIVE: 'INACTIVE',
  },
  Chain: { Mainnet: 'ethereum', Base: 'base', BaseSepolia: 'base_sepolia' },
  TokenStandard: { ERC20: 'ERC20', ERC721: 'ERC721', ERC1155: 'ERC1155' },
}));

import { ETHEREUM_MAINNET_CHAIN_ID } from './chains';
import { OpenSeaAdapter } from './opensea-adapter';
import type { Listing, Offer } from './types';

const BUYER = '0x1111111111111111111111111111111111111111';

// Minimal viem-ish clients — the SDK is mocked, so these only need to satisfy
// the adapter's constructor (rpc-url extraction + wallet address read).
function fakePublicClient() {
  return {
    transport: { url: 'http://localhost:8545' },
    chain: {
      id: ETHEREUM_MAINNET_CHAIN_ID,
      rpcUrls: { default: { http: ['http://localhost:8545'] } },
    },
    // biome-ignore lint/suspicious/noExplicitAny: test double
  } as any;
}

function fakeWalletClient(address: string = BUYER) {
  // biome-ignore lint/suspicious/noExplicitAny: test double
  return { account: { address } } as any;
}

function makeAdapter(opts?: { withWallet?: boolean }) {
  return new OpenSeaAdapter({
    id: 'opensea',
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
    publicClient: fakePublicClient(),
    walletClient: opts?.withWallet === false ? undefined : fakeWalletClient(),
    apiKey: 'test-key',
  });
}

function fakeListing(): Listing {
  return {
    id: '0xorderhash',
    marketplace: 'opensea',
    source: 'OpenSea',
    tokenAddress: '0x0000000000cf80E7Cf8Fa4480907f692177f8e06',
    tokenId: '123',
    seller: '0x2222222222222222222222222222222222222222',
    price: {
      raw: '1000000000000000000',
      decimal: 1,
      currency: {
        contract: '0x0000000000000000000000000000000000000000',
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
      },
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    expirationTime: '2099-01-01T00:00:00.000Z',
    status: 'active',
    externalUrl: 'https://opensea.io/assets/ethereum/0x/123',
    // The enriched SDK order we stored in `adaptSdkListing` — what fulfillOrder
    // must receive verbatim.
    raw: { order_hash: '0xorderhash', protocol_address: '0xseaport' },
  };
}

function fakeOffer(): Offer {
  return {
    id: '0xofferhash',
    marketplace: 'opensea',
    source: 'OpenSea',
    tokenAddress: '0x0000000000cf80E7Cf8Fa4480907f692177f8e06',
    tokenId: '123',
    bidder: '0x3333333333333333333333333333333333333333',
    price: {
      raw: '500000000000000000',
      decimal: 0.5,
      currency: {
        contract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        isNative: false,
      },
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    expirationTime: '2099-01-01T00:00:00.000Z',
    status: 'active',
    externalUrl: 'https://opensea.io/assets/ethereum/0x/123',
    raw: { order_hash: '0xofferhash', protocol_address: '0xseaport' },
  };
}

describe('OpenSeaAdapter.fulfillListing', () => {
  beforeEach(() => {
    fulfillOrderMock.mockReset();
    batchApproveAssetsMock.mockReset();
  });

  it('delegates to sdk.fulfillOrder with the raw order + buyer, returning its tx hash', async () => {
    fulfillOrderMock.mockResolvedValue('0xdeadbeef');
    const listing = fakeListing();

    const result = await makeAdapter().fulfillListing(listing);

    expect(fulfillOrderMock).toHaveBeenCalledTimes(1);
    expect(fulfillOrderMock).toHaveBeenCalledWith({
      order: listing.raw,
      accountAddress: BUYER,
    });
    expect(result).toEqual({ txHash: '0xdeadbeef' });
  });

  it('throws (without calling the SDK) when no wallet is connected', async () => {
    await expect(
      makeAdapter({ withWallet: false }).fulfillListing(fakeListing()),
    ).rejects.toThrow(/wallet not connected/i);
    expect(fulfillOrderMock).not.toHaveBeenCalled();
  });

  it('propagates SDK fulfillment errors (e.g. a wallet rejection) to the caller', async () => {
    fulfillOrderMock.mockRejectedValue(new Error('User rejected the request'));
    await expect(makeAdapter().fulfillListing(fakeListing())).rejects.toThrow(
      /user rejected/i,
    );
  });
});

describe('OpenSeaAdapter.approveOffer', () => {
  beforeEach(() => {
    fulfillOrderMock.mockReset();
    batchApproveAssetsMock.mockReset();
  });

  it('approves the NFT to the conduit, then fulfills the offer order', async () => {
    batchApproveAssetsMock.mockResolvedValue(undefined); // already approved
    fulfillOrderMock.mockResolvedValue('0xfeed');
    const offer = fakeOffer();

    const result = await makeAdapter().approveOffer(offer);

    // Approval must happen (seller's NFT) and target the offer's token.
    expect(batchApproveAssetsMock).toHaveBeenCalledTimes(1);
    expect(batchApproveAssetsMock).toHaveBeenCalledWith({
      assets: [
        {
          asset: {
            tokenAddress: offer.tokenAddress,
            tokenId: offer.tokenId,
            tokenStandard: 'ERC721',
          },
        },
      ],
      fromAddress: BUYER,
    });
    expect(fulfillOrderMock).toHaveBeenCalledWith({
      order: offer.raw,
      accountAddress: BUYER,
    });
    expect(result).toEqual({ txHash: '0xfeed' });
  });

  it('throws (without touching the SDK) when no wallet is connected', async () => {
    await expect(
      makeAdapter({ withWallet: false }).approveOffer(fakeOffer()),
    ).rejects.toThrow(/wallet not connected/i);
    expect(batchApproveAssetsMock).not.toHaveBeenCalled();
    expect(fulfillOrderMock).not.toHaveBeenCalled();
  });
});

describe('OpenSeaAdapter.getCapabilities', () => {
  it('advertises buyer-side fulfillment', () => {
    expect(makeAdapter().getCapabilities().canFulfillListing).toBe(true);
  });
});
