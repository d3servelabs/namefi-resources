'use client';

import { use } from 'react';
import { CampaignDomainsList } from '@/components/hunt/campaign-domains-list';
import { Button } from '@/components/ui/shadcn/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CampaignPageProps {
  params: Promise<{
    'campaign-key': string;
  }>;
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const [page, setPage] = useState(1);
  const { 'campaign-key': campaignKey } = use(params);

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hunt">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hunt
          </Button>
        </Link>
      </div>

      <CampaignDomainsList
        campaignKey={campaignKey}
        page={page}
        limit={10}
        onPageChange={setPage}
      />
    </div>
  );
}
