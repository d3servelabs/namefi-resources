/**
 * x402-signer transaction activities (split send / confirm / nonce).
 *
 * Thin instantiation of the shared `createEthTxPrimitives` factory with the
 * x402 signer's viem clients and a fixed gas cap. Used by the pinned-nonce
 * staggered-parallel race in `x402/transfer-usdc-x402.workflow.ts`.
 *
 * These are additive — the legacy `signAndSendX402Transaction` in
 * `x402-signer.activities.ts` is left fully intact.
 */

import {
  getX402PublicClient,
  getX402WalletClient,
} from '#lib/crypto/x402-viem-clients';
import { createEthTxPrimitives } from './shared/eth-tx-primitives';

/** Matches `ABSOLUTE_MAX_GAS_PRICE_MULTIPLIER` in x402-signer.activities.ts. */
const X402_MAX_GAS_PRICE_MULTIPLIER = 1.2;

const x402TxPrimitives = createEthTxPrimitives({
  getPublicClient: getX402PublicClient,
  getWalletClient: getX402WalletClient,
  resolveMaxGasPriceMultiplier: async () => X402_MAX_GAS_PRICE_MULTIPLIER,
});

export const getX402SignerNonce = x402TxPrimitives.getSignerNonce;
export const sendX402PreparedTransaction =
  x402TxPrimitives.sendPreparedTransaction;
export const getX402TransactionConfirmation =
  x402TxPrimitives.getTransactionConfirmation;
