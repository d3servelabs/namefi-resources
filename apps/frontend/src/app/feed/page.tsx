import type { Metadata } from 'next';
import { MlsFeed } from '@/components/mls/mls-feed';
import { MLS_FEED_RSS_PATH } from '@/lib/mls/feed';

const title = 'Public Domain Sale Posts | Namefi Feed';
const description =
  'Search public domain sale posts indexed by Namefi, with seller handles, source links, TLD filters, and asking prices when available.';
const canonicalPath = '/feed';
const openGraphImagePath = '/assets/mls/opengraph-image.png';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalPath,
    types: {
      'application/rss+xml': MLS_FEED_RSS_PATH,
    },
  },
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
        alt: 'Public domain sale posts indexed by Namefi Feed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
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

export default function MlsFeedPage() {
  return <MlsFeed />;
}
