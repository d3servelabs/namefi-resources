'use client';

import dynamic from 'next/dynamic';

/**
 * Lazily loaded ReactQueryDevtools wrapper.
 *
 * This component uses next/dynamic to defer loading @tanstack/react-query-devtools
 * until runtime, keeping it out of the initial client module graph.
 * The devtools bundle is only fetched when this component mounts (dev mode only).
 *
 * This reduces Turbopack compile time and filesystem cache writes by shrinking
 * the always-on module graph in the root layout.
 */
const ReactQueryDevtoolsLazy = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (mod) => mod.ReactQueryDevtools,
    ),
  {
    ssr: false,
  },
);

export default function ReactQueryDevtoolsWrapper() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <ReactQueryDevtoolsLazy initialIsOpen={false} />;
}
