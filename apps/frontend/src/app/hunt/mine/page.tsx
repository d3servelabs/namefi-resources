'use client';

import { AuthRequired } from '@/components/auth-required';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PaginationControls } from '@/components/hunt/pagination-control';
import { MySubmittedDomains } from '@/components/hunt/mine/my-submitted-domains';
import { MyUpvotedDomains } from '@/components/hunt/mine/my-upvoted-domains';
import { PageShell } from '@/components/page-shell';

const DOMAINS_LIST_PER_PAGE_LIMIT = 20;

type TabKey = 'submitted' | 'upvoted';

export default function MyDomainsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [submittedPage, setSubmittedPage] = useState(1);
  const [upvotedPage, setUpvotedPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('upvoted');

  const trpc = useTRPC();

  // Submitted domains query
  const submittedOffset = (submittedPage - 1) * DOMAINS_LIST_PER_PAGE_LIMIT;
  const {
    data: submittedData,
    isLoading: submittedLoading,
    isError: submittedError,
  } = useQuery({
    ...trpc.hunt.getMySubmittedDomains.queryOptions({
      limit: DOMAINS_LIST_PER_PAGE_LIMIT,
      offset: submittedOffset,
    }),
    enabled: isAuthenticated,
  });

  // Upvoted domains query
  const upvotedOffset = (upvotedPage - 1) * DOMAINS_LIST_PER_PAGE_LIMIT;
  const {
    data: upvotedData,
    isLoading: upvotedLoading,
    isError: upvotedError,
  } = useQuery({
    ...trpc.hunt.getMyUpvotedDomains.queryOptions({
      limit: DOMAINS_LIST_PER_PAGE_LIMIT,
      offset: upvotedOffset,
    }),
    enabled: isAuthenticated,
  });

  const submittedHasMore = useMemo(
    () => submittedData?.hasMore ?? false,
    [submittedData],
  );
  const upvotedHasMore = useMemo(
    () => upvotedData?.hasMore ?? false,
    [upvotedData],
  );

  if (!(authLoading || isAuthenticated)) {
    return (
      <AuthRequired
        title="Sign in to view your activity"
        description="Please sign in to see your submitted domains and voting history"
      />
    );
  }

  return (
    <PageShell padding="compact">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/hunt">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">My Activity</h2>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="upvoted" className="cursor-pointer">
            Upvoted Domains
          </TabsTrigger>
          <TabsTrigger value="submitted" className="cursor-pointer">
            Submitted Domains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submitted" className="space-y-4">
          <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
            <MySubmittedDomains
              domains={submittedData?.items ?? []}
              isLoading={submittedLoading || authLoading}
              isError={submittedError}
            />
          </div>
          <PaginationControls
            page={submittedPage}
            hasMore={submittedHasMore}
            onPageChange={setSubmittedPage}
          />
        </TabsContent>

        <TabsContent value="upvoted" className="space-y-4">
          <div className="border border-border shadow-sm rounded-xl bg-white/[0.03]">
            <MyUpvotedDomains
              domains={upvotedData?.items ?? []}
              isLoading={upvotedLoading || authLoading}
              isError={upvotedError}
            />
          </div>
          <PaginationControls
            page={upvotedPage}
            hasMore={upvotedHasMore}
            onPageChange={setUpvotedPage}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
