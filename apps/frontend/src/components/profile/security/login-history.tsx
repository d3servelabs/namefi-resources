'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  History,
  Loader2,
  Globe2,
  MapPin,
  Monitor,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { HTMLAttributes } from 'react';
import { toast } from 'sonner';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { MyLoginHistoryRow } from '@namefi-astra/common/contract/users-contract';

type LoginHistoryProps = HTMLAttributes<HTMLDivElement>;

function formatLocation(row: {
  geoCity: string | null;
  geoSubdivision: string | null;
  geoRegionCode: string | null;
}): string {
  const parts = [row.geoCity, row.geoSubdivision, row.geoRegionCode].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}

export const LoginHistory = ({ className, ...rest }: LoginHistoryProps) => {
  const trpc = useTRPC();

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery(
    trpc.users.listMyLoginHistory.queryOptions({ limit: 50 }),
  );

  // Backend env flag — `loginMethod` detection is heuristic and not yet
  // reliable enough to surface, so the per-row "Method:" sub-text is
  // hidden unless ops explicitly opts in via `SHOW_LOGIN_METHOD=true`.
  const { data: showLoginMethod = false } = useQuery(
    trpc.config.showLoginMethod.queryOptions(),
  );

  const items = data?.items ?? [];

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Login History</CardTitle>
        </div>
        <CardDescription>
          Recent sign-ins to your Namefi account. If anything here looks
          unfamiliar, contact support right away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="text-center">
              <p className="font-medium">Couldn't load your login history</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error?.message ?? 'Please try again in a moment.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No sign-ins recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New sessions appear here the next time you sign in.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <LoginHistoryItem
                key={row.id}
                row={row}
                showLoginMethod={showLoginMethod}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface LoginHistoryItemProps {
  row: MyLoginHistoryRow;
  showLoginMethod: boolean;
}

/**
 * One row + recognize/reject controls. Extracted so each row can own its
 * own mutation `isPending` state without sharing it across the list.
 */
const LoginHistoryItem = ({ row, showLoginMethod }: LoginHistoryItemProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const acknowledge = useMutation(
    trpc.users.acknowledgeLoginSession.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.users.listMyLoginHistory.queryKey(),
        });
      },
      onError: (err) => {
        toast.error("Couldn't update your decision", {
          description: err.message,
        });
      },
    }),
  );

  // Warning rule: a row is flagged iff *neither* signal has cleared it.
  // System cleared = system_recognized; user cleared = user explicitly
  // recognized (false/null don't clear).
  const flagged = !(
    row.systemRecognizedSessionDetails ||
    row.userRecognizedSessionDetails === true
  );
  const userDecision = row.userRecognizedSessionDetails;

  const onAcknowledge = (recognized: boolean | null) => {
    acknowledge.mutate({ id: row.id, recognized });
  };

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg border p-4',
        flagged && 'border-amber-300/60 bg-amber-100/10',
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
          {flagged ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {row.browser ?? 'Unknown browser'}
              {row.os ? ` on ${row.os}` : ''}
            </span>
            {row.device ? <Badge variant="outline">{row.device}</Badge> : null}
            {row.isNewIp && !row.isFirstSession ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 text-amber-600"
              >
                New IP
              </Badge>
            ) : null}
            {row.isNewLocation && !row.isFirstSession ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 text-amber-600"
              >
                New location
              </Badge>
            ) : null}
            {row.isFirstSession ? (
              <Badge variant="secondary">First sign-in</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {formatLocation(row)}
            </span>
            {row.ipAddress ? (
              <span className="inline-flex items-center gap-1">
                <Globe2 className="h-3 w-3" />{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {row.ipAddress}
                </code>
              </span>
            ) : null}
            {showLoginMethod && row.loginMethod ? (
              <span>Method: {row.loginMethod}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              Signed in{' '}
              {format(new UTCDate(row.signedInAt), "yyyy-MM-dd HH:mm 'UTC'")}
            </span>
            <span>
              Last accessed{' '}
              {format(
                new UTCDate(row.lastAccessedAt),
                "yyyy-MM-dd HH:mm 'UTC'",
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {userDecision !== null ? (
          <>
            {userDecision ? (
              <Badge
                variant="outline"
                className="gap-1 border-green-400/60 text-green-700"
              >
                <Check className="h-3 w-3" /> Recognized
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-red-400/60 text-red-700"
              >
                <X className="h-3 w-3" /> Rejected
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAcknowledge(null)}
              disabled={acknowledge.isPending}
            >
              Undo
            </Button>
          </>
        ) : flagged ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-green-400/60 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={() => onAcknowledge(true)}
              disabled={acknowledge.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              That was me
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-400/60 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => onAcknowledge(false)}
              disabled={acknowledge.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Not me
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};
