import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db, apiKeysTable } from '@namefi-astra/db';
import { createTRPCRouter, protectedProcedure } from '../base';
import { logger } from '#lib/logger';
import { generatePlainApiKey } from '#lib/auth/methods/plain/api-key-plain';
import {
  verifySignedPayload,
  NAMEFI_EIP712_DOMAIN,
} from '#lib/auth/ecdsa-payload-signature';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { getAddress } from 'viem';

/**
 * EIP-712 types for creating an API key
 */
const CREATE_API_KEY_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  CreateApiKey: [
    { name: 'keyName', type: 'string' },
    { name: 'keyType', type: 'string' },
    { name: 'publicKey', type: 'string' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * EIP-712 types for revoking an API key
 */
const REVOKE_API_KEY_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  RevokeApiKey: [
    { name: 'keyId', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * EIP-712 types for updating an API key name
 */
const UPDATE_API_KEY_NAME_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  UpdateApiKeyName: [
    { name: 'keyId', type: 'string' },
    { name: 'newName', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * Maximum number of API keys a user can have
 */
const MAX_API_KEYS_PER_USER = 10;

/**
 * Schema for create API key input
 */
const createApiKeyInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix')
    .optional(),
  payload: z.object({
    keyName: z.string().min(1).max(100),
    keyType: z.enum(['PLAIN', 'PUBLIC_PRIVATE']),
    publicKey: z.string().default(''), // Required for PUBLIC_PRIVATE, empty for PLAIN
    expiresAt: z.number().int().min(0), // 0 means never expires
    timestamp: z.number().int(),
  }),
});

/**
 * Schema for revoke API key input
 */
const revokeApiKeyInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix')
    .optional(),
  payload: z.object({
    keyId: z.string().uuid(),
    timestamp: z.number().int(),
  }),
});

/**
 * Schema for update API key name input
 */
const updateApiKeyNameInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix')
    .optional(),
  payload: z.object({
    keyId: z.string().uuid(),
    newName: z.string().min(1).max(100),
    timestamp: z.number().int(),
  }),
});

/**
 * Optionally verify an EIP-712 signature when provided.
 * Returns the signer wallet address if signature is present and valid, or null if no signature.
 * Throws on invalid signature or wallet ownership mismatch.
 */
async function verifyOptionalSignature({
  signature,
  types,
  primaryType,
  message,
  privyUserId,
  userId,
}: {
  signature: string | undefined;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
  privyUserId: string;
  userId: string;
}): Promise<string | null> {
  if (!signature) return null;

  const verificationResult = await verifySignedPayload({
    signature,
    types,
    primaryType,
    message,
    domain: {
      ...NAMEFI_EIP712_DOMAIN,
      chainId: 1,
    },
  });

  if (!verificationResult.valid || !verificationResult.recoveredAddress) {
    logger.warn(
      { error: verificationResult.error, userId },
      'EIP-712 signature verification failed',
    );
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: verificationResult.error || 'Invalid payload signature',
    });
  }

  const signerAddress = getAddress(verificationResult.recoveredAddress);

  const privyUser = await privyClient.getUser(privyUserId);
  if (!privyUser) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Could not verify user wallet ownership',
    });
  }

  const userWallets = getPrivyUserLinkedEthereumChecksumWalletAddresses({
    privyUser,
  });

  const signerOwnsWallet = userWallets.some(
    (wallet) => wallet.toLowerCase() === signerAddress.toLowerCase(),
  );

  if (!signerOwnsWallet) {
    logger.warn(
      { signerAddress, userWallets, userId },
      'Payload signed by wallet not owned by authenticated user',
    );
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Signature wallet does not belong to authenticated user',
    });
  }

  return signerAddress;
}

export const apiKeysRouter = createTRPCRouter({
  /**
   * Get the EIP-712 types for API key operations
   * Used by the frontend to construct the signing payload
   */
  getSigningTypes: protectedProcedure.query(() => {
    return {
      domain: {
        ...NAMEFI_EIP712_DOMAIN,
        chainId: 1, // TODO: support other chains or allow cross-chain
      },
      types: {
        createApiKey: CREATE_API_KEY_EIP712_TYPES,
        revokeApiKey: REVOKE_API_KEY_EIP712_TYPES,
        updateApiKeyName: UPDATE_API_KEY_NAME_EIP712_TYPES,
      },
    };
  }),

  /**
   * List all API keys for the authenticated user
   * Returns keys with masked information (no actual key values)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db
      .select({
        id: apiKeysTable.id,
        name: apiKeysTable.name,
        type: apiKeysTable.type,
        keyPrefix: apiKeysTable.keyPrefix,
        expiresAt: apiKeysTable.expiresAt,
        revokedAt: apiKeysTable.revokedAt,
        lastUsedAt: apiKeysTable.lastUsedAt,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.userId, ctx.user.id))
      .orderBy(desc(apiKeysTable.createdAt));

    return keys.map((key) => ({
      ...key,
      isActive:
        !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
      isExpired: key.expiresAt && key.expiresAt <= new Date(),
    }));
  }),

  /**
   * Create a new API key
   * Wallet signature is optional — when provided, it is verified for extra security.
   *
   * For PLAIN keys: Returns the full key once (user must save it)
   * For PUBLIC_PRIVATE keys: User provides their public key
   */
  create: protectedProcedure
    .input(createApiKeyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { keyName, keyType, publicKey, expiresAt } = input.payload;

      // Verify optional EIP-712 signature
      const signedBy = await verifyOptionalSignature({
        signature: input.signature,
        types: CREATE_API_KEY_EIP712_TYPES,
        primaryType: 'CreateApiKey',
        message: input.payload as unknown as Record<string, unknown>,
        privyUserId: ctx.user.privyUserId,
        userId: ctx.user.id,
      });

      // Check key limit
      const existingKeysCount = await db
        .select({ id: apiKeysTable.id })
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.userId, ctx.user.id),
            isNull(apiKeysTable.revokedAt),
          ),
        );

      if (existingKeysCount.length >= MAX_API_KEYS_PER_USER) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum of ${MAX_API_KEYS_PER_USER} API keys allowed per user`,
        });
      }

      // Validate timestamp only when signature is provided
      if (input.signature) {
        const now = Math.floor(Date.now() / 1000);
        if (
          input.payload.timestamp < now - 300 ||
          input.payload.timestamp > now + 30
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Signature timestamp is invalid or expired',
          });
        }
      }

      let keyHash: string | null = null;
      const storedPublicKey: string | null = null;
      let keyPrefix: string;
      let plainKeyToReturn: string | null = null;

      if (keyType === 'PLAIN') {
        // Generate a new PLAIN API key
        const generated = await generatePlainApiKey();
        keyHash = generated.keyHash;
        keyPrefix = generated.keyPrefix;
        plainKeyToReturn = generated.plainKey;
      } else {
        throw new TRPCError({
          code: 'NOT_IMPLEMENTED',
        });
      }

      // Create the API key record
      const expiresAtDate = expiresAt > 0 ? new Date(expiresAt * 1000) : null;

      const [newKey] = await db
        .insert(apiKeysTable)
        .values({
          userId: ctx.user.id,
          name: keyName,
          type: keyType,
          keyHash,
          publicKey: storedPublicKey,
          keyPrefix,
          expiresAt: expiresAtDate,
        })
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          type: apiKeysTable.type,
          keyPrefix: apiKeysTable.keyPrefix,
          expiresAt: apiKeysTable.expiresAt,
          createdAt: apiKeysTable.createdAt,
        });

      logger.debug(
        { userId: ctx.user.id, keyId: newKey.id, keyType, signedBy },
        'API key created',
      );

      return {
        ...newKey,
        // Only return the plain key for PLAIN type - user must save it as it won't be shown again
        plainKey: plainKeyToReturn,
        // Indicate whether the creation was attested with a wallet signature
        signedBy: signedBy ?? undefined,
      };
    }),

  /**
   * Revoke an API key
   * Wallet signature is optional — when provided, it is verified for extra security.
   */
  revoke: protectedProcedure
    .input(revokeApiKeyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { keyId } = input.payload;

      // Verify optional EIP-712 signature
      const signedBy = await verifyOptionalSignature({
        signature: input.signature,
        types: REVOKE_API_KEY_EIP712_TYPES,
        primaryType: 'RevokeApiKey',
        message: input.payload as unknown as Record<string, unknown>,
        privyUserId: ctx.user.privyUserId,
        userId: ctx.user.id,
      });

      // Validate timestamp only when signature is provided
      if (input.signature) {
        const now = Math.floor(Date.now() / 1000);
        if (
          input.payload.timestamp < now - 300 ||
          input.payload.timestamp > now + 30
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Signature timestamp is invalid or expired',
          });
        }
      }

      // Find the key and verify ownership
      const [existingKey] = await db
        .select()
        .from(apiKeysTable)
        .where(
          and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, ctx.user.id)),
        );

      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      if (existingKey.revokedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'API key is already revoked',
        });
      }

      // Revoke the key
      const [revokedKey] = await db
        .update(apiKeysTable)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeysTable.id, keyId))
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          revokedAt: apiKeysTable.revokedAt,
        });

      logger.debug({ userId: ctx.user.id, keyId, signedBy }, 'API key revoked');

      return {
        ...revokedKey,
        signedBy: signedBy ?? undefined,
      };
    }),

  /**
   * Update an API key's name
   * Wallet signature is optional — when provided, it is verified for extra security.
   */
  updateName: protectedProcedure
    .input(updateApiKeyNameInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { keyId, newName } = input.payload;

      // Verify optional EIP-712 signature
      const signedBy = await verifyOptionalSignature({
        signature: input.signature,
        types: UPDATE_API_KEY_NAME_EIP712_TYPES,
        primaryType: 'UpdateApiKeyName',
        message: input.payload as unknown as Record<string, unknown>,
        privyUserId: ctx.user.privyUserId,
        userId: ctx.user.id,
      });

      // Validate timestamp only when signature is provided
      if (input.signature) {
        const now = Math.floor(Date.now() / 1000);
        if (
          input.payload.timestamp < now - 300 ||
          input.payload.timestamp > now + 30
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Signature timestamp is invalid or expired',
          });
        }
      }

      // Find the key and verify ownership
      const [existingKey] = await db
        .select()
        .from(apiKeysTable)
        .where(
          and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, ctx.user.id)),
        );

      if (!existingKey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      // Update the name
      const [updatedKey] = await db
        .update(apiKeysTable)
        .set({ name: newName })
        .where(eq(apiKeysTable.id, keyId))
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
        });

      logger.debug(
        { userId: ctx.user.id, keyId, newName, signedBy },
        'API key name updated',
      );

      return {
        ...updatedKey,
        signedBy: signedBy ?? undefined,
      };
    }),

  /**
   * Get a single API key by ID
   */
  getById: protectedProcedure
    .input(z.object({ keyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [key] = await db
        .select({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          type: apiKeysTable.type,
          keyPrefix: apiKeysTable.keyPrefix,
          expiresAt: apiKeysTable.expiresAt,
          revokedAt: apiKeysTable.revokedAt,
          lastUsedAt: apiKeysTable.lastUsedAt,
          createdAt: apiKeysTable.createdAt,
        })
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.id, input.keyId),
            eq(apiKeysTable.userId, ctx.user.id),
          ),
        );

      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      return {
        ...key,
        isActive:
          !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
        isExpired: key.expiresAt && key.expiresAt <= new Date(),
      };
    }),
});
