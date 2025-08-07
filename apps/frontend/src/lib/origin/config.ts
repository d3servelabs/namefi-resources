import { Landing as AstraLanding } from '@/pbns/astra/landing';
import { Landing as ZeroxCityLanding } from '@/pbns/0x-city/landing';
import { originConfig as taylorOriginConfig } from '@/pbns/cv/names/taylor';
import { originConfig as aliOriginConfig } from '@/pbns/cv/names/ali';
import { originConfig as liOriginConfig } from '@/pbns/cv/names/li';
import { originConfig as mullerOriginConfig } from '@/pbns/cv/names/muller';
import { originConfig as kumarOriginConfig } from '@/pbns/cv/names/kumar';
import type { OriginConfigMap } from './types';

/**
 * Consolidated origin-specific configuration
 */
export const originConfig: OriginConfigMap = {
  firstParty: {
    metadata: {
      title: 'Powered by NameFi',
      description: 'Buy and sell domains with ease',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
    },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'NameFi Logo',
      width: 66,
      height: 19.8,
    },
    landingPage: {
      component: AstraLanding,
    },
  },
  thirdParty: {
    '0x.city': {
      metadata: {
        title: '0x.city - Powered by NameFi',
        description: 'Buy and sell 0x.city domains with ease',
        icons: [{ rel: 'icon', url: '/assets/0x-city/favicon.ico' }],
      },
      logo: {
        type: 'image',
        image: '/assets/0x-city/logos/0x-logo.svg',
        title: '0x.city',
        alt: '0x.city Logo',
      },
      authLogo: {
        image: '/assets/0x-city/logos/0xcity-powered-by-namefi.svg',
      },
      background: {
        image: '/assets/0x-city/background.png',
        alt: '0x.city Background',
      },
      landingPage: {
        component: ZeroxCityLanding,
        headerIsBlurred: true,
      },
    },
    'taylor.cv': taylorOriginConfig,
    'ali.cv': aliOriginConfig,
    'li.cv': liOriginConfig,
    'muller.cv': mullerOriginConfig,
    'kumar.cv': kumarOriginConfig,
  },
};
