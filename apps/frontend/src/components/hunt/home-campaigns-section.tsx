'use client';

import { config } from '@/lib/env';
import { useCallback, useState, useMemo } from 'react';
import { CampaignDomainsList } from './campaign-domains-list';

export const HomeCampaignsSection = () => {
  const [page, setPage] = useState(1);

  const randomCampaignKey = useMemo(() => {
    const campaignKeys = config.HUNT_CAMPAIGN_KEYS;
    if (campaignKeys.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * campaignKeys.length);
    return campaignKeys[randomIndex];
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  if (!randomCampaignKey) {
    return null;
  }

  return (
    <div className="space-y-6">
      <CampaignDomainsList
        key={randomCampaignKey}
        campaignKey={randomCampaignKey}
        page={page}
        limit={5}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
