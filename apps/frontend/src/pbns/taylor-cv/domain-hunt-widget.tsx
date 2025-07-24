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
import { TrendingUp, Globe, Tag as TagIcon } from 'lucide-react';

export const DomainHuntWidget = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const domainName = 'taylor.cv';

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
  }, [domainData?.userHasUpvoted, upvoteMutation, unvoteMutation]);

  const isVoting = useMemo(
    () => upvoteMutation.isPending || unvoteMutation.isPending,
    [upvoteMutation.isPending, unvoteMutation.isPending],
  );

  usePendingToast(upvoteMutation.isPending, 'Voting...');
  usePendingToast(unvoteMutation.isPending, 'Cancelling vote...');

  return (
    <BackgroundGradient
      containerClassName="p-[3px]"
      className="rounded-[22px] p-6 transition-all duration-300 w-lg md:w-xl max-w-full [background:linear-gradient(to_bottom,#0f172a,#030712)]"
    >
      <div className="flex items-center justify-between gap-30">
        {domainLoading || authLoading ? (
          <>
            <div className="flex flex-col gap-3 flex-1">
              <div className="w-48 h-7 bg-slate-600/50 rounded-lg animate-pulse" />
              <div className="w-40 h-4 bg-slate-600/50 rounded animate-pulse" />
            </div>
            <div className="w-28 h-9 bg-slate-600/50 rounded-lg animate-pulse flex-shrink-0" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <h3 className="text-xl font-bold text-white text-left">
                  {domainName}
                </h3>
              </div>
              {domainData?.tags && domainData.tags.length > 0 && (
                <div className="flex items-center gap-2">
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
                    'group flex items-center gap-2 rounded-lg px-4 py-2 bg-brand-primary/15 border border-transparent text-brand-primary cursor-pointer transition-all duration-200 font-medium text-sm h-9 hover:bg-brand-primary/10',
                    domainData?.userHasUpvoted &&
                      'bg-[rgba(72,229,155,0.08)] text-brand-primary border-brand-primary',
                    isVoting && 'opacity-50 cursor-not-allowed',
                  )}
                  aria-label="Vote"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {isAuthenticated
                      ? domainData?.userHasUpvoted
                        ? 'Voted'
                        : 'Vote'
                      : 'Vote'}
                  </span>
                  {domainData?.upvoteCount !== undefined && (
                    <Badge className="ml-1 text-xs bg-brand-primary text-primary-foreground px-2 py-0.5">
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
