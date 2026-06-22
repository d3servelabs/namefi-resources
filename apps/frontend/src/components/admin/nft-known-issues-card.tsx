'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Permission } from '@namefi-astra/utils/permissions';
import {
  PermissionGate,
  useHasPermissions,
} from '@/components/access/PermissionGate';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { AsyncButton } from '@/components/buttons/async-button';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@namefi-astra/ui/components/shadcn/avatar';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';

type KnownIssue = AppRouterOutput['admin']['nft']['listKnownIssues'][number];
type KnownIssueCategory = NonNullable<KnownIssue['category']>;

const CATEGORY_OPTIONS: Array<{ value: KnownIssueCategory; label: string }> = [
  { value: 'DATE_MISMATCH', label: 'Date Mismatch' },
  { value: 'DOMAIN_EXISTS_MISSING_NFT', label: 'Domain Exists, Missing NFT' },
  {
    value: 'NFT_EXISTS_MISSING_DOMAIN',
    label: 'NFT Exists, Missing Domain',
  },
  { value: 'EXPIRED', label: 'Expired' },
];

const UNSET_CATEGORY_VALUE = '__unset__';

const LOADING_ROW_KEYS = ['ki-loading-1', 'ki-loading-2', 'ki-loading-3'];

function getCategoryLabel(category: KnownIssue['category']): string {
  if (!category) return 'Uncategorized';
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    category
  );
}

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm');
  } catch {
    return value;
  }
}

const USER_ID_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `acknowledgedBy` is either a real user UUID (stamped from `ctx.user.id`
 * when an admin upserts via tRPC) or a sentinel string (e.g.
 * `system:seed-script` from the seed script). Only real UUIDs get the
 * avatar + user lookup affordance; sentinels render as a plain badge.
 */
function isRealUserId(acknowledgedBy: string): boolean {
  return USER_ID_UUID_REGEX.test(acknowledgedBy);
}

function getInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return trimmed.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function AcknowledgedByUserCard({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const userDetailsQuery = useQuery(
    trpc.admin.users.getUserDetails.queryOptions(
      { userId },
      { trpc: { context: { skipBatch: true } } },
    ),
  );

  const user = userDetailsQuery.data?.user;
  const wallets = userDetailsQuery.data?.wallets;
  const label = user?.displayName ?? user?.primaryEmail ?? userId;
  const walletAddress = wallets?.[0]?.address;
  const initials = getInitials(label);

  return (
    <AdminUserLookupButton
      reference={{ userId }}
      title="Open user details"
      variant="ghost"
      size="sm"
      className="h-auto max-w-full items-center justify-start gap-2 px-2 py-1 font-normal"
    >
      <Avatar className="size-6 shrink-0 rounded-full">
        {walletAddress ? (
          <AvatarImage
            alt=""
            src={`https://effigy.im/a/${walletAddress}.svg`}
          />
        ) : null}
        <AvatarFallback className="rounded-full text-[10px]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-xs">
        {userDetailsQuery.isLoading ? 'Loading…' : label}
      </span>
    </AdminUserLookupButton>
  );
}

function AcknowledgedByCell({ acknowledgedBy }: { acknowledgedBy: string }) {
  const { hasPermissions: canReadUsers } = useHasPermissions([
    Permission.READ_USERS,
  ]);

  if (!isRealUserId(acknowledgedBy)) {
    return (
      <Badge variant="secondary" className="font-mono text-[10px]">
        {acknowledgedBy}
      </Badge>
    );
  }

  if (!canReadUsers) {
    return (
      <TruncatedTextWithHover maxLength={12}>
        {acknowledgedBy}
      </TruncatedTextWithHover>
    );
  }

  return <AcknowledgedByUserCard userId={acknowledgedBy} />;
}

interface KnownIssueFormValues {
  normalizedDomainName: string;
  explanation: string;
  category: KnownIssueCategory | undefined;
}

interface KnownIssueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialValues?: KnownIssueFormValues;
  onSubmit: (values: KnownIssueFormValues) => Promise<void>;
}

function KnownIssueFormDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSubmit,
}: KnownIssueFormDialogProps) {
  const [normalizedDomainName, setNormalizedDomainName] = useState('');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState<KnownIssueCategory | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!open) return;
    setNormalizedDomainName(initialValues?.normalizedDomainName ?? '');
    setExplanation(initialValues?.explanation ?? '');
    setCategory(initialValues?.category);
  }, [open, initialValues]);

  const handleSubmit = useCallback(async () => {
    const trimmedDomain = normalizedDomainName.trim();
    const trimmedExplanation = explanation.trim();

    if (!trimmedDomain) {
      toast.error('Domain is required');
      return;
    }
    if (!trimmedExplanation) {
      toast.error('Explanation is required');
      return;
    }

    await onSubmit({
      normalizedDomainName: trimmedDomain,
      explanation: trimmedExplanation,
      category,
    });
  }, [normalizedDomainName, explanation, category, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}
        data-testid="admin.nft-management.known-issues.form-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Known Issue' : 'Edit Known Issue'}
          </DialogTitle>
          <DialogDescription>
            Record a persistent explanation for a domain so it's marked as
            acknowledged in the daily NFT management report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="known-issue-domain">Domain</Label>
            <Input
              id="known-issue-domain"
              placeholder="example.com"
              value={normalizedDomainName}
              onChange={(event) => setNormalizedDomainName(event.target.value)}
              disabled={mode === 'edit'}
              data-testid="admin.nft-management.known-issues.form-dialog.domain-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="known-issue-category">Category (optional)</Label>
            <Select
              value={category ?? UNSET_CATEGORY_VALUE}
              onValueChange={(value) => {
                setCategory(
                  value === UNSET_CATEGORY_VALUE
                    ? undefined
                    : (value as KnownIssueCategory),
                );
              }}
            >
              <SelectTrigger
                id="known-issue-category"
                data-testid="admin.nft-management.known-issues.form-dialog.category-select"
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_CATEGORY_VALUE}>
                  Uncategorized
                </SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="known-issue-explanation">Explanation</Label>
            <Textarea
              id="known-issue-explanation"
              placeholder="Why is this acknowledged? Include any references or ticket IDs."
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={5}
              maxLength={2000}
              data-testid="admin.nft-management.known-issues.form-dialog.explanation-input"
            />
            <p className="text-xs text-muted-foreground">
              {explanation.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="admin.nft-management.known-issues.form-dialog.cancel-button"
          >
            Cancel
          </Button>
          <AsyncButton
            onClick={handleSubmit}
            data-testid="admin.nft-management.known-issues.form-dialog.submit-button"
          >
            {mode === 'add' ? 'Create' : 'Save'}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KnownIssueRowActions({
  issue,
  onEdit,
  onDelete,
  isDeleting,
  'data-testid':
    testId = `admin.nft-management.known-issues.list.row.${issue.normalizedDomainName}.actions`,
}: {
  issue: KnownIssue;
  onEdit: (issue: KnownIssue) => void;
  onDelete: (issue: KnownIssue) => Promise<void>;
  isDeleting: boolean;
  'data-testid'?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2" data-testid={testId}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(issue)}
        aria-label="Edit known issue"
        data-testid={`${testId}.edit-button`}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              className="border-red-200 text-red-600 hover:bg-red-900/10"
              aria-label="Delete known issue"
              data-testid={`${testId}.delete-button`}
            />
          }
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Known Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the acknowledgement for{' '}
              <strong>{issue.normalizedDomainName}</strong>? The domain will
              appear as a regular item in the next report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(issue)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const NftKnownIssuesCard = memo(function NftKnownIssuesCard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const listQueryOptions = trpc.admin.nft.listKnownIssues.queryOptions();
  const listKnownIssuesQuery = useQuery(listQueryOptions);

  const invalidateList = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      }),
    [queryClient, listQueryOptions.queryKey],
  );

  const upsertMutation = useMutation(
    trpc.admin.nft.upsertKnownIssue.mutationOptions(),
  );

  const deleteMutation = useMutation(
    trpc.admin.nft.deleteKnownIssue.mutationOptions(),
  );

  const [dialogState, setDialogState] = useState<
    | { open: false }
    | { open: true; mode: 'add' }
    | { open: true; mode: 'edit'; issue: KnownIssue }
  >({ open: false });

  const openAddDialog = useCallback(
    () => setDialogState({ open: true, mode: 'add' }),
    [],
  );
  const openEditDialog = useCallback(
    (issue: KnownIssue) => setDialogState({ open: true, mode: 'edit', issue }),
    [],
  );
  const closeDialog = useCallback((open: boolean) => {
    if (!open) setDialogState({ open: false });
  }, []);

  const handleSubmit = useCallback(
    async (values: KnownIssueFormValues) => {
      try {
        // The form's Select produces `undefined` when the user picks
        // "Uncategorized". Send `null` on the wire so the backend treats
        // it as an explicit clear rather than "field omitted, keep existing".
        await upsertMutation.mutateAsync({
          normalizedDomainName: values.normalizedDomainName,
          explanation: values.explanation,
          category: values.category ?? null,
        });
        setDialogState({ open: false });
        toast.success('Known issue saved');
        await invalidateList();
      } catch (e: any) {
        toast.error('Failed to save known issue', {
          description: e.message || e.response?.message,
        });
      }
    },
    [upsertMutation, invalidateList],
  );

  const handleDelete = useCallback(
    async (issue: KnownIssue) => {
      try {
        await deleteMutation.mutateAsync({
          normalizedDomainName: issue.normalizedDomainName,
        });
        toast.success('Known issue deleted');
        await invalidateList();
      } catch (e: any) {
        toast.error('Failed to delete known issue', {
          description: e.message || e.response?.message,
        });
      }
    },
    [deleteMutation, invalidateList],
  );

  const issues = listKnownIssuesQuery.data ?? [];
  const initialValues = useMemo<KnownIssueFormValues | undefined>(() => {
    if (dialogState.open && dialogState.mode === 'edit') {
      return {
        normalizedDomainName: dialogState.issue.normalizedDomainName,
        explanation: dialogState.issue.explanation,
        category: dialogState.issue.category,
      };
    }
    return undefined;
  }, [dialogState]);

  return (
    <>
      <KnownIssueFormDialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        mode={dialogState.open && dialogState.mode === 'edit' ? 'edit' : 'add'}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Known Issues</CardTitle>
            <CardDescription>
              Persistent acknowledgements for domains with an expected
              discrepancy in the NFT management report.
            </CardDescription>
          </div>
          <PermissionGate permissions={[Permission.WRITE_NFT]}>
            <Button
              variant="outline"
              size="sm"
              onClick={openAddDialog}
              className="shrink-0"
              data-testid="admin.nft-management.known-issues.toolbar.add-button"
            >
              <Plus className="h-4 w-4" />
              Add Known Issue
            </Button>
          </PermissionGate>
        </CardHeader>

        <CardContent>
          {listKnownIssuesQuery.isLoading ? (
            <div className="space-y-2">
              {LOADING_ROW_KEYS.map((key) => (
                <Skeleton key={key} className="h-10 w-full" />
              ))}
            </div>
          ) : listKnownIssuesQuery.isError ? (
            <div
              className="flex items-center gap-2 rounded-md border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-500"
              data-testid="admin.nft-management.known-issues.error"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Failed to load known issues
              {listKnownIssuesQuery.error?.message
                ? `: ${listKnownIssuesQuery.error.message}`
                : '.'}
            </div>
          ) : issues.length === 0 ? (
            <p
              className="py-6 text-center text-sm text-muted-foreground"
              data-testid="admin.nft-management.known-issues.empty"
            >
              No known issues yet. Acknowledged domains will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table data-testid="admin.nft-management.known-issues.list">
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Explanation</TableHead>
                    <TableHead>Acknowledged By</TableHead>
                    <TableHead>Updated</TableHead>
                    <PermissionGate permissions={[Permission.WRITE_NFT]}>
                      <TableHead className="text-end">Actions</TableHead>
                    </PermissionGate>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow
                      key={issue.normalizedDomainName}
                      data-testid={`admin.nft-management.known-issues.list.row.${issue.normalizedDomainName}`}
                    >
                      <TableCell className="font-medium">
                        <TruncatedTextWithHover maxLength={32}>
                          {issue.normalizedDomainName}
                        </TruncatedTextWithHover>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(issue.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        <TruncatedTextWithHover maxLength={48}>
                          {issue.explanation}
                        </TruncatedTextWithHover>
                      </TableCell>
                      <TableCell>
                        <AcknowledgedByCell
                          acknowledgedBy={issue.acknowledgedBy}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(issue.updatedAt)}
                      </TableCell>
                      <PermissionGate permissions={[Permission.WRITE_NFT]}>
                        <TableCell>
                          <KnownIssueRowActions
                            issue={issue}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            isDeleting={deleteMutation.isPending}
                          />
                        </TableCell>
                      </PermissionGate>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
});
