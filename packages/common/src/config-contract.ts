import { ALLOWED_CHAINS_DETAILS_SCHEMA } from '@namefi-astra/utils/allowed-chains';
import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the config router.
 *
 * The router (`apps/backend/src/trpc/routers/configRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof configContract>`. The contract knows
 * nothing about authentication — both procedures are public on the backend.
 */

// ---------------------------------------------------------------------------
// allowedChains
// ---------------------------------------------------------------------------

// `config.ALLOWED_CHAINS` is the post-parse output of `ALLOWED_CHAINS_SCHEMA`,
// which is a union that pipes flat `number[]` into `ALLOWED_CHAINS_DETAILS_SCHEMA`.
// Either way the parsed shape is the details object, so that's what we
// declare for the wire output.
const allowedChainsOutputSchema = ALLOWED_CHAINS_DETAILS_SCHEMA;

// ---------------------------------------------------------------------------
// x402Payment
// ---------------------------------------------------------------------------

const x402PaymentDisabledSchema = z.object({
  enabled: z.literal(false),
});

const x402PaymentEnabledSchema = z.object({
  enabled: z.literal(true),
  chainId: z.number(),
  network: z.string(),
  payTo: z.string(),
  asset: z.string(),
  maxTimeoutSeconds: z.number(),
  validAfterLeewaySeconds: z.number(),
  eip712DomainName: z.string(),
  eip712DomainVersion: z.string(),
  x402Version: z.literal(2),
});

const x402PaymentOutputSchema = z.discriminatedUnion('enabled', [
  x402PaymentDisabledSchema,
  x402PaymentEnabledSchema,
]);

export type X402PaymentInfo = z.infer<typeof x402PaymentOutputSchema>;

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const configContract = {
  allowedChains: {
    type: 'query',
    input: z.void(),
    output: allowedChainsOutputSchema,
  },

  x402Payment: {
    type: 'query',
    input: z.void(),
    output: x402PaymentOutputSchema,
  },
} as const satisfies RouterContract;

export type ConfigContract = typeof configContract;
