import { verifyTypedData, getAddress, type TypedDataDomain } from 'viem';
import { logger } from '#lib/logger';

/**
 * EIP-712 domain for Namefi payload signing.
 * This identifies the application and prevents cross-application signature replay.
 */
export const NAMEFI_EIP712_DOMAIN: TypedDataDomain = {
  name: 'Namefi',
  version: '1',
  // Note: chainId is intentionally omitted to allow cross-chain signatures
  // If chain-specific signing is needed, add chainId here
};

/**
 * Base EIP-712 types that all signed payloads must include.
 * Specific operations can extend this with additional fields.
 */
export const BASE_PAYLOAD_TYPES = {
  // The EIP712Domain type is implicit and handled by viem
} as const;

/**
 * Result of verifying an EIP-712 signed payload.
 */
export interface PayloadVerificationResult {
  valid: boolean;
  recoveredAddress?: string;
  error?: string;
}

/**
 * Verify an EIP-712 typed data signature and recover the signer address.
 *
 * @param signature - The signature to verify (hex string with 0x prefix)
 * @param domain - The EIP-712 domain (defaults to NAMEFI_EIP712_DOMAIN)
 * @param types - The EIP-712 type definitions for the payload
 * @param primaryType - The primary type name being signed
 * @param message - The actual payload data that was signed
 * @param expectedAddress - Optional: verify the signer matches this address
 * @returns Verification result with recovered address or error
 */
export async function verifySignedPayload<
  TTypes extends Record<string, Array<{ name: string; type: string }>>,
  TPrimaryType extends keyof TTypes,
>({
  signature,
  domain = NAMEFI_EIP712_DOMAIN,
  types,
  primaryType,
  message,
  expectedAddress,
}: {
  signature: string;
  domain?: TypedDataDomain;
  types: TTypes;
  primaryType: TPrimaryType;
  message: Record<string, unknown>;
  expectedAddress?: string;
}): Promise<PayloadVerificationResult> {
  try {
    // Verify the signature and check against expected address if provided
    const isValid = await verifyTypedData({
      address: expectedAddress
        ? (getAddress(expectedAddress) as `0x${string}`)
        : ('0x0000000000000000000000000000000000000000' as `0x${string}`),
      domain,
      types: types as Record<string, Array<{ name: string; type: string }>>,
      primaryType: primaryType as string,
      message,
      signature: signature as `0x${string}`,
    });

    if (expectedAddress) {
      // When we have an expected address, verifyTypedData returns true/false
      if (!isValid) {
        return {
          valid: false,
          error: 'Signature does not match expected address',
        };
      }
      return {
        valid: true,
        recoveredAddress: getAddress(expectedAddress),
      };
    }

    // If no expected address, we need to recover the address
    const { recoverTypedDataAddress } = await import('viem');
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types: types as Record<string, Array<{ name: string; type: string }>>,
      primaryType: primaryType as string,
      message,
      signature: signature as `0x${string}`,
    });

    return {
      valid: true,
      recoveredAddress: getAddress(recoveredAddress),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to verify EIP-712 signature');
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Signature verification failed',
    };
  }
}

/**
 * Helper to create EIP-712 type definitions for common patterns.
 * Use this to define the types for your specific payload.
 *
 * @example
 * const DELETE_ASSET_TYPES = {
 *   DeleteAsset: [
 *     { name: 'assetId', type: 'string' },
 *     { name: 'reason', type: 'string' },
 *   ],
 * };
 */
export function createPayloadTypes<
  T extends Record<string, Array<{ name: string; type: string }>>,
>(types: T): T {
  return types;
}

/**
 * Zod schema helper for signed payload input.
 * Use this in your procedure input to accept signed payloads.
 */
import { z } from 'zod';

export const signedPayloadSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix'),
});

/**
 * Create a Zod schema for a signed payload with specific data fields.
 *
 * @example
 * const deleteAssetInputSchema = createSignedPayloadSchema(
 *   z.object({
 *     assetId: z.string(),
 *     reason: z.string().optional(),
 *   })
 * );
 */
export function createSignedPayloadSchema<T extends z.ZodRawShape>(
  dataSchema: z.ZodObject<T>,
) {
  return z.object({
    signature: z
      .string()
      .regex(
        /^0x[a-fA-F0-9]+$/,
        'Signature must be a hex string with 0x prefix',
      ),
    payload: dataSchema,
  });
}
