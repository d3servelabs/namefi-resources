import {
  type Address,
  type Hex,
  getAddress,
  recoverTypedDataAddress,
  type TypedDataDomain,
  type TypedDataParameter,
} from 'viem';
import { verifyTypedDataWithEip1271 } from '#lib/auth/eip1271-verify';
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
};

/**
 * Build the EIP-712 domain with an optional chainId.
 * When chainId is provided, signatures are bound to that chain.
 */
export function getNamefiEip712Domain(chainId?: number): TypedDataDomain {
  return chainId ? { ...NAMEFI_EIP712_DOMAIN, chainId } : NAMEFI_EIP712_DOMAIN;
}

export const EIP712_SIGNATURE_HEADER_METHOD_ID = 'eip712-signature-header';

export const EIP712_SIGNATURE_HEADER_HEADERS = {
  SIGNATURE: 'x-namefi-signature',
  SIGNER: 'x-namefi-signer',
  TYPE: 'x-namefi-eip712-type',
  CHAIN_ID: 'x-namefi-chain-id',
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
  /** The EOA address that produced the signature */
  signerAddress?: string;
  /** The smart contract address when EIP-1271 delegation is used */
  delegatorAddress?: string;
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
  eip1271Account,
  chainId,
}: {
  rawBody: string;
  signature: string;
  expectedSignerAddress?: string;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
  /** When provided, verify via EIP-1271 isValidSignature on this contract */
  eip1271Account?: Address;
  /** Chain ID for EIP-712 domain binding and on-chain verification */
  chainId?: number;
}): Promise<EIP712RawSignatureVerificationResult> {
  if (!SIGNATURE_REGEX.test(signature)) {
    return {
      valid: false,
      error: 'Invalid signature format',
    };
  }

  const parsedMessage = EIP712SignatureEnvelopeSchema.parse(
    JSON.parse(rawBody),
  );

  const domain = getNamefiEip712Domain(chainId);

  // Always recover the signer address from the signature
  let recoveredAddress: string;
  try {
    recoveredAddress = getAddress(
      await recoverTypedDataAddress({
        message: parsedMessage,
        signature: signature as `0x${string}`,
        primaryType,
        types,
        domain,
      }),
    );
  } catch (error) {
    logger.debug({ error }, 'Failed to recover typed data signer address');
    return {
      valid: false,
      error: 'Failed to recover signer address from signature',
    };
  }

  // Validate recovered address against expected signer
  if (expectedSignerAddress) {
    const normalizedExpected = getAddress(expectedSignerAddress);
    if (normalizedExpected !== recoveredAddress) {
      return {
        valid: false,
        error: 'Signature does not match expected signer address',
      };
    }
  }

  // EIP-1271: additionally verify on-chain via isValidSignature
  if (eip1271Account) {
    try {
      const valid = await verifyTypedDataWithEip1271({
        address: eip1271Account,
        domain,
        types,
        primaryType,
        message: parsedMessage,
        signature: signature as Hex,
        eip1271Account,
        chainIds: chainId ? [chainId] : undefined,
      });

      if (!valid) {
        return {
          valid: false,
          error: 'EIP-1271 signature verification failed',
        };
      }

      return {
        valid: true,
        signerAddress: recoveredAddress,
        delegatorAddress: getAddress(eip1271Account),
      };
    } catch (error) {
      logger.debug({ error }, 'EIP-1271 typed data verification failed');
      return {
        valid: false,
        error: 'EIP-1271 signature verification failed',
      };
    }
  }

  return {
    valid: true,
    signerAddress: recoveredAddress,
  };
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
    logger.debug({ error }, 'Failed to consume EIP712 signature nonce');
    return {
      valid: false,
      error: 'Nonce validation failed',
    };
  }
}
