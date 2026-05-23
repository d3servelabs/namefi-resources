import { useEffect } from 'react';
import { SearchMode } from '@/components/search/types';

const HASH_TO_SEARCH_MODE: Record<string, SearchMode> = {
  import: SearchMode.IMPORT,
  register: SearchMode.REGISTER,
};

const LEADING_HASH = /^#/;

/**
 * Reads window.location.hash on mount; if it matches a known search-mode hash
 * (e.g. /#import), switches the homepage search bar into that mode and clears
 * the hash without scrolling. Used to make sitelink/footer/email deep links
 * land directly on the right tab.
 */
export const useSearchModeFromHash = (
  onSearchModeChange: (mode: SearchMode) => void,
) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawHash = window.location.hash
      .replace(LEADING_HASH, '')
      .toLowerCase();
    const targetMode = HASH_TO_SEARCH_MODE[rawHash];

    if (!targetMode) return;

    onSearchModeChange(targetMode);

    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}`);
  }, [onSearchModeChange]);
};
