import type { OriginConfig } from '@/lib/origin/types';

export const originConfig: OriginConfig = {
  metadata: {
    title: 'Tokenized domains for the future internet - Namefi',
    description:
      'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
    keywords: [
      'domain',
      'NFT',
      'tokenize',
      'onchain',
      'web3',
      'blockchain',
      'trading',
      'marketplace',
      'domain names',
      'domain registration',
      'domain sales',
      'domain auctions',
      'domain transfers',
      'buy domains',
      'sell domains',
      'crypto domains',
      'digital assets',
      'domain investment',
      'domain broker',
      'domain exchange',
    ],
    authors: [{ name: 'D3Serve Labs Inc.' }],
    openGraph: {
      title: 'Tokenized domains for the future internet - Namefi',
      description:
        'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
      url: 'https://namefi.io/',
      siteName: 'Namefi',
      type: 'website',
      locale: 'en_US',
      images: ['/og-image-simple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tokenized domains for the future internet - Namefi',
      description:
        'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
      images: ['/og-image-simple.jpg'],
      site: '@namefi_io',
    },
    icons: [{ rel: 'icon', url: '/favicon.ico' }],
  },
  logo: {
    type: 'lottie',
    lottie: '/lottie/namefi_to_nfi.json',
    alt: 'Namefi Logo',
    width: 66,
    height: 19.8,
  },
};
