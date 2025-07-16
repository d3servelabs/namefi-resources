'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Monitor } from 'lucide-react';
import { useCallback, useMemo } from 'react';

interface DnsRecordsEmptyStateProps {
  onSwitchNameservers: () => void;
}

export function DnsRecordsEmptyState({
  onSwitchNameservers,
}: DnsRecordsEmptyStateProps) {
  // Memoize the click handler
  const handleClick = useCallback(() => {
    onSwitchNameservers();
  }, [onSwitchNameservers]);

  // Memoize the button content
  const buttonContent = useMemo(
    () => (
      <>
        <span className="mr-2">↻</span> Switch to Namefi nameservers
      </>
    ),
    [],
  );

  // Memoize the description text
  const descriptionText = useMemo(
    () => (
      <>
        <p className="text-zinc-400 text-center mb-1">
          Your DNS records can&apos;t be displayed because your nameservers
          aren&apos;t set to us.
        </p>
        <p className="text-zinc-400 text-center mb-6">
          Switch to Namefi nameservers to manage them.
        </p>
      </>
    ),
    [],
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Monitor className="h-16 w-16 text-zinc-700 mb-6" strokeWidth={1.5} />
      <h2 className="text-xl font-semibold mb-2">
        DNS Management Requires Namefi Nameservers
      </h2>
      {descriptionText}
      <Button
        onClick={handleClick}
        className="bg-brand-primary-500 hover:bg-brand-primary-600 text-secondary-foreground"
      >
        {buttonContent}
      </Button>
    </div>
  );
}
