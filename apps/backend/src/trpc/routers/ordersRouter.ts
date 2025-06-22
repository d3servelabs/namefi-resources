import {
  type CartItemSelect,
  type PaymentSelect,
  cartItemsTable,
  db,
  isNfscPayment,
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
import { createOrderInputSchema } from '../types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  isNormalizedDomainNameAllowedForOriginHostname,
  privyClient,
} from '../utils';

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

      // Validate all domains are available for purchase
      const domains = cartItems.map(
        (item) => item.normalizedDomainName as NamefiNormalizedDomain,
      );
      const domainAvailabilities = await getDomainListInfo(domains, ctx.user);
      const allDomainsAvailable = domainAvailabilities.every(
        (availability) => availability.availability,
      );

      // We understand that there is a small chance of race condition here,
      // but we are ok with it. The ultimate guarantee is that when domain is being
      // minted onchain the chain (NFT contract) will reject the transaction
      // if the domain is not available
      if (!allDomainsAvailable) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `One or more domains are not available for purchase: ${domainAvailabilities
            .filter((availability) => !availability.availability)
            .map((availability) => availability.domain)}`,
        });
      }

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
            cartItems.map((item) => ({
              orderId: order.id,
              normalizedDomainName: item.normalizedDomainName,
              amountInUSDCents: item.amountInUSDCents,
              durationInYears: item.durationInYears,
              metadata: item.metadata,
            })),
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

  const domainPricingByNormalizedDomainName = indexBy(
    (item) => item.domain,
    domainAvailabilitiesWithPricing,
  );

  const cartItemsGroupedByAvailability = groupBy((item) => {
    const domainPricing =
      domainPricingByNormalizedDomainName[
        item.normalizedDomainName as NamefiNormalizedDomain
      ];
    return domainPricing?.availability ? 'available' : 'unavailable';
  }, cartItems);

  const noLongerAvailableCartItems =
    cartItemsGroupedByAvailability.unavailable ?? [];
  const stillAvailableCartItems =
    cartItemsGroupedByAvailability.available ?? [];

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

      if (!domainPricing?.pricingDetails?.registrationPrice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Pricing details unavailable for domain: ${originalItem.normalizedDomainName}`,
        });
      }

      const chargeAmountInUsd = computeChargesInUsdOrThrow(
        domainPricing.pricingDetails.registrationPrice,
        originalItem.durationInYears,
      );
      let newAmountInUsdCents = usdToCents(chargeAmountInUsd);

      const { min, max } = domainPricing?.durationValidationInYears ?? {
        min: 1,
        max: 1,
      };
      let newDurationInYears = originalItem.durationInYears;
      if (newDurationInYears < min || newDurationInYears > max) {
        newDurationInYears = Math.min(Math.max(newDurationInYears, min), max);

        // Recalculate amount with corrected duration
        const correctedChargeAmountInUsd = computeChargesInUsdOrThrow(
          domainPricing.pricingDetails.registrationPrice,
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
    cartItemsWithChangesReflected,
    areThereAnyChanges:
      noLongerAvailableCartItems.length > 0 ||
      priceChangedCartItems.length > 0 ||
      durationValidationChangedCartItems.length > 0,
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
    domainPricingByNormalizedDomainName,
  } = await getChangesIfAnyToCartItems(userId, cartItemIds);
  if (noLongerAvailableCartItems.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `One or more domains are not available for purchase: ${noLongerAvailableCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
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
      const { min, max } = domainPricing?.durationValidationInYears ?? {
        min: 1,
        max: 10,
      };
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
    areThereAnyChanges,
  } = await getChangesIfAnyToCartItems(userId, cartItemIds);
  if (!areThereAnyChanges) {
    return;
  }
  const summary = generateSummaryOfCartItemsChanges({
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationValidationChangedCartItems,
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
    | 'areThereAnyChanges'
  >,
) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationValidationChangedCartItems,
    areThereAnyChanges,
  } = changes;
  if (!areThereAnyChanges) {
    return [];
  }
  const summary: string[] = [];
  if (noLongerAvailableCartItems.length > 0) {
    const length = noLongerAvailableCartItems.length;
    summary.push(
      `${length === 1 ? 'One domain is no longer' : 'multiple domains are'} no longer available for purchase: ${noLongerAvailableCartItems.map((item) => item.normalizedDomainName).join(', ')}`,
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
