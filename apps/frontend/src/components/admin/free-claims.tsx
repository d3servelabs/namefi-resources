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
  X,
} from 'lucide-react';
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
}

interface SearchedUser {
  id: string;
  privyUserId: string;
  primaryEmail: string | null;
  walletAddresses: string[];
  displayName: string | null;
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

function CreateClaimModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateFreeClaimForm>({
    userId: '',
    groupOrCampaignKey: '',
    reason: '',
    domainType: 'exactDomain',
    exactDomainName: '',
    parentDomain: '',
    hasExpiration: false,
    expirationDate: '',
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // User search query
  const userSearchQuery = useQuery({
    ...trpc.admin.users.searchUsers.queryOptions({
      searchTerm: userSearchTerm,
      limit: 10,
    }),
    enabled: userSearchTerm.length >= 2,
  });

  const createMutation = useMutation({
    ...trpc.admin.freeClaims.createFreeClaim.mutationOptions(),
    onSuccess: () => {
      toast.success('Free claim created successfully');
      setOpen(false);
      setForm({
        userId: '',
        groupOrCampaignKey: '',
        reason: '',
        domainType: 'exactDomain',
        exactDomainName: '',
        parentDomain: '',
        hasExpiration: false,
        expirationDate: '',
      });
      setUserSearchTerm('');
      setSelectedUser(null);
      setShowUserSearch(false);
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
      };

      if (form.domainType === 'exactDomain' && form.exactDomainName) {
        payload.exactDomainName = form.exactDomainName;
      } else if (form.domainType === 'parentDomain' && form.parentDomain) {
        payload.parentDomain = form.parentDomain;
      }

      if (form.hasExpiration && form.expirationDate) {
        payload.expirationDate = new Date(form.expirationDate);
      }

      createMutation.mutate(payload);
    },
    [form, createMutation],
  );

  const updateForm = useCallback((updates: Partial<CreateFreeClaimForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleUserSelect = useCallback((user: SearchedUser) => {
    setSelectedUser(user);
    setForm((prev) => ({ ...prev, userId: user.id }));
    setShowUserSearch(false);
    setUserSearchTerm('');
  }, []);

  const handleClearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    setForm((prev) => ({ ...prev, userId: '' }));
  }, []);

  const isFormValid = useMemo(() => {
    if (
      !form.userId.trim() ||
      !form.groupOrCampaignKey.trim() ||
      !form.reason.trim()
    )
      return false;

    if (form.domainType === 'exactDomain') {
      return Boolean(form.exactDomainName.trim());
    }
    return Boolean(form.parentDomain.trim());
  }, [form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="flex items-center gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Free Claim
      </DialogTrigger>
      <DialogContent
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
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {selectedUser.displayName ||
                        selectedUser.primaryEmail ||
                        'Unknown User'}
                    </div>
                    {selectedUser.primaryEmail && (
                      <div className="text-sm text-muted-foreground">
                        {selectedUser.primaryEmail}
                      </div>
                    )}
                    {selectedUser.walletAddresses.length > 0 && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {selectedUser.walletAddresses[0]}
                        {selectedUser.walletAddresses.length > 1 &&
                          ` (+${selectedUser.walletAddresses.length - 1} more)`}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      ID: {selectedUser.id}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedUser}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : showUserSearch ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by email, wallet address, or user ID..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserSearch(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {userSearchQuery.isLoading && userSearchTerm.length >= 2 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching users...
                    </div>
                  )}
                  {userSearchQuery.data && userSearchQuery.data.length > 0 && (
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                      {userSearchQuery.data.map((user) => (
                        <button
                          type="button"
                          key={user.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="space-y-1">
                            <div className="font-medium">
                              {user.displayName ||
                                user.primaryEmail ||
                                'Unknown User'}
                            </div>
                            {user.primaryEmail && (
                              <div className="text-sm text-muted-foreground">
                                {user.primaryEmail}
                              </div>
                            )}
                            {user.walletAddresses.length > 0 && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {user.walletAddresses[0]}
                                {user.walletAddresses.length > 1 &&
                                  ` (+${user.walletAddresses.length - 1} more)`}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {userSearchQuery.data &&
                    userSearchQuery.data.length === 0 &&
                    userSearchTerm.length >= 2 &&
                    !userSearchQuery.isLoading && (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md">
                        No users found matching "{userSearchTerm}"
                      </div>
                    )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowUserSearch(true)}
                >
                  <Search className="h-4 w-4 me-2" />
                  Search for user by email, wallet, or name...
                </Button>
              )}
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
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setUserSearchTerm('');
                setSelectedUser(null);
                setShowUserSearch(false);
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
                <Table>
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
                      <Tr key={claim.id}>
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
                          <div className="space-y-1 text-sm">
                            <span className="text-muted-foreground">
                              No limits
                            </span>
                          </div>
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
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || isFetching}
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
                    >
                      Next
                      <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={page === totalPages || isFetching}
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
