import type { Metadata } from 'next';
import { MlsFeed } from '@/components/mls/mls-feed';

export const metadata: Metadata = {
  title: 'MLS Feed | Namefi',
  description:
    'Live Twitter feed of domains listed for sale with pricing, seller details, and source links.',
};

export default function MlsFeedPage() {
  return <MlsFeed />;
}
