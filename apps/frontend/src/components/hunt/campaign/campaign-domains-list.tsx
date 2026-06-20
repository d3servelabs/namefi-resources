'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { CampaignDomainItem } from './campaign-domain-item';
import { PaginationControls } from '../pagination-control';
import { useMemo } from 'react';
import { DomainItemSkeleton } from '../domain-item-skeleton';
import { SubmitDomainDialog } from '../submit-domain-dialog';
import { useTranslations } from 'next-intl';

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
    return (
      <section className="py-16 px-4 sm:px-8">
        <div className="bg-white/5 backdrop-blur-[100px] border border-white/10 rounded-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t('campaign.loadErrorTitle')}
            </h2>
            <p className="text-white/50">
              {t('campaign.loadErrorDescription')}
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
                {t('campaign.emptyTitle')}
              </h3>
              <p className="text-white/50">{t('campaign.emptyDescription')}</p>
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
                    {t('campaign.nominatePrompt')}{' '}
                    <SubmitDomainDialog>
                      <button
                        type="button"
                        className="cursor-pointer underline"
                      >
                        {t('campaign.nominateAction')}
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
