'use client';

import type { OriginRuntime } from '@/lib/origin/types';
import { type PropsWithChildren, createContext, useContext } from 'react';

const OriginContext = createContext<OriginRuntime | undefined>(undefined);

export function useOrigin() {
  const context = useContext(OriginContext);
  if (context === undefined) {
    throw new Error('useOrigin must be used within an OriginProvider');
  }
  return context;
}

type OriginProviderProps = PropsWithChildren<{
  originInfo: OriginRuntime;
}>;

export function OriginProvider({ originInfo, children }: OriginProviderProps) {
  return (
    <OriginContext.Provider value={originInfo}>
      {children}
    </OriginContext.Provider>
  );
}
