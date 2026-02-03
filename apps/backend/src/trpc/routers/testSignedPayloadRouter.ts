import { z } from 'zod';
import { createTRPCRouter, createSignedPayloadProcedure } from '../base';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'test-signed-payload-router' });

/**
 * EIP-712 types for the test signed payload.
 * These define the structure that will be displayed in the wallet UI when signing.
 */
export const TEST_SIGNED_PAYLOAD_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  TestPayload: [
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

/**
 * Test router for validating signed payload functionality.
 * This router is for development/testing purposes only.
 */
export const testSignedPayloadRouter = createTRPCRouter({
  /**
   * Test endpoint that requires a signed EIP-712 payload.
   * Logs the payload details and returns them for verification.
   */
  testSignedEndpoint: createSignedPayloadProcedure({
    types: TEST_SIGNED_PAYLOAD_EIP712_TYPES,
    primaryType: 'TestPayload',
    getPayloadFromInput: (input: unknown) =>
      (input as { payload: { message: string; timestamp: number } }).payload,
    getSignatureFromInput: (input: unknown) =>
      (input as { signature: string }).signature,
    getChainIdFromInput: async () => 1,
  })
    .input(
      z.object({
        signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
        payload: z.object({
          message: z.string().min(1),
          timestamp: z.number().int().positive(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      logger.debug(
        {
          payload: input.payload,
          signerWalletAddress: ctx.signerWalletAddress,
          userId: ctx.user.id,
          privyUserId: ctx.user.privyUserId,
        },
        'Test signed payload received - signature verified successfully',
      );

      return {
        success: true,
        message: 'Payload signature verified successfully',
        details: {
          payload: input.payload,
          signerWalletAddress: ctx.signerWalletAddress,
          userId: ctx.user.id,
          privyUserId: ctx.user.privyUserId,
          verifiedAt: new Date().toISOString(),
        },
      };
    }),
});
