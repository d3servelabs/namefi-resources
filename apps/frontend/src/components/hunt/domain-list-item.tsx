'use client';

import { AuthGuard } from '@/components/auth-required-dialog';
import { cn } from '@/lib/utils';
import { formatNumberWithAbbreviations } from '@/utils/number';
import { type AppRouterOutput, useTRPC } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { type MouseEvent, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { TagsDisplay } from './tags-display';
import { UpvoteIcon } from './upvote-icon';
import { usePendingToast } from '../../hooks/use-pending-toast';

type TrendingDomainsResponse = AppRouterOutput['hunt']['getTrendingDomains'];
export type Domain = TrendingDomainsResponse['items'][number];

const VoteButton = ({
  voted,
  pending,
  onUpvote,
  onUnvote,
}: {
  voted?: boolean;
  pending?: boolean;
  onUpvote?: () => void;
  onUnvote?: () => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();

      if (voted) {
        onUnvote?.();
      } else {
        onUpvote?.();
      }
    },
    [voted, onUpvote, onUnvote],
  );

  usePendingToast(pending, 'Voting...');
  return (
    <AuthGuard
      title="Sign in to vote"
      description="You need to sign in to vote for domains. Join the community to discover and vote for the best domains!"
    >
      <button
        type="button"
        className={cn(
          'group flex items-center justify-center rounded-full p-2 sm:p-2.5 bg-muted border border-transparent text-muted-foreground cursor-pointer hover:bg-[rgba(72,229,155,0.08)] hover:text-brand-primary hover:border-transparent transition-all duration-200',
          voted &&
            'bg-[rgba(72,229,155,0.08)] text-brand-primary border-brand-primary',
        )}
        aria-label="Upvote"
        onClick={handleClick}
      >
        <UpvoteIcon className="text-2xl" />
      </button>
    </AuthGuard>
  );
};

export const DomainListItem = ({ domain }: { domain: Domain }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateDomainInCaches = useCallback(
    (domainName: string, updates: Partial<Domain>) => {
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getTrendingDomainsPublic.queryKey() },
        (oldData: TrendingDomainsResponse | undefined) =>
          oldData && {
            ...oldData,
            items: oldData.items.map((item: Domain) =>
              item.domainName === domainName ? { ...item, ...updates } : item,
            ),
          },
      );
      queryClient.setQueriesData(
        { queryKey: trpc.hunt.getTrendingDomains.queryKey() },
        (oldData: TrendingDomainsResponse | undefined) =>
          oldData && {
            ...oldData,
            items: oldData.items.map((item: Domain) =>
              item.domainName === domainName ? { ...item, ...updates } : item,
            ),
          },
      );
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMySubmittedDomains.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.hunt.getMyUpvotedDomains.queryKey(),
      });
    },
    [queryClient, trpc.hunt],
  );

  const upvoteMutation = useMutation(
    trpc.hunt.upvote.mutationOptions({
      onSuccess: () => {
        updateDomainInCaches(domain.domainName, {
          userHasUpvoted: true,
          upvoteCount: domain.upvoteCount + 1,
        });
        toast.success('Thanks for your vote!');
      },
      onError: () => {
        toast.error('Failed to vote. Please try again.');
      },
    }),
  );

  const unvoteMutation = useMutation(
    trpc.hunt.unvote.mutationOptions({
      onSuccess: () => {
        updateDomainInCaches(domain.domainName, {
          userHasUpvoted: false,
          upvoteCount: Math.max(0, domain.upvoteCount - 1),
        });
        toast.success('Vote cancelled.');
      },
      onError: () => {
        toast.error('Failed to cancel vote. Please try again.');
      },
    }),
  );

  const handleUpvote = useCallback(() => {
    upvoteMutation.mutate({
      domainName: domain.domainName,
    });
  }, [domain.domainName, upvoteMutation]);

  const handleUnvote = useCallback(() => {
    unvoteMutation.mutate({
      domainName: domain.domainName,
    });
  }, [domain.domainName, unvoteMutation]);

  const formattedUpvotes = useMemo(
    () => formatNumberWithAbbreviations(domain.upvoteCount),
    [domain.upvoteCount],
  );

  return (
    <div
      className={
        'flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-6 first:rounded-t-xl last:rounded-b-xl hover:bg-accent/30 transition'
      }
    >
      {/* Vote */}
      <div className="flex flex-col items-center w-12 sm:w-16">
        <VoteButton
          voted={domain.userHasUpvoted}
          pending={upvoteMutation.isPending || unvoteMutation.isPending}
          onUpvote={handleUpvote}
          onUnvote={handleUnvote}
        />
        <span className="text-base/8 font-bold text-foreground font-mono">
          {formattedUpvotes}
        </span>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Content */}
        <div className="flex-1 flex flex-col gap-1 sm:gap-2 w-full">
          <Link
            href={`/hunt/domains/${encodeURIComponent(domain.domainName)}`}
            className="text-base sm:text-lg font-semibold text-foreground font-sans hover:text-primary transition-colors"
          >
            {domain.domainName}
          </Link>
          <TagsDisplay tags={domain.tags || []} limit={4} />
        </div>
      </div>
    </div>
  );
};
