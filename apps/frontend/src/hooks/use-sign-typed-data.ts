import { useWalletClient } from 'wagmi';
import type { TypedDataDomain } from 'viem';
import { useSwitchChain } from 'wagmi';

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
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  /**
   * Sign an EIP-712 typed data payload.
   *
   * @param types - The EIP-712 type definitions
   * @param primaryType - The primary type name being signed
   * @param message - The payload data to sign
   * @returns The signature hex string
   */
  const signTypedData = async ({
    types,
    primaryType,
    message,
    chainId,
  }: {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
    chainId: number | bigint;
  }): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    await switchChainAsync({
      chainId: Number(chainId),
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
    isWalletConnected: !!walletClient,
  };
}
