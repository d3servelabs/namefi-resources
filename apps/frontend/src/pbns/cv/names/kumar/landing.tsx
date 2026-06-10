'use client';

import { CVLanding } from '../../components/landing';
import { landingConfig } from './config';
import type { LandingComponent } from '@/components/search/types';

export const Landing: LandingComponent = () => {
  return <CVLanding config={landingConfig} />;
};
