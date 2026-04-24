'use client';

import { isPast } from 'date-fns';
import { AutoRenewToggle } from '../auto-renew-toggle';

interface AutoEnsCellProps {
  domainName: string;
  expirationDate: Date | string | null | undefined;
  autoEnsEnabled: boolean;
  isToggling: boolean;
  onToggleAutoEns: (domainName: string, enabled: boolean) => void;
}

export function AutoEnsCell({
  domainName,
  expirationDate,
  autoEnsEnabled,
  isToggling,
  onToggleAutoEns,
}: AutoEnsCellProps) {
  const isExpired = expirationDate ? isPast(new Date(expirationDate)) : false;

  return (
    <div className="flex items-center gap-2">
      <AutoRenewToggle
        checked={autoEnsEnabled}
        onCheckedChange={(checked) => onToggleAutoEns(domainName, checked)}
        disabled={isExpired}
        isLoading={isToggling}
        ariaLabel={`Auto-ENS ${domainName}`}
      />
    </div>
  );
}
