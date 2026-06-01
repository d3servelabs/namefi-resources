'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { useTRPC } from '@/lib/trpc';
import type { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@namefi-astra/ui/components/shadcn/alert';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Permission } from '@namefi-astra/utils/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ExternalLink,
  Play,
  RefreshCw,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SettingsDraft = {
  autoScanEnabled: boolean;
  searchQueriesText: string;
  maxQueries: number;
  maxPagesPerQuery: number;
  maxTweetsPerQuery: number;
  maxTweetAgeMinutes: number;
  overlapMinutes: number;
};

type NamefiFeedOverview = InferContractOutputs<
  typeof adminNamefiFeedContract
>['getOverview'];

const EMPTY_SETTINGS_DRAFT: SettingsDraft = {
  autoScanEnabled: false,
  searchQueriesText: '',
  maxQueries: 3,
  maxPagesPerQuery: 1,
  maxTweetsPerQuery: 10,
  maxTweetAgeMinutes: 1440,
  overlapMinutes: 5,
};

export default withAdminGuard(function AdminNamefiFeedPage() {
  return (
    <PermissionGate permissions={[Permission.READ_NAMEFI_FEED]}>
      <NamefiFeedAdminContent />
    </PermissionGate>
  );
});

function NamefiFeedAdminContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [settingsDraft, setSettingsDraft] =
    useState<SettingsDraft>(EMPTY_SETTINGS_DRAFT);
  const [manualTweetsText, setManualTweetsText] = useState('');
  const [includeReplies, setIncludeReplies] = useState(false);

  const overviewQuery = useQuery(
    trpc.admin.namefiFeed.getOverview.queryOptions(void 0, {
      trpc: { context: { skipBatch: true } },
    }),
  );
  const overview = overviewQuery.data;

  useEffect(() => {
    if (!overview?.settings) {
      return;
    }

    setSettingsDraft({
      autoScanEnabled: overview.settings.autoScanEnabled,
      searchQueriesText: overview.settings.searchQueries.join('\n'),
      maxQueries: overview.settings.maxQueries,
      maxPagesPerQuery: overview.settings.maxPagesPerQuery,
      maxTweetsPerQuery: overview.settings.maxTweetsPerQuery,
      maxTweetAgeMinutes: overview.settings.maxTweetAgeMinutes,
      overlapMinutes: overview.settings.overlapMinutes,
    });
  }, [overview?.settings]);

  const invalidateOverview = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.admin.namefiFeed.getOverview.queryKey(),
    });

  const updateSettingsMutation = useMutation(
    trpc.admin.namefiFeed.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success('Namefi Feed settings saved');
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to save settings', { description: error.message });
      },
    }),
  );

  const startIngestionMutation = useMutation(
    trpc.admin.namefiFeed.startIngestion.mutationOptions({
      onSuccess: (data) => {
        toast.success('Namefi Feed ingestion started', {
          description: data.workflowId,
        });
        setManualTweetsText('');
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to start ingestion', {
          description: error.message,
        });
      },
    }),
  );

  const suppressListingMutation = useMutation(
    trpc.admin.namefiFeed.setListingSuppressed.mutationOptions({
      onSuccess: () => {
        toast.success('Listing updated');
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to update listing', { description: error.message });
      },
    }),
  );

  const resolveReportMutation = useMutation(
    trpc.admin.namefiFeed.resolveReport.mutationOptions({
      onSuccess: () => {
        toast.success('Report resolved');
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to resolve report', {
          description: error.message,
        });
      },
    }),
  );

  const stats = useMemo(() => {
    const source = overview?.stats;
    return [
      ['Active listings', source?.activeListings ?? 0],
      ['Suppressed', source?.suppressedListings ?? 0],
      ['Pending posts', source?.pendingPosts ?? 0],
      ['Failed posts', source?.failedPosts ?? 0],
      ['Active reports', source?.activeReports ?? 0],
      ['Running runs', source?.runningRuns ?? 0],
    ] as const;
  }, [overview?.stats]);

  const saveSettings = () => {
    updateSettingsMutation.mutate({
      autoScanEnabled: settingsDraft.autoScanEnabled,
      searchQueries: settingsDraft.searchQueriesText
        .split('\n')
        .map((query) => query.trim())
        .filter(Boolean),
      maxQueries: settingsDraft.maxQueries,
      maxPagesPerQuery: settingsDraft.maxPagesPerQuery,
      maxTweetsPerQuery: settingsDraft.maxTweetsPerQuery,
      maxTweetAgeMinutes: settingsDraft.maxTweetAgeMinutes,
      overlapMinutes: settingsDraft.overlapMinutes,
    });
  };

  const startManualIngest = () => {
    const tweets = manualTweetsText
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (tweets.length === 0) {
      toast.error('Add at least one tweet URL or ID');
      return;
    }

    startIngestionMutation.mutate({
      mode: 'manual',
      tweets,
      includeReplies,
    });
  };

  return (
    <PageShell padding="admin" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Namefi Feed</h1>
          <p className="text-muted-foreground">
            Manage public domain sale ingestion, review runs, and moderate feed
            listings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => overviewQuery.refetch()}
          disabled={overviewQuery.isFetching}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {overview && !overview.xBearerTokenConfigured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>X bearer token missing</AlertTitle>
          <AlertDescription>
            Configure NAMEFI_FEED_X_BEARER_TOKEN before running scans or manual
            ingest.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="p-4 pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Scan Settings</CardTitle>
            <CardDescription>
              Controls used by the scheduled Temporal ingestion workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="auto-scan">Auto scan</Label>
                <span className="text-sm text-muted-foreground">
                  Scheduled runs skip ingestion when this is disabled.
                </span>
              </div>
              <Switch
                id="auto-scan"
                checked={settingsDraft.autoScanEnabled}
                onCheckedChange={(checked) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    autoScanEnabled: checked,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <NumberField
                id="max-queries"
                label="Queries"
                value={settingsDraft.maxQueries}
                min={1}
                max={12}
                onChange={(maxQueries) =>
                  setSettingsDraft((draft) => ({ ...draft, maxQueries }))
                }
              />
              <NumberField
                id="max-pages"
                label="Pages per query"
                value={settingsDraft.maxPagesPerQuery}
                min={1}
                max={10}
                onChange={(maxPagesPerQuery) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    maxPagesPerQuery,
                  }))
                }
              />
              <NumberField
                id="max-tweets"
                label="Tweets/query"
                value={settingsDraft.maxTweetsPerQuery}
                min={10}
                max={100}
                onChange={(maxTweetsPerQuery) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    maxTweetsPerQuery,
                  }))
                }
              />
              <NumberField
                id="max-age"
                label="Age minutes"
                value={settingsDraft.maxTweetAgeMinutes}
                min={15}
                max={10080}
                onChange={(maxTweetAgeMinutes) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    maxTweetAgeMinutes,
                  }))
                }
              />
              <NumberField
                id="overlap"
                label="Overlap"
                value={settingsDraft.overlapMinutes}
                min={0}
                max={1440}
                onChange={(overlapMinutes) =>
                  setSettingsDraft((draft) => ({ ...draft, overlapMinutes }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="search-queries">Search queries</Label>
              <Textarea
                id="search-queries"
                className="min-h-44 font-mono text-xs"
                value={settingsDraft.searchQueriesText}
                onChange={(event) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    searchQueriesText: event.target.value,
                  }))
                }
              />
            </div>

            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <div className="flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </PermissionGate>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Controls</CardTitle>
            <CardDescription>
              Start an immediate scan or queue specific X posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
                className="w-full"
                onClick={() => startIngestionMutation.mutate({ mode: 'scan' })}
                disabled={
                  startIngestionMutation.isPending ||
                  !overview?.xBearerTokenConfigured
                }
              >
                <Play className="h-4 w-4" />
                Start Scan
              </Button>
            </PermissionGate>

            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-tweets">Manual tweets</Label>
              <Textarea
                id="manual-tweets"
                className="min-h-32 font-mono text-xs"
                value={manualTweetsText}
                onChange={(event) => setManualTweetsText(event.target.value)}
                placeholder="https://x.com/name/status/123"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="include-replies">Include replies</Label>
              <Switch
                id="include-replies"
                checked={includeReplies}
                onCheckedChange={setIncludeReplies}
              />
            </div>

            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
                variant="secondary"
                onClick={startManualIngest}
                disabled={
                  startIngestionMutation.isPending ||
                  !overview?.xBearerTokenConfigured
                }
              >
                <Play className="h-4 w-4" />
                Queue Manual Posts
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>

      <RecentRunsTable runs={overview?.recentRuns ?? []} />
      <RecentPostsTable posts={overview?.recentPosts ?? []} />
      <RecentReportsTable
        reports={overview?.recentReports ?? []}
        isMutating={resolveReportMutation.isPending}
        onResolve={(reportId, resolution) =>
          resolveReportMutation.mutate({ reportId, resolution })
        }
      />
      <RecentListingsTable
        listings={overview?.recentListings ?? []}
        isMutating={suppressListingMutation.isPending}
        onToggleSuppressed={(listingId, suppressed) =>
          suppressListingMutation.mutate({ listingId, suppressed })
        }
      />
    </PageShell>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => {
          if (event.target.value === '') {
            return;
          }
          const nextValue = Math.trunc(Number(event.target.value));
          if (!Number.isNaN(nextValue)) {
            onChange(Math.min(Math.max(nextValue, min), max));
          }
        }}
      />
    </div>
  );
}

function RecentRunsTable({ runs }: { runs: NamefiFeedOverview['recentRuns'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Queued</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <StatusBadge status={run.status} />
                </TableCell>
                <TableCell>{run.trigger}</TableCell>
                <TableCell>{formatDate(run.startedAt)}</TableCell>
                <TableCell>{run.queuedPostCount}</TableCell>
                <TableCell>{run.processedPostCount}</TableCell>
                <TableCell>{run.listingUpsertedCount}</TableCell>
                <TableCell>{run.failedPostCount}</TableCell>
                <TableCell className="max-w-72 truncate">
                  {run.errorMessage ?? '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentPostsTable({
  posts,
}: {
  posts: NamefiFeedOverview['recentPosts'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-16">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <StatusBadge status={post.status} />
                </TableCell>
                <TableCell>{post.source}</TableCell>
                <TableCell>{post.authorUsername ?? '-'}</TableCell>
                <TableCell>{formatDate(post.postedAt)}</TableCell>
                <TableCell className="max-w-96 truncate">
                  {post.failureReason ?? post.skipReason ?? '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open source post"
                    onClick={() => openExternalUrl(post.sourceUrl)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentReportsTable({
  reports,
  isMutating,
  onResolve,
}: {
  reports: NamefiFeedOverview['recentReports'];
  isMutating: boolean;
  onResolve: (
    reportId: string,
    resolution: 'suppressed_listing' | 'dismissed',
  ) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.domain}</TableCell>
                <TableCell>{formatEnumLabel(report.reason)}</TableCell>
                <TableCell className="max-w-96 truncate">
                  {report.details ?? '-'}
                </TableCell>
                <TableCell>{formatDate(report.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Open source post for ${report.domain}`}
                      onClick={() => openExternalUrl(report.sourceUrl)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <PermissionGate
                      permissions={[Permission.WRITE_NAMEFI_FEED]}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        onClick={() => onResolve(report.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isMutating}
                        onClick={() =>
                          onResolve(report.id, 'suppressed_listing')
                        }
                      >
                        Suppress
                      </Button>
                    </PermissionGate>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentListingsTable({
  listings,
  isMutating,
  onToggleSuppressed,
}: {
  listings: NamefiFeedOverview['recentListings'];
  isMutating: boolean;
  onToggleSuppressed: (listingId: string, suppressed: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Asking</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <Link
                    href={`/search?query=${encodeURIComponent(listing.domain)}`}
                    className="font-medium hover:underline"
                  >
                    {listing.domain}
                  </Link>
                </TableCell>
                <TableCell>{listing.sellerUsername ?? '-'}</TableCell>
                <TableCell>
                  {[listing.askingPrice, listing.askingCurrency]
                    .filter(Boolean)
                    .join(' ') || '-'}
                </TableCell>
                <TableCell>{formatDate(listing.postedAt)}</TableCell>
                <TableCell>
                  <Badge
                    variant={listing.suppressed ? 'destructive' : 'outline'}
                  >
                    {listing.suppressed ? 'Suppressed' : 'Visible'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Open source post for ${listing.domain}`}
                      onClick={() => openExternalUrl(listing.sourceUrl)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <PermissionGate
                      permissions={[Permission.WRITE_NAMEFI_FEED]}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        onClick={() =>
                          onToggleSuppressed(listing.id, !listing.suppressed)
                        }
                      >
                        {listing.suppressed ? 'Restore' : 'Suppress'}
                      </Button>
                    </PermissionGate>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'failed'
      ? 'destructive'
      : status === 'running' || status === 'processing'
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant}>{formatEnumLabel(status)}</Badge>;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return format(date, 'yyyy-MM-dd HH:mm');
}

function formatEnumLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function openExternalUrl(url: string) {
  const safeUrl = normalizeExternalHttpUrl(url);
  if (!safeUrl) {
    toast.error('Invalid external URL');
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}

function normalizeExternalHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}
