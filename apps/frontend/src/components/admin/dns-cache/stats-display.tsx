import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Progress } from '@/components/ui/shadcn/progress';

type CacheStats = {
  success_cache: {
    size: number;
    capacity: number;
  };
  denial_cache: {
    size: number;
    capacity: number;
  };
  prefetch: boolean;
};

interface StatsDisplayProps {
  stats: CacheStats | null;
  isStale?: boolean;
  timestamp?: number;
  error?: string | null;
}

export function StatsDisplay({
  stats,
  isStale = false,
  timestamp,
  error,
}: StatsDisplayProps) {
  if (error && !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div className="text-sm text-muted-foreground">
        No statistics available
      </div>
    );
  }

  const successPercentage =
    (stats.success_cache.size / stats.success_cache.capacity) * 100;
  const denialPercentage =
    (stats.denial_cache.size / stats.denial_cache.capacity) * 100;

  const totalEntries = stats.success_cache.size + stats.denial_cache.size;

  return (
    <div className="space-y-4">
      {isStale && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data may be stale.{' '}
            {timestamp &&
              `Last updated ${new Date(timestamp).toLocaleTimeString()}`}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Success Cache</span>
            <span className="text-muted-foreground">
              {stats.success_cache.size} / {stats.success_cache.capacity}
            </span>
          </div>
          <Progress value={successPercentage} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Denial Cache</span>
            <span className="text-muted-foreground">
              {stats.denial_cache.size} / {stats.denial_cache.capacity}
            </span>
          </div>
          <Progress value={denialPercentage} className="h-2" />
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Entries</span>
            <span>{totalEntries}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="font-medium">Prefetch</span>
            <span>{stats.prefetch ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
