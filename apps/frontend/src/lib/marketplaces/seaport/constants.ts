import type { Address } from 'viem';

/**
 * Seaport v1.6 — deterministic deployment at the same address on every supported chain.
 * Used only for the on-chain cancel fallback; the OpenSea SDK handles the off-chain path.
 * https://docs.opensea.io/reference/seaport-overview
 */
export const SEAPORT_V1_6_ADDRESS: Address =
  '0x0000000000000068F116a894984e2DB1123eB395';

/**
 * OpenSea's Seaport conduit — the operator a seller approves via
 * `setApprovalForAll` so the protocol can transfer the NFT when a listing is
 * filled. Derived (CREATE2, via the ConduitController) from OpenSea's canonical
 * conduit key `0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000`
 * and deployed at the same address on every supported chain. Granting this
 * approval is the only on-chain transaction (and gas cost) in the otherwise
 * gasless, signature-only listing flow.
 */
export const OPENSEA_CONDUIT_ADDRESS: Address =
  '0x1E0049783F008A0085193E00003D00cd54003c71';
