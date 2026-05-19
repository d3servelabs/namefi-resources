import type { OriginConfig } from '@/lib/origin/types';

export const originConfig: OriginConfig = {
  metadata: {
    title: 'aave - Powered by Namefi',
    description:
      'Aave DAO x Namefi landing page for onchain DNS, governed identity, and DAO-controlled subdomain issuance.',
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
    openGraph: {
      title: 'aave - Powered by Namefi',
      description:
        'Make aave.com as decentralized as Aave with DAO-governed DNS and onchain namespace management.',
      type: 'website',
      images: ['/og-image-simple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'aave - Powered by Namefi',
      description:
        'Make aave.com as decentralized as Aave with DAO-governed DNS and onchain namespace management.',
      images: ['/og-image-simple.jpg'],
    },
  },
  logo: {
    type: 'image',
    image: '/assets/aave/logos/aave-mark.svg',
    title: 'aave',
    alt: 'Aave logo',
  },
  landingPage: {
    headerIsBlurred: true,
  },
};
