import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the auth router.
 *
 * The router (`apps/backend/src/trpc/routers/authRouter.ts`) is type-checked
 * against this contract via `createContractTRPCRouter<typeof authContract>`.
 * Note: the backend uses `baseProcedure` for `getSigningDomain` (not
 * `publicProcedure`) — the contract doesn't care which base the router
 * picks.
 */

/**
 * Structural mirror of viem's `TypedDataDomain`. We deliberately do not
 * import from `viem` directly because `@namefi-astra/common` doesn't have
 * it as a dep and we don't want to add one for a single type. The backend
 * passes a real viem `TypedDataDomain` and relies on structural
 * compatibility — any divergence is caught at the contract-assignment
 * site in the router.
 */
type TypedDataDomainLike = {
  name?: string;
  version?: string;
  chainId?: number | bigint;
  verifyingContract?: `0x${string}`;
  salt?: `0x${string}`;
};

// TODO(contract): replace with a structural zod schema for TypedDataDomain.
const signingDomainOutputSchema = z.object({
  domain: z.custom<TypedDataDomainLike>(() => true),
});

export const authContract = createContract(
  { softOutput: true },
  {
    getSigningDomain: {
      type: 'query',
      input: z.void(),
      output: signingDomainOutputSchema,
    },
  },
);

export type AuthContract = typeof authContract;
