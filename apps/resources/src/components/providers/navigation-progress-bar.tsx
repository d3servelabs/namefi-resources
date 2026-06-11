'use client';

import { ProgressProvider as NextProgressProvider } from '@bprogress/next/app';

// Standalone bprogress navigation indicator. It renders no children — it only
// animates a thin bar on route changes — so it is a pure post-load UX widget,
// never part of first paint. It lives in its own module so the parent can load
// it with `next/dynamic({ ssr: false })`, keeping the bprogress runtime out of
// the initial, article-critical provider chunk (same approach as the lazily
// loaded consent UI in PR #4479).
export function NavigationProgressBar() {
  return (
    <NextProgressProvider
      height="2px"
      color="var(--color-brand-primary)"
      options={{ showSpinner: false }}
      shallowRouting
      disableSameURL
    />
  );
}
