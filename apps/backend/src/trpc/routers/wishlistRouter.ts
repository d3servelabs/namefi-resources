import { db, wishlistedDomainsTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

export const wishlistRouter = createTRPCRouter({
  addToWishlist: protectedProcedure
    .input(
      z.array(
        z.object({
          normalizedDomainName: namefiNormalizedDomainSchema,
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const [error, inserted] = await (
        await import('@namefi-astra/utils/promises/resolve')
      ).resolve(
        db
          .insert(wishlistedDomainsTable)
          .values(
            input.map((item) => ({
              userId: user.id,
              normalizedDomainName: item.normalizedDomainName,
            })),
          )
          .onConflictDoNothing?.()
          .returning(),
      );
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add to wishlist',
          cause: error,
        });
      }
      return inserted;
    }),

  removeFromWishlist: protectedProcedure
    .input(
      z.array(
        z.object({
          normalizedDomainName: namefiNormalizedDomainSchema,
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const normalizedDomainNames = input.map(
        (item) => item.normalizedDomainName,
      );
      const [error, deleted] = await (
        await import('@namefi-astra/utils/promises/resolve')
      ).resolve(
        db
          .delete(wishlistedDomainsTable)
          .where(
            and(
              eq(wishlistedDomainsTable.userId, user.id),
              inArray(
                wishlistedDomainsTable.normalizedDomainName,
                normalizedDomainNames,
              ),
            ),
          )
          .returning(),
      );
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove from wishlist',
          cause: error,
        });
      }
      return deleted;
    }),

  getWishlistDomains: protectedProcedure.query(async ({ ctx }) => {
    const { user, poweredByNamefiDomain } = ctx;
    const wishlistedDomains = await db.query.wishlistedDomainsTable.findMany({
      where: and(
        eq(wishlistedDomainsTable.userId, user.id),
        poweredByNamefiDomain
          ? ilike(
              wishlistedDomainsTable.normalizedDomainName,
              `%.${poweredByNamefiDomain}`,
            )
          : undefined,
      ),
      orderBy: (table) => [desc(table.createdAt)],
    });
    return wishlistedDomains;
  }),
});
