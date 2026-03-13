import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { createSiweMessage } from 'viem/siwe';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../base';
import {
  getSiweNonce,
  prepareSiweMessage,
  SIWE_DOMAIN,
  verifySiweSignature,
} from '#lib/auth/methods/siwe/api-key-siwe';
import { config } from '#lib/env';
import { getAllowedChainsForNft } from '#lib/env/allowed-chains';
import { logger } from '#lib/logger';

const isoDateStringSchema = z
  .string()
  .datetime()
  .describe('ISO 8601 timestamp for a SIWE temporal field.');

const siweMessageSchema = z
  .object({
    address: checksumWalletAddressSchema.describe(
      'Wallet address that signed the SIWE message.',
    ),
    chainId: z
      .number()
      .int()
      .describe('EIP-155 chain ID the SIWE session is bound to.'),
    domain: z.string().min(1).describe('Domain requesting the SIWE signature.'),
    expirationTime: isoDateStringSchema
      .transform((value) => new Date(value))
      .optional(),
    issuedAt: isoDateStringSchema
      .transform((value) => new Date(value))
      .optional(),
    nonce: z
      .string()
      .min(1)
      .describe('Nonce previously issued by the server for this signer.'),
    notBefore: isoDateStringSchema
      .transform((value) => new Date(value))
      .optional(),
    requestId: z
      .string()
      .min(1)
      .optional()
      .describe('Optional identifier used to correlate the SIWE request.'),
    resources: z
      .array(z.string().min(1))
      .optional()
      .describe('Optional resources referenced by the SIWE message.'),
    scheme: z
      .string()
      .min(1)
      .optional()
      .describe('Optional URI scheme for the relying party.'),
    statement: z
      .string()
      .min(1)
      .optional()
      .describe('Human-readable statement presented during signing.'),
    uri: z
      .string()
      .url()
      .describe('URI that is the subject of the SIWE sign-in.'),
    version: z.literal('1').describe('SIWE message version.'),
  })
  .describe('EIP-4361 Sign-In with Ethereum message payload.');

const siweMessageOutputSchema = z
  .object({
    address: checksumWalletAddressSchema.describe(
      'Wallet address that signed the SIWE message.',
    ),
    chainId: z
      .number()
      .int()
      .describe('EIP-155 chain ID the SIWE session is bound to.'),
    domain: z.string().min(1).describe('Domain requesting the SIWE signature.'),
    expirationTime: isoDateStringSchema.optional(),
    issuedAt: isoDateStringSchema.optional(),
    nonce: z
      .string()
      .min(1)
      .describe('Nonce previously issued by the server for this signer.'),
    notBefore: isoDateStringSchema.optional(),
    requestId: z
      .string()
      .min(1)
      .optional()
      .describe('Optional identifier used to correlate the SIWE request.'),
    resources: z
      .array(z.string().min(1))
      .optional()
      .describe('Optional resources referenced by the SIWE message.'),
    scheme: z
      .string()
      .min(1)
      .optional()
      .describe('Optional URI scheme for the relying party.'),
    statement: z
      .string()
      .min(1)
      .optional()
      .describe('Human-readable statement presented during signing.'),
    uri: z
      .string()
      .url()
      .describe('URI that is the subject of the SIWE sign-in.'),
    version: z.literal('1').describe('SIWE message version.'),
  })
  .describe('Wire-format SIWE message payload with ISO timestamps.');

const getSiweNonceInputSchema = z
  .object({
    signerAddress: checksumWalletAddressSchema.describe(
      'Wallet address that will sign the SIWE message.',
    ),
  })
  .describe('Input used to mint a replay-protected SIWE nonce.');

const getSiweNonceOutputSchema = z
  .discriminatedUnion('valid', [
    z
      .object({
        valid: z.literal(true).describe('Indicates the nonce was generated.'),
        nonce: z
          .string()
          .min(1)
          .describe('Generated nonce to embed in the SIWE message.'),
      })
      .describe('Successful SIWE nonce response.'),
    z
      .object({
        valid: z.literal(false).describe('Indicates nonce generation failed.'),
        error: z
          .string()
          .min(1)
          .describe('Reason the nonce could not be issued.'),
      })
      .describe('Failed SIWE nonce response.'),
  ])
  .describe('Result of requesting a nonce for a SIWE sign-in flow.');

const siweSessionSchema = z
  .object({
    address: checksumWalletAddressSchema.describe(
      'Wallet address bound to the created SIWE session.',
    ),
    chainId: z
      .number()
      .int()
      .describe('EIP-155 chain ID bound to the created SIWE session.'),
    createdAt: isoDateStringSchema.describe(
      'ISO timestamp describing when the SIWE session was created.',
    ),
    maxAgeSeconds: z
      .number()
      .int()
      .positive()
      .describe('Session lifetime in seconds.'),
  })
  .describe('Stored SIWE session details returned with the session token.');

const prepareSiweMessageInputSchema = z
  .object({
    signerAddress: checksumWalletAddressSchema.describe(
      'Wallet address that will sign the SIWE message.',
    ),
    nonce: z
      .string()
      .min(1)
      .describe('Nonce previously issued by the server for this signer.'),
    chainId: z
      .number()
      .int()
      .optional()
      .describe('Optional EIP-155 chain ID to bind the SIWE session to.'),
  })
  .describe('Input used to prepare a canonical SIWE message.');

const prepareSiweMessageOutputSchema = z
  .discriminatedUnion('valid', [
    z.object({
      valid: z.literal(true),
      message: siweMessageOutputSchema,
      messageString: z
        .string()
        .min(1)
        .describe('Canonical EIP-4361 message string to sign.'),
    }),
    z.object({
      valid: z.literal(false),
      error: z.string().min(1),
    }),
  ])
  .describe(
    'Result of preparing a canonical SIWE message after verifying the nonce exists.',
  );

const verifySiweSignatureInputSchema = z
  .object({
    signature: z
      .string()
      .regex(/^0x[a-fA-F0-9]+$/)
      .describe('Hex-encoded signature produced for the SIWE message.'),
    message: siweMessageSchema,
    address: checksumWalletAddressSchema.describe(
      'Expected signer wallet address used to cross-check the SIWE message.',
    ),
  })
  .describe(
    'Input required to verify a signed SIWE message and create a session.',
  );

const verifySiweSignatureOutputSchema = z
  .discriminatedUnion('valid', [
    z
      .object({
        valid: z
          .literal(true)
          .describe('Indicates the SIWE signature was verified.'),
        recoveredAddress: checksumWalletAddressSchema.describe(
          'Recovered signer address after successful verification.',
        ),
        token: z
          .string()
          .uuid()
          .describe(
            'Opaque SIWE session token to send on authenticated requests.',
          ),
        session: siweSessionSchema,
      })
      .describe('Successful SIWE signature verification response.'),
    z
      .object({
        valid: z
          .literal(false)
          .describe('Indicates the SIWE signature verification failed.'),
        error: z
          .string()
          .min(1)
          .describe('Reason the SIWE signature could not be verified.'),
      })
      .describe('Failed SIWE signature verification response.'),
  ])
  .describe('Result of verifying a SIWE message and creating a session token.');

export const siweRouter = createTRPCRouter({
  getSiweNonce: publicProcedure
    .meta({
      route: {
        path: '/siwe/nonce',
        method: 'GET',
        tags: ['auth', 'siwe'],
        operationId: 'getSiweNonce',
        summary: 'Get a SIWE nonce',
        description:
          'Generate and store a replay-protected nonce for a wallet address before signing a SIWE message.',
      },
    })
    .input(getSiweNonceInputSchema)
    .output(getSiweNonceOutputSchema)
    .query(async ({ input }) => getSiweNonce(input)),

  prepareMessage: publicProcedure
    .meta({
      route: {
        path: '/siwe/message',
        method: 'GET',
        tags: ['auth', 'siwe'],
        operationId: 'prepareSiweMessage',
        summary: 'Prepare a SIWE message',
        description:
          'Verify that a previously issued nonce still exists and return the canonical SIWE message payload to sign.',
      },
    })
    .input(prepareSiweMessageInputSchema)
    .output(prepareSiweMessageOutputSchema)
    .query(async ({ input, ctx }) => {
      try {
        logger.debug({
          signerAddress: input.signerAddress,
          chainId: input.chainId,
        }, 'Preparing SIWE message for signer %s on chain %d', input.signerAddress, input.chainId);
        const result = await prepareSiweMessage({
          signerAddress: input.signerAddress,
          nonce: input.nonce,
          chainId: input.chainId,
          domain: SIWE_DOMAIN,
          uri: SIWE_DOMAIN.includes('http') ? SIWE_DOMAIN : `https://${SIWE_DOMAIN}`,
        });
        logger.debug({
          signerAddress: input.signerAddress,
          chainId: input.chainId,
          result,
        }, 'Prepared SIWE message for signer %s on chain %d', input.signerAddress, input.chainId);

        if (!result.valid) {
          return result;
        }

        return {
          valid: true,
          message: {
            ...result.message,
            expirationTime: result.message.expirationTime?.toISOString(),
            issuedAt: result.message.issuedAt?.toISOString(),
            notBefore: result.message.notBefore?.toISOString(),
          },
          messageString: createSiweMessage(result.message),
        };
      } catch (error) {
        logger.error({
          signerAddress: input.signerAddress,
          chainId: input.chainId,
          error: (error as Error).message,
        }, 'Error preparing SIWE message for signer %s on chain %d: %s', input.signerAddress, input.chainId, (error as Error).message);
        return {
          valid: false,
          error: 'Failed to prepare SIWE message: ' + (error as Error).message,
        };
      }
    }),

  verifySiweSignature: publicProcedure
    .meta({
      route: {
        path: '/siwe/verify',
        method: 'POST',
        tags: ['auth', 'siwe'],
        operationId: 'verifySiweSignature',
        summary: 'Verify a SIWE signature',
        description:
          'Verify a signed SIWE message, consume its nonce, and return a session token plus stored session details.',
      },
    })
    .input(verifySiweSignatureInputSchema)
    .output(verifySiweSignatureOutputSchema)
    .mutation(async ({ input }) => {
      return verifySiweSignature({
        signature: input.signature,
        message: input.message,
        expectedSignerAddress: input.address,
      });
    }),

  getAllowedChains: publicProcedure
    .meta({
      route: {
        path: '/siwe/allowed-chains',
        method: 'GET',
        tags: ['auth', 'siwe'],
        operationId: 'getAllowedChains',
        summary: 'Get allowed chains for SIWE',
        description:
          'Retrieve the list of blockchain networks that are allowed for SIWE authentication.',
      },
    })
    .input(z.any())
    .output(z.array(z.number()))
    .query(async () => {
      return getAllowedChainsForNft();
    }),
});
