'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { CampaignDomainItem } from './campaign-domain-item';
import { PaginationControls } from '../pagination-control';
import { useMemo } from 'react';
import { DomainItemSkeleton } from '../domain-item-skeleton';
import { SubmitDomainDialog } from '../submit-domain-dialog';

const DEFAULT_CAMPAIGN_DOMAINS_PER_PAGE_LIMIT = 20;

interface CampaignDomainsListProps {
  campaignKey: string;
  page: number;
  limit?: number;
  onPageChange: (page: number) => void;
}

export const CampaignDomainsList = ({
  campaignKey,
  page,
  limit = DEFAULT_CAMPAIGN_DOMAINS_PER_PAGE_LIMIT,
  onPageChange,
}: CampaignDomainsListProps) => {
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
    return (
      <section className="py-16 px-4 sm:px-8">
        <div className="bg-white/5 backdrop-blur-[100px] border border-white/10 rounded-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Error loading domains
            </h2>
            <p className="text-white/50">
              Failed to load campaign domains. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="container mx-auto py-4">
        <DomainItemSkeleton />
        <DomainItemSkeleton />
        <DomainItemSkeleton />
        <DomainItemSkeleton />
        <DomainItemSkeleton />
      </div>
    );
  }

  return (
    <section className="container mx-auto py-4">
      <div className="flex flex-col gap-4">
        <div className="space-y-4">
          {data?.rankings?.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">
                No domains found
              </h3>
              <p className="text-white/50">
                No domains are available for this campaign.
              </p>
            </div>
          ) : (
            <>
              {data?.rankings.map((domain) => (
                <CampaignDomainItem
                  key={domain.domainName}
                  domain={domain}
                  campaignKey={campaignKey}
                />
              ))}

              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="py-4">
                <div className="flex flex-col justify-between items-center gap-4">
                  <PaginationControls
                    page={page}
                    hasMore={hasMore}
                    onPageChange={onPageChange}
                  />

                  <p className="text-white/50 text-sm">
                    Why isn't my favourite domain here?{' '}
                    <SubmitDomainDialog>
                      <button
                        type="button"
                        className="cursor-pointer underline"
                      >
                        Nominate it!
                      </button>
                    </SubmitDomainDialog>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
