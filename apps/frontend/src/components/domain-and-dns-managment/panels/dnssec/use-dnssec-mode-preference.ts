'use client';

import { useCallback, useEffect, useState } from 'react';

export type DnssecPanelMode = 'simple' | 'advanced';

const STORAGE_KEY_PREFIX = 'nfi.dnssec.mode.';
const VALID_MODES: ReadonlyArray<DnssecPanelMode> = ['simple', 'advanced'];

function buildStorageKey(domainName: string): string {
  return `${STORAGE_KEY_PREFIX}${domainName}`;
}

function readStoredMode(storageKey: string): DnssecPanelMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw && (VALID_MODES as ReadonlyArray<string>).includes(raw)) {
      return raw as DnssecPanelMode;
    }
  } catch {
    // localStorage may be unavailable (privacy mode, sandboxed iframe, etc.).
    // Falling back to the default is fine — the toggle still works in-memory.
  }
  return null;
}

/**
 * Per-domain Simple/Advanced mode for the custom-DNSSEC panel. Default is
 * Simple. Choice persists in `localStorage` keyed on the punycode domain
 * name so a power-user setup on one domain doesn't follow them to another.
 *
 * SSR-safe: the initial render always returns `'simple'`. The hook
 * synchronizes with localStorage in a `useEffect` after mount, which avoids
 * hydration mismatches and never throws when localStorage is unavailable.
 */
export function useDnssecModePreference(
  domainName: string,
): [DnssecPanelMode, (mode: DnssecPanelMode) => void] {
  const [mode, setModeState] = useState<DnssecPanelMode>('simple');

  useEffect(() => {
    // Always apply the stored value (or fall back to the default) when the
    // domain changes. Without this reset, switching to a new domain with no
    // stored preference would leak the previous domain's mode.
    const stored = readStoredMode(buildStorageKey(domainName));
    setModeState(stored ?? 'simple');
  }, [domainName]);

  const setMode = useCallback(
    (next: DnssecPanelMode) => {
      setModeState(next);
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(buildStorageKey(domainName), next);
      } catch {
        // Storage write failure is non-fatal; mode still persists in React state
        // for the rest of the session.
      }
    },
    [domainName],
  );

  return [mode, setMode];
}
