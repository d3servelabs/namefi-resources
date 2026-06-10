'use client';

import { BespokeLanding } from '@/pbns/bespoke/components/landing';
import { landingConfig } from './config';
import type { LandingComponent } from '@/components/search/types';

export const Landing: LandingComponent = () => {
  return <BespokeLanding config={landingConfig} />;
};
