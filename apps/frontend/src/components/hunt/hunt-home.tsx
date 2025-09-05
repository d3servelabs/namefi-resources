'use client';

import { AuthGuard } from '@/components/dialogs/auth-required-dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { useAuth } from '@/hooks/use-auth';
import { type AppRouterInput, useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { DomainsList } from './domains-list';
import { PaginationControls } from './pagination-control';
import { SubmitDomainDialog } from './submit-domain-dialog';
import { HeaderTabs } from './header-tabs';
import { VoteOrShareChoiceDialog } from '../dialogs/vote-or-share-choice-dialog';
import { TwitterShareDialog } from './twitter-share-dialog';
import { useHuntVote } from '@/hooks/use-hunt-vote';

const DOMAINS_LIST_PER_PAGE_LIMIT = 20;

type TimeRange = AppRouterInput['hunt']['getTrendingDomains']['timeRange'];

export const HuntHome = () => {
  const [page, setPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_WEEK');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const vote = useHuntVote();

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
    setPage(1);
  }, []);

  const trpc = useTRPC();
  const offset = (page - 1) * DOMAINS_LIST_PER_PAGE_LIMIT;

  const { data, isLoading, isError } = useQuery({
    ...(isAuthenticated
      ? trpc.hunt.getTrendingDomains.queryOptions({
          limit: DOMAINS_LIST_PER_PAGE_LIMIT,
          offset,
          timeRange,
        })
      : trpc.hunt.getTrendingDomainsPublic.queryOptions({
          limit: DOMAINS_LIST_PER_PAGE_LIMIT,
          offset,
          timeRange,
        })),
    enabled: !isAuthLoading,
  });

  const hasMore = useMemo(() => data?.hasMore ?? false, [data]);

  return (
    <>
      <div className="flex flex-col ">
        <HeaderTabs activeTab="all" />
        <div className="container mx-auto py-8 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Domain Hunt
            </h2>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <SubmitDomainDialog>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Submit Domain
                    </Button>
                  </SubmitDomainDialog>
                  <Link href="/hunt/mine">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <AuthGuard
                    title="Sign in to submit domains"
                    description="You need to sign in to submit domains to the hunt. Join the community and share your favorite domains!"
                  >
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Submit Domain
                    </Button>
                  </AuthGuard>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Trending Domains</h3>
                <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                  <TabsList>
                    <TabsTrigger value="THIS_WEEK" className="cursor-pointer">
                      This Week
                    </TabsTrigger>
                    <TabsTrigger value="THIS_MONTH" className="cursor-pointer">
                      This Month
                    </TabsTrigger>
                    <TabsTrigger value="ANYTIME" className="cursor-pointer">
                      Anytime
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
                <DomainsList
                  domains={data?.items ?? []}
                  isLoading={isLoading || isAuthLoading}
                  isError={isError}
                  upvote={vote.upvote}
                  unvote={vote.unvote}
                  isVotePending={vote.isVotePending}
                />
              </div>
              <PaginationControls
                page={page}
                hasMore={hasMore}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vote or Share Choice Dialog */}
      <VoteOrShareChoiceDialog
        isOpen={vote.choiceDialog.isOpen}
        onClose={vote.choiceDialog.onClose}
        domainName={vote.choiceDialog.currentDomain}
        onChooseLogin={vote.choiceDialog.onChooseLogin}
        onChooseShare={vote.choiceDialog.onChooseShare}
      />

      {/* Twitter Share Dialog */}
      <TwitterShareDialog
        isOpen={vote.shareDialog.isOpen}
        onClose={vote.shareDialog.onClose}
        domainName={vote.shareDialog.currentDomain}
        shareUrl={vote.shareDialog.shareUrl}
        hasShared={vote.shareDialog.hasShared}
        isCheckingStatus={vote.shareDialog.isCheckingStatus}
        isSubmitting={vote.shareDialog.isSubmitting}
        onSubmit={vote.shareDialog.onSubmit}
        trackShares={true}
        campaignKey={vote.shareDialog.campaignKey}
      />
    </>
  );
};
