import {
  cartItemInsertSchema,
  cartItemUpdateSchema,
  cartItemsTable,
  db,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { userQualifiesForDomainNamePromo } from '#lib/userPromo';
import { createTRPCRouter, protectedProcedure } from '../base';
import { isNormalizedDomainNameAllowedForOriginHostname } from '../utils';

export const cartsRouter = createTRPCRouter({
  // Get cart items for the current user
  getItems: protectedProcedure.query(async ({ ctx }) => {
    const cartItems = await db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.userId, ctx.user.id),
    });
    return filterCartItemsByOrigin(cartItems, ctx.thirdPartyOriginHostname);
  }),

  // Add multiple items to cart for the current user
  addItems: protectedProcedure
    .input(
      z.array(
        cartItemInsertSchema
          .omit({
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          })
          .required()
          .partial({
            metadata: true,
          }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if any items have 0 price and verify they qualify for promos
      const promoItems = input.filter((item) => item.amountInUSDCents === 0);

      if (promoItems.length > 0) {
        const qualificationChecks = await Promise.all(
          promoItems.map(async (item) => {
            const qualifies = await userQualifiesForDomainNamePromo({
              normalizedDomainName:
                item.normalizedDomainName as NamefiNormalizedDomain,
              user: ctx.user,
            });

            return { item, qualifies };
          }),
        );

        const nonQualifyingItem = qualificationChecks.find(
          (check) => !check.qualifies,
        );

        if (nonQualifyingItem) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User does not qualify for promotional pricing',
          });
        }
      }

      // Prepare items for insertion with user ID
      const itemsToInsert = input.map((item) => ({
        userId: ctx.user.id,
        amountInUSDCents: item.amountInUSDCents,
        normalizedDomainName: item.normalizedDomainName,
        durationInYears: 3,
        metadata: item.metadata || {},
      }));

      // Insert items with conflict handling
      await db
        .insert(cartItemsTable)
        .values(itemsToInsert)
        .onConflictDoUpdate({
          target: [cartItemsTable.userId, cartItemsTable.normalizedDomainName],
          set: {
            amountInUSDCents: sql`excluded.amount_in_usd_cents`,
            metadata: sql`excluded.metadata`,
            updatedAt: sql`now()`,
          },
        });

      // Return updated cart with items
      const cartItems = await db.query.cartItemsTable.findMany({
        where: eq(cartItemsTable.userId, ctx.user.id),
      });

      return filterCartItemsByOrigin(cartItems, ctx.thirdPartyOriginHostname);
    }),

  // Update cart item for the current user
  updateItem: protectedProcedure
    .input(
      cartItemUpdateSchema
        .pick({
          id: true,
          amountInUSDCents: true,
          metadata: true,
        })
        .required()
        .partial({
          metadata: true,
        }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(cartItemsTable)
        .set({
          amountInUSDCents: input.amountInUSDCents,
          metadata: input.metadata,
        })
        .where(
          and(
            eq(cartItemsTable.id, input.id),
            eq(cartItemsTable.userId, ctx.user.id),
          ),
        );

      // Return updated cart with items
      const cartItems = await db.query.cartItemsTable.findMany({
        where: eq(cartItemsTable.userId, ctx.user.id),
      });

      return filterCartItemsByOrigin(cartItems, ctx.thirdPartyOriginHostname);
    }),

  // Remove item from cart for the current user
  removeItem: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(cartItemsTable)
        .where(
          and(
            eq(cartItemsTable.id, input),
            eq(cartItemsTable.userId, ctx.user.id),
          ),
        );

      // Return updated cart with items
      const cartItems = await db.query.cartItemsTable.findMany({
        where: eq(cartItemsTable.userId, ctx.user.id),
      });

      return filterCartItemsByOrigin(cartItems, ctx.thirdPartyOriginHostname);
    }),

  // Clear cart (remove all items) for the current user
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.userId, ctx.user.id));
    return [];
  }),
});

const filterCartItemsByOrigin = (
  cartItems: (typeof cartItemsTable.$inferSelect)[],
  originHostname?: string | null,
) => {
  return cartItems.filter((item) =>
    isNormalizedDomainNameAllowedForOriginHostname(
      item.normalizedDomainName,
      originHostname,
    ),
  );
};
