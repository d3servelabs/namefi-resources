import { Search as AstraSearch } from '@/components/astra/Search';
import type { OriginConfigMap } from './types';

/**
 * Consolidated origin-specific configuration
 */
export const originConfig: OriginConfigMap = {
  firstParty: {
    metadata: {
      title: 'Powered by NameFi',
      description: 'Buy and sell domains with ease',
    },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'NameFi Logo',
      width: 80,
      height: 24,
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
      },
      logo: {
        type: 'image',
        image: '/logos/0x-logo.svg',
        title: '0x.city',
        alt: '0x.city Logo',
      },
      background: {
        image: '/backgrounds/0x.city.png',
        alt: '0x.city Background',
      },
    },
    'defi.build': {
      metadata: {
        title: 'defi.build - Powered by NameFi',
        description: 'Buy and sell defi.build domains with ease',
      },
      logo: {
        type: 'image',
        image: '/logos/defi-logo.png',
        title: 'defi.build',
        alt: 'defi.build Logo',
      },
    },
  },
};
