import * as MintActivities from './mint.activities';
import { getNftExpirationTimeInSeconds } from './namefi-nft';
import { getNamefiNftLock } from './namefi-nft';
import { getNftFromIndexer } from './namefi-nft';
import { getNftsForWallets } from './namefi-nft';

export const mintTaskQueueActivities = {
  ...MintActivities,
  getNftExpirationTimeInSeconds,
  getNamefiNftLock,
  getNftFromIndexer,
  getNftsForWallets,
};
