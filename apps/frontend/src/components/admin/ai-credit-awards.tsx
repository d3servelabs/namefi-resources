'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Coins, Loader2, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { Permission } from '@namefi-astra/utils/permissions';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  PermissionGate,
  useHasPermissions,
} from '@/components/access/PermissionGate';
import {
  UserSelectComboBox,
  type UserOption,
} from '@/components/admin/user-select-combobox';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { PageShell } from '@/components/page-shell';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';

type AwardRow =
  AppRouterOutput['admin']['aiCredits']['listAwards']['data'][number];

const PAGE_SIZE = 25;
const MAX_AWARD_CREDITS = 10_000;

function formatUserLabel(user: AwardRow['user'] | UserOption | null) {
  if (!user) return 'Unknown user';
  return user.primaryEmail ?? user.displayName ?? user.id;
}

function formatUserSubLabel(user: AwardRow['user'] | UserOption | null) {
  if (!user || user.walletAddresses.length === 0) return null;
  const wallet = user.walletAddresses[0];
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function formatCredits(value: number) {
  return `${value.toLocaleString()} ${value === 1 ? 'credit' : 'credits'}`;
}

export function AdminAiCreditAwards() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const [page, setPage] = useState(1);
  const { hasPermissions: canLookupUsers } = useHasPermissions([
    Permission.READ_USERS,
  ]);

  const trimmedReason = reason.trim();
  const trimmedSearchTerm = debouncedSearchTerm.trim();
  const parsedAmount = Number(amount);
  const amountIsValid =
    Number.isInteger(parsedAmount) &&
    parsedAmount >= 1 &&
    parsedAmount <= MAX_AWARD_CREDITS;

  const awardsQuery = useQuery({
    ...trpc.admin.aiCredits.listAwards.queryOptions({
      page,
      limit: PAGE_SIZE,
      searchTerm: trimmedSearchTerm || undefined,
    }),
    placeholderData: (previous) => previous,
  });

  const awardMutation = useMutation(
    trpc.admin.aiCredits.awardCredits.mutationOptions({
      onSuccess: (data) => {
        const awardedAmount = data.awards[0]?.amountCredits ?? parsedAmount;
        const { created } = data.summary;
        toast.success(
          `Awarded ${formatCredits(awardedAmount)} to ${created} ${
            created === 1 ? 'user' : 'users'
          }`,
        );
        setSelectedUsers([]);
        setReason('');
        setPage(1);
        queryClient.invalidateQueries({
          queryKey: trpc.admin.aiCredits.listAwards.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to award AI credits');
      },
    }),
  );

  const totalAwardCredits = useMemo(
    () => selectedUsers.length * (amountIsValid ? parsedAmount : 0),
    [amountIsValid, parsedAmount, selectedUsers.length],
  );

  const canSubmit =
    selectedUsers.length > 0 &&
    amountIsValid &&
    trimmedReason.length > 0 &&
    !awardMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    awardMutation.mutate({
      userIds: selectedUsers.map((user) => user.id),
      amountCredits: parsedAmount,
      reason: trimmedReason,
    });
  };

  const awards = awardsQuery.data?.data ?? [];
  const pagination = awardsQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <PageShell padding="admin" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">AI Credit Awards</h1>
            <p className="text-muted-foreground text-sm">
              Grant additive AI credits and review the award ledger.
            </p>
          </div>
        </div>
      </div>

      <PermissionGate
        permissions={[Permission.WRITE_AI_CREDITS, Permission.READ_USERS]}
      >
        <Card>
          <CardHeader>
            <CardTitle>Award Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <Label htmlFor="ai-credit-users">Recipients</Label>
                <UserSelectComboBox
                  id="ai-credit-users"
                  mode="multiple"
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  maxSelected={500}
                  placeholder="Search users by email, name, wallet, or domain..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-credit-amount">Credits each</Label>
                <Input
                  id="ai-credit-amount"
                  type="number"
                  min={1}
                  max={MAX_AWARD_CREDITS}
                  step={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="ai-credit-reason">Reason</Label>
                <Textarea
                  id="ai-credit-reason"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Campaign, support adjustment, beta access, or other approved reason"
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-sm">
                {selectedUsers.length > 0 && amountIsValid
                  ? `${formatCredits(totalAwardCredits)} total across ${
                      selectedUsers.length
                    } ${selectedUsers.length === 1 ? 'recipient' : 'recipients'}`
                  : 'Select recipients, amount, and reason.'}
              </div>
              <Button disabled={!canSubmit} onClick={handleSubmit}>
                {awardMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                Award AI Credits
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Award Ledger</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search user, wallet, or reason"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AwardsTable
            awards={awards}
            canLookupUsers={canLookupUsers}
            errorMessage={awardsQuery.error?.message}
            isLoading={awardsQuery.isLoading}
            isError={awardsQuery.isError}
            isFetching={awardsQuery.isFetching}
          />

          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-sm">
              {pagination
                ? `${pagination.totalCount.toLocaleString()} award rows`
                : 'Loading award rows...'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || awardsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || awardsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function AwardsTable({
  awards,
  canLookupUsers,
  errorMessage,
  isLoading,
  isError,
  isFetching,
}: {
  awards: AwardRow[];
  canLookupUsers: boolean;
  errorMessage: string | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}) {
  if (isLoading) {
    return (
      <div className="border-border text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading awards...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-destructive/30 text-destructive flex h-40 items-center justify-center rounded-md border px-4 text-center text-sm">
        {errorMessage ?? 'Failed to load AI credit awards.'}
      </div>
    );
  }

  if (awards.length === 0) {
    return (
      <div className="border-border text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No AI credit awards found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Awarded By</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? 'opacity-60' : undefined}>
          {awards.map((award) => (
            <TableRow key={award.id}>
              <TableCell>
                <UserCell
                  user={award.user}
                  userId={award.userId}
                  canLookupUsers={canLookupUsers}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {formatCredits(award.amountCredits)}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[320px] truncate" title={award.reason}>
                  {award.reason}
                </div>
              </TableCell>
              <TableCell>
                {award.awardedByAdminUserId ? (
                  <UserCell
                    user={award.awardedByAdmin}
                    userId={award.awardedByAdminUserId}
                    canLookupUsers={canLookupUsers}
                    compact
                  />
                ) : (
                  <span className="text-muted-foreground">Deleted admin</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>
                    {format(new Date(award.expiresAt), 'MMM dd, yyyy')}
                  </span>
                  <ExpiryBadge expiresAt={award.expiresAt} />
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(award.createdAt), 'MMM dd, yyyy HH:mm')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserCell({
  user,
  userId,
  canLookupUsers,
  compact = false,
}: {
  user: AwardRow['user'];
  userId: string;
  canLookupUsers: boolean;
  compact?: boolean;
}) {
  const subLabel = formatUserSubLabel(user);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0">
        <div className="truncate font-medium">{formatUserLabel(user)}</div>
        {!compact && subLabel ? (
          <div className="text-muted-foreground truncate text-xs">
            {subLabel}
          </div>
        ) : null}
      </div>
      {canLookupUsers ? (
        <AdminUserLookupButton
          reference={{ userId }}
          title="Open user details"
          className="shrink-0"
        />
      ) : null}
    </div>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: Date }) {
  const isActive = new Date(expiresAt).getTime() > Date.now();
  return isActive ? (
    <Badge variant="outline" className="border-green-200 text-green-700">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary">Expired</Badge>
  );
}
