import { differenceInMonths } from 'date-fns';
import type { DomainDurationConstraints } from './types';

/**
 * Determines the minimum and maximum duration limits for renewal items based on current registration period.
 * This function calculates how many additional years a domain can be renewed considering the maximum registration limit.
 *
 * @param expirationTime - The current expiration date of the domain
 * @param domainPricing - Object containing duration validation rules (min/max years)
 * @returns Object with minimum and maximum additional years that can be added to the domain
 */
export function determineDurationLimitsForRenewItems(
  expirationTime: Date,
  domainDurationConstraints: DomainDurationConstraints,
) {
  const { maxYears, minYears } = domainDurationConstraints;
  const currentDate = new Date();

  const activeRegistrationYears = Math.ceil(
    (differenceInMonths(expirationTime, currentDate) + 1) / 12, // +1 because we want to include the current month and date-fns calculates the difference in full months
  );

  // Calculate maximum additional years we can add without exceeding the max
  const maxAdditionalYears = Math.max(0, maxYears - activeRegistrationYears);

  const minimumPossibleRenewalYears = Math.min(1, maxAdditionalYears);

  return {
    minimumPossibleRenewalYears,
    maxAdditionalYears,
    activeRegistrationYears,
  };
}
