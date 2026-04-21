import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

type ConnectivityResult = {
  serverName: string;
  healthy: boolean;
  responseTime: number | null;
  error: string | null;
};

interface ConnectivityTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverNames: string[];
}

export function ConnectivityTestModal({
  open,
  onOpenChange,
  serverNames,
}: ConnectivityTestModalProps) {
  const trpc = useTRPC();

  const connectivityQuery = useQuery({
    ...trpc.dnsCache.testConnectivity.queryOptions({ serverNames }),
    enabled: open && serverNames.length > 0,
  });

  // Auto-close after 10 seconds if all tests complete successfully
  useEffect(() => {
    if (
      connectivityQuery.isSuccess &&
      connectivityQuery.data?.every((r) => r.healthy)
    ) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [connectivityQuery.isSuccess, connectivityQuery.data, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Server Connectivity Test</DialogTitle>
          <DialogDescription>
            Testing connectivity to {serverNames.length} server
            {serverNames.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {connectivityQuery.isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Testing server connectivity...
              </p>
            </div>
          )}

          {connectivityQuery.isError && (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p className="text-sm text-destructive">
                {connectivityQuery.error.message}
              </p>
            </div>
          )}

          {connectivityQuery.isSuccess && (
            <>
              <div className="space-y-2">
                {connectivityQuery.data.map((result: ConnectivityResult) => (
                  <div
                    key={result.serverName}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      {result.healthy ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{result.serverName}</p>
                        {result.error && (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.healthy && result.responseTime !== null && (
                        <p className="text-sm text-muted-foreground">
                          {result.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {
                    connectivityQuery.data.filter(
                      (r: ConnectivityResult) => r.healthy,
                    ).length
                  }{' '}
                  of {connectivityQuery.data.length} servers healthy
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectivityQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
