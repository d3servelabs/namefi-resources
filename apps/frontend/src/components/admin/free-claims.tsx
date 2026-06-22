'use client';
import { AuthRequired } from '@/components/auth-required';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { TableBody } from '@namefi-astra/ui/components/shadcn/table';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
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
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import {
  RadioGroup,
  RadioGroupItem,
} from '@namefi-astra/ui/components/shadcn/radio-group';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type FC, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Gift,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  Users,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import {
  UserSelectComboBox,
  type UserOption,
} from '@/components/admin/user-select-combobox';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CreateFreeClaimForm {
  userId: string;
  groupOrCampaignKey: string;
  reason: string;
  domainType: 'exactDomain' | 'parentDomain';
  exactDomainName: string;
  parentDomain: string;
  hasExpiration: boolean;
  expirationDate: string;
  /** When false (default) premium domains are blocked from this claim. */
  allowPremium: boolean;
  /** Max 1-year registration price (USD) as a raw input string; '' = no cap. */
  maxPrice: string;
}

const INITIAL_CREATE_FORM: CreateFreeClaimForm = {
  userId: '',
  groupOrCampaignKey: '',
  reason: '',
  domainType: 'exactDomain',
  exactDomainName: '',
  parentDomain: '',
  hasExpiration: false,
  expirationDate: '',
  allowPremium: false,
  maxPrice: '',
};

/** Per-claim free-claim guard policy, read from a claim row's jsonb metadata. */
function getClaimPolicy(metadata: unknown): {
  allowPremium: boolean;
  maxPrice: number | null;
} {
  const m = (metadata ?? {}) as Record<string, unknown>;
  return {
    allowPremium: m.allowPremium === true,
    maxPrice:
      typeof m.maxPrice === 'number' && m.maxPrice > 0 ? m.maxPrice : null,
  };
}

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
    ))}
  </div>
);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'IDLE':
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Available
        </Badge>
      );
    case 'CLAIMING':
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      );
    case 'CLAIMED':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-green-200 text-green-700"
        >
          <CheckCircle className="h-3 w-3" />
          Claimed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ClaimLimitsCell: FC<{ metadata: unknown }> = ({ metadata }) => {
  const policy = getClaimPolicy(metadata);

  if (!policy.allowPremium && policy.maxPrice == null) {
    return <span className="text-muted-foreground text-sm">No limits</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1 text-sm">
      {policy.allowPremium && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Premium allowed
        </Badge>
      )}
      {policy.maxPrice != null && (
        <span className="text-muted-foreground">
          Max ${policy.maxPrice} USD
        </span>
      )}
    </div>
  );
};

function CreateClaimModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateFreeClaimForm>(INITIAL_CREATE_FORM);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    ...trpc.admin.freeClaims.createFreeClaim.mutationOptions(),
    onSuccess: () => {
      toast.success('Free claim created successfully');
      setOpen(false);
      setForm(INITIAL_CREATE_FORM);
      setSelectedUser(null);
      onSuccess();
      queryClient.invalidateQueries({
        queryKey: trpc.admin.freeClaims.getFreeClaimsWithPagination.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Failed to create free claim: ${error.message}`);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const payload: any = {
        userId: form.userId,
        groupOrCampaignKey: form.groupOrCampaignKey,
        reason: form.reason,
        allowPremium: form.allowPremium,
      };

      if (form.domainType === 'exactDomain' && form.exactDomainName) {
        payload.exactDomainName = form.exactDomainName;
      } else if (form.domainType === 'parentDomain' && form.parentDomain) {
        payload.parentDomain = form.parentDomain;
      }

      if (form.hasExpiration && form.expirationDate) {
        payload.expirationDate = new Date(form.expirationDate);
      }

      const parsedMaxPrice = Number.parseFloat(form.maxPrice);
      if (
        form.maxPrice.trim() &&
        Number.isFinite(parsedMaxPrice) &&
        parsedMaxPrice > 0
      ) {
        payload.maxPrice = parsedMaxPrice;
      }

      createMutation.mutate(payload);
    },
    [form, createMutation],
  );

  const updateForm = useCallback((updates: Partial<CreateFreeClaimForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleUserChange = useCallback((user: UserOption | null) => {
    setSelectedUser(user);
    setForm((prev) => ({ ...prev, userId: user?.id ?? '' }));
  }, []);

  const isMaxPriceInvalid = useMemo(() => {
    if (!form.maxPrice.trim()) return false;
    const parsed = Number.parseFloat(form.maxPrice);
    return !Number.isFinite(parsed) || parsed <= 0;
  }, [form.maxPrice]);

  const isFormValid = useMemo(() => {
    if (
      !form.userId.trim() ||
      !form.groupOrCampaignKey.trim() ||
      !form.reason.trim()
    )
      return false;

    if (isMaxPriceInvalid) {
      return false;
    }

    if (form.domainType === 'exactDomain') {
      return Boolean(form.exactDomainName.trim());
    }
    return Boolean(form.parentDomain.trim());
  }, [form, isMaxPriceInvalid]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className="flex items-center gap-2"
            data-testid="admin.free-claims.create.open-button"
          />
        }
      >
        <Plus className="h-4 w-4" />
        Add Free Claim
      </DialogTrigger>
      <DialogContent
        data-testid="admin.free-claims.create.dialog"
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'max-w-2xl max-h-[90vh] overflow-y-auto',
        )}
      >
        <DialogHeader>
          <DialogTitle>Create New Free Claim</DialogTitle>
          <DialogDescription>
            Create a new free domain claim for campaigns or special promotions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User *</Label>
              <UserSelectComboBox
                id="userId"
                mode="single"
                value={selectedUser}
                onChange={handleUserChange}
                placeholder="Search by email, name, wallet, or domain…"
                ariaLabel="Select user"
              />
              <p className="text-xs text-muted-foreground">
                Select the user who can claim this domain
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupOrCampaignKey">Campaign/Group Key *</Label>
              <Input
                id="groupOrCampaignKey"
                value={form.groupOrCampaignKey}
                onChange={(e) =>
                  updateForm({ groupOrCampaignKey: e.target.value })
                }
                placeholder="e.g., beta-launch-2024, special-promo"
                required
                data-testid="admin.free-claims.create.campaign-key-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason/Description *</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => updateForm({ reason: e.target.value })}
                placeholder="Describe why this claim is being offered"
                required
                data-testid="admin.free-claims.create.reason-input"
              />
            </div>
          </div>

          {/* Domain Configuration */}
          <div className="space-y-4">
            <Label>Domain Type *</Label>
            <RadioGroup
              value={form.domainType}
              onValueChange={(value) =>
                updateForm({
                  domainType: value as 'exactDomain' | 'parentDomain',
                  exactDomainName:
                    value === 'exactDomain' ? form.exactDomainName : '',
                  parentDomain:
                    value === 'parentDomain' ? form.parentDomain : '',
                })
              }
            >
              <div className="flex items-center gap-x-2">
                <RadioGroupItem value="exactDomain" id="exactDomain" />
                <Label
                  htmlFor="exactDomain"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Exact Domain (e.g., example.com)
                </Label>
              </div>
              <div className="flex items-center gap-x-2">
                <RadioGroupItem value="parentDomain" id="parentDomain" />
                <Label
                  htmlFor="parentDomain"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Parent Domain (e.g., any subdomain under example.com)
                </Label>
              </div>
            </RadioGroup>

            {form.domainType === 'exactDomain' ? (
              <div className="space-y-2">
                <Label htmlFor="exactDomainName">Exact Domain Name *</Label>
                <Input
                  id="exactDomainName"
                  value={form.exactDomainName}
                  onChange={(e) =>
                    updateForm({ exactDomainName: e.target.value })
                  }
                  placeholder="example.com"
                  required
                  data-testid="admin.free-claims.create.exact-domain-input"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="parentDomain">Parent Domain Name *</Label>
                <Input
                  id="parentDomain"
                  value={form.parentDomain}
                  onChange={(e) => updateForm({ parentDomain: e.target.value })}
                  placeholder="example.com"
                  required
                  data-testid="admin.free-claims.create.parent-domain-input"
                />
                <p className="text-xs text-muted-foreground">
                  Users can claim any available subdomain under this parent
                  domain
                </p>
              </div>
            )}
          </div>

          {/* Optional Settings */}
          <div className="space-y-4">
            <Label>Optional Settings</Label>

            {/* Expiration */}
            <div className="flex items-center gap-x-2">
              <Switch
                id="hasExpiration"
                checked={form.hasExpiration}
                onCheckedChange={(checked) =>
                  updateForm({ hasExpiration: checked })
                }
              />
              <Label
                htmlFor="hasExpiration"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Set Expiration Date
              </Label>
            </div>
            {form.hasExpiration && (
              <div className="ms-6 space-y-2">
                <Label htmlFor="expirationDate">Expires At</Label>
                <Input
                  id="expirationDate"
                  type="datetime-local"
                  value={form.expirationDate}
                  onChange={(e) =>
                    updateForm({ expirationDate: e.target.value })
                  }
                />
              </div>
            )}

            {/* Allow premium domains */}
            <div className="flex items-center gap-x-2">
              <Switch
                id="allowPremium"
                checked={form.allowPremium}
                onCheckedChange={(checked) =>
                  updateForm({ allowPremium: checked })
                }
                data-testid="admin.free-claims.create.allow-premium-switch"
              />
              <Label htmlFor="allowPremium" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Allow premium domains
              </Label>
            </div>
            <p className="ms-6 text-xs text-muted-foreground">
              Off by default — premium domains are blocked from this free claim
              unless enabled.
            </p>

            {/* Max registration price cap */}
            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max registration price (USD)
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={form.maxPrice}
                onChange={(e) => updateForm({ maxPrice: e.target.value })}
                placeholder="No cap"
                aria-invalid={isMaxPriceInvalid}
                data-testid="admin.free-claims.create.max-price-input"
              />
              <p className="text-xs text-muted-foreground">
                Blocks claiming a domain whose 1-year registration price exceeds
                this amount. Leave empty for no cap.
              </p>
              {isMaxPriceInvalid && (
                <p className="text-xs text-destructive">
                  Enter a positive number.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setForm(INITIAL_CREATE_FORM);
                setSelectedUser(null);
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
              data-testid="admin.free-claims.create.submit-button"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  Creating...
                </>
              ) : (
                'Create Claim'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClaimDialog({
  claim,
  onSuccess,
}: {
  claim: {
    id: string;
    groupOrCampaignKey: string;
    reason: string;
    claimingStatus: string;
  };
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    ...trpc.admin.freeClaims.deleteFreeClaim.mutationOptions(),
    onSuccess: () => {
      toast.success('Free claim deleted successfully');
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to delete free claim: ${error.message}`);
    },
  });

  // Don't show delete button if claim is not IDLE
  if (claim.claimingStatus !== 'IDLE') {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            data-testid={`admin.free-claims.row.${claim.id}.delete-button`}
          />
        }
      >
        <Trash2 className="h-4 w-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Free Claim</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the free claim "
            {claim.groupOrCampaignKey}"? This action cannot be undone.
            <br />
            <br />
            <strong>Note:</strong> Only IDLE claims can be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id: claim.id })}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FreeClaimsContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<
    | 'groupOrCampaignKey'
    | 'reason'
    | 'exactDomainName'
    | 'parentDomain'
    | 'expirationDate'
    | 'createdAt'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'all' | 'IDLE' | 'CLAIMING' | 'CLAIMED'>(
    'all',
  );

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.admin.freeClaims.getFreeClaimsWithPagination.queryOptions({
      page,
      limit,
      sortBy,
      sortOrder,
      searchTerm: searchTerm || undefined,
      status,
    }),
    placeholderData: (previousData) => previousData,
  });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['trpc', 'admin', 'freeClaims', 'getFreeClaimsWithPagination'],
    });
  }, [queryClient]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: string | null) => {
    if (!newLimit) return;
    setLimit(Number.parseInt(newLimit));
    setPage(1);
  }, []);

  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Free Claims Management
          </h1>
          <p className="text-muted-foreground">
            Manage free domain claims for campaigns and promotions
          </p>
        </div>
        <CreateClaimModal onSuccess={handleRefresh} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="admin.free-claims.filters.search-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value: any) => {
                  if (!value) return;
                  setStatus(value);
                }}
              >
                <SelectTrigger data-testid="admin.free-claims.filters.status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="IDLE">Available</SelectItem>
                  <SelectItem value="CLAIMING">In Progress</SelectItem>
                  <SelectItem value="CLAIMED">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(value: any) => {
                  if (!value) return;
                  setSortBy(value);
                }}
              >
                <SelectTrigger data-testid="admin.free-claims.filters.sort-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="groupOrCampaignKey">
                    Campaign/Group
                  </SelectItem>
                  <SelectItem value="reason">Reason</SelectItem>
                  <SelectItem value="exactDomainName">Exact Domain</SelectItem>
                  <SelectItem value="parentDomain">Parent Domain</SelectItem>
                  <SelectItem value="expirationDate">Expires At</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Results Per Page</Label>
              <Select
                value={limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger data-testid="admin.free-claims.filters.page-size-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Free Claims
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {isFetching && (!data || data.data.length === 0) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading claims...
                </span>
              ) : data && data.data.length > 0 ? (
                <>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, totalCount || 0)} of {totalCount || 0}{' '}
                  claims
                </>
              ) : (
                <span>No claims found</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && !isFetching && data?.data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No free claims found.
              </div>
              <CreateClaimModal onSuccess={handleRefresh} />
            </div>
          ) : isLoading && !data ? (
            <LoadingSkeletons />
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table data-testid="admin.free-claims.list">
                  <Thead>
                    <Tr>
                      <Th>Campaign/Group</Th>
                      <Th>Domain</Th>
                      <Th>Reason</Th>
                      <Th>Status</Th>
                      <Th>Limits</Th>
                      <Th>Expires</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <TableBody>
                    {data?.data.map((claim) => (
                      <Tr
                        key={claim.id}
                        data-testid={`admin.free-claims.list.row.${claim.id}`}
                      >
                        <Td>
                          <div className="font-medium">
                            {claim.groupOrCampaignKey}
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-1">
                            {claim.exactDomainName ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-blue-500" />
                                <span className="text-sm font-mono">
                                  {claim.exactDomainName}
                                </span>
                              </div>
                            ) : claim.parentDomain ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-green-500" />
                                <span className="text-sm font-mono">
                                  *.{claim.parentDomain}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div
                            className="max-w-xs truncate"
                            title={claim.reason || ''}
                          >
                            {claim.reason || '-'}
                          </div>
                        </Td>
                        <Td>{getStatusBadge(claim.claimingStatus)}</Td>
                        <Td>
                          <ClaimLimitsCell metadata={claim.metadata} />
                        </Td>
                        <Td>
                          {claim.expirationDate ? (
                            <div className="text-sm">
                              {format(
                                new Date(claim.expirationDate),
                                'MMM dd, yyyy',
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Never
                            </span>
                          )}
                        </Td>
                        <Td>
                          <div className="text-sm">
                            {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            {claim.claimingStatus === 'IDLE' ? (
                              <DeleteClaimDialog
                                claim={{
                                  id: claim.id,
                                  groupOrCampaignKey: claim.groupOrCampaignKey,
                                  reason: claim.reason || 'No reason provided',
                                  claimingStatus: claim.claimingStatus,
                                }}
                                onSuccess={handleRefresh}
                              />
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <AlertCircle className="h-3 w-3" />
                                <span>Cannot edit/delete</span>
                              </div>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1 || isFetching}
                      data-testid="admin.free-claims.list.first-button"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || isFetching}
                      data-testid="admin.free-claims.list.prev-button"
                    >
                      <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
                      Previous
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages || isFetching}
                      data-testid="admin.free-claims.list.next-button"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={page === totalPages || isFetching}
                      data-testid="admin.free-claims.list.last-button"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminFreeClaims() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!(authLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return <FreeClaimsContent />;
}
