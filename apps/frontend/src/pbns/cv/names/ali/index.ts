import type { OriginConfig } from '@/lib/origin';
import { Landing } from './landing';
import { originConfigWithoutLanding } from './config';

export const originConfig: OriginConfig = {
  ...originConfigWithoutLanding,
  landingPage: {
    component: Landing,
  },
};
