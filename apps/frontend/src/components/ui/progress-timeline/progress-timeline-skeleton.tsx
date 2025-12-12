import { Skeleton } from '@/components/ui/shadcn/skeleton';

interface ProgressTimelineSkeletonProps {
  stepCount?: number;
}

/**
 * Loading skeleton for the progress timeline.
 */
export function ProgressTimelineSkeleton({
  stepCount = 4,
}: ProgressTimelineSkeletonProps) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: stepCount }).map((_, index) => (
          <div
            key={`progress-skeleton-${index}`}
            className="flex items-start gap-3 rounded-lg border border-transparent bg-muted/10 px-3 py-2"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
