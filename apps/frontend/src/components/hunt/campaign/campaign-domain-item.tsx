'use client';

import Link from 'next/link';
import { type MouseEvent, useCallback } from 'react';
import { ArrowBigUpIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { type Domain, useHuntVoteCount } from '../domains-list-item';
import { useHuntVoteRow } from '@/hooks/use-hunt-vote-row';
import { VoteOrShareChoiceDialog } from '@/components/dialogs/vote-or-share-choice-dialog';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';

interface Tag {
  id: string;
}

interface TagsDisplayProps {
  tags: Tag[];
  className?: string;
}

export const TagsDisplay = ({ tags, className = '' }: TagsDisplayProps) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex justify-center items-center border border-white/10 rounded-full px-3 py-0.5 text-xs text-white/50 font-semibold font-sans"
        >
          {tag.id.replace(/_/g, ' ')}
        </div>
      ))}
    </div>
  );
};

const VoteButton = ({
  voted,
  pending,
  onUpvote,
  onUnvote,
  count,
}: {
  voted?: boolean;
  pending?: boolean;
  onUpvote?: () => void;
  onUnvote?: () => void;
  count: string;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

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
    <button
      type="button"
      className={cn(
        'flex flex-col justify-center items-center rounded-lg w-14 h-14 cursor-pointer',
        voted
          ? 'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90'
          : 'bg-primary-foreground text-white/70 hover:bg-white/10 hover:text-white',
      )}
      aria-label="Upvote"
      onClick={handleClick}
    >
      <ArrowBigUpIcon className="w-6 h-6 fill-current" />
      <span className="text-sm font-semibold font-sans leading-none">
        {count}
      </span>
    </button>
  );
};

interface CampaignDomainItemProps {
  domain: Domain;
}

export const CampaignDomainItem = ({ domain }: CampaignDomainItemProps) => {
  const { upvote, unvote, isVotePending, choiceDialog, shareDialog } =
    useHuntVoteRow({
      domain: domain.domainName,
    });
  const { count } = useHuntVoteCount({
    domain,
  });

  return (
    <>
      <div className="flex justify-between gap-4 p-4 hover:bg-brand-primary/5 rounded-xl">
        {/* Rank */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-lg font-semibold text-4xl ${
            domain.rank === 1
              ? 'bg-clip-text text-transparent bg-gradient-to-b from-[#F9EA95] to-[#DFB357]'
              : domain.rank === 2
                ? 'bg-clip-text text-transparent bg-gradient-to-b from-[#A4B4CC] to-[#6989A7]'
                : domain.rank === 3
                  ? 'bg-clip-text text-transparent bg-gradient-to-b from-[#E1C0AD] to-[#9A6E55]'
                  : 'text-white'
          }`}
        >
          {domain.rank}
        </div>

        {/* Domain Info */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center">
            <Link
              href={`/hunt/domains/${encodeURIComponent(domain.domainName)}`}
            >
              <h3 className="text-2xl font-semibold text-white cursor-pointer">
                {domain.domainName}
              </h3>
            </Link>
          </div>
          <p className="text-white/70 text-base mb-3 break-all">
            {domain.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <TagsDisplay tags={domain.tags || []} />
          </div>
        </div>

        {/* Vote Button */}
        <div className="flex flex-col items-center gap-2">
          <VoteButton
            voted={domain.userHasUpvoted}
            pending={isVotePending}
            onUpvote={upvote}
            onUnvote={unvote}
            count={count}
          />
        </div>
      </div>
      {/* Vote or Share Choice Dialog */}
      <VoteOrShareChoiceDialog
        isOpen={choiceDialog.isOpen}
        onClose={choiceDialog.onClose}
        domainName={choiceDialog.currentDomain || domain.domainName}
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
        trackShares={true}
        campaignKey={shareDialog.campaignKey}
      />
    </>
  );
};
