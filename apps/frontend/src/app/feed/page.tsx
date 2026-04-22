import type { Metadata } from 'next';
import { MlsFeed } from '@/components/mls/mls-feed';
import { MLS_FEED_RSS_PATH } from '@/lib/mls/feed';

const title = 'Domains For Sale On Twitter | Namefi MLS Feed';
const description =
  'Browse a live feed that aggregates domains listed for sale on Twitter, with prices, seller handles, and source tweets.';
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
        alt: 'Domains for sale on Twitter aggregated by Namefi MLS Feed',
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
        alt: 'Domains for sale on Twitter aggregated by Namefi MLS Feed',
      },
    ],
  },
};

export default function MlsFeedPage() {
  return <MlsFeed />;
}
