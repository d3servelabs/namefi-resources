'use client';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Generation } from './shared/types';

export type DerivativeFlowMode = 'poster' | 'animation' | null;
export type RequestedDerivativeMode = Exclude<DerivativeFlowMode, null>;

export type DerivativeSource = Pick<
  Generation,
  'id' | 'domain' | 'type' | 'url' | 'thumbnailUrl'
> &
  Partial<Generation>;

interface DerivativeFlowValue {
  mode: DerivativeFlowMode;
  selectedLogo: DerivativeSource | null;
  requestedMode: RequestedDerivativeMode | null;
  requestedDomain: NamefiNormalizedDomain | null;
  startPoster: (domain?: NamefiNormalizedDomain | null) => void;
  startAnimation: (domain?: NamefiNormalizedDomain | null) => void;
  openPoster: (logo: DerivativeSource) => void;
  openAnimation: (logo: DerivativeSource) => void;
  requestPosterLogo: (domain?: NamefiNormalizedDomain | null) => void;
  requestAnimationLogo: (domain?: NamefiNormalizedDomain | null) => void;
  closeFlow: () => void;
}

const DerivativeFlowContext = createContext<DerivativeFlowValue | null>(null);

export function DerivativeFlowProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DerivativeFlowMode>(null);
  const [selectedLogo, setSelectedLogo] = useState<DerivativeSource | null>(
    null,
  );
  const [requestedMode, setRequestedMode] =
    useState<RequestedDerivativeMode | null>(null);
  const [requestedDomain, setRequestedDomain] =
    useState<NamefiNormalizedDomain | null>(null);

  const clearRequestedDerivative = useCallback(() => {
    setRequestedMode(null);
    setRequestedDomain(null);
  }, []);

  const startPoster = useCallback((domain?: NamefiNormalizedDomain | null) => {
    setSelectedLogo(null);
    setMode('poster');
    setRequestedMode(null);
    setRequestedDomain(domain ?? null);
  }, []);

  const startAnimation = useCallback(
    (domain?: NamefiNormalizedDomain | null) => {
      setSelectedLogo(null);
      setMode('animation');
      setRequestedMode(null);
      setRequestedDomain(domain ?? null);
    },
    [],
  );

  const openPoster = useCallback(
    (logo: DerivativeSource) => {
      setSelectedLogo(logo);
      setMode('poster');
      clearRequestedDerivative();
    },
    [clearRequestedDerivative],
  );

  const openAnimation = useCallback(
    (logo: DerivativeSource) => {
      setSelectedLogo(logo);
      setMode('animation');
      clearRequestedDerivative();
    },
    [clearRequestedDerivative],
  );

  const requestPosterLogo = useCallback(
    (domain?: NamefiNormalizedDomain | null) => {
      setSelectedLogo(null);
      setMode(null);
      setRequestedMode('poster');
      setRequestedDomain(domain ?? null);
    },
    [],
  );

  const requestAnimationLogo = useCallback(
    (domain?: NamefiNormalizedDomain | null) => {
      setSelectedLogo(null);
      setMode(null);
      setRequestedMode('animation');
      setRequestedDomain(domain ?? null);
    },
    [],
  );

  const closeFlow = useCallback(() => {
    setSelectedLogo(null);
    setMode(null);
    clearRequestedDerivative();
  }, [clearRequestedDerivative]);

  const value = useMemo<DerivativeFlowValue>(
    () => ({
      mode,
      selectedLogo,
      requestedMode,
      requestedDomain,
      startPoster,
      startAnimation,
      openPoster,
      openAnimation,
      requestPosterLogo,
      requestAnimationLogo,
      closeFlow,
    }),
    [
      mode,
      selectedLogo,
      requestedMode,
      requestedDomain,
      startPoster,
      startAnimation,
      openPoster,
      openAnimation,
      requestPosterLogo,
      requestAnimationLogo,
      closeFlow,
    ],
  );

  return (
    <DerivativeFlowContext.Provider value={value}>
      {children}
    </DerivativeFlowContext.Provider>
  );
}

export function useDerivativeFlow() {
  const ctx = useContext(DerivativeFlowContext);
  if (!ctx) {
    throw new Error(
      'useDerivativeFlow must be used within DerivativeFlowProvider',
    );
  }
  return ctx;
}
