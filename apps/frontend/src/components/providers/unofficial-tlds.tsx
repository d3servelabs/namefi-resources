'use client';

import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { type FC, useEffect, useMemo } from 'react';

declare global {
  var namefi_tlds: string[];
}

const FALLBACK_UNOFFICIAL_TLDS: string[] = [
  'namefi',
  'test',
  'nfi',
  'nmfi',
  'uniswap',
  'aave',
  'maker',
];
const PERSISTENCE_KEY = 'unofficial-tlds-config';
const PERSISTENCE_EXPIRY = 60 * 60 * 1000;

interface PersistedData {
  unofficialTlds: string[];
  timestamp: number;
}

function isPersistedData(value: unknown): value is PersistedData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.timestamp !== 'number' ||
    !Number.isFinite(candidate.timestamp)
  ) {
    return false;
  }
  if (!Array.isArray(candidate.unofficialTlds)) {
    return false;
  }
  return candidate.unofficialTlds.every((tld) => typeof tld === 'string');
}

function getPersistedUnofficialTlds(): string[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(PERSISTENCE_KEY);
  if (!stored) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    window.sessionStorage.removeItem(PERSISTENCE_KEY);
    return null;
  }

  if (!isPersistedData(parsed)) {
    window.sessionStorage.removeItem(PERSISTENCE_KEY);
    return null;
  }

  if (Date.now() - parsed.timestamp > PERSISTENCE_EXPIRY) {
    window.sessionStorage.removeItem(PERSISTENCE_KEY);
    return null;
  }

  return parsed.unofficialTlds;
}

function persistUnofficialTlds(unofficialTlds: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(
      PERSISTENCE_KEY,
      JSON.stringify({
        unofficialTlds,
        timestamp: Date.now(),
      } satisfies PersistedData),
    );
  } catch {
    return;
  }
}

export const UnofficialTldsInjector: FC = () => {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.config.unofficialTlds.queryOptions(undefined, {
      staleTime: PERSISTENCE_EXPIRY,
      retry: 2,
    }),
  );

  const persistedUnofficialTlds = useMemo(
    () => getPersistedUnofficialTlds(),
    [],
  );

  const unofficialTlds = useMemo<string[]>(
    () =>
      query.data && query.data.length > 0
        ? query.data
        : (persistedUnofficialTlds ?? FALLBACK_UNOFFICIAL_TLDS),
    [persistedUnofficialTlds, query.data],
  );

  useEffect(() => {
    if (query.data && typeof window !== 'undefined') {
      persistUnofficialTlds(query.data);
    }
  }, [query.data]);

  useEffect(() => {
    globalThis.namefi_tlds = unofficialTlds;
  }, [unofficialTlds]);

  return false;
};
