import { useWalletClient } from 'wagmi';
import type { TypedDataDomain } from 'viem';

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
  }: {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    const signature = await walletClient.signTypedData({
      domain: NAMEFI_EIP712_DOMAIN,
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
