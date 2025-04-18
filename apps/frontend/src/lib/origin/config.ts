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
    brandLogo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'NameFi Logo',
      width: 80,
      height: 24,
    },
  },
  thirdParty: {
    '0x.city': {
      metadata: {
        title: '0x.city - Powered by NameFi',
        description: 'Buy and sell 0x.city domains with ease',
      },
      brandLogo: {
        type: 'image',
        logo: '/logos/0x-logo.png',
        title: '0x.city',
        alt: '0x.city Logo',
      },
    },
    'defi.build': {
      metadata: {
        title: 'defi.build - Powered by NameFi',
        description: 'Buy and sell defi.build domains with ease',
      },
      brandLogo: {
        type: 'image',
        logo: '/logos/defi-logo.png',
        title: 'defi.build',
        alt: 'defi.build Logo',
      },
    },
  },
};
