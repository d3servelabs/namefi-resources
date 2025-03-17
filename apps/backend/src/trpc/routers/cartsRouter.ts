import { cartItemInsertSchema, cartItemUpdateSchema, cartItemsTable, cartsTable, db } from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

export const cartsRouter = createTRPCRouter({
  // Get or create cart for the current user
  getOrCreate: protectedProcedure.query(async ({ ctx }) => {
    // Try to find existing cart with items
    let cart = await db.query.cartsTable.findFirst({
      where: eq(cartsTable.userId, ctx.user.id),
      with: {
        items: true,
      },
    });

    if (!cart) {
      // Create new cart if none exists
      const [newCart] = await db
        .insert(cartsTable)
        .values({
          userId: ctx.user.id,
        })
        .returning();

      cart = {
        ...newCart,
        items: [],
      };
    }

    return cart;
  }),

  // Add item to cart
  addItem: protectedProcedure
    .input(
      cartItemInsertSchema
        .omit({
          id: true,
          cartId: true,
          createdAt: true,
          updatedAt: true,
        })
        .required()
        .partial({
          metadata: true,
        }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get or create cart
      let cart = await db.query.cartsTable.findFirst({
        where: eq(cartsTable.userId, ctx.user.id),
        with: {
          items: true,
        },
      });

      if (!cart) {
        const [newCart] = await db
          .insert(cartsTable)
          .values({
            userId: ctx.user.id,
          })
          .returning();
        cart = {
          ...newCart,
          items: [],
        };
      }

      // Add item to cart
      await db
        .insert(cartItemsTable)
        .values({
          cartId: cart.id,
          amountInUSDCents: input.amountInUSDCents,
          normalizedDomainName: input.normalizedDomainName,
          metadata: input.metadata,
        })
        .returning();

      // Return updated cart with items
      const updatedCart = await db.query.cartsTable.findFirst({
        where: eq(cartsTable.id, cart.id),
        with: {
          items: true,
        },
      });

      return updatedCart;
    }),

  // Update cart item
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
      // Find cart item and verify ownership
      const cartItem = await db.query.cartItemsTable.findFirst({
        where: eq(cartItemsTable.id, input.id),
        with: {
          cart: {
            columns: {
              userId: true,
              id: true,
            },
          },
        },
      });

      if (!cartItem || cartItem.cart.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cart item not found',
        });
      }

      await db
        .update(cartItemsTable)
        .set({
          amountInUSDCents: input.amountInUSDCents,
          metadata: input.metadata,
          updatedAt: new Date(),
        })
        .where(eq(cartItemsTable.id, input.id))
        .returning();

      // Return updated cart with items
      const updatedCart = await db.query.cartsTable.findFirst({
        where: eq(cartsTable.id, cartItem.cart.id),
        with: {
          items: true,
        },
      });

      return updatedCart;
    }),

  // Remove item from cart
  removeItem: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      // Find cart item and verify ownership
      const cartItem = await db.query.cartItemsTable.findFirst({
        where: eq(cartItemsTable.id, input),
        with: {
          cart: {
            columns: {
              userId: true,
              id: true,
            },
          },
        },
      });

      if (!cartItem || cartItem.cart.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cart item not found',
        });
      }

      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, input));

      // Return updated cart with items
      const updatedCart = await db.query.cartsTable.findFirst({
        where: eq(cartsTable.id, cartItem.cart.id),
        with: {
          items: true,
        },
      });

      return updatedCart;
    }),

  // Clear cart (remove all items)
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    // Get or create cart
    let cart = await db.query.cartsTable.findFirst({
      where: eq(cartsTable.userId, ctx.user.id),
      with: {
        items: true,
      },
    });

    if (!cart) {
      const [newCart] = await db
        .insert(cartsTable)
        .values({
          userId: ctx.user.id,
        })
        .returning();
      cart = {
        ...newCart,
        items: [],
      };
    }

    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

    // Return updated cart with items
    const updatedCart = await db.query.cartsTable.findFirst({
      where: eq(cartsTable.id, cart.id),
      with: {
        items: true,
      },
    });

    return updatedCart;
  }),
});