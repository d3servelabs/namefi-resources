'use client';

import { useMemo, useState } from 'react';
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

function CampaignsTable({
  rows,
  expanded,
  onToggle,
}: {
  rows: CampaignAggregate[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
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
        <td className="px-2 py-2 align-middle font-mono text-xs">
          {row.campaignKey}
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {row.openCount.toLocaleString()}
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {row.totalClickCount.toLocaleString()}
        </td>
        <td className="px-2 py-2 align-middle text-end tabular-nums">
          {row.distinctLinkCount.toLocaleString()}
        </td>
        <td className="px-2 py-2 align-middle text-muted-foreground">
          {row.lastActivityAt
            ? format(row.lastActivityAt, 'yyyy-MM-dd HH:mm')
            : '—'}
        </td>
      </tr>
      {expanded && canExpand ? (
        <tr className="border-b last:border-b-0 bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Per-link clicks ({row.links.length})
              </div>
              <table className="w-full text-xs">
                <thead className="text-start text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Group identifier</th>
                    <th className="px-2 py-1 text-end">Clicks</th>
                    <th className="px-2 py-1">First seen</th>
                    <th className="px-2 py-1">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {row.links.map((link) => (
                    <tr
                      key={`${link.campaignKey}::${link.groupIdentifier}`}
                      className="border-t border-border/50"
                    >
                      <td className="px-2 py-1 font-mono">
                        {link.groupIdentifier ? (
                          link.groupIdentifier
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-normal text-[10px]"
                          >
                            untagged
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-1 text-end tabular-nums">
                        {link.clickCount.toLocaleString()}
                      </td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {format(link.createdAt, 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {format(link.updatedAt, 'yyyy-MM-dd HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
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
