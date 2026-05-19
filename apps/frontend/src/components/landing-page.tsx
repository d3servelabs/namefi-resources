import type { LandingComponent } from '@/components/search/types';
import {
  getThirdPartyOriginRouteSegment,
  type ThirdPartyOriginKey,
} from '@/lib/origin/keys';
import type { OriginConfig, OriginRuntime } from '@/lib/origin/types';
import {
  FIRST_PARTY_ORIGIN_URL,
  getStaticThirdPartyOriginRuntime,
} from '@/lib/origin/utils';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

const HOMEPAGE_URL = FIRST_PARTY_ORIGIN_URL;

export const HOMEPAGE_JSON_LD = {
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

export function withLandingPageMetadata(
  metadata: Metadata,
  metadataBase?: string | null,
): Metadata {
  return {
    ...metadata,
    metadataBase: metadataBase ? new URL(metadataBase) : metadata.metadataBase,
    alternates: {
      ...metadata.alternates,
      canonical: '/',
    },
  };
}

export function LandingPageContent({
  children,
  includeStructuredData = false,
}: {
  children: ReactNode;
  includeStructuredData?: boolean;
}) {
  return (
    <>
      {children}
      {includeStructuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(HOMEPAGE_JSON_LD)}
        </script>
      ) : null}
    </>
  );
}

type LandingRouteProps = {
  params: Promise<{ originKey: string }>;
};

export function createLandingPage({
  expectedOriginKey,
  Landing,
  origin,
  includeStructuredData = false,
}: {
  expectedOriginKey: string;
  Landing: LandingComponent;
  origin: OriginRuntime;
  includeStructuredData?: boolean;
}) {
  async function LandingPage({ params }: LandingRouteProps) {
    const { originKey } = await params;

    if (originKey !== expectedOriginKey) {
      notFound();
    }

    return (
      <LandingPageContent includeStructuredData={includeStructuredData}>
        <Landing origin={origin} />
      </LandingPageContent>
    );
  }

  LandingPage.displayName = `LandingPage(${expectedOriginKey})`;

  return LandingPage;
}

export function createThirdPartyLandingPage({
  originKey,
  Landing,
  originConfig,
}: {
  originKey: ThirdPartyOriginKey;
  Landing: LandingComponent;
  originConfig: OriginConfig;
}) {
  const origin = getStaticThirdPartyOriginRuntime(originKey, originConfig);
  const expectedOriginKey = getThirdPartyOriginRouteSegment(originKey);

  return {
    metadata: withLandingPageMetadata(originConfig.metadata, origin.origin),
    Page: createLandingPage({
      expectedOriginKey,
      Landing,
      origin,
    }),
  };
}
