import { NFSC_CONTRACT_ADDRESS, CHAINS } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { formatUnits, getContract } from 'viem';
import { isNil, isEmpty } from 'ramda';
import { z } from 'zod';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { NfscAbi } from '@namefi-astra/utils/abis/nfsc';
import { getViemPublicClient, ALLOWED_CHAINS } from '#lib/crypto/viem-clients';
import { logger } from '#lib/logger';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get payment provider for a given chain ID
 */
function getPaymentProviderForChain(
  chainId: number,
): 'NFSC_BASE' | 'NFSC_ETHEREUM' | 'NFSC_ETHEREUM_SEPOLIA' {
  switch (chainId) {
    case CHAINS.base.id:
      return 'NFSC_BASE';
    case CHAINS.mainnet.id:
      return 'NFSC_ETHEREUM';
    case CHAINS.sepolia.id:
    default:
      return 'NFSC_ETHEREUM_SEPOLIA';
  }
}

/**
 * Get chain name for display
 */
function getChainName(chainId: number): string {
  switch (chainId) {
    case CHAINS.base.id:
      return 'Base';
    case CHAINS.mainnet.id:
      return 'Ethereum';
    case CHAINS.sepolia.id:
      return 'Sepolia';
    default:
      return 'Unknown Chain';
  }
}

/**
 * Get NFSC balance for a wallet address on a specific chain
 * Returns both raw bigint balance and formatted values
 */
async function getNfscBalance(
  chainId: number,
  walletAddress: `0x${string}`,
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
// Output Schemas for OpenAPI
// ============================================================================

const chainBalanceSchema = z.object({
  chainId: z.number(),
  chainName: z.string(),
  walletAddress: z.string(),
  // Raw value from contract as string (bigint serialized)
  rawBalance: z.string(),
  // Human readable values
  balanceInUsd: z.number(),
  balanceInUsdCents: z.number(),
  paymentProvider: z.enum([
    'NFSC_BASE',
    'NFSC_ETHEREUM',
    'NFSC_ETHEREUM_SEPOLIA',
  ]),
});

const getBalanceOutputSchema = z.object({
  balances: z.array(chainBalanceSchema),
  totalBalanceInUsd: z.number(),
  totalBalanceInUsdCents: z.number(),
});

type ChainBalance = z.infer<typeof chainBalanceSchema>;

// ============================================================================
// Router Definition
// ============================================================================

export const balanceRouterOrpc = createTRPCRouter({
  /**
   * Get NFSC balance across all supported chains for the authenticated user
   */
  getBalance: protectedProcedure
    .meta({
      route: {
        path: '/balance',
        method: 'GET',
        tags: ['balance'],
        operationId: 'getBalance',
        summary: 'Get NFSC balance',
        description:
          "Retrieve NFSC (Namefi Stable Coin) balance across all supported blockchain chains for the authenticated user's linked wallet addresses. Returns both raw contract values and human-readable USD amounts.",
      },
    })
    .output(getBalanceOutputSchema)
    .query(async ({ ctx }) => {
      const { user } = ctx;

      // 1. Get user's linked wallet addresses from Privy
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        logger.error(
          { privyUserId: user.privyUserId, error },
          'Failed to fetch Privy user for balance query',
        );
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Could not find user details',
        });
      }

      const walletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses(
        {
          privyUser,
        },
      );

      if (isEmpty(walletAddresses)) {
        // No linked wallets, return empty balances
        return {
          balances: [],
          totalBalanceInUsd: 0,
          totalBalanceInUsdCents: 0,
        };
      }

      // 2. Get balances for each wallet on each allowed chain
      const balances: ChainBalance[] = [];

      for (const chain of ALLOWED_CHAINS) {
        for (const walletAddress of walletAddresses) {
          try {
            const { rawBalance, balanceInUsd, balanceInUsdCents } =
              await getNfscBalance(chain.id, walletAddress as `0x${string}`);

            balances.push({
              chainId: chain.id,
              chainName: getChainName(chain.id),
              walletAddress,
              rawBalance: rawBalance.toString(),
              balanceInUsd,
              balanceInUsdCents,
              paymentProvider: getPaymentProviderForChain(chain.id),
            });
          } catch (balanceError) {
            logger.error(
              {
                chainId: chain.id,
                walletAddress,
                error: balanceError,
              },
              'Failed to fetch balance for wallet on chain',
            );
            // Include zero balance entry on error
            balances.push({
              chainId: chain.id,
              chainName: getChainName(chain.id),
              walletAddress,
              rawBalance: '0',
              balanceInUsd: 0,
              balanceInUsdCents: 0,
              paymentProvider: getPaymentProviderForChain(chain.id),
            });
          }
        }
      }

      // 3. Calculate totals
      const totalBalanceInUsd = balances.reduce(
        (sum, b) => sum + b.balanceInUsd,
        0,
      );
      const totalBalanceInUsdCents = balances.reduce(
        (sum, b) => sum + b.balanceInUsdCents,
        0,
      );

      return {
        balances,
        totalBalanceInUsd,
        totalBalanceInUsdCents,
      };
    }),
});
