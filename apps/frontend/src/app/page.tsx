import type { LandingComponent } from '@/components/search';
import { Search as VanillaSearch } from '@/components/search';
import { getOriginRuntime } from '@/lib/origin';

export default async function HomePage() {
  const originInfo = await getOriginRuntime();

  const LandingComponent: LandingComponent =
    originInfo.config.landingPage?.component ?? VanillaSearch;

  return <LandingComponent origin={originInfo} />;
}
