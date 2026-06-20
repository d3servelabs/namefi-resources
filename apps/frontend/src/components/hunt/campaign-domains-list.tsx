'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { useMemo } from 'react';
import { DomainsList } from './domains-list';
import { PaginationControls } from './pagination-control';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import type { DomainsListProps } from './domains-list';

const DEFAULT_CAMPAIGN_DOMAINS_PER_PAGE_LIMIT = 10;

interface CampaignDomainsListProps
  extends Omit<DomainsListProps, 'domains' | 'isLoading' | 'isError'> {
  campaignKey: string;
  page: number;
  limit?: number;
  onPageChange: (page: number) => void;
  showTitle?: boolean;
}

export const CampaignDomainsList = ({
  campaignKey,
  page,
  limit = DEFAULT_CAMPAIGN_DOMAINS_PER_PAGE_LIMIT,
  onPageChange,
  showTitle = true,
  skeletonCount,
  upvote,
  unvote,
  isVotePending,
}: CampaignDomainsListProps) => {
  const t = useTranslations('hunt');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();
  const offset = (page - 1) * limit;

  const { data, isLoading, isError } = useQuery({
    ...(isAuthenticated
      ? trpc.hunt.getCampaign.queryOptions({
          campaignKey,
          offset,
          limit,
        })
      : trpc.hunt.getCampaignPublic.queryOptions({
          campaignKey,
          offset,
          limit,
        })),
    enabled: !isAuthLoading,
  });

  const hasMore = useMemo(() => data?.hasMore ?? false, [data]);

  if (isError) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Link href={`/hunt/campaigns/${campaignKey}`}>
                {data?.campaign?.title || campaignKey}
              </Link>
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
                    ? t('campaign.status.ongoing')
                    : data.campaign.status === 'ENDED'
                      ? t('campaign.status.ended')
                      : t('campaign.status.notStarted')}
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
      )}

      <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
        <DomainsList
          domains={data?.rankings || []}
          isLoading={isLoading || isAuthLoading}
          isError={isError}
          skeletonCount={skeletonCount}
          upvote={upvote}
          unvote={unvote}
          isVotePending={isVotePending}
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
