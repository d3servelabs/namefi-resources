import type { PropsWithChildren } from 'react';
import { ProgressProvider } from './progress';

// Consent is intentionally NOT wrapped here. The c15t runtime is mounted as a
// deferred client-only island (see consent-island.tsx, rendered in the root
// layout) so it stays out of the initial bundle and off the first-paint path.
export function Providers({ children }: PropsWithChildren) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
