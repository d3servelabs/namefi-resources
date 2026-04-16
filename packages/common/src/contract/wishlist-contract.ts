import type { wishlistedDomainsTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
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
 * Output rows reuse the drizzle `$inferSelect` type for `wishlistedDomainsTable`
 * (rather than the drizzle-zod-derived `WishlistedDomainSelect`) to stay
 * consistent with how the orders contract handles drizzle row outputs and
 * to avoid the `metadata?: T | undefined` vs `metadata: T | null`
 * nullability mismatch — even though `wishlistedDomainsTable` has no jsonb
 * column today, this keeps the pattern uniform if one is added later.
 */

type WishlistedDomainRow = typeof wishlistedDomainsTable.$inferSelect;

const wishlistDomainArrayInputSchema = z.array(
  z.object({
    normalizedDomainName: namefiNormalizedDomainSchema,
  }),
);

// TODO(contract): replace with structural schema for wishlistedDomainsTable
const wishlistedDomainRowSchema = z.custom<WishlistedDomainRow>(() => true);

const wishlistedDomainArrayOutputSchema = z.array(wishlistedDomainRowSchema);

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
