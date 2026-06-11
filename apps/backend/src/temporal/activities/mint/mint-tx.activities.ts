/**
 * Mint-signer transaction activities (split send / confirm / nonce).
 *
 * Thin instantiation of the shared `createEthTxPrimitives` factory with the
 * mint signer's viem clients and chain-aware gas cap. Used by the pinned-nonce
 * staggered-parallel race in `mint.workflow.ts`.
 *
 * These are additive — the legacy `signAndSendTransaction` in `mint.activities.ts`
 * is left fully intact.
 */

import {
  getViemPublicClient,
  getViemWalletClient,
} from '#lib/crypto/viem-clients';
import { createEthTxPrimitives } from '../shared/eth-tx-primitives';
import { getMaxGasPriceMultiplier } from './mint.activities';

const mintTxPrimitives = createEthTxPrimitives({
  getPublicClient: getViemPublicClient,
  getWalletClient: getViemWalletClient,
  resolveMaxGasPriceMultiplier: getMaxGasPriceMultiplier,
});

export const getPendingSignerNonce = mintTxPrimitives.getPendingSignerNonce;
export const sendPreparedTransaction = mintTxPrimitives.sendPreparedTransaction;
export const getTransactionConfirmation =
  mintTxPrimitives.getTransactionConfirmation;
