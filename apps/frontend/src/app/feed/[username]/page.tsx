import type { Metadata } from 'next';
import { MlsHandleFeed } from '@/components/mls/mls-handle-feed';

export const metadata: Metadata = {
  title: 'Seller Listings | Namefi Feed',
  description:
    'Browse domains listed by a specific seller from the Namefi Feed.',
};

interface MlsSellerPageProps {
  params: Promise<{ username: string }>;
}

export default async function MlsSellerPage({ params }: MlsSellerPageProps) {
  const { username } = await params;
  return <MlsHandleFeed username={username} />;
}
