import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/utils/trpc';
import { differenceInYears } from 'date-fns';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type RenewalDurationConstraints = {
  minYears: number;
  maxYears: number;
  isLoading: boolean;
  error: string | null;
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
      return { minYears: 1, maxYears: 1, isLoading: true, error: null };
    }

    // Handle errors
    if (domainDetailsError) {
      return {
        minYears: 1,
        maxYears: 1,
        isLoading: false,
        error: domainDetailsError.message || 'Failed to load domain details',
      };
    }

    if (domainAvailabilityError) {
      return {
        minYears: 1,
        maxYears: 1,
        isLoading: false,
        error:
          domainAvailabilityError.message ||
          'Failed to load domain availability info',
      };
    }

    if (!domainDetails?.expirationTime) {
      return {
        minYears: 1,
        maxYears: 1,
        isLoading: false,
        error: 'Domain expiration time not available',
      };
    }

    if (!domainAvailabilityInfo) {
      return {
        minYears: 1,
        maxYears: 1,
        isLoading: false,
        error: 'Domain availability info not available',
      };
    }

    // Calculate remaining years until expiration
    // This matches the backend logic in extend-registration.workflow.ts which uses differenceInYears directly
    // and counts only FULL years (ignoring partial years), making renewals more user-friendly
    // For example, if domain expires in 9 years and 1 month, this returns 9 (not 10)
    const currentDate = new Date();
    const expirationDate = new Date(domainDetails.expirationTime);
    const activeRegistrationDuration =
      differenceInYears(expirationDate, currentDate) + 1;

    // Use domain availability constraints or defaults
    const maxAllowedYears =
      domainAvailabilityInfo?.durationValidationInYears?.max ?? 10;
    const minAllowedYears =
      domainAvailabilityInfo?.durationValidationInYears?.min ?? 1;

    // Calculate how many more years we can add without exceeding the max
    const maxAdditionalYears = Math.max(
      0,
      maxAllowedYears - activeRegistrationDuration,
    );

    // If we can't add any more years, show error
    if (maxAdditionalYears < 1) {
      return {
        minYears: 1,
        maxYears: 1,
        isLoading: false,
        error: `Domain already at maximum ${maxAllowedYears} year registration`,
      };
    }

    return {
      minYears: minAllowedYears,
      maxYears: Math.min(maxAdditionalYears, maxAllowedYears),
      isLoading: false,
      error: null,
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
