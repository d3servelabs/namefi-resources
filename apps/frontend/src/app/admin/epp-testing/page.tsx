'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Globe,
  Key,
  Lock,
  LockOpen,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from 'lucide-react';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageShell } from '@/components/page-shell';
import { format } from 'date-fns';

// Type aliases for EPP Testing router outputs
type CreateDomainResult =
  AppRouterOutput['admin']['eppTesting']['createDomain'];
type GetDomainInfoResult =
  AppRouterOutput['admin']['eppTesting']['getDomainInfo'];
type ChangeAuthCodeResult =
  AppRouterOutput['admin']['eppTesting']['changeAuthCode'];
type QueryTransferResult =
  AppRouterOutput['admin']['eppTesting']['queryTransfer'];
type RequestTransferResult =
  AppRouterOutput['admin']['eppTesting']['requestTransfer'];
type ApproveTransferResult =
  AppRouterOutput['admin']['eppTesting']['approveTransfer'];
type RejectTransferResult =
  AppRouterOutput['admin']['eppTesting']['rejectTransfer'];
type LockDomainResult = AppRouterOutput['admin']['eppTesting']['lockDomain'];
type UnlockDomainResult =
  AppRouterOutput['admin']['eppTesting']['unlockDomain'];
type CheckAvailabilityResult =
  AppRouterOutput['admin']['eppTesting']['checkAvailability'];

// Union type for all operation results that have status
type OperationResult =
  | CreateDomainResult
  | RequestTransferResult
  | ApproveTransferResult
  | RejectTransferResult
  | LockDomainResult
  | UnlockDomainResult;

export default function EppTestingPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.EPP_TESTING]}
        loadingFallback={null}
      >
        <EppTestingDashboard />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.EPP_TESTING]}
        loadingFallback={null}
      >
        <PageShell padding="admin">
          <div className="text-center py-8 text-muted-foreground">
            You do not have permission to access EPP Testing tools.
          </div>
        </PageShell>
      </PermissionGate>
    </AdminGuard>
  );
}

function EppTestingDashboard() {
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [years, setYears] = useState(1);
  const trpc = useTRPC();

  // Queries
  const domainInfoQuery = useQuery({
    ...trpc.admin.eppTesting.getDomainInfo.queryOptions({ domainName }),
    enabled: false, // Manual trigger
  });

  const availabilityQuery = useQuery({
    ...trpc.admin.eppTesting.checkAvailability.queryOptions({ domainName }),
    enabled: false,
  });

  const transferQuery = useQuery({
    ...trpc.admin.eppTesting.queryTransfer.queryOptions({ domainName }),
    enabled: false,
  });

  // Handle query results with toasts for not found cases
  const handleDomainInfoRefetch = async () => {
    const result = await domainInfoQuery.refetch();
    if (result.data && !result.data.domain) {
      toast.error(`Domain "${domainName}" not found`);
    } else if (result.error) {
      toast.error(`Failed to get domain info: ${result.error.message}`);
    }
  };

  const handleAvailabilityRefetch = async () => {
    const result = await availabilityQuery.refetch();
    if (result.error) {
      toast.error(`Failed to check availability: ${result.error.message}`);
    }
  };

  const handleTransferQueryRefetch = async () => {
    const result = await transferQuery.refetch();
    if (result.data && !result.data.hasPendingTransfer) {
      toast.info(`No pending transfer found for "${domainName}"`);
    } else if (result.error) {
      toast.error(`Failed to query transfer: ${result.error.message}`);
    }
  };

  // Mutations
  const createDomainMutation = useMutation(
    trpc.admin.eppTesting.createDomain.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (data.status === 'SUCCESSFUL') {
          toast.success('Domain created successfully');
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          toast.error(
            `Domain creation failed: ${data.message || statusMessage}`,
          );
        } else {
          toast.info(`Domain creation ${statusMessage.toLowerCase()}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to create domain: ${error.message}`);
      },
    }),
  );

  const changeAuthCodeMutation = useMutation(
    trpc.admin.eppTesting.changeAuthCode.mutationOptions({
      onSuccess: (data) => {
        if (data.success) {
          toast.success('Auth code changed successfully');
        } else {
          toast.error('Failed to change auth code');
        }
      },
      onError: (error) => {
        toast.error(`Failed to change auth code: ${error.message}`);
      },
    }),
  );

  const requestTransferMutation = useMutation(
    trpc.admin.eppTesting.requestTransfer.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (
          data.status === 'SUCCESSFUL' ||
          data.status === 'IN_PROGRESS' ||
          data.status === 'SUBMITTED'
        ) {
          toast.success(`Transfer request ${statusMessage.toLowerCase()}`);
        } else {
          toast.error(
            `Transfer request failed: ${data.message || statusMessage}`,
          );
        }
      },
      onError: (error) => {
        toast.error(`Failed to request transfer: ${error.message}`);
      },
    }),
  );

  const approveTransferMutation = useMutation(
    trpc.admin.eppTesting.approveTransfer.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (data.status === 'SUCCESSFUL') {
          toast.success('Transfer approved successfully');
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          toast.error(
            `Transfer approval failed: ${data.message || statusMessage}`,
          );
        } else {
          toast.info(`Transfer approval ${statusMessage.toLowerCase()}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to approve transfer: ${error.message}`);
      },
    }),
  );

  const rejectTransferMutation = useMutation(
    trpc.admin.eppTesting.rejectTransfer.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (data.status === 'SUCCESSFUL') {
          toast.success('Transfer rejected successfully');
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          toast.error(
            `Transfer rejection failed: ${data.message || statusMessage}`,
          );
        } else {
          toast.info(`Transfer rejection ${statusMessage.toLowerCase()}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to reject transfer: ${error.message}`);
      },
    }),
  );

  const lockDomainMutation = useMutation(
    trpc.admin.eppTesting.lockDomain.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (data.status === 'SUCCESSFUL') {
          toast.success('Domain locked successfully');
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          toast.error(
            `Failed to lock domain: ${data.message || statusMessage}`,
          );
        } else {
          toast.info(`Domain lock ${statusMessage.toLowerCase()}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to lock domain: ${error.message}`);
      },
    }),
  );

  const unlockDomainMutation = useMutation(
    trpc.admin.eppTesting.unlockDomain.mutationOptions({
      onSuccess: (data) => {
        const statusMessage = getStatusMessage(data.status);
        if (data.status === 'SUCCESSFUL') {
          toast.success('Domain unlocked successfully');
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          toast.error(
            `Failed to unlock domain: ${data.message || statusMessage}`,
          );
        } else {
          toast.info(`Domain unlock ${statusMessage.toLowerCase()}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to unlock domain: ${error.message}`);
      },
    }),
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const isLoading =
    createDomainMutation.isPending ||
    changeAuthCodeMutation.isPending ||
    requestTransferMutation.isPending ||
    approveTransferMutation.isPending ||
    rejectTransferMutation.isPending ||
    lockDomainMutation.isPending ||
    unlockDomainMutation.isPending ||
    domainInfoQuery.isFetching ||
    availabilityQuery.isFetching ||
    transferQuery.isFetching;

  return (
    <PageShell padding="admin" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Globe className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">
              EPP Testing (CentralNic OTE2)
            </h1>
            <p className="text-muted-foreground">
              Admin tools for testing domain transfers in OTE environment
            </p>
          </div>
        </div>
      </div>

      {/* Domain Input */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Name</CardTitle>
          <CardDescription>
            Enter the domain name to perform operations on. CentralNic OTE
            doesn't have a list of domains, so you must know the domain name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="domainName">Domain Name</Label>
              <Input
                id="domainName"
                placeholder="example.pw"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value.toLowerCase())}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleAvailabilityRefetch}
              disabled={!domainName || isLoading}
            >
              <Search className="h-4 w-4 me-2" />
              Check Availability
            </Button>
            <Button
              variant="outline"
              onClick={handleDomainInfoRefetch}
              disabled={!domainName || isLoading}
            >
              <RefreshCw className="h-4 w-4 me-2" />
              Get Info
            </Button>
            <Button
              variant="outline"
              onClick={handleTransferQueryRefetch}
              disabled={!domainName || isLoading}
            >
              <Search className="h-4 w-4 me-2" />
              Query Transfer
            </Button>
          </div>

          {/* Availability Result */}
          {availabilityQuery.data && (
            <AvailabilityDisplay result={availabilityQuery.data} />
          )}

          {/* Domain Info Result */}
          {domainInfoQuery.data?.domain && (
            <DomainInfoDisplay domain={domainInfoQuery.data.domain} />
          )}

          {/* Transfer Status Result */}
          {transferQuery.data && (
            <TransferStatusDisplay result={transferQuery.data} />
          )}
        </CardContent>
      </Card>

      {/* Operations Tabs */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="create">Create Domain</TabsTrigger>
          <TabsTrigger value="authcode">Auth Code</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="lock">Lock/Unlock</TabsTrigger>
        </TabsList>

        {/* Create Domain Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Domain</CardTitle>
              <CardDescription>
                Register a new domain on OTE2 for transfer testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="years">Duration (years)</Label>
                  <Input
                    id="years"
                    type="number"
                    min={1}
                    max={10}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={() =>
                    createDomainMutation.mutate({ domainName, years })
                  }
                  disabled={!domainName || isLoading}
                >
                  <Globe className="h-4 w-4 me-2" />
                  Create Domain
                </Button>
              </div>
              {createDomainMutation.data && (
                <OperationResultDisplay result={createDomainMutation.data} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Code Tab */}
        <TabsContent value="authcode">
          <Card>
            <CardHeader>
              <CardTitle>Auth Code Management</CardTitle>
              <CardDescription>
                Generate/change auth code for domain transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => changeAuthCodeMutation.mutate({ domainName })}
                disabled={!domainName || isLoading}
              >
                <Key className="h-4 w-4 me-2" />
                Generate New Auth Code
              </Button>

              {changeAuthCodeMutation.data?.authCode && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <Label>Auth Code</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                      {changeAuthCodeMutation.data.authCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(changeAuthCodeMutation.data!.authCode)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab (Transfer In) */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Domain (Transfer In)</CardTitle>
              <CardDescription>
                Request to transfer a domain into OTE2 from another registrar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="transferAuthCode">Auth Code</Label>
                  <Input
                    id="transferAuthCode"
                    placeholder="Enter auth code from losing registrar"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() =>
                    requestTransferMutation.mutate({ domainName, authCode })
                  }
                  disabled={!domainName || !authCode || isLoading}
                >
                  <Send className="h-4 w-4 me-2" />
                  Request Import
                </Button>
              </div>
              {requestTransferMutation.data && (
                <OperationResultDisplay result={requestTransferMutation.data} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab (Transfer Out) */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Domain (Transfer Out)</CardTitle>
              <CardDescription>
                Approve or reject pending transfer requests for domains in OTE2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Query Transfer Status */}
              <div className="flex gap-4 items-center">
                <Button
                  variant="outline"
                  onClick={handleTransferQueryRefetch}
                  disabled={!domainName || isLoading}
                >
                  <Search className="h-4 w-4 me-2" />
                  Check Pending Transfer
                </Button>
                {transferQuery.isFetching && (
                  <span className="text-sm text-muted-foreground">
                    Checking...
                  </span>
                )}
              </div>

              {/* Show transfer status and approve/reject buttons */}
              {transferQuery.data && (
                <div className="space-y-4">
                  {transferQuery.data.hasPendingTransfer ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Pending Transfer Request
                        </h4>
                      </div>
                      {transferQuery.data.transfer && (
                        <pre className="text-xs overflow-auto p-2 bg-background rounded">
                          {JSON.stringify(transferQuery.data.transfer, null, 2)}
                        </pre>
                      )}
                      <div className="flex gap-4">
                        <Button
                          variant="default"
                          onClick={() =>
                            approveTransferMutation.mutate({ domainName })
                          }
                          disabled={!domainName || isLoading}
                        >
                          <CheckCircle className="h-4 w-4 me-2" />
                          Approve Export
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            rejectTransferMutation.mutate({ domainName })
                          }
                          disabled={!domainName || isLoading}
                        >
                          <XCircle className="h-4 w-4 me-2" />
                          Reject Export
                        </Button>
                      </div>
                      {approveTransferMutation.data && (
                        <OperationResultDisplay
                          result={approveTransferMutation.data}
                        />
                      )}
                      {rejectTransferMutation.data && (
                        <OperationResultDisplay
                          result={rejectTransferMutation.data}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-muted-foreground">
                          No pending transfer request for this domain
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!transferQuery.data && (
                <p className="text-sm text-muted-foreground">
                  Click "Check Pending Transfer" to see if there are any pending
                  export requests for this domain.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lock/Unlock Tab */}
        <TabsContent value="lock">
          <Card>
            <CardHeader>
              <CardTitle>Domain Lock Management</CardTitle>
              <CardDescription>
                Lock or unlock domain for transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => lockDomainMutation.mutate({ domainName })}
                  disabled={!domainName || isLoading}
                >
                  <Lock className="h-4 w-4 me-2" />
                  Lock Domain
                </Button>
                <Button
                  variant="outline"
                  onClick={() => unlockDomainMutation.mutate({ domainName })}
                  disabled={!domainName || isLoading}
                >
                  <LockOpen className="h-4 w-4 me-2" />
                  Unlock Domain
                </Button>
              </div>
              {lockDomainMutation.data && (
                <OperationResultDisplay result={lockDomainMutation.data} />
              )}
              {unlockDomainMutation.data && (
                <OperationResultDisplay result={unlockDomainMutation.data} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>About EPP Testing (OTE2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This dashboard connects to CentralNic OTE2 (Operational Testing
            Environment) for testing domain transfer operations. OTE2 is a
            separate test environment from OTE1 (used for regular domain
            operations).
          </p>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Supported TLDs in OTE
            </h4>
            <p>
              .pw, .fm, .fo, .gl, .my, .bh and many more ccTLDs and second-level
              domains.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Transfer Testing Workflow
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a domain on OTE2</li>
              <li>Unlock the domain</li>
              <li>Generate an auth code</li>
              <li>
                Use the auth code to request transfer from another registrar
                (OTE1)
              </li>
              <li>Approve or reject the transfer request</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'SUCCESSFUL':
      return 'Successful';
    case 'FAILED':
      return 'Failed';
    case 'ERROR':
      return 'Error';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'SUBMITTED':
      return 'Submitted';
    default:
      return status;
  }
}

function getStatusVariant(
  status: string,
): 'success' | 'error' | 'pending' | 'default' {
  switch (status) {
    case 'SUCCESSFUL':
      return 'success';
    case 'FAILED':
    case 'ERROR':
      return 'error';
    case 'IN_PROGRESS':
    case 'SUBMITTED':
      return 'pending';
    default:
      return 'default';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'SUCCESSFUL':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'FAILED':
    case 'ERROR':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'IN_PROGRESS':
    case 'SUBMITTED':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function AvailabilityDisplay({ result }: { result: CheckAvailabilityResult }) {
  return (
    <div className="p-4 rounded-lg border bg-muted/50">
      <div className="flex items-center gap-2">
        {result.available === 'AVAILABLE' ? (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-600">
              Domain is available
            </span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-600">
              Domain is not available
            </span>
          </>
        )}
      </div>
      {result.price && (
        <p className="text-sm text-muted-foreground mt-2">
          Registration price: ${(() => {
            const regPrice = result.price?.registrationPrice;
            if (!regPrice) return 'N/A';
            if (regPrice.type === 'PER_YEAR') {
              return regPrice.price.amount.toFixed(2);
            }
            // MULTI_YEAR - get first year price
            const firstYear = regPrice.price[1];
            return firstYear?.amount.toFixed(2) || 'N/A';
          })()}
        </p>
      )}
    </div>
  );
}

function DomainInfoDisplay({
  domain,
}: {
  domain: GetDomainInfoResult['domain'];
}) {
  return (
    <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
      <h4 className="font-medium">Domain Information</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Domain Name:</span>
          <p className="font-mono">{domain.domainName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Expiration:</span>
          <p>
            {domain.expirationTime
              ? format(new Date(domain.expirationTime), 'PPpp')
              : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Creation Date:</span>
          <p>
            {domain.creationTime
              ? format(new Date(domain.creationTime), 'PPpp')
              : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Auto-Renew:</span>
          <Badge variant="outline" className="text-xs">
            {domain.autoRenewOption}
          </Badge>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Nameservers:</span>
          <div className="font-mono text-xs mt-1">
            {domain.nameservers?.join(', ') || 'None'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferStatusDisplay({ result }: { result: QueryTransferResult }) {
  return (
    <div className="p-4 rounded-lg border bg-muted/50">
      <h4 className="font-medium mb-2">Transfer Status</h4>
      {result.hasPendingTransfer ? (
        <div className="space-y-2">
          <Badge variant="secondary">Pending Transfer</Badge>
          {result.transfer && (
            <pre className="text-xs overflow-auto p-2 bg-background rounded">
              {JSON.stringify(result.transfer, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No pending transfer</p>
      )}
    </div>
  );
}

function OperationResultDisplay({ result }: { result: OperationResult }) {
  const variant = getStatusVariant(result.status);
  const bgClass =
    variant === 'success'
      ? 'bg-green-50 dark:bg-green-950 border-green-200'
      : variant === 'error'
        ? 'bg-red-50 dark:bg-red-950 border-red-200'
        : variant === 'pending'
          ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200'
          : 'bg-muted/50';

  return (
    <div className={`p-4 rounded-lg border ${bgClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon status={result.status} />
        <span className="font-medium">{getStatusMessage(result.status)}</span>
        <Badge variant="outline" className="ms-2">
          {result.status}
        </Badge>
      </div>
      {result.message && (
        <p className="text-sm text-muted-foreground">{result.message}</p>
      )}
      {result.operationId && (
        <p className="text-xs text-muted-foreground mt-1">
          Operation ID: {result.operationId}
        </p>
      )}
    </div>
  );
}
