import type { TypedDataDomain } from 'viem';
import { useWalletActionClient } from './use-wallet-action-client';

/**
 * EIP-712 domain for Namefi payload signing.
 * Must match the backend NAMEFI_EIP712_DOMAIN.
 */
export const NAMEFI_EIP712_DOMAIN: TypedDataDomain = {
  name: 'Namefi',
  version: '1',
};

/**
 * Hook for signing EIP-712 typed data payloads.
 * Used for dangerous operations that require wallet signature confirmation.
 */
export function useSignTypedData() {
  const resolveWalletClient = useWalletActionClient();

  /**
   * Sign an EIP-712 typed data payload.
   *
   * @param types - The EIP-712 type definitions
   * @param primaryType - The primary type name being signed
   * @param message - The payload data to sign
   * @param chainId - The chain ID used in the EIP-712 domain and wallet resolution
   * @param walletAddress - The wallet address expected to sign the payload
   * @returns The signature hex string
   */
  const signTypedData = async ({
    types,
    primaryType,
    message,
    chainId,
    walletAddress,
  }: {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
    chainId: number | bigint;
    walletAddress: string;
  }): Promise<string> => {
    const walletClient = await resolveWalletClient({
      chainId: Number(chainId),
      expectedAddress: walletAddress,
    });
    const signature = await walletClient.signTypedData({
      domain: {
        ...NAMEFI_EIP712_DOMAIN,
        chainId,
      },
      types,
      primaryType,
      message,
    } as Parameters<typeof walletClient.signTypedData>[0]);

    return signature;
  };

  return {
    signTypedData,
  };
}
