import { z } from 'zod';

import { createContract } from './create-contract';

/**
 * Contract for the API keys router.
 *
 * The router (`apps/backend/src/trpc/routers/apiKeysRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof apiKeysContract>`. All procedures use
 * `protectedProcedure` on the backend; the create/revoke/updateName
 * mutations accept an OPTIONAL EIP-712 signature that the handler verifies
 * against the authenticated user's wallets.
 */

// ---------------------------------------------------------------------------
// EIP-712 signing types (returned by `getSigningTypes`)
// ---------------------------------------------------------------------------

const eip712TypeFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
});

const eip712TypeMapSchema = z.record(
  z.string(),
  z.array(eip712TypeFieldSchema),
);

const signingTypesOutputSchema = z.object({
  domain: z.object({
    name: z.string().optional(),
    salt: z.custom<`0x${string}`>().optional(),
    verifyingContract: z.custom<`0x${string}`>().optional(),
    version: z.string().optional(),
    chainId: z.number(),
  }),
  types: z.object({
    createApiKey: eip712TypeMapSchema,
    revokeApiKey: eip712TypeMapSchema,
    updateApiKeyName: eip712TypeMapSchema,
    updateApiKeyRestrictions: eip712TypeMapSchema,
  }),
});

// ---------------------------------------------------------------------------
// API key row (returned by `list` and `getById`)
// ---------------------------------------------------------------------------

const apiKeyTypeSchema = z.union([
  z.literal('PLAIN'),
  z.literal('PUBLIC_PRIVATE'),
]);

const apiKeyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: apiKeyTypeSchema,
  keyPrefix: z.string(),
  expiresAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  createdAt: z.date(),
  // Restriction fields (only applicable for PLAIN keys)
  allowedIps: z.array(z.string()).nullable().default([]),
  allowedOrigins: z.array(z.string()).nullable().default([]),
  allowBrowserRequests: z.boolean().default(false),
  allowServerRequests: z.boolean().default(false),
  isActive: z.boolean(),
  isExpired: z.boolean().nullable(),
});

const listOutputSchema = z.array(apiKeyListItemSchema);

const getByIdInputSchema = z.object({
  keyId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

const createInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix')
    .optional(),
  payload: z.object({
    keyName: z.string().min(1).max(100),
    keyType: apiKeyTypeSchema,
    publicKey: z.string().default(''), // Required for PUBLIC_PRIVATE, empty for PLAIN
    expiresAt: z.number().int().min(0), // 0 means never expires
    // Restriction fields (only applicable for PLAIN keys)
    allowedIps: z.array(z.string()).default([]),
    allowedOrigins: z.array(z.string()).default([]),
    allowBrowserRequests: z.boolean().default(false),
    allowServerRequests: z.boolean().default(false),
    timestamp: z.number().int(),
  }),
});

const createOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: apiKeyTypeSchema,
  keyPrefix: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  // Restriction fields (only applicable for PLAIN keys)
  allowedIps: z.array(z.string()).nullable().default([]),
  allowedOrigins: z.array(z.string()).nullable().default([]),
  allowBrowserRequests: z.boolean().default(false),
  allowServerRequests: z.boolean().default(false),
  // For PLAIN keys this is the one-time-shown plaintext key. For
  // PUBLIC_PRIVATE keys it is `null`.
  plainKey: z.string().nullable(),
  signedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// revoke
// ---------------------------------------------------------------------------

const revokeInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix')
    .optional(),
  payload: z.object({
    keyId: z.string().uuid(),
    timestamp: z.number().int(),
  }),
});

const revokeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  revokedAt: z.date().nullable(),
  signedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// updateName
// ---------------------------------------------------------------------------

const updateNameInputSchema = z.object({
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

const updateNameOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  signedBy: z.string().optional(),
});

/**
 * Schema for update API key restrictions input
 */
const updateApiKeyRestrictionsInputSchema = z.object({
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a hex string with 0x prefix'),
  payload: z.object({
    keyId: z.string().uuid(),
    allowedIps: z.array(z.string()),
    allowedOrigins: z.array(z.string()),
    allowBrowserRequests: z.boolean(),
    allowServerRequests: z.boolean(),
    timestamp: z.number().int(),
  }),
});

const updateApiKeyRestrictionsOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: apiKeyTypeSchema,
  keyPrefix: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  // Restriction fields (only applicable for PLAIN keys)
  allowedIps: z.array(z.string()).nullable().default([]),
  allowedOrigins: z.array(z.string()).nullable().default([]),
  allowBrowserRequests: z.boolean().default(false),
  allowServerRequests: z.boolean().default(false),

  signedBy: z.string().optional(),
});
// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const apiKeysContract = createContract(
  { softOutput: true },
  {
    getSigningTypes: {
      type: 'query',
      input: z.void(),
      output: signingTypesOutputSchema,
    },
    list: {
      type: 'query',
      input: z.void(),
      output: listOutputSchema,
    },
    create: {
      type: 'mutation',
      input: createInputSchema,
      output: createOutputSchema,
    },
    revoke: {
      type: 'mutation',
      input: revokeInputSchema,
      output: revokeOutputSchema,
    },
    updateName: {
      type: 'mutation',
      input: updateNameInputSchema,
      output: updateNameOutputSchema,
    },
    updateApiKeyRestrictions: {
      type: 'mutation',
      input: updateApiKeyRestrictionsInputSchema,
      output: updateApiKeyRestrictionsOutputSchema,
    },
    getById: {
      type: 'query',
      input: getByIdInputSchema,
      output: apiKeyListItemSchema,
    },
  },
);

export type ApiKeysContract = typeof apiKeysContract;
