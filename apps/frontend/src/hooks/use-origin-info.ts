'use client';

import {
  getDomainForPoweredByNamefiThirdPartyOrigin,
  isNamefiFirstPartyOrigin,
} from '@/lib/origin';
import { useEffect, useState } from 'react';

// Discriminated union types for loading states
type LoadingState<T> =
  | { isLoaded: false; data?: T }
  | { isLoaded: true; data: T };

interface ThirdPartyOriginInfo {
  hostname: string | null;
  origin: string | null;
}

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
    const isFirstParty = isNamefiFirstPartyOrigin(origin);
    setState({ isLoaded: true, data: isFirstParty });
  }, []);

  return state;
}

/**
 * Hook to get the domain for a powered-by-NameFI third-party origin
 * Safely handles server-side rendering where window is not available
 * Returns null when there is no third-party origin
 */
export function useGetDomainForPoweredByNamefiThirdPartyOrigin(): LoadingState<ThirdPartyOriginInfo> {
  const [state, setState] = useState<LoadingState<ThirdPartyOriginInfo>>({
    isLoaded: false,
  });

  useEffect(() => {
    const origin = window.location.origin;
    const hostname = getDomainForPoweredByNamefiThirdPartyOrigin(origin);
    setState({
      isLoaded: true,
      data: {
        hostname,
        origin,
      },
    });
  }, []);

  return state;
}
