'use client';

import { useInView } from 'motion/react';
import { type RefObject, useCallback, useEffect, useState } from 'react';

const SCROLL_INTENT_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
type UseInViewOptions = NonNullable<Parameters<typeof useInView>[1]>;

export function useDeferredSectionLoad(
  sectionRef: RefObject<Element | null>,
  {
    hash,
    scrollThreshold = 16,
    visibleMargin = '-25% 0px -25% 0px',
  }: {
    hash: string;
    scrollThreshold?: number;
    visibleMargin?: UseInViewOptions['margin'];
  },
) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const isMeaningfullyInView = useInView(sectionRef, {
    once: true,
    margin: visibleMargin,
  });

  const loadSection = useCallback(() => {
    setShouldLoad(true);
  }, []);

  useEffect(() => {
    if (isMeaningfullyInView) {
      loadSection();
    }
  }, [isMeaningfullyInView, loadSection]);

  useEffect(() => {
    if (shouldLoad) return;

    if (window.location.hash === hash || window.scrollY > scrollThreshold) {
      loadSection();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_INTENT_KEYS.has(event.key)) {
        loadSection();
      }
    };

    const handleScroll = () => {
      if (window.scrollY > scrollThreshold) {
        loadSection();
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === hash) {
        loadSection();
      }
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [hash, loadSection, scrollThreshold, shouldLoad]);

  return shouldLoad;
}
