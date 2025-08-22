import type { OriginConfig } from '@/lib/origin/types';
import { Landing } from './landing';

export const originConfig: OriginConfig = {
  metadata: {
    title: 'Powered by Namefi',
    description: 'Buy and sell domains with ease',
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
  },
  logo: {
    type: 'lottie',
    lottie: '/lottie/namefi_to_nfi.json',
    alt: 'Namefi Logo',
    width: 66,
    height: 19.8,
  },
  landingPage: {
    component: Landing,
  },
};
