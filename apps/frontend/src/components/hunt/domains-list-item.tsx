'use client';

import { cn } from '@/lib/cn';
import { formatNumberWithAbbreviations } from '@/lib/number';

import Link from 'next/link';
import { type MouseEvent, useCallback, useMemo } from 'react';
import { TagsDisplay } from './tags-display';
import { UpvoteIcon } from './upvote-icon';
import { usePendingToast } from '../../hooks/use-pending-toast';
import { useHuntVoteRow } from '@/hooks/use-hunt-vote-row';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type Domain = {
  domainName: NamefiNormalizedDomain;
  upvoteCount: number;
  isPinned: boolean;
  rank?: number;
  firstSubmitDate?: Date;
  lastUpvoteDate?: Date;
  reason?: string | null;
  awardedAt?: Date;
  userHasUpvoted?: boolean;
  tags?: { id: string }[];
};

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
  );
};

/**
 * Component for rendering a single domain item in a list.
 */
export const DomainsListItem = ({ domain }: { domain: Domain }) => {
  const { huntVote, isBusy } = useHuntVoteRow(domain.domainName);

  const handleUpvote = useCallback(() => {
    huntVote.vote(domain.domainName);
  }, [domain.domainName, huntVote]);

  const handleUnvote = useCallback(() => {
    huntVote.unvote(domain.domainName);
  }, [domain.domainName, huntVote]);

  const formattedUpvotes = useMemo(
    () => formatNumberWithAbbreviations(domain.upvoteCount),
    [domain.upvoteCount],
  );

  return (
    <div
      className={
        'flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 py-6 sm:py-8 first:rounded-t-xl last:rounded-b-xl hover:bg-accent/30 transition'
      }
    >
      <div className="flex items-center gap-2 w-20 sm:w-24 justify-center border-r border-border px-4 sm:px-6">
        <span
          className={cn(
            'text-lg/8 font-bold text-foreground/40 font-mono italic',
            domain.rank === 1 && 'text-brand-primary',
            domain.rank === 2 && 'text-brand-primary/80',
            domain.rank === 3 && 'text-brand-primary/60',
          )}
        >
          {domain.rank ? (domain.rank < 100 ? `#${domain.rank}` : '99+') : '-'}
        </span>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Content */}
        <div className="flex-1 flex flex-col gap-1 sm:gap-2 w-full">
          <Link
            href={`/hunt/domains/${encodeURIComponent(domain.domainName)}`}
            className="text-base sm:text-lg text-left font-semibold text-foreground font-sans hover:text-primary transition-colors"
          >
            {domain.domainName}
          </Link>
          <TagsDisplay tags={domain.tags || []} limit={4} />
        </div>
      </div>
      {/* Vote */}
      <div className="flex flex-col items-center gap-2 w-12 sm:w-16">
        <VoteButton
          voted={domain.userHasUpvoted}
          pending={isBusy}
          onUpvote={handleUpvote}
          onUnvote={handleUnvote}
        />
        <span className="text-base leading-none font-bold text-foreground font-mono">
          {formattedUpvotes}
        </span>
      </div>
    </div>
  );
};
