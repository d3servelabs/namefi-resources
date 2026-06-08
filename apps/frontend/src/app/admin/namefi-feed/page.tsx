'use client';

import { PermissionGate } from '@/components/access/PermissionGate';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import { applyClientSideSorting } from '@/components/table/filters';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import type { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@namefi-astra/ui/components/shadcn/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Permission } from '@namefi-astra/utils/permissions';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  BellRing,
  ExternalLink,
  Pencil,
  Play,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
type DigestTarget = NamefiFeedOverview['digestTargets'][number];
type DigestTargetType = DigestTarget['targetType'];

type TargetDraft = {
  id: string | null;
  targetType: DigestTargetType;
  label: string;
  enabled: boolean;
  channelId: string;
  guildId: string;
  chatId: string;
  messageThreadId: string;
};

const EMPTY_SETTINGS_DRAFT: SettingsDraft = {
  autoScanEnabled: false,
  searchQueriesText: '',
  maxQueries: 3,
  maxPagesPerQuery: 1,
  maxTweetsPerQuery: 10,
  maxTweetAgeMinutes: 1440,
  overlapMinutes: 5,
};

const MANUAL_TWEET_SPLIT_PATTERN = /[\s,]+/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const EMPTY_TARGET_DRAFT: TargetDraft = {
  id: null,
  targetType: 'slack',
  label: '',
  enabled: true,
  channelId: '',
  guildId: '',
  chatId: '',
  messageThreadId: '',
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
  const [digestIncludeImage, setDigestIncludeImage] = useState(true);
  const [digestIncludeAnimation, setDigestIncludeAnimation] = useState(true);
  const [digestDryRun, setDigestDryRun] = useState(false);
  const [digestConfirmOpen, setDigestConfirmOpen] = useState(false);
  const [selectedDigestTargetIds, setSelectedDigestTargetIds] = useState<
    string[]
  >([]);
  const [pendingDeleteTarget, setPendingDeleteTarget] =
    useState<DigestTarget | null>(null);
  const [targetDraft, setTargetDraft] =
    useState<TargetDraft>(EMPTY_TARGET_DRAFT);

  const overviewQuery = useQuery(
    trpc.admin.namefiFeed.getOverview.queryOptions(void 0, {
      trpc: { context: { skipBatch: true } },
    }),
  );
  const overview = overviewQuery.data;
  const enabledDigestTargets = useMemo(
    () => overview?.digestTargets.filter((target) => target.enabled) ?? [],
    [overview?.digestTargets],
  );
  const enabledDigestTargetIds = useMemo(
    () => enabledDigestTargets.map((target) => target.id),
    [enabledDigestTargets],
  );

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

  useEffect(() => {
    setSelectedDigestTargetIds((current) => {
      if (enabledDigestTargetIds.length === 0) {
        return [];
      }

      const enabledIdSet = new Set(enabledDigestTargetIds);
      const retained = current.filter((id) => enabledIdSet.has(id));
      return retained.length > 0 ? retained : enabledDigestTargetIds;
    });
  }, [enabledDigestTargetIds]);

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

  const runDigestMutation = useMutation(
    trpc.admin.namefiFeed.runDigest.mutationOptions({
      onSuccess: (data) => {
        toast.success('Digest workflow started', {
          description: data.workflowId,
        });
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to start digest', { description: error.message });
      },
    }),
  );

  const createTargetMutation = useMutation(
    trpc.admin.namefiFeed.createDigestTarget.mutationOptions({
      onSuccess: () => {
        toast.success('Digest target created');
        setTargetDraft(EMPTY_TARGET_DRAFT);
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to create target', { description: error.message });
      },
    }),
  );

  const updateTargetMutation = useMutation(
    trpc.admin.namefiFeed.updateDigestTarget.mutationOptions({
      onSuccess: () => {
        toast.success('Digest target updated');
        setTargetDraft(EMPTY_TARGET_DRAFT);
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to update target', { description: error.message });
      },
    }),
  );

  const toggleTargetMutation = useMutation(
    trpc.admin.namefiFeed.updateDigestTarget.mutationOptions({
      onSuccess: (target) => {
        toast.success(
          target.enabled ? 'Digest target enabled' : 'Digest target disabled',
        );
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to update target', { description: error.message });
      },
    }),
  );

  const deleteTargetMutation = useMutation(
    trpc.admin.namefiFeed.deleteDigestTarget.mutationOptions({
      onSuccess: (_data, variables) => {
        toast.success('Digest target deleted');
        if (targetDraft.id === variables.targetId) {
          setTargetDraft(EMPTY_TARGET_DRAFT);
        }
        setPendingDeleteTarget(null);
        invalidateOverview();
      },
      onError: (error) => {
        toast.error('Failed to delete target', { description: error.message });
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
      ['Visible listings', source?.activeListings ?? 0],
      ['Active reports', source?.activeReports ?? 0],
      ['Pending posts', source?.pendingPosts ?? 0],
      ['Failed posts', source?.failedPosts ?? 0],
      ['Running scans', source?.runningRuns ?? 0],
      [
        'Digest targets',
        `${source?.enabledDigestTargets ?? 0}/${source?.digestTargets ?? 0}`,
      ],
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
      .split(MANUAL_TWEET_SPLIT_PATTERN)
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

  const openDigestConfirmation = () => {
    if (!digestDryRun && selectedDigestTargetIds.length === 0) {
      toast.error('Select at least one enabled digest target');
      return;
    }

    setDigestConfirmOpen(true);
  };

  const runDigest = () => {
    runDigestMutation.mutate({
      includeImage: digestIncludeImage,
      includeAnimation: digestIncludeAnimation,
      enabledOnly: true,
      dryRun: digestDryRun,
      targetIds:
        selectedDigestTargetIds.length > 0
          ? selectedDigestTargetIds
          : undefined,
    });
    setDigestConfirmOpen(false);
  };

  const saveTarget = () => {
    const input = buildTargetMutationInput(targetDraft);
    if (!input) {
      return;
    }

    if (targetDraft.id) {
      updateTargetMutation.mutate({
        id: targetDraft.id,
        ...input,
      });
      return;
    }

    createTargetMutation.mutate(input);
  };

  const editTarget = (target: DigestTarget) => {
    setTargetDraft(toTargetDraft(target));
  };

  const toggleTarget = (target: DigestTarget, enabled: boolean) => {
    toggleTargetMutation.mutate({
      id: target.id,
      targetType: target.targetType,
      label: target.label,
      enabled,
      config: target.config,
    } as Parameters<typeof toggleTargetMutation.mutate>[0]);
  };

  const missingDigestTokens = getMissingDigestTokenLabels(overview);
  const digestTargetSelectionLabel =
    enabledDigestTargetIds.length === 0
      ? 'no targets'
      : selectedDigestTargetIds.length === enabledDigestTargetIds.length
        ? 'all enabled targets'
        : `${selectedDigestTargetIds.length} selected target${
            selectedDigestTargetIds.length === 1 ? '' : 's'
          }`;

  return (
    <PageShell padding="admin" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Namefi Feed</h1>
          <p className="text-muted-foreground">
            Ingest domain sale posts, moderate listings, and publish the daily
            digest.
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
            ingestion.
          </AlertDescription>
        </Alert>
      )}

      {missingDigestTokens.length > 0 && (
        <Alert>
          <BellRing className="h-4 w-4" />
          <AlertTitle>Digest publisher tokens missing</AlertTitle>
          <AlertDescription>
            {missingDigestTokens.join(', ')} targets can be saved, but delivery
            will fail until the matching bot token is configured.
          </AlertDescription>
        </Alert>
      )}

      {overviewQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overview Failed</AlertTitle>
          <AlertDescription>
            {overviewQuery.error.message ||
              'Refresh after checking the Namefi Feed admin service.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label} className="rounded-md">
            <CardHeader className="p-4 pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.7fr)_minmax(360px,0.7fr)]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Ingestion Settings</CardTitle>
            <CardDescription>
              Scheduled scans use these limits and queries.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="auto-scan">Auto scan</Label>
                <p className="text-sm text-muted-foreground">
                  Scheduled ingestion skips work while disabled.
                </p>
              </div>
              <Switch
                id="auto-scan"
                checked={settingsDraft.autoScanEnabled}
                onCheckedChange={(autoScanEnabled) =>
                  setSettingsDraft((draft) => ({
                    ...draft,
                    autoScanEnabled,
                  }))
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-5">
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
                label="Pages/query"
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
                label="Age min"
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
                className="min-h-32 font-mono text-xs"
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
              <Button
                className="self-end"
                onClick={saveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Manual Ingestion</CardTitle>
            <CardDescription>
              Run a scan or queue specific posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
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
              <Label htmlFor="manual-tweets">Tweet URLs or IDs</Label>
              <Textarea
                id="manual-tweets"
                className="min-h-28 font-mono text-xs"
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
                Queue Posts
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Digest</CardTitle>
            <CardDescription>
              Generate the rolling 24-hour digest and publish to enabled
              targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ToggleRow
              id="digest-image"
              label="Word cloud image"
              checked={digestIncludeImage}
              onCheckedChange={setDigestIncludeImage}
            />
            <ToggleRow
              id="digest-animation"
              label="Animation"
              checked={digestIncludeAnimation}
              onCheckedChange={setDigestIncludeAnimation}
            />
            <ToggleRow
              id="digest-dry-run"
              label="Dry run"
              checked={digestDryRun}
              onCheckedChange={setDigestDryRun}
            />
            <div className="space-y-2">
              <Label>Publish Targets</Label>
              {enabledDigestTargets.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No enabled digest targets
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {enabledDigestTargets.map((target) => {
                    const checkboxId = `digest-target-${target.id}`;
                    return (
                      <label
                        key={target.id}
                        htmlFor={checkboxId}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={selectedDigestTargetIds.includes(target.id)}
                          disabled={runDigestMutation.isPending}
                          onCheckedChange={(checked) =>
                            setSelectedDigestTargetIds((current) =>
                              checked === true
                                ? Array.from(new Set([...current, target.id]))
                                : current.filter((id) => id !== target.id),
                            )
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {target.label}
                        </span>
                        <Badge variant="outline">
                          {channelLabel(target.targetType)}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
                onClick={openDigestConfirmation}
                disabled={
                  runDigestMutation.isPending ||
                  (!digestDryRun && selectedDigestTargetIds.length === 0)
                }
              >
                <Play className="h-4 w-4" />
                Run Digest
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start lg:w-auto">
          <TabsTrigger value="listings">Recent Listings</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="deliveries">Recent Deliveries</TabsTrigger>
          <TabsTrigger value="runs">Recent Runs</TabsTrigger>
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <ListingsTable
            listings={overview?.recentListings ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
            isMutating={suppressListingMutation.isPending}
            onToggleSuppressed={(listingId, suppressed) =>
              suppressListingMutation.mutate({ listingId, suppressed })
            }
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsTable
            reports={overview?.recentReports ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
            isMutating={resolveReportMutation.isPending}
            onResolve={(reportId, resolution) =>
              resolveReportMutation.mutate({ reportId, resolution })
            }
          />
        </TabsContent>

        <TabsContent value="targets" className="mt-4 space-y-4">
          <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
            <DigestTargetEditor
              draft={targetDraft}
              configured={overview?.digestPublisherConfigured}
              isSaving={
                createTargetMutation.isPending || updateTargetMutation.isPending
              }
              onDraftChange={setTargetDraft}
              onSave={saveTarget}
              onCancel={() => setTargetDraft(EMPTY_TARGET_DRAFT)}
            />
          </PermissionGate>
          <TargetsTable
            targets={overview?.digestTargets ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
            isMutating={
              updateTargetMutation.isPending ||
              toggleTargetMutation.isPending ||
              deleteTargetMutation.isPending
            }
            onEdit={editTarget}
            onToggle={toggleTarget}
            onDelete={setPendingDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <DeliveriesTable
            deliveries={overview?.recentDigestDeliveries ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
          />
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          <RunsTable
            runs={overview?.recentRuns ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
          />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <PostsTable
            posts={overview?.recentPosts ?? []}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={digestConfirmOpen} onOpenChange={setDigestConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Namefi Feed Digest</AlertDialogTitle>
            <AlertDialogDescription>
              {digestDryRun
                ? 'This starts a dry run. It generates the digest without posting to any channel.'
                : `This publishes the digest to ${digestTargetSelectionLabel}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runDigest}
              disabled={runDigestMutation.isPending}
            >
              <Play className="h-4 w-4" />
              Start Digest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Digest Target</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteTarget
                ? `Delete ${pendingDeleteTarget.label}? Future digest runs will not post to this destination.`
                : 'Delete this digest target?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTargetMutation.isPending}
              onClick={() => {
                if (pendingDeleteTarget) {
                  deleteTargetMutation.mutate({
                    targetId: pendingDeleteTarget.id,
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Target
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function ToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ListingsTable({
  listings,
  isLoading,
  isFetching,
  isMutating,
  onToggleSuppressed,
}: {
  listings: NamefiFeedOverview['recentListings'];
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onToggleSuppressed: (listingId: string, suppressed: boolean) => void;
}) {
  const columns = useMemo<ColumnDef<(typeof listings)[number]>[]>(
    () => [
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <Link
            href={`/search?query=${encodeURIComponent(row.original.domain)}`}
            className="font-medium hover:underline"
          >
            {row.original.domain}
          </Link>
        ),
      },
      {
        accessorKey: 'sellerUsername',
        header: 'Seller',
        cell: ({ row }) => row.original.sellerUsername ?? '-',
      },
      {
        id: 'asking',
        header: 'Asking',
        cell: ({ row }) =>
          [row.original.askingPrice, row.original.askingCurrency]
            .filter(Boolean)
            .join(' ') || '-',
      },
      {
        accessorKey: 'postedAt',
        header: 'Posted',
        cell: ({ row }) => formatDate(row.original.postedAt),
      },
      {
        accessorKey: 'suppressed',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.suppressed ? 'destructive' : 'outline'}>
            {row.original.suppressed ? 'Suppressed' : 'Visible'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open source post for ${row.original.domain}`}
              onClick={() => openExternalUrl(row.original.sourceUrl)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
                variant="outline"
                size="sm"
                disabled={isMutating}
                onClick={() =>
                  onToggleSuppressed(row.original.id, !row.original.suppressed)
                }
              >
                {row.original.suppressed ? 'Restore' : 'Suppress'}
              </Button>
            </PermissionGate>
          </RowActions>
        ),
      },
    ],
    [isMutating, onToggleSuppressed],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-listings"
      columns={columns}
      data={listings}
      defaultSorting={[{ id: 'postedAt', desc: true }]}
      fieldAccessors={{
        domain: (row) => row.domain,
        sellerUsername: (row) => row.sellerUsername,
        asking: (row) => `${row.askingPrice ?? ''} ${row.askingCurrency ?? ''}`,
        postedAt: (row) => new Date(row.postedAt),
        suppressed: (row) => row.suppressed,
      }}
      searchText={(row) =>
        [
          row.domain,
          row.sellerUsername,
          row.askingPrice,
          row.askingCurrency,
          row.sourceUrl,
        ].join(' ')
      }
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No recent listings found"
      searchPlaceholder="Search listings..."
    />
  );
}

function ReportsTable({
  reports,
  isLoading,
  isFetching,
  isMutating,
  onResolve,
}: {
  reports: NamefiFeedOverview['recentReports'];
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onResolve: (
    reportId: string,
    resolution: 'suppressed_listing' | 'dismissed',
  ) => void;
}) {
  const columns = useMemo<ColumnDef<(typeof reports)[number]>[]>(
    () => [
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.domain}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => formatEnumLabel(row.original.reason),
      },
      {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => row.original.details ?? '-',
      },
      {
        accessorKey: 'createdAt',
        header: 'Reported',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open source post for ${row.original.domain}`}
              onClick={() => openExternalUrl(row.original.sourceUrl)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Button
                variant="outline"
                size="sm"
                disabled={isMutating}
                onClick={() => onResolve(row.original.id, 'dismissed')}
              >
                Dismiss
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isMutating}
                onClick={() => onResolve(row.original.id, 'suppressed_listing')}
              >
                Suppress
              </Button>
            </PermissionGate>
          </RowActions>
        ),
      },
    ],
    [isMutating, onResolve],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-reports"
      columns={columns}
      data={reports}
      defaultSorting={[{ id: 'createdAt', desc: true }]}
      fieldAccessors={{
        domain: (row) => row.domain,
        reason: (row) => row.reason,
        details: (row) => row.details,
        createdAt: (row) => new Date(row.createdAt),
      }}
      searchText={(row) => [row.domain, row.reason, row.details].join(' ')}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No active reports"
      searchPlaceholder="Search reports..."
    />
  );
}

function RunsTable({
  runs,
  isLoading,
  isFetching,
}: {
  runs: NamefiFeedOverview['recentRuns'];
  isLoading: boolean;
  isFetching: boolean;
}) {
  const columns = useMemo<ColumnDef<(typeof runs)[number]>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: 'trigger', header: 'Trigger' },
      {
        accessorKey: 'startedAt',
        header: 'Started',
        cell: ({ row }) => formatDate(row.original.startedAt),
      },
      { accessorKey: 'queuedPostCount', header: 'Queued' },
      { accessorKey: 'processedPostCount', header: 'Processed' },
      { accessorKey: 'listingUpsertedCount', header: 'Listings' },
      { accessorKey: 'failedPostCount', header: 'Failed' },
      {
        accessorKey: 'errorMessage',
        header: 'Error',
        cell: ({ row }) => row.original.errorMessage ?? '-',
      },
    ],
    [],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-runs"
      columns={columns}
      data={runs}
      defaultSorting={[{ id: 'startedAt', desc: true }]}
      fieldAccessors={{
        status: (row) => row.status,
        trigger: (row) => row.trigger,
        startedAt: (row) => new Date(row.startedAt),
        queuedPostCount: (row) => row.queuedPostCount,
        processedPostCount: (row) => row.processedPostCount,
        listingUpsertedCount: (row) => row.listingUpsertedCount,
        failedPostCount: (row) => row.failedPostCount,
        errorMessage: (row) => row.errorMessage,
      }}
      searchText={(row) =>
        [row.status, row.trigger, row.workflowId, row.errorMessage].join(' ')
      }
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No recent ingestion runs"
      searchPlaceholder="Search runs..."
    />
  );
}

function PostsTable({
  posts,
  isLoading,
  isFetching,
}: {
  posts: NamefiFeedOverview['recentPosts'];
  isLoading: boolean;
  isFetching: boolean;
}) {
  const columns = useMemo<ColumnDef<(typeof posts)[number]>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: 'source', header: 'Source' },
      {
        accessorKey: 'authorUsername',
        header: 'Author',
        cell: ({ row }) => row.original.authorUsername ?? '-',
      },
      {
        accessorKey: 'postedAt',
        header: 'Posted',
        cell: ({ row }) => formatDate(row.original.postedAt),
      },
      {
        id: 'reason',
        header: 'Reason',
        cell: ({ row }) =>
          row.original.failureReason ?? row.original.skipReason ?? '-',
      },
      {
        id: 'open',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open source post"
            onClick={() => openExternalUrl(row.original.sourceUrl)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-posts"
      columns={columns}
      data={posts}
      defaultSorting={[{ id: 'postedAt', desc: true }]}
      fieldAccessors={{
        status: (row) => row.status,
        source: (row) => row.source,
        authorUsername: (row) => row.authorUsername,
        postedAt: (row) => new Date(row.postedAt),
        reason: (row) => row.failureReason ?? row.skipReason,
      }}
      searchText={(row) =>
        [
          row.externalPostId,
          row.authorUsername,
          row.status,
          row.failureReason,
          row.skipReason,
        ].join(' ')
      }
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No recent posts"
      searchPlaceholder="Search posts..."
    />
  );
}

function TargetsTable({
  targets,
  isLoading,
  isFetching,
  isMutating,
  onEdit,
  onToggle,
  onDelete,
}: {
  targets: NamefiFeedOverview['digestTargets'];
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onEdit: (target: DigestTarget) => void;
  onToggle: (target: DigestTarget, enabled: boolean) => void;
  onDelete: (target: DigestTarget) => void;
}) {
  const columns = useMemo<ColumnDef<DigestTarget>[]>(
    () => [
      {
        accessorKey: 'targetType',
        header: 'Channel',
        cell: ({ row }) => channelLabel(row.original.targetType),
      },
      { accessorKey: 'label', header: 'Label' },
      {
        accessorKey: 'enabled',
        header: 'Enabled',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={row.original.enabled ? 'outline' : 'secondary'}>
              {row.original.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
              <Switch
                checked={row.original.enabled}
                disabled={isMutating}
                onCheckedChange={(checked) => onToggle(row.original, checked)}
                aria-label={`Toggle ${row.original.label}`}
              />
            </PermissionGate>
          </div>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => getTargetDestination(row.original),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
            <RowActions>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Edit ${row.original.label}`}
                disabled={isMutating}
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                aria-label={`Delete ${row.original.label}`}
                disabled={isMutating}
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </RowActions>
          </PermissionGate>
        ),
      },
    ],
    [isMutating, onDelete, onEdit, onToggle],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-digest-targets"
      columns={columns}
      data={targets}
      defaultSorting={[{ id: 'updatedAt', desc: true }]}
      fieldAccessors={{
        targetType: (row) => row.targetType,
        label: (row) => row.label,
        enabled: (row) => row.enabled,
        destination: getTargetDestination,
        updatedAt: (row) => new Date(row.updatedAt),
      }}
      searchText={(row) =>
        [row.label, row.targetType, getTargetDestination(row)].join(' ')
      }
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No digest targets yet"
      searchPlaceholder="Search targets..."
    />
  );
}

function DeliveriesTable({
  deliveries,
  isLoading,
  isFetching,
}: {
  deliveries: NamefiFeedOverview['recentDigestDeliveries'];
  isLoading: boolean;
  isFetching: boolean;
}) {
  const columns = useMemo<ColumnDef<(typeof deliveries)[number]>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'targetType',
        header: 'Channel',
        cell: ({ row }) =>
          row.original.targetType ? channelLabel(row.original.targetType) : '-',
      },
      {
        accessorKey: 'targetLabel',
        header: 'Target',
        cell: ({ row }) => row.original.targetLabel ?? row.original.targetKey,
      },
      {
        accessorKey: 'generatedAt',
        header: 'Generated',
        cell: ({ row }) => formatDate(row.original.generatedAt),
      },
      {
        id: 'window',
        header: 'Window',
        cell: ({ row }) =>
          formatDigestWindow(row.original.windowStart, row.original.windowEnd),
      },
      {
        id: 'message',
        header: 'Message',
        cell: ({ row }) => {
          const { externalMessageId, externalMessageUrl } = row.original;
          return externalMessageUrl ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open delivered message"
              onClick={() => openExternalUrl(externalMessageUrl)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          ) : (
            (externalMessageId ?? '-')
          );
        },
      },
      {
        accessorKey: 'error',
        header: 'Error',
        cell: ({ row }) => row.original.error ?? '-',
      },
    ],
    [],
  );

  return (
    <ClientDataTable
      tableId="admin-namefi-feed-digest-deliveries"
      columns={columns}
      data={deliveries}
      defaultSorting={[{ id: 'generatedAt', desc: true }]}
      fieldAccessors={{
        status: (row) => row.status,
        targetType: (row) => row.targetType,
        targetLabel: (row) => row.targetLabel,
        generatedAt: (row) => new Date(row.generatedAt),
        window: (row) => new Date(row.windowStart),
        message: (row) => row.externalMessageId,
        error: (row) => row.error,
      }}
      searchText={(row) =>
        [
          row.status,
          row.targetType,
          row.targetLabel,
          row.targetKey,
          row.externalMessageId,
          row.error,
        ].join(' ')
      }
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage="No digest deliveries yet"
      searchPlaceholder="Search deliveries..."
    />
  );
}

function DigestTargetEditor({
  draft,
  configured,
  isSaving,
  onDraftChange,
  onSave,
  onCancel,
}: {
  draft: TargetDraft;
  configured?: NamefiFeedOverview['digestPublisherConfigured'];
  isSaving: boolean;
  onDraftChange: (draft: TargetDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const channelConfigured = isDraftChannelConfigured(
    draft.targetType,
    configured,
  );

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>
          {draft.id ? 'Edit Digest Target' : 'Add Digest Target'}
        </CardTitle>
        <CardDescription>
          Targets are used by scheduled and manual digest runs.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[180px_minmax(180px,1fr)_minmax(180px,1fr)_160px_auto]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-type">Channel</Label>
          <select
            id="target-type"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={draft.targetType}
            disabled={Boolean(draft.id)}
            onChange={(event) =>
              onDraftChange({
                ...EMPTY_TARGET_DRAFT,
                targetType: event.target.value as DigestTargetType,
              })
            }
          >
            <option value="slack">Slack</option>
            <option value="telegram_group">Telegram</option>
            <option value="discord_channel">Discord</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="target-label">Label</Label>
          <Input
            id="target-label"
            value={draft.label}
            placeholder="Ops digest"
            onChange={(event) =>
              onDraftChange({ ...draft, label: event.target.value })
            }
          />
        </div>

        <TargetConfigFields draft={draft} onDraftChange={onDraftChange} />

        <div className="flex items-end">
          <div className="flex h-10 w-full items-center justify-between rounded-md border px-3">
            <Label htmlFor="target-enabled">Enabled</Label>
            <Switch
              id="target-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) =>
                onDraftChange({ ...draft, enabled })
              }
            />
          </div>
        </div>

        <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
          <div className="flex items-end gap-2">
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {draft.id ? 'Save' : 'Add'}
            </Button>
            {draft.id && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Cancel editing digest target"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PermissionGate>
      </CardContent>
      {!channelConfigured && (
        <CardContent className="pt-0">
          <p className="text-sm text-destructive">
            {channelLabel(draft.targetType)} publishing needs its bot token
            before this target can be used.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function TargetConfigFields({
  draft,
  onDraftChange,
}: {
  draft: TargetDraft;
  onDraftChange: (draft: TargetDraft) => void;
}) {
  if (draft.targetType === 'telegram_group') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-chat-id">Chat ID</Label>
          <Input
            id="target-chat-id"
            value={draft.chatId}
            placeholder="-1001234567890"
            onChange={(event) =>
              onDraftChange({ ...draft, chatId: event.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-thread-id">Thread ID</Label>
          <Input
            id="target-thread-id"
            value={draft.messageThreadId}
            inputMode="numeric"
            placeholder="Optional"
            onChange={(event) =>
              onDraftChange({
                ...draft,
                messageThreadId: event.target.value,
              })
            }
          />
        </div>
      </div>
    );
  }

  if (draft.targetType === 'discord_channel') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-channel-id">Channel ID</Label>
          <Input
            id="target-channel-id"
            value={draft.channelId}
            onChange={(event) =>
              onDraftChange({ ...draft, channelId: event.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-guild-id">Guild ID</Label>
          <Input
            id="target-guild-id"
            value={draft.guildId}
            placeholder="Optional"
            onChange={(event) =>
              onDraftChange({ ...draft, guildId: event.target.value })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="target-channel-id">Channel ID</Label>
      <Input
        id="target-channel-id"
        value={draft.channelId}
        placeholder="C0123456789"
        onChange={(event) =>
          onDraftChange({ ...draft, channelId: event.target.value })
        }
      />
    </div>
  );
}

function ClientDataTable<T>({
  tableId,
  columns,
  data,
  defaultSorting,
  defaultColumnVisibility = {},
  fieldAccessors,
  searchText,
  isLoading,
  isFetching,
  emptyMessage,
  searchPlaceholder,
}: {
  tableId: string;
  columns: ColumnDef<T>[];
  data: T[];
  defaultSorting: SortingState;
  defaultColumnVisibility?: VisibilityState;
  fieldAccessors: Record<string, (row: T) => unknown>;
  searchText: (row: T) => string;
  isLoading: boolean;
  isFetching: boolean;
  emptyMessage: string;
  searchPlaceholder: string;
}) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    preferences: { columnVisibility, sorting, pageSize },
    setColumnVisibility,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId,
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      sorting: defaultSorting,
      pageSize: 15,
    },
  });

  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return data;
    }

    return data.filter((row) => searchText(row).toLowerCase().includes(query));
  }, [data, searchTerm, searchText]);

  const sortedData = useMemo(
    () => applyClientSideSorting(filteredData, sorting, fieldAccessors),
    [filteredData, sorting, fieldAccessors],
  );

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = sortedData.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const handlePageSizeChange = (nextPageSize: number) => {
    setPage(1);
    setPageSize(nextPageSize);
  };

  const handleSearchChange = (nextSearchTerm: string) => {
    setPage(1);
    setSearchTerm(nextSearchTerm);
  };

  return (
    <ExtensibleDataTable<T, never>
      columns={columns}
      data={pageData}
      isLoading={isLoading}
      isFetching={isFetching}
      page={safePage}
      pageSize={pageSize}
      totalPages={totalPages}
      totalCount={sortedData.length}
      onPageChange={setPage}
      onPageSizeChange={handlePageSizeChange}
      sorting={sorting}
      onSortingChange={setSorting}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      loadingMessage="Loading..."
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      onResetPreferences={resetToDefaults}
      paginationVisibility="auto"
    />
  );
}

function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'failed'
      ? 'destructive'
      : status === 'running' ||
          status === 'processing' ||
          status === 'pending' ||
          status === 'partial'
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant}>{formatEnumLabel(status)}</Badge>;
}

function buildTargetMutationInput(draft: TargetDraft) {
  const label = draft.label.trim() || undefined;

  if (draft.targetType === 'telegram_group') {
    const chatId = draft.chatId.trim();
    if (!chatId) {
      toast.error('Telegram chat ID is required');
      return null;
    }
    const threadIdText = draft.messageThreadId.trim();
    const messageThreadId = threadIdText
      ? Number.parseInt(threadIdText, 10)
      : null;
    if (threadIdText && !POSITIVE_INTEGER_PATTERN.test(threadIdText)) {
      toast.error('Thread ID must be a positive number');
      return null;
    }

    return {
      targetType: 'telegram_group' as const,
      label,
      enabled: draft.enabled,
      config: {
        chatId,
        messageThreadId,
      },
    };
  }

  const channelId = draft.channelId.trim();
  if (!channelId) {
    toast.error('Channel ID is required');
    return null;
  }

  if (draft.targetType === 'discord_channel') {
    return {
      targetType: 'discord_channel' as const,
      label,
      enabled: draft.enabled,
      config: {
        channelId,
        guildId: draft.guildId.trim() || null,
      },
    };
  }

  return {
    targetType: 'slack' as const,
    label,
    enabled: draft.enabled,
    config: {
      channelId,
    },
  };
}

function toTargetDraft(target: DigestTarget): TargetDraft {
  const config = target.config as Record<string, unknown>;
  return {
    id: target.id,
    targetType: target.targetType,
    label: target.label,
    enabled: target.enabled,
    channelId: typeof config.channelId === 'string' ? config.channelId : '',
    guildId: typeof config.guildId === 'string' ? config.guildId : '',
    chatId: typeof config.chatId === 'string' ? config.chatId : '',
    messageThreadId:
      typeof config.messageThreadId === 'number'
        ? String(config.messageThreadId)
        : '',
  };
}

function getTargetDestination(target: DigestTarget) {
  const config = target.config as Record<string, unknown>;
  if (target.targetType === 'telegram_group') {
    const thread =
      typeof config.messageThreadId === 'number'
        ? ` / thread ${config.messageThreadId}`
        : '';
    return `${config.chatId ?? '-'}${thread}`;
  }
  if (target.targetType === 'discord_channel') {
    const guild =
      typeof config.guildId === 'string' ? ` / ${config.guildId}` : '';
    return `${config.channelId ?? '-'}${guild}`;
  }
  return String(config.channelId ?? '-');
}

function channelLabel(value: DigestTargetType) {
  switch (value) {
    case 'slack':
      return 'Slack';
    case 'telegram_group':
      return 'Telegram';
    case 'discord_channel':
      return 'Discord';
  }
}

function isDraftChannelConfigured(
  targetType: DigestTargetType,
  configured?: NamefiFeedOverview['digestPublisherConfigured'],
) {
  if (!configured) {
    return true;
  }
  switch (targetType) {
    case 'slack':
      return configured.slack;
    case 'telegram_group':
      return configured.telegram;
    case 'discord_channel':
      return configured.discord;
  }
}

function getMissingDigestTokenLabels(overview?: NamefiFeedOverview) {
  if (!overview) {
    return [];
  }

  const required = new Set(
    overview.digestTargets
      .filter((target) => target.enabled)
      .map((target) => target.targetType),
  );
  const missing: string[] = [];
  if (required.has('slack') && !overview.digestPublisherConfigured.slack) {
    missing.push('Slack');
  }
  if (
    required.has('telegram_group') &&
    !overview.digestPublisherConfigured.telegram
  ) {
    missing.push('Telegram');
  }
  if (
    required.has('discord_channel') &&
    !overview.digestPublisherConfigured.discord
  ) {
    missing.push('Discord');
  }
  return missing;
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

function formatDigestWindow(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
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
