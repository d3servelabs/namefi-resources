'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { withAdminGuard } from '@/components/admin/admin-guard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import {
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Settings,
  ExternalLink,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { AppRouterOutput } from '@/lib/trpc';
import { AsyncButton } from '@/components/buttons/async-button';
import { useQueryClient } from '@tanstack/react-query';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

// Form schema for creating powered by namefi domains
const createDomainSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(namefiNormalizedDomainSchema).default([]),
  additionalReservedNames: z.array(z.string().trim().toLowerCase()).default([]),
  durationConstraints: z
    .object({
      minDurationInYears: z.number().min(1),
      maxDurationInYears: z.number().min(1),
    })
    .refine((data) => data.minDurationInYears <= data.maxDurationInYears, {
      message: 'Min duration must be less than or equal to max duration',
      path: ['durationConstraints'],
    }),
  costPerYearInUsdCents: z.number().min(0),
  metadata: z.record(z.any()).optional(),
  ownerId: z.string().uuid().optional(),
  // Setup options
  setupVercelAndDns: z.boolean().default(false),
  setupNamefiIo: z.boolean().default(false),
  setupNamefiDev: z.boolean().default(false),
});

type CreateDomainFormData = z.infer<typeof createDomainSchema>;

interface SearchedUser {
  id: string;
  privyUserId: string;
  primaryEmail: string | null;
  walletAddresses: string[];
  displayName: string | null;
}

type SetupStatus = NonNullable<
  AppRouterOutput['admin']['poweredByNamefi']['getPoweredByNamefiDomainStatus']['setupStatus']
>[0];

type Domain = {
  normalizedDomainName: string;
  additionalAllowedHostnames: string[] | null;
  additionalReservedNames: string[] | null;
  durationConstraints: {
    minDurationInYears: number;
    maxDurationInYears: number;
  };
  costPerYearInUsdCents: number;
  metadata: unknown;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const StatusIcon = ({
  isSetup,
  isPending = false,
}: {
  isSetup: boolean;
  isPending?: boolean;
}) => {
  if (isPending) {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }
  return isSetup ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
};

const StatusBadge = ({
  isSetup,
  isPending = false,
}: {
  isSetup: boolean;
  isPending?: boolean;
}) => {
  const variant = isPending
    ? 'secondary'
    : isSetup
      ? 'default'
      : ('destructive' as const);
  const text = isPending ? 'Pending' : isSetup ? 'Setup' : 'Not Setup';

  return <Badge variant={variant}>{text}</Badge>;
};

export default withAdminGuard(function PoweredByNamefiDomainsPage() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'normalizedDomainName' | 'createdAt' | 'updatedAt'
  >('normalizedDomainName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch domains
  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    refetch: refetchDomains,
  } = useQuery({
    ...trpc.admin.poweredByNamefi.getPoweredByNamefiDomains.queryOptions({
      page,
      limit,
      searchTerm: searchTerm || undefined,
      sortBy,
      sortOrder,
    }),
  });

  // Fetch domain status for selected domain
  const {
    data: domainStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    ...trpc.admin.poweredByNamefi.getPoweredByNamefiDomainStatus.queryOptions({
      normalizedDomainName: selectedDomain as string,
    }),
    enabled: !!selectedDomain,
  });

  // Mutations
  const createDomainMutation = useMutation({
    ...trpc.admin.poweredByNamefi.createPoweredByNamefiDomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Domain created successfully');
      setIsCreateDialogOpen(false);
      refetchDomains();
    },
    onError: (error) => {
      toast.error(`Failed to create domain: ${error.message}`);
    },
  });

  const setupVercelMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupVercelAndDns.mutationOptions(),
    onSuccess: () => {
      toast.success('Vercel and DNS setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Setup failed: ${error.message}`);
    },
  });

  const setupNamefiIoMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiIoSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.io subdomain setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Setup failed: ${error.message}`);
    },
  });

  const setupNamefiDevMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiDevSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.dev subdomain setup completed');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Setup failed: ${error.message}`);
    },
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const domains = domainsData?.data || [];
  const pagination = domainsData?.pagination;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Powered by Namefi Domains</h1>
        <p className="text-muted-foreground">
          Manage third-party domains powered by Namefi infrastructure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Domains List</CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Powered by Namefi Domain</DialogTitle>
                </DialogHeader>
                <CreateDomainForm
                  onSubmit={async (data) => {
                    await createDomainMutation.mutateAsync(data);

                    // Run setup actions if requested
                    if (data.setupVercelAndDns) {
                      await setupVercelMutation.mutateAsync({
                        normalizedDomainName: data.normalizedDomainName,
                      });
                    }

                    if (data.setupNamefiIo) {
                      await setupNamefiIoMutation.mutateAsync({
                        normalizedDomainName: data.normalizedDomainName,
                      });
                    }

                    if (data.setupNamefiDev) {
                      await setupNamefiDevMutation.mutateAsync({
                        normalizedDomainName: data.normalizedDomainName,
                      });
                    }
                  }}
                  isLoading={createDomainMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value: typeof sortBy) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normalizedDomainName">
                    Domain Name
                  </SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('normalizedDomainName')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Domain Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Cost/Year</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDomains ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading domains...
                      </TableCell>
                    </TableRow>
                  ) : domains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No domains found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains.map((domain: Domain) => (
                      <TableRow key={domain.normalizedDomainName}>
                        <TableCell className="font-medium">
                          {domain.normalizedDomainName}
                        </TableCell>

                        <TableCell>
                          ${(domain.costPerYearInUsdCents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(domain.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedDomain(
                                      domain.normalizedDomainName,
                                    )
                                  }
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configuration
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="!max-w-screen-xl w-full">
                                <DialogHeader>
                                  <DialogTitle>
                                    Setup Status: {domain.normalizedDomainName}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="w-full space-y-6 max-h-[80vh] overflow-y-auto">
                                  {isLoadingStatus ? (
                                    <div className="text-center py-8">
                                      Loading setup status...
                                    </div>
                                  ) : domainStatus?.setupStatus &&
                                    domainStatus.setupStatus.length > 0 ? (
                                    <SetupStatusDisplay
                                      setupStatus={domainStatus.setupStatus[0]}
                                    />
                                  ) : null}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <ExternalLink
                                className="h-4 w-4 mr-1"
                                href={`https://${domain.normalizedDomainName}`}
                                target="_blank"
                              />
                              Visit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} domains
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Form component for creating powered by namefi domains
function CreateDomainForm({
  onSubmit,
  isLoading = false,
}: {
  onSubmit: (data: CreateDomainFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const trpc = useTRPC();

  const form = useForm<CreateDomainFormData>({
    resolver: zodResolver(createDomainSchema),
    defaultValues: {
      normalizedDomainName: '',
      additionalAllowedHostnames: [],
      additionalReservedNames: [],
      durationConstraints: {
        minDurationInYears: 1,
        maxDurationInYears: 10,
      },
      costPerYearInUsdCents: 0,
      setupVercelAndDns: false,
      setupNamefiIo: false,
      setupNamefiDev: false,
    },
  });

  // User search query
  const userSearchQuery = useQuery({
    ...trpc.admin.searchUsers.queryOptions({
      searchTerm: userSearchTerm,
      limit: 10,
    }),
    enabled: userSearchTerm.length >= 2,
  });

  const handleUserSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    form.setValue('ownerId', user.id);
    setShowUserSearch(false);
    setUserSearchTerm('');
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    form.setValue('ownerId', undefined);
  };

  const setupVercelAndDns = form.watch('setupVercelAndDns');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Domain Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Domain Configuration</h3>

          <FormField
            control={form.control}
            name="normalizedDomainName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain Name</FormLabel>
                <FormControl>
                  <Input placeholder="example.com" {...field} />
                </FormControl>
                <FormDescription>
                  The normalized domain name (lowercase, no trailing dot)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Owner Selection */}
          <FormField
            control={form.control}
            name="ownerId"
            render={() => (
              <FormItem>
                <FormLabel>Domain Owner (Optional)</FormLabel>
                <FormControl>
                  <div>
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
                        {userSearchQuery.isLoading &&
                          userSearchTerm.length >= 2 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Searching users...
                            </div>
                          )}
                        {userSearchQuery.data &&
                          userSearchQuery.data.length > 0 && (
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                              {userSearchQuery.data.map((user) => (
                                <button
                                  type="button"
                                  key={user.id}
                                  className="w-full p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 text-left"
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
                        <Search className="h-4 w-4 mr-2" />
                        Search for domain owner...
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Select a user who will own this domain. If not specified, the
                  domain will be system-owned.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="durationConstraints.minDurationInYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Duration (Years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationConstraints.maxDurationInYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Duration (Years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="costPerYearInUsdCents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Year (USD Cents)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="500 for $5.00"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Cost in cents (e.g., 500 = $5.00)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Setup Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Automatic Setup Options</h3>
          <p className="text-sm text-muted-foreground">
            Select which components to set up automatically after creating the
            domain.
          </p>

          <FormField
            control={form.control}
            name="setupVercelAndDns"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Setup Vercel Project & DNS A Record</FormLabel>
                  <FormDescription>
                    Add domain to d3servelabs/namefi-astra project and create
                    DNS A record
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* {setupVercelAndDns && (
            <FormField
              control={form.control}
              name="vercelIpAddress"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel>Vercel IP Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    If provided, will create DNS A record pointing to this IP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )} */}

          <FormField
            control={form.control}
            name="setupNamefiIo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Setup {form.watch('normalizedDomainName') || '<domain>'}
                    .astra.namefi.io
                  </FormLabel>
                  <FormDescription>
                    Create CNAME record in namefi-io zone
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="setupNamefiDev"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Setup {form.watch('normalizedDomainName') || '<domain>'}
                    .astra.namefi.dev
                  </FormLabel>
                  <FormDescription>
                    Create CNAME record in namefi-dev zone
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? 'Creating...' : 'Create Domain'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Component to display setup status for a domain
function SetupStatusDisplay({ setupStatus }: { setupStatus: SetupStatus }) {
  const apexFullySetup =
    setupStatus.apexDomain.vercelIsSetup &&
    setupStatus.apexDomain.vercelIsVerified &&
    setupStatus.apexDomain.recordsAreSetup;
  const ioFullySetup =
    setupStatus.namefiIoSubdomain.vercelIsSetup &&
    setupStatus.namefiIoSubdomain.vercelIsVerified &&
    setupStatus.namefiIoSubdomain.recordsAreSetup;
  const devFullySetup =
    setupStatus.namefiDevSubdomain.vercelIsSetup &&
    setupStatus.namefiDevSubdomain.vercelIsVerified &&
    setupStatus.namefiDevSubdomain.recordsAreSetup;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidatePoweredByNamefiDomainStatus = () => {
    queryClient.invalidateQueries({
      queryKey:
        trpc.admin.poweredByNamefi.getPoweredByNamefiDomainStatus.queryKey({
          normalizedDomainName: setupStatus.apexDomain.domain,
        }),
    });
  };
  const setupNamefiDevMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiDevSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.dev subdomain setup completed');
      invalidatePoweredByNamefiDomainStatus();
    },
    onError: () => {
      toast.error('Failed to setup Namefi.dev subdomain');
    },
  });
  const setupNamefiIoMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupNamefiIoSubdomain.mutationOptions(),
    onSuccess: () => {
      toast.success('Namefi.io subdomain setup completed');
      invalidatePoweredByNamefiDomainStatus();
    },
    onError: () => {
      toast.error('Failed to setup Namefi.io subdomain');
    },
  });

  const setupVercelMutation = useMutation({
    ...trpc.admin.poweredByNamefi.setupVercelAndDns.mutationOptions({
      onSuccess: () => {
        toast.success('Vercel and DNS setup completed');
        invalidatePoweredByNamefiDomainStatus();
      },
      onError: () => {
        toast.error('Failed to setup Vercel and DNS');
      },
    }),
  });

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
      {/* Section 1: Apex Domain Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Apex Domain Setup</CardTitle>
            <StatusBadge isSetup={apexFullySetup} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vercel Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Vercel Project</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <div className="flex items-center space-x-2">
                <StatusIcon
                  isSetup={
                    setupStatus.apexDomain.vercelIsSetup &&
                    setupStatus.apexDomain.vercelIsVerified
                  }
                />
                <span className="text-sm capitalize">
                  {setupStatus.apexDomain.vercelIsSetup &&
                  setupStatus.apexDomain.vercelIsVerified
                    ? 'Verified'
                    : 'Not Setup'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Domain:</span>
              <span className="text-sm text-muted-foreground">
                {setupStatus.apexDomain.domain}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {setupStatus.apexDomain.message}
            </div>
            {setupStatus.apexDomain.expectedRecords &&
              setupStatus.apexDomain.expectedRecords.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Expected Records:</span>
                  <div className="text-muted-foreground">
                    {setupStatus.apexDomain.expectedRecords
                      .map((r) => `A ${r.value}`)
                      .join(', ')}
                  </div>
                </div>
              )}
          </div>

          {/* DNS Records */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">DNS Records</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <div className="flex items-center space-x-2">
                <StatusIcon isSetup={setupStatus.apexDomain.recordsAreSetup} />
                <span className="text-sm capitalize">
                  {setupStatus.apexDomain.recordsAreSetup
                    ? 'Configured'
                    : 'Not Setup'}
                </span>
              </div>
            </div>
            {setupStatus.apexDomain.records &&
              setupStatus.apexDomain.records.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Current Records:</span>
                  <div className="text-muted-foreground">
                    {setupStatus.apexDomain.records
                      .map((r) => `${r.type} ${r.name} ${r.rdata}`)
                      .join(', ')}
                  </div>
                </div>
              )}
          </div>

          <AsyncButton
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!setupStatus.apexDomain.canSetup}
            onClick={() =>
              setupVercelMutation.mutateAsync({
                normalizedDomainName: setupStatus.apexDomain.domain,
              })
            }
          >
            {apexFullySetup ? 'Already Setup' : 'Setup Apex Domain'}
          </AsyncButton>
        </CardContent>
      </Card>
      <div className="h-4" />

      {/* Section 2: Namefi.io Subdomain Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Namefi.io Subdomain</CardTitle>
            <StatusBadge isSetup={ioFullySetup} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subdomain:</span>
              <span className="text-sm text-muted-foreground">
                {setupStatus.namefiIoSubdomain.domain}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                <StatusIcon isSetup={ioFullySetup} />
                <span className="text-sm capitalize">
                  {ioFullySetup ? 'Configured' : 'Not Setup'}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {setupStatus.namefiIoSubdomain.message}
            </div>
            {setupStatus.namefiIoSubdomain.records &&
              setupStatus.namefiIoSubdomain.records.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Current Records:</span>
                  <div className="text-muted-foreground">
                    {setupStatus.namefiIoSubdomain.records
                      .map((r) => `${r.type} ${r.name} ${r.rdata}`)
                      .join(', ')}
                  </div>
                </div>
              )}
          </div>

          <AsyncButton
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!setupStatus.namefiIoSubdomain.canSetup}
            onClick={() =>
              setupNamefiIoMutation.mutateAsync({
                normalizedDomainName: setupStatus.apexDomain.domain,
              })
            }
          >
            {ioFullySetup ? 'Already Setup' : 'Setup Namefi.io Subdomain'}
          </AsyncButton>
        </CardContent>
      </Card>

      {/* Section 3: Namefi.dev Subdomain Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Namefi.dev Subdomain</CardTitle>
            <StatusBadge isSetup={devFullySetup} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subdomain:</span>
              <span className="text-sm text-muted-foreground">
                {setupStatus.namefiDevSubdomain.domain}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                <StatusIcon isSetup={devFullySetup} />
                <span className="text-sm capitalize">
                  {devFullySetup ? 'Configured' : 'Not Setup'}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {setupStatus.namefiDevSubdomain.message}
            </div>
            {setupStatus.namefiDevSubdomain.records &&
              setupStatus.namefiDevSubdomain.records.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Current Records:</span>
                  <div className="text-muted-foreground">
                    {setupStatus.namefiDevSubdomain.records
                      .map((r) => `${r.type} ${r.name} ${r.rdata}`)
                      .join(', ')}
                  </div>
                </div>
              )}
          </div>

          <AsyncButton
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!setupStatus.namefiDevSubdomain.canSetup}
            onClick={() =>
              setupNamefiDevMutation.mutateAsync({
                normalizedDomainName: setupStatus.apexDomain.domain,
              })
            }
          >
            {devFullySetup ? 'Already Setup' : 'Setup Namefi.dev Subdomain'}
          </AsyncButton>
        </CardContent>
      </Card>

      {/* Section 4: Summary */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Setup Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Overall Status</h4>
              <div className="flex items-center space-x-2">
                <StatusIcon
                  isSetup={
                    setupStatus.summary.overallStatus === 'fully_configured'
                  }
                />
                <span className="text-sm capitalize">
                  {setupStatus.summary.overallStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {setupStatus.summary.notice && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                {setupStatus.summary.notice}
              </div>
            )}

            {setupStatus.summary.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {setupStatus.summary.recommendations.map((rec) => (
                    <li key={`rec-${rec.replace(/\s+/g, '-')}`}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Complete all setup steps to enable the domain for public use.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
