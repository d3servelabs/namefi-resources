'use client';

import { CVLanding } from '../components';
import { landingConfig } from './config';
import type { LandingComponent } from '@/components/search';

export const Landing: LandingComponent = () => {
  return <CVLanding config={landingConfig} />;
};
