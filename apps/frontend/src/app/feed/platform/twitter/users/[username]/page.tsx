import type { Metadata } from 'next';
import { MlsHandleFeed } from '@/components/mls/mls-handle-feed';

export const metadata: Metadata = {
  title: 'Twitter User Listings | Namefi Feed',
  description:
    'Browse domains listed by a specific Twitter user from the Namefi Feed.',
};

interface MlsTwitterUserPageProps {
  params: Promise<{ username: string }>;
}

export default async function MlsTwitterUserPage({
  params,
}: MlsTwitterUserPageProps) {
  const { username } = await params;
  return <MlsHandleFeed username={username} />;
}
