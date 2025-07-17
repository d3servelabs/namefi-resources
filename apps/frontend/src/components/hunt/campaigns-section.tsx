'use client';

import { config } from '@/lib/env';
import { useCallback, useState } from 'react';
import { CampaignDomainsList } from './campaign-domains-list';

export const CampaignsSection = () => {
  const [campaignPages, setCampaignPages] = useState<Record<string, number>>(
    {},
  );

  const handleCampaignPageChange = useCallback(
    (campaignKey: string, newPage: number) => {
      setCampaignPages((prev) => ({
        ...prev,
        [campaignKey]: newPage,
      }));
    },
    [],
  );

  // Get campaign keys from config
  const campaignKeys = config.HUNT_CAMPAIGN_KEYS;

  if (campaignKeys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Campaigns</h2>
      {campaignKeys.map((campaignKey) => (
        <CampaignDomainsList
          key={campaignKey}
          campaignKey={campaignKey}
          page={campaignPages[campaignKey] || 1}
          onPageChange={(newPage) =>
            handleCampaignPageChange(campaignKey, newPage)
          }
        />
      ))}
    </div>
  );
};
