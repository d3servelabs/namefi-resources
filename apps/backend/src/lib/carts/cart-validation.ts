import {
  type CartItemSelect,
  cartItemsTable,
  db,
  itemTypeSchema,
  usersTable,
} from '@namefi-astra/db';
import {
  computeChargesInUsdFromDomainAvailabilityInfo,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import { type NamefiNormalizedDomain, switchCase } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import {
  flatten,
  groupBy,
  indexBy,
  isNil,
  isNotEmpty,
  isNotNil,
  prop,
} from 'ramda';
import type { DomainAvailabilityInfo } from '#lib/namefi-registry';
import { isDomainImportable } from '../../trpc/types';
import { addDays, differenceInMonths } from 'date-fns';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { pluck } from 'ramda';
import { logger } from '#lib/logger';

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
export async function getChangesIfAnyToCartItems(
  userId: string,
  cartItemIds?: string[],
) {
  const { getDomainListInfo, sldRegistrar } = await import(
    '#lib/namefi-registry'
  );
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
  const renewCartItemsExpirationDatesMap = await _getDomainsExpirationDatesMap(
    pluck('normalizedDomainName', renewCartItems ?? []),
  );

  return _determineChangesIfAnyToCartItems(
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
function _determineChangesIfAnyToCartItems(
  cartItemsGroupedByType: CartItemsGroupedByType,
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
  renewCartItemsExpirationDatesMap: Map<NamefiNormalizedDomain, Date>,
) {
  const { registerCartItems, importCartItems, renewCartItems } =
    cartItemsGroupedByType;

  // Only REGISTER items should go through availability checking
  const registerItemsByAvailabilityChange =
    _getAvailabilityChangesInRegisterCartItems(
      registerCartItems,
      domainPricingByName,
    );

  // IMPORT items have their own specific validation logic
  const importItemsByAvailabilityChange =
    _getAvailabilityChangesInImportCartItems(
      importCartItems,
      domainPricingByName,
    );

  // RENEW items have their own specific validation logic
  const renewItemsByAvailabilityChange =
    _getAvailabilityChangesInRenewCartItems(
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
    domainPricingByNormalizedDomainName: domainPricingByName,
  };
}

function _getAvailabilityChangesInRenewCartItems(
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

    const { min, max } = _determineDurationLimitsForRenewItems(expirationTime, {
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

function _getAvailabilityChangesInRegisterCartItems(
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

function _getAvailabilityChangesInImportCartItems(
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
export async function validateCartItems(
  userId: string,
  cartItemIds?: string[],
) {
  const {
    noLongerAvailableCartItems,
    priceChangedCartItems,
    durationChangedCartItems,
    allExpiredRenewalCartItems,
    maxRegistrationReachedRenewalItems,
    domainPricingByNormalizedDomainName,
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
          domainPricingByNormalizedDomainName[
            originalItem.normalizedDomainName
          ];

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
export async function reflectChangesInCartItemsIfAnyAndReturnSummary(
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
  const summary = _generateSummaryOfCartItemsChanges({
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
function _generateSummaryOfCartItemsChanges(
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

function _determineDurationLimitsForRenewItems(
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

  const minimumPossibleRenewalYears = Math.min(min, maxAdditionalYears);

  return {
    min: minimumPossibleRenewalYears,
    max: maxAdditionalYears,
  };
}

async function _getDomainsExpirationDatesMap(
  domains: NamefiNormalizedDomain[],
): Promise<Map<NamefiNormalizedDomain, Date>> {
  const { sldRegistrar } = await import('#lib/namefi-registry');
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

        const { min: _min, max: _max } = _determineDurationLimitsForRenewItems(
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

// Export private functions for testing
export const __INTERNAL__ = {
  _determineDurationLimitsForRenewItems,
  _generateSummaryOfCartItemsChanges,
  _prepareCartItemsWithChangesReflected,
  _getAvailabilityChangesInRegisterCartItems,
  _getAvailabilityChangesInImportCartItems,
  _getAvailabilityChangesInRenewCartItems,
  _determineChangesIfAnyToCartItems,
  _getDomainsExpirationDatesMap,
};
export type __INTERNAL__ = typeof __INTERNAL__ & {
  CartItemChange: CartItemChange;
  CartItemGroupedByType: CartItemsGroupedByType;
};
