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

type PosterSource = Pick<Generation, 'id' | 'domain' | 'url'> &
  Partial<Generation>;

interface PosterFlowValue {
  isPosterVisible: boolean;
  selectedLogo?: PosterSource | null;
  openPoster: (logo: PosterSource) => void;
  closePoster: () => void;
}

const PosterFlowContext = createContext<PosterFlowValue | null>(null);

export function PosterFlowProvider({ children }: { children: ReactNode }) {
  const [selectedLogo, setSelectedLogo] = useState<PosterSource | null>(null);

  const openPoster = useCallback((logo: PosterSource) => {
    setSelectedLogo(logo);
  }, []);

  const closePoster = useCallback(() => {
    setSelectedLogo(null);
  }, []);

  const value = useMemo<PosterFlowValue>(
    () => ({
      isPosterVisible: selectedLogo !== null,
      selectedLogo,
      openPoster,
      closePoster,
    }),
    [selectedLogo, openPoster, closePoster],
  );

  return (
    <PosterFlowContext.Provider value={value}>
      {children}
    </PosterFlowContext.Provider>
  );
}

export function usePosterFlow() {
  const ctx = useContext(PosterFlowContext);
  if (!ctx) {
    throw new Error('usePosterFlow must be used within PosterFlowProvider');
  }
  return ctx;
}

export type { PosterSource };
