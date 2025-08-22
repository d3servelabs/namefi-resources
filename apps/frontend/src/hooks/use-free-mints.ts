'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { useAuth } from '@/hooks/use-auth';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

type GetUserClaimsResponse = AppRouterOutput['freeClaims']['getUserClaims'];

export type FreeMint = {
  id: string;
  type: 'single' | 'campaign';
  groupOrCampaignKey: string;
  domain: NamefiNormalizedDomain;
  reason: string | null;
  claimingStatus: 'IDLE' | 'CLAIMING' | 'CLAIMED';
  isExpired: boolean;
  expirationDate: Date | null;
  claimedAt: Date | null;
  claimedDomainName?: NamefiNormalizedDomain | null;
  createdAt: Date;
};

export interface UseFreeMintsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export function useFreeMints(options: UseFreeMintsOptions = {}) {
  const {
    enabled: customEnabled = true,
    staleTime = 60_000,
    refetchOnWindowFocus = false,
  } = options;

  const { isAuthenticated } = useAuth();
  const trpc = useTRPC();

  const claimsQuery = useQuery({
    ...trpc.freeClaims.getUserClaims.queryOptions(),
    enabled: isAuthenticated && customEnabled,
    staleTime,
    refetchOnWindowFocus,
  });

  // Flatten and format free mints data for display
  const { freeMints, availableCount } = useMemo(() => {
    const data: GetUserClaimsResponse | undefined = claimsQuery.data;
    if (!data) return { freeMints: [], availableCount: 0 };

    const flattened: FreeMint[] = [];
    let availableCountVar = 0;

    for (const item of data) {
      if (!item) continue;
      if (item.type === 'singleExactDomain') {
        const c = item.claim;
        if (c.exactDomainName) {
          const row: FreeMint = {
            id: c.id,
            type: 'single',
            groupOrCampaignKey: c.groupOrCampaignKey,
            domain: c.exactDomainName,
            reason: c.reason,
            claimingStatus: c.claimingStatus,
            isExpired: c.isExpired,
            expirationDate: c.expirationDate,
            claimedAt: c.claimedAt ?? null,
            claimedDomainName: c.claimedDomainName ?? null,
            createdAt: c.createdAt,
          };
          flattened.push(row);

          // Count if available
          if (!row.isExpired && row.claimingStatus === 'IDLE') {
            availableCountVar += 1;
          }
        }
      } else if (item.type === 'campaignParentDomain') {
        for (const c of item.claims) {
          const row: FreeMint = {
            id: c.id,
            type: 'campaign',
            groupOrCampaignKey: item.groupOrCampaignKey,
            domain: item.parentDomain,
            reason: c.reason ?? item.reason,
            claimingStatus: c.claimingStatus,
            isExpired: c.isExpired,
            expirationDate: c.expirationDate,
            claimedAt: c.claimedAt ?? null,
            claimedDomainName: c.claimedDomainName ?? null,
            createdAt: c.createdAt,
          };
          flattened.push(row);

          // Count if available
          if (!row.isExpired && row.claimingStatus === 'IDLE') {
            availableCountVar += 1;
          }
        }
      }
    }
    return { freeMints: flattened, availableCount: availableCountVar };
  }, [claimsQuery.data]);

  return {
    // Raw query data and state
    data: claimsQuery.data,
    isLoading: claimsQuery.isLoading,
    isFetching: claimsQuery.isFetching,
    isError: claimsQuery.isError,
    error: claimsQuery.error,
    refetch: claimsQuery.refetch,

    // Computed data for different use cases
    availableCount,
    freeMints,

    // Helper booleans
    hasAvailableClaims: availableCount > 0,
    hasAnyFreeMints: freeMints.length > 0,
  };
}
