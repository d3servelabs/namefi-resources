'use client';

import { use } from 'react';
import { useState } from 'react';
import { HeaderTabs } from '@/components/hunt/header-tabs';
import { CampaignHero } from '@/components/hunt/campaign/campaign-hero';
import { CampaignDomainsList } from '@/components/hunt/campaign/campaign-domains-list';
import { CampaignWhyVote } from '@/components/hunt/campaign/campaign-why-vote';
import { CampaignCommunity } from '@/components/hunt/campaign/campaign-community';
import { CampaignHowItWorks } from '@/components/hunt/campaign/campaign-how-it-works';
import { PageShell } from '@/components/page-shell';

interface CampaignPageProps {
  params: Promise<{
    'campaign-key': string;
  }>;
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const [page, setPage] = useState(1);
  const { 'campaign-key': campaignKey } = use(params);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderTabs activeTab={campaignKey} />
      <PageShell
        size="full"
        padding="none"
        shellClassName="bg-black"
        className="flex flex-col gap-4"
      >
        <CampaignHero campaignKey={campaignKey} />
        <CampaignHowItWorks />
        <CampaignDomainsList
          campaignKey={campaignKey}
          page={page}
          onPageChange={setPage}
        />
        <CampaignWhyVote />
        <CampaignCommunity />
      </PageShell>
    </div>
  );
}
