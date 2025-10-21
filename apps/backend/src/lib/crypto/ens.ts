import { CHAINS } from '@namefi-astra/utils';
import { http, createPublicClient } from 'viem';
import { chainsToUrls } from './rpc-urls';
import { logger } from '#lib/logger';

const ensPublicClient = createPublicClient({
  transport: http(chainsToUrls(CHAINS.mainnet)),
  chain: CHAINS.mainnet,
});

export const resolveEnsNameToAddress = async (
  ensName: string,
): Promise<string | null> => {
  try {
    const address = await ensPublicClient.getEnsAddress({ name: ensName });
    return address;
  } catch (error) {
    logger.warn({ ensName, error }, 'Failed to resolve ENS name');
    return null;
  }
};
