export type ParkStructuredDataMarketplace = {
  label: string;
  href: string;
};

export type ParkFaqItem = {
  question: string;
  answer: string;
};

export type ParkStructuredDataOptions = {
  canonicalUrl: string;
  domainName: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  marketplaceLinks: readonly ParkStructuredDataMarketplace[];
  manageUrl?: string | null;
  ownerAddress?: string | null;
  expiration?: string | null;
  tags?: readonly string[];
};

const NAMEFI_ORGANIZATION_ID = 'https://namefi.io/#organization';

export function buildParkFaqItems(options: {
  domainName: string;
  marketplaceLinks: readonly ParkStructuredDataMarketplace[];
}): ParkFaqItem[] {
  const marketplaceNames = options.marketplaceLinks
    .map((link) => link.label)
    .filter(Boolean)
    .join(', ');

  return [
    {
      question: `What is ${options.domainName}?`,
      answer: `${options.domainName} is a parked domain powered by Namefi, with ownership details, marketplace links, and domain highlights available from this page.`,
    },
    {
      question: `How can I buy ${options.domainName}?`,
      answer: marketplaceNames
        ? `Use the marketplace links on this page to review or buy ${options.domainName} on ${marketplaceNames}.`
        : `Use the marketplace links on this page to review or buy ${options.domainName}.`,
    },
    {
      question: 'Who powers this parked domain page?',
      answer:
        'This parked domain page is powered by Namefi, a domain platform for discovering, managing, and trading domains.',
    },
  ];
}

export function buildParkStructuredData(
  options: ParkStructuredDataOptions,
): Record<string, unknown> {
  const faqItems = buildParkFaqItems(options);
  const domainEntityId = `${options.canonicalUrl}#domain`;
  const additionalProperties = [
    ...(options.ownerAddress
      ? [
          {
            '@type': 'PropertyValue',
            name: 'Owner wallet',
            value: options.ownerAddress,
          },
        ]
      : []),
    ...(options.expiration
      ? [
          {
            '@type': 'PropertyValue',
            name: 'Registration expiration',
            value: options.expiration,
          },
        ]
      : []),
    ...(options.tags ?? []).map((tag) => ({
      '@type': 'PropertyValue',
      name: 'Domain attribute',
      value: tag,
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': NAMEFI_ORGANIZATION_ID,
        name: 'Namefi',
        url: 'https://namefi.io',
        logo: 'https://namefi.io/logotype.svg',
        sameAs: [
          'https://x.com/namefi_io',
          'https://www.youtube.com/@namefi',
          'https://github.com/d3servelabs',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${options.canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Namefi',
            item: 'https://namefi.io/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Domains',
            item: 'https://namefi.io/domains',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: options.domainName,
            item: options.canonicalUrl,
          },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${options.canonicalUrl}#webpage`,
        url: options.canonicalUrl,
        name: options.title,
        description: options.description,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${options.canonicalUrl}#website`,
          name: options.domainName,
          url: options.canonicalUrl,
          publisher: { '@id': NAMEFI_ORGANIZATION_ID },
        },
        publisher: { '@id': NAMEFI_ORGANIZATION_ID },
        breadcrumb: { '@id': `${options.canonicalUrl}#breadcrumb` },
        mainEntity: { '@id': domainEntityId },
        ...(options.imageUrl
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: options.imageUrl,
              },
            }
          : {}),
      },
      {
        '@type': 'Thing',
        '@id': domainEntityId,
        name: options.domainName,
        description: options.description,
        url: options.canonicalUrl,
        category: 'Internet domain name',
        ...(additionalProperties.length
          ? { additionalProperty: additionalProperties }
          : {}),
        ...(options.marketplaceLinks.length
          ? {
              potentialAction: {
                '@type': 'BuyAction',
                target: options.marketplaceLinks.map((link) => link.href),
              },
            }
          : {}),
        ...(options.manageUrl ? { sameAs: [options.manageUrl] } : {}),
      },
      {
        '@type': 'FAQPage',
        '@id': `${options.canonicalUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };
}
