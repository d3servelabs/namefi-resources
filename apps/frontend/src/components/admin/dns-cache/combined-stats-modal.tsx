import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Progress } from '@namefi-astra/ui/components/shadcn/progress';
import { AlertCircle, Server } from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@namefi-astra/ui/components/shadcn/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';

type ServerStats = {
  serverName: string;
  stats: {
    success_cache: { size: number; capacity: number };
    denial_cache: { size: number; capacity: number };
    prefetch: boolean;
  } | null;
  error?: string | null;
  timestamp?: number;
};

interface CombinedStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverStats: ServerStats[];
  isLoading?: boolean;
}

export function CombinedStatsModal({
  open,
  onOpenChange,
  serverStats,
  isLoading = false,
}: CombinedStatsModalProps) {
  // Calculate aggregate stats
  const aggregateStats = serverStats.reduce(
    (acc, server) => {
      if (server.stats) {
        acc.totalSuccess += server.stats.success_cache.size;
        acc.totalSuccessCapacity += server.stats.success_cache.capacity;
        acc.totalDenial += server.stats.denial_cache.size;
        acc.totalDenialCapacity += server.stats.denial_cache.capacity;
        acc.serversWithStats++;
      }
      return acc;
    },
    {
      totalSuccess: 0,
      totalSuccessCapacity: 0,
      totalDenial: 0,
      totalDenialCapacity: 0,
      serversWithStats: 0,
    },
  );

  const totalEntries = aggregateStats.totalSuccess + aggregateStats.totalDenial;
  const avgSuccessPercentage =
    aggregateStats.totalSuccessCapacity > 0
      ? (aggregateStats.totalSuccess / aggregateStats.totalSuccessCapacity) *
        100
      : 0;
  const avgDenialPercentage =
    aggregateStats.totalDenialCapacity > 0
      ? (aggregateStats.totalDenial / aggregateStats.totalDenialCapacity) * 100
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Combined Server Statistics</DialogTitle>
          <DialogDescription>
            Aggregate cache statistics across all selected servers
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading statistics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Aggregate Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aggregate Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Total Success Cache</span>
                    <span className="text-muted-foreground">
                      {aggregateStats.totalSuccess} /{' '}
                      {aggregateStats.totalSuccessCapacity}
                    </span>
                  </div>
                  <Progress value={avgSuccessPercentage} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Total Denial Cache</span>
                    <span className="text-muted-foreground">
                      {aggregateStats.totalDenial} /{' '}
                      {aggregateStats.totalDenialCapacity}
                    </span>
                  </div>
                  <Progress value={avgDenialPercentage} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Entries</span>
                    <span>{totalEntries}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-medium">Servers Reporting</span>
                    <span>
                      {aggregateStats.serversWithStats} / {serverStats.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Per-Server Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Per-Server Breakdown
              </h3>
              <div className="space-y-3">
                {serverStats.map((server) => {
                  const isStale =
                    server.timestamp &&
                    Date.now() - server.timestamp > 5 * 60 * 1000;

                  if (server.error && !server.stats) {
                    return (
                      <Card
                        key={server.serverName}
                        className="border-destructive"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            {server.serverName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{server.error}</AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (!server.stats) {
                    return (
                      <Card key={server.serverName}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            {server.serverName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            No statistics available
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }

                  const successPct =
                    (server.stats.success_cache.size /
                      server.stats.success_cache.capacity) *
                    100;
                  const denialPct =
                    (server.stats.denial_cache.size /
                      server.stats.denial_cache.capacity) *
                    100;

                  return (
                    <Card key={server.serverName}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          {server.serverName}
                          {isStale && (
                            <span className="text-xs text-yellow-600 font-normal">
                              (Stale)
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Success</span>
                            <span className="text-muted-foreground">
                              {server.stats.success_cache.size} /{' '}
                              {server.stats.success_cache.capacity}
                            </span>
                          </div>
                          <Progress value={successPct} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Denial</span>
                            <span className="text-muted-foreground">
                              {server.stats.denial_cache.size} /{' '}
                              {server.stats.denial_cache.capacity}
                            </span>
                          </div>
                          <Progress value={denialPct} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
