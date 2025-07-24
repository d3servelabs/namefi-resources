'use client';

import type { LandingComponent } from '@/components/search';
import { Search as VanillaSearch } from '@/components/search';
import { useOrigin } from '@/components/providers/origin';

export default function HomePage() {
  const origin = useOrigin();

  const LandingComponent: LandingComponent =
    origin.config.landingPage?.component ?? VanillaSearch;

  return <LandingComponent origin={origin} />;
}
