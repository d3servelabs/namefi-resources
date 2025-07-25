import { Search as AstraSearch } from '@/pbns/astra/search';
import { Search as ZeroxCitySearch } from '@/pbns/0x-city/search';
import { originConfig as taylorOriginConfig } from '@/pbns/cv/taylor';
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
      component: AstraSearch,
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
        component: ZeroxCitySearch,
        headerIsBlurred: true,
      },
    },
    'taylor.cv': taylorOriginConfig,
  },
};
