import { useEffect } from 'react';

/**
 * Scrolls to `#<id>` after React has hydrated the page.
 *
 * The browser's native hash-scroll runs on initial document load — *before*
 * client-rendered sections (e.g. the homepage newsletter block inside the
 * landing client tree) exist in the DOM — so a fresh hit to `/#newsletter`
 * or a 308 redirect ending in `/#newsletter` typically lands at the top of
 * the page instead of the anchor. Two `requestAnimationFrame` hops let
 * React commit + the first paint settle before we look for the element.
 *
 * Clears the hash after a successful scroll so refreshes don't re-trigger
 * and so other in-page hash logic (e.g. `useSearchModeFromHash`) isn't
 * seeing stale state on later renders.
 */
export const useScrollToHash = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const id = window.location.hash.slice(1);
    if (!id) return;

    let outerFrame = 0;
    const innerFrame = requestAnimationFrame(() => {
      outerFrame = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;

        el.scrollIntoView({ block: 'start' });

        const { pathname, search } = window.location;
        window.history.replaceState(null, '', `${pathname}${search}`);
      });
    });

    return () => {
      cancelAnimationFrame(innerFrame);
      if (outerFrame !== 0) cancelAnimationFrame(outerFrame);
    };
  }, []);
};
