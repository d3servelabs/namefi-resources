import { NFSC_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import { formatUnits, getContract } from 'viem';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { getViemPublicClient, ALLOWED_CHAINS } from '#lib/crypto/viem-clients';
import { logger } from '#lib/logger';
import {
  type ChainBalance,
  getPaymentProviderForChain,
  getChainName,
} from './determine-payments';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get NFSC balance for a wallet address on a specific chain
 * Returns both raw bigint balance and formatted values
 */
async function getNfscBalance(
  chainId: number,
  walletAddress: ChecksumWalletAddress,
): Promise<{
  rawBalance: bigint;
  balanceInUsd: number;
  balanceInUsdCents: number;
}> {
  const publicClient = getViemPublicClient(chainId);

  const nfscContract = getContract({
    address: NFSC_CONTRACT_ADDRESS as `0x${string}`,
    abi: NfscAbi,
    client: publicClient,
  });

  const rawBalance = await nfscContract.read.balanceOf([walletAddress]);
  const balanceInUsd = Number(formatUnits(rawBalance, 18));
  const balanceInUsdCents = Number(formatUnits(rawBalance, 16)); // 18-2 for cents

  return {
    rawBalance,
    balanceInUsd,
    balanceInUsdCents,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Get NFSC balances for all chains for a list of wallet addresses.
 * Returns balances formatted as ChainBalance objects ready for payment allocation.
 *
 * @param walletAddresses - Array of checksum wallet addresses to check
 * @returns Array of ChainBalance objects with balance info for each chain
 */
export async function getUserChainBalances(
  walletAddresses: ChecksumWalletAddress[],
): Promise<ChainBalance[]> {
  const balances: ChainBalance[] = [];

  for (const chain of ALLOWED_CHAINS) {
    for (const walletAddress of walletAddresses) {
      try {
        const { balanceInUsdCents } = await getNfscBalance(
          chain.id,
          walletAddress,
        );

        // Only include non-zero balances
        if (balanceInUsdCents > 0) {
          balances.push({
            chainId: chain.id,
            chainName: getChainName(chain.id),
            walletAddress,
            balanceInUsdCents,
            paymentProvider: getPaymentProviderForChain(chain.id),
          });
        }
      } catch (balanceError) {
        logger.error(
          {
            chainId: chain.id,
            walletAddress,
            error: balanceError,
          },
          'Failed to fetch balance for wallet on chain',
        );
        // Skip this chain/wallet combo on error
      }
    }
  }

  return balances;
}
