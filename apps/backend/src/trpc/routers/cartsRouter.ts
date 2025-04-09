import {
  cartItemInsertSchema,
  cartItemUpdateSchema,
  cartItemsTable,
  db,
} from '@namefi-astra/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

export const cartsRouter = createTRPCRouter({
  // Get cart items for the current user
  getItems: protectedProcedure.query(async ({ ctx }) => {
    const cartItems = await db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.userId, ctx.user.id),
    });
    return cartItems;
  }),

  // Add item to cart for the current user
  addItem: protectedProcedure
    .input(
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
    )
    .mutation(async ({ ctx, input }) => {
      // Add item to cart
      await db.insert(cartItemsTable).values({
        userId: ctx.user.id,
        amountInUSDCents: input.amountInUSDCents,
        normalizedDomainName: input.normalizedDomainName,
        metadata: input.metadata,
      });

      // Return cart items for the current user
      const cartItems = await db.query.cartItemsTable.findMany({
        where: eq(cartItemsTable.userId, ctx.user.id),
      });

      return cartItems;
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

      return cartItems;
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

      return cartItems;
    }),

  // Clear cart (remove all items) for the current user
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.userId, ctx.user.id));
    return [];
  }),
});
