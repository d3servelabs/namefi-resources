'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { type AppRouterInput, useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { DomainList } from './DomainList';
import { PaginationControls } from './PaginationControl';
import { SubmitDomainDialog } from './SubmitDomainDialog';

const DOMAINS_LIST_PER_PAGE_LIMIT = 20;

type TimeRange = AppRouterInput['hunt']['getTrendingDomains']['timeRange'];

export const HuntHome = () => {
  const [page, setPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_WEEK');

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
    setPage(1);
  }, []);

  const trpc = useTRPC();
  const offset = (page - 1) * DOMAINS_LIST_PER_PAGE_LIMIT;

  const { data, isLoading, isError } = useQuery(
    trpc.hunt.getTrendingDomains.queryOptions({
      limit: DOMAINS_LIST_PER_PAGE_LIMIT,
      offset,
      timeRange,
    }),
  );

  const hasMore = useMemo(() => data?.hasMore ?? false, [data]);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Domain Hunt
        </h2>
        <div className="flex items-center gap-4">
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
        </div>
      </div>

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
          <DomainList
            domains={data?.items ?? []}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
        <PaginationControls
          page={page}
          hasMore={hasMore}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
