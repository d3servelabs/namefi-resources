'use client';

import { Badge } from '@/components/ui/shadcn/badge';

import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { useCallback } from 'react';
import { TagsDisplay } from '@/components/hunt/tags-display';
import { cn } from '@/lib/cn';
import { TrendingUp, Globe, Share2 } from 'lucide-react';
import {
  type HuntVoteRowOptions,
  useHuntVoteRow,
} from '@/hooks/use-hunt-vote-row';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import { VoteOrShareChoiceDialog } from '@/components/dialogs/vote-or-share-choice-dialog';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { motion, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';

interface DomainHuntWidgetProps extends Omit<HuntVoteRowOptions, 'domain'> {
  /** The domain name to display and vote on */
  domainName: NamefiNormalizedDomain;
}

export const DomainHuntWidget = ({
  domainName,
  shareConfig,
}: DomainHuntWidgetProps) => {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // Row vote hook for individual domain (widget context)
  const { toggleVote, isVotePending, choiceDialog, shareDialog } =
    useHuntVoteRow({ domain: domainName, shareConfig });

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
    toggleVote(domainData?.userHasUpvoted || false);
  }, [toggleVote, domainData?.userHasUpvoted]);

  const handleShareClick = useCallback(() => {
    shareDialog.openDialog(domainName);
  }, [shareDialog, domainName]);

  usePendingToast(isVotePending, 'Processing vote...');

  const isLoading = domainLoading || authLoading;

  return (
    <div className="relative p-[2px] rounded-[22px] bg-gradient-to-r from-cyan-500 to-teal-500">
      <div className="rounded-[22px] p-4 py-6 sm:p-6 transition-all duration-300 w-full max-w-full md:w-lg lg:w-xl bg-gray-900/90 backdrop-blur-sm">
        {/* Fixed height container to prevent layout shift - account for tags on desktop only */}
        <div className="flex items-center justify-between gap-6 md:gap-6 max-w-full min-h-[48px] md:min-h-[56px]">
          {/* Domain name - always visible, never animated */}
          <div className="flex flex-col gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="h-4 md:h-5 w-4 md:w-5 text-cyan-400 flex-shrink-0" />
              <h3 className="text-lg md:text-xl font-bold text-white text-left truncate">
                {domainName}
              </h3>
            </div>

            {/* Tags section with loading/content states */}
            <div className="hidden md:flex items-center gap-2 min-w-0 h-4">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="tags-loading"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="w-16 h-3 bg-slate-600/30 rounded-full"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="w-12 h-3 bg-slate-600/30 rounded-full"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                        delay: 0.15,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="tags-content"
                    className="flex items-center gap-2 min-w-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {domainData?.tags && domainData.tags.length > 0 && (
                      <TagsDisplay
                        tags={domainData.tags}
                        limit={4}
                        className="text-sm"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Vote and Share buttons - persistent with animated states */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              type="button"
              onClick={handleVoteToggle}
              disabled={isLoading || isVotePending}
              className={cn(
                'group flex items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2 font-medium text-xs md:text-sm h-8 md:h-9 text-cyan-400 cursor-pointer bg-cyan-500/15 hover:bg-cyan-500/25 transition-colors duration-200',
                (isLoading || isVotePending) && 'opacity-80 cursor-not-allowed',
              )}
              aria-label={isLoading ? 'Loading vote data...' : 'Vote'}
              layout
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
                layout: {
                  type: 'spring',
                  damping: 22,
                  stiffness: 250,
                },
              }}
            >
              <TrendingUp className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
              <span>
                {isLoading
                  ? 'Upvote'
                  : domainData?.userHasUpvoted
                    ? 'Voted'
                    : 'Upvote'}
              </span>

              {/* Vote count section */}
              {domainData?.upvoteCount !== undefined || isLoading ? (
                <motion.div
                  className="ml-0.5 md:ml-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <Badge className="text-xs bg-cyan-500 text-white px-1.5 md:px-2 py-0.5">
                    <NumberFlow
                      value={
                        isLoading
                          ? 0
                          : isAuthenticated
                            ? (domainData?.upvoteCount ?? 0)
                            : (domainData?.upvoteCount ?? 0)
                      }
                      animated={true}
                    />
                  </Badge>
                </motion.div>
              ) : null}
            </motion.button>

            {/* Share button */}
            <motion.button
              type="button"
              onClick={handleShareClick}
              disabled={isLoading}
              className={cn(
                'group flex items-center justify-center rounded-lg p-2 font-medium text-xs md:text-sm h-8 md:h-9 w-8 md:w-9 text-slate-400 cursor-pointer bg-slate-700/20 hover:bg-slate-600/30 hover:text-slate-300 transition-colors duration-200',
                isLoading && 'opacity-80 cursor-not-allowed',
              )}
              aria-label="Share"
              layout
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
                layout: {
                  type: 'spring',
                  damping: 22,
                  stiffness: 250,
                },
              }}
            >
              <Share2 className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Vote or Share Choice Dialog */}
      <VoteOrShareChoiceDialog
        isOpen={choiceDialog.isOpen}
        onClose={choiceDialog.onClose}
        domainName={choiceDialog.currentDomain || domainName}
        onChooseLogin={choiceDialog.onChooseLogin}
        onChooseShare={choiceDialog.onChooseShare}
      />

      {/* Twitter Share Dialog */}
      <TwitterShareDialog
        isOpen={shareDialog.isOpen}
        onClose={shareDialog.onClose}
        domainName={shareDialog.currentDomain}
        shareUrl={shareDialog.shareUrl}
        hasShared={shareDialog.hasShared}
        isCheckingStatus={shareDialog.isCheckingStatus}
        isSubmitting={shareDialog.isSubmitting}
        onSubmit={shareDialog.onSubmit}
        trackShares={true} // bespoke domains track shares for rewards
        campaignKey={shareDialog.campaignKey}
        featureKey="hunt"
      />
    </div>
  );
};
