import type { Address } from 'viem';

/**
 * Seaport v1.6 — deterministic deployment at the same address on every supported chain.
 * Used only for the on-chain cancel fallback; the OpenSea SDK handles the off-chain path.
 * https://docs.opensea.io/reference/seaport-overview
 */
export const SEAPORT_V1_6_ADDRESS: Address =
  '0x0000000000000068F116a894984e2DB1123eB395';
