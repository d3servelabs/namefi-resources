'use client';

import {
  PermissionGate,
  useHasPermissions,
} from '@/components/access/PermissionGate';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { ExtensibleDataTable } from '@/components/table/extensible-data-table';
import { applyClientSideSorting } from '@/components/table/filters';
import { ServerDataTable } from '@/components/table/server-data-table';
import { useTablePreferences } from '@/hooks/use-table-preferences';
import { useTRPC } from '@/lib/trpc';
import type { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import type { InferContractOutputs } from '@namefi-astra/common/contract/trpc-contract';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
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
  ColumnFiltersState,
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

type NamefiFeedOverview = InferContractOutputs<
  typeof adminNamefiFeedContract
>['getOverview'];
type FeedSettings = NamefiFeedOverview['settings'];
type FeedSourceSettings = FeedSettings['sourceSettings'];
type FeedSource = NamefiFeedOverview['settings']['sources'][number];
type FeedSourceId = FeedSource['id'];
type DigestTarget = NamefiFeedOverview['digestTargets'][number];
type DigestTargetType = DigestTarget['targetType'];
type NamefiFeedRunsPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listRuns'];
type NamefiFeedPostsPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listPosts'];
type NamefiFeedListingsPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listListings'];
type NamefiFeedReportsPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listReports'];
type NamefiFeedDigestDeliveriesPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listDigestDeliveries'];
type NamefiFeedDigestRunsPage = InferContractOutputs<
  typeof adminNamefiFeedContract
>['listDigestRuns'];
type NamefiFeedRunRow = NamefiFeedRunsPage['rows'][number];
type NamefiFeedRunSourceResult = NamefiFeedRunRow['sourceResults'][number];

type SettingsDraft = {
  autoScanEnabled: boolean;
  enabledSources: FeedSourceId[];
  sourceSettings: FeedSourceSettings;
  maxPostsProcessedPerRun: number;
};

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
  enabledSources: ['x', 'namepros', 'dnforum'],
  sourceSettings: {
    x: {
      maxQueries: 3,
      maxPagesPerQuery: 1,
      maxTweetsPerQuery: 10,
      maxTweetAgeMinutes: 1440,
      overlapMinutes: 5,
    },
    namepros: {
      maxPostAgeMinutes: 1440,
    },
    dnforum: {
      maxPostAgeMinutes: 1440,
    },
  },
  maxPostsProcessedPerRun: 500,
};
const DEFAULT_SETTINGS_ACCORDION_VALUE = ['global', 'x', 'namepros', 'dnforum'];
const SOURCE_DISPLAY_ORDER: FeedSourceId[] = ['x', 'namepros', 'dnforum'];

const MANUAL_TWEET_SPLIT_PATTERN = /[\s,]+/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const TABLE_FILTER_DISPLAY_OPTIONS = { showInHeader: false } as const;
const INGESTION_RUN_STATUS_FILTER_OPTIONS = selectFilterOptions([
  'running',
  'completed',
  'failed',
  'skipped',
]);
const INGESTION_RUN_TRIGGER_FILTER_OPTIONS = selectFilterOptions([
  'scheduled',
  'manual',
]);
const POST_STATUS_FILTER_OPTIONS = selectFilterOptions([
  'pending',
  'processing',
  'processed',
  'skipped',
  'failed',
]);
const POST_SOURCE_FILTER_OPTIONS = selectFilterOptions([
  'auto_scan',
  'manual',
  'system',
]);
const LISTING_END_REASON_FILTER_OPTIONS = selectFilterOptions([
  'cancelled',
  'expired',
  'sold',
  'superseded',
]);
const REPORT_REASON_FILTER_OPTIONS = selectFilterOptions([
  'already_sold',
  'inaccurate_price',
  'not_for_sale',
  'duplicate_listing',
  'other',
]);
const DIGEST_RUN_STATUS_FILTER_OPTIONS = selectFilterOptions([
  'running',
  'dry_run',
  'sent',
  'skipped',
  'failed',
  'partial',
]);
const DIGEST_DELIVERY_STATUS_FILTER_OPTIONS = selectFilterOptions([
  'pending',
  'sent',
  'failed',
  'skipped',
  'partial',
]);
const DIGEST_TARGET_TYPE_FILTER_OPTIONS = [
  { value: 'slack', label: 'Slack' },
  { value: 'telegram_group', label: 'Telegram' },
  { value: 'discord_channel', label: 'Discord' },
];

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
  const { hasPermissions: canWriteNamefiFeed } = useHasPermissions([
    Permission.WRITE_NAMEFI_FEED,
  ]);
  const [settingsDraft, setSettingsDraft] =
    useState<SettingsDraft>(EMPTY_SETTINGS_DRAFT);
  const [manualTweetsText, setManualTweetsText] = useState('');
  const [includeReplies, setIncludeReplies] = useState(false);
  const [digestIncludeImage, setDigestIncludeImage] = useState(true);
  const [digestIncludeAnimation, setDigestIncludeAnimation] = useState(true);
  const [digestDryRun, setDigestDryRun] = useState(false);
  const [digestConfirmOpen, setDigestConfirmOpen] = useState(false);
  const [settingsAccordionValue, setSettingsAccordionValue] = useState<
    string[]
  >(DEFAULT_SETTINGS_ACCORDION_VALUE);
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
      enabledSources: overview.settings.enabledSources,
      sourceSettings: overview.settings.sourceSettings,
      maxPostsProcessedPerRun: overview.settings.maxPostsProcessedPerRun,
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
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.getOverview.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listRuns.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listPosts.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listListings.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listReports.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listDigestDeliveries.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.admin.namefiFeed.listDigestRuns.queryKey(),
      }),
    ]);

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

  const settingsLoaded = Boolean(overview?.settings);
  const settingsDirty = overview?.settings
    ? !settingsDraftMatchesSettings(settingsDraft, overview.settings)
    : false;
  const settingsControlsDisabled =
    !settingsLoaded || !canWriteNamefiFeed || updateSettingsMutation.isPending;
  const openSettingsPanels = useMemo(
    () =>
      filterSettingsAccordionValue(
        settingsAccordionValue,
        settingsDraft.enabledSources,
      ),
    [settingsAccordionValue, settingsDraft.enabledSources],
  );

  const saveSettings = () => {
    updateSettingsMutation.mutate({
      autoScanEnabled: settingsDraft.autoScanEnabled,
      enabledSources: settingsDraft.enabledSources,
      searchQueries: overview?.settings.searchQueries ?? [],
      sourceSettings: settingsDraft.sourceSettings,
      maxPostsProcessedPerRun: settingsDraft.maxPostsProcessedPerRun,
    });
  };

  const toggleFeedSource = (sourceId: FeedSourceId, enabled: boolean) => {
    setSettingsDraft((draft) => ({
      ...draft,
      enabledSources: enabled
        ? Array.from(new Set([...draft.enabledSources, sourceId]))
        : draft.enabledSources.filter((id) => id !== sourceId),
    }));
    setSettingsAccordionValue((current) =>
      enabled
        ? Array.from(new Set([...current, sourceId]))
        : current.filter((value) => value !== sourceId),
    );
  };

  const updateDigestIncludeImage = (checked: boolean) => {
    setDigestIncludeImage(checked);
    if (!checked) {
      setDigestIncludeAnimation(false);
    }
  };

  const updateDigestIncludeAnimation = (checked: boolean) => {
    setDigestIncludeAnimation(checked);
    if (checked) {
      setDigestIncludeImage(true);
    }
  };

  const updateXSourceSetting = (
    key: keyof FeedSourceSettings['x'],
    value: number,
  ) => {
    setSettingsDraft((draft) => ({
      ...draft,
      sourceSettings: {
        ...draft.sourceSettings,
        x: {
          ...draft.sourceSettings.x,
          [key]: value,
        },
      },
    }));
  };

  const updateMarketplaceSourceSetting = (
    sourceId: 'namepros' | 'dnforum',
    key: keyof FeedSourceSettings['namepros'],
    value: number,
  ) => {
    setSettingsDraft((draft) => ({
      ...draft,
      sourceSettings: {
        ...draft.sourceSettings,
        [sourceId]: {
          ...draft.sourceSettings[sourceId],
          [key]: value,
        },
      },
    }));
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
      includeImage: digestIncludeImage || digestIncludeAnimation,
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
  const savedEnabledSourceIds = overview?.settings.enabledSources ?? [];
  const xScanSourceEnabled = savedEnabledSourceIds.includes('x');
  const hasRunnableSavedScanSource =
    savedEnabledSourceIds.some((sourceId) => sourceId !== 'x') ||
    (xScanSourceEnabled && Boolean(overview?.xBearerTokenConfigured));
  const canQueueManualTweets =
    xScanSourceEnabled && Boolean(overview?.xBearerTokenConfigured);
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
            Configure NAMEFI_FEED_X_BEARER_TOKEN before running X scans or
            manual tweet ingestion. Marketplace RSS scans can still run when
            enabled.
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

      <Tabs defaultValue="runs" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start lg:w-auto">
          <TabsTrigger value="runs">Ingested</TabsTrigger>
          <TabsTrigger value="posts">Processed</TabsTrigger>
          <TabsTrigger value="listings">Listed</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="targets">Digest Targets</TabsTrigger>
          <TabsTrigger value="digest-runs">Digest Runs</TabsTrigger>
          <TabsTrigger value="deliveries">Digest Deliveries</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.7fr)_minmax(360px,0.7fr)]">
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle>Ingestion Settings</CardTitle>
                <CardDescription>
                  Scheduled scans use these sources and processing limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Accordion
                  multiple
                  value={openSettingsPanels}
                  onValueChange={(value) =>
                    setSettingsAccordionValue(
                      filterSettingsAccordionValue(
                        value.filter(
                          (item): item is string => typeof item === 'string',
                        ),
                        settingsDraft.enabledSources,
                      ),
                    )
                  }
                  className="rounded-md border"
                >
                  <AccordionItem value="global" className="px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <SettingsPanelHeading
                        title="Global"
                        description="Run scheduling and shared AI processing budget."
                      />
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
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
                          disabled={settingsControlsDisabled}
                          onCheckedChange={(autoScanEnabled) =>
                            setSettingsDraft((draft) => ({
                              ...draft,
                              autoScanEnabled,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <NumberField
                          id="max-process-posts"
                          label="AI/run"
                          value={settingsDraft.maxPostsProcessedPerRun}
                          min={1}
                          max={2000}
                          disabled={settingsControlsDisabled}
                          onChange={(maxPostsProcessedPerRun) =>
                            setSettingsDraft((draft) => ({
                              ...draft,
                              maxPostsProcessedPerRun,
                            }))
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {(overview?.settings.sources ?? []).map((source) => {
                    const sourceSwitchId = `feed-source-${source.id}`;
                    const enabled = settingsDraft.enabledSources.includes(
                      source.id,
                    );
                    const sourceControlsDisabled =
                      settingsControlsDisabled || !enabled;

                    return (
                      <AccordionItem
                        key={source.id}
                        value={source.id}
                        className="px-4"
                      >
                        <div className="flex items-center gap-3">
                          <AccordionTrigger
                            className="min-w-0 flex-1 hover:no-underline"
                            disabled={!enabled}
                          >
                            <SettingsPanelHeading
                              title={source.label}
                              description={feedSourceKindLabel(source.kind)}
                              badge={enabled ? 'Enabled' : 'Disabled'}
                            />
                          </AccordionTrigger>
                          <Switch
                            id={sourceSwitchId}
                            checked={enabled}
                            disabled={settingsControlsDisabled}
                            onCheckedChange={(checked) =>
                              toggleFeedSource(source.id, checked)
                            }
                            aria-label={`Toggle ${source.label}`}
                          />
                        </div>
                        <AccordionContent className="flex flex-col gap-4">
                          {source.id === 'x' ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              <NumberField
                                id="x-max-queries"
                                label="Queries"
                                value={
                                  settingsDraft.sourceSettings.x.maxQueries
                                }
                                min={1}
                                max={12}
                                disabled={sourceControlsDisabled}
                                onChange={(maxQueries) =>
                                  updateXSourceSetting('maxQueries', maxQueries)
                                }
                              />
                              <NumberField
                                id="x-max-pages"
                                label="Pages/query"
                                value={
                                  settingsDraft.sourceSettings.x
                                    .maxPagesPerQuery
                                }
                                min={1}
                                max={10}
                                disabled={sourceControlsDisabled}
                                onChange={(maxPagesPerQuery) =>
                                  updateXSourceSetting(
                                    'maxPagesPerQuery',
                                    maxPagesPerQuery,
                                  )
                                }
                              />
                              <NumberField
                                id="x-max-tweets"
                                label="Tweets/query"
                                value={
                                  settingsDraft.sourceSettings.x
                                    .maxTweetsPerQuery
                                }
                                min={10}
                                max={100}
                                disabled={sourceControlsDisabled}
                                onChange={(maxTweetsPerQuery) =>
                                  updateXSourceSetting(
                                    'maxTweetsPerQuery',
                                    maxTweetsPerQuery,
                                  )
                                }
                              />
                              <NumberField
                                id="x-max-age"
                                label="Lookback min"
                                value={
                                  settingsDraft.sourceSettings.x
                                    .maxTweetAgeMinutes
                                }
                                min={15}
                                max={1440}
                                disabled={sourceControlsDisabled}
                                onChange={(maxTweetAgeMinutes) =>
                                  updateXSourceSetting(
                                    'maxTweetAgeMinutes',
                                    maxTweetAgeMinutes,
                                  )
                                }
                              />
                              <NumberField
                                id="x-overlap"
                                label="Overlap min"
                                value={
                                  settingsDraft.sourceSettings.x.overlapMinutes
                                }
                                min={0}
                                max={1440}
                                disabled={sourceControlsDisabled}
                                onChange={(overlapMinutes) =>
                                  updateXSourceSetting(
                                    'overlapMinutes',
                                    overlapMinutes,
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              <NumberField
                                id={`${source.id}-max-post-age`}
                                label="Lookback min"
                                value={
                                  settingsDraft.sourceSettings[
                                    source.id === 'dnforum'
                                      ? 'dnforum'
                                      : 'namepros'
                                  ].maxPostAgeMinutes
                                }
                                min={15}
                                max={1440}
                                disabled={sourceControlsDisabled}
                                onChange={(maxPostAgeMinutes) =>
                                  updateMarketplaceSourceSetting(
                                    source.id === 'dnforum'
                                      ? 'dnforum'
                                      : 'namepros',
                                    'maxPostAgeMinutes',
                                    maxPostAgeMinutes,
                                  )
                                }
                              />
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                <PermissionGate permissions={[Permission.WRITE_NAMEFI_FEED]}>
                  <Button
                    className="self-end"
                    onClick={saveSettings}
                    disabled={
                      !settingsLoaded || updateSettingsMutation.isPending
                    }
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
                    onClick={() =>
                      startIngestionMutation.mutate({ mode: 'scan' })
                    }
                    disabled={
                      !settingsLoaded ||
                      settingsDirty ||
                      updateSettingsMutation.isPending ||
                      startIngestionMutation.isPending ||
                      !hasRunnableSavedScanSource
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
                    onChange={(event) =>
                      setManualTweetsText(event.target.value)
                    }
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
                      startIngestionMutation.isPending || !canQueueManualTweets
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
                  onCheckedChange={updateDigestIncludeImage}
                />
                <ToggleRow
                  id="digest-animation"
                  label="Animation"
                  checked={digestIncludeAnimation}
                  onCheckedChange={updateDigestIncludeAnimation}
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
                              checked={selectedDigestTargetIds.includes(
                                target.id,
                              )}
                              disabled={runDigestMutation.isPending}
                              onCheckedChange={(checked) =>
                                setSelectedDigestTargetIds((current) =>
                                  checked === true
                                    ? Array.from(
                                        new Set([...current, target.id]),
                                      )
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
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <ListingsTable
            isMutating={suppressListingMutation.isPending}
            onToggleSuppressed={(listingId, suppressed) =>
              suppressListingMutation.mutate({ listingId, suppressed })
            }
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsTable
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

        <TabsContent value="digest-runs" className="mt-4">
          <DigestRunsTable />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <DeliveriesTable />
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          <RunsTable />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <PostsTable />
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
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
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
        disabled={disabled}
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
  disabled,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function SettingsPanelHeading({
  badge,
  description,
  title,
}: {
  badge?: string;
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span>{title}</span>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
      <span className="text-xs font-normal text-muted-foreground">
        {description}
      </span>
    </div>
  );
}

function filterSettingsAccordionValue(
  values: string[],
  enabledSources: FeedSourceId[],
) {
  const enabledSourceSet = new Set(enabledSources);
  return values.filter(
    (value) =>
      value === 'global' ||
      (isFeedSourceId(value) && enabledSourceSet.has(value)),
  );
}

function isFeedSourceId(value: string): value is FeedSourceId {
  return value === 'x' || value === 'namepros' || value === 'dnforum';
}

function settingsDraftMatchesSettings(
  draft: SettingsDraft,
  settings: FeedSettings,
) {
  return (
    draft.autoScanEnabled === settings.autoScanEnabled &&
    sameStringSet(draft.enabledSources, settings.enabledSources) &&
    sourceSettingsMatch(draft.sourceSettings, settings.sourceSettings) &&
    draft.maxPostsProcessedPerRun === settings.maxPostsProcessedPerRun
  );
}

function sourceSettingsMatch(
  draft: FeedSourceSettings,
  settings: FeedSourceSettings,
) {
  return (
    draft.x.maxQueries === settings.x.maxQueries &&
    draft.x.maxPagesPerQuery === settings.x.maxPagesPerQuery &&
    draft.x.maxTweetsPerQuery === settings.x.maxTweetsPerQuery &&
    draft.x.maxTweetAgeMinutes === settings.x.maxTweetAgeMinutes &&
    draft.x.overlapMinutes === settings.x.overlapMinutes &&
    draft.namepros.maxPostAgeMinutes === settings.namepros.maxPostAgeMinutes &&
    draft.dnforum.maxPostAgeMinutes === settings.dnforum.maxPostAgeMinutes
  );
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function feedSourceKindLabel(kind: FeedSource['kind']) {
  return kind === 'social' ? 'Social scan' : 'Marketplace RSS';
}

function formatFeedSourceId(source: FeedSourceId) {
  if (source === 'x') {
    return 'X';
  }

  return source === 'namepros' ? 'NamePros' : 'DNForum';
}

function useNamefiFeedServerTableControls({
  defaultColumnVisibility = {},
  defaultSorting,
  tableId,
}: {
  defaultColumnVisibility?: VisibilityState;
  defaultSorting: SortingState;
  tableId: string;
}) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    preferences: {
      columnVisibility,
      filters: columnFilters,
      sorting,
      pageSize,
    },
    setColumnVisibility,
    setFilters,
    setSorting,
    setPageSize,
    resetToDefaults,
  } = useTablePreferences({
    tableId,
    defaultPreferences: {
      columnVisibility: defaultColumnVisibility,
      filters: [],
      sorting: defaultSorting,
      pageSize: 25,
    },
  });
  const queryInput = useMemo(
    () => ({
      page,
      pageSize,
      columnFilters: columnFilters.length > 0 ? columnFilters : undefined,
      searchTerm: searchTerm.trim() || undefined,
      sorting: sorting.length > 0 ? sorting : undefined,
    }),
    [columnFilters, page, pageSize, searchTerm, sorting],
  );

  return {
    columnFilters,
    columnVisibility,
    page,
    pageSize,
    queryInput,
    resetToDefaults,
    searchTerm,
    setColumnFilters: (nextColumnFilters: ColumnFiltersState) => {
      setPage(1);
      setFilters(nextColumnFilters);
    },
    setColumnVisibility,
    setPage,
    setPageSize: (nextPageSize: number) => {
      setPage(1);
      setPageSize(nextPageSize);
    },
    setSearchTerm: (nextSearchTerm: string) => {
      setPage(1);
      setSearchTerm(nextSearchTerm);
    },
    setSorting: (nextSorting: SortingState) => {
      setPage(1);
      setSorting(nextSorting);
    },
    sorting,
  };
}

function RunSourcesCell({ run }: { run: NamefiFeedRunRow }) {
  if (run.sourceResults.length === 0) {
    return <span>-</span>;
  }

  const summaries = summarizeRunSources(run.sourceResults);
  const totals = summaries.reduce(
    (accumulator, summary) => ({
      scannedPostCount: accumulator.scannedPostCount + summary.scannedPostCount,
      queuedPostCount: accumulator.queuedPostCount + summary.queuedPostCount,
      alreadyExistingCount:
        accumulator.alreadyExistingCount + summary.alreadyExistingCount,
      skippedPostCount: accumulator.skippedPostCount + summary.skippedPostCount,
      failedFeedCount: accumulator.failedFeedCount + summary.failedFeedCount,
      skippedFeedCount: accumulator.skippedFeedCount + summary.skippedFeedCount,
    }),
    {
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      skippedPostCount: 0,
      failedFeedCount: 0,
      skippedFeedCount: 0,
    },
  );

  return (
    <div
      className="max-w-[320px] space-y-1"
      title={formatRunSourceDetails(run.sourceResults)}
    >
      <div className="flex flex-wrap gap-1">
        {summaries.map((summary) => (
          <Badge
            key={summary.source}
            variant={summary.failedFeedCount > 0 ? 'destructive' : 'outline'}
          >
            {formatFeedSourceId(summary.source)} {summary.queuedPostCount}/
            {summary.scannedPostCount}
          </Badge>
        ))}
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {run.sourceResults.length} feeds · {totals.queuedPostCount} queued ·{' '}
        {totals.alreadyExistingCount} existing · {totals.skippedPostCount}{' '}
        skipped
        {totals.failedFeedCount > 0
          ? ` · ${totals.failedFeedCount} failed`
          : ''}
        {totals.skippedFeedCount > 0
          ? ` · ${totals.skippedFeedCount} skipped feeds`
          : ''}
      </p>
    </div>
  );
}

function summarizeRunSources(sources: NamefiFeedRunSourceResult[]) {
  const summaries = new Map<
    FeedSourceId,
    {
      source: FeedSourceId;
      scannedPostCount: number;
      queuedPostCount: number;
      alreadyExistingCount: number;
      skippedPostCount: number;
      failedFeedCount: number;
      skippedFeedCount: number;
    }
  >();

  for (const source of sources) {
    const summary = summaries.get(source.source) ?? {
      source: source.source,
      scannedPostCount: 0,
      queuedPostCount: 0,
      alreadyExistingCount: 0,
      skippedPostCount: 0,
      failedFeedCount: 0,
      skippedFeedCount: 0,
    };

    summary.scannedPostCount += source.scannedPostCount;
    summary.queuedPostCount += source.queuedPostCount;
    summary.alreadyExistingCount += source.alreadyExistingCount;
    summary.skippedPostCount += source.skippedPostCount;
    if (isRunSourceFailure(source)) {
      summary.failedFeedCount += 1;
    } else if (source.skipped) {
      summary.skippedFeedCount += 1;
    }

    summaries.set(source.source, summary);
  }

  return Array.from(summaries.values()).sort(
    (a, b) =>
      SOURCE_DISPLAY_ORDER.indexOf(a.source) -
      SOURCE_DISPLAY_ORDER.indexOf(b.source),
  );
}

function formatRunSourceDetails(sources: NamefiFeedRunSourceResult[]) {
  return sources
    .map((source) => {
      const sourceLabel = source.feedId
        ? `${formatFeedSourceId(source.source)}: ${source.feedId}`
        : formatFeedSourceId(source.source);
      const status = source.skipped ? (source.reason ?? 'skipped') : 'ok';
      return `${sourceLabel} · ${status} · scanned ${source.scannedPostCount}, queued ${source.queuedPostCount}, existing ${source.alreadyExistingCount}, skipped ${source.skippedPostCount}`;
    })
    .join('\n');
}

function isRunSourceFailure(source: NamefiFeedRunSourceResult) {
  return Boolean(source.errorMessage || source.reason?.includes('failed'));
}

function formatDigestRunRender(run: NamefiFeedDigestRunsPage['rows'][number]) {
  const parts = [
    run.usedFallback ? 'fallback' : 'ai',
    run.imageGenerated ? 'image' : null,
    run.animationGenerated ? 'animation' : null,
    run.dryRun ? 'dry run' : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : '-';
}

function TemporalWorkflowLink({
  temporalRunId,
  temporalUiUrl,
  workflowId,
}: {
  temporalRunId?: string | null;
  temporalUiUrl?: string | null;
  workflowId?: string | null;
}) {
  if (!temporalUiUrl) {
    return '-';
  }

  const label =
    workflowId && temporalRunId
      ? `Open Temporal workflow ${workflowId} run ${temporalRunId}`
      : `Open Temporal workflow ${workflowId ?? ''}`;

  return (
    <a
      href={temporalUiUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={
        workflowId && temporalRunId
          ? `${workflowId} / ${temporalRunId}`
          : (workflowId ?? 'Open Temporal workflow')
      }
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function ListingsTable({
  isMutating,
  onToggleSuppressed,
}: {
  isMutating: boolean;
  onToggleSuppressed: (listingId: string, suppressed: boolean) => void;
}) {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-listings',
    defaultSorting: [{ id: 'postedAt', desc: true }],
  });
  const listingsQuery = useQuery(
    trpc.admin.namefiFeed.listListings.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const listings = listingsQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      domain: { type: 'text' as const, label: 'Domain' },
      sellerUsername: { type: 'text' as const, label: 'Seller' },
      asking: { type: 'text' as const, label: 'Asking' },
      postedAt: { type: 'date' as const, label: 'Posted' },
      listedAt: { type: 'date' as const, label: 'Listed' },
      expiresAt: { type: 'date' as const, label: 'Expires' },
      endReason: {
        type: 'select' as const,
        label: 'End Reason',
        options: LISTING_END_REASON_FILTER_OPTIONS,
      },
    }),
    [],
  );
  const columns = useMemo<ColumnDef<NamefiFeedListingsPage['rows'][number]>[]>(
    () => [
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <Link
            href={{
              pathname: '/',
              query: { query: row.original.domain },
            }}
            className="font-medium hover:underline"
          >
            {row.original.domain}
          </Link>
        ),
      },
      {
        accessorKey: 'sellerUsername',
        header: 'Seller',
        cell: ({ row }) =>
          row.original.sellerUsername ?? row.original.sellerDisplayName ?? '-',
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
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ row }) => formatDate(row.original.expiresAt),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getListingLifecycleStatus(row.original);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
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
    <ServerDataTable
      columns={columns}
      data={listings}
      isLoading={listingsQuery.isLoading}
      isFetching={listingsQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={listingsQuery.data?.totalPages ?? 1}
      totalCount={listingsQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No recent listings found"
      searchPlaceholder="Search listings..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
    />
  );
}

function ReportsTable({
  isMutating,
  onResolve,
}: {
  isMutating: boolean;
  onResolve: (
    reportId: string,
    resolution: 'suppressed_listing' | 'dismissed',
  ) => void;
}) {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-reports',
    defaultSorting: [{ id: 'createdAt', desc: true }],
  });
  const reportsQuery = useQuery(
    trpc.admin.namefiFeed.listReports.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const reports = reportsQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      domain: { type: 'text' as const, label: 'Domain' },
      reason: {
        type: 'select' as const,
        label: 'Reason',
        options: REPORT_REASON_FILTER_OPTIONS,
      },
      details: { type: 'text' as const, label: 'Details' },
      createdAt: { type: 'date' as const, label: 'Reported' },
    }),
    [],
  );
  const columns = useMemo<ColumnDef<NamefiFeedReportsPage['rows'][number]>[]>(
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
    <ServerDataTable
      columns={columns}
      data={reports}
      isLoading={reportsQuery.isLoading}
      isFetching={reportsQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={reportsQuery.data?.totalPages ?? 1}
      totalCount={reportsQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No active reports"
      searchPlaceholder="Search reports..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
    />
  );
}

function RunsTable() {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-runs',
    defaultSorting: [{ id: 'startedAt', desc: true }],
  });
  const runsQuery = useQuery(
    trpc.admin.namefiFeed.listRuns.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const runs = runsQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      status: {
        type: 'select' as const,
        label: 'Status',
        options: INGESTION_RUN_STATUS_FILTER_OPTIONS,
      },
      trigger: {
        type: 'select' as const,
        label: 'Trigger',
        options: INGESTION_RUN_TRIGGER_FILTER_OPTIONS,
      },
      startedAt: { type: 'date' as const, label: 'Started' },
      finishedAt: { type: 'date' as const, label: 'Finished' },
      scannedPostCount: { type: 'number' as const, label: 'Scanned' },
      queuedPostCount: { type: 'number' as const, label: 'Queued' },
      processedPostCount: { type: 'number' as const, label: 'Processed' },
      listingUpsertedCount: { type: 'number' as const, label: 'Listings' },
      skippedPostCount: { type: 'number' as const, label: 'Skipped' },
      failedPostCount: { type: 'number' as const, label: 'Failed' },
      errorMessage: { type: 'text' as const, label: 'Error' },
    }),
    [],
  );
  const columns = useMemo<ColumnDef<NamefiFeedRunsPage['rows'][number]>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: 'trigger', header: 'Trigger' },
      {
        id: 'workflow',
        accessorFn: (row) => row.workflowId ?? '',
        header: 'Workflow',
        cell: ({ row }) => (
          <TemporalWorkflowLink
            temporalRunId={row.original.temporalRunId}
            workflowId={row.original.workflowId}
            temporalUiUrl={row.original.temporalUiUrl}
          />
        ),
      },
      {
        accessorKey: 'startedAt',
        header: 'Started',
        cell: ({ row }) => formatDate(row.original.startedAt),
      },
      { accessorKey: 'queuedPostCount', header: 'Queued' },
      {
        accessorKey: 'alreadyExistingPostCount',
        header: 'Existing',
        enableSorting: false,
      },
      {
        accessorKey: 'scanSkippedPostCount',
        header: 'Scan Skipped',
        enableSorting: false,
      },
      {
        accessorKey: 'aiAnalysisAttemptedPostCount',
        header: 'AI Attempts',
        enableSorting: false,
      },
      {
        accessorKey: 'maxPostsProcessedPerRun',
        header: 'AI Budget',
        enableSorting: false,
      },
      {
        accessorKey: 'remainingPostCount',
        header: 'Remaining',
        enableSorting: false,
      },
      { accessorKey: 'processedPostCount', header: 'Processed' },
      { accessorKey: 'listingUpsertedCount', header: 'Listings' },
      { accessorKey: 'failedPostCount', header: 'Failed' },
      {
        id: 'sources',
        header: 'Sources',
        cell: ({ row }) => <RunSourcesCell run={row.original} />,
      },
      {
        accessorKey: 'errorMessage',
        header: 'Error',
        cell: ({ row }) =>
          row.original.errorMessage ?? row.original.skipReason ?? '-',
      },
      {
        accessorKey: 'stopReason',
        header: 'Stop',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.stopReason
            ? formatEnumLabel(row.original.stopReason)
            : '-',
      },
    ],
    [],
  );

  return (
    <ServerDataTable
      columns={columns}
      data={runs}
      isLoading={runsQuery.isLoading}
      isFetching={runsQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={runsQuery.data?.totalPages ?? 1}
      totalCount={runsQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No recent ingestion runs"
      searchPlaceholder="Search runs..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
    />
  );
}

function PostsTable() {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-posts',
    defaultSorting: [{ id: 'postedAt', desc: true }],
  });
  const postsQuery = useQuery(
    trpc.admin.namefiFeed.listPosts.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const posts = postsQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      status: {
        type: 'select' as const,
        label: 'Status',
        options: POST_STATUS_FILTER_OPTIONS,
      },
      source: {
        type: 'select' as const,
        label: 'Source',
        options: POST_SOURCE_FILTER_OPTIONS,
      },
      authorUsername: { type: 'text' as const, label: 'Author' },
      postedAt: { type: 'date' as const, label: 'Posted' },
      createdAt: { type: 'date' as const, label: 'Queued' },
      processedAt: { type: 'date' as const, label: 'Processed' },
      reason: { type: 'text' as const, label: 'Reason' },
    }),
    [],
  );
  const columns = useMemo<ColumnDef<NamefiFeedPostsPage['rows'][number]>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: 'source', header: 'Source' },
      {
        id: 'workflow',
        accessorFn: (row) => row.ingestionWorkflowId ?? '',
        header: 'Workflow',
        cell: ({ row }) => (
          <TemporalWorkflowLink
            temporalRunId={row.original.temporalRunId}
            workflowId={row.original.ingestionWorkflowId}
            temporalUiUrl={row.original.temporalUiUrl}
          />
        ),
      },
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
    <ServerDataTable
      columns={columns}
      data={posts}
      isLoading={postsQuery.isLoading}
      isFetching={postsQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={postsQuery.data?.totalPages ?? 1}
      totalCount={postsQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No recent posts"
      searchPlaceholder="Search posts..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
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

function DigestRunsTable() {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-digest-runs',
    defaultSorting: [{ id: 'generatedAt', desc: true }],
  });
  const runsQuery = useQuery(
    trpc.admin.namefiFeed.listDigestRuns.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const runs = runsQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      status: {
        type: 'select' as const,
        label: 'Status',
        options: DIGEST_RUN_STATUS_FILTER_OPTIONS,
      },
      trigger: {
        type: 'select' as const,
        label: 'Trigger',
        options: INGESTION_RUN_TRIGGER_FILTER_OPTIONS,
      },
      generatedAt: { type: 'date' as const, label: 'Generated' },
      window: { type: 'date' as const, label: 'Window Start' },
      entriesCount: { type: 'number' as const, label: 'Entries' },
      targetCount: { type: 'number' as const, label: 'Targets' },
      sentCount: { type: 'number' as const, label: 'Sent' },
      skippedCount: { type: 'number' as const, label: 'Skipped' },
      failedCount: { type: 'number' as const, label: 'Failed' },
      reason: { type: 'text' as const, label: 'Reason' },
    }),
    [],
  );
  const columns = useMemo<
    ColumnDef<NamefiFeedDigestRunsPage['rows'][number]>[]
  >(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: 'trigger', header: 'Trigger' },
      {
        id: 'workflow',
        accessorFn: (row) => row.workflowId ?? '',
        header: 'Workflow',
        cell: ({ row }) => (
          <TemporalWorkflowLink
            temporalRunId={row.original.temporalRunId}
            workflowId={row.original.workflowId}
            temporalUiUrl={row.original.temporalUiUrl}
          />
        ),
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
      { accessorKey: 'entriesCount', header: 'Entries' },
      { accessorKey: 'targetCount', header: 'Targets' },
      { accessorKey: 'sentCount', header: 'Sent' },
      { accessorKey: 'skippedCount', header: 'Skipped' },
      { accessorKey: 'failedCount', header: 'Failed' },
      {
        id: 'render',
        header: 'Render',
        cell: ({ row }) => formatDigestRunRender(row.original),
      },
      {
        id: 'reason',
        header: 'Reason',
        cell: ({ row }) =>
          row.original.errorMessage ??
          row.original.skipReason ??
          row.original.fallbackReason ??
          '-',
      },
    ],
    [],
  );

  return (
    <ServerDataTable
      columns={columns}
      data={runs}
      isLoading={runsQuery.isLoading}
      isFetching={runsQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={runsQuery.data?.totalPages ?? 1}
      totalCount={runsQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No digest runs yet"
      searchPlaceholder="Search digest runs..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
    />
  );
}

function DeliveriesTable() {
  const trpc = useTRPC();
  const table = useNamefiFeedServerTableControls({
    tableId: 'admin-namefi-feed-digest-deliveries',
    defaultSorting: [{ id: 'generatedAt', desc: true }],
  });
  const deliveriesQuery = useQuery(
    trpc.admin.namefiFeed.listDigestDeliveries.queryOptions(table.queryInput, {
      placeholderData: (previous) => previous,
      trpc: { context: { skipBatch: true } },
    }),
  );
  const deliveries = deliveriesQuery.data?.rows ?? [];
  const filterConfig = useMemo(
    () => ({
      status: {
        type: 'select' as const,
        label: 'Status',
        options: DIGEST_DELIVERY_STATUS_FILTER_OPTIONS,
      },
      targetType: {
        type: 'select' as const,
        label: 'Channel',
        options: DIGEST_TARGET_TYPE_FILTER_OPTIONS,
      },
      targetLabel: { type: 'text' as const, label: 'Target' },
      generatedAt: { type: 'date' as const, label: 'Generated' },
      window: { type: 'date' as const, label: 'Window Start' },
      message: { type: 'text' as const, label: 'Message' },
      error: { type: 'text' as const, label: 'Error' },
    }),
    [],
  );
  const columns = useMemo<
    ColumnDef<NamefiFeedDigestDeliveriesPage['rows'][number]>[]
  >(
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
    <ServerDataTable
      columns={columns}
      data={deliveries}
      isLoading={deliveriesQuery.isLoading}
      isFetching={deliveriesQuery.isFetching}
      page={table.page}
      pageSize={table.pageSize}
      totalPages={deliveriesQuery.data?.totalPages ?? 1}
      totalCount={deliveriesQuery.data?.totalCount ?? 0}
      onPageChange={table.setPage}
      onPageSizeChange={table.setPageSize}
      sorting={table.sorting}
      onSortingChange={table.setSorting}
      searchTerm={table.searchTerm}
      onSearchChange={table.setSearchTerm}
      columnFilters={table.columnFilters}
      onColumnFiltersChange={table.setColumnFilters}
      filterConfig={filterConfig}
      filterDisplayOptions={TABLE_FILTER_DISPLAY_OPTIONS}
      emptyMessage="No digest deliveries yet"
      searchPlaceholder="Search deliveries..."
      columnVisibility={table.columnVisibility}
      onColumnVisibilityChange={table.setColumnVisibility}
      onResetPreferences={table.resetToDefaults}
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

function getListingLifecycleStatus(
  listing: NamefiFeedOverview['recentListings'][number],
): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (listing.suppressed) {
    return { label: 'Suppressed', variant: 'destructive' };
  }

  if (listing.endedAt) {
    return {
      label: listing.endReason ? formatEnumLabel(listing.endReason) : 'Ended',
      variant: 'secondary',
    };
  }

  if (listing.expiresAt) {
    const expiresAt = Date.parse(listing.expiresAt);
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      return { label: 'Expired', variant: 'secondary' };
    }
  }

  return { label: 'Visible', variant: 'outline' };
}

function formatDigestWindow(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function selectFilterOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: formatEnumLabel(value) }));
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
