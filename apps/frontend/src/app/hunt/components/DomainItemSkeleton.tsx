import { Skeleton } from '@/components/ui/shadcn/skeleton';

export const DomainItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-8">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2 w-full">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
  </div>
);
