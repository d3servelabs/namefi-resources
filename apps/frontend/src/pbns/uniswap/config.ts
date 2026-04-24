import type { OriginConfig } from '@/lib/origin/types';
import { Landing } from './landing';

export const originConfig: OriginConfig = {
  metadata: {
    title: 'uniswap - Powered by Namefi',
    description:
      'Uniswap x Namefi landing page for DAO-governed DNS, verified namespace identity, and policy-controlled subdomain issuance.',
    icons: [
      { rel: 'icon', url: '/assets/uniswap/logos/uniswap-icon-pink.svg' },
    ],
    openGraph: {
      title: 'uniswap - Powered by Namefi',
      description:
        'Bring Uniswap DNS onchain with governance-native routing, verified identities, and DAO-controlled namespace policy.',
      type: 'website',
      images: ['/og-image-simple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'uniswap - Powered by Namefi',
      description:
        'Bring Uniswap DNS onchain with governance-native routing, verified identities, and DAO-controlled namespace policy.',
      images: ['/og-image-simple.jpg'],
    },
  },
  logo: {
    type: 'image',
    image: '/assets/uniswap/logos/uniswap-icon-pink.svg',
    title: 'uniswap',
    alt: 'Uniswap logo',
  },
  pbnLogo: {
    image: '/assets/uniswap/logos/uniswap-horizontal-pink.svg',
    monoImage: '/assets/uniswap/logos/uniswap-horizontal-white.svg',
  },
  landingPage: {
    component: Landing,
    headerIsBlurred: true,
  },
};
