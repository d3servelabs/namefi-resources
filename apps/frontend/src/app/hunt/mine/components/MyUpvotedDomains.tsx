'use client';

import { Button } from '@/components/ui/shadcn/button';
import { formatNumberWithAbbreviations } from '@/utils/number';
import { type AppRouterOutput, useTRPC } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingDownIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { DomainItemSkeleton } from '../../components/DomainItemSkeleton';
import { TagsDisplay } from '../../components/TagsDisplay';
import { UpvoteIcon } from '../../components/UpvoteIcon';

type MyUpvotedDomainsResponse = AppRouterOutput['hunt']['getMyUpvotedDomains'];
type MyUpvotedDomain = MyUpvotedDomainsResponse['items'][number];

const MyUpvotedDomainItem = ({ domain }: { domain: MyUpvotedDomain }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const unvoteMutation = useMutation(
    trpc.hunt.unvote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.hunt.getTrendingDomains.queryKey(),
        });
        toast.success('Vote removed successfully');
      },
      onError: () => {
        toast.error('Failed to remove vote. Please try again.');
      },
    }),
  );

  const handleUnvote = useCallback(() => {
    if (
      confirm(
        `Are you sure you want to remove your vote for "${domain.domainName}"?`,
      )
    ) {
      unvoteMutation.mutate({ domainName: domain.domainName });
    }
  }, [domain.domainName, unvoteMutation]);

  return (
    <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-6 first:rounded-t-xl last:rounded-b-xl hover:bg-accent/30 transition">
      {/* Stats */}
      <div className="flex flex-col items-center w-12 sm:w-16">
        <div className="flex flex-col items-center">
          <UpvoteIcon className="text-2xl text-muted-foreground" />
          <span className="text-base/8 font-bold text-foreground font-mono">
            {formatNumberWithAbbreviations(domain.upvoteCount)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
        {/* Content */}
        <div className="flex-1 flex flex-col gap-1 sm:gap-2 w-full">
          <Link
            href={`/hunt/domains/${encodeURIComponent(domain.domainName)}`}
            className="text-base sm:text-lg font-semibold text-foreground font-sans hover:text-primary transition-colors"
          >
            {domain.domainName}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TagsDisplay tags={domain.tags || []} limit={4} />
            <span className="text-xs text-muted-foreground">
              Upvoted {new Date(domain.upvotedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnvote}
            disabled={unvoteMutation.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            <TrendingDownIcon className="h-4 w-4" />
            {unvoteMutation.isPending ? 'Removing...' : 'Unvote'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MyUpvotedDomainsProps {
  domains: MyUpvotedDomain[];
  isLoading: boolean;
  isError: boolean;
}

export const MyUpvotedDomains = ({
  domains,
  isLoading,
  isError,
}: MyUpvotedDomainsProps) => {
  if (isLoading) {
    return <DomainItemSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load your upvoted domains
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You haven't upvoted any domains yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {domains.map((domain) => (
        <MyUpvotedDomainItem key={domain.domainName} domain={domain} />
      ))}
    </div>
  );
};
