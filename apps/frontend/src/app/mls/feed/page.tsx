import type { Metadata } from 'next';
import { MlsFeed } from '@/components/mls/mls-feed';
import { MLS_FEED_RSS_PATH } from '@/lib/mls/feed';

export const metadata: Metadata = {
  title: 'MLS Feed | Namefi',
  description:
    'Live Twitter feed of domains listed for sale with pricing, seller details, and source links.',
  alternates: {
    canonical: '/mls/feed',
    types: {
      'application/rss+xml': MLS_FEED_RSS_PATH,
    },
  },
};

export default function MlsFeedPage() {
  return <MlsFeed />;
}
