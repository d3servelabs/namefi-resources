'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { AuthGuard } from '@/components/dialogs/auth-required-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { TagsDisplay } from '@/components/hunt/tags-display';
import { cn } from '@/lib/cn';
import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient';
import { TrendingUp, Globe } from 'lucide-react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';

interface DomainHuntWidgetProps {
  /** The domain name to display and vote on */
  domainName: string;
}

export const DomainHuntWidget = ({ domainName }: DomainHuntWidgetProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const authQuery = useQuery({
    ...trpc.hunt.getDomainDetail.queryOptions({
      domainName,
    }),
    enabled: isAuthenticated,
  });

  const publicQuery = useQuery({
    ...trpc.hunt.getDomainDetailPublic.queryOptions({
      domainName,
    }),
    enabled: !isAuthenticated,
  });

  const domainData = isAuthenticated ? authQuery.data : publicQuery.data;
  const domainLoading = isAuthenticated
    ? authQuery.isLoading
    : publicQuery.isLoading;

  const upvoteMutation = useMutation(
    trpc.hunt.upvote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success('Thanks for your vote!');
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.Vote,
          properties: {
            domain_name: domainName,
            action: 'add',
          },
        });
      },
      onError: () => {
        toast.error('Failed to vote. Please try again.');
      },
    }),
  );

  const unvoteMutation = useMutation(
    trpc.hunt.unvote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success('Vote cancelled.');
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.Vote,
          properties: {
            domain_name: domainName,
            action: 'remove',
          },
        });
      },
      onError: () => {
        toast.error('Failed to cancel vote. Please try again.');
      },
    }),
  );

  const handleVoteToggle = useCallback(() => {
    if (domainData?.userHasUpvoted) {
      unvoteMutation.mutate({ domainName });
    } else {
      upvoteMutation.mutate({ domainName });
    }
  }, [domainData?.userHasUpvoted, upvoteMutation, unvoteMutation, domainName]);

  const isVoting = useMemo(
    () => upvoteMutation.isPending || unvoteMutation.isPending,
    [upvoteMutation.isPending, unvoteMutation.isPending],
  );

  usePendingToast(upvoteMutation.isPending, 'Voting...');
  usePendingToast(unvoteMutation.isPending, 'Cancelling vote...');

  return (
    <BackgroundGradient
      containerClassName="p-[3px] max-w-full"
      className="rounded-[22px] p-4 sm:p-6 transition-all duration-300 w-full md:w-lg lg:w-xl max-w-full [background:linear-gradient(to_bottom,#0f172a,#030712)]"
    >
      <div className="flex items-center justify-between gap-3 md:gap-6 max-w-full">
        {domainLoading || authLoading ? (
          <>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div className="w-32 md:w-48 h-6 md:h-7 bg-slate-600/50 rounded-lg animate-pulse" />
              <div className="w-24 md:w-40 h-4 bg-slate-600/50 rounded animate-pulse" />
            </div>
            <div className="w-20 md:w-28 h-8 md:h-9 bg-slate-600/50 rounded-lg animate-pulse flex-shrink-0" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 md:gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="h-4 md:h-5 w-4 md:w-5 text-slate-400 flex-shrink-0" />
                <h3 className="text-lg md:text-xl font-bold text-white text-left truncate">
                  {domainName}
                </h3>
              </div>
              {domainData?.tags && domainData.tags.length > 0 && (
                <div className="hidden md:flex items-center gap-2 min-w-0">
                  <TagsDisplay
                    tags={domainData.tags}
                    limit={4}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center flex-shrink-0">
              <AuthGuard
                title="Sign in to vote"
                description="You need to sign in to vote for domains. Join the community to discover and vote for the best domains!"
              >
                <button
                  type="button"
                  onClick={handleVoteToggle}
                  disabled={isVoting}
                  className={cn(
                    'group flex items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2 bg-brand-primary/15 border border-transparent text-brand-primary cursor-pointer transition-all duration-200 font-medium text-xs md:text-sm h-8 md:h-9 hover:bg-brand-primary/10',
                    domainData?.userHasUpvoted &&
                      'bg-[rgba(72,229,155,0.08)] text-brand-primary border-brand-primary',
                    isVoting && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-label="Vote"
                >
                  <TrendingUp className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                  <span className="hidden md:inline">
                    {isAuthenticated
                      ? domainData?.userHasUpvoted
                        ? 'Voted'
                        : 'Vote'
                      : 'Vote'}
                  </span>
                  {domainData?.upvoteCount !== undefined && (
                    <Badge className="ml-0.5 md:ml-1 text-xs bg-brand-primary text-primary-foreground px-1.5 md:px-2 py-0.5 flex-shrink-0">
                      {domainData.upvoteCount}
                    </Badge>
                  )}
                </button>
              </AuthGuard>
            </div>
          </>
        )}
      </div>
    </BackgroundGradient>
  );
};
