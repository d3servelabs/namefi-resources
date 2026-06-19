import type { OriginConfig } from '@/lib/origin/types';

// Default document <title> for namefi.io. Functional routes (manage domain,
// cart, feed, profile, …) override this with their own translated titles; this
// long, keyword-rich string is the fallback for the homepage and any route
// that does not set its own title.
const FALLBACK_TITLE =
  'Namefi | ICANN Accredited Domain Registrar for the Future Internet – Easier, faster, cheaper, more secure domain sales with AI-agentic workflows & vibe coding. The best way to own domains onchain, tokenized, and as NFTs.';

// Shorter brand title for social cards, where platforms truncate long titles.
const SOCIAL_TITLE =
  'Namefi | ICANN Accredited Domain Registrar for the Future Internet';

export const originConfig: OriginConfig = {
  metadata: {
    title: FALLBACK_TITLE,
    description:
      'Namefi is an ICANN Accredited Registrar tokenizing internet domain names for trading, DeFi and future of Internet.',
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
      title: SOCIAL_TITLE,
      description:
        'Namefi is an ICANN Accredited Registrar tokenizing internet domain names for trading, DeFi and future of Internet.',
      url: 'https://namefi.io/',
      siteName: 'Namefi',
      type: 'website',
      locale: 'en_US',
      images: ['/og-image-simple.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: SOCIAL_TITLE,
      description:
        'Namefi is an ICANN Accredited Registrar tokenizing internet domain names for trading, DeFi and future of Internet.',
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
