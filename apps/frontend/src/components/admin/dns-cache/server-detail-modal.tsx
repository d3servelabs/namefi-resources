import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { RefreshCw, Download, Trash2, ChevronDown } from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StatsDisplay } from './stats-display';
import { CacheEntriesViewer } from './cache-entries-viewer';
import { ConfirmFlushDialog } from './confirm-flush-dialog';

interface ServerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverName: string;
  serverUrl: string;
}

const AUTO_REFRESH_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: '10', label: '10 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
] as const;

export function ServerDetailModal({
  open,
  onOpenChange,
  serverName,
  serverUrl,
}: ServerDetailModalProps) {
  const [autoRefresh, setAutoRefresh] = useState<string>('off');
  const [showCacheEntries, setShowCacheEntries] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cacheFilter, setCacheFilter] = useState<'all' | 'success' | 'denial'>(
    'all',
  );
  const [confirmFlushOpen, setConfirmFlushOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const trpc = useTRPC();

  // Fetch server stats
  const statsQuery = useQuery({
    ...trpc.dnsCache.getServerStats.queryOptions({ serverName }),
    enabled: open,
    refetchInterval: autoRefresh === 'off' ? false : Number(autoRefresh) * 1000,
  });

  // Fetch cache dump
  const dumpQuery = useQuery({
    ...trpc.dnsCache.dumpServerCache.queryOptions({
      serverName,
      page: currentPage,
      limit: 100,
      cacheType: cacheFilter,
    }),
    enabled: open && showCacheEntries,
  });

  // Flush all cache mutation
  const flushAllMutation = useMutation(
    trpc.dnsCache.flushAllOnServer.mutationOptions({
      onSuccess: () => {
        toast.success('Cache Flushed', {
          description: `All cache on ${serverName} has been cleared`,
        });
        statsQuery.refetch();
        if (showCacheEntries) {
          dumpQuery.refetch();
        }
      },
      onError: (error) => {
        toast.error('Flush Failed', {
          description: error.message,
        });
      },
    }),
  );

  // Manual refresh
  const handleManualRefresh = () => {
    statsQuery.refetch();
    if (showCacheEntries) {
      dumpQuery.refetch();
    }
  };

  // Download stats as JSON
  const handleDownloadStats = () => {
    if (!statsQuery.data?.stats) return;
    const json = JSON.stringify(statsQuery.data.stats, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName}-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download cache dump as JSON
  const handleDownloadDump = () => {
    if (!dumpQuery.data) return;
    const json = JSON.stringify(dumpQuery.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName}-dump-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle flush all confirmation
  const handleFlushAll = () => {
    setConfirmFlushOpen(false);
    flushAllMutation.mutate({ serverName });
  };

  // Check if stats are stale (>5 minutes old)
  const isStale =
    statsQuery.data?.timestamp &&
    Date.now() - statsQuery.data.timestamp > 5 * 60 * 1000;

  const stats = statsQuery.data?.stats as any;
  const cacheSize = stats
    ? stats.success_cache.size + stats.denial_cache.size
    : 0;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            MOBILE_BOTTOM_SHEET_DIALOG,
            '!max-w-4xl max-h-[90vh] overflow-y-auto',
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-start gap-2">
              <span>{serverName} Details</span>
            </DialogTitle>
            <DialogDescription>{new URL(serverUrl).hostname}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Cache Statistics</h3>

                <div className="flex items-center gap-2">
                  <Select
                    value={autoRefresh}
                    onValueChange={(value) => {
                      if (!value) return;
                      setAutoRefresh(value);
                    }}
                  >
                    <SelectTrigger className="w-[80px] h-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTO_REFRESH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={statsQuery.isLoading}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${statsQuery.isLoading ? 'animate-spin' : ''}`}
                    />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadStats}
                    disabled={!statsQuery.data?.stats}
                  >
                    <Download className="h-4 w-4 me-2" />
                    JSON
                  </Button>
                </div>
              </div>
              <StatsDisplay
                stats={stats || null}
                isStale={!!isStale}
                timestamp={statsQuery.data?.timestamp}
                error={statsQuery.data?.error || null}
              />
            </div>

            {/* Cache Entries Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Cache Contents</h3>
                <div className="flex gap-2">
                  {showCacheEntries && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="sm" />}
                      >
                        <Download className="h-4 w-4 me-2" />
                        Download
                        <ChevronDown className="h-4 w-4 ms-2" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleDownloadDump}>
                          Download JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowCacheEntries(false)}
                        >
                          Hide Entries
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {!showCacheEntries && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCacheEntries(true)}
                    >
                      View Entries
                    </Button>
                  )}
                </div>
              </div>

              {showCacheEntries && (
                <CacheEntriesViewer
                  data={dumpQuery.data as any}
                  isLoading={dumpQuery.isLoading}
                  onPageChange={setCurrentPage}
                  onFilterChange={setCacheFilter}
                  currentFilter={cacheFilter}
                />
              )}
            </div>

            {/* Flush All Section */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setConfirmFlushOpen(true)}
                disabled={flushAllMutation.isPending}
              >
                <Trash2 className="h-4 w-4 me-2" />
                {flushAllMutation.isPending
                  ? 'Flushing...'
                  : 'Flush All Cache on This Server'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmFlushDialog
        open={confirmFlushOpen}
        onOpenChange={setConfirmFlushOpen}
        onConfirm={handleFlushAll}
        serverNames={[serverName]}
        cacheSize={cacheSize}
        isFlushingAll={true}
      />
    </>
  );
}
