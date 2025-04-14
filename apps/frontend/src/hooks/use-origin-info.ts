'use client';

import { config } from '@/lib/env';
import { getHostname } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Discriminated union types for loading states
type LoadingState<T> =
  | { isLoaded: false; data?: T }
  | { isLoaded: true; data: T };

/**
 * Hook to check if the current origin is a NameFI first-party origin
 * Safely handles server-side rendering where window is not available
 */
export function useIsNamefiFirstPartyOrigin(): LoadingState<boolean> {
  const [state, setState] = useState<LoadingState<boolean>>({
    isLoaded: false,
  });

  useEffect(() => {
    const origin = window.location.origin;
    const hostname = getHostname(origin);
    const isFirstParty = config.NAMEFI_FIRST_PARTY_ORIGINS.includes(hostname);
    setState({ isLoaded: true, data: isFirstParty });
  }, []);

  return state;
}

/**
 * Hook to get the domain for a powered-by-NameFI third-party origin
 * Safely handles server-side rendering where window is not available
 * Returns null when there is no third-party origin
 */
export function useGetDomainForPoweredByNamefiThirdPartyOrigin(): LoadingState<
  string | null
> {
  const [state, setState] = useState<LoadingState<string | null>>({
    isLoaded: false,
  });

  useEffect(() => {
    const origin = window.location.origin;
    const hostname = getHostname(origin);

    let domain: string | null = null;
    if (config.POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS.includes(hostname)) {
      domain = hostname;
    } else {
      domain = config.ADDITIONAL_ORIGIN_TO_HOSTNAME_MAP[hostname] || null;
    }

    setState({ isLoaded: true, data: domain });
  }, []);

  return state;
}
