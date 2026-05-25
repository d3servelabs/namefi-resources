import { BASE_MAINNET_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from '../chains';

/**
 * Chain ID → OKX chain key. The key is the `chain` parameter on every OKX
 * marketplace API call. OKX has no testnet for the NFT marketplace API, so
 * Base Sepolia is intentionally absent — the adapter is registered for
 * Ethereum mainnet and Base only (see `ADAPTER_CHAIN_SUPPORT` in `chains.ts`).
 */
export const CHAIN_ID_TO_OKX_CHAIN: Record<number, string> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: 'eth',
  [BASE_MAINNET_CHAIN_ID]: 'base',
};

/** Resolve the OKX chain key, or `undefined` for an unsupported chain. */
export function getOkxChainKey(chainId: number): string | undefined {
  return CHAIN_ID_TO_OKX_CHAIN[chainId];
}

/** OKX Web3 site base — used to build the `externalUrl` for an order. */
export const OKX_SITE_BASE = 'https://web3.okx.com';

/**
 * Conduit key OKX's Seaport listings are built with — the OpenSea canonical
 * conduit, per OKX's `create-listing` API docs. The seller's NFT approval is
 * granted to this conduit.
 */
export const OKX_CONDUIT_KEY =
  '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';

/** OKX endpoint that accepts a client-built, signed Seaport listing order. */
export const OKX_SUBMIT_ORDER_ENDPOINT =
  '/priapi/v1/nft/trading/seaport/step/submitOrder';

/**
 * Platform key passed to OKX `create-listing`.
 *
 * TEMPORARY — under investigation. Set to `'opensea'` to test whether OKX's
 * create-listing endpoint still works when routing a listing to a third-party
 * market: `platform: 'okx'` (OKX's own orderbook) currently returns
 * `{ code: -1, "No longer available" }`. Revert to `'okx'` once the OKX
 * listing path is resolved.
 */
export const OKX_LISTING_PLATFORM = 'okx';

/**
 * OKX marketplace protocol fee, in basis points — estimate only.
 *
 * Derived from the documented `create-listing` example (a 50,000,000-unit
 * listing splits into 49,000,000 to the seller + 1,000,000 to OKX = 2%). The
 * authoritative fee is whatever OKX bakes into the Seaport `consideration`
 * at order-build time; this constant only drives the pre-listing fee preview.
 */
export const OKX_PROTOCOL_FEE_BPS = 200;

/** Minimal ERC-721 ABI — `setApprovalForAll`, for the OKX listing approval step. */
export const ERC721_SET_APPROVAL_FOR_ALL_ABI = [
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

/** Minimal ERC-20 ABI — `approve`, for the OKX buy/accept currency-approval step. */
export const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
