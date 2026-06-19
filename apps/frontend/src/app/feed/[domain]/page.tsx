import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DomainFeedListings } from '@/components/mls/domain-feed-listings';

type Props = {
  params: Promise<{ domain: string }>;
};

const openGraphImagePath = '/assets/mls/opengraph-image.png';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain);
  const t = await getTranslations('feed');
  const title = `Namefi | ${t('domainTitle', { domain })}`;
  const description = t('domainSubtitle', { domain });
  const canonicalPath = `/feed/${domain}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@namefi_io',
      creator: '@namefi_io',
      images: [openGraphImagePath],
    },
  };
}

export default async function DomainFeedPage({ params }: Props) {
  const { domain } = await params;
  return <DomainFeedListings domain={decodeURIComponent(domain)} />;
}
