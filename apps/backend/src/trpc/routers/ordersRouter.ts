import {
  type CartItemSelect,
  type OrderItemInsert,
  type PaymentSelect,
  cartItemsTable,
  db,
  isNfscPayment,
  itemTypeSchema,
  orderItemsTable,
  ordersTable,
  usersTable,
} from '@namefi-astra/db';
import {
  computeChargesInUsdFromDomainAvailabilityInfo,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import {
  type NamefiNormalizedDomain,
  checksumWalletAddressSchema,
  switchCase,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  flatten,
  groupBy,
  indexBy,
  isNil,
  isNotEmpty,
  isNotNil,
  prop,
} from 'ramda';
import Stripe from 'stripe';
import { zeroAddress } from 'viem';
import { z } from 'zod';
import {
  getDomainListInfo,
  type DomainAvailabilityInfo,
} from '#lib/namefi-registry';
import { NegativeAmountInUsdCentsError } from '#services/payments/errors';
import { orderService } from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createOrderInputSchema, isDomainImportable } from '../types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  isNormalizedDomainNameAllowedForOriginHostname,
  privyClient,
} from '../utils';
import type { Json } from 'drizzle-zod';
import { addDays, differenceInMonths } from 'date-fns';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { pluck } from 'ramda';
import { logger } from '#lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const ordersRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(createOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { cartItemIds } = input;
      const cartItems = await db.query.cartItemsTable.findMany({
        where: and(
          inArray(cartItemsTable.id, cartItemIds),
          eq(cartItemsTable.userId, ctx.user.id),
        ),
      });

      await validateCartItems(ctx.user.id, cartItemIds);

      if (cartItems.length !== cartItemIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
        });
      }

      const totalAmountInUsdCents = cartItems.reduce(
        (acc, item) => acc + item.amountInUSDCents,
        0,
      );
      let payment: PaymentSelect | undefined;
      if (totalAmountInUsdCents > 0) {
        // Validate payment walletAddress (if present) belongs to user
        if (isNfscPayment(input.paymentProviderDetails)) {
          const [error, privyUser] = await resolve(
            privyClient.getUserById(user.privyUserId),
          );

          if (error || isNil(privyUser)) {
            console.error('Privy fetch failed', {
              privyUserId: user.privyUserId,
              error,
            });
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: 'Could not find user details',
            });
          }

          const paymentWalletChecksumAddress =
            checksumWalletAddressSchema.safeParse(
              input.paymentProviderDetails.nfscPaymentDetails.walletAddress,
            );
          if (!paymentWalletChecksumAddress.success) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Payment walletAddress format is incorrect',
            });
          }

          const privyUserLinkedEthereumChecksumWalletAddresses =
            getPrivyUserLinkedEthereumChecksumWalletAddresses({
              privyUser,
            });

          if (
            !privyUserLinkedEthereumChecksumWalletAddresses.includes(
              paymentWalletChecksumAddress.data,
            )
          ) {
            console.error('Payment walletAddress validation failed');
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid payment walletAddress',
            });
          }
        }

        try {
          payment = await createPayment({
            amountInUsdCents: totalAmountInUsdCents,
            paymentProviderDetails: input.paymentProviderDetails,
          });
        } catch (error) {
          console.error((error as Error).message);
          if (error instanceof NegativeAmountInUsdCentsError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid cart items total',
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Could not create payment',
          });
        }
      } else {
        // for zero or negative, we cfreate a NFSC with 0 address
        try {
          payment = await createPayment({
            amountInUsdCents: totalAmountInUsdCents,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                chainId: 8453,
                walletAddress: zeroAddress,
              },
            },
          });
        } catch (error) {
          console.error((error as Error).message);
          if (error instanceof NegativeAmountInUsdCentsError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid cart items total',
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Could not create payment',
          });
        }
      }

      // Create order using DB transaction
      const order = await db.transaction(async (tx) => {
        // Create the order first
        const [order] = await tx
          .insert(ordersTable)
          .values({
            amountInUSDCents: totalAmountInUsdCents,
            totalAmountInUSDCents: totalAmountInUsdCents,
            userId: ctx.user.id,
            paymentId: payment.id,
            nftWalletAddress: input.nftMetadata.nftWalletAddress,
            nftChainId: input.nftMetadata.nftChainId,
          })
          .returning();

        // Create order items
        const orderItems = await tx
          .insert(orderItemsTable)
          .values(
            cartItems.map(
              (item) =>
                ({
                  orderId: order.id,
                  normalizedDomainName: item.normalizedDomainName,
                  amountInUSDCents: item.amountInUSDCents,
                  durationInYears: item.durationInYears,
                  type: item.type,
                  registrar: item.registrar,
                  metadata: item.metadata as Json,
                  encryptionKeyId: item.encryptionKeyId,
                  encryptedEppAuthorizationCode:
                    item.encryptedEppAuthorizationCode,
                }) satisfies OrderItemInsert,
            ),
          )
          .returning();

        // Delete cart items that were used to create the order
        await tx
          .delete(cartItemsTable)
          .where(
            and(
              inArray(cartItemsTable.id, cartItemIds),
              eq(cartItemsTable.userId, ctx.user.id),
            ),
          );

        return {
          ...order,
          items: orderItems,
        };
      });

      try {
        temporalClient.workflow.start(processOrderWorkflow, {
          args: [
            {
              orderId: order.id,
              paymentMetadata: input.paymentMetadata,
            },
          ],
          taskQueue: TEMPORAL_QUEUES.DOMAINS,
          workflowId: `process-order-${order.id}`,
        });
      } catch (error) {
        console.error(error);
      }

      return order;
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { orderId } = input;
      const order = await orderService.getOrderDetailsOrThrow(orderId);
      if (order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      return order;
    }),

  getOrderItems: protectedProcedure.query(async ({ ctx }) => {
    // TODO: (sid) Consider addding pagination to this query if we start to have a lot of orders
    const allOrders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.userId, ctx.user.id),
      with: {
        items: true,
      },
      orderBy: [desc(ordersTable.createdAt)],
    });

    return allOrders.flatMap((order) =>
      order.items.flatMap((item) =>
        isNormalizedDomainNameAllowedForOriginHostname(
          item.normalizedDomainName,
          ctx.thirdPartyOriginHostname,
        )
          ? [{ ...item, orderId: order.id }]
          : [],
      ),
    );
  }),

  getOrderPaymentMethodDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { orderId } = input;

      const { userId, payment } =
        await orderService.getOrderDetailsOrThrow(orderId);

      if (userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }

      if (isNfscPayment(payment)) {
        return {
          isOnChainPayment: true,
          txHash: payment.paymentProviderReferenceId,
          chainId: payment.nfscPaymentDetails.chainId,
          walletAddress: payment.nfscPaymentDetails.walletAddress,
        };
      }

      if (isNil(payment.paymentProviderReferenceId)) {
        return {
          isOnChainPayment: false,
          brand: undefined,
          last4: undefined,
        };
      }

      const stripePaymentIntent = await stripe.paymentIntents.retrieve(
        payment.paymentProviderReferenceId,
        { expand: ['payment_method'] },
      );

      if (isNil(stripePaymentIntent.payment_method)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'payment information missing',
        });
      }

      const paymentMethod =
        stripePaymentIntent.payment_method as Stripe.PaymentMethod;

      return {
        isOnChainPayment: false,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
      };
    }),

  reflectChangesInCartItemsIfAnyAndReturnSummary: protectedProcedure
    .input(z.object({ cartItemIds: z.array(z.string()).optional() }))
    .mutation(({ ctx, input }) => {
      const { cartItemIds } = input;
      return reflectChangesInCartItemsIfAnyAndReturnSummary(
        ctx.user.id,
        cartItemIds,
      );
    }),
});

type CartItemsGroupedByType = Record<
  'registerCartItems' | 'importCartItems' | 'renewCartItems',
  CartItemSelect[]
>;

type CartItemChange = {
  changeType: 'noChange' | 'priceChanged' | 'durationChanged';
  originalItem: CartItemSelect;
  newItem: CartItemSelect;
};

/**
 * Returns the changes if any to the cart items
 * @param userId - The user id
 * @param cartItemIds - The cart item ids
 * @returns The changes if any to the cart items
 */
async function getChangesIfAnyToCartItems(
  userId: string,
  cartItemIds?: string[],
) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (isNil(user)) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  const cartItems = (await db.query.cartItemsTable.findMany({
    where: and(
      isNotNil(cartItemIds) && isNotEmpty(cartItemIds)
        ? inArray(cartItemsTable.id, cartItemIds)
        : undefined,
      eq(cartItemsTable.userId, userId),
    ),
  })) as CartItemSelect[];

  const domainNames = pluck('normalizedDomainName', cartItems);

  const domainAvailabilitiesWithPricing = await getDomainListInfo(
    domainNames,
    user,
  );
  const domainPricingByName = indexBy(
    prop('domain'),
    domainAvailabilitiesWithPricing,
  );

  const { registerCartItems, importCartItems, renewCartItems } = groupBy(
    (item) =>
      switchCase(item.type, {
        REGISTER: 'registerCartItems',
        IMPORT: 'importCartItems',
        RENEW: 'renewCartItems',
      }),
    cartItems,
  );

  // Get domain expiration dates for RENEW items, we only need to do this for RENEW items
  // because we need to know the expiration date to determine if the domain can be renewed further
  const renewCartItemsExpirationDatesMap = await getDomainsExpirationDatesMap(
    pluck('normalizedDomainName', renewCartItems ?? []),
  );

  return determineChangesIfAnyToCartItems(
    {
      registerCartItems: registerCartItems ?? [],
      importCartItems: importCartItems ?? [],
      renewCartItems: renewCartItems ?? [],
    },
    domainPricingByName,
    renewCartItemsExpirationDatesMap,
  );
}

/**
 * Returns the changes if any to the cart items
 * @param user - The user
 * @param cartItems - The cart items
 * @returns The changes if any to the cart items
 */
async function determineChangesIfAnyToCartItems(
  cartItemsGroupedByType: CartItemsGroupedByType,
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
  renewCartItemsExpirationDatesMap: Map<NamefiNormalizedDomain, Date>,
) {
  const { registerCartItems, importCartItems, renewCartItems } =
    cartItemsGroupedByType;

  // Only REGISTER items should go through availability checking
  const registerItemsByAvailabilityChange =
    await _getAvailabilityChangesInRegisterCartItems(
      registerCartItems,
      domainPricingByName,
    );

  // IMPORT items have their own specific validation logic
  const importItemsByAvailabilityChange =
    await _getAvailabilityChangesInImportCartItems(
      importCartItems,
      domainPricingByName,
    );

  // RENEW items have their own specific validation logic
  const renewItemsByAvailabilityChange =
    await _getAvailabilityChangesInRenewCartItems(
      renewCartItems,
      domainPricingByName,
      renewCartItemsExpirationDatesMap,
    );

  // Combine all unavailable items
  const noLongerAvailableCartItems = flatten(
    pluck('noLongerAvailable', [
      registerItemsByAvailabilityChange,
      importItemsByAvailabilityChange,
      renewItemsByAvailabilityChange,
    ]),
  );

  // Combine all available items
  const stillAvailableCartItems = flatten(
    pluck('stillAvailable', [
      registerItemsByAvailabilityChange,
      importItemsByAvailabilityChange,
      renewItemsByAvailabilityChange,
    ]),
  );

  const { priceChangedCartItems, durationChangedCartItems } =
    _prepareCartItemsWithChangesReflected(
      stillAvailableCartItems,
      domainPricingByName,
      renewCartItemsExpirationDatesMap,
    );

  const areThereAnyChanges =
    isNotEmpty(noLongerAvailableCartItems) ||
    isNotEmpty(priceChangedCartItems) ||
    isNotEmpty(durationChangedCartItems) ||
    isNotEmpty(renewItemsByAvailabilityChange.expired) ||
    isNotEmpty(renewItemsByAvailabilityChange.maxRegistrationReached);

  return {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems: renewItemsByAvailabilityChange.expired,
    maxRegistrationReachedRenewalItems:
      renewItemsByAvailabilityChange.maxRegistrationReached,
    areThereAnyChanges,
    domainPricingByName,
  };
}

async function _getAvailabilityChangesInRenewCartItems(
  currentRenewCartItems: CartItemSelect[],
  domainAvailabilitiesByName: Record<
    NamefiNormalizedDomain,
    DomainAvailabilityInfo
  >,
  renewCartItemsExpirationDatesMap: Map<NamefiNormalizedDomain, Date>,
) {
  const {
    noLongerAvailable = [],
    stillAvailable = [],
    expired = [],
    maxRegistrationReached = [],
  } = groupBy((item) => {
    const expirationTime = renewCartItemsExpirationDatesMap.get(
      item.normalizedDomainName,
    );
    // Skip expired item
    if (!expirationTime || addDays(expirationTime, 7) <= new Date()) {
      // 7 days grace period TODO(Sami->Sami): use real grace period
      return 'expired';
    }

    // Check if domain can be renewed further
    const domainAvailability =
      domainAvailabilitiesByName[item.normalizedDomainName];

    // Missing duration validation is an error - don't use defaults
    if (!domainAvailability?.durationValidationInYears) {
      logger.error(
        `Missing durationValidationInYears for domain: ${item.normalizedDomainName}`,
      );
      return 'noLongerAvailable'; // Treat as unavailable due to missing data
    }

    const { min, max } = determineDurationLimitsForRenewItems(expirationTime, {
      durationValidationInYears: domainAvailability.durationValidationInYears,
    });

    // Domain can't be renewed if no additional years are possible
    if (max <= 0) {
      return 'maxRegistrationReached';
    }
    if (min <= 0) {
      return 'noLongerAvailable';
    }

    return 'stillAvailable';
  }, currentRenewCartItems);

  return {
    noLongerAvailable,
    stillAvailable,
    expired,
    maxRegistrationReached,
  };
}

async function _getAvailabilityChangesInRegisterCartItems(
  currentRegisterCartItems: CartItemSelect[],
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
) {
  const { noLongerAvailable = [], stillAvailable = [] } = groupBy((item) => {
    const domainPricing = domainPricingByName[item.normalizedDomainName];

    // Only REGISTER items reach this point, so we just check availability
    const isAvailableForCart = domainPricing?.availability;
    return isAvailableForCart ? 'stillAvailable' : 'noLongerAvailable';
  }, currentRegisterCartItems);
  return {
    noLongerAvailable,
    stillAvailable,
  };
}

async function _getAvailabilityChangesInImportCartItems(
  currentImportCartItems: CartItemSelect[],
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
) {
  const { noLongerAvailable = [], stillAvailable = [] } = groupBy((item) => {
    const domainPricing = domainPricingByName[item.normalizedDomainName];

    if (domainPricing && isDomainImportable(domainPricing)) {
      return 'stillAvailable';
    }
    return 'noLongerAvailable';
  }, currentImportCartItems);

  return {
    noLongerAvailable,
    stillAvailable,
  };
}

/**
 * Validates the cart items
 * @param userId - The user id
 * @param cartItemIds - The cart item ids
 * @returns The changes if any to the cart items
 */
async function validateCartItems(userId: string, cartItemIds?: string[]) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    domainPricingByName,
  } = await getChangesIfAnyToCartItems(userId, cartItemIds);

  if (noLongerAvailableCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `One or more domains are not available for purchase: ${pluck('normalizedDomainName', noLongerAvailableCartItems).join(', ')}`,
    });
  }

  if (allExpiredRenewalCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `The following domains have already expired and cannot be renewed: ${pluck('normalizedDomainName', allExpiredRenewalCartItems).join(', ')}`,
    });
  }

  if (maxRegistrationReachedRenewalItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `The following domains are already at maximum registration period and cannot be renewed further: ${pluck('normalizedDomainName', maxRegistrationReachedRenewalItems).join(', ')}`,
    });
  }

  if (priceChangedCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Pricing has changed for these domains: ${priceChangedCartItems.map(({ originalItem }) => originalItem.normalizedDomainName).join(', ')}`,
    });
  }

  if (durationChangedCartItems.length > 0) {
    const invalidDomains = durationChangedCartItems.map(
      ({ originalItem, newItem }) => {
        const domainPricing =
          domainPricingByName[originalItem.normalizedDomainName];

        if (originalItem.type === itemTypeSchema.Values.RENEW) {
          if (!domainPricing?.durationValidationInYears) {
            return `${originalItem.normalizedDomainName} (duration validation data missing)`;
          }
          return `${originalItem.normalizedDomainName} (renewal duration was adjusted from ${originalItem.durationInYears} to ${newItem.durationInYears} years)`;
        }

        // For other item types, show regular duration validation
        if (!domainPricing?.durationValidationInYears) {
          return `${originalItem.normalizedDomainName} (duration validation data missing)`;
        }
        const { min, max } = domainPricing.durationValidationInYears;
        return `${originalItem.normalizedDomainName} (must be between ${min} and ${max} years)`;
      },
    );

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid duration for these domains: ${invalidDomains.join(', ')}`,
    });
  }
}

/**
 * Reflects the changes in the cart items
 * @param userId - The user id
 * @param cartItemIds - The cart item ids
 */
async function reflectChangesInCartItemsIfAnyAndReturnSummary(
  userId: string,
  cartItemIds?: string[],
) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    areThereAnyChanges,
  } = await getChangesIfAnyToCartItems(userId, cartItemIds);
  if (!areThereAnyChanges) {
    return;
  }
  const summary = generateSummaryOfCartItemsChanges({
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    areThereAnyChanges,
  });

  await db.transaction(async (tx) => {
    if (noLongerAvailableCartItems.length > 0) {
      await tx
        .delete(cartItemsTable)
        .where(
          inArray(
            cartItemsTable.id,
            noLongerAvailableCartItems.map(prop('id')),
          ),
        );
    }
    // Remove all expired renewal cart items (regardless of whether they were in the filtered set)
    if (allExpiredRenewalCartItems.length > 0) {
      await tx
        .delete(cartItemsTable)
        .where(
          inArray(
            cartItemsTable.id,
            allExpiredRenewalCartItems.map(prop('id')),
          ),
        );
    }
    // Remove domains at maximum registration period
    if (maxRegistrationReachedRenewalItems.length > 0) {
      await tx
        .delete(cartItemsTable)
        .where(
          inArray(
            cartItemsTable.id,
            maxRegistrationReachedRenewalItems.map(prop('id')),
          ),
        );
    }
    if (priceChangedCartItems.length > 0) {
      await Promise.all(
        priceChangedCartItems.map(async (item) => {
          await tx
            .update(cartItemsTable)
            .set({
              amountInUSDCents: item.newItem.amountInUSDCents,
            })
            .where(eq(cartItemsTable.id, item.newItem.id));
        }),
      );
    }
    if (durationChangedCartItems.length > 0) {
      await Promise.all(
        durationChangedCartItems.map(async (item) => {
          await tx
            .update(cartItemsTable)
            .set({
              durationInYears: item.newItem.durationInYears,
              amountInUSDCents: item.newItem.amountInUSDCents,
            })
            .where(eq(cartItemsTable.id, item.newItem.id));
        }),
      );
    }
  });

  return summary;
}

/**
 * Generates a summary of the cart items changes
 * @param changes - The changes
 * @returns The summary
 */
function generateSummaryOfCartItemsChanges(
  changes: Pick<
    Awaited<ReturnType<typeof getChangesIfAnyToCartItems>>,
    | 'noLongerAvailableCartItems'
    | 'priceChangedCartItems'
    | 'durationChangedCartItems'
    | 'allExpiredRenewalCartItems'
    | 'maxRegistrationReachedRenewalItems'
    | 'areThereAnyChanges'
  >,
) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    areThereAnyChanges,
  } = changes;
  if (!areThereAnyChanges) {
    return [];
  }
  const summary: string[] = [];
  if (noLongerAvailableCartItems.length > 0) {
    const length = noLongerAvailableCartItems.length;
    summary.push(
      `${length === 1 ? 'One domain is' : 'multiple domains are'} no longer available for purchase: ${noLongerAvailableCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
    );
  }
  if (allExpiredRenewalCartItems.length > 0) {
    const length = allExpiredRenewalCartItems.length;
    summary.push(
      `${length === 1 ? 'One domain has' : 'multiple domains have'} expired and been removed from cart: ${allExpiredRenewalCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
    );
  }
  if (maxRegistrationReachedRenewalItems.length > 0) {
    const length = maxRegistrationReachedRenewalItems.length;
    summary.push(
      `${length === 1 ? 'One domain is' : 'multiple domains are'} already at maximum registration period and been removed from cart: ${maxRegistrationReachedRenewalItems.map((item) => item.normalizedDomainName).join(', ')}`,
    );
  }
  if (priceChangedCartItems.length > 0) {
    const groupByPriceChangedCartItems = groupBy(
      (item) =>
        `${item.originalItem.amountInUSDCents}-${item.newItem.amountInUSDCents}`,
      priceChangedCartItems,
    );
    Object.entries(groupByPriceChangedCartItems).forEach(([key, items]) => {
      if (items && items.length > 0) {
        const fromPriceInUsdCents = items[0].originalItem.amountInUSDCents;
        const toPriceInUsdCents = items[0].newItem.amountInUSDCents;
        const fromPriceInUsd = (fromPriceInUsdCents / 100).toFixed(2);
        const toPriceInUsd = (toPriceInUsdCents / 100).toFixed(2);
        summary.push(
          `Pricing has changed from ${fromPriceInUsd} $USD to ${toPriceInUsd} $USD for these domains: ${items.map((item) => item.originalItem.normalizedDomainName).join(', ')}`,
        );
      }
    });
  }
  if (durationChangedCartItems.length > 0) {
    const groupByDurationChangedCartItems = groupBy(
      (item: { originalItem: CartItemSelect; newItem: CartItemSelect }) =>
        `${item.originalItem.durationInYears}-${item.newItem.durationInYears}`,
      durationChangedCartItems,
    );
    Object.entries(groupByDurationChangedCartItems).forEach(([_key, items]) => {
      if (items && items.length > 0) {
        const fromDurationInYears = items[0].originalItem.durationInYears;
        const toDurationInYears = items[0].newItem.durationInYears;
        if (fromDurationInYears != null && toDurationInYears != null) {
          summary.push(
            `Duration has changed from ${fromDurationInYears} years to ${toDurationInYears} years for these domains: ${items.map((item) => item.originalItem.normalizedDomainName).join(', ')}`,
          );
        }
      }
    });
  }
  return summary;
}

function determineDurationLimitsForRenewItems(
  expirationTime: Date,
  domainPricing: { durationValidationInYears: { min: number; max: number } },
) {
  const { max, min } = domainPricing.durationValidationInYears;
  const currentDate = new Date();

  const activeRegistrationYears = Math.round(
    differenceInMonths(expirationTime, currentDate) / 12,
  );

  // Calculate maximum additional years we can add without exceeding the max
  const maxAdditionalYears = Math.max(0, max - activeRegistrationYears);

  // If we can't add any more years, this domain can't be renewed further
  if (maxAdditionalYears <= 0) {
    // Skip processing this item - it will be filtered out as unavailable
  }

  const minimumPossibleRenewalYears = Math.min(min, maxAdditionalYears);

  return {
    min: minimumPossibleRenewalYears,
    max: maxAdditionalYears,
  };
}

async function getDomainsExpirationDatesMap(
  domains: NamefiNormalizedDomain[],
): Promise<Map<NamefiNormalizedDomain, Date>> {
  if (isNotNil(domains) && isNotEmpty(domains)) {
    const domainDetailsResults = await Promise.allSettled(
      domains.map(async (domainName) => {
        const domainDetails = await sldRegistrar.getDomainDetails(
          toPunycodeDomainName(domainName),
        );
        return {
          domain: domainName,
          expirationTime: domainDetails.expirationTime,
        };
      }),
    );

    const rejectedResults = domainDetailsResults.filter(
      (result) => result.status === 'rejected',
    );
    if (rejectedResults.length > 0) {
      logger.fatal(
        { rejectedResults, context: 'getDomainsExpirationDatesMap' },
        'Error fetching domain details for domains',
      );
    }

    return new Map(
      domainDetailsResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => [
          result.value.domain,
          new Date(result.value.expirationTime),
        ]),
    );
  }
  return new Map();
}

function _prepareCartItemsWithChangesReflected(
  stillAvailableCartItems: CartItemSelect[],
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
  renewCartItemsExpirationDatesMap: Map<NamefiNormalizedDomain, Date>,
) {
  const changes: CartItemChange[] = stillAvailableCartItems.map(
    (originalItem) => {
      const { pricingDetails, durationValidationInYears } =
        domainPricingByName[originalItem.normalizedDomainName];

      if (!pricingDetails) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Pricing details unavailable for domain: ${originalItem.normalizedDomainName}`,
        });
      }
      if (!durationValidationInYears) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Missing duration validation data for domain: ${originalItem.normalizedDomainName}`,
        });
      }

      const chargeAmountInUsd = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        originalItem.durationInYears,
        originalItem.type,
      );
      let newAmountInUsdCents = usdToCents(chargeAmountInUsd);

      let { min, max } = durationValidationInYears;

      // For RENEW items, apply special duration validation based on expiration date
      if (originalItem.type === itemTypeSchema.Values.RENEW) {
        const expirationTime = renewCartItemsExpirationDatesMap.get(
          originalItem.normalizedDomainName,
        );
        if (!expirationTime) {
          logger.error(
            `Can't determine expiration time for domain: ${originalItem.normalizedDomainName}, which is RENEW item in stillAvailableCartItems`,
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Can't determine expiration time for domain: ${originalItem.normalizedDomainName}, which is RENEW item in stillAvailableCartItems`,
            cause:
              'Domain, No Longer Available for Renewal ended up in stillAvailable',
          });
        }

        const { min: _min, max: _max } = determineDurationLimitsForRenewItems(
          expirationTime,
          { durationValidationInYears },
        );

        // If we can't add any more years, this domain can't be renewed further
        if (_max <= 0 || _min <= 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Domain ${originalItem.normalizedDomainName} cannot be renewed further`,
            cause:
              'Domain, No Longer Available for Renewal ended up in stillAvailable',
          });
        }
        min = _min;
        max = _max;
      }

      let newDurationInYears = originalItem.durationInYears;
      if (newDurationInYears < min || newDurationInYears > max) {
        newDurationInYears = Math.min(Math.max(newDurationInYears, min), max);

        // Recalculate amount with corrected duration
        const correctedChargeAmountInUsd =
          computeChargesInUsdFromDomainAvailabilityInfo(
            { pricingDetails },
            newDurationInYears,
            originalItem.type,
          );
        newAmountInUsdCents = usdToCents(correctedChargeAmountInUsd);

        return {
          changeType: 'durationChanged',
          originalItem,
          newItem: {
            ...originalItem,
            durationInYears: newDurationInYears,
            amountInUSDCents: newAmountInUsdCents,
          },
        } satisfies CartItemChange;
      }

      if (newAmountInUsdCents !== originalItem.amountInUSDCents) {
        return {
          changeType: 'priceChanged',
          originalItem,
          newItem: {
            ...originalItem,
            amountInUSDCents: newAmountInUsdCents,
            durationInYears: newDurationInYears,
          },
        } satisfies CartItemChange;
      }
      return {
        changeType: 'noChange',
        originalItem,
        newItem: {
          ...originalItem,
          durationInYears: newDurationInYears,
          amountInUSDCents: newAmountInUsdCents,
        },
      };
    },
  );

  return {
    cartItemsWithChangesReflected: changes.map((change) => change.newItem),
    priceChangedCartItems: changes.filter(
      (change) => change.changeType === 'priceChanged',
    ),
    durationChangedCartItems: changes.filter(
      (change) => change.changeType === 'durationChanged',
    ),
  };
}
