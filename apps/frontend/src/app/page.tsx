import { LandingPageContent } from '@/components/landing-page';
import { Landing as AstraLanding } from '@/pbns/astra/landing';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const originInfo = await getOriginRuntime();

  return (
    <LandingPageContent includeStructuredData={true}>
      <AstraLanding origin={originInfo} />
    </LandingPageContent>
  );
}
