import { getDomainLevels } from '../get-domain-levels';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { differenceInMonths } from 'date-fns';
import { getPoweredByNamefi3PDomains } from '../namefi-registry';

export type DomainDurationConstraints = {
  minYears: number;
  maxYears: number;
};

export async function getDomainDurationConstraints(
  domainName: NamefiNormalizedDomain,
): Promise<DomainDurationConstraints> {
  const { levels, parentDomain } = getDomainLevels(domainName);

  if (levels.length === 2) {
    switch (parentDomain) {
      case 'co':
      case 'com.co':
      case 'net.co':
      case 'nom.co':
        return { minYears: 1, maxYears: 5 };
      case 'be':
        return { minYears: 1, maxYears: 1 };
      case 'de':
        return { minYears: 1, maxYears: 2 };
      case 'at':
      case 'co.at':
      case 'or.at':
        return { minYears: 1, maxYears: 1 };
      case 'lt':
        return { minYears: 1, maxYears: 1 };
      case 'nl':
        return { minYears: 1, maxYears: 1 };
      case 'cx':
        return { minYears: 1, maxYears: 5 };
      case 'ai':
        return { minYears: 2, maxYears: 10 };
      case 'lv':
      case 'com.lv':
      case 'org.lv':
      case 'net.lv':
      case 'asn.lv':
      case 'conf.lv':
        return { minYears: 1, maxYears: 1 };
      case 'dk':
        return { minYears: 1, maxYears: 3 };
      case 'it':
        return { minYears: 1, maxYears: 1 };
      case 'co.za': // TODO: check if this is correct
        return { minYears: 1, maxYears: 1 };
      case 'ch':
      case 'li':
        return { minYears: 1, maxYears: 1 };
    }

    return { minYears: 1, maxYears: 10 };
  }
  if (levels.length === 3) {
    const poweredByNamefi3pDomains = await getPoweredByNamefi3PDomains();
    if (
      !poweredByNamefi3pDomains.includes(parentDomain as NamefiNormalizedDomain)
    ) {
      throw new Error(
        `Domain ${domainName} is not a valid powered by namefi 3P domain`,
      );
    }
    return { minYears: 3, maxYears: 5 };
  }

  throw new Error(`Domain ${domainName} is not a valid domain`);
}

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
