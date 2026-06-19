import { useEffect, useState } from 'react';

export type Direction = 'ltr' | 'rtl';

/**
 * Reads the document's text direction from `<html dir>` and tracks changes to
 * it. Returns 'ltr' on the server and before mount (the SSR-safe default), then
 * the real value after hydration. Useful for components whose physical layout
 * can't be expressed with CSS logical properties alone (e.g. a Sheet's slide
 * `side`), so they can mirror in RTL.
 */
export function useDirection(): Direction {
  const [direction, setDirection] = useState<Direction>('ltr');

  useEffect(() => {
    const read = () => {
      setDirection(document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });
    return () => observer.disconnect();
  }, []);

  return direction;
}
