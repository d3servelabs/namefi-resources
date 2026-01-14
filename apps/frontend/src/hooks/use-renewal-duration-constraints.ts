import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { differenceInYears } from 'date-fns';
import { isDomainAssumedBeyondLateRenewalPeriod } from '@namefi-astra/utils/domain-dates';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

export type RenewalErrorCode =
  | 'DOMAIN_DETAILS_LOAD_FAILED'
  | 'AVAILABILITY_INFO_LOAD_FAILED'
  | 'EXPIRATION_TIME_UNAVAILABLE'
  | 'AVAILABILITY_INFO_UNAVAILABLE'
  | 'DOMAIN_EXPIRED'
  | 'MAX_REGISTRATION_REACHED'
  | 'DURATION_VALIDATION_MISSING';

export type RenewalDurationConstraints =
  | {
      status: 'loading';
    }
  | {
      status: 'success';
      minYears: number;
      maxYears: number;
    }
  | {
      status: 'error';
      errorCode: RenewalErrorCode;
      error: string;
    };

/**
 * Hook to calculate renewal duration constraints for a domain
 * Uses getDomainDetails to get current expiration date and isDomainAvailable to get duration constraints
 */
export function useRenewalDurationConstraints(
  domainName: NamefiNormalizedDomain,
): RenewalDurationConstraints {
  const trpc = useTRPC();

  // Query domain details to get current expiration
  const {
    data: domainDetails,
    isLoading: isDomainDetailsLoading,
    error: domainDetailsError,
  } = useQuery({
    ...trpc.domainConfig.getDomainDetails.queryOptions({ domainName }),
    enabled: true,
  });

  // Query domain availability info to get duration constraints
  const {
    data: domainAvailabilityInfo,
    isLoading: isDomainAvailabilityLoading,
    error: domainAvailabilityError,
  } = useQuery({
    ...trpc.search.isDomainAvailable.queryOptions({ domain: domainName }),
    enabled: true,
  });

  return useMemo((): RenewalDurationConstraints => {
    // Handle loading state
    if (isDomainDetailsLoading || isDomainAvailabilityLoading) {
      return { status: 'loading' };
    }

    // Handle errors
    if (domainDetailsError) {
      return {
        status: 'error',
        errorCode: 'DOMAIN_DETAILS_LOAD_FAILED',
        error: domainDetailsError.message || 'Failed to load domain details',
      };
    }

    if (domainAvailabilityError) {
      return {
        status: 'error',
        errorCode: 'AVAILABILITY_INFO_LOAD_FAILED',
        error:
          domainAvailabilityError.message ||
          'Failed to load domain availability info',
      };
    }

    if (!domainDetails?.expirationTime) {
      return {
        status: 'error',
        errorCode: 'EXPIRATION_TIME_UNAVAILABLE',
        error: 'Domain expiration time not available',
      };
    }

    if (!domainAvailabilityInfo) {
      return {
        status: 'error',
        errorCode: 'AVAILABILITY_INFO_UNAVAILABLE',
        error: 'Domain availability info not available',
      };
    }

    // Check if domain is already expired
    const currentDate = new Date();
    const expirationDate = new Date(domainDetails.expirationTime);

    if (isDomainAssumedBeyondLateRenewalPeriod(expirationDate)) {
      return {
        status: 'error',
        errorCode: 'DOMAIN_EXPIRED',
        error:
          'Domain is beyond the 30-day renewal grace period and cannot be renewed through this interface',
      };
    }

    // Calculate remaining years until expiration
    // This matches the backend logic in extend-registration.workflow.ts which uses differenceInYears directly
    // and counts only FULL years (ignoring partial years), making renewals more user-friendly
    // For example, if domain expires in 9 years and 1 month, this returns 9 (not 10)
    const activeRegistrationDuration =
      differenceInYears(expirationDate, currentDate) + 1;

    // Check for duration validation data
    if (
      !domainAvailabilityInfo?.durationValidationInYears?.max ||
      !domainAvailabilityInfo?.durationValidationInYears?.min
    ) {
      return {
        status: 'error',
        errorCode: 'DURATION_VALIDATION_MISSING',
        error: 'Duration validation data is missing for this domain',
      };
    }

    // Use domain availability constraints
    const maxAllowedYears =
      domainAvailabilityInfo.durationValidationInYears.max;
    const minAllowedYears =
      domainAvailabilityInfo.durationValidationInYears.min;

    // Calculate how many more years we can add without exceeding the max
    const maxAdditionalYears = Math.max(
      0,
      maxAllowedYears - activeRegistrationDuration,
    );

    // If we can't add any more years, show error
    if (maxAdditionalYears < 1) {
      return {
        status: 'error',
        errorCode: 'MAX_REGISTRATION_REACHED',
        error: `Domain already at maximum ${maxAllowedYears} year registration`,
      };
    }

    return {
      status: 'success',
      minYears: minAllowedYears,
      maxYears: Math.min(maxAdditionalYears, maxAllowedYears),
    };
  }, [
    isDomainDetailsLoading,
    isDomainAvailabilityLoading,
    domainDetails,
    domainDetailsError,
    domainAvailabilityInfo,
    domainAvailabilityError,
  ]);
}
