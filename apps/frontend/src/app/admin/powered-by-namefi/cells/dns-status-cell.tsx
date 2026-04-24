'use client';

import { memo, useEffect, useState } from 'react';
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

type ChipKey = 'apex' | 'io' | 'dev';
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

// One-liner describing what each surface is. Surfaces the dialog's
// per-card detail in a compact hover so admins don't have to open
// the DNS Configuration modal just to recall which chip is which.
const CHIP_DESCRIPTION: Record<ChipKey, string> = {
  apex: 'The PBN parent itself (e.g. example.com). Needs a Vercel project domain plus an A record so Vercel can serve the apex.',
  io: 'Namefi-hosted mirror on the namefi.io zone (e.g. example.com.astra.namefi.io). Preview URL owned by Namefi; lets admins reach the site even before the customer apex DNS is live.',
  dev: 'Namefi-hosted mirror on the namefi.dev zone (e.g. example.com.astra.namefi.dev). Same purpose as IO, but on the dev zone used for internal/preview deploys.',
};

const STATE_EXPLANATION: Record<ChipState, string> = {
  verified:
    'Configured end-to-end: Vercel recognizes the domain and DNS points correctly.',
  pending:
    'Partially set up — one of Vercel project registration or DNS records is in place but the other is missing or not verified yet.',
  'not-configured':
    'Nothing is wired up on this surface yet. Use the DNS Configuration dialog to provision it.',
  na: 'Not applicable. Vercel rejects single-label (TLD-only) apex names, so the mirror subdomains are the only usable surface.',
  unknown:
    'Status could not be fetched. Try reopening the page or the DNS Configuration dialog.',
};

// Delays react-query `enabled=true` by `index * stepMs` ms so 25 rows don't
// all fire their status query in the same animation frame. Only used for
// the FIRST-PAINT fan-out; cache hits short-circuit the delay (see
// DnsStatusCell render logic, which prefers `query.data` over `enabled`).
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
  chip,
  label,
  state,
  sectionMessage,
}: {
  chip: ChipKey;
  label: string;
  state: ChipState;
  sectionMessage?: string;
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
        <TooltipContent className="max-w-[32ch]">
          <p className="text-xs">
            <span className="font-medium">{label}:</span> {STATE_LABEL[state]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {CHIP_DESCRIPTION[chip]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {STATE_EXPLANATION[state]}
          </p>
          {/*
            Surface the backend-supplied detail line. Suppress only for
            the 'na' state, where it carries no useful detail; for
            'unknown' we WANT to show the error reason so admins see
            why the chip isn't resolving.
          */}
          {sectionMessage && state !== 'na' ? (
            <p className="text-xs mt-1 italic">{sectionMessage}</p>
          ) : null}
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

function DnsStatusCellImpl({
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
        // Prefer any cached data from a prior visit / the DNS
        // Configuration dialog — avoids the Skeleton flash when the
        // user paginates or the table refetches after a mutation.
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    ),
  );

  const entry = query.data?.setupStatus?.[0];

  // If we have data (cached OR fresh), render immediately. The stagger's
  // `enabled=false` window is invisible for any row we've seen before.
  if (entry) {
    const apexState: ChipState = entry.vercelApplicable
      ? deriveSectionState(entry.apexDomain)
      : 'na';
    const ioState = deriveSectionState(entry.namefiIoSubdomain);
    const devState = deriveSectionState(entry.namefiDevSubdomain);

    return (
      <div className="flex items-center gap-1">
        <StatusChip
          chip="apex"
          label="Apex"
          state={apexState}
          sectionMessage={entry.apexDomain.message}
        />
        <StatusChip
          chip="io"
          label="IO"
          state={ioState}
          sectionMessage={entry.namefiIoSubdomain.message}
        />
        <StatusChip
          chip="dev"
          label="Dev"
          state={devState}
          sectionMessage={entry.namefiDevSubdomain.message}
        />
      </div>
    );
  }

  // No data yet. Either the query errored (setupStatus === null),
  // the response had an empty setupStatus (null OR []), or the
  // stagger hasn't let the query fire. Error cases surface a muted
  // "Unknown"; otherwise show the loading skeleton.
  const setupStatusIsEmpty =
    query.data !== undefined &&
    (!query.data.setupStatus || query.data.setupStatus.length === 0);
  if (query.isError || setupStatusIsEmpty) {
    const sectionMessage = query.isError
      ? (query.error?.message ?? 'Status check failed')
      : 'Backend returned no setup status';
    return (
      <div className="flex items-center gap-1">
        <StatusChip
          chip="apex"
          label="Apex"
          state="unknown"
          sectionMessage={sectionMessage}
        />
        <StatusChip
          chip="io"
          label="IO"
          state="unknown"
          sectionMessage={sectionMessage}
        />
        <StatusChip
          chip="dev"
          label="Dev"
          state="unknown"
          sectionMessage={sectionMessage}
        />
      </div>
    );
  }

  return <LoadingChips />;
}

export const DnsStatusCell = memo(
  DnsStatusCellImpl,
  (prev, curr) => prev.normalizedDomainName === curr.normalizedDomainName,
);
