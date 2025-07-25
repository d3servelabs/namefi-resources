'use client';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { AuthRequired } from '@/components/auth-required';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
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
} from '@/components/ui/shadcn/alert-dialog';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { type FC, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Hash,
  List,
  Globe,
  Calendar,
  Link,
  Eye,
  AlertTriangle,
} from 'lucide-react';

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 border rounded-lg"
      >
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-8 w-[80px]" />
      </div>
    ))}
  </div>
);

function NftManagementContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<
    'domainName' | 'nftExpiration' | 'domainExpiration' | 'chainId'
  >('domainName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'expired' | 'canBurn'>(
    'all',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [excludePoweredByNamefiDomains, setExcludePoweredByNamefiDomains] =
    useState(false);
  const [burnInProgress, setBurnInProgress] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.admin.getNftsWithExpirationStatus.queryOptions({
      page,
      limit,
      sortBy,
      sortOrder,
      filterBy,
      searchTerm: searchTerm || undefined,
      excludePoweredByNamefiDomains,
    }),
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  // Keep track of the last known pagination info
  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount ?? 0;

  const burnNftMutation = useMutation(
    trpc.admin.burnNft.mutationOptions({
      onSuccess: (result) => {
        toast.success(`NFT burn workflow started: ${result.workflowId}`);
        // Refetch the data to update the table
        queryClient.invalidateQueries({
          queryKey: ['admin.getNftsWithExpirationStatus'],
        });
      },
      onError: (error) => {
        toast.error(`Failed to burn NFT: ${error.message}`);
      },
      onSettled: (_, __, variables) => {
        // Remove from burn in progress set
        setBurnInProgress((prev) => {
          const next = new Set(prev);
          next.delete(`${variables.normalizedDomainName}-${variables.chainId}`);
          return next;
        });
      },
    }),
  );

  const handleBurnNft = async (
    normalizedDomainName: string,
    chainId: number,
  ) => {
    const key = `${normalizedDomainName}-${chainId}`;
    setBurnInProgress((prev) => new Set([...prev, key]));

    try {
      await burnNftMutation.mutateAsync({
        normalizedDomainName,
        chainId,
      });
    } catch (error) {
      // Error handling is done in onError callback
    }
  };

  const handleSearch = useCallback(() => {
    setPage(1); // Reset to first page when searching
  }, []);

  const handleFilterChange = useCallback(
    (value: 'all' | 'expired' | 'canBurn') => {
      setFilterBy(value);
      setPage(1);
    },
    [],
  );

  const handleSortByChange = useCallback(
    (
      value: 'domainName' | 'nftExpiration' | 'domainExpiration' | 'chainId',
    ) => {
      setSortBy(value);
      setPage(1);
    },
    [],
  );

  const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
    setSortOrder(value);
    setPage(1);
  }, []);

  const handleExcludeToggle = useCallback((checked: boolean) => {
    setExcludePoweredByNamefiDomains(checked);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((value: string) => {
    setLimit(Number(value));
    setPage(1);
  }, []);

  const handleFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const handleLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getExpirationStatus = (domainExpiration: Date | null) => {
    if (!domainExpiration) {
      return <Badge variant="destructive">Not Found</Badge>;
    }
    const isExpired = domainExpiration < new Date();
    return isExpired ? (
      <Badge variant="destructive">Expired</Badge>
    ) : (
      <Badge variant="default">Active</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by domain name or owner address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isFetching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Filter & Sort Controls */}
          <div className="space-y-4">
            {/* Primary Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filter Section */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter NFTs
                </Label>
                <Select
                  value={filterBy}
                  onValueChange={handleFilterChange}
                  disabled={isFetching}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        All NFTs
                      </span>
                    </SelectItem>
                    <SelectItem value="expired">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Expired Domains
                      </span>
                    </SelectItem>
                    <SelectItem value="canBurn">
                      <span className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Can Burn
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Section */}
              <div className="flex-1 lg:flex-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort By
                  </Label>
                  <Select
                    value={sortBy}
                    onValueChange={handleSortByChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domainName">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Domain Name
                        </span>
                      </SelectItem>
                      <SelectItem value="domainExpiration">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Domain Expiration
                        </span>
                      </SelectItem>
                      <SelectItem value="chainId">
                        <span className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Chain ID
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                    Order
                  </Label>
                  <Select
                    value={sortOrder}
                    onValueChange={handleSortOrderChange}
                    disabled={isFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        <span className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Ascending
                        </span>
                      </SelectItem>
                      <SelectItem value="desc">
                        <span className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          Descending
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Page Size Section */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Results
                </Label>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                  disabled={isFetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Page size" />
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
          </div>

          {/* PoweredByNamefi Toggle - only show for "All NFTs" filter */}
          {filterBy === 'all' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="exclude-powered-by-namefi"
                checked={excludePoweredByNamefiDomains}
                onCheckedChange={handleExcludeToggle}
                disabled={isFetching}
              />
              <Label htmlFor="exclude-powered-by-namefi">
                Exclude Powered by Namefi domains
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          {/* NFT Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  NFT Management
                  {isFetching && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                {isFetching && (
                  <div className="text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isLoading && !isFetching && data?.data.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No NFTs found matching your criteria.
                  </div>
                </div>
              ) : isLoading && !data ? (
                <LoadingSkeletons />
              ) : data?.data ? (
                <div className="relative">
                  {isFetching && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-lg shadow-sm border">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </div>
                  )}
                  <Table className="w-full">
                    <Thead>
                      <Tr>
                        <Th>Domain Name</Th>
                        <Th>Chain ID</Th>
                        <Th>Owner Address</Th>
                        <Th>Domain Status</Th>
                        <Th>NFT Expiration</Th>
                        <Th>Domain Expiration</Th>
                        <Th>Registrar</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <TableBody>
                      {data?.data.map((nft) => {
                        const burnKey = `${nft.normalizedDomainName}-${nft.chainId}`;
                        const isBurning = burnInProgress.has(burnKey);

                        return (
                          <Tr key={burnKey}>
                            <Td className="font-medium">
                              <div className="flex flex-col gap-1">
                                <TruncatedTextWithHover maxLength={30}>
                                  {nft.normalizedDomainName}
                                </TruncatedTextWithHover>
                                {nft.isPoweredByNamefiDomain && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs w-fit"
                                  >
                                    Powered by Namefi
                                  </Badge>
                                )}
                              </div>
                            </Td>
                            <Td>
                              <Badge variant="outline">{nft.chainId}</Badge>
                            </Td>
                            <Td className="font-mono text-sm">
                              <TruncatedTextWithHover maxLength={12}>
                                {nft.ownerAddress}
                              </TruncatedTextWithHover>
                            </Td>
                            <Td>
                              {getExpirationStatus(nft.domainExpirationTime)}
                            </Td>
                            <Td>{formatDate(nft.nftExpirationTime)}</Td>
                            <Td>{formatDate(nft.domainExpirationTime)}</Td>
                            <Td>
                              {nft.registrarKey ? (
                                <Badge variant="outline">
                                  {nft.registrarKey}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </Td>
                            <Td>
                              {nft.canBurn ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={isBurning}
                                      className="flex items-center gap-1"
                                    >
                                      <Flame className="h-3 w-3" />
                                      {isBurning ? 'Burning...' : 'Burn'}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Burn NFT
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to burn the NFT
                                        for{' '}
                                        <strong>
                                          {nft.normalizedDomainName}
                                        </strong>
                                        ?
                                        <br />
                                        <br />
                                        This action cannot be undone. The NFT
                                        will be permanently destroyed.
                                        <br />
                                        <br />
                                        <strong>Domain:</strong>{' '}
                                        {nft.normalizedDomainName}
                                        <br />
                                        <strong>Chain ID:</strong> {nft.chainId}
                                        <br />
                                        <strong>Owner:</strong>{' '}
                                        {nft.ownerAddress}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleBurnNft(
                                            nft.normalizedDomainName,
                                            nft.chainId,
                                          )
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Burn NFT
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Cannot burn
                                </span>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    Unable to load NFT data. Please try again.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {isFetching && totalCount === 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading NFT data...
                </span>
              ) : (
                <>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, totalCount)} of {totalCount} NFTs
                  {isFetching && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Updating...</span>
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={page <= 1 || isFetching}
                title="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                title="Previous page"
              >
                {isFetching && page > 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                Previous
              </Button>
              <span className="text-sm mx-2">
                Page {page} of {totalPages > 0 ? totalPages : '?'}
                {isFetching && totalPages === 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (loading)
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                title="Next page"
              >
                Next
                {isFetching && page < totalPages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastPage}
                disabled={page >= totalPages || isFetching || totalPages === 0}
                title="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminNftManagement() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">NFT Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all NFTs in the system. Compare NFT dates with indexed domain
            dates and burn expired NFTs.
          </p>
        </div>
      </div>
      {isLoading ? <LoadingSkeletons /> : <NftManagementContent />}
    </div>
  );
}
