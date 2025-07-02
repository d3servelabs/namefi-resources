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
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import {
  type NamefiNormalizedDomain,
  checksumWalletAddressSchema,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { groupBy, indexBy, isNil, prop } from 'ramda';
import Stripe from 'stripe';
import { zeroAddress } from 'viem';
import { z } from 'zod';
import { getDomainListInfo } from '#lib/namefi-registry';
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
import { getDomainPricingForOperation } from '../types';
import type { Json } from 'drizzle-zod';
import { differenceInYears } from 'date-fns';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

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
      (cartItemIds?.length ?? 0) > 0
        ? inArray(cartItemsTable.id, cartItemIds ?? [])
        : undefined,
      eq(cartItemsTable.userId, userId),
    ),
  })) as CartItemSelect[];
  const domains = cartItems.map(
    (item) => item.normalizedDomainName as NamefiNormalizedDomain,
  );
  const domainAvailabilitiesWithPricing = await getDomainListInfo(
    domains,
    user,
  );

  const renewCartItems = cartItems.filter(
    (item) => item.type === itemTypeSchema.Values.RENEW,
  );
  const domainDetailsMap = new Map<NamefiNormalizedDomain, Date>();

  if (renewCartItems.length > 0) {
    const [error, domainDetailsResults] = await resolve(
      Promise.allSettled(
        renewCartItems.map(async (item: CartItemSelect) => {
          const domainDetails = await sldRegistrar.getDomainDetails(
            toPunycodeDomainName(
              item.normalizedDomainName as NamefiNormalizedDomain,
            ),
          );
          return {
            domain: item.normalizedDomainName as NamefiNormalizedDomain,
            expirationTime: domainDetails.expirationTime,
          };
        }),
      ),
    );

    if (error) {
      console.error(
        'Error fetching domain details for renewal validation:',
        error,
      );
    } else {
      domainDetailsResults.forEach(
        (
          result: PromiseSettledResult<{
            domain: NamefiNormalizedDomain;
            expirationTime: Date;
          }>,
          index: number,
        ) => {
          if (result.status === 'fulfilled') {
            domainDetailsMap.set(
              result.value.domain,
              result.value.expirationTime,
            );
          } else {
            console.error(
              `Failed to fetch domain details for ${renewCartItems[index].normalizedDomainName}:`,
              result.reason,
            );
          }
        },
      );
    }
  }

  const currentDate = new Date();
  const allExpiredRenewalCartItems = renewCartItems.filter(
    (item: CartItemSelect) => {
      const expirationTime = domainDetailsMap.get(
        item.normalizedDomainName as NamefiNormalizedDomain,
      );
      return !expirationTime || expirationTime <= currentDate;
    },
  );

  const domainPricingByNormalizedDomainName = indexBy(
    (item) => item.domain,
    domainAvailabilitiesWithPricing,
  );

  // Only REGISTER items should go through availability checking
  // IMPORT and RENEW items have their own specific validation logic
  const cartItemsForAvailabilityCheck = cartItems.filter((item) => {
    return item.type === itemTypeSchema.Values.REGISTER;
  });

  const cartItemsGroupedByAvailability = groupBy((item) => {
    const domainPricing =
      domainPricingByNormalizedDomainName[
        item.normalizedDomainName as NamefiNormalizedDomain
      ];

    // Only REGISTER items reach this point, so we just check availability
    const isAvailableForCart = domainPricing?.availability;
    return isAvailableForCart ? 'available' : 'unavailable';
  }, cartItemsForAvailabilityCheck);

  // Check IMPORT items separately
  const importCartItems = cartItems.filter(
    (item) => item.type === itemTypeSchema.Values.IMPORT,
  );
  const unavailableImportItems = importCartItems.filter((item) => {
    const domainPricing =
      domainPricingByNormalizedDomainName[
        item.normalizedDomainName as NamefiNormalizedDomain
      ];
    return !domainPricing || !isDomainImportable(domainPricing);
  });
  const availableImportItems = importCartItems.filter((item) => {
    const domainPricing =
      domainPricingByNormalizedDomainName[
        item.normalizedDomainName as NamefiNormalizedDomain
      ];
    return domainPricing && isDomainImportable(domainPricing);
  });

  // RENEW items that are not expired and can be renewed further are considered available for processing
  const currentRenewCartItems = cartItems.filter(
    (item) => item.type === itemTypeSchema.Values.RENEW,
  );

  const maxRegistrationReachedRenewalItems: CartItemSelect[] = [];
  const unavailableRenewItems: CartItemSelect[] = [];

  const availableRenewItems = currentRenewCartItems.filter((item) => {
    // Skip expired items
    if (allExpiredRenewalCartItems.includes(item)) {
      return false;
    }

    // Check if domain can be renewed further
    const domainPricing =
      domainPricingByNormalizedDomainName[
        item.normalizedDomainName as NamefiNormalizedDomain
      ];
    const expirationTime = domainDetailsMap.get(
      item.normalizedDomainName as NamefiNormalizedDomain,
    );

    if (expirationTime && domainPricing) {
      // Missing duration validation is an error - don't use defaults
      if (!domainPricing.durationValidationInYears?.max) {
        console.error(
          `Missing durationValidationInYears.max for domain: ${item.normalizedDomainName}`,
        );
        unavailableRenewItems.push(item);
        return false; // Treat as unavailable due to missing data
      }

      const currentDate = new Date();
      const activeRegistrationYears =
        differenceInYears(expirationTime, currentDate) + 1;
      const maxAllowedYears = domainPricing.durationValidationInYears.max;
      const maxAdditionalYears = Math.max(
        0,
        maxAllowedYears - activeRegistrationYears,
      );

      // Domain can't be renewed if no additional years are possible
      if (maxAdditionalYears <= 0) {
        maxRegistrationReachedRenewalItems.push(item);
        return false;
      }

      return true;
    }

    console.error(
      `Cannot determine renewal availability for domain: ${item.normalizedDomainName} - missing expiration time or pricing data`,
    );
    unavailableRenewItems.push(item);
    return false;
  });

  const noLongerAvailableCartItems = [
    ...(cartItemsGroupedByAvailability.unavailable ?? []),
    ...unavailableImportItems,
    ...unavailableRenewItems,
  ];

  const stillAvailableCartItems = [
    ...(cartItemsGroupedByAvailability.available ?? []),
    ...availableImportItems,
    ...availableRenewItems,
  ];

  const priceChangedCartItems: {
    originalItem: CartItemSelect;
    newItem: CartItemSelect;
  }[] = [];
  const durationValidationChangedCartItems: {
    originalItem: CartItemSelect;
    newItem: CartItemSelect;
  }[] = [];

  const cartItemsWithChangesReflected = stillAvailableCartItems.map(
    (originalItem) => {
      const domainPricing =
        domainPricingByNormalizedDomainName[
          originalItem.normalizedDomainName as NamefiNormalizedDomain
        ];

      const pricingDetails = getDomainPricingForOperation(
        domainPricing,
        originalItem.type,
      );

      if (!pricingDetails) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Pricing details unavailable for domain: ${originalItem.normalizedDomainName}`,
        });
      }

      const chargeAmountInUsd = computeChargesInUsdOrThrow(
        pricingDetails,
        originalItem.durationInYears,
      );
      let newAmountInUsdCents = usdToCents(chargeAmountInUsd);

      if (!domainPricing?.durationValidationInYears) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Missing duration validation data for domain: ${originalItem.normalizedDomainName}`,
        });
      }

      let { min, max } = domainPricing.durationValidationInYears;

      // For RENEW items, apply special duration validation based on expiration date
      if (originalItem.type === itemTypeSchema.Values.RENEW) {
        const expirationTime = domainDetailsMap.get(
          originalItem.normalizedDomainName as NamefiNormalizedDomain,
        );

        console.log('expirationTime', expirationTime?.toISOString());

        if (expirationTime) {
          const currentDate = new Date();
          const activeRegistrationYears =
            differenceInYears(expirationTime, currentDate) + 1;

          // Calculate maximum additional years we can add without exceeding the max
          const maxAdditionalYears = Math.max(0, max - activeRegistrationYears);

          // If we can't add any more years, this domain can't be renewed further
          if (maxAdditionalYears <= 0) {
            // Skip processing this item - it will be filtered out as unavailable
            return originalItem;
          }

          // For renewals, minimum is 1 year and maximum is the additional years we can add
          min = Math.max(1, Math.min(min, maxAdditionalYears));
          max = Math.min(max, maxAdditionalYears);
        }
      }

      let newDurationInYears = originalItem.durationInYears;
      if (newDurationInYears < min || newDurationInYears > max) {
        newDurationInYears = Math.min(Math.max(newDurationInYears, min), max);

        // Recalculate amount with corrected duration
        const correctedChargeAmountInUsd = computeChargesInUsdOrThrow(
          pricingDetails,
          newDurationInYears,
        );
        newAmountInUsdCents = usdToCents(correctedChargeAmountInUsd);

        durationValidationChangedCartItems.push({
          originalItem,
          newItem: {
            ...originalItem,
            durationInYears: newDurationInYears,
            amountInUSDCents: newAmountInUsdCents,
          },
        });
      }

      if (newAmountInUsdCents !== originalItem.amountInUSDCents) {
        priceChangedCartItems.push({
          originalItem,
          newItem: {
            ...originalItem,
            amountInUSDCents: newAmountInUsdCents,
            durationInYears: newDurationInYears,
          },
        });
      }

      return {
        ...originalItem,
        amountInUSDCents: newAmountInUsdCents,
        durationInYears: newDurationInYears,
      };
    },
  );

  return {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationValidationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    cartItemsWithChangesReflected,
    areThereAnyChanges:
      noLongerAvailableCartItems.length > 0 ||
      priceChangedCartItems.length > 0 ||
      durationValidationChangedCartItems.length > 0 ||
      allExpiredRenewalCartItems.length > 0 ||
      maxRegistrationReachedRenewalItems.length > 0,
    domainPricingByNormalizedDomainName,
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
    durationValidationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    domainPricingByNormalizedDomainName,
  } = await getChangesIfAnyToCartItems(userId, cartItemIds);

  if (noLongerAvailableCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `One or more domains are not available for purchase: ${noLongerAvailableCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
    });
  }

  if (allExpiredRenewalCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `The following domains have already expired and cannot be renewed: ${allExpiredRenewalCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
    });
  }

  if (maxRegistrationReachedRenewalItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `The following domains are already at maximum registration period and cannot be renewed further: ${maxRegistrationReachedRenewalItems.map((item) => item.normalizedDomainName).join(', ')}`,
    });
  }

  if (priceChangedCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Pricing has changed for these domains: ${priceChangedCartItems.map((item) => item.originalItem.normalizedDomainName).join(', ')}`,
    });
  }

  if (durationValidationChangedCartItems.length > 0) {
    const invalidDomains = durationValidationChangedCartItems.map((item) => {
      const domainPricing =
        domainPricingByNormalizedDomainName[
          item.originalItem.normalizedDomainName as NamefiNormalizedDomain
        ];

      if (item.originalItem.type === itemTypeSchema.Values.RENEW) {
        if (!domainPricing?.durationValidationInYears) {
          return `${item.originalItem.normalizedDomainName} (duration validation data missing)`;
        }
        return `${item.originalItem.normalizedDomainName} (renewal duration was adjusted from ${item.originalItem.durationInYears} to ${item.newItem.durationInYears} years)`;
      }

      // For other item types, show regular duration validation
      if (!domainPricing?.durationValidationInYears) {
        return `${item.originalItem.normalizedDomainName} (duration validation data missing)`;
      }
      const { min, max } = domainPricing.durationValidationInYears;
      return `${item.originalItem.normalizedDomainName} (must be between ${min} and ${max} years)`;
    });

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
    durationValidationChangedCartItems,
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
    durationValidationChangedCartItems,
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
    if (durationValidationChangedCartItems.length > 0) {
      await Promise.all(
        durationValidationChangedCartItems.map(async (item) => {
          await tx
            .update(cartItemsTable)
            .set({
              durationInYears: item.newItem.durationInYears,
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
    | 'durationValidationChangedCartItems'
    | 'allExpiredRenewalCartItems'
    | 'maxRegistrationReachedRenewalItems'
    | 'areThereAnyChanges'
  >,
) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationValidationChangedCartItems,
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
  if (durationValidationChangedCartItems.length > 0) {
    const groupByDurationValidationChangedCartItems = groupBy(
      (item: { originalItem: CartItemSelect; newItem: CartItemSelect }) =>
        `${item.originalItem.durationInYears}-${item.newItem.durationInYears}`,
      durationValidationChangedCartItems,
    );
    Object.entries(groupByDurationValidationChangedCartItems).forEach(
      ([_key, items]) => {
        if (items && items.length > 0) {
          const fromDurationInYears = items[0].originalItem.durationInYears;
          const toDurationInYears = items[0].newItem.durationInYears;
          if (fromDurationInYears != null && toDurationInYears != null) {
            summary.push(
              `Duration has changed from ${fromDurationInYears} years to ${toDurationInYears} years for these domains: ${items.map((item) => item.originalItem.normalizedDomainName).join(', ')}`,
            );
          }
        }
      },
    );
  }
  return summary;
}
