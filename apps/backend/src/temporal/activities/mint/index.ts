import * as MintActivities from './mint.activities';
import { getNftExpirationTimeInSeconds } from './namefi-nft';
import { getNamefiNftLock } from './namefi-nft';
import { getNftFromIndexer } from './namefi-nft';
import { getNftsForWallets } from './namefi-nft';
import {
  prepareTxToTransferUsdc,
  signAndSendX402Transaction,
} from '../x402-signer.activities';
// Pinned-nonce staggered-race transaction primitives (send + nonce on MINT queue).
import {
  getPendingSignerNonce,
  sendPreparedTransaction,
} from './mint-tx.activities';
import {
  getX402PendingSignerNonce,
  sendX402PreparedTransaction,
} from '../x402-tx.activities';

export const mintTaskQueueActivities = {
  ...MintActivities,
  getNftExpirationTimeInSeconds,
  getNamefiNftLock,
  getNftFromIndexer,
  getNftsForWallets,
  // X402 USDC transfer activities (for refunds)
  prepareTxToTransferUsdc,
  signAndSendX402Transaction,
  // Split send + nonce primitives (mint + x402) for the staggered-send race.
  getPendingSignerNonce,
  sendPreparedTransaction,
  getX402PendingSignerNonce,
  sendX402PreparedTransaction,
};
