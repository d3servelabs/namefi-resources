import { useEffect } from 'react';
import { SearchMode } from '@/components/search/types';

const HASH_TO_SEARCH_MODE: Record<string, SearchMode> = {
  import: SearchMode.IMPORT,
  register: SearchMode.REGISTER,
};

const LEADING_HASH = /^#/;

/**
 * Switches the homepage search bar into Import or Register mode when the URL
 * hash is `#import` / `#register`, then clears the hash without scrolling.
 *
 * Runs on mount AND on every subsequent `hashchange` event so that:
 *   - Direct hits to `/#import` flip the tab at first paint.
 *   - Client-side `<Link href="/#import">`, browser back/forward, and manual
 *     hash edits also flip the tab — not just the initial document load.
 */
export const useSearchModeFromHash = (
  onSearchModeChange: (mode: SearchMode) => void,
) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHash = () => {
      const rawHash = window.location.hash
        .replace(LEADING_HASH, '')
        .toLowerCase();
      const targetMode = HASH_TO_SEARCH_MODE[rawHash];

      if (!targetMode) return;

      onSearchModeChange(targetMode);

      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}`);
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [onSearchModeChange]);
};
