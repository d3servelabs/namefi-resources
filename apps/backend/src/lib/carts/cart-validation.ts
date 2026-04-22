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
import {
  isDomainAssumedBeyondLateRenewalPeriod,
  type NamefiNormalizedDomain,
  parseDomainName,
  switchCase,
} from '@namefi-astra/utils';
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
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { pluck } from 'ramda';
import { logger } from '#lib/logger';
import { determineDurationLimitsForRenewItems } from '#lib/domains/duration-constraints/index';
import { get3ldExpirationDateForDomainListFromIndex } from '#temporal/activities/domain/renew.activities';

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
 * Analyzes cart items to determine if there are any changes in availability, pricing, or duration.
 * This function validates all cart items against current domain availability and pricing information.
 *
 * @param userId - The unique identifier of the user whose cart items to analyze
 * @param cartItemIds - Optional array of specific cart item IDs to analyze. If not provided, all user's cart items are analyzed
 * @returns Promise resolving to an object containing categorized changes and availability information
 * @throws {TRPCError} When user is not found (NOT_FOUND)
 */
export async function getChangesIfAnyToCartItems(
  userId: string,
  cartItemIds?: string[],
) {
  const { getDomainListInfo } = await import('#lib/namefi-registry');
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
 * Determines changes in cart items by comparing current state with domain availability and pricing data.
 * This is an internal function that processes grouped cart items and categorizes them based on their availability status.
 *
 * @param cartItemsGroupedByType - Cart items grouped by their type (REGISTER, IMPORT, RENEW)
 * @param domainPricingByName - Domain availability and pricing information indexed by normalized domain name
 * @param renewCartItemsExpirationDatesMap - Map of domain names to their expiration dates for renewal validation
 * @returns Object containing categorized cart items and change information
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

/**
 * Analyzes renewal cart items to determine their availability status and categorizes them accordingly.
 * This function checks for expired domains, domains at maximum registration period, and validates renewal eligibility.
 *
 * @param currentRenewCartItems - Array of renewal cart items to analyze
 * @param domainAvailabilitiesByName - Domain availability information indexed by normalized domain name
 * @param renewCartItemsExpirationDatesMap - Map of domain names to their expiration dates
 * @returns Object containing categorized renewal cart items (available, unavailable, expired, max registration reached)
 */
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
    // Skip expired item beyond grace period
    if (
      !expirationTime ||
      isDomainAssumedBeyondLateRenewalPeriod(expirationTime)
    ) {
      // 30 days grace period TODO(Sami->Sami): use real grace period
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

    const { minimumPossibleRenewalYears: min, maxAdditionalYears: max } =
      determineDurationLimitsForRenewItems(expirationTime, {
        minYears: domainAvailability.durationValidationInYears.min,
        maxYears: domainAvailability.durationValidationInYears.max,
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

/**
 * Analyzes register cart items to determine their availability status.
 * This function checks if domains are still available for registration.
 *
 * @param currentRegisterCartItems - Array of registration cart items to analyze
 * @param domainPricingByName - Domain availability and pricing information indexed by normalized domain name
 * @returns Object containing categorized registration cart items (available vs unavailable)
 */
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

/**
 * Analyzes import cart items to determine their availability status.
 * This function checks if domains are still importable based on their current state.
 *
 * @param currentImportCartItems - Array of import cart items to analyze
 * @param domainPricingByName - Domain availability and pricing information indexed by normalized domain name
 * @returns Object containing categorized import cart items (available vs unavailable)
 */
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
 * Validates cart items and throws errors if any items are invalid or unavailable.
 * This function performs comprehensive validation including availability, pricing, duration, and expiration checks.
 *
 * @param userId - The unique identifier of the user whose cart items to validate
 * @param cartItemIds - Optional array of specific cart item IDs to validate. If not provided, all user's cart items are validated
 * @returns Promise that resolves if all items are valid
 * @throws {TRPCError} When domains are not available for purchase (BAD_REQUEST)
 * @throws {TRPCError} When domains have expired and cannot be renewed (BAD_REQUEST)
 * @throws {TRPCError} When domains are at maximum registration period (BAD_REQUEST)
 * @throws {TRPCError} When pricing has changed for domains (BAD_REQUEST)
 * @throws {TRPCError} When duration is invalid for domains (BAD_REQUEST)
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

        if (originalItem.type === itemTypeSchema.enum.RENEW) {
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
 * Reflects changes in cart items by updating or removing them from the database and returns a summary of changes.
 * This function automatically handles price updates, duration adjustments, and removal of invalid items.
 *
 * @param userId - The unique identifier of the user whose cart items to update
 * @param cartItemIds - Optional array of specific cart item IDs to process. If not provided, all user's cart items are processed
 * @returns Promise resolving to a summary array of changes made, or undefined if no changes were needed
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
 * Generates a human-readable summary of cart item changes.
 * This function creates descriptive messages for various types of changes that occurred to cart items.
 *
 * @param changes - Object containing categorized cart item changes
 * @returns Array of summary strings describing the changes, or empty array if no changes occurred
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

/**
 * Retrieves expiration dates for multiple domains from the registrar.
 * This function fetches domain details and extracts expiration dates, handling failures gracefully.
 *
 * @param domains - Array of normalized domain names to fetch expiration dates for
 * @returns Promise resolving to a Map of domain names to their expiration dates
 */
async function _getDomainsExpirationDatesMap(
  domains: NamefiNormalizedDomain[],
): Promise<Map<NamefiNormalizedDomain, Date>> {
  if (isNotNil(domains) && isNotEmpty(domains)) {
    const { sldRegistrar } = await import('#lib/namefi-registry');

    const {
      eppDomains = [],
      subDomains = [],
      invalidDomains = [],
    } = groupBy((domainName) => {
      const parsedDomain = parseDomainName(domainName);
      if (!parsedDomain.valid) {
        return 'invalidDomains';
      }
      return parsedDomain.registryType === 'traditional'
        ? 'eppDomains'
        : 'subDomains';
    }, domains);

    const eppDomainsDetailsPromise = Promise.allSettled(
      eppDomains.map(async (domainName) => {
        const domainDetails = await sldRegistrar.getDomainDetails(
          toPunycodeDomainName(domainName),
        );
        return {
          domain: domainName,
          expirationTime: domainDetails.expirationTime,
        };
      }),
    );

    const [subDomainsDetailsResults, eppDomainsDetailsResults] =
      await Promise.all([
        get3ldExpirationDateForDomainListFromIndex(subDomains),
        eppDomainsDetailsPromise,
      ]);

    const rejectedResults = eppDomainsDetailsResults.filter(
      (result) => result.status === 'rejected',
    );
    if (rejectedResults.length > 0 || invalidDomains.length > 0) {
      logger.error(
        {
          rejectedResults,
          invalidDomains,
          context: 'getDomainsExpirationDatesMap',
        },
        'Error fetching domain details for domains',
      );
    }

    return new Map([
      ...eppDomainsDetailsResults
        .filter((result) => result.status === 'fulfilled')
        .map(
          (result) =>
            [result.value.domain, new Date(result.value.expirationTime)] as [
              NamefiNormalizedDomain,
              Date,
            ],
        ),
      ...subDomainsDetailsResults.map(
        ({ normalizedDomainName, expirationDate }) =>
          [normalizedDomainName, new Date(expirationDate)] as [
            NamefiNormalizedDomain,
            Date,
          ],
      ),
    ]);
  }
  return new Map();
}

/**
 * Prepares cart items with updated pricing and duration information, identifying what changes need to be made.
 * This function recalculates prices and validates durations for all still-available cart items.
 *
 * @param stillAvailableCartItems - Array of cart items that are still available for purchase
 * @param domainPricingByName - Domain availability and pricing information indexed by normalized domain name
 * @param renewCartItemsExpirationDatesMap - Map of domain names to their expiration dates for renewal validation
 * @returns Object containing updated cart items and categorized changes (price changes, duration changes)
 * @throws {TRPCError} When pricing details are unavailable for a domain (BAD_REQUEST)
 * @throws {TRPCError} When duration validation data is missing (BAD_REQUEST)
 * @throws {TRPCError} When a renewal item cannot be renewed further (INTERNAL_SERVER_ERROR)
 */
function _prepareCartItemsWithChangesReflected(
  stillAvailableCartItems: CartItemSelect[],
  domainPricingByName: Record<NamefiNormalizedDomain, DomainAvailabilityInfo>,
  renewCartItemsExpirationDatesMap: Map<NamefiNormalizedDomain, Date>,
) {
  const changes: CartItemChange[] = stillAvailableCartItems.map(
    (originalItem) => {
      const domainAvailability =
        domainPricingByName[originalItem.normalizedDomainName];
      const { pricingDetails, durationValidationInYears } = domainAvailability;

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
      if (originalItem.type === itemTypeSchema.enum.RENEW) {
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

        const { minimumPossibleRenewalYears: _min, maxAdditionalYears: _max } =
          determineDurationLimitsForRenewItems(expirationTime, {
            minYears: durationValidationInYears.min,
            maxYears: durationValidationInYears.max,
          });

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
