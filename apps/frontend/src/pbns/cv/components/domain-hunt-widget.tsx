'use client';

import { Badge } from '@/components/ui/shadcn/badge';

import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { useCallback } from 'react';
import { TagsDisplay } from '@/components/hunt/tags-display';
import { cn } from '@/lib/cn';
import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient';
import { TrendingUp, Globe } from 'lucide-react';
import { useHuntVoteRow } from '@/hooks/use-hunt-vote-row';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

interface DomainHuntWidgetProps {
  /** The domain name to display and vote on */
  domainName: NamefiNormalizedDomain;
}

export const DomainHuntWidget = ({ domainName }: DomainHuntWidgetProps) => {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { huntVote, isBusy } = useHuntVoteRow(domainName);

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

  const handleVoteToggle = useCallback(() => {
    huntVote.toggleVote(domainName, domainData?.userHasUpvoted || false);
  }, [domainData?.userHasUpvoted, huntVote, domainName]);

  usePendingToast(isBusy, 'Processing vote...');

  return (
    <BackgroundGradient
      containerClassName="p-[2px] md:p-[3px] max-w-full"
      className="rounded-[22px] p-4 py-6 sm:p-6 transition-all duration-300 w-full max-w-full md:w-lg lg:w-xl [background:linear-gradient(to_bottom,#0f172a,#030712)]"
    >
      <div className="flex items-center justify-between gap-6 md:gap-6 max-w-full">
        {domainLoading || authLoading ? (
          <>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div className="w-32 md:w-48 h-6 md:h-7 bg-slate-600/50 rounded-lg animate-pulse" />
              <div className="w-24 md:w-40 h-4 bg-slate-600/50 rounded animate-pulse hidden md:block" />
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
              <button
                type="button"
                onClick={handleVoteToggle}
                disabled={isBusy}
                className={cn(
                  'group flex items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2 bg-brand-primary/15 border border-transparent text-brand-primary cursor-pointer transition-all duration-200 font-medium text-xs md:text-sm h-8 md:h-9 hover:bg-brand-primary/10',
                  domainData?.userHasUpvoted &&
                    'bg-[rgba(72,229,155,0.08)] text-brand-primary border-brand-primary',
                  isBusy && 'opacity-50 cursor-not-allowed',
                )}
                aria-label="Vote"
              >
                <TrendingUp className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                <span>{domainData?.userHasUpvoted ? 'Voted' : 'Upvote'}</span>
                {domainData?.upvoteCount !== undefined && (
                  <Badge className="ml-0.5 md:ml-1 text-xs bg-brand-primary text-primary-foreground px-1.5 md:px-2 py-0.5 flex-shrink-0">
                    {domainData.upvoteCount}
                  </Badge>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </BackgroundGradient>
  );
};
