import type { Metadata } from 'next';
import { MlsHandleFeed } from '@/components/mls/mls-handle-feed';

export const metadata: Metadata = {
  title: 'MLS Seller Listings | Namefi',
  description:
    'Browse domains listed by a specific seller from the MLS Twitter feed.',
};

interface MlsSellerPageProps {
  params: Promise<{ username: string }>;
}

export default async function MlsSellerPage({ params }: MlsSellerPageProps) {
  const { username } = await params;
  return <MlsHandleFeed username={username} />;
}
