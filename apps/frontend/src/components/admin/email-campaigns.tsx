'use client';

import type { Route } from 'next';
import { useCallback, useMemo, useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import type { AppRouterOutput } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { DataTable } from '@/components/table/data-table';
import { formatAmountInUSD } from '@/lib/number';
import {
  EMAIL_CAMPAIGNS,
  EMAIL_CAMPAIGN_KEYS,
  type EmailCampaignKey,
} from '@namefi-astra/common/email-campaigns';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Send,
  Copy,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { useDebounceValue } from 'usehooks-ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';

const CAMPAIGNS = EMAIL_CAMPAIGNS;
type CampaignKey = EmailCampaignKey;

type EligibleUsersResponse =
  AppRouterOutput['admin']['emailCampaigns']['getEligibleUsers'];
type EligibleUser = EligibleUsersResponse['users'][number];
type SendHistoryEntry = EligibleUser['sendHistory'][number];
type ScheduleStatusResponse =
  AppRouterOutput['admin']['emailCampaigns']['getScheduleStatus'];
type TrafficFunnelDebugResponse =
  AppRouterOutput['admin']['emailCampaigns']['getDomainTrafficSurgeFunnelDebug'];
type TrafficFunnelDebugUser = TrafficFunnelDebugResponse['users'][number];
type DreamOwnedDomainsModalState = {
  userId: string;
  email: string | null;
  domains: string[];
};
type TrafficDomainSignal = {
  domain: string;
  weeklyQueries: number;
};

const formatDateTime = (value?: Date | null) =>
  value ? format(value, 'MMM d, yyyy HH:mm') : '-';

const formatInteger = (value?: number | null) =>
  typeof value === 'number' ? new Intl.NumberFormat().format(value) : '-';

const formatLocalDateTime = (value?: Date | string | null) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
};

const formatUtcDate = (value?: string | null) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-').map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return '-';
  }
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const getTrafficDomains = (user: EligibleUser): TrafficDomainSignal[] => {
  if (Array.isArray(user.trafficDomains) && user.trafficDomains.length > 0) {
    return user.trafficDomains;
  }

  if (typeof user.trafficTopDomain === 'string') {
    return [
      {
        domain: user.trafficTopDomain,
        weeklyQueries:
          typeof user.trafficTopWeeklyQueries === 'number'
            ? user.trafficTopWeeklyQueries
            : 0,
      },
    ];
  }

  return [];
};

const getStatusBadge = (status?: string | null) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  if (status === 'SENT') return <Badge variant="default">Sent</Badge>;
  if (status === 'PENDING') return <Badge variant="secondary">Pending</Badge>;
  if (status === 'FAILED') return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const getDropOffStageBadge = (
  stage: TrafficFunnelDebugUser['dropOffStage'],
) => {
  if (stage === 'eligible') return <Badge variant="default">Eligible</Badge>;
  if (stage === 'already_sent') {
    return <Badge variant="secondary">Already Sent</Badge>;
  }
  if (stage === 'ownership') {
    return <Badge variant="outline">Dropped: Ownership</Badge>;
  }
  if (stage === 'nameservers') {
    return <Badge variant="outline">Dropped: Nameservers</Badge>;
  }
  return <Badge variant="outline">Dropped: Threshold</Badge>;
};

function TrafficDomainsCell({
  domains,
  domainCount,
}: {
  domains: TrafficDomainSignal[];
  domainCount?: number | null;
}) {
  if (domains.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const totalDomains = domainCount ?? domains.length;

  return (
    <div className="min-w-[280px] max-w-[520px] space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {formatInteger(totalDomains)}{' '}
          {totalDomains === 1 ? 'domain' : 'domains'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          aggregated into one email
        </span>
      </div>
      <div className="space-y-1">
        {domains.map((item) => (
          <div
            key={item.domain}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-2 py-1"
          >
            <code className="min-w-0 break-all font-mono text-xs">
              {item.domain}
            </code>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatInteger(item.weeklyQueries)} lookups
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignSendHistorySubrow({
  sendHistory,
}: {
  sendHistory: SendHistoryEntry[];
}) {
  const sorted = useMemo(() => {
    return [...sendHistory].sort((a, b) => {
      const aTime = (a.sentAt ?? a.createdAt).getTime();
      const bTime = (b.sentAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [sendHistory]);

  if (sorted.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No sends</div>;
  }

  return (
    <div className="p-4">
      <h4 className="text-sm font-medium mb-3">History</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Sent at</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[180px]">Period start</TableHead>
            <TableHead className="w-[120px]">Variant</TableHead>
            <TableHead className="w-[120px]">Attempts</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => {
            const variantLabel =
              typeof entry.metadata.variantIndex === 'number'
                ? `#${entry.metadata.variantIndex + 1}`
                : '-';
            return (
              <TableRow key={entry.id}>
                <TableCell className="text-xs">
                  {formatDateTime(entry.sentAt ?? entry.createdAt)}
                </TableCell>
                <TableCell>{getStatusBadge(entry.status)}</TableCell>
                <TableCell className="text-xs">
                  {formatDateTime(entry.periodStart)}
                </TableCell>
                <TableCell className="text-xs">{variantLabel}</TableCell>
                <TableCell className="text-xs">{entry.attemptCount}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {entry.lastError ?? '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CampaignSection({
  title,
  data,
  isLoading,
  scheduleStatus,
  isScheduleLoading,
  onToggleSchedule,
  onSetupSchedule,
  isTogglingSchedule,
  pageSize,
  onPageSizeChange,
  columns,
  emptyMessage,
  highlights,
}: {
  title: string;
  data: EligibleUsersResponse | undefined;
  isLoading: boolean;
  scheduleStatus?: ScheduleStatusResponse;
  isScheduleLoading?: boolean;
  onToggleSchedule?: (paused?: boolean) => void;
  onSetupSchedule?: (scheduleId?: string) => void;
  isTogglingSchedule?: boolean;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  columns: ColumnDef<EligibleUser>[];
  emptyMessage: string;
  highlights?: string[];
}) {
  const eligibleCount = data?.users.length ?? 0;
  const paused = scheduleStatus?.status?.paused;
  const isScheduleConfigured =
    scheduleStatus?.isConfigured ?? (isScheduleLoading ? true : false);
  const nextActionTime = scheduleStatus?.status?.nextActionTimes?.find(
    (time) => new Date(time).getTime() > Date.now(),
  );
  const nextScheduledSend = !isScheduleConfigured
    ? 'Not set up'
    : paused
      ? 'Paused'
      : formatLocalDateTime(
          nextActionTime ??
            scheduleStatus?.status?.nextActionTimes?.[0] ??
            null,
        );
  const scheduleLabel = isScheduleLoading
    ? 'Loading'
    : paused
      ? 'Resume'
      : 'Pause';
  const scheduleDisabled =
    isScheduleLoading ||
    isTogglingSchedule ||
    paused === undefined ||
    !isScheduleConfigured;
  const setupMessage =
    scheduleStatus?.message ??
    'Schedule is not set up in Temporal yet. Open Schedules to configure it.';

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {data?.periodStart && (
              <p className="text-xs text-muted-foreground mt-1">
                Cycle start (your local time):{' '}
                {formatLocalDateTime(data.periodStart)}.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Next scheduled send (your local time): {nextScheduledSend}.
            </p>
            {!isScheduleConfigured && (
              <p className="text-xs text-muted-foreground mt-1">
                {setupMessage}
              </p>
            )}
            {highlights?.map((line) => (
              <p key={line} className="text-xs text-muted-foreground mt-1">
                {line}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              {eligibleCount} eligible
            </Badge>
            {!isScheduleConfigured && onSetupSchedule ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetupSchedule(scheduleStatus?.scheduleId)}
              >
                <Settings2 className="h-4 w-4 me-2" />
                Set up schedule
              </Button>
            ) : onToggleSchedule ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleSchedule(paused)}
                disabled={scheduleDisabled}
              >
                {isTogglingSchedule || isScheduleLoading ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : paused ? (
                  <Play className="h-4 w-4 me-2" />
                ) : (
                  <Pause className="h-4 w-4 me-2" />
                )}
                {scheduleLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data?.users ?? []}
          isLoading={isLoading}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          renderSubRow={(row) => (
            <CampaignSendHistorySubrow sendHistory={row.original.sendHistory} />
          )}
          getRowCanExpand={() => true}
          emptyMessage={emptyMessage}
          loadingMessage="Loading..."
        />
      </CardContent>
    </Card>
  );
}

export default function AdminEmailCampaigns() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const normalizedSearchTerm = debouncedSearchTerm.trim() || undefined;
  const [cartPageSize, setCartPageSize] = useState(20);
  const [dreamPageSize, setDreamPageSize] = useState(20);
  const [trafficPageSize, setTrafficPageSize] = useState(20);
  const [dreamOwnedDomainsModal, setDreamOwnedDomainsModal] =
    useState<DreamOwnedDomainsModalState | null>(null);

  const cartQuery = useQuery({
    ...trpc.admin.emailCampaigns.getEligibleUsers.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
      searchTerm: normalizedSearchTerm,
    }),
  });

  const dreamQuery = useQuery({
    ...trpc.admin.emailCampaigns.getEligibleUsers.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
      searchTerm: normalizedSearchTerm,
    }),
  });

  const trafficQuery = useQuery({
    ...trpc.admin.emailCampaigns.getEligibleUsers.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
      searchTerm: normalizedSearchTerm,
    }),
  });

  const trafficFunnelQuery = useQuery({
    ...trpc.admin.emailCampaigns.getDomainTrafficSurgeFunnelDebug.queryOptions({
      searchTerm: normalizedSearchTerm,
      limit: 250,
    }),
  });

  const cartScheduleQuery = useQuery({
    ...trpc.admin.emailCampaigns.getScheduleStatus.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
    }),
  });

  const dreamScheduleQuery = useQuery({
    ...trpc.admin.emailCampaigns.getScheduleStatus.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
    }),
  });

  const trafficScheduleQuery = useQuery({
    ...trpc.admin.emailCampaigns.getScheduleStatus.queryOptions({
      campaignKey: EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
    }),
  });

  const updateSchedulePausedInCache = useCallback(
    (campaignKey: CampaignKey, paused: boolean) => {
      queryClient.setQueryData<ScheduleStatusResponse | undefined>(
        trpc.admin.emailCampaigns.getScheduleStatus.queryKey({ campaignKey }),
        (previous) => {
          if (!previous?.status) return previous;
          return {
            ...previous,
            status: {
              ...previous.status,
              paused,
            },
          };
        },
      );
    },
    [queryClient, trpc],
  );

  const sendNowMutation = useMutation({
    ...trpc.admin.emailCampaigns.sendNow.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.emailCampaigns.getEligibleUsers.queryKey({
          campaignKey: data.campaignKey,
          searchTerm: normalizedSearchTerm,
        }),
      });
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const pauseScheduleMutation = useMutation({
    ...trpc.admin.emailCampaigns.pauseSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      updateSchedulePausedInCache(data.campaignKey, true);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.emailCampaigns.getScheduleStatus.queryKey({
          campaignKey: data.campaignKey,
        }),
      });
    },
    onError: (error) => {
      toast.error(`Failed to pause: ${error.message}`);
    },
  });

  const resumeScheduleMutation = useMutation({
    ...trpc.admin.emailCampaigns.resumeSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      updateSchedulePausedInCache(data.campaignKey, false);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.emailCampaigns.getScheduleStatus.queryKey({
          campaignKey: data.campaignKey,
        }),
      });
    },
    onError: (error) => {
      toast.error(`Failed to resume: ${error.message}`);
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getEligibleUsers.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
        searchTerm: normalizedSearchTerm,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getEligibleUsers.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
        searchTerm: normalizedSearchTerm,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getEligibleUsers.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
        searchTerm: normalizedSearchTerm,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getScheduleStatus.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getScheduleStatus.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.admin.emailCampaigns.getScheduleStatus.queryKey({
        campaignKey: EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
      }),
    });
    queryClient.invalidateQueries({
      queryKey:
        trpc.admin.emailCampaigns.getDomainTrafficSurgeFunnelDebug.queryKey({
          searchTerm: normalizedSearchTerm,
          limit: 250,
        }),
    });
  };

  const handleSendNow = useCallback(
    (campaignKey: CampaignKey, userId: string) => {
      sendNowMutation.mutate({ campaignKey, userId });
    },
    [sendNowMutation],
  );

  const handleToggleSchedule = useCallback(
    (campaignKey: CampaignKey, paused?: boolean) => {
      if (paused) {
        resumeScheduleMutation.mutate({ campaignKey });
      } else {
        pauseScheduleMutation.mutate({ campaignKey });
      }
    },
    [pauseScheduleMutation, resumeScheduleMutation],
  );

  const handleSetupSchedule = useCallback(
    (scheduleId?: string) => {
      const hash = scheduleId ? `#${scheduleId}` : '';
      router.push(`/admin/schedules${hash}` as Route);
    },
    [router],
  );

  const handleCopyValue = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, []);

  const handleOpenDreamOwnedDomains = useCallback((user: EligibleUser) => {
    setDreamOwnedDomainsModal({
      userId: user.userId,
      email: user.email ?? null,
      domains: [...(user.ownedDomains ?? [])],
    });
  }, []);

  const cartScheduleStatus = cartScheduleQuery.data;
  const dreamScheduleStatus = dreamScheduleQuery.data;
  const trafficScheduleStatus = trafficScheduleQuery.data;
  const dreamLookbackDays = dreamQuery.data?.dreamOrderLookbackDays;
  const trafficThreshold = trafficQuery.data?.trafficWeeklyThreshold;
  const trafficWindowStartUtc = trafficQuery.data?.trafficWindowStartUtc;
  const trafficWindowEndUtc = trafficQuery.data?.trafficWindowEndUtc;
  const trafficWindowLabel =
    trafficWindowStartUtc && trafficWindowEndUtc
      ? `${formatUtcDate(trafficWindowStartUtc)} to ${formatUtcDate(trafficWindowEndUtc)} (UTC days)`
      : 'Last 7 complete UTC days';
  const dreamLookbackLabel =
    typeof dreamLookbackDays === 'number'
      ? `${dreamLookbackDays} days`
      : 'the configured lookback window';
  const trafficThresholdLabel =
    typeof trafficThreshold === 'number'
      ? formatInteger(trafficThreshold)
      : 'the configured threshold';
  const trafficFunnelSummary = trafficFunnelQuery.data?.summary;

  const cartHighlights = useMemo(
    () => [
      'Audience: users who opted in and still have cart items older than the configured minimum age.',
      'Send limit: one email per user each weekly cycle.',
    ],
    [],
  );

  const dreamHighlights = useMemo(
    () => [
      `Audience: users who opted in, have no cart items, and no successful purchase in ${dreamLookbackLabel}.`,
      'Send limit: one email per user each monthly cycle.',
    ],
    [dreamLookbackLabel],
  );

  const trafficHighlights = useMemo(
    () => [
      `Audience: users with Namefi nameserver domains that crossed ${trafficThresholdLabel} DNS lookups in the latest full 7-day window.`,
      `Traffic window checked: ${trafficWindowLabel}.`,
      'Send limit: one email per user each weekly cycle.',
    ],
    [trafficThresholdLabel, trafficWindowLabel],
  );

  const isCartScheduleUpdating =
    (pauseScheduleMutation.isPending &&
      pauseScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR) ||
    (resumeScheduleMutation.isPending &&
      resumeScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR);

  const isDreamScheduleUpdating =
    (pauseScheduleMutation.isPending &&
      pauseScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS) ||
    (resumeScheduleMutation.isPending &&
      resumeScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS);

  const isTrafficScheduleUpdating =
    (pauseScheduleMutation.isPending &&
      pauseScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE) ||
    (resumeScheduleMutation.isPending &&
      resumeScheduleMutation.variables?.campaignKey ===
        EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE);

  // NOTE: See dreamColumns below for the parallel column configuration.
  const cartColumns = useMemo<ColumnDef<EligibleUser>[]>(() => {
    return [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null;
          const isExpanded = row.getIsExpanded();
          return (
            <button
              type="button"
              onClick={() => row.toggleExpanded()}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
              aria-pressed={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
              )}
            </button>
          );
        },
        size: 24,
      },
      {
        accessorKey: 'email',
        header: 'User',
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              {row.original.email ? (
                <>
                  <AutoTruncateTextV2
                    initialCharactersCountToDisplay={20}
                    minCharactersToDisplay={15}
                    className="text-sm"
                  >
                    {row.original.email}
                  </AutoTruncateTextV2>
                  <button
                    type="button"
                    onClick={() => handleCopyValue(row.original.email!)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'cartItemCount',
        header: 'Cart items',
        cell: ({ row }) => row.original.cartItemCount ?? 0,
        size: 100,
      },
      {
        accessorKey: 'cartItemTotalUsdCents',
        header: 'Cart total (USD)',
        cell: ({ row }) =>
          formatAmountInUSD(row.original.cartItemTotalUsdCents ?? 0, true),
        size: 120,
      },
      {
        accessorKey: 'cartOldestAddedAt',
        header: 'Oldest in cart',
        cell: ({ row }) => formatDateTime(row.original.cartOldestAddedAt),
        size: 160,
      },
      {
        accessorKey: 'lastSentAt',
        header: 'Last sent',
        cell: ({ row }) => formatDateTime(row.original.lastSentAt),
        size: 160,
      },
      {
        accessorKey: 'lastSendStatus',
        header: 'Last status',
        cell: ({ row }) => getStatusBadge(row.original.lastSendStatus),
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isSending =
            sendNowMutation.isPending &&
            sendNowMutation.variables?.campaignKey ===
              EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR &&
            sendNowMutation.variables?.userId === row.original.userId;

          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                handleSendNow(
                  EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
                  row.original.userId,
                )
              }
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 me-2" />
              )}
              Send
            </Button>
          );
        },
        size: 140,
      },
    ];
  }, [
    handleCopyValue,
    handleSendNow,
    sendNowMutation.isPending,
    sendNowMutation.variables,
  ]);

  // NOTE: See cartColumns above for the parallel column configuration.
  const dreamColumns = useMemo<ColumnDef<EligibleUser>[]>(() => {
    return [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null;
          const isExpanded = row.getIsExpanded();
          return (
            <button
              type="button"
              onClick={() => row.toggleExpanded()}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
              aria-pressed={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
              )}
            </button>
          );
        },
        size: 24,
      },
      {
        accessorKey: 'email',
        header: 'User',
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              {row.original.email ? (
                <>
                  <AutoTruncateTextV2
                    initialCharactersCountToDisplay={20}
                    minCharactersToDisplay={15}
                    className="text-sm"
                  >
                    {row.original.email}
                  </AutoTruncateTextV2>
                  <button
                    type="button"
                    onClick={() => handleCopyValue(row.original.email!)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'hasOwnedDomains',
        header: 'Has domains',
        cell: ({ row }) => {
          const hasDomains = row.original.hasOwnedDomains ?? false;
          const count = row.original.ownedDomainCount ?? 0;
          if (!hasDomains) return 'No';
          return (
            <button
              type="button"
              onClick={() => handleOpenDreamOwnedDomains(row.original)}
              className="underline underline-offset-4 decoration-dotted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label={`View ${count} owned domains`}
            >
              {`Yes (${count})`}
            </button>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'lastOrderAt',
        header: 'Last purchase',
        cell: ({ row }) => formatDateTime(row.original.lastOrderAt),
        size: 160,
      },
      {
        accessorKey: 'lastSentAt',
        header: 'Last sent',
        cell: ({ row }) => formatDateTime(row.original.lastSentAt),
        size: 160,
      },
      {
        accessorKey: 'lastSendStatus',
        header: 'Last status',
        cell: ({ row }) => getStatusBadge(row.original.lastSendStatus),
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isSending =
            sendNowMutation.isPending &&
            sendNowMutation.variables?.campaignKey ===
              EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS &&
            sendNowMutation.variables?.userId === row.original.userId;

          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                handleSendNow(
                  EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
                  row.original.userId,
                )
              }
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 me-2" />
              )}
              Send
            </Button>
          );
        },
        size: 140,
      },
    ];
  }, [
    handleCopyValue,
    handleOpenDreamOwnedDomains,
    handleSendNow,
    sendNowMutation.isPending,
    sendNowMutation.variables,
  ]);

  const trafficColumns = useMemo<ColumnDef<EligibleUser>[]>(() => {
    return [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null;
          const isExpanded = row.getIsExpanded();
          return (
            <button
              type="button"
              onClick={() => row.toggleExpanded()}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
              aria-pressed={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
              )}
            </button>
          );
        },
        size: 24,
      },
      {
        accessorKey: 'email',
        header: 'User',
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              {row.original.email ? (
                <>
                  <AutoTruncateTextV2
                    initialCharactersCountToDisplay={20}
                    minCharactersToDisplay={15}
                    className="text-sm"
                  >
                    {row.original.email}
                  </AutoTruncateTextV2>
                  <button
                    type="button"
                    onClick={() => handleCopyValue(row.original.email!)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'trafficDomains',
        header: 'Heating domains',
        cell: ({ row }) => (
          <TrafficDomainsCell
            domains={getTrafficDomains(row.original)}
            domainCount={row.original.trafficDomainCount}
          />
        ),
        enableSorting: false,
        size: 360,
      },
      {
        accessorKey: 'lastSentAt',
        header: 'Last sent',
        cell: ({ row }) => formatDateTime(row.original.lastSentAt),
        size: 160,
      },
      {
        accessorKey: 'lastSendStatus',
        header: 'Last status',
        cell: ({ row }) => getStatusBadge(row.original.lastSendStatus),
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const trafficDomains = getTrafficDomains(row.original);
          const isSending =
            sendNowMutation.isPending &&
            sendNowMutation.variables?.campaignKey ===
              EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE &&
            sendNowMutation.variables?.userId === row.original.userId;
          const recipient = row.original.email ?? row.original.userId;

          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                handleSendNow(
                  EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
                  row.original.userId,
                )
              }
              disabled={isSending || trafficDomains.length === 0}
              aria-label={`Send traffic surge email to ${recipient} for ${trafficDomains.length} heating ${trafficDomains.length === 1 ? 'domain' : 'domains'}`}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 me-2" />
              )}
              Send
            </Button>
          );
        },
        size: 140,
      },
    ];
  }, [
    handleCopyValue,
    handleSendNow,
    sendNowMutation.isPending,
    sendNowMutation.variables,
  ]);

  return (
    <>
      <PageShell padding="admin" className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Campaigns</h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-[360px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by email, display name, or user ID..."
                className="ps-9 pe-9"
              />
              {searchTerm.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute end-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={
                cartQuery.isFetching ||
                dreamQuery.isFetching ||
                trafficQuery.isFetching
              }
            >
              <RefreshCw className="h-4 w-4 me-2" />
              Refresh
            </Button>
          </div>
        </div>

        <CampaignSection
          title={CAMPAIGNS[0].title}
          data={cartQuery.data}
          isLoading={cartQuery.isLoading}
          scheduleStatus={cartScheduleStatus}
          isScheduleLoading={cartScheduleQuery.isLoading}
          onToggleSchedule={(paused) =>
            handleToggleSchedule(
              EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR,
              paused,
            )
          }
          onSetupSchedule={handleSetupSchedule}
          isTogglingSchedule={isCartScheduleUpdating}
          pageSize={cartPageSize}
          onPageSizeChange={setCartPageSize}
          columns={cartColumns}
          emptyMessage="No eligible users"
          highlights={cartHighlights}
        />

        <CampaignSection
          title={CAMPAIGNS[1].title}
          data={dreamQuery.data}
          isLoading={dreamQuery.isLoading}
          scheduleStatus={dreamScheduleStatus}
          isScheduleLoading={dreamScheduleQuery.isLoading}
          onToggleSchedule={(paused) =>
            handleToggleSchedule(
              EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS,
              paused,
            )
          }
          onSetupSchedule={handleSetupSchedule}
          isTogglingSchedule={isDreamScheduleUpdating}
          pageSize={dreamPageSize}
          onPageSizeChange={setDreamPageSize}
          columns={dreamColumns}
          emptyMessage="No eligible users"
          highlights={dreamHighlights}
        />

        <CampaignSection
          title={CAMPAIGNS[2].title}
          data={trafficQuery.data}
          isLoading={trafficQuery.isLoading}
          scheduleStatus={trafficScheduleStatus}
          isScheduleLoading={trafficScheduleQuery.isLoading}
          onToggleSchedule={(paused) =>
            handleToggleSchedule(
              EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
              paused,
            )
          }
          onSetupSchedule={handleSetupSchedule}
          isTogglingSchedule={isTrafficScheduleUpdating}
          pageSize={trafficPageSize}
          onPageSizeChange={setTrafficPageSize}
          columns={trafficColumns}
          emptyMessage="No eligible users"
          highlights={trafficHighlights}
        />

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Traffic Surge Funnel Debug</CardTitle>
            <p className="text-xs text-muted-foreground">
              Per-user drop-off across ownership, nameserver, and threshold
              gates for surge.
            </p>
            <p className="text-xs text-muted-foreground">
              Traffic window checked: {trafficWindowLabel}. Threshold:{' '}
              {trafficThresholdLabel}.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {trafficFunnelSummary?.totalUsers ?? 0} in scope
              </Badge>
              <Badge variant="outline">
                ownership drop: {trafficFunnelSummary?.droppedAtOwnership ?? 0}
              </Badge>
              <Badge variant="outline">
                nameserver drop:{' '}
                {trafficFunnelSummary?.droppedAtNameservers ?? 0}
              </Badge>
              <Badge variant="outline">
                threshold drop: {trafficFunnelSummary?.droppedAtThreshold ?? 0}
              </Badge>
              <Badge variant="secondary">
                already sent: {trafficFunnelSummary?.droppedAtAlreadySent ?? 0}
              </Badge>
              <Badge variant="default">
                eligible: {trafficFunnelSummary?.fullyEligible ?? 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trafficFunnelQuery.isLoading ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading surge funnel debug...
              </div>
            ) : (trafficFunnelQuery.data?.users.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">
                No users matched the current search/filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="w-[110px] text-end">Owned</TableHead>
                    <TableHead className="w-[130px] text-end">
                      Namefi NS
                    </TableHead>
                    <TableHead className="w-[120px] text-end">
                      Over threshold
                    </TableHead>
                    <TableHead className="w-[200px]">Top domain</TableHead>
                    <TableHead className="w-[140px] text-end">
                      Top lookups
                    </TableHead>
                    <TableHead className="w-[120px]">Cycle status</TableHead>
                    <TableHead className="w-[180px]">Funnel result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trafficFunnelQuery.data?.users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <AutoTruncateTextV2
                            initialCharactersCountToDisplay={24}
                            minCharactersToDisplay={18}
                            className="text-sm"
                          >
                            {user.email ?? user.userId}
                          </AutoTruncateTextV2>
                          <button
                            type="button"
                            onClick={() => handleCopyValue(user.userId)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy user ID"
                            aria-label="Copy user ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        {formatInteger(user.ownedDomainCount)}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatInteger(user.namefiNameserverDomainCount)}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatInteger(user.thresholdDomainCount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.thresholdTopDomain ?? '-'}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatInteger(user.thresholdTopWeeklyQueries)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.sendRecordStatus)}
                      </TableCell>
                      <TableCell>
                        {getDropOffStageBadge(user.dropOffStage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageShell>

      <Dialog
        open={dreamOwnedDomainsModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDreamOwnedDomainsModal(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Owned Domains</DialogTitle>
            <DialogDescription>
              {dreamOwnedDomainsModal?.email ?? dreamOwnedDomainsModal?.userId}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border max-h-[60vh] overflow-y-auto">
            {(dreamOwnedDomainsModal?.domains.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No owned domains found.
              </p>
            ) : (
              <ul>
                {dreamOwnedDomainsModal?.domains.map((domain) => (
                  <li
                    key={domain}
                    className="px-4 py-2 text-sm border-b last:border-b-0"
                  >
                    <code>{domain}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
