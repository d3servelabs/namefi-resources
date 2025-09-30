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
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDomainListInfo } from '#lib/namefi-registry';
import { userQualifiesForDomainNamePromo } from '#lib/user-promo';
import { encryptEppAuthCode } from '#lib/epp-code-encryption';
import { createTRPCRouter, protectedProcedure, withAudit } from '../base';
import { getDomainPricingForOperation } from '../types';
import { createLogger } from '#lib/logger';
import { isNotNil } from 'ramda';
import {
  getUserUnusedClaims,
  checkItemClaimEligibility,
} from '#temporal/activities/free-claim.activities';

const _logger = createLogger({ module: 'carts-router' });

export const cartsRouter = createTRPCRouter({
  // Get cart items for the current user
  getItems: protectedProcedure.query(
    async ({ ctx: { user, poweredByNamefiDomain } }) => {
      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          eq(cartItemsTable.userId, user.id),
          isNotNil(poweredByNamefiDomain)
            ? ilike(
                cartItemsTable.normalizedDomainName,
                `%.${poweredByNamefiDomain}`,
              )
            : undefined,
        ),
      });

      // Get all unused claims for the user once
      const unusedClaims = await getUserUnusedClaims(user.id);

      type CartItemWithClaims = (typeof cartItems)[number] & {
        claims?: ReturnType<typeof checkItemClaimEligibility>;
      };

      // Check each cart item against the unused claims
      const cartItemsWithClaims = cartItems.map((item) => {
        const itemEligibleClaims = checkItemClaimEligibility(
          item.normalizedDomainName as NamefiNormalizedDomain,
          unusedClaims,
        );

        return {
          ...item,
          claims: itemEligibleClaims,
        } as CartItemWithClaims;
      });

      return cartItemsWithClaims;
    },
  ),

  // Add multiple items to cart for the current user
  addItems: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'cart_item',
      resourceId: result[0]?.id || '',
      action: 'create',
      extraInput: input,
    }),
  )
    .input(
      z.array(
        cartItemInsertSchema
          .omit({
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            encryptionKeyId: true,
            encryptedEppAuthorizationCode: true,
          })
          .required()
          .partial({
            metadata: true,
          })
          .extend({
            // For import items, we accept the plain text EPP code
            eppAuthorizationCode: z.string().optional(),
          }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      _logger.assign({ method: 'addItems' });

      _logger.info(
        {
          input: input.map((item) => ({
            normalizedDomainName: item.normalizedDomainName,
            amountInUSDCents: item.amountInUSDCents,
            durationInYears: item.durationInYears,
            type: item.type,
            registrar: item.registrar,
            eppAuthorizationCodeLength: item.eppAuthorizationCode?.length,
            metadata: item.metadata,
          })),
        },
        'Adding items to cart',
      );

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

      // Insert items with conflict handling and return the inserted/updated items
      const insertResult = await db
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
        })
        .returning();

      return insertResult;
    }),

  // Update cart item for the current user
  updateItem: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'cart_item',
      resourceId: input.id || '',
      action: 'update',
      extraInput: input,
    }),
  )
    .input(
      cartItemUpdateSchema
        .pick({
          id: true,
          durationInYears: true,
        })
        .required()
        .partial({
          durationInYears: true,
        })
        .extend({
          eppAuthorizationCode: z.string().optional(),
        })
        .refine(
          (data) =>
            data.durationInYears !== undefined ||
            data.eppAuthorizationCode !== undefined,
          {
            message:
              'At least one of durationInYears or eppAuthorizationCode must be provided',
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch current item since we need domain info for calculations
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

      const updateSet: Partial<typeof cartItemsTable.$inferInsert> = {};

      // If duration is being updated, calculate new price
      if (
        input.durationInYears &&
        input.durationInYears !== currentItem.durationInYears
      ) {
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

        updateSet.amountInUSDCents = usdToCents(chargeAmountInUsd);
        updateSet.durationInYears = input.durationInYears;
      }

      // If EPP authorization code is being updated for import items
      if (
        currentItem.type === itemTypeSchema.Values.IMPORT &&
        input.eppAuthorizationCode
      ) {
        if (!input.eppAuthorizationCode.trim()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'EPP authorization code is required for import items',
          });
        }

        const { encryptedEppAuthorizationCode, encryptionKeyId } =
          await encryptEppAuthCode(input.eppAuthorizationCode);

        updateSet.encryptedEppAuthorizationCode = encryptedEppAuthorizationCode;
        updateSet.encryptionKeyId = encryptionKeyId;
      }

      // Update and return the updated item
      const updateResult = await db
        .update(cartItemsTable)
        .set(updateSet)
        .where(
          and(
            eq(cartItemsTable.id, input.id),
            eq(cartItemsTable.userId, ctx.user.id),
          ),
        )
        .returning();

      if (updateResult.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cart item not found or not updated',
        });
      }

      return updateResult;
    }),

  removeItem: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'cart_item',
      resourceId: input.id || '',
      action: 'delete',
      extraInput: input,
    }),
  )
    .input(z.array(namefiNormalizedDomainSchema).min(1))
    .mutation(async ({ ctx, input }) => {
      // Delete and return the removed items directly
      const removedItems = await db
        .delete(cartItemsTable)
        .where(
          and(
            sql`${cartItemsTable.normalizedDomainName} IN (${sql.join(
              input.map((domainName) => sql`${domainName}`),
              sql`, `,
            )})`,
            eq(cartItemsTable.userId, ctx.user.id),
          ),
        )
        .returning();
      return removedItems;
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.userId, ctx.user.id));

    return [];
  }),
});
