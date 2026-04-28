import { ALLOWED_CHAINS_DETAILS_SCHEMA } from '@namefi-astra/utils/allowed-chains';
import { z } from 'zod';

import { createContract } from './create-contract';
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
// unofficialTlds
// ---------------------------------------------------------------------------

const unofficialTldsOutputSchema = z.array(z.string());

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
// showLoginMethod
// ---------------------------------------------------------------------------

// Whether the resolved `loginMethod` should be shown in user-visible
// surfaces (login-notification email, admin login-history page, profile
// Security card). Driven by the `SHOW_LOGIN_METHOD` env flag on the
// backend; default false because the underlying detection is heuristic
// and currently not reliable enough to surface.
const showLoginMethodOutputSchema = z.boolean();

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const configContract = createContract(
  { softOutput: true },
  {
    allowedChains: {
      type: 'query',
      input: z.void(),
      output: allowedChainsOutputSchema,
    },

    unofficialTlds: {
      type: 'query',
      input: z.void(),
      output: unofficialTldsOutputSchema,
    },

    x402Payment: {
      type: 'query',
      input: z.void(),
      output: x402PaymentOutputSchema,
    },

    showLoginMethod: {
      type: 'query',
      input: z.void(),
      output: showLoginMethodOutputSchema,
    },
  },
);

export type ConfigContract = typeof configContract;
