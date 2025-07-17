'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/utils/trpc';
import { Badge } from '@/components/ui/shadcn/badge';
import { useMemo } from 'react';
import { DomainsList } from './domains-list';
import { PaginationControls } from './pagination-control';
import { cn } from '@/lib/utils';

const CAMPAIGN_DOMAINS_PER_PAGE_LIMIT = 8;

interface CampaignDomainsListProps {
  campaignKey: string;
  page: number;
  onPageChange: (page: number) => void;
}

export const CampaignDomainsList = ({
  campaignKey,
  page,
  onPageChange,
}: CampaignDomainsListProps) => {
  const { isAuthenticated } = useAuth();
  const trpc = useTRPC();
  const offset = (page - 1) * CAMPAIGN_DOMAINS_PER_PAGE_LIMIT;

  const { data, isLoading, isError } = useQuery(
    isAuthenticated
      ? trpc.hunt.getCampaign.queryOptions({
          campaignKey,
          offset,
          limit: CAMPAIGN_DOMAINS_PER_PAGE_LIMIT,
        })
      : trpc.hunt.getCampaignPublic.queryOptions({
          campaignKey,
          offset,
          limit: CAMPAIGN_DOMAINS_PER_PAGE_LIMIT,
        }),
  );

  const hasMore = useMemo(() => data?.hasMore ?? false, [data]);

  if (isError) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            {data?.campaign?.title || campaignKey}
            {data?.campaign?.status && (
              <Badge
                className={cn(
                  'font-medium',
                  data.campaign.status === 'ACTIVE'
                    ? 'bg-brand-primary text-primary-foreground italic'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {data.campaign.status === 'ACTIVE'
                  ? 'ongoing!'
                  : data.campaign.status === 'ENDED'
                    ? 'ended'
                    : 'not started yet'}
              </Badge>
            )}
          </h3>
          {data?.campaign?.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.campaign.description}
            </p>
          )}
        </div>
      </div>

      <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
        <DomainsList
          domains={data?.rankings || []}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <PaginationControls
        page={page}
        hasMore={hasMore}
        onPageChange={onPageChange}
      />
    </div>
  );
};
