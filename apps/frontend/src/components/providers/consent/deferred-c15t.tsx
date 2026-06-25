'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The real @c15t SDK lives only in this lazily-imported chunk, so it never
// enters the homepage hydration critical path.
const DeferredC15tRuntime = dynamic(
  () =>
    import('./deferred-c15t-runtime').then((m) => ({
      default: m.DeferredC15tRuntime,
    })),
  { ssr: false },
);

/**
 * Mounts the real c15t consent stack on idle (after first paint / hydration),
 * not eagerly. Rendered inside AuthProvider + NamefiConsentProvider so the
 * runtime can read auth state and feed consent back into the lightweight
 * context the app reads. Until it mounts, consumers see "loading / measurement
 * off" — analytics stay correctly gated, just resolved a beat later (#4892).
 */
export function DeferredC15t() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const start = () => setShouldLoad(true);
    const w = window as typeof window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(start, { timeout: 3000 });
      return () => w.cancelIdleCallback?.(handle);
    }
    const timer = setTimeout(start, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;
  return <DeferredC15tRuntime />;
}

export default DeferredC15t;
