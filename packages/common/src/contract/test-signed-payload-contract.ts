import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the test signed payload router — a development/testing
 * endpoint that validates the EIP-712 signed-payload middleware
 * (`createSignedPayloadProcedure`) end-to-end.
 *
 * The router
 * (`apps/backend/src/trpc/routers/testSignedPayloadRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof testSignedPayloadContract>`. The
 * `createSignedPayloadProcedure(config)` middleware stays at the handler
 * call site — the contract only pins IO shapes.
 */

const testSignedEndpointInputSchema = z.object({
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  payload: z.object({
    message: z.string().min(1),
    timestamp: z.number().int().positive(),
  }),
});

const testSignedEndpointOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.object({
    payload: z.object({
      message: z.string(),
      timestamp: z.number(),
    }),
    signerWalletAddress: z.custom<`0x${string}`>(
      (val) => typeof val === 'string' && val.startsWith('0x'),
    ),
    userId: z.string(),
    privyUserId: z.string(),
    verifiedAt: z.string(),
  }),
});

export const testSignedPayloadContract = {
  testSignedEndpoint: {
    type: 'mutation',
    input: testSignedEndpointInputSchema,
    output: testSignedEndpointOutputSchema,
  },
} as const satisfies RouterContract;

export type TestSignedPayloadContract = typeof testSignedPayloadContract;
