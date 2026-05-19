import type { OriginConfig } from '@/lib/origin/types';

export const originConfig: OriginConfig = {
  metadata: {
    title: 'token.com - Powered by Namefi',
    description:
      'Register and trade token.com names with campaign-focused landing experiences powered by Namefi.',
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
    openGraph: {
      title: 'token.com - Powered by Namefi',
      description:
        'Launch high-conviction token.com naming campaigns with full registration and import flows.',
      type: 'website',
      images: ['/og-image-simple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'token.com - Powered by Namefi',
      description:
        'Launch high-conviction token.com naming campaigns with full registration and import flows.',
      images: ['/og-image-simple.jpg'],
    },
  },
  logo: {
    type: 'image',
    image: '/assets/token-com/logos/token-mark.svg',
    title: 'token.com',
    alt: 'token.com Logo',
  },
  pbnLogo: {
    image: '/assets/token-com/logos/token-powered-by-namefi.svg',
    monoImage: '/assets/token-com/logos/token-powered-by-namefi-mono.svg',
  },
  landingPage: {
    headerIsBlurred: true,
  },
};
