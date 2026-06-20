'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';

type ClickRow = {
  campaignKey: string;
  groupIdentifier: string;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type OpenRow = {
  campaignKey: string;
  openCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type CampaignAggregate = {
  campaignKey: string;
  openCount: number;
  totalClickCount: number;
  distinctLinkCount: number;
  lastActivityAt: Date | null;
  links: ClickRow[];
};

type SortKey = 'opens' | 'clicks' | 'links' | 'recent' | 'key';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most recent activity',
  opens: 'Opens (high → low)',
  clicks: 'Clicks (high → low)',
  links: 'Distinct links (high → low)',
  key: 'Campaign key (A → Z)',
};

export function EmailEngagementDashboard() {
  const trpc = useTRPC();
  const query = useQuery({
    ...trpc.admin.emailCampaigns.listCampaignEngagement.queryOptions(),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounceValue(
    searchTerm.trim().toLowerCase(),
    200,
  );
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const aggregates = useMemo(
    () => buildAggregates(query.data?.opens ?? [], query.data?.clicks ?? []),
    [query.data?.opens, query.data?.clicks],
  );

  const filtered = useMemo(() => {
    if (!debouncedSearch) return aggregates;
    return aggregates.filter((a) =>
      a.campaignKey.toLowerCase().includes(debouncedSearch),
    );
  }, [aggregates, debouncedSearch]);

  const sorted = useMemo(
    () => sortAggregates(filtered, sortKey),
    [filtered, sortKey],
  );

  const totals = useMemo(() => sumTotals(aggregates), [aggregates]);

  return (
    <PageShell padding="admin" size="wide">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Email engagement</h1>
          <p className="text-muted-foreground text-sm">
            Per-campaign opens and per-link clicks, aggregated from{' '}
            <code className="font-mono text-xs">email_campaign_opens</code> and{' '}
            <code className="font-mono text-xs">email_campaign_clicks</code>.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin me-2" />
          ) : (
            <RefreshCw className="h-4 w-4 me-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Campaigns" value={totals.campaigns} />
        <SummaryCard label="Total opens" value={totals.opens} />
        <SummaryCard label="Total clicks" value={totals.clicks} />
        <SummaryCard label="Tracked links" value={totals.links} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-end justify-between gap-3 flex-wrap space-y-0">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              One row per campaign key. Click a row to see per-link click
              breakdown.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by campaign key…"
              aria-label="Filter campaigns by key"
              className="h-9 w-[220px]"
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
              aria-label="Sort campaigns"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState message={query.error?.message ?? 'Failed to load.'} />
          ) : sorted.length === 0 ? (
            <EmptyState
              hasData={aggregates.length > 0}
              filterActive={Boolean(debouncedSearch)}
            />
          ) : (
            <CampaignsTable
              rows={sorted}
              expanded={expanded}
              onToggle={(key) =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) {
                    next.delete(key);
                  } else {
                    next.add(key);
                  }
                  return next;
                })
              }
            />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function buildAggregates(
  opens: OpenRow[],
  clicks: ClickRow[],
): CampaignAggregate[] {
  const byKey = new Map<string, CampaignAggregate>();
  const ensure = (campaignKey: string): CampaignAggregate => {
    let entry = byKey.get(campaignKey);
    if (!entry) {
      entry = {
        campaignKey,
        openCount: 0,
        totalClickCount: 0,
        distinctLinkCount: 0,
        lastActivityAt: null,
        links: [],
      };
      byKey.set(campaignKey, entry);
    }
    return entry;
  };

  for (const row of opens) {
    const entry = ensure(row.campaignKey);
    entry.openCount += row.openCount;
    entry.lastActivityAt = maxDate(entry.lastActivityAt, row.updatedAt);
  }

  for (const row of clicks) {
    const entry = ensure(row.campaignKey);
    entry.totalClickCount += row.clickCount;
    entry.lastActivityAt = maxDate(entry.lastActivityAt, row.updatedAt);
    // Defensive merge by `groupIdentifier`: the DB UNIQUE constraint on
    // `(campaign_key, group_identifier)` should already guarantee one
    // row per unique link, but in case the backend ever returns
    // duplicates (e.g. a future join) we collapse them so
    // `distinctLinkCount` and the per-link table stay correct and React
    // doesn't see duplicate keys.
    const existing = entry.links.find(
      (link) => link.groupIdentifier === row.groupIdentifier,
    );
    if (existing) {
      existing.clickCount += row.clickCount;
      existing.createdAt =
        existing.createdAt.getTime() <= row.createdAt.getTime()
          ? existing.createdAt
          : row.createdAt;
      const merged = maxDate(existing.updatedAt, row.updatedAt);
      if (merged) existing.updatedAt = merged;
    } else {
      entry.links.push({ ...row });
      entry.distinctLinkCount += 1;
    }
  }

  for (const entry of byKey.values()) {
    entry.links.sort((a, b) => b.clickCount - a.clickCount);
  }

  return Array.from(byKey.values());
}

function sortAggregates(
  rows: CampaignAggregate[],
  sortKey: SortKey,
): CampaignAggregate[] {
  const copy = [...rows];
  switch (sortKey) {
    case 'opens':
      copy.sort((a, b) => b.openCount - a.openCount);
      break;
    case 'clicks':
      copy.sort((a, b) => b.totalClickCount - a.totalClickCount);
      break;
    case 'links':
      copy.sort((a, b) => b.distinctLinkCount - a.distinctLinkCount);
      break;
    case 'key':
      copy.sort((a, b) => a.campaignKey.localeCompare(b.campaignKey));
      break;
    case 'recent':
      copy.sort((a, b) => {
        const av = a.lastActivityAt?.getTime() ?? 0;
        const bv = b.lastActivityAt?.getTime() ?? 0;
        return bv - av;
      });
      break;
  }
  return copy;
}

function sumTotals(rows: CampaignAggregate[]) {
  return rows.reduce(
    (acc, row) => {
      acc.opens += row.openCount;
      acc.clicks += row.totalClickCount;
      acc.links += row.distinctLinkCount;
      return acc;
    },
    { campaigns: rows.length, opens: 0, clicks: 0, links: 0 },
  );
}

function maxDate(a: Date | null, b: Date | null): Date | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

// ---------------------------------------------------------------------------
// Shared per-cell rendering / formatters. Both the desktop table rows and the
// mobile cards render from these helpers so the two layouts can never drift —
// one source of truth for campaign key, counts, the last-activity timestamp,
// and the per-link click breakdown.
// ---------------------------------------------------------------------------

const formatCount = (value: number) => value.toLocaleString();

const formatTimestamp = (value: Date | null) =>
  value ? format(value, 'yyyy-MM-dd HH:mm') : '—';

function CampaignKeyCell({ campaignKey }: { campaignKey: string }) {
  return <span className="font-mono text-xs break-all">{campaignKey}</span>;
}

function GroupIdentifierCell({ groupIdentifier }: { groupIdentifier: string }) {
  if (groupIdentifier) {
    return <span className="font-mono break-all">{groupIdentifier}</span>;
  }
  return (
    <Badge variant="outline" className="font-normal text-[10px]">
      untagged
    </Badge>
  );
}

/** Per-link click breakdown — shared by the desktop expanded row and the card. */
function PerLinkBreakdown({ row }: { row: CampaignAggregate }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        Per-link clicks ({row.links.length})
      </div>
      <div className="flex flex-col gap-2">
        {row.links.map((link) => (
          <div
            key={`${link.campaignKey}::${link.groupIdentifier}`}
            className="rounded-md border border-border/50 px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <GroupIdentifierCell groupIdentifier={link.groupIdentifier} />
              <span className="tabular-nums font-medium">
                {formatCount(link.clickCount)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              First {formatTimestamp(link.createdAt)} · Last{' '}
              {formatTimestamp(link.updatedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignsTable({
  rows,
  expanded,
  onToggle,
}: {
  rows: CampaignAggregate[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile: a vertical stack of cards built from the SAME aggregated rows as
    // the desktop table, reusing the shared cell helpers/formatters above.
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <CampaignCard
            key={row.campaignKey}
            row={row}
            expanded={expanded.has(row.campaignKey)}
            canExpand={row.links.length > 0}
            onToggle={() => row.links.length > 0 && onToggle(row.campaignKey)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* desktop-only table; mobile renders cards via useIsMobile above */}
      <table className="w-full text-sm" /* mobile-ok */>
        <thead className="text-start text-xs uppercase tracking-wide text-muted-foreground border-b">
          <tr>
            <th className="px-2 py-2 w-8" aria-label="Expand" />
            <th className="px-2 py-2">Campaign key</th>
            <th className="px-2 py-2 text-end">Opens</th>
            <th className="px-2 py-2 text-end">Clicks</th>
            <th className="px-2 py-2 text-end">Links</th>
            <th className="px-2 py-2">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expanded.has(row.campaignKey);
            const canExpand = row.links.length > 0;
            return (
              <CampaignRow
                key={row.campaignKey}
                row={row}
                expanded={isOpen}
                canExpand={canExpand}
                onToggle={() => canExpand && onToggle(row.campaignKey)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CampaignRow({
  row,
  expanded,
  canExpand,
  onToggle,
}: {
  row: CampaignAggregate;
  expanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <>
      <tr
        className={cn(
          'border-b last:border-b-0',
          canExpand && 'cursor-pointer hover:bg-muted/50',
        )}
        onClick={canExpand ? onToggle : undefined}
        onKeyDown={
          canExpand
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        tabIndex={canExpand ? 0 : -1}
        aria-expanded={canExpand ? expanded : undefined}
      >
        <td className="px-2 py-2 align-middle">
          {canExpand ? (
            <Chevron className="h-4 w-4 text-muted-foreground rtl:-scale-x-100" />
          ) : (
            <span className="block h-4 w-4" aria-hidden />
          )}
        </td>
        <td className="px-2 py-2 align-middle">
          <CampaignKeyCell campaignKey={row.campaignKey} />
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {formatCount(row.openCount)}
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {formatCount(row.totalClickCount)}
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {formatCount(row.distinctLinkCount)}
        </td>
        <td className="px-2 py-2 align-middle text-muted-foreground">
          {formatTimestamp(row.lastActivityAt)}
        </td>
      </tr>
      {expanded && canExpand ? (
        <tr className="border-b last:border-b-0 bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <PerLinkBreakdown row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/**
 * One labeled detail row of a mobile card: label pinned to the start, value to
 * the end (the iOS grouped-list convention), mirroring the merged reference
 * tables (DomainTable / OrdersDataTable).
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right tabular-nums">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card for a single campaign row. Reuses the SAME shared cell helpers and
 * formatters as the desktop table row so values stay identical — only the layout
 * differs (a compact grouped list, with the per-link breakdown revealed inline
 * by the same expand toggle as the desktop chevron).
 */
function CampaignCard({
  row,
  expanded,
  canExpand,
  onToggle,
}: {
  row: CampaignAggregate;
  expanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
        aria-expanded={canExpand ? expanded : undefined}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3.5 py-3 text-start',
          canExpand && 'cursor-pointer hover:bg-muted/50',
        )}
      >
        <CampaignKeyCell campaignKey={row.campaignKey} />
        {canExpand ? (
          <Chevron className="h-4 w-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
        ) : (
          <span className="block h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Opens">{formatCount(row.openCount)}</CardRow>
        <CardRow label="Clicks">{formatCount(row.totalClickCount)}</CardRow>
        <CardRow label="Links">{formatCount(row.distinctLinkCount)}</CardRow>
        <CardRow label="Last activity">
          <span className="text-muted-foreground">
            {formatTimestamp(row.lastActivityAt)}
          </span>
        </CardRow>
      </dl>
      {expanded && canExpand ? (
        <div className="border-t border-border/50 bg-muted/20 px-3.5 py-3">
          <PerLinkBreakdown row={row} />
        </div>
      ) : null}
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin me-2" />
      Loading engagement…
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-sm text-destructive">{message}</div>
  );
}

function EmptyState({
  hasData,
  filterActive,
}: {
  hasData: boolean;
  filterActive: boolean;
}) {
  if (filterActive) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No campaigns match the filter.
      </div>
    );
  }
  if (!hasData) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No engagement recorded yet. Send an email with a{' '}
        <code className="font-mono text-xs">campaignKey</code> to start tracking
        opens and clicks.
      </div>
    );
  }
  return null;
}
