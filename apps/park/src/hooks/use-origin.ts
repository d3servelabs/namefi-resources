'use client';

import { useMemo } from 'react';

export interface OriginRuntime {
  isFirstPartyOrigin: boolean;
  hostname?: string;
}

const FIRST_PARTY_SUFFIXES = [
  'namefi.io',
  'namefi.app',
  'namefi-astra.vercel.app',
  'localhost',
  '127.0.0.1',
];

export function useOrigin(): OriginRuntime {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { isFirstPartyOrigin: true };
    }

    const hostname = window.location.hostname.toLowerCase();
    const isFirstPartyOrigin = FIRST_PARTY_SUFFIXES.some((suffix) => {
      if (hostname === suffix) return true;
      return hostname.endsWith(`.${suffix}`);
    });

    return { isFirstPartyOrigin, hostname };
  }, []);
}
