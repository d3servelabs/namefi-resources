import { useEffect } from 'react';

const OBSERVER_TIMEOUT_MS = 5000;

/**
 * Scrolls to `#<id>` after React has hydrated the page.
 *
 * Two phases:
 *
 *   1. Deferred RAF attempt — two `requestAnimationFrame` hops let React commit
 *      and the first paint settle before we look up the element. This handles
 *      the common case where the browser's native hash-scroll ran on initial
 *      document load (before client-rendered sections existed).
 *
 *   2. MutationObserver fallback — if the element still isn't in the DOM after
 *      the RAF chain, watch `document.body` for additions and retry on each
 *      mutation. This covers races with sibling hooks that conditionally hide
 *      sections (e.g. `useSearchFromQuery` populating search results, which
 *      temporarily hides `MarketingSections` containing `#newsletter`).
 *
 * The observer self-cancels on success and is force-cleaned after a 5s
 * timeout so we never leak it. Hash is cleared via `replaceState` on a
 * successful scroll so refreshes don't re-trigger and sibling hooks
 * (e.g. `useSearchModeFromHash`) aren't seeing stale state on later renders.
 */
export const useScrollToHash = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const id = window.location.hash.slice(1);
    if (!id) return;

    let innerFrame = 0;
    let outerFrame = 0;
    let observer: MutationObserver | null = null;
    let timeoutId = 0;
    let done = false;

    const cleanup = () => {
      if (innerFrame !== 0) cancelAnimationFrame(innerFrame);
      if (outerFrame !== 0) cancelAnimationFrame(outerFrame);
      if (observer) observer.disconnect();
      if (timeoutId !== 0) window.clearTimeout(timeoutId);
    };

    const tryScroll = (): boolean => {
      if (done) return true;
      const el = document.getElementById(id);
      if (!el) return false;

      done = true;
      el.scrollIntoView({ block: 'start' });

      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}`);
      return true;
    };

    innerFrame = requestAnimationFrame(() => {
      outerFrame = requestAnimationFrame(() => {
        if (tryScroll()) return;

        observer = new MutationObserver(() => {
          if (tryScroll()) cleanup();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        timeoutId = window.setTimeout(cleanup, OBSERVER_TIMEOUT_MS);
      });
    });

    return cleanup;
  }, []);
};
