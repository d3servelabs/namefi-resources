'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The entire c15t consent runtime (ConsentManagerProvider + zustand + banner/
// dialog + ~64KB stylesheet) is ~40-50KB of JS that nothing needs at first
// paint. It is mounted here as a post-paint island via requestIdleCallback so it
// never competes with the article's LCP. The banner still appears for first-time
// visitors shortly after the page settles; GA's first-load decision is already
// made server-side in ga-bootstrap.tsx, so deferring the React runtime does not
// change initial analytics behavior.
const ConsentIslandInner = dynamic(
  () => import('./consent-provider').then((m) => m.ConsentIslandInner),
  { ssr: false },
);

export function ConsentIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void): number => window.setTimeout(cb, 200);
    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : (id: number): void => window.clearTimeout(id);

    const id = schedule(() => setReady(true)) as number;
    return () => cancel(id);
  }, []);

  return ready ? <ConsentIslandInner /> : null;
}
