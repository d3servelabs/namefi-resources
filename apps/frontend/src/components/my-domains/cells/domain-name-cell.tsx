'use client';

import Link from 'next/link';
import { safeToUnicode } from '../utils';
import {
  DropdownDomainActionsMenu,
  type ActionsCellProps,
} from './actions-cell';

export function DomainNameCell({
  domainName,
  actionMenuProps,
}: {
  domainName: string;
  actionMenuProps?: ActionsCellProps;
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
      {actionMenuProps ? (
        <DropdownDomainActionsMenu {...actionMenuProps} />
      ) : (
        false
      )}
    </div>
  );
}
