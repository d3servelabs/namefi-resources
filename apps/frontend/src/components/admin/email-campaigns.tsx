'use client';

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
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Input } from '@/components/ui/shadcn/input';
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
} from '@/components/ui/shadcn/table';

const CAMPAIGNS = EMAIL_CAMPAIGNS;
type CampaignKey = EmailCampaignKey;

type EligibleUsersResponse =
  AppRouterOutput['admin']['emailCampaigns']['getEligibleUsers'];
type EligibleUser = EligibleUsersResponse['users'][number];
type SendHistoryEntry = EligibleUser['sendHistory'][number];
type ScheduleStatusResponse =
  AppRouterOutput['admin']['emailCampaigns']['getScheduleStatus'];

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

const getStatusBadge = (status?: string | null) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  if (status === 'SENT') return <Badge variant="default">Sent</Badge>;
  if (status === 'PENDING') return <Badge variant="secondary">Pending</Badge>;
  if (status === 'FAILED') return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

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
                <Settings2 className="h-4 w-4 mr-2" />
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : paused ? (
                  <Play className="h-4 w-4 mr-2" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
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
      router.push(`/admin/schedules${hash}`);
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

  const cartHighlights = useMemo(
    () => [
      'Audience: users who opted in and still have cart items older than 24 hours.',
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
                <ChevronRight className="h-4 w-4" />
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
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
                <ChevronRight className="h-4 w-4" />
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
          return hasDomains ? `Yes (${count})` : 'No';
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
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
                <ChevronRight className="h-4 w-4" />
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
        accessorKey: 'trafficTopDomain',
        header: 'Top domain',
        cell: ({ row }) => row.original.trafficTopDomain ?? '-',
        size: 180,
      },
      {
        accessorKey: 'trafficTopWeeklyQueries',
        header: 'Top domain lookups (7d)',
        cell: ({ row }) => formatInteger(row.original.trafficTopWeeklyQueries),
        size: 160,
      },
      {
        accessorKey: 'trafficDomainCount',
        header: 'Domains over threshold',
        cell: ({ row }) => formatInteger(row.original.trafficDomainCount ?? 0),
        size: 140,
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
              EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE &&
            sendNowMutation.variables?.userId === row.original.userId;

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
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
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
    <PageShell padding="admin" className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by email, display name, or user ID..."
              className="pl-9 pr-9"
            />
            {searchTerm.length > 0 ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <RefreshCw className="h-4 w-4 mr-2" />
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
          handleToggleSchedule(EMAIL_CAMPAIGN_KEYS.CART_DOMAINS_POPULAR, paused)
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
          handleToggleSchedule(EMAIL_CAMPAIGN_KEYS.DREAM_DOMAIN_AWAITS, paused)
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
          handleToggleSchedule(EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE, paused)
        }
        onSetupSchedule={handleSetupSchedule}
        isTogglingSchedule={isTrafficScheduleUpdating}
        pageSize={trafficPageSize}
        onPageSizeChange={setTrafficPageSize}
        columns={trafficColumns}
        emptyMessage="No eligible users"
        highlights={trafficHighlights}
      />
    </PageShell>
  );
}
