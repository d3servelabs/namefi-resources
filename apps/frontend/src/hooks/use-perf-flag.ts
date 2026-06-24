'use client';

import { PERF_FLAG_URL_PARAM, setPerfFlagInStorage } from '@/lib/perf/flag';
import { useEffect } from 'react';

/**
 * Reads the `?perf=1` / `?perf=0` URL param once on mount, persists it to
 * localStorage (so the teammate flag survives navigation), then strips the
 * param from the URL. Reading `window.location` directly — rather than
 * `useSearchParams` — keeps this off Next's Suspense/CSR-bailout path so it can
 * sit in the always-mounted app shell without forcing dynamic rendering.
 */
export function usePerfFlagSync(): void {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const param = params.get(PERF_FLAG_URL_PARAM);
      if (param !== '1' && param !== '0') return;

      setPerfFlagInStorage(param === '1');
      if (param === '1') {
        // biome-ignore lint/suspicious/noConsole: confirms the teammate perf flag is on.
        console.debug(
          '%c[perf]%c console logging enabled (?perf=1). Disable with ?perf=0.',
          'color:#1cd17d;font-weight:600',
          'color:inherit',
        );
      }

      params.delete(PERF_FLAG_URL_PARAM);
      const qs = params.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      // Preserve Next.js App Router's internal history state — passing `null`
      // overwrites the router's navigation metadata and can desync back/forward.
      window.history.replaceState(window.history.state, '', url);
    } catch {
      // Ignore — perf flag sync must never break navigation.
    }
  }, []);
}
