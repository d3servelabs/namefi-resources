import { db, domainAiAnalysisTable } from '@namefi-astra/db';

import { createLogger } from '#lib/logger';
import { eq } from 'drizzle-orm';
import { CHAINS, NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { pad, toHex } from 'viem';

const logger = createLogger({ name: 'nft-marketplace-activities' });

/**
 * Update marketplace for a single domain and clear dirty flag
 */
export async function updateMarketplaceForDomain(
  tokenId: string,
  chainId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info({ tokenId, chainId }, 'Updating marketplace for domain');

    const marketplaces = getMarketplacesForChain(chainId);

    if (marketplaces.length === 0) {
      logger.warn({ tokenId, chainId }, 'No supported marketplaces for chain');
      return { success: true }; // Not an error, just no marketplaces to update
    }
    const tokenIdHex = pad(toHex(BigInt(tokenId)), { size: 32, dir: 'left' });

    // Update all marketplaces for this chain
    await Promise.all(
      marketplaces.map(async (marketplace) => {
        try {
          await marketplace.updateNft(tokenIdHex, chainId);
          logger.info(
            { tokenId, marketplace: marketplace.name },
            'Updated marketplace',
          );
        } catch (error) {
          logger.error(
            { error, tokenId, marketplace: marketplace.name },
            'Failed to update marketplace',
          );
          throw error;
        }
      }),
    );

    // Clear dirty flag atomically
    await db.transaction(async (tx) => {
      await tx
        .update(domainAiAnalysisTable)
        .set({ dirty: false })
        .where(eq(domainAiAnalysisTable.tokenId, tokenId));
    });

    return { success: true };
  } catch (error) {
    logger.error(
      { error, tokenId, chainId },
      'Failed to update marketplace for domain',
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface Marketplace {
  name: string;
  supportedChains: number[];
  updateNft: (tokenId: string, chainId: number) => Promise<void>;
}

const openseaMarketplace: Marketplace = {
  name: 'opensea',
  supportedChains: [CHAINS.mainnet.id, CHAINS.base.id, CHAINS.sepolia.id],
  updateNft: async (tokenId: string, chainId: number) => {
    // Dynamic import to avoid issues with opensea module
    const { default: opensea } = await import(
      '../../../lib/external-api/opensea-client'
    );

    await opensea.refreshNft({
      chainId,
      address: NAMEFI_NFT_CONTRACT_ADDRESS,
      identifier: tokenId,
    });
  },
};

const _visionMarketplace: Marketplace = {
  name: 'vision',
  supportedChains: [CHAINS.mainnet.id, CHAINS.base.id],
  updateNft: async (tokenId: string, _chainId: number) => {
    // Dynamic import to avoid issues with vision client
    const { VisionClient } = await import(
      '../../../lib/external-api/vision-client'
    );

    await VisionClient.refreshMetadata(tokenId, NAMEFI_NFT_CONTRACT_ADDRESS);
  },
};

const marketplaces: Marketplace[] = [openseaMarketplace];

const getMarketplacesForChain = (chainId: number): Marketplace[] => {
  return marketplaces.filter((marketplace) =>
    marketplace.supportedChains.includes(chainId),
  );
};
