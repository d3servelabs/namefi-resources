import * as MintActivities from './mint.activities';
import { getNftExpirationTimeInSeconds } from './namefi-nft';
import { getNamefiNftLock } from './namefi-nft';
import { getNftFromIndexer } from './namefi-nft';
import { getNftsForWallets } from './namefi-nft';
import {
  prepareTxToTransferUsdc,
  signAndSendX402Transaction,
} from '../x402-signer.activities';

export const mintTaskQueueActivities = {
  ...MintActivities,
  getNftExpirationTimeInSeconds,
  getNamefiNftLock,
  getNftFromIndexer,
  getNftsForWallets,
  // X402 USDC transfer activities (for refunds)
  prepareTxToTransferUsdc,
  signAndSendX402Transaction,
};
