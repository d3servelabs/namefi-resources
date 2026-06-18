'use client';

import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { useTRPC } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  BrushCleaningIcon,
  CheckCircle2,
  XCircle,
  Server,
  Search,
  BarChart3,
  Activity,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ServerDetailModal } from '@/components/admin/dns-cache/server-detail-modal';
import { CombinedStatsModal } from '@/components/admin/dns-cache/combined-stats-modal';
import { ConnectivityTestModal } from '@/components/admin/dns-cache/connectivity-test-modal';
import { ConfirmFlushDialog } from '@/components/admin/dns-cache/confirm-flush-dialog';

const DNS_RECORD_TYPES = [
  'ALL',
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SOA',
  'PTR',
  'SRV',
  'CAA',
  'DS',
  'TLSA',
  'SSHFP',
  'HTTPS',
  'SVCB',
  'NAPTR',
  'SPF',
] as const;

function AdminDnsCachePage() {
  const [zone, setZone] = useState('');
  const [recordType, setRecordType] = useState<string>('ALL');
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(true);

  // Modal states
  const [serverDetailOpen, setServerDetailOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<{
    name: string;
    baseUrl: string;
  } | null>(null);
  const [combinedStatsOpen, setCombinedStatsOpen] = useState(false);
  const [connectivityTestOpen, setConnectivityTestOpen] = useState(false);
  const [confirmFlushAllOpen, setConfirmFlushAllOpen] = useState(false);

  const trpc = useTRPC();

  const serversQuery = useQuery(trpc.dnsCache.listServers.queryOptions());

  // Initialize selected servers when data loads
  useEffect(() => {
    if (serversQuery.data) {
      setSelectedServers(serversQuery.data.map((s) => s.name));
    }
  }, [serversQuery.data]);

  // Update isAllSelected based on selectedServers
  useEffect(() => {
    if (serversQuery.data) {
      setIsAllSelected(
        selectedServers.length === serversQuery.data.length &&
          serversQuery.data.length > 0,
      );
    }
  }, [selectedServers, serversQuery.data]);

  const flushMutation = useMutation(
    trpc.dnsCache.flushCacheAdmin.mutationOptions({
      onSuccess: (data) => {
        setResults(data.results);
        toast.success('Cache Flush Complete', {
          description: data.message,
        });
      },
      onError: (error) => {
        toast.error('Cache Flush Failed', {
          description: error.message,
        });
      },
    }),
  );

  // Fetch combined stats
  const combinedStatsQuery = useQuery({
    ...trpc.dnsCache.getCombinedStats.queryOptions({
      serverNames: selectedServers,
    }),
    enabled: combinedStatsOpen && selectedServers.length > 0,
  });

  // Flush all servers mutation
  const flushAllServersMutation = useMutation(
    trpc.dnsCache.flushAllServers.mutationOptions({
      onSuccess: (data) => {
        toast.success('All Caches Flushed', {
          description: `Flushed cache on ${data?.filter((r) => !!r && typeof r === 'object' && r.success)?.length ?? 0} servers`,
        });
        setConfirmFlushAllOpen(false);
      },
      onError: (error) => {
        toast.error('Flush Failed', {
          description: error.message,
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!zone) {
      toast.error('Zone is required');
      return;
    }

    if (selectedServers.length === 0) {
      toast.error('Please select at least one server');
      return;
    }

    flushMutation.mutate({
      zone,
      recordType: recordType === 'ALL' ? undefined : (recordType as any),
      serverNames: isAllSelected ? undefined : selectedServers,
    });
  };

  const handleToggleServer = (serverName: string) => {
    setSelectedServers((prev) =>
      prev.includes(serverName)
        ? prev.filter((s) => s !== serverName)
        : [...prev, serverName],
    );
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedServers([]);
    } else {
      setSelectedServers(serversQuery.data?.map((s) => s.name) || []);
    }
  };

  const handleServerInspect = (server: { name: string; baseUrl: string }) => {
    setSelectedServer(server);
    setServerDetailOpen(true);
  };

  const handleFlushAllServers = () => {
    setConfirmFlushAllOpen(false);
    flushAllServersMutation.mutate();
  };

  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DNS Cache Management</h1>
        <p className="text-muted-foreground">
          Flush DNS caches across configured servers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main flush form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrushCleaningIcon className="w-5 h-5" />
              Flush DNS Cache
            </CardTitle>
            <CardDescription>
              Clear cached DNS records for a specific zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone/Domain</Label>
                <Input
                  id="zone"
                  placeholder="example.com"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  disabled={flushMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordType">Record Type</Label>
                <Select
                  value={recordType}
                  onValueChange={(value) => {
                    if (!value) return;
                    setRecordType(value);
                  }}
                  disabled={flushMutation.isPending}
                >
                  <SelectTrigger id="recordType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DNS_RECORD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  flushMutation.isPending || selectedServers.length === 0
                }
              >
                {flushMutation.isPending ? (
                  <>
                    <BrushCleaningIcon className="w-4 h-4 me-2 animate-brush-scrub" />
                    Flushing Cache...
                  </>
                ) : (
                  <>
                    <BrushCleaningIcon className="w-4 h-4 me-2" />
                    Flush DNS Cache on Selected Servers
                  </>
                )}
              </Button>
            </form>

            {results && results.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="font-semibold">Results:</h3>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <span className="font-medium">{result.serverName}</span>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-600">
                            Success
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-300" />
                          <span className="text-sm text-red-400">
                            {result.error || 'Failed'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DNS Servers sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              DNS Servers
            </CardTitle>
            <CardDescription>Select servers to target</CardDescription>
          </CardHeader>
          <CardContent>
            {serversQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
            {serversQuery.data && serversQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No DNS servers configured
              </p>
            )}
            {serversQuery.data && serversQuery.data.length > 0 && (
              <div className="space-y-3">
                {/* Master checkbox */}
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleToggleAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    All Servers ({serversQuery.data.length})
                  </label>
                </div>

                {/* Individual server checkboxes */}
                {serversQuery.data.map((server, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <Checkbox
                      id={`server-${index}`}
                      checked={selectedServers.includes(server.name)}
                      onCheckedChange={() => handleToggleServer(server.name)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`server-${index}`}
                        className="block cursor-pointer"
                      >
                        <p className="font-medium text-sm">{server.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {new URL(server.baseUrl).hostname}
                        </p>
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleServerInspect(server)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {serversQuery.data && serversQuery.data.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Actions for {isAllSelected ? 'all' : selectedServers.length}{' '}
              selected server{selectedServers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setCombinedStatsOpen(true)}
                disabled={selectedServers.length === 0}
              >
                <BarChart3 className="h-4 w-4 me-2" />
                View Combined Stats
              </Button>
              <Button
                variant="outline"
                onClick={() => setConnectivityTestOpen(true)}
                disabled={selectedServers.length === 0}
              >
                <Activity className="h-4 w-4 me-2" />
                Test Connectivity
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmFlushAllOpen(true)}
                disabled={
                  selectedServers.length === 0 ||
                  flushAllServersMutation.isPending
                }
              >
                <Trash2 className="h-4 w-4 me-2" />
                {flushAllServersMutation.isPending
                  ? 'Flushing...'
                  : 'Flush All Cache on Selected Servers'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedServer && (
        <ServerDetailModal
          open={serverDetailOpen}
          onOpenChange={setServerDetailOpen}
          serverName={selectedServer.name}
          serverUrl={selectedServer.baseUrl}
        />
      )}

      <CombinedStatsModal
        open={combinedStatsOpen}
        onOpenChange={setCombinedStatsOpen}
        serverStats={(combinedStatsQuery.data as any) || []}
        isLoading={combinedStatsQuery.isLoading}
      />

      <ConnectivityTestModal
        open={connectivityTestOpen}
        onOpenChange={setConnectivityTestOpen}
        serverNames={selectedServers}
      />

      <ConfirmFlushDialog
        open={confirmFlushAllOpen}
        onOpenChange={setConfirmFlushAllOpen}
        onConfirm={handleFlushAllServers}
        serverNames={selectedServers}
        isFlushingAll={true}
      />
    </PageShell>
  );
}

export default withAdminGuard(AdminDnsCachePage);
