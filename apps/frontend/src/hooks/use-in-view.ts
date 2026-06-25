import { useEffect, useState, type RefObject } from 'react';

type UseInViewOptions = {
  /** IntersectionObserver `rootMargin` (e.g. `'-72px 0px 0px 0px'`). */
  margin?: string;
  /** Once true, stay true after the first intersection. */
  once?: boolean;
};

/**
 * Lightweight `IntersectionObserver`-backed replacement for framer-motion's
 * `useInView`, with the same call shape (`useInView(ref, { margin, once })`).
 *
 * Kept dependency-free so the homepage shell does not pull framer-motion onto
 * the hydration critical path just to observe element visibility.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { margin, once = false }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    let raf = 0;

    const start = () => {
      const element = ref.current;
      // The element may not be mounted yet — e.g. it lives inside a lazily
      // loaded section (the homepage newsletter inside the dynamic marketing
      // block). `ref` is stable, so this effect won't re-run when it attaches;
      // retry on the next frame until it does, instead of silently never
      // observing it.
      if (!element) {
        raf = requestAnimationFrame(start);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer?.disconnect();
          } else if (!once) {
            setInView(false);
          }
        },
        { rootMargin: margin },
      );
      observer.observe(element);
    };

    start();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [ref, margin, once]);

  return inView;
}
