import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import * as React from 'react';

/**
 * Hook to validate and parse Ethereum wallet addresses ensuring they are in checksum format
 * @param address The Ethereum address to validate
 * @returns Object containing validation result with value, isValid status and any error
 */
export function useParseAndValidateChecksumWalletAddress(
  address: string | undefined | null,
) {
  return React.useMemo(() => {
    const res = checksumWalletAddressSchema.safeParse(address);

    return {
      value: res.data,
      isValid: res.success,
      error: res.error,
    };
  }, [address]);
}
