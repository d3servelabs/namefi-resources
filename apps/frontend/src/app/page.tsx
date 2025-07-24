'use client';

import type { LandingComponent } from '@/components/search';
import { Search as AstraSearch } from '@/components/astra/Search';
import { useOrigin } from '@/providers/originProvider';

export default function HomePage() {
  const origin = useOrigin();

  const LandingComponent: LandingComponent =
    origin.config.landingPage?.component ?? AstraSearch;

  return <LandingComponent origin={origin} />;
}
