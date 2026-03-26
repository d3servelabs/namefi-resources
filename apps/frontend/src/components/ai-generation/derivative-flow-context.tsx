'use client';

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

export type DerivativeSource = Pick<
  Generation,
  'id' | 'domain' | 'type' | 'url' | 'thumbnailUrl'
> &
  Partial<Generation>;

interface DerivativeFlowValue {
  mode: DerivativeFlowMode;
  selectedLogo: DerivativeSource | null;
  openPoster: (logo: DerivativeSource) => void;
  openAnimation: (logo: DerivativeSource) => void;
  closeFlow: () => void;
}

const DerivativeFlowContext = createContext<DerivativeFlowValue | null>(null);

export function DerivativeFlowProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DerivativeFlowMode>(null);
  const [selectedLogo, setSelectedLogo] = useState<DerivativeSource | null>(
    null,
  );

  const openPoster = useCallback((logo: DerivativeSource) => {
    setSelectedLogo(logo);
    setMode('poster');
  }, []);

  const openAnimation = useCallback((logo: DerivativeSource) => {
    setSelectedLogo(logo);
    setMode('animation');
  }, []);

  const closeFlow = useCallback(() => {
    setSelectedLogo(null);
    setMode(null);
  }, []);

  const value = useMemo<DerivativeFlowValue>(
    () => ({
      mode,
      selectedLogo,
      openPoster,
      openAnimation,
      closeFlow,
    }),
    [mode, selectedLogo, openPoster, openAnimation, closeFlow],
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
