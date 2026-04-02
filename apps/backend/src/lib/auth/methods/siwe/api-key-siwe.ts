import { randomUUID } from 'node:crypto';
import { type Address, getAddress } from 'viem';
import {
  generateSiweNonce,
  type SiweMessage,
  createSiweMessage,
  verifySiweMessage,
} from 'viem/siwe';
import { z } from 'zod';
import { logger } from '#lib/logger';
import { getRedisClient } from '#lib/redis';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
import { getDefaultAllowedNftChainId } from '#lib/env/allowed-chains';
import { config } from '#lib/env';
import { parseEip7702AccountAddress } from '#lib/auth/wallet-auth';
import { verifyMessageWithEip1271 } from '#lib/auth/eip1271-verify';

export const SIWE_SIGNATURE_HEADER_METHOD_ID = 'siwe';

export const SIWE_SIGNATURE_HEADER_HEADERS = {
  TOKEN: 'x-namefi-siwe-token',
} as const;

export const SIWE_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours

export const SIWE_SIGNATURE_MAX_AGE_SECONDS = 300; // 5 minutes
export const SIWE_SIGNATURE_NONCE_TTL_MS =
  SIWE_SIGNATURE_MAX_AGE_SECONDS * 1000;
export const SIWE_SESSION_KEY_PREFIX = 'siwe:session';
export const SIWE_DEFAULT_CHAIN_ID = getDefaultAllowedNftChainId();
export const SIWE_DEFAULT_STATEMENT = 'Sign in to Namefi API';

const SIGNATURE_REGEX = /^0x[a-fA-F0-9]+$/;

export interface SIWESignatureEnvelopeParseResult {
  valid: boolean;
  error?: string;
}

export type SiweSession = {
  address: string;
  delegatorAddress?: string | null;
  chainId: number;
  createdAt: string;
  maxAgeSeconds: number;
};

const siweSessionSchema = z.object({
  address: z.string().transform((address) => getAddress(address)),
  delegatorAddress: z
    .string()
    .nullable()
    .optional()
    .transform((address) => (address ? getAddress(address) : null)),
  chainId: z.number().int(),
  createdAt: z.string().datetime(),
  maxAgeSeconds: z.number().int().positive(),
});

export type SIWEVerificationResult =
  | {
      valid: true;
      recoveredAddress: string;
      token: string;
      session: SiweSession;
    }
  | {
      valid: false;
      error: string;
    };

export type SiweNonceResult =
  | {
      valid: true;
      nonce: string;
    }
  | {
      valid: false;
      error: string;
    };

export type SiweTokenValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      error: string;
    };

export type SiweSessionDetails = {
  token: string;
  session: SiweSession;
};

export type PrepareSiweMessageResult =
  | {
      valid: true;
      message: SiweMessage;
    }
  | {
      valid: false;
      error: string;
    };

export async function verifySiweSignature({
  message,
  signature,
  expectedSignerAddress,
  delegatorAddress,
}: {
  message: SiweMessage;
  signature: string;
  expectedSignerAddress?: string;
  delegatorAddress?: string;
}): Promise<SIWEVerificationResult> {
  if (!SIGNATURE_REGEX.test(signature)) {
    return {
      valid: false,
      error: 'Signature is malformed',
    };
  }

  const messageAddress = getAddress(message.address);
  const signerAddress = expectedSignerAddress
    ? getAddress(expectedSignerAddress)
    : messageAddress;

  if (signerAddress !== messageAddress) {
    return {
      valid: false,
      error: 'Signer address does not match SIWE message address',
    };
  }

  const messageString = createSiweMessage(message);

  try {
    const valid = await verifySiweMessage(
      getViemPublicClient(message.chainId),
      {
        signature: signature as `0x${string}`,
        message: messageString,
        address: signerAddress as `0x${string}`,
        domain: SIWE_DOMAIN,
        nonce: message.nonce,
      },
    );
    if (!valid) {
      throw new Error('Signature is invalid'); //will be caught
    }
  } catch (e) {
    logger.debug(e);
    return {
      valid: false,
      error: `Signature verification failed ${(e as Error).message}`,
    };
  }

  let walletAddress: Address = signerAddress as Address;

  if (delegatorAddress) {
    const parsedDelegator = parseEip7702AccountAddress(delegatorAddress);
    if (!parsedDelegator.valid) {
      return parsedDelegator;
    }

    if (
      parsedDelegator.accountAddress &&
      parsedDelegator.accountAddress !== signerAddress
    ) {
      const eip1271Valid = await verifyMessageWithEip1271({
        address: signerAddress as Address,
        message: messageString,
        signature: signature as `0x${string}`,
        eip1271Account: parsedDelegator.accountAddress,
        chainIds: [message.chainId],
      });

      if (!eip1271Valid) {
        return {
          valid: false,
          error: 'Signer is not authorized by the delegated account (EIP-1271)',
        };
      }

      walletAddress = parsedDelegator.accountAddress;
    }
  }

  const nonceValidation = await validateAndConsumeNonce({
    signerAddress,
    nonce: message.nonce,
  });
  if (!nonceValidation.valid) {
    return nonceValidation;
  }

  const sessionDetails = await createSiweSession({
    ...message,
    address: signerAddress as `0x${string}`,
    delegatorAddress: walletAddress === signerAddress ? null : walletAddress,
  });

  return {
    valid: true,
    recoveredAddress: signerAddress,
    token: sessionDetails.token,
    session: sessionDetails.session,
  };
}

function createNonceKey(signerAddress: string, nonce: string): string {
  return `siwe:${signerAddress.toLowerCase()}:${nonce}`;
}

function createSessionKey(token: string): string {
  return `${SIWE_SESSION_KEY_PREFIX}:${token}`;
}

export async function getSiweNonce({
  signerAddress,
}: {
  signerAddress: string;
}): Promise<SiweNonceResult> {
  const nonce = generateSiweNonce();
  const nonceKey = createNonceKey(signerAddress, nonce);

  try {
    const client = await getRedisClient();

    const result = await client.set(nonceKey, 'true', {
      EX: Math.trunc(SIWE_SIGNATURE_NONCE_TTL_MS / 1000),
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
      nonce,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to consume SIWE signature nonce');
    return {
      valid: false,
      error: 'Nonce validation failed',
    };
  }
}

export async function doesSiweNonceExist({
  signerAddress,
  nonce,
}: {
  signerAddress: string;
  nonce: string;
}): Promise<SiweTokenValidationResult> {
  const nonceKey = createNonceKey(signerAddress, nonce);

  try {
    const client = await getRedisClient();
    const result = await client.get(nonceKey);

    if (!result) {
      return {
        valid: false,
        error: 'wrong nonce or address',
      };
    }

    return {
      valid: true,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to check SIWE nonce');
    return {
      valid: false,
      error: 'Nonce validation failed',
    };
  }
}
export const SIWE_DOMAIN = config.APP_URL;
export async function prepareSiweMessage({
  signerAddress,
  nonce,
  chainId,
  domain,
  uri,
  statement = SIWE_DEFAULT_STATEMENT,
}: {
  signerAddress: string;
  nonce: string;
  chainId?: number;
  domain: string;
  uri: string;
  statement?: string;
}): Promise<PrepareSiweMessageResult> {
  const resolvedSignerAddress = getAddress(signerAddress);
  const nonceValidation = await doesSiweNonceExist({
    signerAddress: resolvedSignerAddress,
    nonce,
  });

  if (!nonceValidation.valid) {
    return nonceValidation;
  }

  const now = new Date();
  const expirationTime = new Date(now.getTime() + SIWE_SIGNATURE_NONCE_TTL_MS);

  return {
    valid: true,
    message: {
      address: resolvedSignerAddress as `0x${string}`,
      chainId: chainId ?? SIWE_DEFAULT_CHAIN_ID,
      domain,
      uri,
      nonce,
      statement,
      version: '1',
      issuedAt: now,
      expirationTime,
    },
  };
}

export async function validateAndConsumeNonce({
  signerAddress,
  nonce,
}: {
  signerAddress: string;
  nonce: string;
}): Promise<SiweTokenValidationResult> {
  const nonceKey = createNonceKey(signerAddress, nonce);

  try {
    const client = await getRedisClient();
    const result = await client.GETDEL(nonceKey);

    if (!result) {
      return {
        valid: false,
        error: 'Nonce not found',
      };
    }

    return {
      valid: true,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to validate SIWE nonce');
    return {
      valid: false,
      error: 'Nonce validation failed',
    };
  }
}

export async function isSiweTokenValid(
  token: string,
): Promise<SiweTokenValidationResult> {
  const siweDetails = await getSiweDetailsFromToken(token);

  if (!siweDetails) {
    return {
      valid: false,
      error: 'Invalid or expired SIWE token',
    };
  }

  return {
    valid: true,
  };
}

export async function getSiweDetailsFromToken(
  token: string,
): Promise<SiweSessionDetails | null> {
  try {
    const client = await getRedisClient();
    const sessionPayload = await client.get(createSessionKey(token));

    if (!sessionPayload) {
      return null;
    }

    const parsedSession = siweSessionSchema.safeParse(
      JSON.parse(sessionPayload),
    );
    if (!parsedSession.success) {
      logger.warn(
        { issues: parsedSession.error.issues },
        'Stored SIWE session payload is invalid',
      );
      await client.del(createSessionKey(token));
      return null;
    }

    return {
      token,
      session: parsedSession.data,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to read SIWE session token');
    return null;
  }
}

export async function createSiweSession(
  siweMessage: SiweMessage & { delegatorAddress?: string | null },
): Promise<SiweSessionDetails> {
  const token = randomUUID();
  const createdAt = new Date().toISOString();
  const session = {
    address: getAddress(siweMessage.address),
    delegatorAddress: siweMessage.delegatorAddress
      ? getAddress(siweMessage.delegatorAddress)
      : null,
    chainId: siweMessage.chainId,
    createdAt,
    maxAgeSeconds: SIWE_SESSION_MAX_AGE_SECONDS,
  } satisfies SiweSession;

  const client = await getRedisClient();
  await client.set(createSessionKey(token), JSON.stringify(session), {
    EX: SIWE_SESSION_MAX_AGE_SECONDS,
  });

  return {
    token,
    session,
  };
}
