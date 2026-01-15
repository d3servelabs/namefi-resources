import type { LandingComponent } from '@/components/search/types';
import { Landing as AstraLanding } from '@/pbns/astra/landing';
import { getOriginRuntime } from '@/lib/origin/utils.server';

export default async function HomePage() {
  const originInfo = await getOriginRuntime();

  const LandingComponent: LandingComponent =
    originInfo.config.landingPage?.component ?? AstraLanding;

  return <LandingComponent origin={originInfo} />;
}
