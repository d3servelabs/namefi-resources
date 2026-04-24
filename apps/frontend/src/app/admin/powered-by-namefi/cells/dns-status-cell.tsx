'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useTRPC } from '@/lib/trpc';
import type { AppRouterOutput } from '@/lib/trpc';

type SetupStatusEntry = NonNullable<
  AppRouterOutput['admin']['poweredByNamefi']['getPoweredByNamefiDomainStatus']['setupStatus']
>[number];

type ChipState = 'verified' | 'pending' | 'not-configured' | 'na' | 'unknown';

const STATE_VARIANT: Record<
  ChipState,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  verified: 'default',
  pending: 'secondary',
  'not-configured': 'destructive',
  na: 'outline',
  unknown: 'outline',
};

const STATE_LABEL: Record<ChipState, string> = {
  verified: 'Verified',
  pending: 'Pending',
  'not-configured': 'Not Configured',
  na: 'N/A',
  unknown: 'Unknown',
};

const STATE_CLASS: Partial<Record<ChipState, string>> = {
  pending: 'text-amber-600 bg-amber-500/10',
  na: 'text-muted-foreground',
  unknown: 'text-muted-foreground',
};

// Delays react-query `enabled=true` by `index * stepMs` ms so 25 rows don't
// all fire their status query in the same animation frame. Keeps the Vercel
// and GCP-DNS fan-out friendlier to rate limits without adding a dep.
function useStaggeredEnabled(index: number, stepMs = 100): boolean {
  const [enabled, setEnabled] = useState(index === 0);
  useEffect(() => {
    if (index === 0) return;
    const handle = window.setTimeout(() => setEnabled(true), index * stepMs);
    return () => window.clearTimeout(handle);
  }, [index, stepMs]);
  return enabled;
}

function deriveSectionState(
  section: SetupStatusEntry['apexDomain'],
): ChipState {
  const fullyConfigured =
    section.vercelIsSetup &&
    section.vercelIsVerified &&
    section.recordsAreSetup;
  if (fullyConfigured) return 'verified';
  if (section.vercelIsSetup || section.recordsAreSetup) return 'pending';
  return 'not-configured';
}

function StatusChip({
  label,
  state,
  tooltip,
}: {
  label: string;
  state: ChipState;
  tooltip: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <span {...props}>
              <Badge
                variant={STATE_VARIANT[state]}
                className={STATE_CLASS[state]}
              >
                {label}
                <span className="sr-only">: {STATE_LABEL[state]}</span>
              </Badge>
            </span>
          )}
        />
        <TooltipContent>
          <p className="text-xs">
            <span className="font-medium">{label}:</span> {STATE_LABEL[state]}
          </p>
          <p className="text-xs text-muted-foreground max-w-[28ch]">
            {tooltip}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LoadingChips() {
  return (
    <div className="flex items-center gap-1">
      <Skeleton className="h-5 w-12 rounded-4xl" />
      <Skeleton className="h-5 w-8 rounded-4xl" />
      <Skeleton className="h-5 w-10 rounded-4xl" />
    </div>
  );
}

export function DnsStatusCell({
  normalizedDomainName,
  index,
}: {
  normalizedDomainName: string;
  index: number;
}) {
  const trpc = useTRPC();
  const enabled = useStaggeredEnabled(index);

  const query = useQuery(
    trpc.admin.poweredByNamefi.getPoweredByNamefiDomainStatus.queryOptions(
      { normalizedDomainName },
      {
        enabled,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
      },
    ),
  );

  if (!enabled || query.isLoading) {
    return <LoadingChips />;
  }

  const entry = query.data?.setupStatus?.[0];

  if (query.isError || !entry) {
    const tooltip = query.isError
      ? (query.error?.message ?? 'Status check failed')
      : 'Status is not available yet';
    return (
      <div className="flex items-center gap-1">
        <StatusChip label="Apex" state="unknown" tooltip={tooltip} />
        <StatusChip label="IO" state="unknown" tooltip={tooltip} />
        <StatusChip label="Dev" state="unknown" tooltip={tooltip} />
      </div>
    );
  }

  const apexState: ChipState = entry.vercelApplicable
    ? deriveSectionState(entry.apexDomain)
    : 'na';
  const ioState = deriveSectionState(entry.namefiIoSubdomain);
  const devState = deriveSectionState(entry.namefiDevSubdomain);

  const apexTooltip =
    apexState === 'na'
      ? 'Vercel apex setup is not applicable for single-label (TLD-only) parents.'
      : entry.apexDomain.message;

  return (
    <div className="flex items-center gap-1">
      <StatusChip label="Apex" state={apexState} tooltip={apexTooltip} />
      <StatusChip
        label="IO"
        state={ioState}
        tooltip={entry.namefiIoSubdomain.message}
      />
      <StatusChip
        label="Dev"
        state={devState}
        tooltip={entry.namefiDevSubdomain.message}
      />
    </div>
  );
}
