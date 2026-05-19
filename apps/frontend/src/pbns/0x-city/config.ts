import type { OriginConfig } from '@/lib/origin/types';

export const originConfig: OriginConfig = {
  metadata: {
    title: '0x.city - Powered by Namefi',
    description: 'Buy and sell 0x.city domains with ease',
    icons: [{ rel: 'icon', url: '/assets/0x-city/favicon.ico' }],
  },
  logo: {
    type: 'image',
    image: '/assets/0x-city/logos/0x-logo.svg',
    title: '0x.city',
    alt: '0x.city Logo',
  },
  pbnLogo: {
    image: '/assets/0x-city/logos/0xcity-powered-by-namefi.svg',
    monoImage: '/assets/0x-city/logos/0xcity-powered-by-namefi-mono.svg',
  },
  background: {
    image: '/assets/0x-city/background.png',
    alt: '0x.city Background',
  },
  landingPage: {
    headerIsBlurred: true,
  },
};
