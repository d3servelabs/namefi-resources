'use client';

import {
  useGetDomainForPoweredByNamefiThirdPartyOrigin,
  useIsNamefiFirstPartyOrigin,
} from '@/hooks/use-origin-info';
import { getOriginConfig } from '@/lib/origin';
import type { OriginInfo } from '@/lib/origin/types';
import { type ReactNode, createContext, useContext, useEffect } from 'react';

// Create a discriminated union based on loading state
type OriginContextType =
  | { isLoading: true; originInfo?: undefined }
  | { isLoading: false; originInfo: OriginInfo };

const OriginContext = createContext<OriginContextType | undefined>(undefined);

export function useOrigin() {
  const context = useContext(OriginContext);
  if (context === undefined) {
    throw new Error('useOrigin must be used within an OriginProvider');
  }
  return context;
}

// Helper hook that only returns origin info when it's available
export function useOriginInfo() {
  const context = useOrigin();
  if (context.isLoading) {
    throw new Error(
      'Origin info is not available yet. Check isLoading before accessing.',
    );
  }
  return context.originInfo;
}

type OriginProviderProps = {
  children: ReactNode;
};

export function OriginProvider({ children }: OriginProviderProps) {
  const firstPartyState = useIsNamefiFirstPartyOrigin();
  const thirdPartyState = useGetDomainForPoweredByNamefiThirdPartyOrigin();

  // Only consider loaded when both hooks have completed loading
  const isLoading = !(firstPartyState.isLoaded && thirdPartyState.isLoaded);

  // Create the value object using the discriminated union pattern
  const value: OriginContextType = isLoading
    ? { isLoading: true }
    : {
        isLoading: false,
        originInfo: {
          isFirstPartyOrigin: firstPartyState.data,
          thirdPartyHostname: thirdPartyState.data?.hostname,
          config: getOriginConfig(thirdPartyState.data?.origin),
        },
      };

  // Set data-origin attribute on body tag when third-party origin is detected
  useEffect(() => {
    if (!isLoading && thirdPartyState.data?.hostname) {
      document.body.setAttribute('data-origin', thirdPartyState.data.hostname);
    } else if (!isLoading) {
      // Remove the attribute if no third-party origin
      document.body.removeAttribute('data-origin');
    }
  }, [isLoading, thirdPartyState.data?.hostname]);

  return (
    <OriginContext.Provider value={value}>{children}</OriginContext.Provider>
  );
}
