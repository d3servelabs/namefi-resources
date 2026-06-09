import { cartItemsTable, db, itemTypeSchema } from '@namefi-astra/db';
import { cartsContract } from '@namefi-astra/common/contract/carts-contract';
import { stripNonImportDomainSetupOptions } from '@namefi-astra/common/contract/entity-schemas';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { getDomainListInfo } from '#lib/namefi-registry';
import { userQualifiesForDomainNamePromo } from '#lib/user-promo';
import { encryptEppAuthCode } from '#lib/epp-code-encryption';
import { protectedProcedure, withAudit } from '../base';
import { createContractTRPCRouter } from '../contract';
import { getDomainPricingForOperation } from '../types';
import { createLogger } from '#lib/logger';
import { isNotNil } from 'ramda';
import {
  getUserUnusedClaims,
  checkItemClaimEligibility,
} from '#temporal/activities/free-claim.activities';

const _logger = createLogger({ module: 'carts-router' });

export const cartsRouter = createContractTRPCRouter<typeof cartsContract>({
  // Get cart items for the current user
  getItems: protectedProcedure
    .input(cartsContract.getItems.input)
    .output(cartsContract.getItems.output)
    .query(async ({ ctx: { user, poweredByNamefiDomain } }) => {
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
    }),

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
    .input(cartsContract.addItems.input)
    .output(cartsContract.addItems.output)
    .mutation(async ({ ctx, input }) => {
      _logger.assign({ method: 'addItems' });

      _logger.debug(
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
        input.map(async (item): Promise<typeof cartItemsTable.$inferInsert> => {
          const baseItem: typeof cartItemsTable.$inferInsert = {
            userId: ctx.user.id,
            amountInUSDCents: item.amountInUSDCents,
            normalizedDomainName: item.normalizedDomainName,
            durationInYears: item.durationInYears,
            type: item.type,
            registrar: item.registrar,
            // keepExistingNameservers is import-only; drop it for other types.
            metadata: stripNonImportDomainSetupOptions(
              item.type,
              item.metadata,
            ),
          };

          // For import items, encrypt the EPP authorization code
          if (
            item.type === itemTypeSchema.enum.IMPORT &&
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
    .input(cartsContract.updateItem.input)
    .output(cartsContract.updateItem.output)
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

      // If per-item domain setup options are being updated, merge them into the
      // existing metadata. `stripNonImportDomainSetupOptions` drops the
      // import-only `keepExistingNameservers` flag for non-IMPORT items
      // (defense in depth — the UI only exposes it for imports).
      if (input.domainSetupOptions) {
        updateSet.metadata = stripNonImportDomainSetupOptions(
          currentItem.type,
          {
            ...currentItem.metadata,
            domainSetupOptions: input.domainSetupOptions,
          },
        );
      }

      // Persist the user's acknowledgement of the TLD's registration
      // requirements (e.g. .app/.dev HTTPS notice). Merge into any metadata
      // already staged this request, falling back to the current metadata.
      if (input.tldRegistrationRequirementAcknowledged !== undefined) {
        updateSet.metadata = {
          ...(updateSet.metadata ?? currentItem.metadata),
          tldRegistrationRequirementAcknowledged:
            input.tldRegistrationRequirementAcknowledged,
        };
      }

      // If EPP authorization code is being updated for import items
      if (
        currentItem.type === itemTypeSchema.enum.IMPORT &&
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
      // `input` here is the array of normalized domain names, not an
      // object with an `id` field — kept as `'unknown'` to match the
      // original audit behavior, which logged `''` because `input.id`
      // didn't exist on the array.
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'cart_item',
      resourceId: '',
      action: 'delete',
      extraInput: input,
    }),
  )
    .input(cartsContract.removeItem.input)
    .output(cartsContract.removeItem.output)
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

  clear: protectedProcedure
    .input(cartsContract.clear.input)
    .output(cartsContract.clear.output)
    .mutation(async ({ ctx }) => {
      await db
        .delete(cartItemsTable)
        .where(eq(cartItemsTable.userId, ctx.user.id));

      return [];
    }),
});
