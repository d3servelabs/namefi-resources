import {
  getAddress,
  recoverTypedDataAddress,
  verifyTypedData,
  type TypedDataDomain,
  type TypedDataParameter,
} from 'viem';
import { z } from 'zod';
import { logger } from '#lib/logger';
import { getRedisClient } from '#lib/redis';

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

export const EIP712_SIGNATURE_HEADER_METHOD_ID = 'eip712-signature-header';

export const EIP712_SIGNATURE_HEADER_HEADERS = {
  SIGNATURE: 'x-namefi-signature',
  SIGNER: 'x-namefi-signer',
  TYPE: 'x-namefi-eip712-type',
} as const;

export const EIP712_SIGNATURE_MAX_AGE_SECONDS = 300;
export const EIP712_SIGNATURE_MAX_FUTURE_SECONDS = 30;
export const EIP712_SIGNATURE_NONCE_TTL_MS =
  EIP712_SIGNATURE_MAX_AGE_SECONDS * 1000;

const SIGNATURE_REGEX = /^0x[a-fA-F0-9]+$/;

const EIP712SignatureEnvelopeSchema = z.object({
  timestamp: z.number().int(),
  nonce: z.string().min(1).max(256),
  payload: z.unknown(),
  payloadType: z.string().min(1).max(256),
});

export type EIP712SignatureEnvelope = z.infer<
  typeof EIP712SignatureEnvelopeSchema
>;

export interface EIP712SignatureEnvelopeParseResult {
  valid: boolean;
  envelope?: EIP712SignatureEnvelope;
  error?: string;
}

export interface EIP712RawSignatureVerificationResult {
  valid: boolean;
  recoveredAddress?: string;
  error?: string;
}

export interface EIP712NonceConsumeResult {
  valid: boolean;
  error?: string;
}

export function parseEIP712SignatureEnvelope(
  rawBody: string,
): EIP712SignatureEnvelopeParseResult {
  if (!rawBody || rawBody.trim().length === 0) {
    return {
      valid: false,
      error: 'Missing signed request body',
    };
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON body',
    };
  }

  const parsedEnvelope = EIP712SignatureEnvelopeSchema.safeParse(parsedBody);
  if (!parsedEnvelope.success) {
    return {
      valid: false,
      error:
        parsedEnvelope.error.issues[0]?.message || 'Invalid signed envelope',
    };
  }

  return {
    valid: true,
    envelope: parsedEnvelope.data,
  };
}

export function isValidEIP712SignatureTimestamp(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);

  return (
    timestamp >= now - EIP712_SIGNATURE_MAX_AGE_SECONDS &&
    timestamp <= now + EIP712_SIGNATURE_MAX_FUTURE_SECONDS
  );
}

export async function verifyEIP712RawBodySignature({
  rawBody,
  signature,
  expectedSignerAddress,
  types,
  primaryType,
}: {
  rawBody: string;
  signature: string;
  expectedSignerAddress?: string;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
}): Promise<EIP712RawSignatureVerificationResult> {
  if (!SIGNATURE_REGEX.test(signature)) {
    return {
      valid: false,
      error: 'Invalid signature format',
    };
  }

  try {
    const valid = await verifyTypedData({
      address: expectedSignerAddress as `0x${string}`,
      message: EIP712SignatureEnvelopeSchema.parse(JSON.parse(rawBody)),
      signature: signature as `0x${string}`,
      primaryType,
      types,
      domain: NAMEFI_EIP712_DOMAIN,
    });
    if (!valid) {
      return {
        valid: false,
        error: 'Signature is invalid',
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: 'Signature verification failed',
    };
  }

  try {
    const recoveredAddress = getAddress(
      await recoverTypedDataAddress({
        message: EIP712SignatureEnvelopeSchema.parse(JSON.parse(rawBody)),
        signature: signature as `0x${string}`,
        primaryType,
        types,
        domain: NAMEFI_EIP712_DOMAIN,
      }),
    );

    if (expectedSignerAddress) {
      let normalizedExpectedSignerAddress: string;
      try {
        normalizedExpectedSignerAddress = getAddress(expectedSignerAddress);
      } catch {
        return {
          valid: false,
          error: 'Invalid signer address format',
        };
      }

      if (normalizedExpectedSignerAddress !== recoveredAddress) {
        return {
          valid: false,
          error: 'Signature does not match expected signer address',
        };
      }
    }

    return {
      valid: true,
      recoveredAddress,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to verify raw-body EIP712 signature');
    return {
      valid: false,
      error: 'Failed to verify signature with provided address',
    };
  }
}

function createNonceKey(signerAddress: string, nonce: string): string {
  return `${signerAddress.toLowerCase()}:${nonce}`;
}

export async function consumeEIP712SignatureNonce({
  signerAddress,
  nonce,
}: {
  signerAddress: string;
  nonce: string;
}): Promise<EIP712NonceConsumeResult> {
  const nonceKey = createNonceKey(signerAddress, nonce);

  try {
    const client = await getRedisClient();

    const result = await client.set(nonceKey, 'true', {
      EX: Math.trunc(EIP712_SIGNATURE_NONCE_TTL_MS / 1000),
      NX: true,
    });

    if (!result) {
      return {
        valid: false,
        error: 'Replay detected: nonce already used',
      };
    }

    return {
      valid: true,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to consume EIP712 signature nonce');
    return {
      valid: false,
      error: 'Nonce validation failed',
    };
  }
}
