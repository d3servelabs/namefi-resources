import type { LandingComponent } from '@/components/search';
import { Landing as AstraLanding } from '@/pbns/astra/landing';
import { getOriginRuntime } from '@/lib/origin';

export default async function HomePage() {
  const originInfo = await getOriginRuntime();

  const LandingComponent: LandingComponent =
    originInfo.config.landingPage?.component ?? AstraLanding;

  return <LandingComponent origin={originInfo} />;
}
