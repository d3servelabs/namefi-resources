import type { Metadata } from 'next';
import { MlsHandleFeed } from '@/components/mls/mls-handle-feed';

export const metadata: Metadata = {
  title: 'Feed User Listings | Namefi Feed',
  description:
    'Browse domains listed by a specific feed user from the Namefi Feed.',
};

interface MlsFeedUserPageProps {
  params: Promise<{ source: string; username: string }>;
}

export default async function MlsFeedUserPage({
  params,
}: MlsFeedUserPageProps) {
  const { source, username } = await params;
  return <MlsHandleFeed source={source} username={username} />;
}
