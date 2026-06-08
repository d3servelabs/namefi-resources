'use client';

import Link from 'next/link';
import { safeToUnicode } from '../utils';
import type { DomainRow } from '../types';
import {
  DropdownDomainActionsMenu,
  type ActionsCellProps,
} from './actions-cell';
import { NftPendingBadge } from './nft-pending-badge';

export function DomainNameCell({
  domainName,
  actionMenuProps,
  nftState,
  pendingNftStates,
}: {
  domainName: string;
  actionMenuProps?: ActionsCellProps;
  nftState?: DomainRow['nftState'];
  pendingNftStates?: DomainRow['pendingNftStates'];
}) {
  const unicodeName = safeToUnicode(domainName);
  const isPunycode = unicodeName !== domainName;
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <Link
          href={`/domains/${domainName}?tab=dns-overview`}
          aria-label={`Settings for ${domainName}`}
          className="font-medium hover:underline"
        >
          {unicodeName}
        </Link>
        {isPunycode && (
          <span className="block text-xs text-muted-foreground">
            {domainName}
          </span>
        )}
      </div>
      {nftState ? (
        <NftPendingBadge
          nftState={nftState}
          pendingNftStates={pendingNftStates}
        />
      ) : null}
      {actionMenuProps ? (
        <DropdownDomainActionsMenu {...actionMenuProps} />
      ) : (
        false
      )}
    </div>
  );
}
