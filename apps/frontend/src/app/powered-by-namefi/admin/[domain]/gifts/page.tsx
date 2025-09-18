'use client';

import { useParams } from 'next/navigation';
import { GiftsManagementPage } from '../../gifts/page';

export default function DomainScopedGiftsPage() {
  const params = useParams() as { domain: string };
  return <GiftsManagementPage forcedPbnDomain={params.domain} />;
}
