import { Search as AstraSearch } from '@/components/astra/Search';
import { Search as ZeroxCitySearch } from '@/components/0x-city/Search';
import { Search as TaylorCvSearch } from '@/components/taylor-cv/search';
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
        icons: [{ rel: 'icon', url: '/favicon-0x-city.ico' }],
      },
      logo: {
        type: 'image',
        image: '/logos/0x-logo.svg',
        title: '0x.city',
        alt: '0x.city Logo',
      },
      authLogo: {
        image: '/logos/0xcity-powered-by-namefi.svg',
      },
      background: {
        image: '/backgrounds/0x.city.png',
        alt: '0x.city Background',
      },
      landingPage: {
        component: ZeroxCitySearch,
      },
    },
    'taylor.cv': {
      metadata: {
        title: 'taylor.cv - Powered by NameFi',
        description:
          'A community namespace for Taylors. Get your personalized subdomain under taylor.cv for your digital CV, portfolio, or link-in-bio.',
        icons: [{ rel: 'icon', url: '/favicon.ico' }],
        openGraph: {
          title: 'taylor.cv - Powered by NameFi',
          description:
            'A community namespace for Taylors. Get your personalized subdomain under taylor.cv for your digital CV, portfolio, or link-in-bio.',
          type: 'website',
          images: [
            {
              url: '/assets/taylor-cv/opengraph-image.jpg',
              width: 1200,
              height: 630,
              alt: 'taylor.cv - Your Digital Identity Awaits',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'taylor.cv - Your Digital Identity Awaits',
          description:
            'A community namespace for Taylors. Get your personalized subdomain under taylor.cv for your digital CV, portfolio, or link-in-bio.',
        },
      },
      logo: {
        type: 'lottie',
        lottie: '/lottie/namefi_to_nfi.json',
        alt: 'NameFi Logo',
        width: 80,
        height: 24,
      },
      landingPage: {
        component: TaylorCvSearch,
      },
    },
  },
};
