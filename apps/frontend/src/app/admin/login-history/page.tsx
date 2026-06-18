'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { useMemo, useState } from 'react';
import { ServerDataTable } from '@/components/table/server-data-table';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AlertTriangle, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { z } from 'zod';

// Backend contract validates `userId` as a UUID. Pre-validate on the client so
// keystrokes in the filter input don't fire a rejected request per character.
const userIdSchema = z.uuid();
const isUuid = (value: string) => userIdSchema.safeParse(value).success;

type LoginHistoryRow = {
  id: string;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  sessionId: string | null;
  signedInAt: Date;
  lastAccessedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  os: string | null;
  browser: string | null;
  device: string | null;
  loginMethod: string | null;
  geoCity: string | null;
  geoSubdivision: string | null;
  geoRegionCode: string | null;
  geoLat: number | null;
  geoLng: number | null;
  isGoogleLB: boolean;
  isNewIp: boolean;
  isNewLocation: boolean;
  isNewFingerprint: boolean;
  isFirstSession: boolean;
  notificationSent: boolean;
  systemRecognizedSessionDetails: boolean;
  userRecognizedSessionDetails: boolean | null;
};

export default function AdminLoginHistoryPage() {
  return (
    <AdminGuard>
      <PermissionGate permissions={[Permission.READ_USERS]}>
        <LoginHistoryTable />
      </PermissionGate>
    </AdminGuard>
  );
}

function LoginHistoryTable() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [noveltyFilter, setNoveltyFilter] = useState<
    'any' | 'newIp' | 'newLocation' | 'anyNew'
  >('any');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'signedInAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    userPrivyUserId: false,
    sessionId: false,
    userAgent: false,
  });

  const validatedUserId = isUuid(userIdFilter) ? userIdFilter : undefined;
  const query = useQuery(
    trpc.admin.loginHistory.listLoginHistory.queryOptions(
      {
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        userId: validatedUserId,
        novelty: noveltyFilter,
        sorting: sorting.length > 0 ? sorting : undefined,
      },
      {
        placeholderData: (prev) => prev,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  // Backend env flag — `loginMethod` detection is heuristic and not yet
  // reliable enough to surface, so the column is omitted unless ops
  // explicitly opts in via `SHOW_LOGIN_METHOD=true`.
  const { data: showLoginMethod = false } = useQuery(
    trpc.config.showLoginMethod.queryOptions(undefined, {
      trpc: { context: { skipBatch: true } },
    }),
  );

  const columns = useMemo<ColumnDef<LoginHistoryRow>[]>(
    () => [
      {
        accessorKey: 'signedInAt',
        header: 'Signed In',
        cell: ({ row }) => (
          <span className="text-sm">
            {format(
              new UTCDate(row.original.signedInAt),
              "yyyy-MM-dd HH:mm 'UTC'",
            )}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: 'userEmail',
        header: 'User',
        cell: ({ row }) => (
          <Link
            href={`/admin/users/${row.original.userId}`}
            className="hover:underline"
          >
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={24}
              minCharactersToDisplay={16}
              className="text-sm"
            >
              {row.original.userEmail ?? row.original.userId}
            </AutoTruncateTextV2>
          </Link>
        ),
        size: 240,
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const parts = [
            row.original.geoCity,
            row.original.geoSubdivision,
            row.original.geoRegionCode,
          ].filter((part): part is string => Boolean(part));
          return (
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <span>{parts.length > 0 ? parts.join(', ') : '—'}</span>
              {row.original.isGoogleLB ? (
                <Badge variant="outline" className="text-xs">
                  GCLB
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP',
        cell: ({ row }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {row.original.ipAddress ?? '—'}
          </code>
        ),
        size: 140,
      },
      {
        id: 'device',
        header: 'Device',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {[row.original.browser, row.original.os, row.original.device]
              .filter(Boolean)
              .join(' · ') || '—'}
          </span>
        ),
        size: 200,
      },
      ...(showLoginMethod
        ? [
            {
              accessorKey: 'loginMethod',
              header: 'Method',
              cell: ({ row }) => (
                <span className="text-xs">
                  {row.original.loginMethod ?? '—'}
                </span>
              ),
              size: 120,
            } satisfies ColumnDef<LoginHistoryRow>,
          ]
        : []),
      {
        id: 'flags',
        header: 'Flags',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isFirstSession ? (
              <Badge variant="secondary" className="text-xs">
                First
              </Badge>
            ) : null}
            {row.original.isNewIp ? (
              <Badge variant="outline" className="text-xs">
                New IP
              </Badge>
            ) : null}
            {row.original.isNewLocation ? (
              <Badge variant="outline" className="text-xs">
                New location
              </Badge>
            ) : null}
            {row.original.isNewFingerprint ? (
              <Badge variant="outline" className="text-xs">
                New browser
              </Badge>
            ) : null}
            {row.original.notificationSent ? (
              <Badge variant="outline" className="text-xs">
                Notified
              </Badge>
            ) : null}
            {row.original.systemRecognizedSessionDetails ? (
              <Badge
                variant="outline"
                className="gap-1 text-xs border-green-400/60 text-green-700"
              >
                <Check className="h-3 w-3" /> System
              </Badge>
            ) : null}
            {row.original.userRecognizedSessionDetails === true ? (
              <Badge
                variant="outline"
                className="gap-1 text-xs border-green-400/60 text-green-700"
              >
                <Check className="h-3 w-3" /> User
              </Badge>
            ) : row.original.userRecognizedSessionDetails === false ? (
              <Badge
                variant="outline"
                className="gap-1 text-xs border-red-400/60 text-red-700"
              >
                <X className="h-3 w-3" /> User rejected
              </Badge>
            ) : null}
          </div>
        ),
        size: 220,
      },
      {
        id: 'recognition-actions',
        header: 'Recognition',
        cell: ({ row }) => <RecognitionActions row={row.original} />,
        size: 200,
      },
      {
        accessorKey: 'sessionId',
        header: 'Session',
        cell: ({ row }) =>
          row.original.sessionId ? (
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={8}
              minCharactersToDisplay={6}
              className="font-mono text-xs"
            >
              {row.original.sessionId}
            </AutoTruncateTextV2>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        size: 120,
      },
      {
        accessorKey: 'userPrivyUserId',
        header: 'Privy',
        cell: ({ row }) => (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={8}
            minCharactersToDisplay={6}
            className="font-mono text-xs"
          >
            {row.original.userPrivyUserId ?? ''}
          </AutoTruncateTextV2>
        ),
        size: 120,
      },
      {
        accessorKey: 'userAgent',
        header: 'User agent',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.userAgent ?? '—'}
          </span>
        ),
        size: 240,
      },
    ],
    [showLoginMethod],
  );

  const rows = useMemo(() => {
    return (query.data?.items ?? []).map((item) => ({
      ...item,
      signedInAt: new Date(item.signedInAt),
      lastAccessedAt: new Date(item.lastAccessedAt),
    }));
  }, [query.data?.items]);

  const customFilters = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        type: 'text' as const,
        placeholder: 'Search by email, IP, city, session…',
        value: searchTerm,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setSearchTerm(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setSearchTerm('');
        },
      },
      {
        id: 'userId',
        label: 'Filter by User ID',
        type: 'text' as const,
        placeholder: 'UUID',
        value: userIdFilter,
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setUserIdFilter(value ? String(value) : '');
        },
        onClear: () => {
          setPage(1);
          setUserIdFilter('');
        },
      },
      {
        id: 'novelty',
        label: 'Novelty',
        type: 'select' as const,
        value: noveltyFilter,
        options: [
          { value: 'any', label: 'Any' },
          { value: 'anyNew', label: 'New IP or location' },
          { value: 'newIp', label: 'New IP only' },
          { value: 'newLocation', label: 'New location only' },
        ],
        onChange: (value: string | number | undefined) => {
          setPage(1);
          setNoveltyFilter(
            (value as 'any' | 'newIp' | 'newLocation' | 'anyNew') ?? 'any',
          );
        },
        onClear: () => {
          setPage(1);
          setNoveltyFilter('any');
        },
      },
    ],
    [searchTerm, userIdFilter, noveltyFilter],
  );

  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Login History</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {query.data?.total ?? 0} sessions
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {query.isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-8">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div className="text-center">
              <p className="font-medium">Failed to load login history</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query.error?.message ?? 'Something went wrong on the server.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 me-2 ${query.isFetching ? 'animate-spin' : ''}`}
              />
              Retry
            </Button>
          </div>
        ) : (
          <ServerDataTable
            columns={columns}
            data={rows}
            isLoading={query.isLoading}
            isFetching={query.isFetching}
            page={page}
            pageSize={pageSize}
            totalPages={query.data?.totalPages ?? 1}
            totalCount={query.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
            sorting={sorting}
            onSortingChange={setSorting}
            columnFilters={columnFilters}
            onColumnFiltersChange={(filters) => {
              setPage(1);
              setColumnFilters(filters);
            }}
            customFilters={customFilters}
            emptyMessage="No login events yet"
            loadingMessage="Loading login history..."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            filterDisplayOptions={{ showInHeader: false }}
          />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Per-row Recognize / Reject / Undo controls. Lets customer-support
 * record the decision they captured during a support call. Mirrors the
 * profile-side controls in `apps/frontend/src/components/profile/security/login-history.tsx`
 * but uses the admin-scoped mutation (gated by `READ_USERS`) so the
 * column being written remains `user_recognized_session_details`.
 */
function RecognitionActions({ row }: { row: LoginHistoryRow }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const acknowledge = useMutation(
    trpc.admin.loginHistory.acknowledgeSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.admin.loginHistory.listLoginHistory.queryKey(),
        });
      },
      onError: (err) => {
        toast.error("Couldn't update the user's decision", {
          description: err.message,
        });
      },
    }),
  );

  const userDecision = row.userRecognizedSessionDetails;
  const flagged = !(
    row.systemRecognizedSessionDetails || userDecision === true
  );

  const onAcknowledge = (recognized: boolean | null) => {
    acknowledge.mutate({ id: row.id, recognized });
  };

  if (userDecision !== null) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAcknowledge(null)}
        disabled={acknowledge.isPending}
      >
        Clear decision
      </Button>
    );
  }

  if (!flagged) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="border-green-400/60 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={() => onAcknowledge(true)}
        disabled={acknowledge.isPending}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-red-400/60 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => onAcknowledge(false)}
        disabled={acknowledge.isPending}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
