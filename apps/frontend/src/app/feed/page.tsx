import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MlsFeed } from '@/components/mls/mls-feed';
import { MLS_FEED_RSS_PATH } from '@/lib/mls/feed';

// Keyword-rich title for the OpenGraph/Twitter social cards. The document
// <title> instead uses the translated `feed.metaTitle` ("Namefi | Feed") so the
// browser tab matches the rest of the app's "Namefi | <Page>" naming and
// localizes per locale.
const socialTitle = 'Public Domain Sale Posts | Namefi Feed';
const description =
  'Search public domain sale posts indexed by Namefi, with seller handles, source links, TLD filters, and asking prices when available.';
const canonicalPath = '/feed';
const openGraphImagePath = '/assets/mls/opengraph-image.png';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('feed');
  return {
    title: t('metaTitle'),
    description,
    alternates: {
      canonical: canonicalPath,
      types: {
        'application/rss+xml': MLS_FEED_RSS_PATH,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalPath,
      type: 'website',
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: 'Public domain sale posts indexed by Namefi Feed',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      site: '@namefi_io',
      creator: '@namefi_io',
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: 'Public domain sale posts indexed by Namefi Feed',
        },
      ],
    },
  };
}

export default function MlsFeedPage() {
  return <MlsFeed />;
}
