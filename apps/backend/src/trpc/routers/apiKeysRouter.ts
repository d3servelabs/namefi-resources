import { TRPCError } from '@trpc/server';
import { apiKeysContract } from '@namefi-astra/common/contract/api-keys-contract';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db, apiKeysTable } from '@namefi-astra/db';
import { protectedProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
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
import {
  validateIpList,
  validateOriginList,
} from '#lib/auth/api-key-restrictions';

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
    { name: 'allowedIps', type: 'string' }, // JSON stringified array
    { name: 'allowedOrigins', type: 'string' }, // JSON stringified array
    { name: 'allowBrowserRequests', type: 'bool' },
    { name: 'allowServerRequests', type: 'bool' },
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
 * EIP-712 types for updating API key restrictions
 */
const UPDATE_API_KEY_RESTRICTIONS_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  UpdateApiKeyRestrictions: [
    { name: 'keyId', type: 'string' },
    { name: 'allowedIps', type: 'string' }, // JSON stringified array
    { name: 'allowedOrigins', type: 'string' }, // JSON stringified array
    { name: 'allowBrowserRequests', type: 'bool' },
    { name: 'allowServerRequests', type: 'bool' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * Maximum number of API keys a user can have
 */
const MAX_API_KEYS_PER_USER = 10;

// Note: input schemas for create / revoke / updateName moved to
// `@namefi-astra/common/contract/api-keys-contract`. The handlers below
// reference the contract's schemas via `apiKeysContract.<name>.input`.

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

export const apiKeysRouter = createContractTRPCRouter<typeof apiKeysContract>({
  /**
   * Get the EIP-712 types for API key operations
   * Used by the frontend to construct the signing payload
   */
  getSigningTypes: protectedProcedure
    .input(apiKeysContract.getSigningTypes.input)
    .output(apiKeysContract.getSigningTypes.output)
    .query(() => {
      return {
        domain: {
          ...NAMEFI_EIP712_DOMAIN,
          chainId: 1, // TODO: support other chains or allow cross-chain
        },
        types: {
          createApiKey: CREATE_API_KEY_EIP712_TYPES,
          revokeApiKey: REVOKE_API_KEY_EIP712_TYPES,
          updateApiKeyName: UPDATE_API_KEY_NAME_EIP712_TYPES,
          updateApiKeyRestrictions: UPDATE_API_KEY_RESTRICTIONS_EIP712_TYPES,
        },
      };
    }),

  /**
   * List all API keys for the authenticated user
   * Returns keys with masked information (no actual key values)
   */
  list: protectedProcedure
    .input(apiKeysContract.list.input)
    .output(apiKeysContract.list.output)
    .query(async ({ ctx }) => {
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
          // Restriction fields
          allowedIps: apiKeysTable.allowedIps,
          allowedOrigins: apiKeysTable.allowedOrigins,
          allowBrowserRequests: apiKeysTable.allowBrowserRequests,
          allowServerRequests: apiKeysTable.allowServerRequests,
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
    .input(apiKeysContract.create.input)
    .output(apiKeysContract.create.output)
    .mutation(async ({ ctx, input }) => {
      const {
        keyName,
        keyType,
        expiresAt,
        allowedIps,
        allowedOrigins,
        allowBrowserRequests,
        allowServerRequests,
      } = input.payload;

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

      // Restriction values (only used for PLAIN keys)
      let storedAllowedIps: string[] | null = null;
      let storedAllowedOrigins: string[] | null = null;
      let storedAllowBrowserRequests = false;
      let storedAllowServerRequests = false;

      if (keyType === 'PLAIN') {
        // Generate a new PLAIN API key
        const generated = await generatePlainApiKey();
        keyHash = generated.keyHash;
        keyPrefix = generated.keyPrefix;
        plainKeyToReturn = generated.plainKey;

        // Validate and store restrictions for PLAIN keys
        if (allowedIps.length > 0) {
          const ipValidation = validateIpList(allowedIps);
          if (!ipValidation.valid) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: ipValidation.error || 'Invalid IP/CIDR entries',
            });
          }
          storedAllowedIps = allowedIps.map((ip) => ip.trim());
        }

        if (allowedOrigins.length > 0) {
          const originValidation = validateOriginList(allowedOrigins);
          if (!originValidation.valid) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: originValidation.error || 'Invalid origin patterns',
            });
          }
          storedAllowedOrigins = allowedOrigins.map((origin) => origin.trim());
        }

        storedAllowBrowserRequests = allowBrowserRequests;
        storedAllowServerRequests = allowServerRequests;
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
          // Restriction fields
          allowedIps: storedAllowedIps,
          allowedOrigins: storedAllowedOrigins,
          allowBrowserRequests: storedAllowBrowserRequests,
          allowServerRequests: storedAllowServerRequests,
        })
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          type: apiKeysTable.type,
          keyPrefix: apiKeysTable.keyPrefix,
          expiresAt: apiKeysTable.expiresAt,
          createdAt: apiKeysTable.createdAt,
          allowedIps: apiKeysTable.allowedIps,
          allowedOrigins: apiKeysTable.allowedOrigins,
          allowBrowserRequests: apiKeysTable.allowBrowserRequests,
          allowServerRequests: apiKeysTable.allowServerRequests,
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
    .input(apiKeysContract.revoke.input)
    .output(apiKeysContract.revoke.output)
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
    .input(apiKeysContract.updateName.input)
    .output(apiKeysContract.updateName.output)
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
   * Update an API key's restrictions
   * Requires EIP-712 signature for security
   * Only applicable for PLAIN keys
   */
  updateApiKeyRestrictions: protectedProcedure
    .input(apiKeysContract.updateApiKeyRestrictions.input)
    .output(apiKeysContract.updateApiKeyRestrictions.output)
    .mutation(async ({ ctx, input }) => {
      const {
        keyId,
        allowedIps,
        allowedOrigins,
        allowBrowserRequests,
        allowServerRequests,
      } = input.payload;

      // Verify optional EIP-712 signature
      const signedBy = await verifyOptionalSignature({
        signature: input.signature,
        types: UPDATE_API_KEY_RESTRICTIONS_EIP712_TYPES,
        primaryType: 'UpdateApiKeyRestrictions',
        message: {
          ...input.payload,
          // Convert arrays to JSON strings for EIP-712 signing
          allowedIps: JSON.stringify(input.payload.allowedIps),
          allowedOrigins: JSON.stringify(input.payload.allowedOrigins),
        } as unknown as Record<string, unknown>,
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

      // Only allow updating restrictions for PLAIN keys
      if (existingKey.type !== 'PLAIN') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Restrictions can only be updated for PLAIN API keys',
        });
      }

      // Validate IP list
      let storedAllowedIps: string[] | null = null;
      if (allowedIps.length > 0) {
        const ipValidation = validateIpList(allowedIps);
        if (!ipValidation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: ipValidation.error || 'Invalid IP/CIDR entries',
          });
        }
        storedAllowedIps = allowedIps.map((ip) => ip.trim());
      }

      // Validate origin list
      let storedAllowedOrigins: string[] | null = null;
      if (allowedOrigins.length > 0) {
        const originValidation = validateOriginList(allowedOrigins);
        if (!originValidation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: originValidation.error || 'Invalid origin patterns',
          });
        }
        storedAllowedOrigins = allowedOrigins.map((origin) => origin.trim());
      }

      // Update restrictions
      const [updatedKey] = await db
        .update(apiKeysTable)
        .set({
          allowedIps: storedAllowedIps,
          allowedOrigins: storedAllowedOrigins,
          allowBrowserRequests,
          allowServerRequests,
        })
        .where(eq(apiKeysTable.id, keyId))
        .returning({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          publicKey: apiKeysTable.publicKey,
          type: apiKeysTable.type,
          allowedIps: apiKeysTable.allowedIps,
          allowedOrigins: apiKeysTable.allowedOrigins,
          allowBrowserRequests: apiKeysTable.allowBrowserRequests,
          allowServerRequests: apiKeysTable.allowServerRequests,
          keyPrefix: apiKeysTable.keyPrefix,
          expiresAt: apiKeysTable.expiresAt,
          createdAt: apiKeysTable.createdAt,
        });

      logger.info(
        {
          userId: ctx.user.id,
          keyId,
          allowBrowserRequests,
          allowServerRequests,
          allowedIpsCount: storedAllowedIps?.length ?? 0,
          allowedOriginsCount: storedAllowedOrigins?.length ?? 0,
          signedBy,
        },
        'API key restrictions updated',
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
    .input(apiKeysContract.getById.input)
    .output(apiKeysContract.getById.output)
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
          // Restriction fields
          allowedIps: apiKeysTable.allowedIps,
          allowedOrigins: apiKeysTable.allowedOrigins,
          allowBrowserRequests: apiKeysTable.allowBrowserRequests,
          allowServerRequests: apiKeysTable.allowServerRequests,
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
