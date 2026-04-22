import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
import {
  wishlistedDomainSchema,
  type WishlistedDomainSelect,
} from './entity-schemas';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the wishlist router.
 *
 * The router (`apps/backend/src/trpc/routers/wishlistRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof wishlistContract>`. The contract knows
 * nothing about authentication — every procedure is `protectedProcedure`
 * on the backend.
 *
 * Output rows use the common contract row shape, keeping frontend and backend
 * consumers independent of the database package.
 */

const wishlistDomainArrayInputSchema = z.array(
  z.object({
    normalizedDomainName: namefiNormalizedDomainSchema,
  }),
);

const wishlistedDomainArrayOutputSchema = z.array(wishlistedDomainSchema);

export const wishlistContract = createContract(
  { softOutput: true },
  {
    addToWishlist: {
      type: 'mutation',
      input: wishlistDomainArrayInputSchema,
      output: wishlistedDomainArrayOutputSchema,
    },

    removeFromWishlist: {
      type: 'mutation',
      input: wishlistDomainArrayInputSchema,
      output: wishlistedDomainArrayOutputSchema,
    },

    getWishlistDomains: {
      type: 'query',
      input: z.void(),
      output: wishlistedDomainArrayOutputSchema,
    },
  },
);

export type WishlistContract = typeof wishlistContract;
export type { WishlistedDomainSelect };
