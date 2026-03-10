import type { LandingComponent } from '@/components/search/types';
import { Landing as AstraLanding } from '@/pbns/astra/landing';
import { getOriginRuntime } from '@/lib/origin/utils.server';
import type { Metadata } from 'next';

const HOMEPAGE_URL = 'https://namefi.io';

const HOMEPAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${HOMEPAGE_URL}#organization`,
      name: 'Namefi',
      url: HOMEPAGE_URL,
      logo: `${HOMEPAGE_URL}/logotype.svg`,
      sameAs: [
        'https://twitter.com/namefi_io',
        'https://discord.gg/PKW52TXS',
        'https://github.com/d3servelabs',
        'https://t.me/namefidao',
        'https://www.linkedin.com/company/d3servelabs',
        'https://www.youtube.com/@Namefi_io',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${HOMEPAGE_URL}#website`,
      url: HOMEPAGE_URL,
      name: 'Namefi',
      description:
        'Namefi is an ICANN-accredited registrar that tokenizes DNS ownership so you can register, trade, and build with AI tooling and onchain security.',
      publisher: {
        '@id': `${HOMEPAGE_URL}#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${HOMEPAGE_URL}/?query={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${HOMEPAGE_URL}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What can I use Namefi for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Register or import more than 800 TLDs, tokenize them into NFTs, and route crypto payments to DNS names with AutoENS.',
          },
        },
        {
          '@type': 'Question',
          name: 'What TLDs does Namefi support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Namefi supports over 800 TLDs. Some premium or registry-restricted names can require extra processing time.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Namefi support ENS, Handshake, or other web3 names?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Namefi focuses on tokenizing web2 domains and integrates with onchain workflows like AutoENS.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why choose Namefi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Namefi operates a domain tokenization protocol on Ethereum to make domain transfers faster, safer, and more liquid than legacy escrow.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can I get $NFSC service credits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '$NFSC is currently available to eligible airdrop recipients, with broader distribution planned.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I qualify for future airdrops?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Complete the Namefi signup form, engage with the community, and contribute feedback to improve priority for future distributions.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will Namefi open to more users soon?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Namefi is gradually expanding beta access and plans wider availability after early tester rollout.',
          },
        },
      ],
    },
  ],
} as const;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const originInfo = await getOriginRuntime();

  const LandingComponent: LandingComponent =
    originInfo.config.landingPage?.component ?? AstraLanding;

  return (
    <>
      <LandingComponent origin={originInfo} />
      <script type="application/ld+json">
        {JSON.stringify(HOMEPAGE_JSON_LD)}
      </script>
    </>
  );
}
