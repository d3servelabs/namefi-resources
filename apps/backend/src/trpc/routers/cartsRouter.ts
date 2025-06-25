import {
  cartItemInsertSchema,
  cartItemUpdateSchema,
  cartItemsTable,
  db,
  itemTypeSchema,
} from '@namefi-astra/db';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDomainListInfo } from '#lib/namefi-registry';
import { userQualifiesForDomainNamePromo } from '#lib/userPromo';
import { encryptEppAuthCode } from '#lib/epp-code-encryption';
import { createTRPCRouter, protectedProcedure } from '../base';
import { isNormalizedDomainNameAllowedForOriginHostname } from '../utils';
import { getDomainPricingForOperation } from '../types';
import { createLogger } from '#lib/logger';

const _logger = createLogger({ context: 'cartsRouter' });

export const cartsRouter = createTRPCRouter({
  // Get cart items for the current user
  getItems: protectedProcedure.query(async ({ ctx }) => {
    const cartItems = await db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.userId, ctx.user.id),
    });
    const filteredCartItems = filterCartItemsByOrigin(
      cartItems,
      ctx.thirdPartyOriginHostname,
    );

    const domainInfos = await getDomainListInfo(
      filteredCartItems.map(
        (item) => item.normalizedDomainName as NamefiNormalizedDomain,
      ),
      ctx.user,
    );

    const domainInfoMap = new Map(
      domainInfos.map((info) => [info.domain, info]),
    );

    return filteredCartItems.map((item) => ({
      ...item,
      domainAvailabilityInfo: domainInfoMap.get(
        item.normalizedDomainName as NamefiNormalizedDomain,
      ),
    }));
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
            encryptionKeyId: true,
            encryptedEppAuthorizationCode: true,
          })
          .extend({
            // For import items, we accept the plain text EPP code
            eppAuthorizationCode: z.string().optional(),
          }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const methodLogger = _logger.child({
        method: 'addItems',
      });

      methodLogger.info({ input }, 'Adding items to cart');

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

      // Process items for insertion
      const itemsToInsert = await Promise.all(
        input.map(async (item) => {
          const baseItem = {
            userId: ctx.user.id,
            amountInUSDCents: item.amountInUSDCents,
            normalizedDomainName: item.normalizedDomainName,
            durationInYears: item.durationInYears,
            type: item.type,
            registrar: item.registrar,
            metadata: item.metadata || {},
            encryptionKeyId: item.encryptionKeyId || null,
            encryptedEppAuthorizationCode:
              item.encryptedEppAuthorizationCode || null,
          };

          // For import items, encrypt the EPP authorization code
          if (
            item.type === itemTypeSchema.Values.IMPORT &&
            item.eppAuthorizationCode
          ) {
            if (!item.eppAuthorizationCode.trim()) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'EPP authorization code is required for import items',
              });
            }

            const { encryptedEppAuthorizationCode, encryptionKeyId } =
              await encryptEppAuthCode(item.eppAuthorizationCode);

            return {
              ...baseItem,
              encryptedEppAuthorizationCode,
              encryptionKeyId,
            };
          }

          return baseItem;
        }),
      );

      methodLogger.info({ itemsToInsert }, 'Items to insert');

      // Insert items with conflict handling
      await db
        .insert(cartItemsTable)
        .values(itemsToInsert)
        .onConflictDoUpdate({
          target: [cartItemsTable.userId, cartItemsTable.normalizedDomainName],
          set: {
            amountInUSDCents: sql`excluded.amount_in_usd_cents`,
            durationInYears: sql`excluded.duration_in_years`,
            type: sql`excluded.type`,
            encryptionKeyId: sql`excluded.encryption_key_id`,
            encryptedEppAuthorizationCode: sql`excluded.encrypted_epp_authorization_code`,
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
          durationInYears: true,
          metadata: true,
        })
        .required()
        .partial({
          metadata: true,
          amountInUSDCents: true,
          durationInYears: true,
        }),
    )
    .mutation(async ({ ctx, input }) => {
      // If duration is being updated, recalculate the amount using proper pricing
      let updatedAmountInUsdCents = input.amountInUSDCents;

      if (input.durationInYears && !input.amountInUSDCents) {
        // Get the current cart item to fetch domain info
        const currentItem = await db.query.cartItemsTable.findFirst({
          where: and(
            eq(cartItemsTable.id, input.id),
            eq(cartItemsTable.userId, ctx.user.id),
          ),
        });

        if (!currentItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cart item not found',
          });
        }

        const domainInfos = await getDomainListInfo(
          [currentItem.normalizedDomainName as NamefiNormalizedDomain],
          ctx.user,
        );

        const domainInfo = domainInfos[0];
        const pricingDetails = getDomainPricingForOperation(
          domainInfo,
          currentItem.type,
        );

        if (!pricingDetails) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Pricing details unavailable for domain: ${currentItem.normalizedDomainName}`,
          });
        }

        const chargeAmountInUsd = computeChargesInUsdOrThrow(
          pricingDetails,
          input.durationInYears,
        );
        updatedAmountInUsdCents = usdToCents(chargeAmountInUsd);
      }

      await db
        .update(cartItemsTable)
        .set({
          amountInUSDCents: updatedAmountInUsdCents,
          durationInYears: input.durationInYears,
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
