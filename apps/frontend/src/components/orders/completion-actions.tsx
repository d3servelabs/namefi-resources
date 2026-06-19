'use client';

import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { Share2, Settings2, Tag } from 'lucide-react';
import Link from 'next/link';

/**
 * Primary action bar on the redesigned order completion page: Manage · Share ·
 * List for Sale. Stacks full-width on mobile, row on larger screens. "List for
 * Sale" only shows when at least one domain is ready to list (registered +
 * minted) — hidden for import-only orders.
 */
export function CompletionActions({
  manageHref,
  onShare,
  onList,
  canList = false,
  multiple = false,
}: {
  manageHref: string;
  onShare: () => void;
  onList?: () => void;
  canList?: boolean;
  multiple?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:justify-center">
      <NamefiButton
        className="gap-2"
        render={<Link href={manageHref} />}
        nativeButton={false}
      >
        <Settings2 className="h-4 w-4" />
        Manage{multiple ? ' domains' : ''}
      </NamefiButton>

      <NamefiButton
        variant="outline"
        className="gap-2 border-white/10 bg-black/[0.03] hover:bg-white/5"
        onClick={onShare}
      >
        <Share2 className="h-4 w-4" />
        Share
      </NamefiButton>

      {canList ? (
        <NamefiButton
          variant="outline"
          className="gap-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          onClick={onList}
        >
          <Tag className="h-4 w-4" />
          List for Sale
        </NamefiButton>
      ) : null}
    </div>
  );
}
