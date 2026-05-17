'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy boundary for the cross-tab leader coordinator. The
 * `LeaderCoordinator` module pulls in RxDB (~200KB), so we ship it as a
 * separate chunk loaded after first paint. `Main` imports from THIS
 * file, never directly from `./leader-coordinator`.
 */
export const LeaderCoordinator = dynamic(
  () => import('./leader-coordinator').then((m) => m.LeaderCoordinator),
  { ssr: false, loading: () => null },
);
